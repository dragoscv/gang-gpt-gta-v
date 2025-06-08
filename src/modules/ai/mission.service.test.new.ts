import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissionService, MissionType } from './mission.service';
import { PrismaClient } from '@prisma/client';
import { CacheManager } from '../../infrastructure/cache';
import { AIService } from './ai.service';
import { MemoryService } from './memory.service';
import { WorldService } from '../world/world.service';

// Create proper vi.fn() mocks for all Prisma methods
const createMockPrismaClient = () => ({
  mission: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  character: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  faction: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  missionObjective: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  missionReward: {
    create: vi.fn(),
  },
});

const createMockCache = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  getTemporary: vi.fn(),
  setTemporary: vi.fn(),
});

const createMockAIService = () => ({
  generateNPCDialogue: vi.fn(),
  generateContent: vi.fn(),
});

const createMockWorldService = () => ({
  getCurrentWorldState: vi.fn(),
  getActiveWorldEvents: vi.fn(),
  getLocationNameFromCoordinates: vi.fn(),
});

const createMockMemoryService = () => ({
  getMemoryContext: vi.fn(),
  addMemory: vi.fn(),
  storeInteraction: vi.fn(),
});

// Mock logging
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MissionService', () => {
  let missionService: MissionService;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let mockCache: ReturnType<typeof createMockCache>;
  let mockAIService: ReturnType<typeof createMockAIService>;
  let mockWorldService: ReturnType<typeof createMockWorldService>;
  let mockMemoryService: ReturnType<typeof createMockMemoryService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = createMockPrismaClient();
    mockCache = createMockCache();
    mockAIService = createMockAIService();
    mockWorldService = createMockWorldService();
    mockMemoryService = createMockMemoryService();

    // Set up default mock returns
    mockWorldService.getCurrentWorldState.mockResolvedValue({
      weather: 'clear',
      economicState: { businessActivity: 50 },
      crimeLevel: 30,
      activePlayers: 100,
      factionWars: [],
    });

    mockWorldService.getActiveWorldEvents.mockResolvedValue([]);
    mockWorldService.getLocationNameFromCoordinates.mockReturnValue(
      'Los Santos'
    );

    mockMemoryService.getMemoryContext.mockResolvedValue({
      recentMemories: [],
      emotionalState: 'neutral',
    });

    mockCache.getTemporary.mockResolvedValue(null);

    missionService = new MissionService(
      mockPrisma as unknown as PrismaClient,
      mockCache as unknown as CacheManager,
      mockAIService as unknown as AIService,
      mockWorldService as unknown as WorldService,
      mockMemoryService as unknown as MemoryService
    );
  });

  describe('generateMission', () => {
    it('should generate a mission successfully', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'TestPlayer',
        characters: [
          {
            id: 'char-1',
            level: 5,
            experiencePoints: 1000,
            reputation: 75,
            factionId: 'faction-1',
          },
        ],
      };

      const mockAIResponse = {
        content: JSON.stringify({
          title: 'Heist Mission',
          description: 'Rob the bank downtown',
          objectives: [
            'Case the target location',
            'Acquire necessary equipment',
            'Execute the heist plan',
          ],
          rewards: ['$5000 cash', '200 experience points'],
          difficulty: 3,
          estimatedDuration: 45,
          location: 'Downtown Bank',
          missionType: 'HEIST',
        }),
        timestamp: new Date(),
        characterId: 'mission-generator',
      };

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock AI response
      mockAIService.generateNPCDialogue.mockResolvedValue(mockAIResponse);

      // Mock mission creation
      mockPrisma.mission.create.mockResolvedValue({
        id: 'mission-1',
        title: 'Heist Mission',
        characterId: 'char-1',
        type: 'HEIST',
        status: 'AVAILABLE',
      });

      const result = await missionService.generateMission(
        'user-1',
        MissionType.HEIST
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Heist Mission');
      expect(result.description).toContain('Rob the bank');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { characters: true },
      });
    });

    it('should throw error if player not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        missionService.generateMission('non-existent-player', MissionType.HEIST)
      ).rejects.toThrow('Player not found: non-existent-player');
    });
  });

  describe('getMissionsByPlayer', () => {
    it('should return missions for a player', async () => {
      const mockUser = {
        id: 'user-1',
        characters: [{ id: 'char-1' }],
      };

      const mockMissions = [
        {
          id: 'mission-1',
          title: 'Test Mission 1',
          type: 'DELIVERY',
          status: 'AVAILABLE',
          characterId: 'char-1',
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.mission.findMany.mockResolvedValue(mockMissions);

      const result = await missionService.getMissionsByPlayer('user-1');

      expect(result).toEqual(mockMissions);
      expect(mockPrisma.mission.findMany).toHaveBeenCalled();
    });
  });

  describe('getMissionStatistics', () => {
    it('should return mission statistics', async () => {
      const mockUser = {
        id: 'user-1',
        characters: [{ id: 'char-1' }],
      };

      const mockCompletedMissions = [
        { id: 'mission-1', type: 'DELIVERY', status: 'COMPLETED' },
        { id: 'mission-2', type: 'HEIST', status: 'COMPLETED' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.mission.findMany.mockResolvedValue(mockCompletedMissions);

      const result = await missionService.getMissionStatistics('user-1');

      expect(result).toBeDefined();
      expect(result.totalCompleted).toBe(2);
      expect(result.missionsByType).toBeDefined();
    });
  });
});

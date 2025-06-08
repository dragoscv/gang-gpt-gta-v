import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AICompanionService } from './ai-companion.service';
import { PrismaClient } from '@prisma/client';
import { CacheManager } from '../../infrastructure/cache';
import { AIService } from './ai.service';

// Mock dependencies
const mockPrisma = {
  nPC: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  nPCRelationship: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  nPCMemory: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
} as unknown as PrismaClient;

const mockCache = {
  getTemporary: vi.fn(),
  setTemporary: vi.fn(),
  deleteKey: vi.fn(),
} as unknown as CacheManager;

const mockAIService = {
  generateNPCDialogue: vi.fn(),
  isHealthy: vi.fn(),
} as unknown as AIService;

describe('AICompanionService', () => {
  let service: AICompanionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AICompanionService(mockPrisma, mockCache, mockAIService);
  });

  describe('generateDialogue', () => {
    it('should generate dialogue with emotional context', async () => {
      // Mock companion data
      const mockCompanion = {
        id: 'companion-1',
        name: 'Test Companion',
        type: 'friendly',
        personality: {
          traits: ['friendly', 'talkative'],
          speakingStyle: 'casual',
          interests: ['games'],
          loyalties: ['player'],
        },
        currentMood: 'happy',
        aggression: 20,
        intelligence: 80,
        loyalty: 90,
        sociability: 70,
      };

      const mockRelationship = {
        playerId: 'player-1',
        npcId: 'companion-1',
        relationshipValue: 75,
      };

      const mockMemories = [
        {
          content: 'Previous conversation about games',
          importance: 8,
          emotionalContext: 'positive',
        },
      ]; // Setup mocks
      vi.mocked(mockPrisma.nPC.findUnique).mockResolvedValue(
        mockCompanion as any
      );
      vi.mocked(mockPrisma.nPCRelationship.findUnique).mockResolvedValue(
        mockRelationship as any
      );
      vi.mocked(mockPrisma.nPCMemory.findMany).mockResolvedValue(
        mockMemories as any
      );
      vi.mocked(mockAIService.generateNPCDialogue).mockResolvedValue({
        content: 'Hello there! Nice to see you again!',
        emotionalState: 'excited',
        confidence: 0.9,
      } as any);

      const result = await service.generateDialogue(
        'companion-1',
        'player-1',
        'Hello, how are you?',
        {
          location: 'park',
          situation: 'casual meeting',
          mood: 'friendly',
        }
      );

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('emotionalState');
      expect(result).toHaveProperty('memoryUpdates');
      expect(result).toHaveProperty('relationshipChange');
      expect(mockAIService.generateNPCDialogue).toHaveBeenCalled();
    });
    it('should handle missing companion gracefully', async () => {
      vi.mocked(mockPrisma.nPC.findUnique).mockResolvedValue(null);
      const result = await service.generateDialogue(
        'nonexistent',
        'player-1',
        'Hello',
        {}
      );
      expect(result).toHaveProperty('response');
      expect(result.response).toBeTruthy();
      expect(result).toHaveProperty('emotionalState', 'confused');
      expect(result).toHaveProperty('memoryUpdates', []);
      expect(result).toHaveProperty('relationshipChange', 0);
    });
  });
  describe('createCompanion', () => {
    it('should create a new companion with proper data structure', async () => {
      const companionData = {
        name: 'Test NPC',
        personality: {
          traits: ['honest', 'business-minded'],
          speakingStyle: 'formal',
          interests: ['trade', 'money'],
          loyalties: ['merchants_guild'],
        },
        appearance: 'Tall and well-dressed',
        skills: ['negotiation', 'trading'],
        location: { x: 100, y: 200, z: 0 },
        factionId: 'faction-1',
        aiPersonality: {
          traits: ['honest', 'business-minded'],
          speakingStyle: 'formal',
          interests: ['trade', 'money'],
          loyalties: ['merchants_guild'],
        },
      };

      const mockCreatedCompanion = {
        id: 'new-companion-id',
        name: companionData.name,
        type: 'COMPANION',
        personality: companionData.personality,
        positionX: 100,
        positionY: 200,
        positionZ: 0,
        factionId: 'faction-1',
        isActive: true,
        currentMood: 'neutral',
        aggression: 0.3,
        intelligence: 0.8,
        loyalty: 0.5,
        sociability: 0.7,
        lastInteraction: new Date(),
      };

      vi.mocked(mockPrisma.nPC.create).mockResolvedValue(
        mockCreatedCompanion as any
      );

      const result = await service.createCompanion(companionData);

      expect(result).toBe('new-companion-id');
      expect(mockPrisma.nPC.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: companionData.name,
          type: 'COMPANION',
          personality: companionData.personality,
          positionX: 100,
          positionY: 200,
          positionZ: 0,
          isActive: true,
          currentMood: 'neutral',
        }),
      });
    });
  });

  describe('updateEmotionalState', () => {
    it('should update companion emotional state', async () => {
      const companionId = 'companion-1';
      const emotion = 'angry';
      const intensity = 0.8;
      const trigger = 'Player insulted companion';

      const mockCompanion = {
        id: 'companion-1',
        name: 'Test Companion',
        type: 'friendly',
        personality: {
          traits: ['friendly', 'talkative'],
          speakingStyle: 'casual',
          interests: ['games'],
          loyalties: ['player'],
        },
        currentMood: 'happy',
        aggression: 20,
        intelligence: 80,
        loyalty: 90,
        sociability: 70,
      };

      vi.mocked(mockPrisma.nPC.findUnique).mockResolvedValue(
        mockCompanion as any
      );
      vi.mocked(mockPrisma.nPC.update).mockResolvedValue(mockCompanion as any);

      await service.updateEmotionalState(
        companionId,
        emotion,
        intensity,
        trigger
      );
      expect(mockPrisma.nPC.update).toHaveBeenCalledWith({
        where: { id: companionId },
        data: expect.objectContaining({
          personality: expect.any(String),
          currentMood: emotion,
          lastInteraction: expect.any(Date),
        }),
      });
    });
  });

  describe('getActiveCompanions', () => {
    it('should return active companions in a location', async () => {
      const mockCompanions = [
        {
          id: 'companion-1',
          name: 'Guard 1',
          isActive: true,
          positionX: 100,
          positionY: 200,
          positionZ: 0,
          type: 'COMPANION',
          personality: {},
          currentMood: 'neutral',
          aggression: 0.3,
          intelligence: 0.8,
          loyalty: 0.5,
          sociability: 0.7,
          factionId: null,
          lastInteraction: new Date(),
        },
        {
          id: 'companion-2',
          name: 'Merchant 1',
          isActive: true,
          positionX: 150,
          positionY: 250,
          positionZ: 0,
          type: 'COMPANION',
          personality: {},
          currentMood: 'neutral',
          aggression: 0.2,
          intelligence: 0.9,
          loyalty: 0.6,
          sociability: 0.8,
          factionId: null,
          lastInteraction: new Date(),
        },
      ];

      vi.mocked(mockPrisma.nPC.findMany).mockResolvedValue(
        mockCompanions as any
      );

      const result = await service.getActiveCompanions('downtown');

      expect(result).toEqual(mockCompanions);
      expect(mockPrisma.nPC.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          type: 'COMPANION',
        },
        include: {
          faction: true,
        },
        orderBy: {
          lastInteraction: 'desc',
        },
      });
    });

    it('should return empty array when no companions found', async () => {
      vi.mocked(mockPrisma.nPC.findMany).mockResolvedValue([]);

      const result = await service.getActiveCompanions('empty-location');

      expect(result).toEqual([]);
    });
  });

  describe('simulateCompanionBehavior', () => {
    it('should simulate companion behavior without errors', async () => {
      const companionId = 'companion-1';

      const mockCompanion = {
        id: companionId,
        personality: {
          traits: ['curious'],
          emotionalState: 'content',
        },
        currentMood: 'happy',
      };

      vi.mocked(mockPrisma.nPC.findUnique).mockResolvedValue(
        mockCompanion as any
      );
      vi.mocked(mockPrisma.nPC.update).mockResolvedValue(mockCompanion as any);

      // Should not throw an error
      await expect(
        service.simulateCompanionBehavior(companionId)
      ).resolves.not.toThrow();
      expect(mockPrisma.nPC.findUnique).toHaveBeenCalledWith({
        where: { id: companionId },
        include: {
          faction: true,
        },
      });
    });

    it('should handle missing companion in simulation', async () => {
      vi.mocked(mockPrisma.nPC.findUnique).mockResolvedValue(null);

      await expect(
        service.simulateCompanionBehavior('nonexistent')
      ).resolves.not.toThrow();
    });
  });
  describe('caching behavior', () => {
    it('should use cache for companion data', async () => {
      const companionId = 'companion-1';

      const mockCachedCompanion = {
        id: companionId,
        name: 'Cached Companion',
        type: 'friendly',
        personality: {
          traits: ['friendly'],
          speakingStyle: 'casual',
          interests: [],
          loyalties: [],
        },
        currentMood: 'happy',
        position: { x: 0, y: 0, z: 0 },
        aggression: 0.2,
        intelligence: 0.8,
        loyalty: 0.9,
        sociability: 0.7,
      };

      // Mock cache to return data (so database won't be called)
      vi.mocked(mockCache.getTemporary).mockResolvedValue(mockCachedCompanion);

      // Mock other dependencies for generateDialogue
      vi.mocked(mockPrisma.nPCRelationship.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.nPCMemory.findMany).mockResolvedValue([]);
      vi.mocked(mockAIService.generateNPCDialogue).mockResolvedValue({
        content: 'Test response',
        emotionalState: 'neutral',
        confidence: 0.8,
      } as any);

      await service.generateDialogue(companionId, 'player-1', 'test', {});

      // Verify cache was used instead of database
      expect(mockCache.getTemporary).toHaveBeenCalledWith(
        `companion:${companionId}`
      );
      expect(mockPrisma.nPC.findUnique).not.toHaveBeenCalled();
    });
  });
});

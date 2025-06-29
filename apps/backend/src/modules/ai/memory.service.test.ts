import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryService } from './memory.service';
import { PrismaClient } from '@prisma/client';

// Mock Cache Manager interface
interface MockCacheManager {
  getAIMemory: (key: string) => Promise<any>;
  setAIMemory: (key: string, value: any, ttl: number) => Promise<void>;
  deleteAIMemory: (key: string) => Promise<void>;
}

// Mock Prisma Client
const mockPrisma = {
  nPCMemory: {
    create: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  nPCRelationship: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  nPC: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock Cache Manager
const mockCache = {
  getAIMemory: vi.fn(),
  setAIMemory: vi.fn(),
  deleteAIMemory: vi.fn(),
} as unknown as MockCacheManager;

describe('MemoryService', () => {
  let memoryService: MemoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryService = new MemoryService(mockPrisma, mockCache as any);
  });

  describe('addMemory', () => {
    it('should add memory successfully', async () => {
      (mockPrisma.nPCMemory.create as any).mockResolvedValue({});

      await memoryService.addMemory(
        'npc-1',
        'Test memory content',
        'happy',
        8,
        'CONVERSATION',
        'player-1'
      );

      expect(mockPrisma.nPCMemory.create).toHaveBeenCalledWith({
        data: {
          npcId: 'npc-1',
          playerId: 'player-1',
          memoryType: 'CONVERSATION',
          content: 'Test memory content',
          emotionalContext: 'happy',
          importance: 8,
          decayFactor: 1.0,
        },
      });

      expect(mockCache.deleteAIMemory).toHaveBeenCalledWith('npc-1');
    });

    it('should clamp importance to valid range', async () => {
      (mockPrisma.nPCMemory.create as any).mockResolvedValue({});

      await memoryService.addMemory(
        'npc-1',
        'Test memory',
        'neutral',
        15, // Over max
        'GENERAL'
      );

      expect(mockPrisma.nPCMemory.create).toHaveBeenCalledWith({
        data: {
          npcId: 'npc-1',
          playerId: null,
          memoryType: 'GENERAL',
          content: 'Test memory',
          emotionalContext: 'neutral',
          importance: 10, // Capped at 10
          decayFactor: 1.0,
        },
      });
    });

    it('should handle memory creation failure gracefully', async () => {
      (mockPrisma.nPCMemory.create as any).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw - error is logged internally
      await memoryService.addMemory(
        'npc-1',
        'Test memory',
        'neutral',
        5,
        'GENERAL'
      );

      expect(mockPrisma.nPCMemory.create).toHaveBeenCalled();
    });
  });

  describe('getMemoryContext', () => {
    it('should return cached context when available', async () => {
      const cachedContext = {
        recentMemories: [],
        relationships: [],
        emotionalState: { dominantEmotion: 'neutral', intensity: 0 },
        personalityTraits: { openness: 0.5 },
      };

      (mockCache.getAIMemory as any).mockResolvedValue(cachedContext);

      const result = await memoryService.getMemoryContext('npc-1');

      expect(result).toEqual(cachedContext);
      expect(mockCache.getAIMemory).toHaveBeenCalledWith('npc-1');
      expect(mockPrisma.nPCMemory.findMany).not.toHaveBeenCalled();
    });

    it('should build context from database when not cached', async () => {
      const mockMemories = [
        {
          id: 'memory-1',
          content: 'Test memory',
          emotionalContext: 'happy',
          importance: 8,
          createdAt: new Date(),
          decayFactor: 1.0,
          playerId: 'player-1',
        },
      ];

      const mockRelationships = [
        {
          npcId: 'npc-1',
          targetId: 'player-1',
          targetType: 'PLAYER',
          trust: 0.8,
          respect: 0.7,
          fear: 0.1,
          loyalty: 0.6,
          lastInteraction: new Date(),
          player: { username: 'TestPlayer' },
        },
      ];

      const mockCharacter = {
        id: 'npc-1',
        personality: {
          emotionalState: { dominantEmotion: 'happy', intensity: 0.7 },
          traits: { openness: 0.8, conscientiousness: 0.6 },
        },
      };

      (mockCache.getAIMemory as any).mockResolvedValue(null);
      (mockPrisma.nPCMemory.findMany as any).mockResolvedValue(mockMemories);
      (mockPrisma.nPCRelationship.findMany as any).mockResolvedValue(
        mockRelationships
      );
      (mockPrisma.nPC.findUnique as any).mockResolvedValue(mockCharacter);

      const result = await memoryService.getMemoryContext('npc-1');

      expect(result.recentMemories).toHaveLength(1);
      expect(result.recentMemories[0].content).toBe('Test memory');
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].trust).toBe(0.8);
      expect(result.emotionalState.dominantEmotion).toBe('happy');

      expect(mockCache.setAIMemory).toHaveBeenCalledWith('npc-1', result, 3600);
    });

    it('should return default context on error', async () => {
      (mockCache.getAIMemory as any).mockResolvedValue(null);
      (mockPrisma.nPCMemory.findMany as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await memoryService.getMemoryContext('npc-1');

      expect(result.recentMemories).toEqual([]);
      expect(result.relationships).toEqual([]);
      expect(result.emotionalState.dominantEmotion).toBe('neutral');
    });
  });

  describe('updateRelationship', () => {
    it('should update existing relationship', async () => {
      (mockPrisma.nPCRelationship.upsert as any).mockResolvedValue({});

      await memoryService.updateRelationship('npc-1', 'player-1', {
        trust: 0.8,
        respect: 0.7,
      });

      expect(mockPrisma.nPCRelationship.upsert).toHaveBeenCalledWith({
        where: {
          npcId_targetId_targetType: {
            npcId: 'npc-1',
            targetId: 'player-1',
            targetType: 'PLAYER',
          },
        },
        update: {
          lastInteraction: expect.any(Date),
          trust: 0.8,
          respect: 0.7,
        },
        create: {
          npcId: 'npc-1',
          targetId: 'player-1',
          targetType: 'PLAYER',
          relationshipType: 'ACQUAINTANCE',
          trust: 0.8,
          respect: 0.7,
          fear: 0,
          loyalty: 0,
          lastInteraction: expect.any(Date),
        },
      });

      expect(mockCache.deleteAIMemory).toHaveBeenCalledWith('npc-1');
    });

    it('should clamp relationship values to valid range', async () => {
      (mockPrisma.nPCRelationship.upsert as any).mockResolvedValue({});

      await memoryService.updateRelationship('npc-1', 'player-1', {
        trust: 1.5, // Over max
        fear: -1.5, // Under min
      });

      expect(mockPrisma.nPCRelationship.upsert).toHaveBeenCalledWith({
        where: {
          npcId_targetId_targetType: {
            npcId: 'npc-1',
            targetId: 'player-1',
            targetType: 'PLAYER',
          },
        },
        update: {
          lastInteraction: expect.any(Date),
          trust: 1, // Clamped to max
          fear: -1, // Clamped to min
        },
        create: {
          npcId: 'npc-1',
          targetId: 'player-1',
          targetType: 'PLAYER',
          relationshipType: 'ACQUAINTANCE',
          trust: 1,
          respect: 0,
          fear: -1,
          loyalty: 0,
          lastInteraction: expect.any(Date),
        },
      });
    });

    it('should handle relationship update failure gracefully', async () => {
      (mockPrisma.nPCRelationship.upsert as any).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw - error is logged internally
      await memoryService.updateRelationship('npc-1', 'player-1', {
        trust: 0.5,
      });

      expect(mockPrisma.nPCRelationship.upsert).toHaveBeenCalled();
    });
  });

  describe('applyMemoryDecay', () => {
    it('should apply decay to old memories', async () => {
      const mockOldMemories = [
        {
          id: 'memory-1',
          decayFactor: 0.5,
        },
        {
          id: 'memory-2',
          decayFactor: 0.05, // Will be deleted
        },
      ];

      (mockPrisma.nPCMemory.findMany as any).mockResolvedValue(mockOldMemories);
      (mockPrisma.nPCMemory.delete as any).mockResolvedValue({});
      (mockPrisma.nPCMemory.update as any).mockResolvedValue({});

      await memoryService.applyMemoryDecay();

      // Should delete very weak memory
      expect(mockPrisma.nPCMemory.delete).toHaveBeenCalledWith({
        where: { id: 'memory-2' },
      });

      // Should update stronger memory
      expect(mockPrisma.nPCMemory.update).toHaveBeenCalledWith({
        where: { id: 'memory-1' },
        data: { decayFactor: expect.any(Number) },
      });
    });

    it('should handle decay errors gracefully', async () => {
      (mockPrisma.nPCMemory.findMany as any).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw - error is logged internally
      await memoryService.applyMemoryDecay();

      expect(mockPrisma.nPCMemory.findMany).toHaveBeenCalled();
    });
  });
});

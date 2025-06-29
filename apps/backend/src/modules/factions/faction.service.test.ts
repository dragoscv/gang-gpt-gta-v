import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { FactionService } from './faction.service';

// Define enums to match service
enum FactionType {
  GANG = 'GANG',
  MAFIA = 'MAFIA',
  CARTEL = 'CARTEL',
  BIKER_CLUB = 'BIKER_CLUB',
  CORPORATION = 'CORPORATION',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  GOVERNMENT = 'GOVERNMENT',
  CIVILIAN = 'CIVILIAN',
}

enum FactionRank {
  RECRUIT = 'RECRUIT',
  MEMBER = 'MEMBER',
  VETERAN = 'VETERAN',
  LIEUTENANT = 'LIEUTENANT',
  CAPTAIN = 'CAPTAIN',
  UNDERBOSS = 'UNDERBOSS',
  LEADER = 'LEADER',
}

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    faction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    factionMembership: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    factionEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  })),
}));

// Mock logger
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AI service
vi.mock('../ai', () => ({
  aiService: {
    generateAIDecision: vi.fn(),
  },
}));

describe('FactionService', () => {
  let factionService: FactionService;
  let mockPrisma: any;
  beforeEach(() => {
    mockPrisma = {
      faction: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      factionMembership: {
        create: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
      factionEvent: {
        create: vi.fn(),
      },
    } as any;

    factionService = new FactionService(mockPrisma);
  });

  describe('createFaction', () => {
    it('should create a faction successfully', async () => {
      const mockFaction = {
        id: 'faction-1',
        name: 'Test Gang',
        type: FactionType.GANG,
        description: 'A test gang',
        influence: 50,
        territory: null,
        color: '#FF0000',
        isActive: true,
        leaderId: 'leader-1',
        aiPersonality: 'aggressive',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.faction.create.mockResolvedValue(mockFaction);
      mockPrisma.factionMembership.create.mockResolvedValue({
        id: 'membership-1',
        characterId: 'leader-1',
        factionId: 'faction-1',
        rank: 'LEADER',
        joinedAt: new Date(),
        isActive: true,
      });
      const result = await factionService.createFaction({
        name: 'Test Gang',
        type: FactionType.GANG,
        description: 'A test gang',
        leaderId: 'leader-1',
        color: '#FF0000',
      });

      expect(result).toEqual(mockFaction);
      expect(mockPrisma.faction.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Gang',
          description: 'A test gang',
          type: 'GANG',
          color: '#FF0000',
          leaderId: 'leader-1',
          territory: '{}',
          aiPersonality: expect.any(String),
        },
      });
    });
    it('should handle faction creation error', async () => {
      mockPrisma.faction.create.mockRejectedValue(new Error('Database error'));

      await expect(
        factionService.createFaction({
          name: 'Test Gang',
          type: FactionType.GANG,
          description: 'A test gang',
          leaderId: 'leader-1',
          color: '#FF0000',
        })
      ).rejects.toThrow('Database error');
    });
  });
  describe('addMemberToFaction', () => {
    it('should add a member to faction successfully', async () => {
      const mockMembership = {
        id: 'membership-1',
        characterId: 'char-1',
        factionId: 'faction-1',
        rank: 'MEMBER',
        joinedAt: new Date(),
        isActive: true,
      };

      mockPrisma.factionMembership.findFirst.mockResolvedValue(null);
      mockPrisma.factionMembership.create.mockResolvedValue(mockMembership);
      mockPrisma.factionEvent.create.mockResolvedValue({});

      const result = await factionService.addMemberToFaction(
        'char-1',
        'faction-1',
        FactionRank.MEMBER
      );

      expect(result.success).toBe(true);
      expect(result.membership).toEqual(mockMembership);
      expect(mockPrisma.factionMembership.create).toHaveBeenCalledWith({
        data: {
          characterId: 'char-1',
          factionId: 'faction-1',
          rank: 'MEMBER',
        },
      });
    });

    it('should handle existing membership', async () => {
      mockPrisma.factionMembership.findFirst.mockResolvedValue({
        id: 'existing-membership',
        isActive: true,
      });

      const result = await factionService.addMemberToFaction(
        'char-1',
        'faction-1',
        FactionRank.MEMBER
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Character is already in a faction');
    });
  });

  describe('removeMemberFromFaction', () => {
    it('should remove member from faction successfully', async () => {
      mockPrisma.factionMembership.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        factionService.removeMemberFromFaction('char-1', 'faction-1')
      ).resolves.not.toThrow();

      expect(mockPrisma.factionMembership.updateMany).toHaveBeenCalledWith({
        where: {
          characterId: 'char-1',
          factionId: 'faction-1',
        },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('getAllFactions', () => {
    it('should return all active factions', async () => {
      const mockFactions = [
        {
          id: 'faction-1',
          name: 'Gang 1',
          members: [],
        },
        {
          id: 'faction-2',
          name: 'Gang 2',
          members: [],
        },
      ];

      mockPrisma.faction.findMany.mockResolvedValue(mockFactions);

      const result = await factionService.getAllFactions();

      expect(result).toEqual(mockFactions);
      expect(mockPrisma.faction.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          members: {
            where: { isActive: true },
            include: {
              character: true,
            },
          },
        },
      });
    });
  });

  describe('getFactionById', () => {
    it('should return faction by id', async () => {
      const mockFaction = {
        id: 'faction-1',
        name: 'Test Gang',
        members: [],
        events: [],
        wars: [],
        targetWars: [],
      };

      mockPrisma.faction.findUnique.mockResolvedValue(mockFaction);

      const result = await factionService.getFactionById('faction-1');

      expect(result).toEqual(mockFaction);
      expect(mockPrisma.faction.findUnique).toHaveBeenCalledWith({
        where: { id: 'faction-1' },
        include: {
          members: {
            where: { isActive: true },
            include: {
              character: {
                include: {
                  user: true,
                },
              },
            },
          },
          events: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          wars: true,
          targetWars: true,
        },
      });
    });

    it('should return null for non-existent faction', async () => {
      mockPrisma.faction.findUnique.mockResolvedValue(null);

      const result = await factionService.getFactionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateFactionInfluence', () => {
    it('should update faction influence successfully', async () => {
      const mockUpdatedFaction = {
        id: 'faction-1',
        name: 'Test Gang',
        influence: 60,
        description: null,
        type: 'GANG',
        territory: null,
        color: '#FF0000',
        isActive: true,
        leaderId: 'leader-1',
        aiPersonality: 'aggressive',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.faction.update.mockResolvedValue(mockUpdatedFaction);

      const result = await factionService.updateFactionInfluence(
        'faction-1',
        10
      );

      expect(result).toEqual(mockUpdatedFaction);
      expect(mockPrisma.faction.update).toHaveBeenCalledWith({
        where: { id: 'faction-1' },
        data: {
          influence: {
            increment: 10,
          },
        },
      });
    });
  });
});

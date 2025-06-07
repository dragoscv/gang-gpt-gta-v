import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerService } from '../../modules/players/player.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from '../../config';

// Mock Prisma Client
const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  character: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('PlayerService', () => {
  let playerService: PlayerService;

  beforeEach(() => {
    playerService = new PlayerService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('registerPlayer', () => {
    it('should register a new player successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue(null);
      (bcrypt.hash as any) = vi.fn().mockResolvedValue(hashedPassword);
      mockPrisma.user.create = vi.fn().mockResolvedValue(mockUser);

      const result = await playerService.registerPlayer(userData);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        registeredAt: mockUser.createdAt,
      });      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, config.security.bcryptRounds);      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue({ id: 'existing-user' });      await expect(playerService.registerPlayer(userData)).rejects.toThrow(
        'User already exists with this username or email'
      );
    });
  });

  describe('createCharacter', () => {
    it('should create a new character successfully', async () => {
      const characterData = {
        name: 'John Doe',
        userId: 'user-id',
      };

      const mockCharacter = {
        id: 'character-id',
        name: 'John Doe',
        userId: 'user-id',
        health: 100,
        armor: 0,
        money: 1000,
        bank: 5000,
        level: 1,
        experience: 0,
      };

      mockPrisma.character.create = vi.fn().mockResolvedValue(mockCharacter);

      const result = await playerService.createCharacter(characterData);

      expect(result).toEqual(mockCharacter);      expect(mockPrisma.character.create).toHaveBeenCalledWith({
        data: {
          name: characterData.name,
          userId: characterData.userId,
        },
      });
    });
  });

  describe('updateCharacter', () => {
    it('should update character data successfully', async () => {
      const characterId = 'character-id';
      const updateData = {
        health: 80,
        money: 1500,
        level: 2,
      };

      const mockUpdatedCharacter = {
        id: characterId,
        health: 80,
        money: 1500,
        level: 2,
      };

      mockPrisma.character.update = vi.fn().mockResolvedValue(mockUpdatedCharacter);

      const result = await playerService.updateCharacter(characterId, updateData);

      expect(result).toEqual(mockUpdatedCharacter);      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: characterId },
        data: expect.objectContaining({
          ...updateData,
          lastSeen: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
    });
  });
  describe('getPlayerCharacters', () => {
    it('should return all characters for a user', async () => {
      const userId = 'user-id';
      const mockCharacters = [
        { id: 'char1', name: 'Character 1', userId },
        { id: 'char2', name: 'Character 2', userId },
      ];

      mockPrisma.character.findMany = vi.fn().mockResolvedValue(mockCharacters);

      const result = await playerService.getPlayerCharacters(userId);

      expect(result).toEqual(mockCharacters);
      expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        include: {
          factionMembership: {
            include: {
              faction: true,
            },
          },
        },
      });
    });
  });
});

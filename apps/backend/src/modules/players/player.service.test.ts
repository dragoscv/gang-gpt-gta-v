import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerService } from '../../modules/players/player.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

// Mock Prisma Client
const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  character: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
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

// Mock jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
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
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: userData.username }, { email: userData.email }],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        userData.password,
        config.security.bcryptRounds
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
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

      mockPrisma.user.findFirst = vi
        .fn()
        .mockResolvedValue({ id: 'existing-user' });
      await expect(playerService.registerPlayer(userData)).rejects.toThrow(
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

      expect(result).toEqual(mockCharacter);
      expect(mockPrisma.character.create).toHaveBeenCalledWith({
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

      mockPrisma.character.update = vi
        .fn()
        .mockResolvedValue(mockUpdatedCharacter);

      const result = await playerService.updateCharacter(
        characterId,
        updateData
      );

      expect(result).toEqual(mockUpdatedCharacter);
      expect(mockPrisma.character.update).toHaveBeenCalledWith({
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
  describe('authenticatePlayer', () => {
    it('should authenticate a player successfully', async () => {
      const username = 'testuser';
      const password = 'password123';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isBanned: false,
      };

      const mockToken = 'jwt_token';

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = vi.fn().mockResolvedValue({});
      (bcrypt.compare as any) = vi.fn().mockResolvedValue(true);
      (jwt.sign as any) = vi.fn().mockReturnValue(mockToken);

      const result = await playerService.authenticatePlayer(username, password);

      expect(result).toEqual({
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          lastLogin: expect.any(Date),
        },
      });
    });

    it('should throw error if user not found', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue(null);

      await expect(
        playerService.authenticatePlayer(username, password)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: 'hashed_password',
        isBanned: false,
      };

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as any) = vi.fn().mockResolvedValue(false);

      await expect(
        playerService.authenticatePlayer(username, password)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is banned', async () => {
      const username = 'testuser';
      const password = 'password123';

      mockPrisma.user.findFirst = vi.fn().mockResolvedValue(null); // Banned users are filtered out

      await expect(
        playerService.authenticatePlayer(username, password)
      ).rejects.toThrow('Invalid credentials');
    });
  });
  describe('getCharacterById', () => {
    it('should return character by id', async () => {
      const characterId = 'character-id';
      const mockCharacter = {
        id: characterId,
        name: 'John Doe',
        userId: 'user-id',
        health: 100,
        level: 5,
      };

      mockPrisma.character.findFirst = vi.fn().mockResolvedValue(mockCharacter);

      const result = await playerService.getCharacterById(characterId);

      expect(result).toEqual(mockCharacter);
      expect(mockPrisma.character.findFirst).toHaveBeenCalledWith({
        where: {
          id: characterId,
          deletedAt: null,
        },
        include: {
          factionMembership: {
            include: {
              faction: true,
            },
          },
          aiCompanions: true,
          user: true,
        },
      });
    });

    it('should return null if character not found', async () => {
      const characterId = 'non-existent';

      mockPrisma.character.findFirst = vi.fn().mockResolvedValue(null);

      const result = await playerService.getCharacterById(characterId);

      expect(result).toBeNull();
    });
  });
  describe('getPlayerStatistics', () => {
    it('should return player statistics', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        characters: [
          {
            id: 'char1',
            money: 1000,
            bank: 5000,
            level: 5,
            experience: 500,
          },
          {
            id: 'char2',
            money: 2000,
            bank: 3000,
            level: 3,
            experience: 300,
          },
        ],
      };

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);

      const result = await playerService.getPlayerStatistics(userId);

      expect(result.user.id).toBe(userId);
      expect(result.user.username).toBe('testuser');
      expect(result.user.totalCharacters).toBe(2);
      expect(result.statistics.totalMoney).toBe(3000); // 1000+2000 (money only, not bank)
      expect(result.statistics.highestLevel).toBe(5);
      expect(result.statistics.totalExperience).toBe(800); // 500+300
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent';

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null);

      await expect(playerService.getPlayerStatistics(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getTotalPlayers', () => {
    it('should return total number of players', async () => {
      const totalCount = 42;

      mockPrisma.user.count = vi.fn().mockResolvedValue(totalCount);

      const result = await playerService.getTotalPlayers();

      expect(result).toBe(totalCount);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          deletedAt: null,
        },
      });
    });
  });
  describe('deleteCharacter', () => {
    it('should soft delete a character', async () => {
      const characterId = 'character-id';

      mockPrisma.character.update = vi.fn().mockResolvedValue({});

      await playerService.deleteCharacter(characterId);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: characterId },
        data: {
          deletedAt: expect.any(Date),
          isOnline: false,
        },
      });
    });
  });
});

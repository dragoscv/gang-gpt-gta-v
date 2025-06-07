import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../infrastructure/logging';
import { config } from '../../config';

interface RegisterPlayerData {
  username: string;
  email: string;
  password: string;
}

interface RegisterPlayerResponse {
  id: string;
  username: string;
  email: string;
  registeredAt: Date;
}

interface CreateCharacterData {
  name: string;
  userId: string;
}

interface UpdateCharacterData {
  health?: number;
  armor?: number;
  money?: number;
  bank?: number;
  level?: number;
  experience?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
}

export class PlayerService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async registerPlayer(data: RegisterPlayerData): Promise<RegisterPlayerResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ username: data.username }, { email: data.email }],
        },
      });

      if (existingUser) {
        throw new Error('User already exists with this username or email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        data.password,
        config.security.bcryptRounds
      );

      // Create user
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash: hashedPassword,
        },
      });

      logger.info('Player registered successfully', {
        userId: user.id,
        username: user.username,
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        registeredAt: user.createdAt,
      };
    } catch (error) {
      logger.error('Failed to register player', {
        error: error instanceof Error ? error.message : 'Unknown error',
        username: data.username,
      });
      throw error;
    }
  }

  async authenticatePlayer(username: string, password: string) {
    try {
      // Find user by username or email
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username }],
          isBanned: false,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
        },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      );

      logger.info('Player authenticated successfully', {
        userId: user.id,
        username: user.username,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          lastLogin: new Date(),
        },
      };
    } catch (error) {
      logger.error('Failed to authenticate player', {
        error: error instanceof Error ? error.message : 'Unknown error',
        username,
      });
      throw error;
    }
  }

  async getPlayerCharacters(userId: string) {
    try {
      const characters = await this.prisma.character.findMany({
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

      return characters;
    } catch (error) {
      logger.error('Failed to get player characters', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  async getCharacterById(characterId: string) {
    try {
      const character = await this.prisma.character.findFirst({
        where: {
          id: characterId,
          deletedAt: null,
        },
        include: {
          user: true,
          factionMembership: {
            include: {
              faction: true,
            },
          },
          aiCompanions: true,
        },
      });

      return character;
    } catch (error) {
      logger.error('Failed to get character', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
      });
      throw error;
    }
  }

  async createCharacter(data: CreateCharacterData) {
    try {
      const character = await this.prisma.character.create({
        data: {
          name: data.name,
          userId: data.userId,
        },
      });

      logger.info('Character created successfully', {
        characterId: character.id,
        characterName: character.name,
        userId: data.userId,
      });

      return character;
    } catch (error) {
      logger.error('Failed to create character', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterName: data.name,
        userId: data.userId,
      });
      throw error;
    }
  }

  async updateCharacter(characterId: string, updates: UpdateCharacterData) {
    try {
      const character = await this.prisma.character.update({
        where: { id: characterId },
        data: {
          ...updates,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      });

      return character;
    } catch (error) {
      logger.error('Failed to update character', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
      });
      throw error;
    }
  }
  async setCharacterOnline(characterId: string, isOnline: boolean) {
    try {
      const updateData: any = {
        isOnline,
      };

      if (!isOnline) {
        updateData.lastSeen = new Date();
      }

      await this.prisma.character.update({
        where: { id: characterId },
        data: updateData,
      });

      logger.info('Character online status updated', {
        characterId,
        isOnline,
      });
    } catch (error) {
      logger.error('Failed to update character online status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
        isOnline,
      });
      throw error;
    }
  }

  async banPlayer(userId: string, reason: string, adminId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          banReason: reason,
        },
      });

      // Set all characters offline
      await this.prisma.character.updateMany({
        where: { userId },
        data: { isOnline: false },
      });

      logger.info('Player banned successfully', {
        userId,
        reason,
        adminId,
      });
    } catch (error) {
      logger.error('Failed to ban player', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        reason,
      });
      throw error;
    }
  }

  async unbanPlayer(userId: string, adminId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          banReason: null,
        },
      });

      logger.info('Player unbanned successfully', {
        userId,
        adminId,
      });
    } catch (error) {
      logger.error('Failed to unban player', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  async getPlayerStatistics(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          characters: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              level: true,
              experience: true,
              money: true,
              bank: true,
              playTime: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const totalMoney = user.characters.reduce(
        (sum: number, char: any) => sum + char.money,
        0
      );
      const highestLevel = Math.max(
        ...user.characters.map((char: any) => char.level),
        0
      );
      const totalExperience = user.characters.reduce(
        (sum: number, char: any) => sum + char.experience,
        0
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          registeredAt: user.createdAt,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          totalCharacters: user.characters.length,
        },
        statistics: {
          totalMoney,
          highestLevel,
          totalExperience,
        },
        characters: user.characters,
      };
    } catch (error) {
      logger.error('Failed to get player statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  async getTotalPlayers(): Promise<number> {
    try {
      const count = await this.prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      });

      logger.info('Retrieved total players count', { count });
      return count;
    } catch (error) {
      logger.error('Failed to get total players count', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async deleteCharacter(characterId: string) {
    try {
      await this.prisma.character.update({
        where: { id: characterId },
        data: {
          deletedAt: new Date(),
          isOnline: false,
        },
      });

      logger.info('Character deleted successfully', {
        characterId,
      });
    } catch (error) {
      logger.error('Failed to delete character', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
      });
      throw error;
    }
  }
}

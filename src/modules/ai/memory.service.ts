/**
 * AI Memory Service
 * Note: Memory data structures are dynamic and some any types are necessary
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient } from '@prisma/client';
import { CacheManager } from '@/infrastructure/cache';
import { logger } from '@/infrastructure/logging';
import type {
  AIMemoryContext,
  MemoryEntry,
  RelationshipMemory,
  EmotionalState,
  PersonalityTraits,
} from '@/shared/types/ai';

// TODO: Implement proper Prisma type integration
// interface NPCMemory {
//   id: string;
//   characterId: string;
//   content: string;
//   emotionalContext: string;
//   importance: number;
//   decay: number;
//   createdAt: Date;
//   associatedPlayers: string[];
// }

// interface NPCRelationship {
//   characterId: string;
//   playerId: string;
//   trust: number;
//   respect: number;
//   fear: number;
//   loyalty: number;
//   lastInteraction: Date;
//   significantEvents?: string[];
//   player: {
//     username: string;
//   };
// }

interface NPCPersonality {
  emotionalState?: EmotionalState;
  traits?: PersonalityTraits;
}

// TypeScript doesn't allow prefixing interfaces with underscore,
// but we need this interface for type safety when working with Prisma
interface NPC {
  id: string;
  personality: NPCPersonality;
}

/**
 * Advanced memory management for NPCs and AI companions
 * Implements memory decay, relationship tracking, and emotional context
 */
export class MemoryService {
  private prisma: PrismaClient;
  private cache: CacheManager;
  private readonly MEMORY_DECAY_RATE = 0.01; // Daily decay rate
  private readonly CACHE_TTL = 3600; // 1 hour cache

  constructor(prisma: PrismaClient, cache: CacheManager) {
    this.prisma = prisma;
    this.cache = cache;
  }

  /**
   * Get AI memory context for a character
   */
  async getMemoryContext(characterId: string): Promise<AIMemoryContext> {
    try {
      // Try cache first
      const cached = await this.cache.getAIMemory<AIMemoryContext>(characterId);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const [memories, relationships, character] = await Promise.all([
        this.getRecentMemories(characterId),
        this.getRelationships(characterId),
        this.getCharacterData(characterId),
      ]);

      const context: AIMemoryContext = {
        recentMemories: memories,
        relationships,
        emotionalState: character.emotionalState,
        personalityTraits: character.personalityTraits,
      };

      // Cache the result
      await this.cache.setAIMemory(characterId, context, this.CACHE_TTL);

      return context;
    } catch (error) {
      logger.error('Failed to get memory context', {
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return default context on error
      return this.getDefaultMemoryContext();
    }
  }

  /**
   * Add new memory for a character
   */
  async addMemory(
    characterId: string,
    content: string,
    emotionalContext: string,
    importance: number,
    memoryType: string = 'GENERAL',
    playerId?: string
  ): Promise<void> {
    try {
      await this.prisma.nPCMemory.create({
        data: {
          npcId: characterId,
          playerId: playerId || null,
          memoryType,
          content,
          emotionalContext,
          importance: Math.max(0, Math.min(10, importance)), // Clamp to 0-10 based on schema
          decayFactor: 1.0, // Start with full strength
        },
      });

      // Invalidate cache
      await this.cache.deleteAIMemory(characterId);

      logger.info('Memory added', {
        characterId,
        importance,
        emotionalContext,
      });
    } catch (error) {
      logger.error('Failed to add memory', {
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update relationship between character and player
   */
  async updateRelationship(
    characterId: string,
    playerId: string,
    changes: Partial<{
      trust: number;
      respect: number;
      fear: number;
      loyalty: number;
    }>
  ): Promise<void> {
    try {
      // Build update object without undefined values
      const updateData: any = {
        lastInteraction: new Date(),
      };

      if (changes.trust !== undefined) {
        updateData.trust = Math.max(-1, Math.min(1, changes.trust));
      }
      if (changes.respect !== undefined) {
        updateData.respect = Math.max(-1, Math.min(1, changes.respect));
      }
      if (changes.fear !== undefined) {
        updateData.fear = Math.max(-1, Math.min(1, changes.fear));
      }
      if (changes.loyalty !== undefined) {
        updateData.loyalty = Math.max(-1, Math.min(1, changes.loyalty));
      }

      await this.prisma.nPCRelationship.upsert({
        where: {
          npcId_targetId_targetType: {
            npcId: characterId,
            targetId: playerId,
            targetType: 'PLAYER',
          },
        },
        update: updateData,
        create: {
          npcId: characterId,
          targetId: playerId,
          targetType: 'PLAYER',
          relationshipType: 'ACQUAINTANCE',
          trust: Math.max(-1, Math.min(1, changes.trust || 0)),
          respect: Math.max(-1, Math.min(1, changes.respect || 0)),
          fear: Math.max(-1, Math.min(1, changes.fear || 0)),
          loyalty: Math.max(-1, Math.min(1, changes.loyalty || 0)),
          lastInteraction: new Date(),
        },
      });

      // Invalidate cache
      await this.cache.deleteAIMemory(characterId);

      logger.info('Relationship updated', {
        characterId,
        playerId,
        changes,
      });
    } catch (error) {
      logger.error('Failed to update relationship', {
        characterId,
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Apply memory decay to old memories
   */
  async applyMemoryDecay(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 1); // 24 hours ago

      const memories = await this.prisma.nPCMemory.findMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          decayFactor: {
            gt: 0,
          },
        },
      });

      for (const memory of memories) {
        const newDecayFactor = Math.max(
          0,
          memory.decayFactor - this.MEMORY_DECAY_RATE
        );

        if (newDecayFactor <= 0.1) {
          // Delete very weak memories
          await this.prisma.nPCMemory.delete({
            where: { id: memory.id },
          });
        } else {
          // Update decay value
          await this.prisma.nPCMemory.update({
            where: { id: memory.id },
            data: { decayFactor: newDecayFactor },
          });
        }
      }

      logger.info('Memory decay applied', {
        memoriesProcessed: memories.length,
      });
    } catch (error) {
      logger.error('Failed to apply memory decay', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get recent memories for a character
   */
  private async getRecentMemories(characterId: string): Promise<MemoryEntry[]> {
    const memories = await this.prisma.nPCMemory.findMany({
      where: {
        npcId: characterId,
        decayFactor: {
          gt: 0.1, // Only memories with sufficient strength
        },
      },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: 20, // Limit to most recent/important memories
    });

    return memories.map((memory: any) => ({
      id: memory.id,
      content: memory.content,
      emotionalContext: memory.emotionalContext || '',
      importance: memory.importance,
      timestamp: memory.createdAt,
      decay: memory.decayFactor,
      associatedPlayers: memory.playerId ? [memory.playerId] : [],
    }));
  }

  /**
   * Get relationships for a character
   */
  private async getRelationships(
    characterId: string
  ): Promise<RelationshipMemory[]> {
    const relationships = await this.prisma.nPCRelationship.findMany({
      where: {
        npcId: characterId,
        targetType: 'PLAYER',
      },
      orderBy: {
        lastInteraction: 'desc',
      },
      take: 10, // Limit to most recent relationships
    });

    return relationships.map((rel: any) => ({
      playerId: rel.targetId,
      playerName: `Player_${rel.targetId.slice(-6)}`, // Generate a placeholder name
      trust: rel.trust,
      respect: rel.respect,
      fear: rel.fear,
      loyalty: rel.loyalty,
      lastInteraction: rel.lastInteraction || new Date(),
      significantEvents: [], // Not stored in current schema
    }));
  }

  /**
   * Get character emotional and personality data
   */
  private async getCharacterData(characterId: string): Promise<{
    emotionalState: EmotionalState;
    personalityTraits: PersonalityTraits;
  }> {
    const character = (await this.prisma.nPC.findUnique({
      where: { id: characterId },
      select: {
        personality: true,
      },
    })) as NPC | null;

    if (!character) {
      return {
        emotionalState: this.getDefaultEmotionalState(),
        personalityTraits: this.getDefaultPersonalityTraits(),
      };
    }
    return {
      emotionalState: this.extractEmotionalState(character?.personality),
      personalityTraits: this.extractPersonalityTraits(character?.personality),
    };
  }

  /**
   * Extract emotional state from personality JSON
   */
  private extractEmotionalState(
    personality: NPCPersonality | null | undefined
  ): EmotionalState {
    if (
      personality &&
      typeof personality === 'object' &&
      personality.emotionalState
    ) {
      return personality.emotionalState as EmotionalState;
    }
    return this.getDefaultEmotionalState();
  }

  /**
   * Extract personality traits from personality JSON
   */
  private extractPersonalityTraits(
    personality: NPCPersonality | null | undefined
  ): PersonalityTraits {
    if (personality && typeof personality === 'object' && personality.traits) {
      return personality.traits as PersonalityTraits;
    }
    return this.getDefaultPersonalityTraits();
  }

  /**
   * Get default memory context for error cases
   */
  private getDefaultMemoryContext(): AIMemoryContext {
    return {
      recentMemories: [],
      relationships: [],
      emotionalState: this.getDefaultEmotionalState(),
      personalityTraits: this.getDefaultPersonalityTraits(),
    };
  }

  /**
   * Get default emotional state
   */
  private getDefaultEmotionalState(): EmotionalState {
    return {
      happiness: 0.5,
      anger: 0.2,
      fear: 0.3,
      excitement: 0.4,
      stress: 0.3,
      confidence: 0.6,
      dominantEmotion: 'neutral',
    };
  }

  /**
   * Get default personality traits
   */
  private getDefaultPersonalityTraits(): PersonalityTraits {
    return {
      aggressiveness: 0.5,
      loyalty: 0.6,
      intelligence: 0.7,
      greed: 0.4,
      humor: 0.5,
      trustworthiness: 0.6,
    };
  }
}

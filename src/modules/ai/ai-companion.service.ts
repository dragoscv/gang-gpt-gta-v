import { PrismaClient } from '@prisma/client';
import { CacheManager } from '../../infrastructure/cache';
import { logger } from '../../infrastructure/logging';
import { AIService } from './ai.service';
import type {
  AIMemoryContext,
  AIPromptContext,
  AIResponse,
  GameState,
} from '../../shared/types/ai';

interface CompanionPersonality {
  traits: string[];
  speakingStyle: string;
  interests: string[];
  loyalties: string[];
  emotionalState?: string;
  emotionalIntensity?: number;
  emotionalHistory?: Array<{
    emotion: string;
    intensity: number;
    trigger: string;
    timestamp: Date;
  }>;
}

interface CompanionData {
  id: string;
  name: string;
  type: string;
  personality: CompanionPersonality;
  background?: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  factionId: string | null;
  faction?: { name: string; id: string };
  isActive: boolean;
  currentMood: string;
  aggression: number;
  intelligence: number;
  loyalty: number;
  sociability: number;
  lastInteraction: Date;
  memoryContext?: AIMemoryContext;
}

// TODO: Implement proper relationship tracking
// interface PlayerRelationship {
//   companionId: string;
//   playerId: string;
//   score: number;
//   lastInteraction: Date;
//   relationshipType: string;
// }

interface MemoryEntry {
  id: string;
  companionId: string;
  playerId: string;
  content: string;
  emotionalWeight: number;
  importance: number;
  timestamp: Date;
  context: string;
}

interface DialogueInteraction {
  interaction: string;
  response: string;
  context: {
    location?: string;
    situation?: string;
    mood?: string;
    previousConversation?: string;
  };
  timestamp: Date;
  emotionalState: string;
  relationshipChange?: number;
}

/**
 * AI Companion service for managing intelligent NPCs with memory and personality
 * Implements persistent memory, emotional states, and dynamic relationship tracking
 */
export class AICompanionService {
  private prisma: PrismaClient;
  private cache: CacheManager;
  private aiService: AIService;
  private readonly MEMORY_CACHE_TTL = 3600; // 1 hour
  private readonly ACTIVE_MEMORY_HOURS = 24; // Active memory window
  private readonly MAX_MEMORY_ENTRIES = 50; // Max memories per NPC

  constructor(prisma: PrismaClient, cache: CacheManager, aiService: AIService) {
    this.prisma = prisma;
    this.cache = cache;
    this.aiService = aiService;
  }

  /**
   * Generate contextual dialogue for an AI companion
   */
  async generateDialogue(
    companionId: string,
    playerId: string,
    prompt: string,
    context: {
      location?: string;
      situation?: string;
      mood?: string;
      previousConversation?: string;
    }
  ): Promise<{
    response: string;
    emotionalState: string;
    memoryUpdates: string[];
    relationshipChange: number;
  }> {
    try {
      // Get companion data and memory
      const companion = await this.getCompanionWithMemory(companionId);
      const playerRelationship = await this.getPlayerRelationship(
        companionId,
        playerId
      );
      const recentMemories = await this.getRecentMemories(
        companionId,
        playerId
      );

      // Build dialogue context
      const dialogueContext = this.buildDialogueContext(
        companion,
        playerRelationship,
        recentMemories,
        context,
        prompt
      );

      // Generate AI response
      const aiResponse = await this.aiService.generateNPCDialogue(
        companionId,
        'dialogue',
        dialogueContext
      );

      // Parse response and extract components
      const parsedResponse = this.parseDialogueResponse(aiResponse);

      // Update memory with new interaction
      await this.updateCompanionMemory(companionId, playerId, {
        interaction: prompt,
        response: parsedResponse.response,
        context,
        timestamp: new Date(),
        emotionalState: parsedResponse.emotionalState,
      });

      // Update relationship score
      const newRelationshipScore = await this.updateRelationship(
        companionId,
        playerId,
        parsedResponse.relationshipChange
      );

      logger.info('AI companion dialogue generated', {
        companionId,
        playerId,
        emotionalState: parsedResponse.emotionalState,
        relationshipChange: parsedResponse.relationshipChange,
        newRelationshipScore,
      });

      return parsedResponse;
    } catch (error) {
      logger.error('Failed to generate companion dialogue', {
        companionId,
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return this.getFallbackDialogue(companionId);
    }
  }

  /**
   * Create a new AI companion with personality and background
   */
  async createCompanion(data: {
    name: string;
    personality: CompanionPersonality;
    appearance: string;
    skills: string[];
    factionId?: string;
    location: { x: number; y: number; z: number };
    aiPersonality?: {
      traits: string[];
      speakingStyle: string;
      interests: string[];
      loyalties: string[];
    };
  }): Promise<string> {
    try {
      const companion = await this.prisma.nPC.create({
        data: {
          name: data.name,
          type: 'COMPANION',
          personality: data.personality as any, // Cast to satisfy Prisma JsonValue type
          positionX: data.location.x,
          positionY: data.location.y,
          positionZ: data.location.z,
          factionId: data.factionId || null,
          isActive: true,
          currentMood: 'neutral',
          aggression: 0.3,
          intelligence: 0.8,
          loyalty: 0.5,
          sociability: 0.7,
          lastInteraction: new Date(),
        },
      });

      // Initialize companion in cache with AI-specific data
      await this.cache.setTemporary(
        `companion:${companion.id}`,
        {
          ...companion,
          aiPersonality: data.aiPersonality,
          activeMemories: [],
          relationshipScores: {},
        },
        this.MEMORY_CACHE_TTL
      );

      logger.info('AI companion created', {
        companionId: companion.id,
        name: data.name,
        location: data.location,
      });

      return companion.id;
    } catch (error) {
      logger.error('Failed to create AI companion', {
        name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  } /**
   * Update companion's emotional state based on interactions
   */
  async updateEmotionalState(
    companionId: string,
    newEmotion: string,
    intensity: number,
    trigger: string
  ): Promise<void> {
    try {
      const companion = await this.prisma.nPC.findUnique({
        where: { id: companionId },
      });

      if (!companion) {
        throw new Error(`Companion ${companionId} not found`);
      }

      // Parse existing personality data to store emotional context
      const personalityData = companion.personality
        ? (companion.personality as unknown as CompanionPersonality)
        : ({} as CompanionPersonality);

      // Update emotional state with decay over time
      const updatedPersonality = {
        ...personalityData,
        emotionalState: newEmotion,
        emotionalIntensity: intensity,
        lastEmotionalChange: new Date(),
        emotionalTrigger: trigger,
        emotionalHistory: [
          ...(personalityData.emotionalHistory || []).slice(-9), // Keep last 10
          {
            emotion: newEmotion,
            intensity,
            trigger,
            timestamp: new Date(),
          },
        ],
      };

      await this.prisma.nPC.update({
        where: { id: companionId },
        data: {
          personality: JSON.stringify(updatedPersonality),
          currentMood: newEmotion,
          lastInteraction: new Date(),
        },
      });

      // Clear cache to force refresh
      await this.cache.deleteKey(`temp:companion:${companionId}`);

      logger.info('Companion emotional state updated', {
        companionId,
        newEmotion,
        intensity,
        trigger,
      });
    } catch (error) {
      logger.error('Failed to update companion emotional state', {
        companionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get companion with memory data
   */
  private async getCompanionWithMemory(
    companionId: string
  ): Promise<CompanionData> {
    // Try cache first
    const cachedCompanion = await this.cache.getTemporary(
      `companion:${companionId}`
    );
    if (cachedCompanion) {
      return cachedCompanion as CompanionData;
    }

    // Get from database
    const companion = await this.prisma.nPC.findUnique({
      where: { id: companionId },
      include: {
        faction: true,
      },
    });

    if (!companion) {
      throw new Error(`Companion ${companionId} not found`);
    }

    // Cache the companion data
    await this.cache.setTemporary(
      `companion:${companionId}`,
      companion,
      this.MEMORY_CACHE_TTL
    );

    // Transform to CompanionData format
    const result: CompanionData = {
      id: companion.id,
      name: companion.name,
      type: companion.type,
      personality: companion.personality as unknown as CompanionPersonality,
      positionX: companion.positionX,
      positionY: companion.positionY,
      positionZ: companion.positionZ,
      factionId: companion.factionId,
      lastInteraction: companion.lastInteraction || new Date(),
      currentMood: companion.currentMood,
      loyalty: companion.loyalty,
      isActive: companion.isActive,
      aggression: companion.aggression,
      intelligence: companion.intelligence,
      sociability: companion.sociability,
    };

    if (companion.faction) {
      result.faction = {
        id: companion.faction.id,
        name: companion.faction.name,
      };
    }

    return result;
  } /**
   * Get relationship score between companion and player
   */
  private async getPlayerRelationship(
    companionId: string,
    playerId: string
  ): Promise<number> {
    try {
      const relationship = await this.prisma.nPCRelationship.findFirst({
        where: {
          npcId: companionId,
          targetId: playerId,
          targetType: 'PLAYER',
        },
      });

      return relationship?.trust || 0;
    } catch (error) {
      logger.warn('Failed to get player relationship', {
        companionId,
        playerId,
        error,
      });
      return 0;
    }
  }

  /**
   * Get recent memories for context
   */
  private async getRecentMemories(
    companionId: string,
    playerId: string
  ): Promise<MemoryEntry[]> {
    try {
      const memories = await this.prisma.nPCMemory.findMany({
        where: {
          npcId: companionId,
          playerId,
          createdAt: {
            gte: new Date(
              Date.now() - this.ACTIVE_MEMORY_HOURS * 60 * 60 * 1000
            ),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Transform NPCMemory to MemoryEntry format
      return memories.map(
        (memory: any): MemoryEntry => ({
          id: memory.id,
          companionId: memory.npcId,
          playerId: memory.playerId || '',
          content: memory.content || '',
          emotionalWeight: 0.5, // Default neutral emotional weight
          importance: memory.importance || 5,
          timestamp: memory.createdAt || new Date(),
          context: memory.emotionalContext || '',
        })
      );
    } catch (error) {
      logger.warn('Failed to get recent memories', {
        companionId,
        playerId,
        error,
      });
      return [];
    }
  }

  /**
   * Build dialogue context for AI generation
   */
  private buildDialogueContext(
    companion: CompanionData,
    relationshipScore: number,
    _memories: MemoryEntry[],
    _context: object,
    _prompt: string
  ): AIPromptContext {
    // TODO: Implement full memory context integration
    // const memoryContext =
    //   typeof companion.memoryContext === 'object'
    //     ? (companion.memoryContext as AIMemoryContext)
    //     : ({} as AIMemoryContext);

    return {
      characterName: companion.name,
      characterBackground: companion.background || '',
      // personality: companion.personality, // Note: personality field not in AIPromptContext type
      // currentLocation: context.location || companion.currentLocation, // Note: currentLocation field not in AIPromptContext type
      // emotionalState: memoryContext.emotionalState || 'neutral', // Note: emotionalState field not in AIPromptContext type
      relationshipLevel: this.getRelationshipLevel(relationshipScore), // recentMemories: memories.map(m => ({ // Note: recentMemories field not in AIPromptContext type
      //     interaction: m.interactionType,
      //     content: m.content,
      //     timestamp: m.createdAt,
      //     emotionalContext: m.emotionalContext,
      // })),            // conversationContext: { // Note: conversationContext field not in AIPromptContext type
      //     playerInput: prompt,
      //     situation: context.situation,
      //     mood: context.mood,
      //     previousConversation: context.previousConversation,
      // },
      // instructions: this.buildPersonalityInstructions(companion, memoryContext), // Note: instructions field not in AIPromptContext type
      factionName: companion.faction?.name,
      factionId: companion.factionId || undefined,
      gameState: {
        currentTime: new Date().toISOString(),
        weather: 'clear',
        activePlayers: 0,
        factionWars: false,
        economicState: 'average',
        crimeLevel: 'medium',
      } as GameState,
    };
  }

  /**
   * Build personality-specific instructions for AI
   */
  // TODO: Implement personality instructions when ready
  // private buildPersonalityInstructions(
  //   companion: CompanionData,
  //   memoryContext: AIMemoryContext
  // ): string {
  //   const personalityTraits = memoryContext.personalityTraits || {
  //     aggressiveness: 30,
  //     loyalty: 50,
  //     intelligence: 60,
  //     greed: 40,
  //     humor: 50,
  //     trustworthiness: 70,
  //   };

  //   const emotionalState = memoryContext.emotionalState || {
  //     happiness: 50,
  //     anger: 0,
  //     fear: 0,
  //     excitement: 30,
  //     stress: 20,
  //     confidence: 60,
  //   };

  //   return `
  // You are ${companion.name}, an AI companion in the GangGPT roleplay server.

  // Personality Traits: ${Object.entries(personalityTraits)
  //     .map(([trait, value]) => `${trait}: ${value}/100`)
  //     .join(', ')}
  // Speaking Style: ${companion.personality?.speakingStyle || 'casual'}
  // Interests: ${companion.personality?.interests?.join(', ') || 'various topics'}
  // Background: ${companion.background || 'Unknown'}

  // Current Emotional State: ${Object.entries(emotionalState)
  //     .map(([emotion, level]) => `${emotion}: ${level}/100`)
  //     .join(', ')}
  // Trust Level: ${memoryContext.relationships?.[0]?.trust || 0}/100

  // Instructions:
  // 1. Stay in character at all times
  // 2. Reference past interactions when relevant
  // 3. Show emotional growth based on relationship history
  // 4. React appropriately to the current situation and mood
  // 5. Maintain consistency with your established personality
  // 6. Express emotions naturally through dialogue
  // 7. Remember important details about the player

  // Response Format:
  // {
  //     "response": "Your dialogue response",
  //     "emotionalState": "current emotion",
  //     "memoryUpdates": ["important details to remember"],
  //     "relationshipChange": -5 to +5 (impact on relationship)
  // }
  //       `.trim();
  // }

  /**
   * Parse AI dialogue response
   */
  private parseDialogueResponse(aiResponse: AIResponse): {
    response: string;
    emotionalState: string;
    memoryUpdates: string[];
    relationshipChange: number;
  } {
    try {
      // Try to parse JSON response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || aiResponse.content,
          emotionalState: parsed.emotionalState || 'neutral',
          memoryUpdates: Array.isArray(parsed.memoryUpdates)
            ? parsed.memoryUpdates
            : [],
          relationshipChange: Math.max(
            -5,
            Math.min(5, parsed.relationshipChange || 0)
          ),
        };
      }
    } catch (error) {
      logger.warn('Failed to parse structured dialogue response', { error });
    }

    // Fallback to simple response
    return {
      response: aiResponse.content,
      emotionalState: 'neutral',
      memoryUpdates: [],
      relationshipChange: 0,
    };
  }

  /**
   * Update companion memory with new interaction
   */
  private async updateCompanionMemory(
    companionId: string,
    playerId: string,
    interaction: DialogueInteraction
  ): Promise<void> {
    try {
      // Create memory entry
      await this.prisma.nPCMemory.create({
        data: {
          npcId: companionId,
          playerId,
          memoryType: 'CONVERSATION',
          content: `Player: ${interaction.interaction}\nNPC: ${interaction.response}`,
          emotionalContext: interaction.emotionalState,
          importance: this.calculateMemoryImportance(interaction),
        },
      });

      // Apply memory decay to old memories
      await this.applyMemoryDecay(companionId);
    } catch (error) {
      logger.error('Failed to update companion memory', {
        companionId,
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update relationship score between companion and player
   */
  private async updateRelationship(
    companionId: string,
    playerId: string,
    change: number
  ): Promise<number> {
    try {
      const existing = await this.prisma.nPCRelationship.findFirst({
        where: {
          npcId: companionId,
          targetId: playerId,
          targetType: 'player',
        },
      });

      // Calculate new loyalty score based on existing loyalty
      const newLoyalty = Math.max(
        -100,
        Math.min(100, (existing?.loyalty || 0) + change / 100)
      );

      if (existing) {
        await this.prisma.nPCRelationship.update({
          where: { id: existing.id },
          data: {
            loyalty: newLoyalty,
            lastInteraction: new Date(),
          },
        });
      } else {
        await this.prisma.nPCRelationship.create({
          data: {
            npcId: companionId,
            targetId: playerId,
            targetType: 'player',
            relationshipType: 'companion',
            loyalty: newLoyalty,
            lastInteraction: new Date(),
          },
        });
      }

      return newLoyalty;
    } catch (error) {
      logger.error('Failed to update relationship', {
        companionId,
        playerId,
        error,
      });
      return 0;
    }
  }

  /**
   * Apply memory decay to old memories
   */
  private async applyMemoryDecay(companionId: string): Promise<void> {
    try {
      // Delete old memories beyond the limit
      const oldMemories = await this.prisma.nPCMemory.findMany({
        where: { npcId: companionId },
        orderBy: { createdAt: 'desc' },
        skip: this.MAX_MEMORY_ENTRIES,
      });

      if (oldMemories.length > 0) {
        await this.prisma.nPCMemory.deleteMany({
          where: {
            id: {
              in: oldMemories.map((m: { id: string }) => m.id),
            },
          },
        });
      }
    } catch (error) {
      logger.error('Failed to apply memory decay', { companionId, error });
    }
  }

  /**
   * Calculate importance score for memory storage
   */
  private calculateMemoryImportance(interaction: DialogueInteraction): number {
    let importance = 5; // Base importance

    // Emotional interactions are more important
    if (interaction.emotionalState !== 'neutral') {
      importance += 2;
    }

    // Relationship changes indicate important interactions
    if (Math.abs(interaction.relationshipChange || 0) > 2) {
      importance += 3;
    }

    // Special situations increase importance
    if (interaction.context?.situation) {
      importance += 1;
    }

    return Math.min(10, importance);
  }

  /**
   * Get relationship level description from score
   */
  private getRelationshipLevel(score: number): string {
    if (score >= 80) return 'devoted';
    if (score >= 60) return 'loyal';
    if (score >= 40) return 'friendly';
    if (score >= 20) return 'acquainted';
    if (score >= 0) return 'neutral';
    if (score >= -20) return 'wary';
    if (score >= -40) return 'disliked';
    if (score >= -60) return 'hostile';
    return 'enemy';
  }

  /**
   * Get fallback dialogue when AI fails
   */
  private getFallbackDialogue(_companionId: string): {
    response: string;
    emotionalState: string;
    memoryUpdates: string[];
    relationshipChange: number;
  } {
    const fallbackResponses = [
      "I'm not sure how to respond to that right now.",
      'Let me think about that for a moment.',
      "That's interesting. Tell me more.",
      'I need to process what you just said.',
      'Something seems to be on my mind. Can we talk later?',
    ];

    return {
      response:
        fallbackResponses[
          Math.floor(Math.random() * fallbackResponses.length)
        ] || "I'm not sure how to respond to that.",
      emotionalState: 'confused',
      memoryUpdates: [],
      relationshipChange: 0,
    };
  }

  /**
   * Get all active companions in a location
   */
  async getActiveCompanions(location: string): Promise<CompanionData[]> {
    try {
      const companions = await this.prisma.nPC.findMany({
        where: {
          type: 'COMPANION',
          isActive: true,
        },
        include: {
          faction: true,
        },
        orderBy: {
          lastInteraction: 'desc',
        },
      });

      // Transform to CompanionData format
      return companions.map((companion: any): CompanionData => {
        const result: CompanionData = {
          id: companion.id,
          name: companion.name,
          type: companion.type,
          personality: companion.personality as CompanionPersonality,
          positionX: companion.positionX,
          positionY: companion.positionY,
          positionZ: companion.positionZ,
          factionId: companion.factionId,
          lastInteraction: companion.lastInteraction || new Date(),
          currentMood: companion.currentMood,
          loyalty: companion.loyalty,
          isActive: companion.isActive,
          aggression: companion.aggression,
          intelligence: companion.intelligence,
          sociability: companion.sociability,
        };

        if (companion.faction) {
          result.faction = {
            id: companion.faction.id,
            name: companion.faction.name,
          };
        }

        return result;
      });
    } catch (error) {
      logger.error('Failed to get active companions', { location, error });
      return [];
    }
  }

  /**
   * Simulate companion behavior when not directly interacting
   */
  async simulateCompanionBehavior(companionId: string): Promise<void> {
    try {
      const companion = await this.getCompanionWithMemory(companionId);

      // Update last active time
      await this.prisma.nPC.update({
        where: { id: companionId },
        data: { lastInteraction: new Date() },
      });

      // Simulate emotional decay
      const memoryContext =
        typeof companion.memoryContext === 'object'
          ? (companion.memoryContext as any)
          : {};

      if (memoryContext.emotionalIntensity > 0) {
        const newIntensity = Math.max(
          0,
          memoryContext.emotionalIntensity - 0.1
        );

        if (newIntensity <= 0) {
          await this.updateEmotionalState(
            companionId,
            'neutral',
            0,
            'emotional_decay'
          );
        }
      }

      logger.debug('Companion behavior simulated', { companionId });
    } catch (error) {
      logger.error('Failed to simulate companion behavior', {
        companionId,
        error,
      });
    }
  }
}

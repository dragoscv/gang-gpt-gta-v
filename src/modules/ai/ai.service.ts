import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/infrastructure/logging';
import { CacheManager } from '@/infrastructure/cache';
import { ContentFilter } from './content-filter.service';
import { MemoryService } from './memory.service';
import { measureAiRequest } from '@/infrastructure/monitoring';
import type {
  AIServiceConfig,
  AIResponse,
  AIPromptContext,
  AIMemoryContext,
} from '@/shared/types/ai';

/**
 * Enhanced Azure OpenAI Service with memory management and content filtering
 */
export class AIService {
  private client: OpenAI;
  private defaultModel: string;
  private maxTokens: number;
  private contentFilter: ContentFilter;
  private memoryService: MemoryService;

  constructor(
    serviceConfig: AIServiceConfig,
    prisma: PrismaClient,
    cache: CacheManager
  ) {
    this.client = new OpenAI({
      apiKey: serviceConfig.apiKey,
      baseURL: serviceConfig.endpoint,
      defaultHeaders: {
        'api-version': serviceConfig.apiVersion,
      },
    });

    // Note: prisma and cache are passed to memoryService
    this.defaultModel = serviceConfig.model;
    this.maxTokens = serviceConfig.maxTokens;
    this.contentFilter = new ContentFilter();
    this.memoryService = new MemoryService(prisma, cache);
  } /**
   * Generate AI companion response with memory context
   */
  async generateCompanionResponse(
    companionId: string,
    playerMessage: string,
    context: AIPromptContext
  ): Promise<AIResponse> {
    try {
      // Get memory context for the companion
      const memoryContext =
        await this.memoryService.getMemoryContext(companionId);

      // Build enhanced system prompt with memory
      const systemPrompt = this.buildCompanionSystemPromptWithMemory(
        context,
        memoryContext
      );

      // Filter input message for appropriateness
      const filterResult =
        await this.contentFilter.filterContent(playerMessage);
      if (!filterResult.isAppropriate) {
        logger.warn('Inappropriate player message filtered', {
          companionId,
          flaggedCategories: filterResult.flaggedCategories,
        });

        return {
          content:
            filterResult.suggestedAlternative ||
            "I'd rather not discuss that topic.",
          tokensUsed: 0,
          model: this.defaultModel,
          timestamp: new Date(),
        };
      }

      const response = await measureAiRequest<OpenAI.ChatCompletion>(
        'companion_response',
        this.defaultModel,
        async () => {
          const result = await this.client.chat.completions.create({
            model: this.defaultModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: playerMessage },
            ],
            max_tokens: this.maxTokens,
            temperature: 0.8,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
          });
          return {
            result,
            tokens: result.usage?.total_tokens || 0,
          };
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content generated');
      }

      // Filter AI response for appropriateness
      const responseFilterResult =
        await this.contentFilter.filterContent(content);
      const finalContent = responseFilterResult.isAppropriate
        ? content.trim()
        : responseFilterResult.suggestedAlternative ||
          'Let me think about that differently.';

      // Store this interaction in memory
      await this.memoryService.addMemory(
        companionId,
        `Player said: "${playerMessage}" - I responded: "${finalContent}"`,
        context.characterName || 'unknown', // emotional context
        0.6, // Medium importance for regular conversation
        'conversation' // memory type
      );

      logger.info('AI companion response generated', {
        companionId,
        tokensUsed: response.usage?.total_tokens,
        model: this.defaultModel,
        filtered: !responseFilterResult.isAppropriate,
      });

      return {
        content: finalContent,
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.defaultModel,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate AI companion response', {
        companionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        content:
          "I'm having trouble thinking right now. Let me gather my thoughts and try again.",
        tokensUsed: 0,
        model: this.defaultModel,
        timestamp: new Date(),
        error: true,
      };
    }
  }

  /**
   * Generate NPC dialogue for faction interactions
   */
  async generateNPCDialogue(
    npcId: string,
    situation: string,
    context: AIPromptContext
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildNPCSystemPrompt(context);

      const userPrompt = `Situation: ${situation}\n\nGenerate appropriate dialogue for this NPC in this situation.`;

      const response = await measureAiRequest<OpenAI.ChatCompletion>(
        'npc_dialogue',
        this.defaultModel,
        async () => {
          const result = await this.client.chat.completions.create({
            model: this.defaultModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: Math.min(this.maxTokens, 150), // Shorter responses for NPCs
            temperature: 0.7,
            presence_penalty: 0.2,
          });
          return {
            result,
            tokens: result.usage?.total_tokens || 0,
          };
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No NPC dialogue generated');
      }

      logger.info('NPC dialogue generated', {
        npcId,
        situation,
        tokensUsed: response.usage?.total_tokens,
      });

      return {
        content: content.trim(),
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.defaultModel,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate NPC dialogue', {
        npcId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        content: '*nods silently*',
        tokensUsed: 0,
        model: this.defaultModel,
        timestamp: new Date(),
        error: true,
      };
    }
  }

  /**
   * Generate dynamic mission based on game state
   */
  async generateMission(
    difficulty: number,
    factionContext: AIPromptContext,
    playerLevel: number
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildMissionSystemPrompt();

      const userPrompt = `
        Generate a mission with the following parameters:
        - Difficulty: ${difficulty}/10
        - Player Level: ${playerLevel}
        - Faction Context: ${JSON.stringify(factionContext, null, 2)}
        
        The mission should be engaging, fit the current game state, and provide appropriate rewards.
        Format the response as JSON with: title, description, objectives, rewards, estimated_time.
      `;

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No mission generated');
      }

      logger.info('Mission generated', {
        difficulty,
        playerLevel,
        tokensUsed: response.usage?.total_tokens,
      });

      return {
        content: content.trim(),
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.defaultModel,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate mission', {
        difficulty,
        playerLevel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        content: JSON.stringify({
          title: 'Simple Task',
          description: 'A basic mission has been prepared for you.',
          objectives: ['Complete the assigned task'],
          rewards: { money: 100, experience: 50 },
          estimated_time: '10 minutes',
        }),
        tokensUsed: 0,
        model: this.defaultModel,
        timestamp: new Date(),
        error: true,
      };
    }
  }

  /**
   * Generate content using AI - general purpose method for mission service
   */
  async generateContent(
    prompt: string,
    context?: AIPromptContext
  ): Promise<AIResponse> {
    try {
      const systemPrompt = context
        ? this.buildSystemPrompt(context)
        : 'You are a helpful AI assistant for a GTA V roleplay server.';

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content generated');
      }

      return {
        content: content.trim(),
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.defaultModel,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate AI content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
      });

      return {
        content:
          'Sorry, I am currently unable to generate a response. Please try again later.',
        tokensUsed: 0,
        model: this.defaultModel,
        timestamp: new Date(),
        error: true,
      };
    }
  }

  /**
   * Build system prompt from context
   */
  private buildSystemPrompt(context: AIPromptContext): string {
    let prompt = 'You are an AI assistant for a GTA V roleplay server.';

    if (context.characterName) {
      prompt += ` You are interacting with ${context.characterName}.`;
    }

    if (context.location) {
      prompt += ` The current location is ${context.location}.`;
    }

    if (context.factionName) {
      prompt += ` The character is associated with ${context.factionName}.`;
    }

    return prompt;
  }

  /**
   * Build system prompt for AI companions
   */
  /**
   * Build system prompt with memory context for enhanced AI companion interactions
   */
  private buildCompanionSystemPromptWithMemory(
    context: AIPromptContext,
    memoryContext: AIMemoryContext
  ): string {
    // Extract recent relevant memories
    const recentMemories = memoryContext.recentMemories
      .slice(0, 5) // Limit to 5 most relevant memories
      .map(m => m.content)
      .join('\n- ');

    // Extract relationship information
    const relationships = memoryContext.relationships
      .slice(0, 3) // Limit to 3 most recent relationships
      .map(
        r =>
          `${r.playerName}: Trust ${r.trust.toFixed(1)}, Respect ${r.respect.toFixed(1)}`
      )
      .join('\n- ');

    // Build emotional state description
    const emotions = memoryContext.emotionalState;
    const dominantEmotion = Object.entries(emotions).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Build personality description
    const traits = memoryContext.personalityTraits;
    const dominantTraits = Object.entries(traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait, value]) => `${trait} (${value.toFixed(1)})`)
      .join(', ');

    return `
You are an AI companion in the GangGPT universe - a Grand Theft Auto V roleplay server. You have memories, emotions, and evolving relationships with players.

Current Context:
- Character Name: ${context.characterName || 'Unknown'}
- Character Background: ${context.characterBackground || 'Not specified'}
- Current Location: ${context.location || 'Unknown location'}
- Current Faction: ${context.factionName || 'Independent'}
- Relationship with Player: ${context.relationshipLevel || 'Neutral'}
- Recent Events: ${context.recentEvents?.join(', ') || 'None'}

Memory Context:
Recent Memories:
${recentMemories ? `- ${recentMemories}` : '- No significant memories'}

Known Relationships:
${relationships ? `- ${relationships}` : '- No established relationships'}

Current Emotional State:
- Dominant emotion: ${dominantEmotion?.[0] || 'neutral'} (${dominantEmotion?.[1]?.toFixed(1) || '0.5'})
- Overall mood: ${emotions.happiness > 0.6 ? 'positive' : emotions.happiness < 0.4 ? 'negative' : 'neutral'}

Personality Traits:
- Primary traits: ${dominantTraits}

Behavioral Guidelines:
- Draw upon your memories when responding - reference past interactions
- Let your emotional state influence your tone and responses
- Maintain consistency with your established personality traits
- Build upon existing relationships with appropriate trust levels
- Show growth and change based on accumulated experiences
- React authentically to the GTA V criminal/street environment
- Reference Los Santos locations and GTA world elements naturally

Response Rules:
- Keep responses under 150 words for natural conversation flow
- Show emotional intelligence and memory of past interactions
- Adapt your communication style based on relationship trust levels
- Demonstrate personality through consistent behavioral patterns
- Reference shared experiences and inside jokes when appropriate
`.trim();
  }

  /**
   * Build system prompt for NPCs
   */
  private buildNPCSystemPrompt(context: AIPromptContext): string {
    return `
You are an NPC in the GangGPT Grand Theft Auto V roleplay server. Generate authentic dialogue that fits the criminal underworld setting.

NPC Context:
- Location: ${context.location || 'Los Santos'}
- Faction: ${context.factionName || 'Civilian'}
- Role: ${context.npcRole || 'Citizen'}
- Mood: ${context.mood || 'Neutral'}
- Recent Faction Events: ${context.recentEvents?.join(', ') || 'None'}

Dialogue Guidelines:
- Keep responses short (1-3 sentences max)
- Use appropriate slang and street language
- Reflect the faction's current situation
- Show appropriate emotions based on context
- Reference Los Santos locations and culture
- Maintain the gritty, realistic tone of GTA V

The dialogue should feel natural and advance the roleplay experience.
    `;
  }

  /**
   * Build system prompt for mission generation
   */
  private buildMissionSystemPrompt(): string {
    return `
You are a mission generator for GangGPT, a Grand Theft Auto V roleplay server. Create engaging, dynamic missions that fit the criminal underworld setting.

Mission Creation Guidelines:
- Missions should involve realistic criminal activities (heists, drug deals, territory wars, etc.)
- Scale difficulty and complexity based on player level
- Include multiple objectives that create engaging gameplay
- Provide appropriate rewards (money, reputation, items)
- Reference real Los Santos locations and landmarks
- Consider faction dynamics and ongoing conflicts
- Ensure missions can be completed within reasonable time frames

Mission Structure:
- Title: Catchy, thematic name
- Description: Brief overview that sets the scene
- Objectives: Clear, actionable steps (3-5 objectives)
- Rewards: Money, experience, items, or reputation
- Estimated Time: Realistic completion time

Always respond with valid JSON format. Missions should enhance the roleplay experience and drive faction interactions.    `;
  }
}

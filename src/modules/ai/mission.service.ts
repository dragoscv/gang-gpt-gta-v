/**
 * AI Mission Generation Service
 * Note: Mission data structures are dynamic and some any types are necessary
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient } from '@prisma/client';
import { CacheManager } from '@/infrastructure/cache';
import { logger } from '@/infrastructure/logging';
import { AIService } from './ai.service';
import { WorldService } from '@/modules/world/world.service';
import { MemoryService } from './memory.service';
import type {
  MissionGenerationContext,
  AIResponse,
  MissionRequirements,
  MissionRewards,
  PlayerPreferences,
} from '@/shared/types/ai';

// Define enums that would typically come from Prisma schema
export enum MissionType {
  DELIVERY = 'DELIVERY',
  ELIMINATION = 'ELIMINATION',
  PROTECTION = 'PROTECTION',
  INFILTRATION = 'INFILTRATION',
  HEIST = 'HEIST',
  RACING = 'RACING',
  COLLECTION = 'COLLECTION',
  EXPLORATION = 'EXPLORATION',
  SOCIAL = 'SOCIAL',
}

export enum MissionStatus {
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

// TODO: Implement proper mission type definitions
// interface Mission {
//   id: string;
//   title: string;
//   description: string;
//   type: MissionType;
//   status: MissionStatus;
//   objectives: string[];
//   rewards: MissionRewards;
//   difficulty: number;
//   estimatedDuration: number;
//   requirements: MissionRequirements[];
//   playerId?: string;
//   factionId?: string;
//   expiresAt?: Date;
//   completedAt?: Date;
// }

interface MissionTemplate {
  type: MissionType;
  title: string;
  description: string;
  objectives: string[];
  rewards: MissionRewards;
  difficulty: number;
  estimatedDuration: number;
  requirements: MissionRequirements[];
}

/**
 * Mission generation service for procedural content creation
 * Uses AI to generate contextual missions based on player level, faction dynamics, and world state
 */
export class MissionService {
  private prisma: PrismaClient;
  private cache: CacheManager;
  private aiService: AIService;
  private worldService: WorldService;
  private memoryService: MemoryService;
  private readonly MISSION_CACHE_TTL = 1800; // 30 minutes
  private readonly MISSION_TEMPLATE_CACHE_TTL = 86400; // 24 hours for mission templates

  constructor(
    prisma: PrismaClient,
    cache: CacheManager,
    aiService: AIService,
    worldService: WorldService,
    memoryService: MemoryService
  ) {
    this.prisma = prisma;
    this.cache = cache;
    this.aiService = aiService;
    this.worldService = worldService;
    this.memoryService = memoryService;

    // Pre-cache mission templates in background
    this.cacheMissionTemplates().catch(err => {
      logger.error('Failed to cache mission templates', { error: err.message });
    });
  }

  /**
   * Pre-cache mission templates by type for quick fallback options
   */
  private async cacheMissionTemplates(): Promise<void> {
    try {
      const missionTypes = Object.values(MissionType);

      for (const type of missionTypes) {
        const cacheKey = `mission-templates:${type}`;
        const templates = await this.generateMissionTemplatesForType(type);
        await this.cache.setTemporary(
          cacheKey,
          templates,
          this.MISSION_TEMPLATE_CACHE_TTL
        );
        logger.debug(`Cached mission templates for type ${type}`, {
          count: templates.length,
        });
      }
    } catch (error) {
      logger.error('Failed to cache mission templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate mission templates for a specific type
   */
  private async generateMissionTemplatesForType(
    type: MissionType
  ): Promise<MissionTemplate[]> {
    // Generate 5 template missions for each type
    const templates = [];

    for (let i = 0; i < 5; i++) {
      const template: MissionTemplate = {
        type,
        title: this.getDefaultTitleForType(type, i),
        description: this.getDefaultDescriptionForType(type, i),
        objectives: this.getDefaultObjectivesForType(type, i),
        rewards: {
          money: 1000 * (i + 1),
          experience: 100 * (i + 1),
          reputation: 20 * (i + 1),
          items: [],
          unlocks: [],
        },
        difficulty: 1 + Math.floor(i * 2),
        estimatedDuration: 15 + i * 10,
        requirements: [],
      };
      templates.push(template);
    }

    return templates;
  }

  /**
   * Get default mission title based on type and index
   */
  private getDefaultTitleForType(type: MissionType, index: number): string {
    const titles = {
      [MissionType.DELIVERY]: [
        'Special Package Delivery',
        'Cross-City Run',
        'Hot Cargo Transfer',
        'Smuggling Operation',
        'High-Value Transport',
      ],
      [MissionType.ELIMINATION]: [
        'Clean Sweep',
        'Target Removal',
        'Gang Cleanup',
        'Territory Defense',
        'High-Profile Hit',
      ],
      [MissionType.PROTECTION]: [
        'VIP Security Detail',
        'Asset Protection',
        'Territory Defense',
        'Convoy Guard',
        'Witness Protection',
      ],
      [MissionType.INFILTRATION]: [
        'Information Gathering',
        'Asset Acquisition',
        'Security Breach',
        'Plant Evidence',
        'Hostile Takeover',
      ],
      [MissionType.HEIST]: [
        'Convenience Store Job',
        'Jewelry Store Hit',
        'Bank Vault Breach',
        'Casino Score',
        'Federal Reserve Job',
      ],
      [MissionType.RACING]: [
        'Street Circuit Run',
        'Highway Sprint',
        'Offroad Challenge',
        'City Slalom',
        'Underground Tournament',
      ],
      [MissionType.COLLECTION]: [
        'Debt Collection',
        'Evidence Gathering',
        'Supply Run',
        'Resource Acquisition',
        'Bounty Hunting',
      ],
      [MissionType.EXPLORATION]: [
        'Hidden Cache',
        'Urban Legend',
        'Lost Shipment',
        'Secret Location',
        'Historical Artifact',
      ],
      [MissionType.SOCIAL]: [
        'Network Building',
        'Diplomatic Meeting',
        'Underground Contact',
        'Information Broker',
        'Alliance Formation',
      ],
    };

    return titles[type]?.[index] || `${type} Mission ${index + 1}`;
  }

  /**
   * Get default mission description based on type and index
   */
  private getDefaultDescriptionForType(
    type: MissionType,
    index: number
  ): string {
    const descriptions = {
      [MissionType.DELIVERY]: [
        "Deliver an unmarked package to a contact. Don't ask what's inside.",
        'Transport time-sensitive goods across the city without police attention.',
        'Move valuable cargo between locations while avoiding rival gangs.',
        'Smuggle contraband through police checkpoints to a secure dropoff.',
        'Transport a high-value package with security details and decoys.',
      ],
      [MissionType.ELIMINATION]: [
        'Take out a small group causing problems in your territory.',
        "Remove a specific target who's been snitching to authorities.",
        "Clean up a rival gang presence that's encroaching on your turf.",
        'Defend your territory from a coordinated attack by eliminating all hostiles.',
        'Assassinate a high-profile target with heavy security and escape undetected.',
      ],
      [MissionType.PROTECTION]: [
        'Provide security for a local business owner paying protection money.',
        'Guard a valuable asset during transport through hostile territory.',
        "Defend your territory from a rival gang's invasion attempt.",
        'Escort a convoy carrying supplies through dangerous territory.',
        'Protect a witness with critical information until they can testify.',
      ],
      [MissionType.INFILTRATION]: [
        'Sneak into a location and gather information without being detected.',
        'Break into a secure facility and steal a specific item.',
        'Bypass security systems to access protected information.',
        'Enter enemy territory to plant incriminating evidence.',
        'Take over a rival business through infiltration and intimidation.',
      ],
      [MissionType.HEIST]: [
        'Rob a convenience store for quick cash with minimal planning.',
        'Hit a jewelry store during business hours, grab what you can and escape.',
        'Break into a bank vault during off-hours with a skilled crew.',
        'Execute a complex casino heist with multiple team roles and escape routes.',
        'Plan and execute the ultimate score at the Federal Reserve.',
      ],
      [MissionType.RACING]: [
        'Prove your driving skills in an impromptu street race circuit.',
        "Win a high-stakes highway sprint against the city's best drivers.",
        'Navigate treacherous terrain in an offroad racing competition.',
        'Weave through city streets in a technical racing challenge.',
        "Compete in an exclusive underground racing tournament with the city's elite.",
      ],
      [MissionType.COLLECTION]: [
        'Collect debts from local businesses who owe protection money.',
        'Gather evidence on rival gang activities across multiple locations.',
        'Acquire necessary supplies for an upcoming faction operation.',
        'Secure critical resources from multiple contested locations.',
        'Track down and capture multiple high-value targets for bounties.',
      ],
      [MissionType.EXPLORATION]: [
        'Locate a hidden cache based on cryptic clues around the city.',
        'Investigate an urban legend that may lead to valuable discoveries.',
        'Find a lost shipment that disappeared under mysterious circumstances.',
        'Discover a secret location mentioned in encrypted communications.',
        'Recover a valuable historical artifact hidden somewhere in the city.',
      ],
      [MissionType.SOCIAL]: [
        'Build connections with local business owners for future opportunities.',
        'Represent your faction in a tense meeting with potential allies.',
        'Establish contact with an underground figure who can provide resources.',
        'Meet with an information broker to exchange valuable intelligence.',
        'Negotiate a complex alliance between multiple factions at a neutral location.',
      ],
    };

    return (
      descriptions[type]?.[index] ||
      `Complete this ${type.toLowerCase()} mission to earn rewards and reputation.`
    );
  }

  /**
   * Get default mission objectives based on type and index
   */
  private getDefaultObjectivesForType(
    type: MissionType,
    index: number
  ): string[] {
    const difficultyFactor = index + 1;

    const baseObjectives = {
      [MissionType.DELIVERY]: [
        'Pick up the package from the marked location',
        'Transport it to the drop-off point',
        'Avoid drawing police attention',
        'Deliver within the time limit',
      ],
      [MissionType.ELIMINATION]: [
        'Locate the target(s)',
        'Eliminate all targets',
        'Avoid civilian casualties',
        'Leave the area without being identified',
      ],
      [MissionType.PROTECTION]: [
        'Meet your VIP at the starting location',
        'Escort them to their destination',
        'Neutralize any threats along the route',
        'Ensure the VIP arrives safely',
      ],
      [MissionType.INFILTRATION]: [
        'Approach the target location undetected',
        'Gain access to the restricted area',
        'Complete your objective inside',
        'Exit without raising alarms',
      ],
      [MissionType.HEIST]: [
        'Case the target location',
        'Acquire necessary equipment',
        'Execute the heist plan',
        'Escape with the goods',
        'Reach the safe house',
      ],
      [MissionType.RACING]: [
        'Arrive at the starting line',
        'Complete all checkpoints in order',
        'Finish in a qualifying position',
        'Avoid severe vehicle damage',
      ],
      [MissionType.COLLECTION]: [
        'Locate all collection points',
        'Acquire the items/information from each point',
        'Deal with any resistance',
        'Return all collected items',
      ],
      [MissionType.EXPLORATION]: [
        'Find the initial clue',
        'Follow the trail of information',
        'Overcome environmental challenges',
        'Discover the final location',
      ],
      [MissionType.SOCIAL]: [
        'Arrive at the meeting location',
        "Present your faction's interests",
        'Negotiate favorable terms',
        'Secure the agreement',
      ],
    };

    // For higher indices, add more complex objectives
    const objectives = [...(baseObjectives[type] || ['Complete the mission'])];

    if (difficultyFactor >= 3) {
      switch (type) {
        case MissionType.DELIVERY:
          objectives.push('Deal with an ambush attempt');
          break;
        case MissionType.ELIMINATION:
          objectives.push('Eliminate the target using a specific method');
          break;
        case MissionType.PROTECTION:
          objectives.push('Handle a betrayal situation');
          break;
        case MissionType.INFILTRATION:
          objectives.push('Download additional data of opportunity');
          break;
        case MissionType.HEIST:
          objectives.push('Deal with unexpected security measures');
          break;
        case MissionType.RACING:
          objectives.push('Perform a specific stunt during the race');
          break;
        case MissionType.COLLECTION:
          objectives.push('Verify the authenticity of collected items');
          break;
        case MissionType.EXPLORATION:
          objectives.push('Document your findings with photos');
          break;
        case MissionType.SOCIAL:
          objectives.push('Maintain faction honor while achieving objectives');
          break;
      }
    }

    if (difficultyFactor >= 5) {
      objectives.push(
        'Complete the mission with perfect execution for bonus rewards'
      );
    }

    return objectives;
  }

  /**
   * Get default mission rewards based on type and index
   */
  // TODO: Implement reward system when needed
  // private getDefaultRewardsForType(
  //   type: MissionType,
  //   index: number
  // ): MissionRewards {
  //   // Convert string rewards to the proper MissionRewards object
  //   const baseRewardStrings = this.getDefaultRewardStringsForType(type, index);

  //   return {
  //     money: (index + 1) * 1000,
  //     experience: (index + 1) * 100,
  //     reputation: (index + 1) * 20,
  //     items: baseRewardStrings.filter(
  //       r => !r.includes('$') && !r.includes('experience')
  //     ),
  //     unlocks: [],
  //   };
  // }

  // private getDefaultRewardStringsForType(
  //   type: MissionType,
  //   index: number
  // ): string[] {
  //   const baseMoney = 1000 * (index + 1);
  //   const baseExp = 100 * (index + 1);
  //   const baseReputation = 50 * (index + 1);

  //   const rewards = [
  //     `$${baseMoney.toLocaleString()} cash payment`,
  //     `${baseExp} experience points`,
  //     `+${baseReputation} faction reputation`,
  //   ];

  //   // Add type-specific rewards for higher difficulty missions
  //   if (index >= 2) {
  //     switch (type) {
  //       case MissionType.DELIVERY:
  //         rewards.push('Discounted vehicle upgrades');
  //         break;
  //       case MissionType.ELIMINATION:
  //         rewards.push('Rare weapon attachment');
  //         break;
  //       case MissionType.PROTECTION:
  //         rewards.push('Armor upgrade voucher');
  //         break;
  //       case MissionType.INFILTRATION:
  //         rewards.push('Advanced lockpick set');
  //         break;
  //       case MissionType.HEIST:
  //         rewards.push('Fence contact for stolen goods');
  //         break;
  //       case MissionType.RACING:
  //         rewards.push('Performance vehicle parts');
  //         break;
  //       case MissionType.COLLECTION:
  //         rewards.push('Expanded inventory capacity');
  //         break;
  //       case MissionType.EXPLORATION:
  //         rewards.push('Detailed city district map');
  //         break;
  //       case MissionType.SOCIAL:
  //         rewards.push('New business contact');
  //         break;
  //     }
  //   }

  //   // Add unique rewards for highest difficulty
  //   if (index >= 4) {
  //     rewards.push('Unique faction cosmetic item');
  //     rewards.push('Access to special faction mission chain');
  //   }

  //   return rewards;
  // }

  /**
   * Generate contextual mission for a player with advanced narrative generation
   */
  async generateAdvancedMission(
    playerId: string,
    context: MissionGenerationContext
  ): Promise<{
    title: string;
    description: string;
    objectives: string[];
    rewards: string[];
    difficulty: number;
    estimatedDuration: number;
    location: string;
    requirements?: string[];
    missionType?: MissionType;
    narrative?: string;
    worldStateImpact?: string[];
  }> {
    try {
      const cacheKey = `mission:${playerId}:${context.difficulty}:${Date.now() / (1000 * 60 * 30)}`; // 30min buckets

      // Check cache for recent missions to avoid repetition
      const recentMissions = await this.getRecentMissions(playerId);

      // Get player character data for personalization
      const character = await this.prisma.character.findUnique({
        where: { id: playerId },
        include: {
          factionMembership: {
            include: { faction: true },
          },
          npcMemories: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!character) {
        throw new Error(`Character ${playerId} not found`);
      }

      // Get world state for environmental context
      const worldState = await this.worldService.getCurrentWorldState(); // Get active world events for mission context
      const worldEvents = await this.worldService.getActiveWorldEvents();

      // Get memory context for narrative continuity
      const memoryContext = await this.memoryService.getMemoryContext(playerId); // Get player playstyle asynchronously
      const playerPlaystyle = await this.determinePlayerPlaystyle(playerId);

      // Determine appropriate mission types based on character and world state
      const appropriateMissionTypes = this.determineMissionTypes(
        character,
        worldState
      );

      // Adjust difficulty based on player level and preferences
      const adjustedDifficulty = this.calculateDynamicDifficulty(
        character.level,
        context.difficulty,
        context.playerPreferences
      );

      // Enhanced context for AI prompt
      const enhancedContext: MissionGenerationContext = {
        ...context,
        playerLevel: character.level,
        difficulty: adjustedDifficulty,
        factionContext: {
          ...context.factionContext,
          factionName:
            character.factionMembership?.faction?.name || 'Independent',
          factionId: character.factionMembership?.factionId,
          location: this.getLocationNameFromCoords(
            character.positionX,
            character.positionY,
            character.positionZ
          ),
          gameState: {
            ...context.factionContext.gameState,
            currentTime: new Date().toLocaleTimeString(),
            weather: worldState.weather,
            economicState: worldState.economicState,
            crimeLevel: worldState.crimeLevel,
            activePlayers: worldState.activePlayers,
            factionWars: worldState.factionWars,
          },
        },
        availableLocations: [
          ...context.availableLocations,
          ...worldEvents.map(e =>
            this.getLocationNameFromCoords(
              e.location.x,
              e.location.y,
              e.location.z
            )
          ),
        ].filter(Boolean),
        recentMissions,
        suggestedMissionTypes: appropriateMissionTypes,
        worldEvents: worldEvents.map(e => e.description),
        playerMemories: memoryContext.recentMemories
          .map(m => m.content)
          .slice(0, 3),
        playerPreferences: {
          ...context.playerPreferences,
          playstyle: playerPlaystyle || context.playerPreferences.playstyle,
        },
      };

      // TODO: Use enhanced prompt for mission generation
      // const prompt = this.buildAdvancedMissionPrompt(enhancedContext);

      // Generate mission using AI with rich context
      const aiResponse = await this.aiService.generateNPCDialogue(
        'mission-generator',
        'generate-narrative-mission',
        {
          characterName: 'Mission Director',
          characterBackground:
            'Advanced narrative AI system for creating immersive mission experiences',
          location: enhancedContext.factionContext.location || 'Los Santos',
          factionName: enhancedContext.factionContext.factionName,
          factionId: enhancedContext.factionContext.factionId,
          playerLevel: enhancedContext.playerLevel,
          gameState: enhancedContext.factionContext.gameState,
          recentEvents: enhancedContext.worldEvents || [],
          relationshipLevel: character.factionMembership?.faction
            ? 'allied'
            : 'neutral',
        }
      );

      // Parse AI response into structured mission data with narrative elements
      const mission = this.parseAdvancedMissionFromAI(
        aiResponse,
        enhancedContext
      );

      // Store mission in database with enhanced metadata
      await this.storeMission(playerId, mission, enhancedContext);

      // Cache the mission for quick access
      await this.cache.setTemporary(cacheKey, mission, this.MISSION_CACHE_TTL);

      // Create memory entry for this mission generation to build continuity
      await this.memoryService.addMemory(
        playerId,
        `Received mission: ${mission.title}. ${mission.description.substring(0, 100)}...`,
        character.factionMembership?.faction?.name || 'Independent', // emotional context
        0.8, // High importance for missions
        'mission' // memory type
      );

      logger.info('Advanced mission generated successfully', {
        playerId,
        missionTitle: mission.title,
        missionType: mission.missionType,
        difficulty: mission.difficulty,
        playerLevel: enhancedContext.playerLevel,
      });

      return mission;
    } catch (error) {
      logger.error('Failed to generate advanced mission', {
        playerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return fallback mission on error with graceful degradation
      return this.getEnhancedFallbackMission(context, playerId);
    }
  }

  /**
   * Build advanced mission prompt with rich narrative context
   */
  // TODO: Implement advanced mission prompt when needed
  /*
  private buildAdvancedMissionPrompt(
    context: MissionGenerationContext
  ): string {
    return `
Generate an immersive, narrative-driven mission for a player in the GangGPT GTA V roleplay server.

Player Context:
- Level: ${context.playerLevel}
- Difficulty Preference: ${context.difficulty}/10
- Faction: ${context.factionContext.factionName || 'Independent'}
- Location: ${context.factionContext.location || 'Los Santos'}
- Playstyle: ${context.playerPreferences.playstyle}
- Preferred Mission Types: ${context.playerPreferences.missionTypes.join(', ')}

Recent Player Memories:
${context.playerMemories?.length ? context.playerMemories.map(m => `- ${m}`).join('\n') : '- No significant memories'}

Recent Missions (avoid repetition):
${context.recentMissions.length ? context.recentMissions.map(m => `- ${m}`).join('\n') : '- No recent missions'}

Current World State:
- Time: ${context.factionContext.gameState?.currentTime || 'Day'}
- Weather: ${context.factionContext.gameState?.weather || 'Clear'}
- Economic State: ${context.factionContext.gameState?.economicState || 'average'}
- Crime Level: ${context.factionContext.gameState?.crimeLevel || 'medium'}
- Active Faction Wars: ${context.factionContext.gameState?.factionWars ? 'Yes' : 'No'}

Active World Events:
${context.worldEvents?.length ? context.worldEvents.map(e => `- ${e}`).join('\n') : '- No significant world events'}

Recommended Mission Types For Current Situation:
${context.suggestedMissionTypes?.join(', ') || 'Any appropriate type'}

Available Locations: ${context.availableLocations.join(', ')}

Mission Requirements:
1. Generate a mission appropriate for level ${context.playerLevel} player
2. Difficulty should be ${context.difficulty}/10
3. Include 3-5 specific objectives
4. Provide 2-4 meaningful rewards
5. Include a compelling narrative that fits the world state
6. Ensure continuity with player's recent experiences
7. Make the mission feel like a natural part of the game world
8. Tie the mission to current world events if appropriate
9. Provide clear consequences for success/failure

Format the response as JSON:
{
    "title": "Mission Title",
    "description": "Detailed mission description",
    "narrative": "Longer backstory and narrative context for the mission",
    "objectives": ["Objective 1", "Objective 2", "Objective 3"],
    "rewards": ["Reward 1", "Reward 2"],
    "difficulty": ${context.difficulty},
    "estimatedDuration": 30,
    "location": "Specific location",
    "missionType": "One of: DELIVERY, ELIMINATION, PROTECTION, INFILTRATION, HEIST, RACING, COLLECTION, EXPLORATION, SOCIAL",
    "requirements": ["Optional requirement 1"],
    "worldStateImpact": ["How this mission affects the world state"]
}
`.trim();
  }
  */

  /**
   * Parse advanced mission from AI response
   */
  private parseAdvancedMissionFromAI(
    aiResponse: AIResponse,
    context: MissionGenerationContext
  ): any {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const missionData = JSON.parse(jsonMatch[0]);

        // Validate mission type
        let missionType: MissionType;
        try {
          missionType = this.validateMissionType(missionData.missionType);
        } catch (error) {
          missionType = this.inferMissionTypeFromContent(
            missionData.description,
            missionData.objectives
          );
        }

        // Validate and sanitize the mission data
        return {
          title: missionData.title || 'Generated Mission',
          description: missionData.description || 'A challenging task awaits.',
          objectives: Array.isArray(missionData.objectives)
            ? missionData.objectives
            : ['Complete the mission'],
          rewards: Array.isArray(missionData.rewards)
            ? missionData.rewards
            : ['Experience points'],
          difficulty: Math.max(
            1,
            Math.min(10, missionData.difficulty || context.difficulty)
          ),
          estimatedDuration: missionData.estimatedDuration || 30,
          location:
            missionData.location ||
            context.availableLocations[0] ||
            'Los Santos',
          requirements: missionData.requirements || [],
          missionType,
          narrative: missionData.narrative || missionData.description,
          worldStateImpact: Array.isArray(missionData.worldStateImpact)
            ? missionData.worldStateImpact
            : ['Minor reputation changes'],
        };
      }
    } catch (error) {
      logger.warn('Failed to parse AI mission response as JSON', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Fallback to advanced text parsing
    return this.parseAdvancedTextMission(aiResponse.content, context);
  }

  /**
   * Parse advanced text-based mission response
   */
  private parseAdvancedTextMission(
    content: string,
    context: MissionGenerationContext
  ): any {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const title =
      lines
        .find(line => line.includes('Title:') || line.includes('Mission:'))
        ?.split(':')[1]
        ?.trim() || 'Generated Mission';
    let description = '';
    const objectives: string[] = [];
    const rewards: string[] = [];

    // Simple parser for non-JSON format
    let currentSection = '';
    for (const line of lines) {
      if (line.includes('Description:')) {
        currentSection = 'description';
        description = line.split(':')[1]?.trim() || '';
        continue;
      } else if (line.includes('Objectives:')) {
        currentSection = 'objectives';
        continue;
      } else if (line.includes('Rewards:')) {
        currentSection = 'rewards';
        continue;
      } else if (line.includes('Location:')) {
        currentSection = '';
        continue;
      }

      if (currentSection === 'description' && !line.includes(':')) {
        description += ` ${line}`;
      } else if (currentSection === 'objectives' && line.startsWith('-')) {
        objectives.push(line.substring(1).trim());
      } else if (currentSection === 'rewards' && line.startsWith('-')) {
        rewards.push(line.substring(1).trim());
      }
    }

    // Infer mission type from content
    const missionType = this.inferMissionTypeFromContent(
      description,
      objectives
    );

    return {
      title,
      description: description || `${content.substring(0, 200)}...`,
      objectives: objectives.length
        ? objectives
        : ['Complete the assigned task', 'Return for payment'],
      rewards: rewards.length ? rewards : ['Cash payment', 'Experience points'],
      difficulty: context.difficulty,
      estimatedDuration: 30,
      location: context.availableLocations[0] || 'Los Santos',
      requirements: [],
      missionType,
      narrative: description,
      worldStateImpact: ['Minor faction reputation changes'],
    };
  }

  /**
   * Get enhanced fallback mission with narrative elements
   */
  private getEnhancedFallbackMission(
    context: MissionGenerationContext,
    _playerId: string
  ): any {
    try {
      // Try to get cached templates first
      const missionTypes = Object.values(MissionType);
      const randomType =
        missionTypes[Math.floor(Math.random() * missionTypes.length)];
      const cacheKey = `mission-templates:${randomType}`;

      return this.cache
        .getTemporary<any[]>(cacheKey)
        .then(templates => {
          if (templates && templates.length) {
            // Get template matching closest to requested difficulty
            const sortedByDifficultyMatch = [...templates].sort(
              (a, b) =>
                Math.abs(a.difficulty - context.difficulty) -
                Math.abs(b.difficulty - context.difficulty)
            );
            const template = sortedByDifficultyMatch[0];

            // Customize the template slightly
            return {
              ...template,
              estimatedDuration:
                template.estimatedDuration + Math.floor(Math.random() * 10),
              location: context.availableLocations[0] || template.location,
              narrative: `This mission is part of your journey in ${context.factionContext.factionName || 'Los Santos'}. ${template.description}`,
              worldStateImpact: ['Minor changes to local area reputation'],
            };
          } else {
            throw new Error('No cached templates found');
          }
        })
        .catch(() => {
          // Ultimate fallback - hardcoded mission
          const fallbackMissions = [
            {
              title: 'Package Delivery',
              description:
                'Deliver a package to a contact across the city. No questions asked.',
              objectives: [
                'Pick up package from contact',
                'Deliver to specified location',
                'Avoid police attention',
              ],
              rewards: ['$2,500 cash', '150 experience points'],
              difficulty: Math.min(context.difficulty, 3),
              estimatedDuration: 20,
              location: 'Downtown Los Santos',
              missionType: MissionType.DELIVERY,
              narrative:
                'A local business owner needs a package delivered without drawing attention. The contents are unknown, but the pay is good for a simple job.',
              worldStateImpact: ['Slight increase in contact reputation'],
            },
            {
              title: 'Territory Scout',
              description:
                'Scout a rival faction territory and report back with intelligence.',
              objectives: [
                'Infiltrate target area',
                'Gather intelligence',
                'Report findings safely',
              ],
              rewards: [
                '$3,000 cash',
                '200 experience points',
                'Faction reputation',
              ],
              difficulty: Math.min(context.difficulty, 5),
              estimatedDuration: 35,
              location: 'East Los Santos',
              missionType: MissionType.INFILTRATION,
              narrative:
                'Tensions are rising between factions, and information is power. Your faction needs eyes on rival territory to plan future operations.',
              worldStateImpact: ['Increases tension between factions'],
            },
            {
              title: 'Street Race Challenge',
              description:
                'Prove your driving skills in an underground racing circuit.',
              objectives: [
                'Reach the starting point',
                'Win the race against NPC competitors',
                'Avoid police detection',
              ],
              rewards: [
                '$4,000 cash',
                '180 experience points',
                'Vehicle performance part',
              ],
              difficulty: Math.min(context.difficulty, 4),
              estimatedDuration: 25,
              location: 'Vinewood Hills',
              missionType: MissionType.RACING,
              narrative:
                "The underground racing scene is heating up, and there's money to be made for skilled drivers. Show them what you've got and build your reputation on the streets.",
              worldStateImpact: [
                'Increases street racing activity in the area',
              ],
            },
          ];

          return fallbackMissions[
            Math.floor(Math.random() * fallbackMissions.length)
          ];
        });
    } catch (error) {
      logger.error('Failed to get enhanced fallback mission', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Ultimate fallback if everything else fails
      return {
        title: 'Quick Job',
        description: 'A simple task that needs handling right away.',
        objectives: ['Complete the task', 'Report back for payment'],
        rewards: ['Cash payment', 'Experience points'],
        difficulty: Math.min(context.difficulty, 2),
        estimatedDuration: 15,
        location: 'Los Santos',
        missionType: MissionType.DELIVERY,
        narrative:
          'Sometimes the simplest jobs are the most reliable. Nothing fancy, just work that needs doing.',
        worldStateImpact: ['No significant impact'],
      };
    }
  }

  /**
   * Validate mission type from string
   */
  private validateMissionType(typeString: string): MissionType {
    // Try to match the string to enum values
    const normalizedType = typeString.toUpperCase();

    // Check if it's a valid enum value
    if (Object.values(MissionType).includes(normalizedType as MissionType)) {
      return normalizedType as MissionType;
    }

    // Try to match based on partial string
    for (const type of Object.values(MissionType)) {
      if (normalizedType.includes(type as string)) {
        return type;
      }
    }

    throw new Error(`Invalid mission type: ${typeString}`);
  }

  /**
   * Infer mission type from content
   */
  private inferMissionTypeFromContent(
    description: string,
    objectives: string[]
  ): MissionType {
    const content = `${description} ${objectives.join(' ')}`.toLowerCase();

    // Keyword matching for mission types
    const typeKeywords: Record<MissionType, string[]> = {
      [MissionType.DELIVERY]: [
        'deliver',
        'package',
        'transport',
        'cargo',
        'shipment',
      ],
      [MissionType.ELIMINATION]: [
        'eliminate',
        'kill',
        'take out',
        'assassinate',
        'neutralize',
      ],
      [MissionType.PROTECTION]: [
        'protect',
        'guard',
        'defend',
        'escort',
        'secure',
      ],
      [MissionType.INFILTRATION]: [
        'infiltrate',
        'sneak',
        'break in',
        'access',
        'stealth',
      ],
      [MissionType.HEIST]: ['heist', 'rob', 'steal', 'theft', 'score'],
      [MissionType.RACING]: [
        'race',
        'driving',
        'speed',
        'car',
        'vehicle',
        'checkpoint',
      ],
      [MissionType.COLLECTION]: [
        'collect',
        'gather',
        'find',
        'retrieve',
        'obtain',
      ],
      [MissionType.EXPLORATION]: [
        'explore',
        'discover',
        'investigate',
        'search',
        'locate',
      ],
      [MissionType.SOCIAL]: [
        'meet',
        'negotiate',
        'talk',
        'convince',
        'alliance',
        'contact',
      ],
    };

    // Score each mission type based on keyword frequency
    const scores: Record<MissionType, number> = Object.fromEntries(
      Object.entries(typeKeywords).map(([type, keywords]) => [
        type,
        keywords.reduce((score, keyword) => {
          const regex = new RegExp(keyword, 'gi');
          const matches = content.match(regex);
          return score + (matches ? matches.length : 0);
        }, 0),
      ])
    ) as Record<MissionType, number>; // Find the type with highest score
    let bestType: MissionType = MissionType.DELIVERY; // Default
    let bestScore = 0;
    for (const [type, score] of Object.entries(scores)) {
      if (
        score > bestScore &&
        Object.values(MissionType).includes(type as MissionType)
      ) {
        bestScore = score;
        bestType = type as MissionType;
      }
    }

    return bestType;
  }

  /**
   * Calculate dynamic difficulty based on player level and preferences
   */
  private calculateDynamicDifficulty(
    playerLevel: number,
    requestedDifficulty: number,
    preferences: PlayerPreferences
  ): number {
    // Base difficulty from request
    let difficulty = requestedDifficulty;

    // Adjust for player level - higher levels can handle more difficulty
    const levelAdjustment = Math.floor(playerLevel / 10); // +1 per 10 levels
    difficulty += levelAdjustment;

    // Adjust based on player preference
    switch (preferences.difficultyPreference) {
      case 'easy':
        difficulty -= 1;
        break;
      case 'hard':
        difficulty += 1;
        break;
      case 'extreme':
        difficulty += 2;
        break;
    }

    // Cap difficulty between 1-10
    return Math.max(1, Math.min(10, difficulty));
  }

  /**
   * Determine appropriate mission types based on character and world state
   */
  private determineMissionTypes(
    character: any,
    worldState: any
  ): MissionType[] {
    const appropriateTypes: MissionType[] = [];

    // Add types based on faction membership
    if (character.factionMembership) {
      appropriateTypes.push(MissionType.PROTECTION, MissionType.ELIMINATION);

      if (
        worldState.factionWars?.some(
          (war: any) =>
            war.factionId === character.factionMembership.factionId ||
            war.targetId === character.factionMembership.factionId
        )
      ) {
        appropriateTypes.push(MissionType.INFILTRATION);
      }
    } else {
      // Independent players get more varied options
      appropriateTypes.push(
        MissionType.DELIVERY,
        MissionType.COLLECTION,
        MissionType.RACING
      );
    }

    // Add types based on world state
    if (worldState.economicState?.businessActivity < 30) {
      appropriateTypes.push(MissionType.HEIST);
    }

    if (
      worldState.activeWorldEvents?.some(
        (e: any) => e.type === 'territory_conflict'
      )
    ) {
      appropriateTypes.push(MissionType.INFILTRATION, MissionType.PROTECTION);
    }

    // Add exploration for new players
    if (character.level < 10) {
      appropriateTypes.push(MissionType.EXPLORATION);
    }

    // Add social missions for higher level players
    if (character.level > 20) {
      appropriateTypes.push(MissionType.SOCIAL);
    }

    // Ensure we have at least 3 types
    if (appropriateTypes.length < 3) {
      const allTypes = Object.values(MissionType);
      while (appropriateTypes.length < 3) {
        const randomType =
          allTypes[Math.floor(Math.random() * allTypes.length)];
        if (randomType && !appropriateTypes.includes(randomType)) {
          appropriateTypes.push(randomType);
        }
      }
    }

    return appropriateTypes;
  }

  /**
   * Get recent missions for a player to avoid repetition
   */
  private async getRecentMissions(playerId: string): Promise<string[]> {
    try {
      const recentMissions = await this.prisma.mission.findMany({
        where: {
          assignedToId: playerId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          title: true,
          type: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return recentMissions.map(mission => `${mission.type}: ${mission.title}`);
    } catch (error) {
      logger.warn('Failed to fetch recent missions', { playerId, error });
      return [];
    }
  }

  /**
   * Store generated mission in database
   */
  private async storeMission(
    playerId: string,
    mission: any,
    _context: MissionGenerationContext
  ): Promise<string> {
    try {
      const storedMission = await this.prisma.mission.create({
        data: {
          characterId: playerId,
          title: mission.title,
          description: mission.description,
          type: mission.missionType || 'DELIVERY',
          status: 'AVAILABLE',
          difficulty: mission.difficulty,
          rewards: mission.rewards,
          requirements: mission.requirements || [],
          assignedToId: playerId,
          location: mission.location,
          objectives: mission.objectives,
          estimatedDuration: mission.estimatedDuration || 30,
        },
      });

      // Cache the mission
      await this.cache.setTemporary(
        `mission:${storedMission.id}`,
        storedMission,
        this.MISSION_CACHE_TTL
      );

      logger.info('Mission stored successfully', {
        missionId: storedMission.id,
        playerId,
        type: mission.missionType,
      });

      return storedMission.id;
    } catch (error) {
      logger.error('Failed to store mission', { playerId, error });
      throw error;
    }
  }

  /**
   * Determine player playstyle based on recent mission choices
   */
  private async determinePlayerPlaystyle(
    playerId: string
  ): Promise<'aggressive' | 'stealth' | 'diplomatic' | 'mixed' | undefined> {
    try {
      const recentMissions = await this.prisma.mission.findMany({
        where: {
          assignedToId: playerId,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          type: true,
          completedAt: true,
        },
        take: 20,
      });

      if (recentMissions.length === 0) {
        return undefined;
      }

      // Analyze mission types to determine playstyle
      const missionTypeCounts: Record<string, number> = {};
      recentMissions.forEach(mission => {
        missionTypeCounts[mission.type] =
          (missionTypeCounts[mission.type] || 0) + 1;
      });

      const eliminationCount = missionTypeCounts['ELIMINATION'] || 0;
      const infiltrationCount = missionTypeCounts['INFILTRATION'] || 0;
      const socialCount = missionTypeCounts['SOCIAL'] || 0;
      const deliveryCount = missionTypeCounts['DELIVERY'] || 0;

      const total = recentMissions.length;

      // Determine playstyle based on mission preferences
      if (eliminationCount / total > 0.4) return 'aggressive';
      if (infiltrationCount / total > 0.4) return 'stealth';
      if (socialCount / total > 0.4) return 'diplomatic';
      if (deliveryCount / total > 0.3 && socialCount / total > 0.2)
        return 'diplomatic';

      return 'mixed';
    } catch (error) {
      logger.warn('Failed to determine player playstyle', { playerId, error });
      return 'mixed';
    }
  }

  /**
   * Get location name from coordinates using world service
   */
  private getLocationNameFromCoords(x: number, y: number, z: number): string {
    return this.worldService.getLocationNameFromCoordinates(x, y, z);
  }
}

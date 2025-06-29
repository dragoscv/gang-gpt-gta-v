import { describe, it, expect } from 'vitest';
import type {
  AIServiceConfig,
  MissionType,
  AIResponse,
  AIPromptContext,
  NPC,
  NPCPersonality,
  NPCMemoryEntry,
  NPCEmotionalState,
  AICompanionMemory,
  AIConversationContext,
  AIGeneratedMission,
  ContentFilterConfig,
  ContentFilterResult,
  MissionGenerationContext,
  ContentModerationLevel,
} from './ai';

describe('AI Types', () => {
  describe('AIServiceConfig', () => {
    it('should define correct structure for AI service configuration', () => {
      const config: AIServiceConfig = {
        apiKey: 'test-api-key',
        endpoint: 'https://api.openai.com',
        apiVersion: '2024-02-01',
        model: 'gpt-4',
        maxTokens: 150,
      };

      expect(config.apiKey).toBe('test-api-key');
      expect(config.endpoint).toBe('https://api.openai.com');
      expect(config.apiVersion).toBe('2024-02-01');
      expect(config.model).toBe('gpt-4');
      expect(config.maxTokens).toBe(150);
    });
  });

  describe('MissionType', () => {
    it('should include all valid mission types', () => {
      const validTypes: MissionType[] = [
        'DELIVERY',
        'ELIMINATION',
        'PROTECTION',
        'INFILTRATION',
        'HEIST',
        'RACING',
        'COLLECTION',
        'EXPLORATION',
        'SOCIAL',
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });

      expect(validTypes).toHaveLength(9);
    });

    it('should assign mission types correctly', () => {
      const deliveryMission: MissionType = 'DELIVERY';
      const heistMission: MissionType = 'HEIST';

      expect(deliveryMission).toBe('DELIVERY');
      expect(heistMission).toBe('HEIST');
    });
  });

  describe('AIResponse', () => {
    it('should define correct structure for AI responses', () => {
      const response: AIResponse = {
        content: 'This is an AI-generated response',
        tokensUsed: 75,
        model: 'gpt-4',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        error: false,
      };

      expect(response.content).toBe('This is an AI-generated response');
      expect(response.tokensUsed).toBe(75);
      expect(response.model).toBe('gpt-4');
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.error).toBe(false);
    });

    it('should handle error responses', () => {
      const errorResponse: AIResponse = {
        content: 'Error occurred',
        tokensUsed: 0,
        model: 'gpt-4',
        timestamp: new Date(),
        error: true,
      };

      expect(errorResponse.error).toBe(true);
      expect(errorResponse.tokensUsed).toBe(0);
    });
  });

  describe('AIPromptContext', () => {
    it('should define optional context properties', () => {
      const context: AIPromptContext = {
        characterName: 'John Doe',
        characterBackground: 'Street-smart mechanic',
        location: 'Los Santos Customs',
        factionName: 'The Lost MC',
        factionId: 'faction-123',
        relationshipLevel: 'friendly',
        recentEvents: ['Completed a delivery mission', 'Won a street race'],
        npcRole: 'mechanic',
        mood: 'excited',
        playerLevel: 15,
      };

      expect(context.characterName).toBe('John Doe');
      expect(context.location).toBe('Los Santos Customs');
      expect(context.recentEvents).toHaveLength(2);
      expect(context.playerLevel).toBe(15);
    });

    it('should work with minimal context', () => {
      const minimalContext: AIPromptContext = {};

      expect(minimalContext.characterName).toBeUndefined();
      expect(minimalContext.location).toBeUndefined();
    });
  });

  describe('NPC Interface', () => {
    it('should define NPC structure correctly', () => {
      const npc: NPC = {
        id: 'npc-123',
        name: 'Tommy Vercetti',
        role: 'gang_leader',
        personality: {
          traits: ['aggressive', 'ambitious', 'loyal'],
          values: ['respect', 'power', 'family'],
          speechPattern: 'Direct and commanding',
          humor: 'Dark humor',
          formality: 'casual',
        },
        emotionalState: {
          currentMood: 'confident',
          stress: 3,
          energy: 8,
          aggression: 7,
          trust: 5,
        },
        backstory: 'Former military turned crime boss',
        currentLocation: 'Vice City',
        factionId: 'vercetti-crime-family',
        relationshipWithPlayer: 'ally',
        lastInteraction: new Date('2024-01-01'),
        isActive: true,
      };

      expect(npc.id).toBe('npc-123');
      expect(npc.name).toBe('Tommy Vercetti');
      expect(npc.personality.traits).toContain('aggressive');
      expect(npc.emotionalState.currentMood).toBe('confident');
      expect(npc.isActive).toBe(true);
    });
  });

  describe('NPCPersonality', () => {
    it('should define personality traits structure', () => {
      const personality: NPCPersonality = {
        traits: ['intelligent', 'cautious', 'resourceful'],
        values: ['justice', 'loyalty', 'knowledge'],
        speechPattern: 'Analytical and precise',
        humor: 'Witty and sarcastic',
        formality: 'formal',
      };

      expect(personality.traits).toHaveLength(3);
      expect(personality.values).toContain('justice');
      expect(personality.formality).toBe('formal');
    });
  });

  describe('NPCEmotionalState', () => {
    it('should define emotional metrics', () => {
      const state: NPCEmotionalState = {
        currentMood: 'anxious',
        stress: 7,
        energy: 4,
        aggression: 2,
        trust: 6,
      };

      expect(state.currentMood).toBe('anxious');
      expect(state.stress).toBe(7);
      expect(state.energy).toBe(4);
      expect(state.aggression).toBe(2);
      expect(state.trust).toBe(6);
    });
  });

  describe('NPCMemoryEntry', () => {
    it('should define memory structure', () => {
      const memory: NPCMemoryEntry = {
        id: 'memory-123',
        npcId: 'npc-456',
        playerId: 'player-789',
        content: 'Player helped me with a delivery mission',
        type: 'interaction',
        importance: 8,
        emotional_impact: 'positive',
        timestamp: new Date('2024-01-01'),
        decay: 0.1,
      };

      expect(memory.content).toBe('Player helped me with a delivery mission');
      expect(memory.type).toBe('interaction');
      expect(memory.importance).toBe(8);
      expect(memory.emotional_impact).toBe('positive');
    });
  });

  describe('AICompanionMemory', () => {
    it('should define companion memory structure', () => {
      const companionMemory: AICompanionMemory = {
        playerId: 'player-123',
        companionId: 'companion-456',
        memories: [
          {
            timestamp: new Date(),
            event: 'First meeting',
            emotion: 'curious',
            importance: 7,
            context: 'Player approached companion in garage',
          },
        ],
        personality: {
          traits: ['helpful', 'tech-savvy'],
          preferences: ['cars', 'gadgets'],
          quirks: ['Speaks in technical jargon'],
        },
        relationshipLevel: 'acquaintance',
        trustLevel: 5,
        lastInteraction: new Date(),
      };

      expect(companionMemory.playerId).toBe('player-123');
      expect(companionMemory.memories).toHaveLength(1);
      expect(companionMemory.relationshipLevel).toBe('acquaintance');
      expect(companionMemory.trustLevel).toBe(5);
    });
  });

  describe('AIConversationContext', () => {
    it('should define conversation context', () => {
      const context: AIConversationContext = {
        playerId: 'player-123',
        npcId: 'npc-456',
        location: 'Downtown garage',
        previousMessages: [
          { speaker: 'player', content: 'Hey, can you help me fix this car?' },
          { speaker: 'npc', content: 'Sure, let me take a look at it.' },
        ],
        currentMission: {
          id: 'mission-789',
          type: 'DELIVERY',
          status: 'in_progress',
        },
        playerStats: {
          level: 15,
          reputation: 75,
          money: 5000,
        },
        environmentalFactors: {
          timeOfDay: 'afternoon',
          weather: 'sunny',
          crowdLevel: 'moderate',
        },
      };

      expect(context.location).toBe('Downtown garage');
      expect(context.previousMessages).toHaveLength(2);
      expect(context.currentMission?.type).toBe('DELIVERY');
      expect(context.playerStats.level).toBe(15);
    });
  });

  describe('AIGeneratedMission', () => {
    it('should define generated mission structure', () => {
      const mission: AIGeneratedMission = {
        title: 'The Fast Delivery',
        description: 'Deliver a package across the city without getting caught',
        type: 'DELIVERY',
        difficulty: 'medium',
        estimatedDuration: 30,
        rewards: {
          money: 1500,
          xp: 300,
          items: ['Racing Stripes'],
        },
        requirements: {
          minimumLevel: 10,
          requiredItems: [],
          factionAffiliation: 'street_racers',
        },
        objectives: [
          'Pick up package from warehouse',
          'Avoid police detection',
          'Deliver to contact in 30 minutes',
        ],
        location: {
          startPoint: 'Industrial District Warehouse',
          endPoint: 'Downtown Office Building',
          area: 'Los Santos',
        },
        npcCharacters: [
          {
            name: 'Fast Eddie',
            role: 'contact',
            dialogueHints: ['speaks quickly', 'nervous energy'],
          },
        ],
      };

      expect(mission.title).toBe('The Fast Delivery');
      expect(mission.type).toBe('DELIVERY');
      expect(mission.objectives).toHaveLength(3);
      expect(mission.rewards.money).toBe(1500);
    });
  });

  describe('ContentFilterConfig', () => {
    it('should define content filter configuration', () => {
      const config: ContentFilterConfig = {
        enabled: true,
        moderationLevel: 'strict',
        blockedWords: ['inappropriate', 'offensive'],
        allowedTopics: ['gaming', 'cars', 'missions'],
        maxMessageLength: 500,
        enableProfanityFilter: true,
        enableToxicityDetection: true,
      };

      expect(config.enabled).toBe(true);
      expect(config.moderationLevel).toBe('strict');
      expect(config.blockedWords).toContain('inappropriate');
      expect(config.maxMessageLength).toBe(500);
    });
  });

  describe('ContentFilterResult', () => {
    it('should define filter result structure', () => {
      const result: ContentFilterResult = {
        isAllowed: false,
        filteredContent: 'This message was filtered',
        reasons: ['contains_profanity', 'exceeds_length_limit'],
        confidence: 0.95,
        flaggedTerms: ['badword1', 'badword2'],
      };

      expect(result.isAllowed).toBe(false);
      expect(result.reasons).toHaveLength(2);
      expect(result.confidence).toBe(0.95);
      expect(result.flaggedTerms).toContain('badword1');
    });
  });

  describe('MissionGenerationContext', () => {
    it('should define mission generation context', () => {
      const context: MissionGenerationContext = {
        playerId: 'player-123',
        playerLevel: 20,
        playerFaction: 'street_racers',
        currentLocation: 'Los Santos',
        availableVehicles: ['sports_car', 'motorcycle'],
        recentMissions: ['delivery_001', 'race_002'],
        playerPreferences: {
          missionTypes: ['RACING', 'DELIVERY'],
          difficultyLevel: 'medium',
          timeCommitment: 'short',
        },
        worldState: {
          time: 'night',
          weather: 'rain',
          trafficLevel: 'heavy',
        },
        factionRelationships: {
          allies: ['garage_crew'],
          enemies: ['rival_racers'],
          neutral: ['civilians'],
        },
      };

      expect(context.playerLevel).toBe(20);
      expect(context.availableVehicles).toContain('sports_car');
      expect(context.playerPreferences.missionTypes).toContain('RACING');
      expect(context.worldState.weather).toBe('rain');
    });
  });

  describe('ContentModerationLevel', () => {
    it('should include all moderation levels', () => {
      const levels: ContentModerationLevel[] = [
        'permissive',
        'moderate',
        'strict',
      ];

      expect(levels).toContain('permissive');
      expect(levels).toContain('moderate');
      expect(levels).toContain('strict');
      expect(levels).toHaveLength(3);
    });
  });
});

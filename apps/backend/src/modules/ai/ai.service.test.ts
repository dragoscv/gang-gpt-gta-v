import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIService } from './ai.service';
import { PrismaClient } from '@prisma/client';
import { CacheManager } from '../../infrastructure/cache';
import { ContentFilter } from './content-filter.service';
import { MemoryService } from './memory.service';
import { measureAiRequest } from '../../infrastructure/monitoring';
import { logger } from '../../infrastructure/logging';
import type { AIServiceConfig, AIPromptContext } from '../../shared/types/ai';

// Mock OpenAI response
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: 'Hello there!',
      },
    },
  ],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 20,
    total_tokens: 70,
  },
};

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue(mockOpenAIResponse),
    },
  },
};

// Mock external dependencies
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => mockOpenAI),
  };
});

vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../infrastructure/monitoring', () => ({
  measureAiRequest: vi.fn(),
}));

vi.mock('./content-filter.service', () => ({
  ContentFilter: vi.fn(),
}));
vi.mock('./memory.service', () => ({
  MemoryService: vi.fn(),
}));

// Mock Prisma and Cache
const mockPrisma = {} as PrismaClient;
const mockCache = {} as CacheManager;

// Mock AI Service Config
const mockConfig: AIServiceConfig = {
  apiKey: 'test-api-key',
  endpoint: 'https://test.openai.azure.com',
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  apiVersion: '2024-02-01',
};

describe('AIService', () => {
  let aiService: AIService;
  let mockContentFilter: any;
  let mockMemoryService: any;
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup measureAiRequest mock to return the expected response structure
    vi.mocked(measureAiRequest).mockImplementation(
      async (operation, model, fn) => {
        // Call the function and return just the result, as measureAiRequest does
        const { result } = await fn();
        return result;
      }
    );

    // Reset OpenAI mock to default successful response
    mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

    // Setup content filter mock
    mockContentFilter = {
      filterContent: vi.fn().mockResolvedValue({
        isAppropriate: true,
        flaggedCategories: [],
        confidence: 0.9,
        severity: 'none',
        contextualFlags: [],
        suggestedAlternative: null,
      }),
    };
    vi.mocked(ContentFilter).mockImplementation(() => mockContentFilter); // Setup memory service mock
    mockMemoryService = {
      getMemoryContext: vi.fn().mockResolvedValue({
        recentMemories: [],
        relationships: [], // Array of RelationshipMemory
        emotionalState: {
          happiness: 0.5,
          anger: 0.2,
          fear: 0.1,
          excitement: 0.4,
          stress: 0.3,
          confidence: 0.6,
          dominantEmotion: 'neutral',
        },
        personalityTraits: {
          aggressiveness: 0.3,
          loyalty: 0.7,
          intelligence: 0.8,
          greed: 0.4,
          humor: 0.6,
          trustworthiness: 0.8,
        },
      }),
      storeInteraction: vi.fn().mockResolvedValue(undefined),
      addMemory: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(MemoryService).mockImplementation(() => mockMemoryService);

    aiService = new AIService(mockConfig, mockPrisma, mockCache);
  });
  afterEach(() => {
    // Reset individual mocks but preserve the OpenAI constructor mock
    vi.mocked(measureAiRequest).mockClear();
    vi.mocked(logger.info).mockClear();
    vi.mocked(logger.error).mockClear();
    mockContentFilter.filterContent.mockClear();
    mockMemoryService.getMemoryContext.mockClear();
    mockMemoryService.storeInteraction.mockClear();
    mockMemoryService.addMemory.mockClear();
    // Don't reset the OpenAI mock itself, just clear the method
    mockOpenAI.chat.completions.create.mockClear();
  });
  describe('generateCompanionResponse', () => {
    it('should generate a companion response successfully', async () => {
      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 10,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      }; // Let's wrap the call in a try-catch to see the actual error
      try {
        const result = await aiService.generateCompanionResponse(
          'companion-1',
          'Hello!',
          context
        );

        expect(result.content).toBe('Hello there!');
        expect(result.tokensUsed).toBe(70);
        expect(result.model).toBe('gpt-4o-mini');

        expect(mockContentFilter.filterContent).toHaveBeenCalledWith('Hello!');
        expect(mockMemoryService.getMemoryContext).toHaveBeenCalledWith(
          'companion-1'
        );
        expect(mockMemoryService.addMemory).toHaveBeenCalled();
      } catch (error) {
        console.log('Caught error in test:', error);
        throw error;
      }
    });
    it('should handle inappropriate content', async () => {
      // Override the content filter mock for this test
      mockContentFilter.filterContent.mockResolvedValueOnce({
        isAppropriate: false,
        flaggedCategories: ['inappropriate'],
        confidence: 0.9,
        severity: 'medium',
        contextualFlags: [],
        suggestedAlternative: "I'd rather not discuss that.",
      });

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 10,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      };

      const result = await aiService.generateCompanionResponse(
        'companion-1',
        'bad content',
        context
      );

      expect(result.content).toBe("I'd rather not discuss that.");
      expect(result.tokensUsed).toBe(0);
    });
    it('should handle OpenAI API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 10,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      };

      const result = await aiService.generateCompanionResponse(
        'companion-1',
        'Hello!',
        context
      );

      // Should return fallback response with error flag
      expect(result.error).toBe(true);
      expect(result.content).toBe(
        "I'm having trouble thinking right now. Let me gather my thoughts and try again."
      );
      expect(result.tokensUsed).toBe(0);
    });
  });
  describe('generateNPCDialogue', () => {
    it('should generate NPC dialogue successfully', async () => {
      const npcResponse = {
        choices: [
          {
            message: {
              content: 'Hello, welcome to my shop!',
            },
          },
        ],
        usage: {
          prompt_tokens: 40,
          completion_tokens: 15,
          total_tokens: 55,
        },
      };

      // Override measureAiRequest for this specific test
      vi.mocked(measureAiRequest).mockImplementationOnce(
        async (operation, model, fn) => {
          return npcResponse;
        }
      );

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Gun Shop',
        npcRole: 'shop-keeper',
        gameState: {
          currentTime: '14:00',
          weather: 'cloudy',
          activePlayers: 5,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'medium',
        },
      };

      const result = await aiService.generateNPCDialogue(
        'npc-1',
        'greeting',
        context
      );

      expect(result.content).toBe('Hello, welcome to my shop!');
      expect(result.tokensUsed).toBe(55);
      expect(result.model).toBe('gpt-4o-mini');
    });
  });
  describe('generateMission', () => {
    it('should generate a mission successfully', async () => {
      const missionContent = JSON.stringify({
        title: 'Test Mission',
        description: 'A test mission for you',
        objectives: ['Objective 1', 'Objective 2'],
        difficulty: 'medium',
        estimatedDuration: '30 minutes',
      });

      const missionResponse = {
        choices: [
          {
            message: {
              content: missionContent,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }; // Mock the OpenAI client directly since generateMission doesn't use measureAiRequest
      mockOpenAI.chat.completions.create.mockResolvedValueOnce(missionResponse);

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        playerLevel: 5,
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 15,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      };
      const result = await aiService.generateMission(
        5, // difficulty
        context,
        5 // playerLevel
      );
      expect(result.content).toContain('Test Mission');
      expect(result.tokensUsed).toBe(150);
      expect(result.model).toBe('gpt-4o-mini');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
          response_format: { type: 'json_object' },
        })
      );
    });
  });
  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const contentResponse = {
        choices: [
          {
            message: {
              content: 'Generated content response',
            },
          },
        ],
        usage: {
          prompt_tokens: 60,
          completion_tokens: 25,
          total_tokens: 85,
        },
      }; // Mock the OpenAI client directly since generateContent doesn't use measureAiRequest
      mockOpenAI.chat.completions.create.mockResolvedValueOnce(contentResponse);

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Downtown',
        gameState: {
          currentTime: '20:00',
          weather: 'clear',
          activePlayers: 8,
          factionWars: true,
          economicState: 'wealthy',
          crimeLevel: 'high',
        },
      };
      const result = await aiService.generateContent(
        'A faction war has started',
        context
      );
      expect(result.content).toBe('Generated content response');
      expect(result.tokensUsed).toBe(85);
      expect(result.model).toBe('gpt-4o-mini');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });
  });
  describe('error handling', () => {
    it('should handle missing response choices', async () => {
      const emptyResponse = {
        choices: [],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 0,
          total_tokens: 50,
        },
      };

      // Override measureAiRequest for this specific test
      vi.mocked(measureAiRequest).mockImplementationOnce(
        async (operation, model, fn) => {
          return emptyResponse;
        }
      );

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 10,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      };

      const result = await aiService.generateCompanionResponse(
        'companion-1',
        'Hello!',
        context
      );

      // Should return fallback response with error flag
      expect(result.error).toBe(true);
      expect(result.content).toBe(
        "I'm having trouble thinking right now. Let me gather my thoughts and try again."
      );
      expect(result.tokensUsed).toBe(0);
    });

    it('should handle content filter service errors', async () => {
      mockContentFilter.filterContent.mockRejectedValue(
        new Error('Filter error')
      );

      const context: AIPromptContext = {
        characterName: 'TestPlayer',
        location: 'Los Santos',
        gameState: {
          currentTime: '12:00',
          weather: 'sunny',
          activePlayers: 10,
          factionWars: false,
          economicState: 'average',
          crimeLevel: 'low',
        },
      };

      const result = await aiService.generateCompanionResponse(
        'companion-1',
        'Hello!',
        context
      );

      // Should return fallback response with error flag
      expect(result.error).toBe(true);
      expect(result.content).toBe(
        "I'm having trouble thinking right now. Let me gather my thoughts and try again."
      );
      expect(result.tokensUsed).toBe(0);
    });
  });
});

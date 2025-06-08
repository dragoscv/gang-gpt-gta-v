import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from './ai.service';
import { PrismaClient } from '@prisma/client';
import { CacheManager } from '../../infrastructure/cache';
import type { AIServiceConfig, AIPromptContext } from '../../shared/types/ai';

// Mock OpenAI completely
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI),
}));

// Mock dependencies
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../infrastructure/monitoring', () => ({
  measureAiRequest: vi
    .fn()
    .mockImplementation(async (_operation, _model, fn) => {
      const result = await fn();
      return result.result;
    }),
}));

vi.mock('./content-filter.service', () => ({
  ContentFilter: vi.fn().mockImplementation(() => ({
    filterContent: vi.fn().mockResolvedValue({
      isAppropriate: true,
      flaggedCategories: [],
      confidence: 0.9,
      severity: 'none',
      contextualFlags: [],
      suggestedAlternative: null,
    }),
  })),
}));

vi.mock('./memory.service', () => ({
  MemoryService: vi.fn().mockImplementation(() => ({
    getMemoryContext: vi.fn().mockResolvedValue({
      recentMemories: [],
      relationships: {},
      emotionalState: { mood: 'neutral', intensity: 0.5 },
    }),
    addMemory: vi.fn().mockResolvedValue(undefined),
    storeInteraction: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('AIService Simple Test', () => {
  let aiService: AIService;
  let mockConfig: AIServiceConfig;
  let mockPrisma: PrismaClient;
  let mockCache: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      apiVersion: '2024-02-01',
    };

    mockPrisma = {} as PrismaClient;
    mockCache = {} as CacheManager;

    // Setup OpenAI mock response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Test response',
          },
        },
      ],
      usage: {
        total_tokens: 50,
      },
    });

    aiService = new AIService(mockConfig, mockPrisma, mockCache);
  });

  it('should handle fallback response properly', async () => {
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

    // For now, just test that we get a response
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.model).toBe('gpt-4o-mini');
    expect(typeof result.tokensUsed).toBe('number');
  });
});

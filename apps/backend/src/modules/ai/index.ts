import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { cache } from '@/infrastructure/cache';
import { AIService } from './ai.service';
import { MemoryService } from './memory.service';
import { ContentFilter } from './content-filter.service';

// Initialize dependencies
const prisma = new PrismaClient();

// Initialize AI service with dependencies
export const aiService = new AIService(
  {
    apiKey: config.ai.apiKey,
    endpoint: config.ai.endpoint,
    apiVersion: config.ai.apiVersion,
    model: config.ai.deploymentName,
    maxTokens: config.ai.maxTokens,
  },
  prisma,
  cache.manager
);

// Export individual services for direct use
export const memoryService = new MemoryService(prisma, cache.manager);
export const contentFilter = new ContentFilter();

// Export all classes for custom initialization
export { AIService } from './ai.service';
export { MemoryService } from './memory.service';
export { ContentFilter } from './content-filter.service';

// Export types
export type {
  AIServiceConfig,
  AIResponse,
  AIPromptContext,
  AIMemoryContext,
  MemoryEntry,
  RelationshipMemory,
  EmotionalState,
  PersonalityTraits,
  ContentFilterResult,
  MissionGenerationContext,
  PlayerPreferences,
} from '@/shared/types/ai';

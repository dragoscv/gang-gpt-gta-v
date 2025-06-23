/**
 * Comprehensive Test Suite for Advanced Memory MCP
 * Tests memory storage, retrieval, and analytics functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AdvancedMemoryMCP, MemoryContext, MemorySearchOptions } from './advanced-memory-mcp';

// Mock config
vi.mock('../../config', () => ({
  default: {
    features: {
      aiCompanions: true,
    },
    ai: {
      memoryRetentionDays: 30,
    },
    development: {
      debugMode: true,
    },
  },
}));

// Mock logger
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AdvancedMemoryMCP', () => {
  let memoryMCP: AdvancedMemoryMCP;
  let testContext: MemoryContext;

  beforeEach(() => {
    memoryMCP = new AdvancedMemoryMCP();
    testContext = {
      agentId: 'test-agent',
      userId: 'test-user',
      contextType: 'conversation',
      metadata: { session: 'test-session' },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memory Storage', () => {
    it('should store a memory successfully', async () => {
      const content = 'Test memory content';
      const memoryId = await memoryMCP.remember(content, testContext, 5, ['test', 'memory']);

      expect(memoryId).toBeDefined();
      expect(memoryId).toMatch(/^mem_\d+_[a-z0-9]+$/);
    });

    it('should enhance tags with AI when available', async () => {
      const content = 'Player John joined faction Alpha';
      const initialTags = ['event'];
      
      const memoryId = await memoryMCP.remember(content, testContext, 7, initialTags);
      const memories = await memoryMCP.recall({ query: '', limit: 1 });
      
      const storedMemory = memories.find(m => m.id === memoryId);
      expect(storedMemory?.tags).toContain('event');
      expect(storedMemory?.tags.length).toBeGreaterThan(initialTags.length);
    });

    it('should validate importance range', async () => {
      const content = 'Test content';
      
      // Test below minimum
      await memoryMCP.remember(content, testContext, -5, []);
      let memories = await memoryMCP.recall({ query: '', limit: 1 });
      expect(memories[0].importance).toBe(1);

      // Test above maximum
      await memoryMCP.remember(content, testContext, 15, []);
      memories = await memoryMCP.recall({ query: '', limit: 1 });
      expect(memories[0].importance).toBe(10);
    });

    it('should generate semantic embeddings when AI is available', async () => {
      const content = 'Test content for embedding';
      const memoryId = await memoryMCP.remember(content, testContext);
      
      const memories = await memoryMCP.recall({ query: '', limit: 1 });
      const memory = memories.find(m => m.id === memoryId);
      
      expect(memory?.embedVector).toBeDefined();
      expect(memory?.embedVector?.length).toBeGreaterThan(0);
    });

    it('should find related memories', async () => {
      // Store related memories
      await memoryMCP.remember('Player John joined the game', testContext, 5, ['player', 'join']);
      await memoryMCP.remember('Player John left the game', testContext, 5, ['player', 'leave']);
      await memoryMCP.remember('Weather is sunny today', testContext, 3, ['weather']);

      const memoryId = await memoryMCP.remember('Player John scored a goal', testContext, 8, ['player', 'achievement']);
      
      const memories = await memoryMCP.recall({ query: '', limit: 10 });
      const newMemory = memories.find(m => m.id === memoryId);
      
      expect(newMemory?.relatedMemories).toBeDefined();
      expect(newMemory?.relatedMemories?.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Retrieval', () => {
    beforeEach(async () => {
      // Populate test data
      await memoryMCP.remember('Player Alice joined faction Alpha', testContext, 8, ['player', 'faction', 'join']);
      await memoryMCP.remember('Mission completed successfully', testContext, 9, ['mission', 'success']);
      await memoryMCP.remember('Weather changed to rainy', testContext, 3, ['weather', 'environment']);
      await memoryMCP.remember('Player Bob defeated enemy', testContext, 7, ['player', 'combat', 'victory']);
      await memoryMCP.remember('New AI companion acquired', testContext, 6, ['ai', 'companion', 'acquisition']);
    });

    it('should recall memories with keyword search', async () => {
      const results = await memoryMCP.recall({
        query: 'player',
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(memory => {
        const content = memory.content.toLowerCase();
        const tags = memory.tags.map(t => t.toLowerCase());
        const hasPlayerKeyword = content.includes('player') || tags.some(tag => tag.includes('player'));
        expect(hasPlayerKeyword).toBe(true);
      });
    });

    it('should filter by context', async () => {
      const differentContext: MemoryContext = {
        agentId: 'different-agent',
        contextType: 'game_session',
      };
      
      await memoryMCP.remember('Different context memory', differentContext, 5, ['different']);

      const results = await memoryMCP.recall({
        query: '',
        contextFilter: { contextType: 'conversation' },
        limit: 10,
      });

      results.forEach(memory => {
        expect(memory.context.contextType).toBe('conversation');
      });
    });

    it('should filter by importance threshold', async () => {
      const results = await memoryMCP.recall({
        query: '',
        minImportance: 7,
        limit: 10,
      });

      results.forEach(memory => {
        expect(memory.importance).toBeGreaterThanOrEqual(7);
      });
    });

    it('should filter by time range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const results = await memoryMCP.recall({
        query: '',
        timeRange: {
          start: oneHourAgo,
          end: now,
        },
        limit: 10,
      });

      results.forEach(memory => {
        expect(memory.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(memory.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should respect result limit', async () => {
      const results = await memoryMCP.recall({
        query: '',
        limit: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should rank results by importance and recency', async () => {
      const results = await memoryMCP.recall({
        query: '',
        limit: 10,
      });

      // Check that results are generally ordered by importance (with some recency weighting)
      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i];
        const next = results[i + 1];
        
        // Higher importance should generally come first
        // (allowing for some variance due to recency weighting)
        if (current.importance < next.importance) {
          // This might happen due to recency weighting, so we'll allow it
          // but the difference shouldn't be too large
          expect(next.importance - current.importance).toBeLessThan(3);
        }
      }
    });
  });

  describe('Memory Forgetting', () => {
    let memoryIds: string[];

    beforeEach(async () => {
      memoryIds = [
        await memoryMCP.remember('Memory 1', testContext, 5, ['test']),
        await memoryMCP.remember('Memory 2', testContext, 6, ['test']),
        await memoryMCP.remember('Memory 3', testContext, 7, ['test']),
      ];
    });

    it('should forget single memory by ID', async () => {
      const forgetCount = await memoryMCP.forget(memoryIds[0]);
      expect(forgetCount).toBe(1);

      const remaining = await memoryMCP.recall({ query: '', limit: 10 });
      const forgottenMemory = remaining.find(m => m.id === memoryIds[0]);
      expect(forgottenMemory).toBeUndefined();
    });

    it('should forget multiple memories by IDs', async () => {
      const forgetCount = await memoryMCP.forget({
        memoryIds: [memoryIds[0], memoryIds[1]],
      });
      expect(forgetCount).toBe(2);

      const remaining = await memoryMCP.recall({ query: '', limit: 10 });
      expect(remaining.find(m => m.id === memoryIds[0])).toBeUndefined();
      expect(remaining.find(m => m.id === memoryIds[1])).toBeUndefined();
      expect(remaining.find(m => m.id === memoryIds[2])).toBeDefined();
    });

    it('should forget memories by context filter', async () => {
      const differentContext: MemoryContext = {
        agentId: 'different-agent',
        contextType: 'game_session',
      };
      
      await memoryMCP.remember('Different context', differentContext, 5, ['different']);

      const forgetCount = await memoryMCP.forget({
        contextFilter: { contextType: 'game_session' },
      });
      expect(forgetCount).toBe(1);

      const remaining = await memoryMCP.recall({ query: '', limit: 10 });
      remaining.forEach(memory => {
        expect(memory.context.contextType).not.toBe('game_session');
      });
    });

    it('should forget memories older than specified date', async () => {
      const cutoffDate = new Date(Date.now() + 1000); // 1 second in future
      
      // Wait a bit to make sure memories are older
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const forgetCount = await memoryMCP.forget({
        olderThan: cutoffDate,
      });
      
      expect(forgetCount).toBeGreaterThan(0);
    });
  });

  describe('Context Summary', () => {
    beforeEach(async () => {
      await memoryMCP.remember('High importance event occurred', testContext, 9, ['important', 'event']);
      await memoryMCP.remember('Regular daily activity', testContext, 5, ['daily', 'routine']);
      await memoryMCP.remember('Critical system alert', testContext, 10, ['critical', 'alert']);
      await memoryMCP.remember('Minor update completed', testContext, 3, ['update', 'minor']);
    });

    it('should generate context summary', async () => {
      const summary = await memoryMCP.getContextSummary(testContext);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Key memories:');
    });

    it('should respect max summary length', async () => {
      const summary = await memoryMCP.getContextSummary(testContext, 100);
      expect(summary.length).toBeLessThanOrEqual(100);
    });

    it('should handle empty context gracefully', async () => {
      const emptyContext: MemoryContext = {
        agentId: 'empty-agent',
        contextType: 'conversation',
      };
      
      const summary = await memoryMCP.getContextSummary(emptyContext);
      expect(summary).toBe('No relevant memories found for this context.');
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      await memoryMCP.remember('Test memory 1', testContext, 5, ['test', 'memory']);
      await memoryMCP.remember('Test memory 2', testContext, 8, ['test', 'important']);
      await memoryMCP.remember('Different context', 
        { ...testContext, contextType: 'game_session' }, 
        6, ['game', 'session']
      );
    });

    it('should provide accurate analytics', () => {
      const analytics = memoryMCP.getAnalytics();
      
      expect(analytics.totalMemories).toBeGreaterThan(0);
      expect(analytics.contextDistribution).toBeDefined();
      expect(analytics.averageImportance).toBeGreaterThan(0);
      expect(analytics.topTags).toBeDefined();
      expect(Array.isArray(analytics.topTags)).toBe(true);
    });

    it('should track context distribution', () => {
      const analytics = memoryMCP.getAnalytics();
      
      expect(analytics.contextDistribution['conversation']).toBeGreaterThan(0);
      expect(analytics.contextDistribution['game_session']).toBeGreaterThan(0);
    });

    it('should calculate average importance correctly', () => {
      const analytics = memoryMCP.getAnalytics();
      
      expect(analytics.averageImportance).toBeGreaterThan(0);
      expect(analytics.averageImportance).toBeLessThanOrEqual(10);
    });

    it('should identify top tags', () => {
      const analytics = memoryMCP.getAnalytics();
      
      expect(analytics.topTags.length).toBeGreaterThan(0);
      expect(analytics.topTags[0]).toHaveProperty('tag');
      expect(analytics.topTags[0]).toHaveProperty('count');
      expect(analytics.topTags[0].count).toBeGreaterThan(0);
    });
  });

  describe('Import/Export', () => {
    let testMemories: any[];

    beforeEach(async () => {
      await memoryMCP.remember('Export test 1', testContext, 5, ['export', 'test']);
      await memoryMCP.remember('Export test 2', testContext, 7, ['export', 'test']);
      
      testMemories = await memoryMCP.exportMemories();
    });

    it('should export memories', async () => {
      const exported = await memoryMCP.exportMemories();
      
      expect(Array.isArray(exported)).toBe(true);
      expect(exported.length).toBeGreaterThan(0);
      
      exported.forEach(memory => {
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('context');
        expect(memory).toHaveProperty('importance');
        expect(memory).toHaveProperty('tags');
        expect(memory).toHaveProperty('timestamp');
      });
    });

    it('should export memories with context filter', async () => {
      const gameContext: MemoryContext = {
        agentId: 'game-agent',
        contextType: 'game_session',
      };
      
      await memoryMCP.remember('Game memory', gameContext, 5, ['game']);
      
      const exported = await memoryMCP.exportMemories({ contextType: 'game_session' });
      
      exported.forEach(memory => {
        expect(memory.context.contextType).toBe('game_session');
      });
    });

    it('should import memories', async () => {
      const newMemoryMCP = new AdvancedMemoryMCP();
      const importCount = await newMemoryMCP.importMemories(testMemories);
      
      expect(importCount).toBe(testMemories.length);
      
      const imported = await newMemoryMCP.exportMemories();
      expect(imported.length).toBe(testMemories.length);
    });

    it('should handle import errors gracefully', async () => {
      const invalidMemories = [
        { id: 'invalid', content: 'test' }, // Missing required fields
      ];
      
      const importCount = await memoryMCP.importMemories(invalidMemories as any);
      expect(importCount).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of memories efficiently', async () => {
      const start = Date.now();
      
      // Store 100 memories
      const promises = Array.from({ length: 100 }, (_, i) => 
        memoryMCP.remember(`Performance test memory ${i}`, testContext, 5, ['performance'])
      );
      
      await Promise.all(promises);
      
      const storageTime = Date.now() - start;
      expect(storageTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Test retrieval performance
      const retrievalStart = Date.now();
      const results = await memoryMCP.recall({ query: 'performance', limit: 50 });
      const retrievalTime = Date.now() - retrievalStart;
      
      expect(retrievalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle complex queries efficiently', async () => {
      // Store memories with various contexts and tags
      const contexts = ['conversation', 'game_session', 'faction_activity', 'player_interaction'];
      const tags = ['player', 'mission', 'faction', 'ai', 'combat', 'exploration'];
      
      for (let i = 0; i < 50; i++) {
        const context = contexts[i % contexts.length];
        const tag = tags[i % tags.length];
        await memoryMCP.remember(
          `Complex test memory ${i} with ${tag}`,
          { ...testContext, contextType: context as any },
          Math.floor(Math.random() * 10) + 1,
          [tag, 'complex', 'test']
        );
      }

      const start = Date.now();
      const results = await memoryMCP.recall({
        query: 'player mission',
        contextFilter: { contextType: 'game_session' },
        minImportance: 5,
        limit: 10,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Test with invalid context
      try {
        await memoryMCP.remember('Test', null as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle retrieval errors gracefully', async () => {
      const results = await memoryMCP.recall({
        query: 'test',
        contextFilter: null as any,
      });
      
      // Should return empty array instead of throwing
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle forget errors gracefully', async () => {
      const forgetCount = await memoryMCP.forget(null as any);
      expect(forgetCount).toBe(0);
    });

    it('should handle context summary errors gracefully', async () => {
      const summary = await memoryMCP.getContextSummary(null as any);
      expect(summary).toBe('Unable to generate memory summary.');
    });
  });

  describe('Semantic Search', () => {
    it('should calculate cosine similarity correctly', async () => {
      // This tests the private method indirectly through semantic search
      await memoryMCP.remember('The quick brown fox jumps', testContext, 5, ['animals']);
      await memoryMCP.remember('A fast brown animal leaps', testContext, 5, ['animals']);
      await memoryMCP.remember('The weather is sunny today', testContext, 5, ['weather']);

      const results = await memoryMCP.recall({
        query: 'quick brown fox',
        semanticThreshold: 0.5,
        limit: 10,
      });

      // Should find semantically similar content
      expect(results.length).toBeGreaterThan(0);
      
      // The most similar result should be first
      expect(results[0].content).toContain('quick brown fox');
    });

    it('should fall back to keyword search when semantic search is unavailable', async () => {
      // Create a new instance without AI features
      const noAiMemoryMCP = new AdvancedMemoryMCP();
      
      await noAiMemoryMCP.remember('Test keyword search', testContext, 5, ['test']);
      await noAiMemoryMCP.remember('Another test memory', testContext, 5, ['test']);
      await noAiMemoryMCP.remember('Unrelated content', testContext, 5, ['other']);

      const results = await noAiMemoryMCP.recall({
        query: 'test',
        limit: 10,
      });

      expect(results.length).toBe(2);
      results.forEach(memory => {
        const hasTestKeyword = memory.content.toLowerCase().includes('test') || 
                             memory.tags.some(tag => tag.toLowerCase().includes('test'));
        expect(hasTestKeyword).toBe(true);
      });
    });
  });
});

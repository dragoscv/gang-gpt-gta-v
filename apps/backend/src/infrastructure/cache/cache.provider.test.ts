import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { CacheProvider, cache } from './cache.provider';

// Mock config
vi.mock('@/config', () => ({
  default: {
    redis: {
      url: 'redis://localhost:4832',
    },
  },
}));

// Mock the logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Create mock objects
const mockRedisService = {
  connect: vi.fn(),
  healthCheck: vi.fn(),
  disconnect: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
};

const mockCacheManager = {
  getCacheStats: vi.fn(),
  healthCheck: vi.fn(),
};

const mockMemoryCache = {
  healthCheck: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  clear: vi.fn(),
};

// Mock RedisService
vi.mock('./redis.service', () => ({
  RedisService: vi.fn(() => mockRedisService),
}));

// Mock CacheManager
vi.mock('./cache.manager', () => ({
  CacheManager: vi.fn(() => mockCacheManager),
}));

// Mock MemoryCache
vi.mock('./memory.cache', () => ({
  MemoryCache: vi.fn(() => mockMemoryCache),
}));

describe('CacheProvider', () => {
  let provider: CacheProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new instance for testing
    provider = new (CacheProvider as any)();
  });

  describe('Singleton instance', () => {
    it('should export a singleton cache instance', () => {
      expect(cache).toBeDefined();
      expect(cache).toBeInstanceOf(CacheProvider);
    });
  });
  describe('Lazy initialization getters', () => {
    it('should create Redis service instance on first access', () => {
      const redis1 = provider.redis;
      const redis2 = provider.redis;

      expect(redis1).toBeDefined();
      expect(redis1).toBe(redis2); // Should be the same instance
    });

    it('should create Memory cache instance on first access', () => {
      const memory1 = provider.memory;
      const memory2 = provider.memory;

      expect(memory1).toBeDefined();
      expect(memory1).toBe(memory2); // Should be the same instance
    });

    it('should create Cache manager instance on first access', () => {
      const manager1 = provider.manager;
      const manager2 = provider.manager;

      expect(manager1).toBeDefined();
      expect(manager1).toBe(manager2); // Should be the same instance
    });
  });

  describe('cache getter', () => {
    it('should return Redis service when not in fallback mode', () => {
      // Access redis to create the instance
      const redis = provider.redis;
      const activeCache = provider.cache;

      expect(activeCache).toBe(redis);
    });

    it('should return Memory cache when in fallback mode', async () => {
      // Simulate Redis failure to trigger fallback mode
      mockRedisService.connect.mockRejectedValue(
        new Error('Redis connection failed')
      );
      mockMemoryCache.healthCheck.mockResolvedValue(true);

      await provider.initialize();

      const memory = provider.memory;
      const activeCache = provider.cache;

      expect(activeCache).toBe(memory);
    });
  });

  describe('initialize method', () => {
    it('should initialize successfully with Redis', async () => {
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);

      await provider.initialize();

      expect(provider.initialized).toBe(true);
      expect(mockRedisService.connect).toHaveBeenCalled();
      expect(mockRedisService.healthCheck).toHaveBeenCalled();
    });

    it('should fallback to memory when Redis connection fails', async () => {
      mockRedisService.connect.mockRejectedValue(
        new Error('Redis connection failed')
      );
      mockMemoryCache.healthCheck.mockResolvedValue(true);

      await provider.initialize();

      expect(provider.initialized).toBe(true);
      expect(mockMemoryCache.healthCheck).toHaveBeenCalled();
    });

    it('should fallback to memory when Redis health check fails', async () => {
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(false);
      mockMemoryCache.healthCheck.mockResolvedValue(true);

      await provider.initialize();

      expect(provider.initialized).toBe(true);
      expect(mockMemoryCache.healthCheck).toHaveBeenCalled();
    });

    it('should handle memory cache health check failure gracefully', async () => {
      mockRedisService.connect.mockRejectedValue(new Error('Redis error'));
      mockMemoryCache.healthCheck.mockResolvedValue(false);

      await provider.initialize();

      expect(provider.initialized).toBe(true); // Should still be initialized with fallback
    });

    it('should not reinitialize if already initialized', async () => {
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);

      await provider.initialize();
      await provider.initialize(); // Second call

      expect(mockRedisService.connect).toHaveBeenCalledTimes(1); // Should only be called once
    });
  });

  describe('disconnect method', () => {
    it('should disconnect Redis connection successfully', async () => {
      mockRedisService.disconnect.mockResolvedValue(undefined);

      // Initialize first
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);
      await provider.initialize();

      await provider.disconnect();

      expect(mockRedisService.disconnect).toHaveBeenCalled();
    });

    it('should handle Redis disconnect errors gracefully', async () => {
      mockRedisService.disconnect.mockRejectedValue(
        new Error('Disconnect failed')
      );

      // Initialize first
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);
      await provider.initialize();

      await expect(provider.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('healthCheck method', () => {
    beforeEach(async () => {
      // Initialize first
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);
      await provider.initialize();
    });

    it('should return healthy status when Redis is healthy', async () => {
      const healthResult = { connected: true, latency: 10 };
      mockCacheManager.healthCheck.mockResolvedValue(healthResult);

      const health = await provider.healthCheck();

      expect(health).toEqual({
        redis: healthResult,
        overall: true,
      });
    });

    it('should return unhealthy status when Redis fails', async () => {
      mockCacheManager.healthCheck.mockRejectedValue(new Error('Redis error'));

      const health = await provider.healthCheck();

      expect(health).toEqual({
        redis: {
          connected: false,
          error: 'Redis error',
        },
        overall: false,
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockCacheManager.healthCheck.mockRejectedValue('String error');

      const health = await provider.healthCheck();

      expect(health.redis).toEqual({
        connected: false,
        error: 'Unknown error',
      });
    });
  });

  describe('getStats method', () => {
    beforeEach(async () => {
      // Initialize first
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);
      await provider.initialize();
    });

    it('should return cache statistics', async () => {
      const mockStats = {
        totalKeys: 10,
        keysByPrefix: { 'user:': 5, 'session:': 3 },
        memoryUsage: '1MB',
      };

      mockCacheManager.getCacheStats.mockResolvedValue(mockStats);

      const stats = await provider.getStats();

      expect(stats).toEqual({
        redis: mockStats,
        connectionInfo: {
          initialized: true,
          redisUrl: 'redis://localhost:4832',
        },
      });
    });
  });

  describe('initialized getter', () => {
    it('should return false before initialization', () => {
      expect(provider.initialized).toBe(false);
    });

    it('should return true after initialization', async () => {
      mockRedisService.connect.mockResolvedValue(undefined);
      mockRedisService.healthCheck.mockResolvedValue(true);

      await provider.initialize();

      expect(provider.initialized).toBe(true);
    });
  });
});

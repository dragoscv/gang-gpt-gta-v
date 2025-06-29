import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { UnifiedCache } from './unified.cache';
import { RedisService } from './redis.service';
import { MemoryCache } from './memory.cache';

// Mock the logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock RedisService
vi.mock('./redis.service', () => ({
  RedisService: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    healthCheck: vi.fn(),
  })),
}));

// Mock MemoryCache
vi.mock('./memory.cache', () => ({
  MemoryCache: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    clear: vi.fn(),
    size: vi.fn(),
    healthCheck: vi.fn(),
  })),
}));

describe('UnifiedCache', () => {
  let unifiedCache: UnifiedCache;
  let mockRedis: RedisService;
  let mockMemory: MemoryCache;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRedis = new RedisService();
    mockMemory = new MemoryCache();
  });

  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory);
      expect(unifiedCache).toBeDefined();
    });

    it('should initialize with memory fallback enabled', () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      expect(unifiedCache).toBeDefined();
    });
  });

  describe('get method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should get value from Redis when not in fallback mode', async () => {
      const testValue = 'test-value';
      (mockRedis.get as Mock).mockResolvedValue(testValue);

      const result = await unifiedCache.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testValue);
    });

    it('should get value from Memory when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      const testValue = 'test-value';
      (mockMemory.get as Mock).mockResolvedValue(testValue);

      const result = await unifiedCache.get('test-key');

      expect(mockMemory.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testValue);
    });

    it('should fallback to memory cache when Redis fails', async () => {
      const testValue = 'test-value';

      (mockRedis.get as Mock).mockRejectedValue(new Error('Redis error'));
      (mockMemory.get as Mock).mockResolvedValue(testValue);

      const result = await unifiedCache.get('test-key');

      expect(mockMemory.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testValue);
    });

    it('should throw error when memory cache also fails in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);

      (mockMemory.get as Mock).mockRejectedValue(new Error('Memory error'));

      await expect(unifiedCache.get('test-key')).rejects.toThrow(
        'Memory error'
      );
    });
  });

  describe('set method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should set value in Redis when not in fallback mode', async () => {
      const testValue = 'test-value';
      (mockRedis.set as Mock).mockResolvedValue(undefined);

      await unifiedCache.set('test-key', testValue);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        testValue,
        undefined
      );
    });

    it('should set value in Redis with TTL', async () => {
      const testValue = 'test-value';
      (mockRedis.set as Mock).mockResolvedValue(undefined);

      await unifiedCache.set('test-key', testValue, 3600);

      expect(mockRedis.set).toHaveBeenCalledWith('test-key', testValue, 3600);
    });

    it('should set value in Memory when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      const testValue = 'test-value';
      (mockMemory.set as Mock).mockResolvedValue(undefined);

      await unifiedCache.set('test-key', testValue);

      expect(mockMemory.set).toHaveBeenCalledWith(
        'test-key',
        testValue,
        undefined
      );
    });

    it('should fallback to memory cache when Redis fails', async () => {
      const testValue = 'test-value';

      (mockRedis.set as Mock).mockRejectedValue(new Error('Redis error'));
      (mockMemory.set as Mock).mockResolvedValue(undefined);

      await unifiedCache.set('test-key', testValue);

      expect(mockMemory.set).toHaveBeenCalledWith(
        'test-key',
        testValue,
        undefined
      );
    });
  });

  describe('delete method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should delete key from Redis', async () => {
      (mockRedis.del as Mock).mockResolvedValue(1);

      const result = await unifiedCache.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist in Redis', async () => {
      (mockRedis.del as Mock).mockResolvedValue(0);

      const result = await unifiedCache.delete('test-key');

      expect(result).toBe(false);
    });

    it('should delete key from Memory when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      (mockMemory.delete as Mock).mockResolvedValue(true);

      const result = await unifiedCache.delete('test-key');

      expect(mockMemory.delete).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should fallback to memory cache when Redis fails', async () => {
      (mockRedis.del as Mock).mockRejectedValue(new Error('Redis error'));
      (mockMemory.delete as Mock).mockResolvedValue(true);

      const result = await unifiedCache.delete('test-key');

      expect(mockMemory.delete).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
  });

  describe('exists method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should check if key exists in Redis', async () => {
      (mockRedis.exists as Mock).mockResolvedValue(true);

      const result = await unifiedCache.exists('test-key');

      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should check if key exists in Memory when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      (mockMemory.exists as Mock).mockResolvedValue(true);

      const result = await unifiedCache.exists('test-key');

      expect(mockMemory.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should fallback to memory cache when Redis fails', async () => {
      (mockRedis.exists as Mock).mockRejectedValue(new Error('Redis error'));
      (mockMemory.exists as Mock).mockResolvedValue(true);

      const result = await unifiedCache.exists('test-key');

      expect(mockMemory.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
  });

  describe('expire method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should set expiration for key in Redis', async () => {
      (mockRedis.expire as Mock).mockResolvedValue(true);

      const result = await unifiedCache.expire('test-key', 3600);

      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 3600);
      expect(result).toBe(true);
    });

    it('should set expiration for key in Memory when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      (mockMemory.expire as Mock).mockResolvedValue(true);

      const result = await unifiedCache.expire('test-key', 3600);

      expect(mockMemory.expire).toHaveBeenCalledWith('test-key', 3600);
      expect(result).toBe(true);
    });

    it('should fallback to memory cache when Redis fails', async () => {
      (mockRedis.expire as Mock).mockRejectedValue(new Error('Redis error'));
      (mockMemory.expire as Mock).mockResolvedValue(true);

      const result = await unifiedCache.expire('test-key', 3600);

      expect(mockMemory.expire).toHaveBeenCalledWith('test-key', 3600);
      expect(result).toBe(true);
    });
  });

  describe('healthCheck method', () => {
    beforeEach(() => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
    });

    it('should check Redis health when not in fallback mode', async () => {
      (mockRedis.healthCheck as Mock).mockResolvedValue(true);

      const result = await unifiedCache.healthCheck();

      expect(mockRedis.healthCheck).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should check Memory health when in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      (mockMemory.healthCheck as Mock).mockResolvedValue(true);

      const result = await unifiedCache.healthCheck();

      expect(mockMemory.healthCheck).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should fallback to memory health check when Redis fails', async () => {
      (mockRedis.healthCheck as Mock).mockRejectedValue(
        new Error('Redis error')
      );
      (mockMemory.healthCheck as Mock).mockResolvedValue(true);

      const result = await unifiedCache.healthCheck();

      expect(mockMemory.healthCheck).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when health check fails in fallback mode', async () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      (mockMemory.healthCheck as Mock).mockRejectedValue(
        new Error('Memory error')
      );

      const result = await unifiedCache.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should set fallback mode', () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);

      unifiedCache.setFallbackMode(true);
      expect(unifiedCache.getCacheType()).toBe('memory');

      unifiedCache.setFallbackMode(false);
      expect(unifiedCache.getCacheType()).toBe('redis');
    });

    it('should return correct cache type', () => {
      unifiedCache = new UnifiedCache(mockRedis, mockMemory, false);
      expect(unifiedCache.getCacheType()).toBe('redis');

      unifiedCache = new UnifiedCache(mockRedis, mockMemory, true);
      expect(unifiedCache.getCacheType()).toBe('memory');
    });
  });
});

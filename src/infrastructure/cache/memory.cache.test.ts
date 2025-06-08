import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from './memory.cache';

// Mock the logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('get and set operations', () => {
    it('should store and retrieve a string value', async () => {
      await cache.set('test-key', 'test-value');
      const result = await cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should store and retrieve an object value', async () => {
      const testObj = { name: 'test', value: 123 };
      await cache.set('test-obj', testObj);
      const result = await cache.get('test-obj');
      expect(result).toBe(JSON.stringify(testObj));
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should overwrite existing values', async () => {
      await cache.set('test-key', 'first-value');
      await cache.set('test-key', 'second-value');
      const result = await cache.get('test-key');
      expect(result).toBe('second-value');
    });
  });

  describe('TTL (time-to-live) functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire values after TTL', async () => {
      await cache.set('test-key', 'test-value', 1); // 1 second TTL

      // Should exist immediately
      let result = await cache.get('test-key');
      expect(result).toBe('test-value');

      // Fast-forward time by 1.5 seconds
      vi.advanceTimersByTime(1500);

      // Should be expired
      result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should not expire values without TTL', async () => {
      await cache.set('test-key', 'test-value'); // No TTL

      // Fast-forward time significantly
      vi.advanceTimersByTime(10000);

      const result = await cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should clear existing timer when overwriting with new TTL', async () => {
      await cache.set('test-key', 'first-value', 1);
      await cache.set('test-key', 'second-value', 5);

      // Fast-forward by 2 seconds (past first TTL)
      vi.advanceTimersByTime(2000);

      // Should still exist because new TTL is 5 seconds
      const result = await cache.get('test-key');
      expect(result).toBe('second-value');
    });
  });

  describe('delete operations', () => {
    it('should delete existing keys', async () => {
      await cache.set('test-key', 'test-value');
      await cache.delete('test-key');
      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should handle deleting non-existent keys gracefully', async () => {
      await expect(cache.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear operations', () => {
    it('should clear all cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });
  describe('exists operations', () => {
    it('should return true for existing keys', async () => {
      await cache.set('test-key', 'test-value');
      const exists = await cache.exists('test-key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await cache.exists('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for expired keys', async () => {
      vi.useFakeTimers();

      await cache.set('test-key', 'test-value', 1);
      vi.advanceTimersByTime(1500);

      const exists = await cache.exists('test-key');
      expect(exists).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('expire operations', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set expiry for existing keys', async () => {
      await cache.set('test-key', 'test-value');
      const result = await cache.expire('test-key', 2);
      expect(result).toBe(true);

      // Should still exist before expiry
      vi.advanceTimersByTime(1000);
      expect(await cache.exists('test-key')).toBe(true);

      // Should be expired after TTL
      vi.advanceTimersByTime(1500);
      expect(await cache.exists('test-key')).toBe(false);
    });

    it('should return false for non-existent keys', async () => {
      const result = await cache.expire('non-existent', 2);
      expect(result).toBe(false);
    });
  });

  describe('size operations', () => {
    it('should return correct cache size', async () => {
      expect(cache.size()).toBe(0);

      await cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      await cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      await cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('healthCheck operations', () => {
    it('should return true for healthy cache', async () => {
      const health = await cache.healthCheck();
      expect(health).toBe(true);
    });
  });
});

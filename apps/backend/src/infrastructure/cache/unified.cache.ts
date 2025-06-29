/**
 * Unified cache interface that works with both Redis and Memory cache
 * Provides a consistent API regardless of the underlying cache implementation
 */

import { RedisService } from './redis.service';
import { MemoryCache } from './memory.cache';
import { logger } from '@/infrastructure/logging';

export class UnifiedCache {
  constructor(
    private redis: RedisService,
    private memory: MemoryCache,
    private useMemoryFallback: boolean = false
  ) {
    logger.debug(
      'UnifiedCache initialized with memory fallback:',
      useMemoryFallback
    );
  }

  /**
   * Get active cache implementation
   */
  private get activeCache(): RedisService | MemoryCache {
    return this.useMemoryFallback ? this.memory : this.redis;
  }

  /**
   * Set fallback mode
   */
  setFallbackMode(useMemory: boolean): void {
    this.useMemoryFallback = useMemory;
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.activeCache.get(key);
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn(
          `Redis get failed for key ${key}, falling back to memory:`,
          error
        );
        this.useMemoryFallback = true;
        return await this.memory.get(key);
      }
      throw error;
    }
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to store (string or object)
   * @param ttlSeconds - Time to live in seconds (optional)
   * @returns Promise resolving to void
   */
  async set<T extends string | object>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      await this.activeCache.set(key, value, ttlSeconds);
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn(
          `Redis set failed for key ${key}, falling back to memory cache:`,
          error
        );
        this.useMemoryFallback = true;
        await this.memory.set(key, value, ttlSeconds);
      } else {
        throw error;
      }
    }
  }
  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        return await this.memory.delete(key);
      } else {
        const result = await this.redis.del(key);
        return result > 0;
      }
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn(
          `Redis delete failed for key ${key}, falling back to memory:`,
          error
        );
        this.useMemoryFallback = true;
        return await this.memory.delete(key);
      }
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.activeCache.exists(key);
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn(
          `Redis exists failed for key ${key}, falling back to memory:`,
          error
        );
        this.useMemoryFallback = true;
        return await this.memory.exists(key);
      }
      throw error;
    }
  }

  /**
   * Set expiry for key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      return await this.activeCache.expire(key, ttlSeconds);
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn(
          `Redis expire failed for key ${key}, falling back to memory:`,
          error
        );
        this.useMemoryFallback = true;
        return await this.memory.expire(key, ttlSeconds);
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        return await this.memory.healthCheck();
      } else {
        return await this.redis.healthCheck();
      }
    } catch (error) {
      if (!this.useMemoryFallback) {
        logger.warn('Redis health check failed, checking memory fallback');
        return await this.memory.healthCheck();
      }
      return false;
    }
  }

  /**
   * Get current cache type
   */
  getCacheType(): 'redis' | 'memory' {
    return this.useMemoryFallback ? 'memory' : 'redis';
  }
}

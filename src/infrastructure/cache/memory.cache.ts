/**
 * In-memory cache service as a fallback when Redis is not available
 * This provides basic caching functionality for development
 */

import { logger } from '@/infrastructure/logging';

interface CacheItem {
  value: any;
  expiry?: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    return typeof item.value === 'string'
      ? item.value
      : JSON.stringify(item.value);
  }

  /**
   * Set a value in cache with optional expiry
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const item: CacheItem = {
      value: typeof value === 'string' ? value : JSON.stringify(value),
    };

    if (ttlSeconds) {
      item.expiry = Date.now() + ttlSeconds * 1000;

      // Set a timer to auto-delete when expired
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttlSeconds * 1000);

      this.timers.set(key, timer);
    }

    this.cache.set(key, item);
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Set expiry for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new expiry
    item.expiry = Date.now() + ttlSeconds * 1000;

    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);

    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health_check';
      await this.set(testKey, 'test', 1);
      const value = await this.get(testKey);
      await this.delete(testKey);
      return value === 'test';
    } catch (error) {
      logger.error('Memory cache health check failed:', error);
      return false;
    }
  }
}

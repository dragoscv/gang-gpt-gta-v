import { RedisService } from './redis.service';
import { CacheManager } from './cache.manager';
import { MemoryCache } from './memory.cache';
import config from '@/config';
import { logger } from '@/infrastructure/logging';

/**
 * Cache provider - Singleton instances for Redis service and Cache manager
 * Provides centralized cache access throughout the application with Redis fallback
 */
class CacheProvider {
  private _redisService: RedisService | null = null;
  private _memoryCache: MemoryCache | null = null;
  private _cacheManager: CacheManager | null = null;
  private _initialized = false;
  private _useMemoryFallback = false;

  /**
   * Get Redis service instance
   */
  get redis(): RedisService {
    if (!this._redisService) {
      this._redisService = new RedisService();
    }
    return this._redisService;
  }

  /**
   * Get Memory cache instance
   */
  get memory(): MemoryCache {
    if (!this._memoryCache) {
      this._memoryCache = new MemoryCache();
    }
    return this._memoryCache;
  }

  /**
   * Get the active cache (Redis or memory fallback)
   */
  get cache(): RedisService | MemoryCache {
    return this._useMemoryFallback ? this.memory : this.redis;
  }

  /**
   * Get Cache manager instance
   */
  get manager(): CacheManager {
    if (!this._cacheManager) {
      this._cacheManager = new CacheManager(this.redis);
    }
    return this._cacheManager;
  }

  /**
   * Initialize cache connections
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      logger.info('✅ Cache services already initialized');
      return;
    }

    try {
      logger.info('🔄 Initializing cache services...');

      // Try to connect to Redis first
      try {
        await this.redis.connect();
        const isHealthy = await this.redis.healthCheck();

        if (!isHealthy) {
          throw new Error('Redis health check failed');
        }

        this._useMemoryFallback = false;
        logger.info('✅ Redis cache initialized successfully');
      } catch (redisError) {
        logger.warn(
          '⚠️ Redis not available, falling back to memory cache:',
          redisError
        );
        this._useMemoryFallback = true;

        // Test memory cache
        const memoryHealthy = await this.memory.healthCheck();
        if (!memoryHealthy) {
          throw new Error('Memory cache initialization failed');
        }

        logger.info('✅ Memory cache fallback initialized successfully');
      }

      this._initialized = true;
      logger.info('✅ Cache services initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize cache services:', error);
      // Don't throw - allow app to continue without cache
      this._useMemoryFallback = true;
      this._initialized = true;
      logger.info('✅ Cache services initialized in fallback mode');
    }
  }

  /**
   * Disconnect all cache services
   */
  async disconnect(): Promise<void> {
    if (!this._initialized) {
      return;
    }

    try {
      logger.info('🔄 Disconnecting cache services...');

      if (this._redisService) {
        await this._redisService.disconnect();
      }

      this._initialized = false;
      logger.info('✅ Cache services disconnected successfully');
    } catch (error) {
      logger.error('❌ Failed to disconnect cache services:', error);
      throw error;
    }
  }

  /**
   * Health check for all cache services
   */
  async healthCheck(): Promise<{
    redis: {
      connected: boolean;
      latency?: number;
      error?: string;
    };
    overall: boolean;
  }> {
    try {
      const redisHealth = await this.manager.healthCheck();

      return {
        redis: redisHealth,
        overall: redisHealth.connected,
      };
    } catch (error) {
      return {
        redis: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        overall: false,
      };
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    redis: {
      totalKeys: number;
      keysByPrefix: Record<string, number>;
      memoryUsage?: string;
    };
    connectionInfo: {
      initialized: boolean;
      redisUrl: string;
    };
  }> {
    const stats = await this.manager.getCacheStats();

    return {
      redis: stats,
      connectionInfo: {
        initialized: this._initialized,
        redisUrl: config.redis.url,
      },
    };
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this._initialized;
  }
}

// Export singleton instance
export const cache = new CacheProvider();

// Export classes for testing and advanced usage
export { RedisService, CacheManager, CacheProvider };

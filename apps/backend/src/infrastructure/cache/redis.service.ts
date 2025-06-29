import { Redis } from 'ioredis';
import config from '@/config';
import { logger } from '@/infrastructure/logging';

/**
 * Redis service for caching and session management
 * Implements connection pooling and health monitoring
 */
export class RedisService {
  private redis: Redis;
  private isConnected = false;
  constructor() {
    // Create Redis connection using URL and password
    const redisOptions: {
      maxRetriesPerRequest?: number;
      connectTimeout?: number;
      lazyConnect?: boolean;
      enableOfflineQueue?: boolean;
      password?: string;
    } = {
      maxRetriesPerRequest: 1, // Allow 1 retry
      connectTimeout: 2000, // 2 second timeout
      lazyConnect: true,
      enableOfflineQueue: false, // Disable offline queue to prevent hanging
    };

    // Add password if configured
    if (config.redis.password) {
      redisOptions.password = config.redis.password;
    }

    this.redis = new Redis(config.redis.url, redisOptions);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connection established');
      this.isConnected = true;
    });

    this.redis.on('error', error => {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
      // Prevent unhandled rejection
      if (error.message.includes('ECONNREFUSED')) {
        logger.warn('Redis server not available, operating in degraded mode');
      }
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    // Handle Redis command errors to prevent crashes
    this.redis.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  /**
   * Set a key-value pair with optional TTL
   * Returns true if successful, false otherwise
   */
  async set(
    key: string,
    value: string | object,
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot set key ${key}`);
      return false;
    }

    try {
      const serializedValue =
        typeof value === 'object' ? JSON.stringify(value) : value;

      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to set Redis key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value by key
   */
  async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot get key ${key}`);
      return null;
    }

    try {
      const value = await this.redis.get(key);

      if (value === null) {
        return null;
      }

      if (parseJson) {
        try {
          return JSON.parse(value) as T;
        } catch {
          logger.warn(
            `Failed to parse JSON for key ${key}, returning raw value`
          );
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      logger.error(`Failed to get Redis key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot delete key ${key}`);
      return 0;
    }

    try {
      return await this.redis.del(key);
    } catch (error) {
      logger.error(`Failed to delete Redis key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot check existence of key ${key}`);
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence of Redis key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot set TTL for key ${key}`);
      return false;
    }

    try {
      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to set TTL for Redis key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      logger.warn(
        `Redis not connected, cannot get keys for pattern ${pattern}`
      );
      return [];
    }

    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get Redis keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot get multiple keys`);
      return keys.map(() => null);
    }

    try {
      return await this.redis.mget(...keys);
    } catch (error) {
      logger.error('Failed to get multiple Redis keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs: Record<string, string | object>): Promise<void> {
    try {
      const serializedPairs: string[] = [];

      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key);
        serializedPairs.push(
          typeof value === 'object' ? JSON.stringify(value) : (value as string)
        );
      }

      await this.redis.mset(...serializedPairs);
    } catch (error) {
      logger.error('Failed to set multiple Redis keys:', error);
      throw error;
    }
  }

  /**
   * Hash operations
   */
  async hset(
    key: string,
    field: string,
    value: string | object
  ): Promise<number> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot set hash ${key}.${field}`);
      return 0;
    }

    try {
      const serializedValue =
        typeof value === 'object' ? JSON.stringify(value) : value;
      return await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      logger.error(`Failed to set Redis hash ${key}.${field}:`, error);
      return 0;
    }
  }

  async hget<T = string>(
    key: string,
    field: string,
    parseJson = false
  ): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot get hash ${key}.${field}`);
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);

      if (value === null) {
        return null;
      }

      if (parseJson) {
        try {
          return JSON.parse(value) as T;
        } catch {
          logger.warn(
            `Failed to parse JSON for hash ${key}.${field}, returning raw value`
          );
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      logger.error(`Failed to get Redis hash ${key}.${field}:`, error);
      return null;
    }
  }

  async hgetall<T = Record<string, string>>(
    key: string,
    parseJson = false
  ): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn(`Redis not connected, cannot get hash ${key}`);
      return null;
    }

    try {
      const result = await this.redis.hgetall(key);

      if (Object.keys(result).length === 0) {
        return null;
      }

      if (parseJson) {
        const parsed: Record<
          string,
          string | number | boolean | object | null
        > = {};
        for (const [field, value] of Object.entries(result)) {
          try {
            parsed[field] = JSON.parse(value);
          } catch {
            parsed[field] = value;
          }
        }
        return parsed as T;
      }

      return result as T;
    } catch (error) {
      logger.error(`Failed to get Redis hash ${key}:`, error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    if (!this.isConnected) {
      logger.warn(
        `Redis not connected, cannot delete hash field ${key}.${field}`
      );
      return 0;
    }

    try {
      return await this.redis.hdel(key, field);
    } catch (error) {
      logger.error(`Failed to delete Redis hash field ${key}.${field}:`, error);
      return 0;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG' && this.isConnected;
    } catch {
      return false;
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get Redis client for advanced operations
   */
  get client(): Redis {
    return this.redis;
  }
}

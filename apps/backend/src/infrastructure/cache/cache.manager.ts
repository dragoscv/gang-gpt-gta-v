import { RedisService } from './redis.service';
import { logger } from '@/infrastructure/logging';

/**
 * Cache Manager for application-level caching operations
 * Provides high-level abstractions over Redis service
 */
export class CacheManager {
  private redis: RedisService;

  // Cache key prefixes for different data types
  private readonly PREFIXES = {
    USER_SESSION: 'session:user:',
    AI_MEMORY: 'ai:memory:',
    FACTION_STATE: 'faction:state:',
    MISSION_CACHE: 'mission:cache:',
    PLAYER_STATS: 'player:stats:',
    WORLD_STATE: 'world:state:',
    TEMPORARY: 'temp:',
  } as const;

  // Default TTL values (in seconds)
  private readonly TTL = {
    USER_SESSION: 3600, // 1 hour
    AI_MEMORY: 86400, // 24 hours
    FACTION_STATE: 1800, // 30 minutes
    MISSION_CACHE: 300, // 5 minutes
    PLAYER_STATS: 600, // 10 minutes
    WORLD_STATE: 120, // 2 minutes
    TEMPORARY: 60, // 1 minute
  } as const;

  constructor(redisService: RedisService) {
    this.redis = redisService;
  }

  /**
   * User session management
   */
  async setUserSession(
    userId: string,
    sessionData: object,
    customTtl?: number
  ): Promise<boolean> {
    const key = this.PREFIXES.USER_SESSION + userId;
    return await this.redis.set(
      key,
      sessionData,
      customTtl || this.TTL.USER_SESSION
    );
  }

  async getUserSession<T = object>(userId: string): Promise<T | null> {
    const key = this.PREFIXES.USER_SESSION + userId;
    return await this.redis.get<T>(key, true);
  }

  async deleteUserSession(userId: string): Promise<boolean> {
    const key = this.PREFIXES.USER_SESSION + userId;
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * AI memory management
   */
  async setAIMemory(
    characterId: string,
    memoryData: object,
    customTtl?: number
  ): Promise<boolean> {
    const key = this.PREFIXES.AI_MEMORY + characterId;
    return await this.redis.set(
      key,
      memoryData,
      customTtl || this.TTL.AI_MEMORY
    );
  }

  async getAIMemory<T = object>(characterId: string): Promise<T | null> {
    const key = this.PREFIXES.AI_MEMORY + characterId;
    return await this.redis.get<T>(key, true);
  }

  async appendAIMemory(
    characterId: string,
    newMemory: object
  ): Promise<boolean> {
    const existingMemory = (await this.getAIMemory(characterId)) || {
      conversations: [],
      events: [],
    };

    // Merge new memory with existing
    const updatedMemory = {
      ...existingMemory,
      ...newMemory,
      lastUpdated: new Date().toISOString(),
    };

    return await this.setAIMemory(characterId, updatedMemory);
  }

  /**
   * Delete AI memory for a character
   */
  async deleteAIMemory(characterId: string): Promise<boolean> {
    const key = this.PREFIXES.AI_MEMORY + characterId;
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * Generic delete method for custom keys
   */
  async deleteKey(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * Faction state management
   */
  async setFactionState(
    factionId: string,
    stateData: object,
    customTtl?: number
  ): Promise<boolean> {
    const key = this.PREFIXES.FACTION_STATE + factionId;
    return await this.redis.set(
      key,
      stateData,
      customTtl || this.TTL.FACTION_STATE
    );
  }

  async getFactionState<T = object>(factionId: string): Promise<T | null> {
    const key = this.PREFIXES.FACTION_STATE + factionId;
    return await this.redis.get<T>(key, true);
  }

  async getAllFactionStates<T = object>(): Promise<Record<string, T>> {
    const pattern = `${this.PREFIXES.FACTION_STATE}*`;
    const keys = await this.redis.keys(pattern);
    const states: Record<string, T> = {};

    if (keys.length > 0) {
      const values = await this.redis.mget(keys);
      keys.forEach((key, index) => {
        const factionId = key.replace(this.PREFIXES.FACTION_STATE, '');
        const value = values[index];
        if (value) {
          try {
            states[factionId] = JSON.parse(value);
          } catch (error) {
            logger.warn(
              `Failed to parse faction state for ${factionId}:`,
              error
            );
          }
        }
      });
    }

    return states;
  }

  /**
   * Mission cache management
   */
  async cacheMission(
    missionId: string,
    missionData: object,
    customTtl?: number
  ): Promise<boolean> {
    const key = this.PREFIXES.MISSION_CACHE + missionId;
    return await this.redis.set(
      key,
      missionData,
      customTtl || this.TTL.MISSION_CACHE
    );
  }

  async getCachedMission<T = object>(missionId: string): Promise<T | null> {
    const key = this.PREFIXES.MISSION_CACHE + missionId;
    return await this.redis.get<T>(key, true);
  }

  async getPlayerActiveMissions(playerId: string): Promise<string[]> {
    const pattern = `${this.PREFIXES.MISSION_CACHE}*`;
    const keys = await this.redis.keys(pattern);
    const activeMissions: string[] = [];

    if (keys.length > 0) {
      const values = await this.redis.mget(keys);
      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            const mission = JSON.parse(value);
            if (mission.playerId === playerId && mission.status === 'active') {
              activeMissions.push(key.replace(this.PREFIXES.MISSION_CACHE, ''));
            }
          } catch (error) {
            logger.warn(`Failed to parse mission cache:`, error);
          }
        }
      });
    }

    return activeMissions;
  }

  /**
   * Player statistics caching
   */
  async setPlayerStats(
    playerId: string,
    stats: object,
    customTtl?: number
  ): Promise<boolean> {
    const key = this.PREFIXES.PLAYER_STATS + playerId;
    return await this.redis.set(key, stats, customTtl || this.TTL.PLAYER_STATS);
  }

  async getPlayerStats<T = object>(playerId: string): Promise<T | null> {
    const key = this.PREFIXES.PLAYER_STATS + playerId;
    return await this.redis.get<T>(key, true);
  }

  /**
   * World state management
   */
  async setWorldState(stateData: object, customTtl?: number): Promise<boolean> {
    const key = `${this.PREFIXES.WORLD_STATE}global`;
    return await this.redis.set(
      key,
      stateData,
      customTtl || this.TTL.WORLD_STATE
    );
  }

  async getWorldState<T = object>(): Promise<T | null> {
    const key = `${this.PREFIXES.WORLD_STATE}global`;
    return await this.redis.get<T>(key, true);
  }

  /**
   * Temporary data storage
   */
  async setTemporary(
    key: string,
    data: object,
    ttlSeconds?: number
  ): Promise<boolean> {
    const fullKey = this.PREFIXES.TEMPORARY + key;
    return await this.redis.set(
      fullKey,
      data,
      ttlSeconds || this.TTL.TEMPORARY
    );
  }

  async getTemporary<T = object>(key: string): Promise<T | null> {
    const fullKey = this.PREFIXES.TEMPORARY + key;
    return await this.redis.get<T>(fullKey, true);
  }

  /**
   * Bulk operations
   */
  async clearUserData(userId: string): Promise<void> {
    const patterns = [
      this.PREFIXES.USER_SESSION + userId,
      this.PREFIXES.PLAYER_STATS + userId,
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)));
      }
    }
  }

  async clearFactionData(factionId: string): Promise<void> {
    const pattern = this.PREFIXES.FACTION_STATE + factionId;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.redis.del(key)));
    }
  }

  /**
   * Utility methods
   */
  async flushTemporary(): Promise<void> {
    const pattern = `${this.PREFIXES.TEMPORARY}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.redis.del(key)));
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number;
    keysByPrefix: Record<string, number>;
    memoryUsage?: string;
  }> {
    try {
      const allKeys = await this.redis.keys('*');
      const keysByPrefix: Record<string, number> = {};

      // Initialize counters
      Object.values(this.PREFIXES).forEach(prefix => {
        keysByPrefix[prefix] = 0;
      });

      // Count keys by prefix
      allKeys.forEach(key => {
        for (const [_name, prefix] of Object.entries(this.PREFIXES)) {
          if (key.startsWith(prefix)) {
            keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
            break;
          }
        }
      });

      const stats = {
        totalKeys: allKeys.length,
        keysByPrefix,
      };

      try {
        // Try to get memory info via INFO command
        const info = await this.redis.client.info('memory');
        if (info) {
          // Parse used_memory from Redis INFO response
          const match = info.match(/used_memory:(\d+)/);
          if (match && match[1]) {
            const bytes = parseInt(match[1], 10);
            (stats as { memoryUsage?: string }).memoryUsage =
              `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;
          }
        }
      } catch (error) {
        // Memory info not available, skip
      }

      return stats;
    } catch (error) {
      logger.warn('Failed to get Redis keys for pattern *:', error);
      // Return fallback stats when Redis is not available
      const keysByPrefix: Record<string, number> = {};
      Object.values(this.PREFIXES).forEach(prefix => {
        keysByPrefix[prefix] = 0;
      });

      return {
        totalKeys: 0,
        keysByPrefix,
        memoryUsage: 'N/A (Redis unavailable)',
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      const isHealthy = await this.redis.healthCheck();
      const latency = Date.now() - start;

      return {
        connected: isHealthy,
        latency,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

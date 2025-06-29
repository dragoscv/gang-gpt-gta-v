import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './cache.manager';
import { RedisService } from './redis.service';

// Mock RedisService
const mockRedisService = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  keys: vi.fn(),
  mget: vi.fn(),
  mset: vi.fn(),
  healthCheck: vi.fn(),
  connected: true,
};

// Mock logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheManager = new CacheManager(
      mockRedisService as unknown as RedisService
    );
  });

  describe('User Session Management', () => {
    describe('setUserSession', () => {
      it('should set user session with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const sessionData = { userId: 'user-123', role: 'player' };

        const result = await cacheManager.setUserSession(
          'user-123',
          sessionData
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'session:user:user-123',
          sessionData,
          3600
        );
      });

      it('should set user session with custom TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const sessionData = { userId: 'user-123', role: 'admin' };

        const result = await cacheManager.setUserSession(
          'user-123',
          sessionData,
          7200
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'session:user:user-123',
          sessionData,
          7200
        );
      });
    });

    describe('getUserSession', () => {
      it('should get user session successfully', async () => {
        const sessionData = { userId: 'user-123', role: 'player' };
        mockRedisService.get.mockResolvedValueOnce(sessionData);

        const result = await cacheManager.getUserSession('user-123');

        expect(result).toEqual(sessionData);
        expect(mockRedisService.get).toHaveBeenCalledWith(
          'session:user:user-123',
          true
        );
      });

      it('should return null for non-existent session', async () => {
        mockRedisService.get.mockResolvedValueOnce(null);

        const result = await cacheManager.getUserSession('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('deleteUserSession', () => {
      it('should delete user session successfully', async () => {
        mockRedisService.del.mockResolvedValueOnce(1);

        const result = await cacheManager.deleteUserSession('user-123');

        expect(result).toBe(true);
        expect(mockRedisService.del).toHaveBeenCalledWith(
          'session:user:user-123'
        );
      });

      it('should return false when session does not exist', async () => {
        mockRedisService.del.mockResolvedValueOnce(0);

        const result = await cacheManager.deleteUserSession('non-existent');

        expect(result).toBe(false);
      });
    });
  });

  describe('AI Memory Management', () => {
    describe('setAIMemory', () => {
      it('should set AI memory with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const memoryData = { context: 'conversation', emotion: 'neutral' };

        const result = await cacheManager.setAIMemory('npc-123', memoryData);

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'ai:memory:npc-123',
          memoryData,
          86400
        );
      });
    });

    describe('getAIMemory', () => {
      it('should get AI memory successfully', async () => {
        const memoryData = { context: 'conversation', emotion: 'happy' };
        mockRedisService.get.mockResolvedValueOnce(memoryData);

        const result = await cacheManager.getAIMemory('npc-123');

        expect(result).toEqual(memoryData);
        expect(mockRedisService.get).toHaveBeenCalledWith(
          'ai:memory:npc-123',
          true
        );
      });
    });

    describe('deleteAIMemory', () => {
      it('should delete AI memory successfully', async () => {
        mockRedisService.del.mockResolvedValueOnce(1);

        const result = await cacheManager.deleteAIMemory('npc-123');

        expect(result).toBe(true);
        expect(mockRedisService.del).toHaveBeenCalledWith('ai:memory:npc-123');
      });
    });
  });

  describe('Faction State Management', () => {
    describe('setFactionState', () => {
      it('should set faction state with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const factionData = { territory: 'downtown', influence: 75 };

        const result = await cacheManager.setFactionState(
          'faction-123',
          factionData
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'faction:state:faction-123',
          factionData,
          1800
        );
      });
    });

    describe('getFactionState', () => {
      it('should get faction state successfully', async () => {
        const factionData = { territory: 'downtown', influence: 75 };
        mockRedisService.get.mockResolvedValueOnce(factionData);

        const result = await cacheManager.getFactionState('faction-123');

        expect(result).toEqual(factionData);
      });
    });
  });
  describe('Mission Cache Management', () => {
    describe('cacheMission', () => {
      it('should set mission cache with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const missionData = { type: 'heist', difficulty: 'hard' };

        const result = await cacheManager.cacheMission(
          'mission-123',
          missionData
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'mission:cache:mission-123',
          missionData,
          300
        );
      });
    });

    describe('getCachedMission', () => {
      it('should get mission cache successfully', async () => {
        const missionData = { type: 'heist', difficulty: 'hard' };
        mockRedisService.get.mockResolvedValueOnce(missionData);

        const result = await cacheManager.getCachedMission('mission-123');

        expect(result).toEqual(missionData);
      });
    });
    describe('getPlayerActiveMissions', () => {
      it('should get player active missions', async () => {
        const missions = ['mission-1', 'mission-2'];
        const keys = ['mission:cache:mission-1', 'mission:cache:mission-2'];
        const missionData = [
          JSON.stringify({
            playerId: 'player-123',
            status: 'active',
            missionId: 'mission-1',
          }),
          JSON.stringify({
            playerId: 'player-123',
            status: 'active',
            missionId: 'mission-2',
          }),
        ];

        mockRedisService.keys.mockResolvedValueOnce(keys);
        mockRedisService.mget.mockResolvedValueOnce(missionData);

        const result = await cacheManager.getPlayerActiveMissions('player-123');

        expect(result).toEqual(missions);
      });
    });
  });

  describe('Player Stats Management', () => {
    describe('setPlayerStats', () => {
      it('should set player stats with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const statsData = { level: 50, experience: 125000 };

        const result = await cacheManager.setPlayerStats(
          'player-123',
          statsData
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'player:stats:player-123',
          statsData,
          600
        );
      });
    });
    describe('getPlayerStats', () => {
      it('should get player stats successfully', async () => {
        const statsData = { level: 50, experience: 125000 };
        mockRedisService.get.mockResolvedValueOnce(statsData);

        const result = await cacheManager.getPlayerStats('player-123');

        expect(result).toEqual(statsData);
      });
    });
  });

  describe('World State Management', () => {
    describe('setWorldState', () => {
      it('should set world state with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const worldData = { time: '14:30', weather: 'sunny' };

        const result = await cacheManager.setWorldState(worldData);

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'world:state:global',
          worldData,
          120
        );
      });
    });
    describe('getWorldState', () => {
      it('should get world state successfully', async () => {
        const worldData = { time: '14:30', weather: 'sunny' };
        mockRedisService.get.mockResolvedValueOnce(worldData);

        const result = await cacheManager.getWorldState();

        expect(result).toEqual(worldData);
      });
    });
  });

  describe('Temporary Data Management', () => {
    describe('setTemporary', () => {
      it('should set temporary data with default TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const tempData = { action: 'processing', timestamp: Date.now() };

        const result = await cacheManager.setTemporary('temp-123', tempData);

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'temp:temp-123',
          tempData,
          60
        );
      });

      it('should set temporary data with custom TTL', async () => {
        mockRedisService.set.mockResolvedValueOnce(true);
        const tempData = { action: 'processing', timestamp: Date.now() };

        const result = await cacheManager.setTemporary(
          'temp-123',
          tempData,
          300
        );

        expect(result).toBe(true);
        expect(mockRedisService.set).toHaveBeenCalledWith(
          'temp:temp-123',
          tempData,
          300
        );
      });
    });
    describe('getTemporary', () => {
      it('should get temporary data successfully', async () => {
        const tempData = { action: 'processing', timestamp: 1749356656783 };
        mockRedisService.get.mockResolvedValueOnce(tempData);

        const result = await cacheManager.getTemporary('temp-123');

        expect(result).toEqual(tempData);
        expect(mockRedisService.get).toHaveBeenCalledWith(
          'temp:temp-123',
          true
        );
      });
    });
  });
  describe('Cache Health and Statistics', () => {
    describe('healthCheck', () => {
      it('should return connected status when Redis is healthy', async () => {
        mockRedisService.healthCheck.mockResolvedValueOnce(true);

        const result = await cacheManager.healthCheck();

        expect(result.connected).toBe(true);
        expect(result.latency).toBeGreaterThanOrEqual(0);
        expect(mockRedisService.healthCheck).toHaveBeenCalledOnce();
      });

      it('should return disconnected status when Redis is unhealthy', async () => {
        mockRedisService.healthCheck.mockRejectedValueOnce(
          new Error('Connection failed')
        );

        const result = await cacheManager.healthCheck();

        expect(result.connected).toBe(false);
        expect(result.error).toBe('Connection failed');
      });
    });

    describe('getCacheStats', () => {
      it('should return cache statistics', async () => {
        mockRedisService.keys.mockResolvedValueOnce([
          'session:user:1',
          'session:user:2',
          'ai:memory:1',
          'faction:state:1',
          'player:stats:1',
          'player:stats:2',
          'player:stats:3',
          'world:state:1',
        ]);

        const stats = await cacheManager.getCacheStats();

        expect(stats).toEqual({
          totalKeys: 8,
          keysByPrefix: expect.any(Object),
        });
        expect(stats.totalKeys).toBe(8);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('clearUserData', () => {
      it('should clear user-related cache data', async () => {
        mockRedisService.keys
          .mockResolvedValueOnce(['user:session:user-123'])
          .mockResolvedValueOnce(['player:stats:user-123']);
        mockRedisService.del.mockResolvedValue(1);

        await cacheManager.clearUserData('user-123');
        expect(mockRedisService.keys).toHaveBeenCalledWith(
          'session:user:user-123'
        );
        expect(mockRedisService.keys).toHaveBeenCalledWith(
          'player:stats:user-123'
        );
      });
    });
    describe('clearFactionData', () => {
      it('should clear faction-related cache data', async () => {
        mockRedisService.keys.mockResolvedValueOnce([
          'faction:state:faction-123',
        ]);
        mockRedisService.del.mockResolvedValue(1);

        await cacheManager.clearFactionData('faction-123');

        expect(mockRedisService.keys).toHaveBeenCalledWith(
          'faction:state:faction-123'
        );
      });
    });

    describe('flushTemporary', () => {
      it('should clear all temporary cache data', async () => {
        mockRedisService.keys.mockResolvedValueOnce(['temp:key1', 'temp:key2']);
        mockRedisService.del.mockResolvedValue(1);

        await cacheManager.flushTemporary();

        expect(mockRedisService.keys).toHaveBeenCalledWith('temp:*');
      });
    });
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';

// Mock Redis
vi.mock('ioredis', () => {
  const mockRedis = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(0),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(0),
    ttl: vi.fn().mockResolvedValue(-1),
    keys: vi.fn().mockResolvedValue([]),
    flushall: vi.fn().mockResolvedValue('OK'),
    ping: vi.fn().mockResolvedValue('PONG'),
    mget: vi.fn().mockResolvedValue([]),
    mset: vi.fn().mockResolvedValue('OK'),
    hset: vi.fn().mockResolvedValue(1),
    hget: vi.fn().mockResolvedValue(null),
    hgetall: vi.fn().mockResolvedValue({}),
    hdel: vi.fn().mockResolvedValue(0),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    status: 'ready',
  };

  return {
    Redis: vi.fn(() => mockRedis),
  };
});

// Mock config
vi.mock('@/config', () => ({
  default: {
    redis: {
      url: 'redis://localhost:4832',
      password: 'test-password',
    },
  },
}));

// Mock logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisInstance: any;
  beforeEach(() => {
    vi.clearAllMocks();

    // Get the mock Redis instance
    const RedisConstructor = vi.mocked(Redis);
    redisService = new RedisService();
    mockRedisInstance = RedisConstructor.mock.results[0].value;

    // Set the service as connected for tests
    (redisService as any).isConnected = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create Redis instance with correct configuration', () => {
      expect(Redis).toHaveBeenCalledWith('redis://localhost:4832', {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        enableOfflineQueue: false,
        password: 'test-password',
      });
    });
    it('should set up event listeners', () => {
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function)
      );
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        'close',
        expect.any(Function)
      );
      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        'end',
        expect.any(Function)
      );
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      mockRedisInstance.connect.mockResolvedValueOnce(undefined);

      await redisService.connect();

      expect(mockRedisInstance.connect).toHaveBeenCalledOnce();
    });

    it('should handle connection errors gracefully', async () => {
      const error = new Error('Connection failed');
      mockRedisInstance.connect.mockRejectedValueOnce(error);

      await expect(redisService.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      mockRedisInstance.disconnect.mockResolvedValueOnce(undefined);

      await redisService.disconnect();

      expect(mockRedisInstance.disconnect).toHaveBeenCalledOnce();
    });
  });

  describe('basic operations', () => {
    describe('get', () => {
      it('should get value successfully', async () => {
        mockRedisInstance.get.mockResolvedValueOnce('test-value');

        const result = await redisService.get('test-key');

        expect(result).toBe('test-value');
        expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      });

      it('should return null for non-existent keys', async () => {
        mockRedisInstance.get.mockResolvedValueOnce(null);

        const result = await redisService.get('non-existent');

        expect(result).toBeNull();
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisService.get('test-key');

        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should set value successfully', async () => {
        mockRedisInstance.set.mockResolvedValueOnce('OK');

        const result = await redisService.set('test-key', 'test-value');

        expect(result).toBe(true);
        expect(mockRedisInstance.set).toHaveBeenCalledWith(
          'test-key',
          'test-value'
        );
      });
      it('should set value with TTL', async () => {
        mockRedisInstance.setex.mockResolvedValueOnce('OK');

        const result = await redisService.set('test-key', 'test-value', 3600);

        expect(result).toBe(true);
        expect(mockRedisInstance.setex).toHaveBeenCalledWith(
          'test-key',
          3600,
          'test-value'
        );
      });
      it('should handle objects by serializing to JSON', async () => {
        const testObj = { name: 'test', value: 123 };
        mockRedisInstance.set.mockResolvedValueOnce('OK');

        const result = await redisService.set('test-key', testObj);

        expect(result).toBe(true);
        expect(mockRedisInstance.set).toHaveBeenCalledWith(
          'test-key',
          JSON.stringify(testObj)
        );
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.set.mockRejectedValueOnce(new Error('Redis error'));

        await expect(
          redisService.set('test-key', 'test-value')
        ).resolves.not.toThrow();
      });
    });
    describe('del', () => {
      it('should delete key successfully', async () => {
        mockRedisInstance.del.mockResolvedValueOnce(1);

        const result = await redisService.del('test-key');

        expect(result).toBe(1);
        expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
      });

      it('should return 0 when key does not exist', async () => {
        mockRedisInstance.del.mockResolvedValueOnce(0);

        const result = await redisService.del('non-existent');

        expect(result).toBe(0);
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.del.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisService.del('test-key');

        expect(result).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return true for existing keys', async () => {
        mockRedisInstance.exists.mockResolvedValueOnce(1);

        const result = await redisService.exists('test-key');

        expect(result).toBe(true);
        expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
      });

      it('should return false for non-existent keys', async () => {
        mockRedisInstance.exists.mockResolvedValueOnce(0);

        const result = await redisService.exists('non-existent');

        expect(result).toBe(false);
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.exists.mockRejectedValueOnce(
          new Error('Redis error')
        );

        const result = await redisService.exists('test-key');

        expect(result).toBe(false);
      });
    });

    describe('expire', () => {
      it('should set expiry successfully', async () => {
        mockRedisInstance.expire.mockResolvedValueOnce(1);

        const result = await redisService.expire('test-key', 3600);

        expect(result).toBe(true);
        expect(mockRedisInstance.expire).toHaveBeenCalledWith('test-key', 3600);
      });

      it('should return false for non-existent keys', async () => {
        mockRedisInstance.expire.mockResolvedValueOnce(0);

        const result = await redisService.expire('non-existent', 3600);

        expect(result).toBe(false);
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.expire.mockRejectedValueOnce(
          new Error('Redis error')
        );

        const result = await redisService.expire('test-key', 3600);

        expect(result).toBe(false);
      });
    });
  });
  describe('healthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedisInstance.ping.mockResolvedValueOnce('PONG');

      const result = await redisService.healthCheck();

      expect(result).toBe(true);
      expect(mockRedisInstance.ping).toHaveBeenCalledOnce();
    });

    it('should return false when Redis ping fails', async () => {
      mockRedisInstance.ping.mockRejectedValueOnce(
        new Error('Connection failed')
      );

      const result = await redisService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('connected property', () => {
    it('should return connection status', () => {
      const isConnected = redisService.connected;
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('keys operation', () => {
    it('should get keys by pattern', async () => {
      mockRedisInstance.keys.mockResolvedValueOnce(['key1', 'key2', 'key3']);

      const result = await redisService.keys('test:*');

      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(mockRedisInstance.keys).toHaveBeenCalledWith('test:*');
    });

    it('should handle errors gracefully', async () => {
      mockRedisInstance.keys.mockRejectedValueOnce(new Error('Redis error'));

      const result = await redisService.keys('test:*');

      expect(result).toEqual([]);
    });
  });
  describe('mget operation', () => {
    it('should get multiple values', async () => {
      mockRedisInstance.mget.mockResolvedValueOnce(['value1', 'value2', null]);

      const result = await redisService.mget(['key1', 'key2', 'key3']);

      expect(result).toEqual(['value1', 'value2', null]);
      expect(mockRedisInstance.mget).toHaveBeenCalledWith(
        'key1',
        'key2',
        'key3'
      );
    });

    it('should handle errors gracefully', async () => {
      mockRedisInstance.mget.mockRejectedValueOnce(new Error('Redis error'));

      const result = await redisService.mget(['key1', 'key2']);

      expect(result).toEqual([null, null]);
    });
  });
  describe('mset operation', () => {
    it('should set multiple values', async () => {
      mockRedisInstance.mset.mockResolvedValueOnce('OK');

      await redisService.mset({
        key1: 'value1',
        key2: { name: 'test' },
      });

      expect(mockRedisInstance.mset).toHaveBeenCalledWith(
        'key1',
        'value1',
        'key2',
        JSON.stringify({ name: 'test' })
      );
    });
    it('should handle errors gracefully', async () => {
      mockRedisInstance.mset.mockRejectedValueOnce(new Error('Redis error'));

      await expect(redisService.mset({ key1: 'value1' })).rejects.toThrow(
        'Redis error'
      );
    });
  });

  describe('hash operations', () => {
    describe('hset', () => {
      it('should set hash field with string value', async () => {
        mockRedisInstance.hset.mockResolvedValueOnce(1);

        const result = await redisService.hset('test-hash', 'field1', 'value1');

        expect(result).toBe(1);
        expect(mockRedisInstance.hset).toHaveBeenCalledWith(
          'test-hash',
          'field1',
          'value1'
        );
      });

      it('should set hash field with object value', async () => {
        const obj = { test: 'value' };
        mockRedisInstance.hset.mockResolvedValueOnce(1);

        const result = await redisService.hset('test-hash', 'field1', obj);

        expect(result).toBe(1);
        expect(mockRedisInstance.hset).toHaveBeenCalledWith(
          'test-hash',
          'field1',
          JSON.stringify(obj)
        );
      });

      it('should return 0 when not connected', async () => {
        (redisService as any).isConnected = false;

        const result = await redisService.hset('test-hash', 'field1', 'value1');

        expect(result).toBe(0);
        expect(mockRedisInstance.hset).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.hset.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisService.hset('test-hash', 'field1', 'value1');

        expect(result).toBe(0);
      });
    });

    describe('hget', () => {
      it('should get hash field value', async () => {
        mockRedisInstance.hget.mockResolvedValueOnce('test-value');

        const result = await redisService.hget('test-hash', 'field1');

        expect(result).toBe('test-value');
        expect(mockRedisInstance.hget).toHaveBeenCalledWith(
          'test-hash',
          'field1'
        );
      });

      it('should parse JSON when requested', async () => {
        const obj = { test: 'value' };
        mockRedisInstance.hget.mockResolvedValueOnce(JSON.stringify(obj));

        const result = await redisService.hget('test-hash', 'field1', true);

        expect(result).toEqual(obj);
      });

      it('should return raw value if JSON parsing fails', async () => {
        mockRedisInstance.hget.mockResolvedValueOnce('invalid-json');

        const result = await redisService.hget('test-hash', 'field1', true);

        expect(result).toBe('invalid-json');
      });

      it('should return null when not connected', async () => {
        (redisService as any).isConnected = false;

        const result = await redisService.hget('test-hash', 'field1');

        expect(result).toBeNull();
        expect(mockRedisInstance.hget).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.hget.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisService.hget('test-hash', 'field1');

        expect(result).toBeNull();
      });
    });

    describe('hgetall', () => {
      it('should get all hash fields', async () => {
        const hashData = { field1: 'value1', field2: 'value2' };
        mockRedisInstance.hgetall.mockResolvedValueOnce(hashData);

        const result = await redisService.hgetall('test-hash');

        expect(result).toEqual(hashData);
        expect(mockRedisInstance.hgetall).toHaveBeenCalledWith('test-hash');
      });

      it('should parse JSON values when requested', async () => {
        const hashData = {
          field1: JSON.stringify({ test: 'value1' }),
          field2: 'value2',
        };
        mockRedisInstance.hgetall.mockResolvedValueOnce(hashData);

        const result = await redisService.hgetall('test-hash', true);

        expect(result).toEqual({
          field1: { test: 'value1' },
          field2: 'value2',
        });
      });

      it('should return null for empty hash', async () => {
        mockRedisInstance.hgetall.mockResolvedValueOnce({});

        const result = await redisService.hgetall('test-hash');

        expect(result).toBeNull();
      });

      it('should return null when not connected', async () => {
        (redisService as any).isConnected = false;

        const result = await redisService.hgetall('test-hash');

        expect(result).toBeNull();
        expect(mockRedisInstance.hgetall).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.hgetall.mockRejectedValueOnce(
          new Error('Redis error')
        );

        const result = await redisService.hgetall('test-hash');

        expect(result).toBeNull();
      });
    });

    describe('hdel', () => {
      it('should delete hash field', async () => {
        mockRedisInstance.hdel.mockResolvedValueOnce(1);

        const result = await redisService.hdel('test-hash', 'field1');

        expect(result).toBe(1);
        expect(mockRedisInstance.hdel).toHaveBeenCalledWith(
          'test-hash',
          'field1'
        );
      });

      it('should return 0 when not connected', async () => {
        (redisService as any).isConnected = false;

        const result = await redisService.hdel('test-hash', 'field1');

        expect(result).toBe(0);
        expect(mockRedisInstance.hdel).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockRedisInstance.hdel.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisService.hdel('test-hash', 'field1');

        expect(result).toBe(0);
      });
    });
  });

  describe('disconnected state handling', () => {
    beforeEach(() => {
      (redisService as any).isConnected = false;
    });

    it('should return false for set when disconnected', async () => {
      const result = await redisService.set('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should return null for get when disconnected', async () => {
      const result = await redisService.get('test-key');
      expect(result).toBeNull();
    });

    it('should return 0 for del when disconnected', async () => {
      const result = await redisService.del('test-key');
      expect(result).toBe(0);
    });

    it('should return false for exists when disconnected', async () => {
      const result = await redisService.exists('test-key');
      expect(result).toBe(false);
    });

    it('should return false for expire when disconnected', async () => {
      const result = await redisService.expire('test-key', 3600);
      expect(result).toBe(false);
    });

    it('should return empty array for keys when disconnected', async () => {
      const result = await redisService.keys('*');
      expect(result).toEqual([]);
    });

    it('should return null array for mget when disconnected', async () => {
      const result = await redisService.mget(['key1', 'key2']);
      expect(result).toEqual([null, null]);
    });
  });

  describe('event listeners', () => {
    it('should handle connect event', () => {
      const connectHandler = mockRedisInstance.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      // Simulate connect event
      connectHandler();

      expect((redisService as any).isConnected).toBe(true);
    });

    it('should handle error event', () => {
      const errorHandler = mockRedisInstance.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      // Simulate error event
      errorHandler(new Error('Connection error'));

      expect((redisService as any).isConnected).toBe(false);
    });

    it('should handle ECONNREFUSED error specifically', () => {
      const errorHandler = mockRedisInstance.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      // Simulate ECONNREFUSED error
      errorHandler(new Error('ECONNREFUSED'));

      expect((redisService as any).isConnected).toBe(false);
    });

    it('should handle close event', () => {
      const closeHandler = mockRedisInstance.on.mock.calls.find(
        call => call[0] === 'close'
      )[1];

      // Simulate close event
      closeHandler();

      expect((redisService as any).isConnected).toBe(false);
    });

    it('should handle end event', () => {
      const endHandler = mockRedisInstance.on.mock.calls.find(
        call => call[0] === 'end'
      )[1];

      // Simulate end event
      endHandler();

      expect((redisService as any).isConnected).toBe(false);
    });
  });

  describe('JSON parsing with get method', () => {
    it('should parse JSON when parseJson is true', async () => {
      const obj = { test: 'value', number: 123 };
      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(obj));

      const result = await redisService.get('test-key', true);

      expect(result).toEqual(obj);
    });

    it('should return raw value if JSON parsing fails', async () => {
      mockRedisInstance.get.mockResolvedValueOnce('invalid-json');

      const result = await redisService.get('test-key', true);

      expect(result).toBe('invalid-json');
    });
  });

  describe('client property', () => {
    it('should return Redis client instance', async () => {
      const client = redisService.client;
      expect(client).toBe(mockRedisInstance);
    });
  });
});

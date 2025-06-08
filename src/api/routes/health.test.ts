/**
 * Tests for health check endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import createHealthCheckRouter from './health';

// Mock dependencies
const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
};

const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  healthCheck: vi.fn(),
};

const mockAI = {
  isHealthy: vi.fn(),
  getStatus: vi.fn(),
};

vi.mock('../../infrastructure/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../infrastructure/cache/redis.service', () => ({
  RedisService: vi.fn().mockImplementation(() => mockRedis),
}));

vi.mock('../../modules/ai/ai.service', () => ({
  AIService: vi.fn().mockImplementation(() => mockAI),
}));

vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../config', () => ({
  default: {
    app: {
      name: 'gang-gpt-test',
      version: '0.1.0',
      environment: 'test',
    },
    database: {
      url: 'postgresql://test',
    },
    redis: {
      host: 'localhost',
      port: 4832,
    },
    ai: {
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'test-api-key',
    },
  },
}));

describe('Health Routes', () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(express.json()); // Set up default mocks for healthy state
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.healthCheck.mockResolvedValue(true);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue('health-test');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.connected = true;
    mockAI.isHealthy.mockResolvedValue(true);

    // Create health check router with mocked dependencies
    const healthRouter = createHealthCheckRouter(
      mockPrisma as any,
      mockRedis as any,
      mockAI as any
    );
    app.use('/', healthRouter);

    vi.clearAllMocks(); // Re-setup mocks after clearing
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.healthCheck.mockResolvedValue(true);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue('health-test');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.connected = true;
    mockAI.isHealthy.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      // Mock database to be healthy
      mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);

      // Mock Redis to be healthy
      mockRedis.ping.mockResolvedValue('PONG');

      // Mock AI to be healthy
      mockAI.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
        services: expect.any(Object),
        system: expect.any(Object),
      });
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status when all services are healthy', async () => {
      // Mock successful service checks
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      mockRedis.ping.mockResolvedValue('PONG');
      mockAI.isHealthy.mockReturnValue(true);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
        services: {
          database: {
            status: 'up',
            responseTime: expect.any(Number),
            details: expect.any(Array),
          },
          redis: {
            status: 'up',
            responseTime: expect.any(Number),
            details: {
              ping: 'PONG',
            },
          },
          ai: {
            status: 'up',
            responseTime: expect.any(Number),
            details: {
              configured: true,
              endpoint: '***configured***',
            },
          },
        },
        system: {
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
          cpu: {
            percentage: expect.any(Number),
          },
          uptime: expect.any(Number),
        },
      });
    });

    it('should return unhealthy status when database is down', async () => {
      // Mock failed database connection
      mockPrisma.$queryRaw.mockRejectedValue(
        new Error('Database connection failed')
      );
      mockRedis.ping.mockResolvedValue('PONG');
      mockAI.isHealthy.mockReturnValue(true);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.database.status).toBe('down');
      expect(response.body.services.database.error).toContain(
        'Database connection failed'
      );
    });
  });
  describe('GET /health/readiness', () => {
    it('should return ready when all services are operational', async () => {
      // Mock successful connections
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      mockRedis.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health/readiness');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
      });
    });
    it('should return not ready when database is down', async () => {
      // Mock failed database connection
      mockPrisma.$queryRaw.mockRejectedValue(
        new Error('Database connection failed')
      );
      mockRedis.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health/readiness');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
    });
  });
  describe('GET /health/liveness', () => {
    it('should return alive status', async () => {
      const response = await request(app).get('/health/liveness');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
      });
    });
  });
  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app).get('/health/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: {
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          external: expect.any(Number),
        },
        process: {
          pid: expect.any(Number),
          platform: expect.any(String),
          version: expect.any(String),
        },
      });
    });
  });
  describe('GET /health/service/:service', () => {
    it('should return database service status', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await request(app).get('/health/service/database');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        service: 'database',
        status: 'up',
        responseTime: expect.any(Number),
        timestamp: expect.any(String),
        details: expect.any(Array),
      });
    });
    it('should return redis service status', async () => {
      mockRedis.connected = true;
      mockRedis.healthCheck.mockResolvedValue(true);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('health-test');
      mockRedis.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/health/service/redis');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        service: 'redis',
        status: 'up',
        responseTime: expect.any(Number),
        timestamp: expect.any(String),
        details: {
          ping: 'PONG',
        },
      });
    });

    it('should return 404 for unknown service', async () => {
      const response = await request(app).get('/health/service/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Unknown service',
        availableServices: ['database', 'redis', 'ai'],
      });
    });
  });
});

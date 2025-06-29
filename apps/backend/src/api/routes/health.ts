import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { AIService } from '@/modules/ai/ai.service';
import config from '@/config';
import { logger } from '@/infrastructure/logging';
import { performance } from 'perf_hooks';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      details?: Record<string, unknown>;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      percentage: number;
    };
  };
}

/**
 * Production Health Check Service
 * Provides comprehensive health monitoring for all services
 */
export class HealthCheckService {
  private prisma: PrismaClient;
  private redis: RedisService;
  private aiService: AIService | undefined;
  private startTime: number;

  constructor(
    prisma: PrismaClient,
    redis: RedisService,
    aiService?: AIService
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.aiService = aiService;
    this.startTime = Date.now();
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<{
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    const start = performance.now();

    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Test with timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ); // Database-agnostic health check
      const healthQuery = this.prisma.$queryRaw`SELECT 1 as test`;
      const result = await Promise.race([healthQuery, timeout]);
      const responseTime = performance.now() - start;

      // Convert BigInt values to numbers for JSON serialization
      const serializableResult = JSON.parse(
        JSON.stringify(result, (_key, value) =>
          typeof value === 'bigint' ? Number(value) : value
        )
      );

      // Check for slow response
      if (responseTime > 1000) {
        return {
          status: 'degraded',
          responseTime,
          details: serializableResult,
          error: 'Slow database response',
        };
      }

      return {
        status: 'up',
        responseTime,
        details: serializableResult,
      };
    } catch (error) {
      const responseTime = performance.now() - start;
      logger.error('Database health check failed:', error);

      return {
        status: 'down',
        responseTime,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<{
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    const start = performance.now();

    try {
      if (!this.redis.connected) {
        return {
          status: 'down',
          responseTime: performance.now() - start,
          error: 'Redis not connected',
        };
      }

      // Test ping
      const pingResult = await this.redis.healthCheck();

      if (!pingResult) {
        return {
          status: 'down',
          responseTime: performance.now() - start,
          error: 'Redis ping failed',
        };
      }

      // Test read/write operations
      const testKey = `health-check-${Date.now()}`;
      const testValue = 'health-test';

      await this.redis.set(testKey, testValue, 10); // 10 second TTL
      const retrievedValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      const responseTime = performance.now() - start;

      if (retrievedValue !== testValue) {
        return {
          status: 'degraded',
          responseTime,
          error: 'Redis read/write test failed',
        };
      }

      // Check for slow response
      if (responseTime > 500) {
        return {
          status: 'degraded',
          responseTime,
          details: { ping: 'PONG' },
          error: 'Slow Redis response',
        };
      }

      return {
        status: 'up',
        responseTime,
        details: { ping: 'PONG' },
      };
    } catch (error) {
      const responseTime = performance.now() - start;
      logger.error('Redis health check failed:', error);

      return {
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  /**
   * Check AI service health
   */
  private async checkAIService(): Promise<{
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
  }> {
    const start = performance.now();

    try {
      if (!this.aiService) {
        return {
          status: 'down',
          responseTime: performance.now() - start,
          error: 'AI service not available',
        };
      }

      // Simple health check - just verify AI service is configured
      // For production, we'll do a lightweight config check instead of API call
      const hasConfig = !!(config.ai?.endpoint && config.ai?.apiKey);
      const responseTime = performance.now() - start;

      if (!hasConfig) {
        return {
          status: 'down',
          responseTime,
          error: 'AI service not configured',
        };
      }

      return {
        status: 'up',
        responseTime,
        details: {
          configured: true,
          endpoint: config.ai.endpoint ? '***configured***' : 'not set',
        },
      };
    } catch (error) {
      const responseTime = performance.now() - start;
      logger.error('AI service health check failed:', error);

      return {
        status: 'down',
        responseTime,
        error:
          error instanceof Error ? error.message : 'Unknown AI service error',
      };
    }
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      percentage: number;
    };
    uptime: number;
  } {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        percentage: Math.round(
          Number(cpuUsage.user + cpuUsage.system) / 1000000
        ), // Convert to percentage
      },
      uptime: Math.round(process.uptime()),
    };
  }
  /**
   * Determine overall health status
   */
  private determineOverallStatus(
    services: HealthStatus['services']
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(service => service.status);

    // For production readiness, we can operate in degraded mode without Redis
    // Only database and AI are critical for basic functionality
    const criticalServices = ['database', 'ai'];
    const criticalStatuses = criticalServices.map(
      service => services[service]?.status
    );

    // If all services are up, we're healthy
    if (statuses.every(status => status === 'up')) {
      return 'healthy';
    }

    // If any critical service is down, we're unhealthy
    if (criticalStatuses.some(status => status === 'down')) {
      return 'unhealthy';
    }

    // If critical services are up but non-critical (Redis) might be down, we're degraded but operational
    if (
      criticalStatuses.every(status => status === 'up' || status === 'degraded')
    ) {
      return 'degraded';
    }

    return 'degraded';
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    logger.info('Performing health check...');

    // Run all service checks in parallel
    const [databaseHealth, redisHealth, aiHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAIService(),
    ]);

    const services = {
      database: databaseHealth,
      redis: redisHealth,
      ai: aiHealth,
    };

    const overallStatus = this.determineOverallStatus(services);
    const systemMetrics = this.getSystemMetrics();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.app.environment,
      services,
      system: systemMetrics,
    };

    logger.info(`Health check completed: ${overallStatus}`, {
      status: overallStatus,
      responseTime: Object.values(services).reduce(
        (sum, service) => sum + service.responseTime,
        0
      ),
    });

    return healthStatus;
  }

  /**
   * Quick liveness check (for load balancers)
   */
  async isAlive(): Promise<boolean> {
    try {
      // Quick check - just verify the process is running
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Readiness check (for Kubernetes)
   */
  async isReady(): Promise<boolean> {
    try {
      // Quick checks for critical services only
      // Redis is not critical for basic functionality - we can operate in degraded mode
      const isDbReady = await this.prisma.$queryRaw`SELECT 1`;

      // Only require database to be ready for basic operations
      // Redis failure should not prevent readiness
      return !!isDbReady;
    } catch {
      return false;
    }
  }
}

/**
 * Health check router
 */
export function createHealthCheckRouter(
  prisma: PrismaClient,
  redis: RedisService,
  aiService?: AIService
): Router {
  const router = Router();
  const healthService = new HealthCheckService(prisma, redis, aiService);

  // Comprehensive health check
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const health = await healthService.checkHealth();

      const statusCode =
        health.status === 'healthy'
          ? 200
          : health.status === 'degraded'
            ? 200
            : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check endpoint failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Detailed health check
  router.get('/health/detailed', async (_req: Request, res: Response) => {
    try {
      const health = await healthService.checkHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      logger.error('Detailed health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Readiness check (alias for ready)
  router.get('/health/readiness', async (_req: Request, res: Response) => {
    try {
      const isReady = await healthService.isReady();

      if (isReady) {
        res
          .status(200)
          .json({ status: 'ready', timestamp: new Date().toISOString() });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks: { database: 'not ready', redis: 'not ready' },
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: { database: 'not ready', redis: 'not ready' },
      });
    }
  });

  // Liveness check (alias for live)
  router.get('/health/liveness', async (_req: Request, res: Response) => {
    try {
      const isAlive = await healthService.isAlive();

      if (isAlive) {
        res
          .status(200)
          .json({ status: 'alive', timestamp: new Date().toISOString() });
      } else {
        res
          .status(503)
          .json({ status: 'dead', timestamp: new Date().toISOString() });
      }
    } catch (error) {
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // System metrics endpoint
  router.get('/health/metrics', async (_req: Request, res: Response) => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      res.status(200).json({
        timestamp: new Date().toISOString(),
        uptime,
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
        },
      });
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Service-specific health checks
  router.get(
    '/health/service/:service',
    async (req: Request, res: Response): Promise<void> => {
      const { service } = req.params;

      try {
        let result;

        switch (service) {
          case 'database':
            result = await healthService['checkDatabase']();
            break;
          case 'redis':
            result = await healthService['checkRedis']();
            break;
          case 'ai':
            result = await healthService['checkAIService']();
            break;
          default:
            res.status(404).json({
              error: 'Unknown service',
              availableServices: ['database', 'redis', 'ai'],
            });
            return;
        }

        const statusCode = result.status === 'up' ? 200 : 503;
        res.status(statusCode).json({
          service,
          ...result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(503).json({
          service,
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  return router;
}

export default createHealthCheckRouter;

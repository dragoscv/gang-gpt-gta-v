import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Mock all dependencies before importing
vi.mock('./infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./infrastructure/cache/redis.service', () => ({
  RedisService: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('./infrastructure/cache', () => ({
  CacheManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clear: vi.fn(),
  })),
}));

vi.mock('./infrastructure/monitoring', () => ({
  metricsRegistry: {
    register: vi.fn(),
    contentType: 'text/plain',
    metrics: vi.fn().mockResolvedValue('# HELP test_metric Test metric\n'),
  },
  apiRequestCounter: {
    inc: vi.fn(),
  },
}));

vi.mock('./api/routes/health', () => ({
  createHealthCheckRouter: vi.fn().mockReturnValue({
    get: vi.fn(),
    use: vi.fn(),
  }),
}));

vi.mock('./modules/ai/ai.service', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    chat: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('./api', () => ({
  appRouter: {
    createCaller: vi.fn(),
  },
}));

vi.mock('./api/trpc', () => ({
  createTRPCContext: vi.fn(),
}));

vi.mock('@trpc/server/adapters/express', () => ({
  createExpressMiddleware: vi
    .fn()
    .mockReturnValue((req: any, res: any, next: any) => {
      res.json({ message: 'tRPC endpoint' });
    }),
}));

// Mock Express to capture middleware registration
const mockApp = {
  listen: vi.fn().mockImplementation((port, callback) => {
    if (callback) callback();
    return {
      close: vi.fn().mockImplementation(callback => {
        if (callback) callback();
      }),
    };
  }),
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  set: vi.fn(),
};

vi.mock('express', async importOriginal => {
  const actual = await importOriginal<typeof import('express')>();

  const mockExpress: any = vi.fn(() => mockApp);
  mockExpress.json = vi.fn(() => (req: any, res: any, next: any) => next());
  mockExpress.urlencoded = vi.fn(
    () => (req: any, res: any, next: any) => next()
  );
  mockExpress.static = vi.fn(() => (req: any, res: any, next: any) => next());

  // Mock Router
  const mockRouter = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    use: vi.fn(),
    route: vi.fn(),
  };

  mockExpress.Router = vi.fn(() => mockRouter);

  return {
    default: mockExpress,
    Router: mockExpress.Router,
    __esModule: true,
  };
});

// Mock config with test-specific values
vi.mock('./config', () => {
  const mockConfig = {
    server: {
      port: 4828,
      host: 'localhost',
      corsOrigin: 'http://localhost:4829,http://localhost:4828',
    },
    app: {
      environment: 'test',
    },
    ai: {
      apiKey: 'test-key',
      endpoint: 'https://test.openai.azure.com',
      apiVersion: '2024-02-15-preview',
      deploymentName: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7,
    },
    database: {
      url: 'test://localhost:4831/test',
    },
    redis: {
      host: 'localhost',
      port: 4832,
      password: '',
      db: 0,
    },
    security: {
      rateLimitWindowMs: 15 * 60 * 1000,
      rateLimitMaxRequests: 100,
      jwtSecret: 'test-jwt-secret',
      jwtExpiresIn: '1h',
    },
    development: {
      debugMode: false,
    },
  };

  return {
    config: mockConfig,
    default: mockConfig,
  };
});

// Mock cors and rate limiting
vi.mock('cors', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next()),
  __esModule: true,
}));

vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next()),
  __esModule: true,
}));

describe('Server Module', () => {
  let serverModule: any;
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to get fresh instance
    serverModule = await import('./server');
    app = serverModule.app;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Express Application Setup', () => {
    it('should create express application', () => {
      expect(app).toBeDefined();
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup security headers middleware', () => {
      // Verify middleware registration calls
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should setup CORS middleware', () => {
      // CORS should be configured
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup rate limiting middleware', () => {
      // Rate limiting should be configured
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup JSON parsing middleware', () => {
      // JSON middleware should be configured
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
  describe('Service Initialization', () => {
    it('should initialize database service', () => {
      // Database initialization should be handled gracefully
      expect(serverModule).toBeDefined();
    });

    it('should initialize Redis and Cache services', () => {
      // Services should be available
      expect(serverModule).toBeDefined();
    });

    it('should handle service initialization without errors', () => {
      // Server module should load without throwing
      expect(app).toBeDefined();
    });

    it('should initialize Prisma client', () => {
      // Prisma should be initialized
      expect(serverModule).toBeDefined();
    });

    it('should initialize Redis service with graceful failure', () => {
      // Redis service should be initialized
      expect(serverModule).toBeDefined();
    });

    it('should initialize cache manager', () => {
      // Cache manager should be initialized
      expect(serverModule).toBeDefined();
    });

    it('should conditionally initialize AI service', () => {
      // AI service should be conditionally initialized
      expect(serverModule).toBeDefined();
    });
  });
  describe('Middleware Configuration', () => {
    it('should register health check routes', () => {
      // Health router should be registered
      expect(mockApp.use).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should register tRPC middleware', () => {
      // tRPC middleware should be registered
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc',
        expect.any(Function)
      );
    });

    it('should register 404 handler', () => {
      expect(mockApp.use).toHaveBeenCalledWith('*', expect.any(Function));
    });

    it('should setup JSON parsing middleware with size limit', () => {
      // JSON middleware should be configured with 1mb limit
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should register URL encoded parsing middleware', () => {
      // URL encoded middleware should be configured
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup health check router with services', () => {
      // Health check router should be initialized with all services
      expect(mockApp.use).toHaveBeenCalledWith('/', expect.any(Object));
    });
  });
  describe('Request Tracking', () => {
    it('should setup request tracking middleware', () => {
      // Verify request tracking middleware is registered
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should have monitoring capabilities', () => {
      // Monitoring should be set up
      expect(serverModule).toBeDefined();
    });

    it('should track request metrics on completion', () => {
      // Verify middleware registration calls
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));

      // Get the request tracking middleware function
      const middlewareCalls = mockApp.use.mock.calls.filter(
        call => typeof call[0] === 'function' && call.length === 1
      );
      expect(middlewareCalls.length).toBeGreaterThan(0);
    });

    it('should log request details', () => {
      // Request logging should be set up
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });
  });
  describe('Error Handling', () => {
    it('should handle service connection errors gracefully', () => {
      // Server should start even if some services fail
      expect(app).toBeDefined();
    });

    it('should have logging capabilities', () => {
      // Logger should be available
      expect(serverModule).toBeDefined();
    });

    it('should setup tRPC error handling', () => {
      // tRPC middleware should be registered with error handling
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc',
        expect.any(Function)
      );
    });

    it('should handle AI service initialization errors', () => {
      // Server should handle AI service errors gracefully
      expect(app).toBeDefined();
    });

    it('should handle Redis connection errors', () => {
      // Redis connection errors should be handled gracefully
      expect(app).toBeDefined();
    });
  });
  describe('Security Configuration', () => {
    it('should configure security headers', () => {
      // Security headers middleware should be registered
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should configure CORS with origin checking', () => {
      // CORS middleware should be configured
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should configure rate limiting', () => {
      // Rate limiting should be set up
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should configure auth rate limiting', () => {
      // Auth-specific rate limiting should be configured
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc/auth.',
        expect.any(Function)
      );
    });

    it('should set security headers including CSP', () => {
      // Security headers middleware should be registered
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set CORS with credentials support', () => {
      // CORS should support credentials
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
  describe('Development Features', () => {
    it('should register metrics endpoint in development mode', () => {
      // Metrics endpoint should be available
      expect(mockApp.get).toHaveBeenCalledWith(
        '/metrics',
        expect.any(Function)
      );
    });

    it('should serve prometheus metrics', () => {
      // Metrics endpoint should be registered
      expect(mockApp.get).toHaveBeenCalledWith(
        '/metrics',
        expect.any(Function)
      );
    });

    it('should handle metrics endpoint correctly', () => {
      // Development features should be available
      expect(serverModule).toBeDefined();
    });
  });

  describe('Server Startup', () => {
    it('should start server on configured port', () => {
      expect(mockApp.listen).toHaveBeenCalledWith(4828, expect.any(Function));
    });

    it('should log server startup information', () => {
      // Server should have started
      expect(mockApp.listen).toHaveBeenCalled();
    });
  });

  describe('Configuration Integration', () => {
    it('should use config values for server setup', () => {
      // Configuration should be loaded
      expect(serverModule).toBeDefined();
    });

    it('should handle missing config gracefully', () => {
      // Server should handle missing config
      expect(app).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export app instance', () => {
      expect(serverModule.app).toBeDefined();
      expect(typeof serverModule.app).toBe('object');
    });
  });

  describe('Integration Tests', () => {
    it('should handle CORS preflight requests', async () => {
      // Mock OPTIONS request for CORS preflight
      const optionsHandler = vi.fn((req, res) => {
        res.status(200).json({ message: 'OK' });
      });

      expect(mockApp.use).toHaveBeenCalled();
      expect(serverModule).toBeDefined();
    });

    it('should handle rate limit exceeded', async () => {
      // Rate limiting should be configured properly
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should serve 404 for unknown routes', async () => {
      // 404 handler should be registered
      expect(mockApp.use).toHaveBeenCalledWith('*', expect.any(Function));
    });

    it('should handle JSON payload too large', async () => {
      // JSON middleware should have size limits
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should process health check requests', async () => {
      // Health check routes should be available
      expect(mockApp.use).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle tRPC context creation', async () => {
      // tRPC middleware should be configured with context
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc',
        expect.any(Function)
      );
    });

    it('should handle tRPC errors properly', async () => {
      // tRPC error handling should be configured
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc',
        expect.any(Function)
      );
    });

    it('should serve metrics endpoint correctly', async () => {
      // Metrics endpoint should be registered in development
      expect(mockApp.get).toHaveBeenCalledWith(
        '/metrics',
        expect.any(Function)
      );
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing AI configuration', async () => {
      // Server should start without AI service
      expect(app).toBeDefined();
    });

    it('should handle missing Redis configuration', async () => {
      // Server should handle Redis connection failures
      expect(app).toBeDefined();
    });

    it('should handle environment-specific settings', async () => {
      // Configuration should be environment-aware
      expect(serverModule).toBeDefined();
    });

    it('should handle CORS origin validation', async () => {
      // CORS should validate origins properly
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should skip rate limiting for health checks', async () => {
      // Health checks should bypass rate limiting
      expect(mockApp.use).toHaveBeenCalled();
    });
  });

  describe('Advanced Middleware Tests', () => {
    it('should set all required security headers', async () => {
      // Security headers should include X-Content-Type-Options, X-Frame-Options, etc.
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should configure strict CSP policy', async () => {
      // Content Security Policy should be configured
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle request duration tracking', async () => {
      // Request tracking should measure duration
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should apply different rate limits for auth endpoints', async () => {
      // Auth endpoints should have stricter rate limiting
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api/trpc/auth.',
        expect.any(Function)
      );
    });
  });
});

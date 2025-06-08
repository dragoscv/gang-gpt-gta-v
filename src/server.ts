/**
 * Express server setup with tRPC integration
 * Production-ready server with security and monitoring
 */

import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './api';
import { createTRPCContext } from './api/trpc';
import config from './config';
import { logger } from './infrastructure/logging';
import {
  metricsRegistry,
  apiRequestCounter,
} from './infrastructure/monitoring';
import { createHealthCheckRouter } from './api/routes/health';
import { PrismaClient } from '@prisma/client';
import { RedisService } from './infrastructure/cache/redis.service';
import { CacheManager } from './infrastructure/cache';
import { AIService } from './modules/ai/ai.service';

const app: Express = express();

// Initialize services for health checks
const prisma = new PrismaClient();
const redisService = new RedisService();
const cacheManager = new CacheManager(redisService);

// Connect to Redis
redisService.connect().catch(error => {
  logger.warn('Redis connection failed, running in degraded mode:', error);
});

// Initialize AI service if configuration is available
let aiService: AIService | undefined;
try {
  if (config.ai.apiKey && config.ai.endpoint) {
    aiService = new AIService(
      {
        apiKey: config.ai.apiKey,
        endpoint: config.ai.endpoint,
        apiVersion: config.ai.apiVersion,
        model: config.ai.deploymentName,
        maxTokens: config.ai.maxTokens,
      },
      prisma,
      cacheManager
    );
  }
} catch (error) {
  logger.warn('AI service not available for health checks:', error);
}

// Security headers
app.use((_req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' https://api.openai.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'"
  );
  next();
});

// CORS with strict origin checking
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.server.corsOrigin.split(',');

      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  limit: config.security.rateLimitMaxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: req => {
    // Skip rate limiting for health check endpoint
    if (req.path === '/health') return true;
    return false;
  },
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
});

// Apply rate limiting to all requests
app.use(limiter);

// Auth routes get stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Apply stricter rate limiting to auth-related endpoints
app.use('/api/trpc/auth.', authLimiter);

app.use(express.json({ limit: '1mb' }));

// Request tracking middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Record request when it completes
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Record request metrics
    apiRequestCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });

    // Log request details
    logger.debug('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// Health check routes with comprehensive diagnostics
const healthRouter = createHealthCheckRouter(prisma, redisService, aiService);
app.use('/', healthRouter);

// tRPC API endpoint
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error, type, path, input }) => {
      logger.error('tRPC Error', {
        type,
        path,
        input,
        error: error.message,
        stack: error.stack,
      });
    },
  })
);

// Prometheus metrics endpoint
if (config.development.debugMode || config.app.environment !== 'production') {
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
const PORT = config.server.port || 4828;

app.listen(PORT, () => {
  logger.info(`tRPC server running on port ${PORT}`, {
    port: PORT,
    environment: config.app.environment,
    apiUrl: `http://localhost:${PORT}/api/trpc`,
  });
});

export { app };

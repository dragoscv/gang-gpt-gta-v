/**
 * Comprehensive Security Middleware
 * Advanced security layer for GangGPT application
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { InputSanitizer } from './input-sanitizer';
import { logger } from '../infrastructure/logging';
import config from '../config';

export interface SecurityOptions {
  enableRateLimit?: boolean;
  enableCompression?: boolean;
  enableCors?: boolean;
  enableHelmet?: boolean;
  customRateLimits?: Record<string, any>;
}

export class SecurityMiddleware {
  private static rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  /**
   * Initialize comprehensive security middleware stack
   */
  static initialize(options: SecurityOptions = {}): RequestHandler[] {
    const {
      enableRateLimit = true,
      enableCompression = true,
      enableCors = true,
      enableHelmet = true,
      customRateLimits = {},
    } = options;

    const middlewares = [];

    // Helmet for security headers
    if (enableHelmet) {
      middlewares.push(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
              ],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", 'wss:', 'ws:'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
        })
      );
    }

    // CORS configuration
    if (enableCors) {
      middlewares.push(
        cors({
          origin: config.server.corsOrigin,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
          exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        })
      );
    }

    // Compression middleware
    if (enableCompression) {
      middlewares.push(
        compression({
          filter: (req: any, res: any) => {
            if (req.headers['x-no-compression']) {
              return false;
            }
            return compression.filter(req, res);
          },
          level: 6,
          threshold: 1024,
        })
      );
    }

    // Rate limiting
    if (enableRateLimit) {
      const defaultRateLimit = rateLimit({
        windowMs: config.security.rateLimitWindowMs,
        max: config.security.rateLimitMaxRequests,
        message: {
          error: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
        store: {
          increment: (key: string) => {
            const now = Date.now();
            const record = this.rateLimitStore.get(key);

            if (!record || now > record.resetTime) {
              this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + config.security.rateLimitWindowMs,
              });
              return Promise.resolve({
                totalHits: 1,
                resetTime: new Date(now + config.security.rateLimitWindowMs),
              });
            }

            record.count++;
            return Promise.resolve({
              totalHits: record.count,
              resetTime: new Date(record.resetTime),
            });
          },
          decrement: (key: string) => {
            const record = this.rateLimitStore.get(key);
            if (record && record.count > 0) {
              record.count--;
            }
            return Promise.resolve();
          },
          resetKey: (key: string) => {
            this.rateLimitStore.delete(key);
            return Promise.resolve();
          },
        },
      });

      middlewares.push(defaultRateLimit);

      // Custom rate limits for specific endpoints
      Object.entries(customRateLimits).forEach(([path, limit]) => {
        middlewares.push(path, rateLimit(limit));
      });
    }

    // Input sanitization middleware
    middlewares.push(this.sanitizeInputs);

    // Security audit logging
    middlewares.push(this.auditLogger);

    return middlewares;
  }

  /**
   * Input sanitization middleware
   */
  static sanitizeInputs = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = InputSanitizer.sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        const sanitizedQuery: any = {};
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            sanitizedQuery[key] = InputSanitizer.sanitizeString(value);
          } else if (Array.isArray(value)) {
            sanitizedQuery[key] = value.map(v =>
              typeof v === 'string' ? InputSanitizer.sanitizeString(v) : v
            );
          } else {
            sanitizedQuery[key] = value;
          }
        }
        req.query = sanitizedQuery;
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        const sanitizedParams: any = {};
        for (const [key, value] of Object.entries(req.params)) {
          if (typeof value === 'string') {
            sanitizedParams[key] = InputSanitizer.sanitizeString(value);
          } else {
            sanitizedParams[key] = value;
          }
        }
        req.params = sanitizedParams;
      }

      next();
    } catch (error) {
      logger.warn('Input sanitization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      res.status(400).json({
        error: 'Invalid input detected',
        message:
          error instanceof Error ? error.message : 'Input validation failed',
      });
    }
  };

  /**
   * Security audit logging middleware
   */
  static auditLogger = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const startTime = Date.now();

    // Log suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//g, // Path traversal
      /<script/gi, // XSS attempts
      /union\s+select/gi, // SQL injection
      /exec\s*\(/gi, // Code execution
      /eval\s*\(/gi, // Code evaluation
    ];

    const requestContent = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    let isSuspicious = false;
    let suspiciousPattern = '';

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestContent)) {
        isSuspicious = true;
        suspiciousPattern = pattern.toString();
        break;
      }
    }

    if (isSuspicious) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        pattern: suspiciousPattern,
        timestamp: new Date().toISOString(),
      });
    }

    // Log all API requests in development
    if (config.development.debugMode) {
      logger.debug('API Request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    }

    // Add response time logging
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > 5000) {
        // Log slow requests (>5s)
        logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  };

  /**
   * AI-specific rate limiting for expensive operations
   */
  static aiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
      error:
        'AI request rate limit exceeded. Please wait before making more AI requests.',
    },
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return (req as any).user?.id || req.ip;
    },
  });

  /**
   * Authentication rate limiting for login attempts
   */
  static authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts. Please try again later.',
    },
  });

  /**
   * HTTPS redirect middleware (for production)
   */
  static httpsRedirect = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (
      config.server.environment === 'production' &&
      !req.secure &&
      req.get('x-forwarded-proto') !== 'https'
    ) {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
  };

  /**
   * Request size limiter
   */
  static requestSizeLimit = (maxSize: string = '10mb') => {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.get('content-length') || '0', 10);
      const maxBytes = this.parseSize(maxSize);

      if (contentLength > maxBytes) {
        res.status(413).json({
          error: 'Request too large',
          maxSize,
        });
        return;
      }

      next();
    };
  };

  /**
   * Parse size string to bytes
   */
  private static parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]!);
    const unit = match[2] || 'b';

    return Math.floor(value * (units[unit] || 1));
  }

  /**
   * IP whitelist middleware
   */
  static ipWhitelist = (allowedIPs: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!clientIP || !allowedIPs.includes(clientIP)) {
        logger.warn('Unauthorized IP access attempt', {
          ip: clientIP,
          path: req.path,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this resource.',
        });
        return;
      }

      next();
    };
  };

  /**
   * API key validation middleware
   */
  static apiKeyValidation = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const apiKey = req.get('X-API-Key');

    if (!apiKey) {
      res.status(401).json({
        error: 'Missing API key',
        message: 'X-API-Key header is required.',
      });
      return;
    }

    // Validate API key format and authenticity
    // This should be implemented based on your API key generation strategy
    if (!this.isValidApiKey(apiKey)) {
      logger.warn('Invalid API key used', {
        ip: req.ip,
        apiKey: `${apiKey.substring(0, 8)}...`,
        path: req.path,
      });

      res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid.',
      });
      return;
    }

    next();
  };

  /**
   * Validate API key format and authenticity
   */
  private static isValidApiKey(apiKey: string): boolean {
    // Implement your API key validation logic here
    // This is a basic format check
    return /^[a-zA-Z0-9]{32,}$/.test(apiKey);
  }
}

// Export rate limit configurations for specific endpoints
export const RateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many authentication attempts' },
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: { error: 'AI request rate limit exceeded' },
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: { error: 'API rate limit exceeded' },
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Upload rate limit exceeded' },
  },
};

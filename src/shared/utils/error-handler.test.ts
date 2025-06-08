import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  isOperationalError,
  createErrorHandler,
} from './error-handler';

// Mock the logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 404, false);
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
    });
  });

  describe('Specific Error Types', () => {
    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ValidationError');
    });

    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
      expect(error.isOperational).toBe(true);
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });

    it('should create AuthorizationError with 403 status', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.isOperational).toBe(true);
    });

    it('should create AuthorizationError with custom message', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.message).toBe('Access denied');
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
    });

    it('should create ConflictError with 409 status', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource conflict');
      expect(error.isOperational).toBe(true);
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Email already exists');
      expect(error.message).toBe('Email already exists');
    });

    it('should create RateLimitError with 429 status', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.isOperational).toBe(true);
    });

    it('should create RateLimitError with custom message', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.message).toBe('Too many requests');
    });

    it('should create ExternalServiceError with 503 status', () => {
      const error = new ExternalServiceError('Connection failed', 'OpenAI');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('OpenAI: Connection failed');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      const error = new AppError('Test', 400, true);
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      const error = new Error('Regular error');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-operational AppError', () => {
      const error = new AppError('Test', 500, false);
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return true for all specific error types', () => {
      expect(isOperationalError(new ValidationError('test'))).toBe(true);
      expect(isOperationalError(new AuthenticationError())).toBe(true);
      expect(isOperationalError(new AuthorizationError())).toBe(true);
      expect(isOperationalError(new NotFoundError())).toBe(true);
      expect(isOperationalError(new ConflictError())).toBe(true);
      expect(isOperationalError(new RateLimitError())).toBe(true);
      expect(
        isOperationalError(new ExternalServiceError('test', 'service'))
      ).toBe(true);
    });
  });

  describe('createErrorHandler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let statusMock: any;
    let jsonMock: any;

    beforeEach(() => {
      vi.clearAllMocks();
      statusMock = vi.fn().mockReturnThis();
      jsonMock = vi.fn();

      mockRequest = {
        url: '/test',
        method: 'GET',
      };

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };

      mockNext = vi.fn();
    });

    it('should handle operational errors correctly', () => {
      const errorHandler = createErrorHandler();
      const error = new ValidationError('Invalid input');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        timestamp: error.timestamp,
      });
    });

    it('should handle non-operational errors with 500 status', () => {
      const errorHandler = createErrorHandler();
      const error = new Error('Unknown error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle AppError with isOperational false', () => {
      const errorHandler = createErrorHandler();
      const error = new AppError('System error', 500, false);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
        })
      );
    });
    it('should log error details', async () => {
      const errorHandler = createErrorHandler();
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const { logger } = await vi.importMock<{ logger: any }>(
        '@/infrastructure/logging'
      );
      expect(logger.error).toHaveBeenCalledWith({
        error: 'Test error',
        stack: error.stack,
        url: '/test',
        method: 'GET',
        timestamp: expect.any(String),
      });
    });

    it('should handle different HTTP methods and URLs', async () => {
      const errorHandler = createErrorHandler();
      const error = new AuthenticationError();

      mockRequest.url = '/api/auth';
      mockRequest.method = 'POST';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const { logger } = await vi.importMock<{ logger: any }>(
        '@/infrastructure/logging'
      );
      expect(logger.error).toHaveBeenCalledWith({
        error: 'Authentication failed',
        stack: error.stack,
        url: '/api/auth',
        method: 'POST',
        timestamp: expect.any(String),
      });
    });
  });
});

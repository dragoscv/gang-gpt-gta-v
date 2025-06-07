import { Request, Response, NextFunction } from 'express';

/**
 * Application Error Classes for GangGPT
 * Provides structured error handling with proper status codes and categorization
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string) {
    super(`${service}: ${message}`, 503, true);
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Error handler middleware for Express
 */
export function createErrorHandler() {
  return (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    // Log error details (using structured logging in production)
    if (process.env.NODE_ENV !== 'production') {
      console.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle operational errors
    if (isOperationalError(err)) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        timestamp: err.timestamp,
      });
      return;
    }

    // Handle unknown errors
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  };
}

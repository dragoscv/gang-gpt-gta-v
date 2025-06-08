import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '@/infrastructure/logging';

/**
 * Validation middleware for request body validation using Zod schemas
 */
export const validateInput = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Request validation failed:', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation failed:', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error('Query validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

/**
 * Validation middleware for route parameters
 */
export const validateParams = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Params validation failed:', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error('Params validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  isOperationalError,
} from './error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 404, false);
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('Specific Error Types', () => {
    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
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
  });
});

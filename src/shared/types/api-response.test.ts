import { describe, it, expect } from 'vitest';
import {
  createSuccessResponse,
  createErrorResponse,
  isSuccessResponse,
  isErrorResponse,
} from './api-response';

describe('API Response Types', () => {
  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data, 'Success message');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Success message');
      expect(response.timestamp).toBeDefined();
    });

    it('should create success response without message', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const response = createErrorResponse(
        'Something went wrong',
        'VALIDATION_ERROR'
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('Type Guards', () => {
    it('should identify success response', () => {
      const response = createSuccessResponse({ test: true });
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should identify error response', () => {
      const response = createErrorResponse('Error');
      expect(isErrorResponse(response)).toBe(true);
    });
  });
});

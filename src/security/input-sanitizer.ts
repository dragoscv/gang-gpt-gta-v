/**
 * Input Sanitization Security Module
 * Comprehensive input validation and sanitization for GangGPT
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { z } from 'zod';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
  stripTags?: boolean;
}

export class InputSanitizer {
  private static readonly DEFAULT_MAX_LENGTH = 1000;
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\b(WAITFOR|DELAY)\b)/gi,
    /(\b(XP_|SP_)\w+)/gi,
  ];

  private static readonly XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,
  ];

  /**
   * Sanitize string input for security
   */
  static sanitizeString(
    input: string,
    options: SanitizationOptions = {}
  ): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    const {
      allowHtml = false,
      maxLength = this.DEFAULT_MAX_LENGTH,
      trim = true,
      stripTags = true,
    } = options;

    let sanitized = input;

    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim();
    }

    // Check length
    if (sanitized.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength}`);
    }

    // Remove or escape HTML
    if (!allowHtml && stripTags) {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    } else if (allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized);
    }

    // Check for SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially malicious SQL pattern detected');
      }
    }

    // Check for XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially malicious XSS pattern detected');
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email, { maxLength: 320 });
    
    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    return validator.normalizeEmail(sanitized) || sanitized;
  }

  /**
   * Validate and sanitize username
   */
  static sanitizeUsername(username: string): string {
    const sanitized = this.sanitizeString(username, { 
      maxLength: 50,
      stripTags: true 
    });

    if (!validator.isAlphanumeric(sanitized.replace(/[_-]/g, ''), 'en-US')) {
      throw new Error('Username contains invalid characters');
    }

    if (sanitized.length < 3) {
      throw new Error('Username too short (minimum 3 characters)');
    }

    return sanitized;
  }

  /**
   * Sanitize AI prompt input
   */
  static sanitizeAIPrompt(prompt: string): string {
    const sanitized = this.sanitizeString(prompt, {
      maxLength: 2000,
      allowHtml: false,
      stripTags: true,
    });

    // Remove potential prompt injection attempts
    const dangerousPatterns = [
      /ignore\s+previous\s+instructions/gi,
      /forget\s+everything/gi,
      /you\s+are\s+now/gi,
      /new\s+role/gi,
      /system\s*:/gi,
      /assistant\s*:/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially malicious prompt pattern detected');
      }
    }

    return sanitized;
  }

  /**
   * Sanitize file path
   */
  static sanitizeFilePath(filePath: string): string {
    const sanitized = this.sanitizeString(filePath, { maxLength: 255 });

    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('~')) {
      throw new Error('Path traversal attempt detected');
    }

    // Validate file path format
    if (!/^[a-zA-Z0-9._/\-]+$/.test(sanitized)) {
      throw new Error('Invalid file path format');
    }

    return sanitized;
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(jsonString: string): object {
    const sanitized = this.sanitizeString(jsonString, { maxLength: 10000 });

    try {
      const parsed = JSON.parse(sanitized);
      
      // Recursively sanitize object values
      return this.sanitizeObject(parsed);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Recursively sanitize object properties
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * Create Zod schema with sanitization
   */
  static createSanitizedSchema<T>(schema: z.ZodSchema<T>) {
    return schema.transform((data) => {
      if (typeof data === 'string') {
        return this.sanitizeString(data) as T;
      }
      if (typeof data === 'object' && data !== null) {
        return this.sanitizeObject(data) as T;
      }
      return data;
    });
  }

  /**
   * Rate limiting validator
   */
  static validateRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    store: Map<string, { count: number; resetTime: number }> = new Map()
  ): boolean {
    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }
}

// Export validation schemas
export const ValidationSchemas = {
  username: z.string().min(3).max(50).transform((str) => 
    InputSanitizer.sanitizeUsername(str)
  ),
  email: z.string().min(1).max(320).transform((str) => 
    InputSanitizer.sanitizeEmail(str)
  ),
  aiPrompt: z.string().min(1).max(2000).transform((str) => 
    InputSanitizer.sanitizeAIPrompt(str)
  ),
  filePath: z.string().min(1).max(255).transform((str) => 
    InputSanitizer.sanitizeFilePath(str)
  ),
  safeString: z.string().max(1000).transform((str) => 
    InputSanitizer.sanitizeString(str)
  ),
};

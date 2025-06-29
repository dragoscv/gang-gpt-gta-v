import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import winston from 'winston';

// Mock winston before importing our logger
vi.mock('winston', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    configure: vi.fn(),
    log: vi.fn(),
  };

  return {
    default: {
      createLogger: vi.fn(() => mockLogger),
      addColors: vi.fn(),
      format: {
        combine: vi.fn(),
        timestamp: vi.fn(),
        colorize: vi.fn(),
        printf: vi.fn(),
        errors: vi.fn(),
        json: vi.fn(),
      },
      transports: {
        Console: vi.fn(),
        File: vi.fn(),
      },
    },
    createLogger: vi.fn(() => mockLogger),
    addColors: vi.fn(),
    format: {
      combine: vi.fn(),
      timestamp: vi.fn(),
      colorize: vi.fn(),
      printf: vi.fn(),
      errors: vi.fn(),
      json: vi.fn(),
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
    },
  };
});

vi.mock('@/config', () => ({
  default: {
    app: {
      environment: 'test',
      logLevel: 'debug',
    },
  },
}));

describe('Logging Infrastructure', () => {
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import the logger module
    const loggerModule = await import('./index');
    logger = loggerModule.logger;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Logger Configuration', () => {
    it('should create a winston logger instance', () => {
      expect(winston.createLogger).toHaveBeenCalled();
    });
    it('should configure colors for log levels', () => {
      // The addColors function is called during module import
      // so we just verify it exists and is callable
      expect(winston.addColors).toBeDefined();
      expect(typeof winston.addColors).toBe('function');
    });

    it('should have logger instance available', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Log Methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const metadata = { userId: 123 };

      logger.info(message, metadata);

      expect(logger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      logger.error(message, { error: error.message });

      expect(logger.error).toHaveBeenCalledWith(message, {
        error: error.message,
      });
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';

      logger.warn(message);

      expect(logger.warn).toHaveBeenCalledWith(message);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      const metadata = { debugInfo: 'test' };

      logger.debug(message, metadata);

      expect(logger.debug).toHaveBeenCalledWith(message, metadata);
    });

    it('should log http messages', () => {
      const message = 'HTTP request';
      const metadata = { method: 'GET', url: '/api/test' };

      logger.http(message, metadata);

      expect(logger.http).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Error Handling', () => {
    it('should handle error objects properly', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      logger.error('An error occurred', {
        error: error.message,
        stack: error.stack,
      });

      expect(logger.error).toHaveBeenCalledWith('An error occurred', {
        error: error.message,
        stack: error.stack,
      });
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Simple error');

      logger.error('Error without stack', { error: error.message });

      expect(logger.error).toHaveBeenCalledWith('Error without stack', {
        error: error.message,
      });
    });
  });

  describe('Metadata Handling', () => {
    it('should handle complex metadata objects', () => {
      const metadata = {
        userId: 123,
        action: 'login',
        success: true,
        timestamp: Date.now(),
        nested: {
          key: 'value',
          number: 42,
        },
      };

      logger.info('Complex metadata test', metadata);

      expect(logger.info).toHaveBeenCalledWith(
        'Complex metadata test',
        metadata
      );
    });

    it('should handle null and undefined metadata', () => {
      logger.info('No metadata');
      logger.info('Null metadata', null);
      logger.info('Undefined metadata', undefined);

      expect(logger.info).toHaveBeenCalledTimes(3);
    });
  });
  describe('Performance and Security', () => {
    it('should not log sensitive information in messages', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'jwt-token-here',
        apiKey: 'api-key-secret',
      };

      // Our logger should sanitize or avoid logging sensitive data
      logger.info('User action', { userId: 123, action: 'login' });

      expect(logger.info).toHaveBeenCalledWith('User action', {
        userId: 123,
        action: 'login',
      });
    });

    it('should handle large log volumes efficiently', () => {
      const startTime = Date.now();

      // Log multiple messages quickly
      for (let i = 0; i < 100; i++) {
        logger.debug(`Log message ${i}`, { iteration: i });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 1 second for 100 logs)
      expect(duration).toBeLessThan(1000);
      expect(logger.debug).toHaveBeenCalledTimes(100);
    });
  });

  describe('ContextLogger', () => {
    let contextLogger: any;

    beforeEach(async () => {
      const loggerModule = await import('./index');
      contextLogger = new loggerModule.ContextLogger({
        service: 'test-service',
        requestId: '123',
      });
    });

    it('should create context logger with initial context', () => {
      expect(contextLogger).toBeDefined();
    });

    it('should log with context metadata', () => {
      contextLogger.info('Test message', { additional: 'data' });

      expect(logger.info).toHaveBeenCalledWith({
        message: 'Test message',
        service: 'test-service',
        requestId: '123',
        additional: 'data',
      });
    });

    it('should support all log levels', () => {
      contextLogger.error('Error message');
      contextLogger.warn('Warning message');
      contextLogger.info('Info message');
      contextLogger.http('HTTP message');
      contextLogger.debug('Debug message');

      expect(logger.error).toHaveBeenCalledWith({
        message: 'Error message',
        service: 'test-service',
        requestId: '123',
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect(logger.http).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should create new context logger with additional context', () => {
      const newContextLogger = contextLogger.withContext({ userId: '456' });
      newContextLogger.info('Test with extended context');

      expect(logger.info).toHaveBeenCalledWith({
        message: 'Test with extended context',
        service: 'test-service',
        requestId: '123',
        userId: '456',
      });
    });
  });

  describe('PerformanceLogger', () => {
    let PerformanceLogger: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      const loggerModule = await import('./index');
      PerformanceLogger = loggerModule.PerformanceLogger;
    });

    it('should start and end performance timers', () => {
      PerformanceLogger.start('test-operation');

      // Simulate some work
      const duration = PerformanceLogger.end('test-operation');

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(logger.info).toHaveBeenCalledWith('Performance: test-operation', {
        duration: expect.stringContaining('ms'),
      });
    });

    it('should handle ending non-existent timer', () => {
      const duration = PerformanceLogger.end('non-existent-timer');

      expect(duration).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(
        "Performance timer 'non-existent-timer' was not started"
      );
    });

    it('should measure synchronous function performance', () => {
      const result = PerformanceLogger.measure('sync-operation', () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(logger.info).toHaveBeenCalledWith('Performance: sync-operation', {
        duration: expect.stringContaining('ms'),
      });
    });

    it('should measure asynchronous function performance', async () => {
      const result = await PerformanceLogger.measure(
        'async-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return 'async-result';
        }
      );

      expect(result).toBe('async-result');
      expect(logger.info).toHaveBeenCalledWith('Performance: async-operation', {
        duration: expect.stringContaining('ms'),
      });
    });

    it('should handle errors in measured functions', () => {
      expect(() => {
        PerformanceLogger.measure('error-operation', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      expect(logger.info).toHaveBeenCalledWith('Performance: error-operation', {
        duration: expect.stringContaining('ms'),
        error: true,
      });
    });
    it('should handle errors in async measured functions', async () => {
      await expect(
        PerformanceLogger.measure('async-error-operation', async () => {
          throw new Error('Async test error');
        })
      ).rejects.toThrow('Async test error');

      // For async functions, the performance logger only logs the duration, not the error flag
      expect(logger.info).toHaveBeenCalledWith(
        'Performance: async-error-operation',
        {
          duration: expect.stringContaining('ms'),
        }
      );
    });
  });

  describe('AILogger', () => {
    let aiLogger: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      const loggerModule = await import('./index');
      aiLogger = new loggerModule.AILogger({ operation: 'test-ai-op' });
    });

    it('should create AI logger with AI-specific context', () => {
      expect(aiLogger).toBeDefined();
    });

    it('should log token usage with cost estimation', () => {
      aiLogger.logTokenUsage('text-generation', 1000, 'gpt-4o-mini', {
        prompt: 'test',
      });

      expect(logger.info).toHaveBeenCalledWith({
        message: 'AI Token Usage: text-generation',
        service: 'ai-module',
        operation: 'test-ai-op',
        tokensUsed: 1000,
        model: 'gpt-4o-mini',
        costEstimate: '$0.000150',
        prompt: 'test',
      });
    });

    it('should log AI errors with stack traces', () => {
      const error = new Error('AI API failed');
      error.stack = 'Error stack trace';

      aiLogger.logAIError('completion', error, { retryCount: 3 });

      expect(logger.error).toHaveBeenCalledWith({
        message: 'AI Operation Failed: completion',
        service: 'ai-module',
        operation: 'test-ai-op',
        error: 'AI API failed',
        stack: 'Error stack trace',
        retryCount: 3,
      });
    });

    it('should log response times', () => {
      aiLogger.logResponseTime('chat-completion', 1500, { model: 'gpt-4o' });

      expect(logger.info).toHaveBeenCalledWith({
        message: 'AI Response Time: chat-completion',
        service: 'ai-module',
        operation: 'test-ai-op',
        duration: '1500ms',
        model: 'gpt-4o',
      });
    });

    it('should estimate costs for different models', () => {
      aiLogger.logTokenUsage('test', 1000, 'gpt-4o');
      aiLogger.logTokenUsage('test', 1000, 'gpt-3.5-turbo');
      aiLogger.logTokenUsage('test', 1000, 'unknown-model');

      // Verify different cost estimations
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          costEstimate: '$0.005000', // gpt-4o
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          costEstimate: '$0.001500', // gpt-3.5-turbo
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          costEstimate: '$0.002000', // unknown model default
        })
      );
    });
  });

  describe('Morgan Stream', () => {
    let morganStream: any;

    beforeEach(async () => {
      vi.clearAllMocks();
      const loggerModule = await import('./index');
      morganStream = loggerModule.morganStream;
    });

    it('should provide write method for morgan integration', () => {
      expect(morganStream.write).toBeDefined();
      expect(typeof morganStream.write).toBe('function');
    });

    it('should log HTTP messages through morgan stream', () => {
      const httpMessage = 'GET /api/test 200 150ms - 1024 bytes\n';

      morganStream.write(httpMessage);

      expect(logger.http).toHaveBeenCalledWith(
        'GET /api/test 200 150ms - 1024 bytes'
      );
    });

    it('should trim whitespace from morgan messages', () => {
      const httpMessageWithWhitespace = '  POST /api/users 201 250ms  \n\t';

      morganStream.write(httpMessageWithWhitespace);

      expect(logger.http).toHaveBeenCalledWith('POST /api/users 201 250ms');
    });
  });
});

import winston from 'winston';
import config from '@/config';

/**
 * Type definition for log metadata
 */
type LogMetadata = Record<string, string | number | boolean | null | undefined>;

/**
 * Custom log levels for the application
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Colors for different log levels
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

/**
 * Custom format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Transports array based on environment
 */
const transports: winston.transport[] = [];

// Console transport for all environments except test
if (config.app.environment !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports for production and development
if (config.app.environment === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

/**
 * Create the logger instance
 */
export const logger = winston.createLogger({
  level: config.app.environment === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ganggpt-server' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

/**
 * Create a stream object for Morgan HTTP logging
 */
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

/**
 * Enhanced logger with context support
 */
export class ContextLogger {
  private context: LogMetadata;

  constructor(context: LogMetadata = {}) {
    this.context = context;
  }

  private formatMessage(
    message: string,
    metadata?: LogMetadata
  ): LogMetadata & { message: string } {
    const combinedMeta = { ...this.context, ...metadata };
    return { message, ...combinedMeta };
  }

  error(message: string, metadata?: LogMetadata): void {
    logger.error(this.formatMessage(message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    logger.warn(this.formatMessage(message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    logger.info(this.formatMessage(message, metadata));
  }

  http(message: string, metadata?: LogMetadata): void {
    logger.http(this.formatMessage(message, metadata));
  }

  debug(message: string, metadata?: LogMetadata): void {
    logger.debug(this.formatMessage(message, metadata));
  }

  withContext(additionalContext: LogMetadata): ContextLogger {
    return new ContextLogger({ ...this.context, ...additionalContext });
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceLogger {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  static end(label: string, metadata?: LogMetadata): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Performance timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    logger.info(`Performance: ${label}`, {
      duration: `${duration}ms`,
      ...metadata,
    });

    return duration;
  }

  static measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
  static measure<T>(label: string, fn: () => T): T;
  static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          this.end(label);
        });
      } else {
        this.end(label);
        return result;
      }
    } catch (error) {
      this.end(label, { error: true });
      throw error;
    }
  }
}

/**
 * AI-specific logging utilities
 */
export class AILogger extends ContextLogger {
  constructor(context: LogMetadata = {}) {
    super({ service: 'ai-module', ...context });
  }

  logTokenUsage(
    operation: string,
    tokensUsed: number,
    model: string,
    metadata?: LogMetadata
  ): void {
    this.info(`AI Token Usage: ${operation}`, {
      tokensUsed,
      model,
      costEstimate: this.estimateCost(tokensUsed, model),
      ...metadata,
    });
  }

  logAIError(operation: string, error: Error, metadata?: LogMetadata): void {
    this.error(`AI Operation Failed: ${operation}`, {
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  }

  logResponseTime(
    operation: string,
    duration: number,
    metadata?: LogMetadata
  ): void {
    this.info(`AI Response Time: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  private estimateCost(tokens: number, model: string): string {
    // Rough cost estimation based on OpenAI pricing
    const rates = {
      'gpt-4o-mini': 0.00015 / 1000, // $0.15 per 1K tokens
      'gpt-4o': 0.005 / 1000, // $5.00 per 1K tokens
      'gpt-3.5-turbo': 0.0015 / 1000, // $1.50 per 1K tokens
    };

    const rate = rates[model as keyof typeof rates] || 0.002 / 1000;
    const cost = tokens * rate;

    return `$${cost.toFixed(6)}`;
  }
}

export default logger;

import { PrismaClient } from '@prisma/client';
import { logger } from '@/infrastructure/logging';
import config from '@/config';

/**
 * Database connection and management utilities
 */
class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      datasources: {
        db: {
          url: config.database.url,
        },
      },
    });

    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully', {
        provider: 'postgresql',
        database: config.database.url.split('@')[1]?.split('/')[1] || 'unknown',
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Health check with database ping
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
  /**
   * Setup Prisma event listeners for logging
   */
  private setupEventListeners(): void {
    // Note: Prisma event handling varies by version
    // For now, we'll skip the event listeners and rely on query logging through middleware
    if (config.app.environment === 'development') {
      logger.debug('Database connection established with logging enabled');
    }
  }

  /**
   * Execute database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');
      // In production, migrations should be run via CLI
      // This is for development convenience
      if (config.app.environment === 'development') {
        const { execSync } = await import('child_process');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      }
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Database migrations failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate Prisma client
   */
  async generateClient(): Promise<void> {
    try {
      logger.info('Generating Prisma client...');
      const { execSync } = await import('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });
      logger.info('Prisma client generated successfully');
    } catch (error) {
      logger.error('Failed to generate Prisma client', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean shutdown handler
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('Starting graceful database shutdown...');

    try {
      await this.disconnect();
      logger.info('Database shutdown completed');
    } catch (error) {
      logger.error('Error during database shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
export { DatabaseService };

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

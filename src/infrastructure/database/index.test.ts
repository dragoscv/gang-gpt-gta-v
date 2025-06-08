import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService, db } from './index';

// Mock dependencies
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/config', () => ({
  default: {
    database: {
      url: 'postgresql://user:pass@localhost:4831/testdb',
    },
    app: {
      environment: 'development', // Set to development for migration tests
    },
  },
}));

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  })),
}));

// Mock child_process for migration tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    dbService = DatabaseService.getInstance();
    mockPrisma = dbService.prisma; // Get the mocked instance
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should have the exported instance available', () => {
      expect(db).toBeInstanceOf(DatabaseService);
      expect(db).toBe(DatabaseService.getInstance());
    });
  });
  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);

      await dbService.connect();

      expect(mockPrisma.$connect).toHaveBeenCalledOnce();
      expect(dbService.isHealthy()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockPrisma.$connect.mockRejectedValue(connectionError);

      await expect(dbService.connect()).rejects.toThrow('Connection failed');
      expect(dbService.isHealthy()).toBe(false);
    });
    it('should disconnect from database successfully', async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      // First connect
      mockPrisma.$connect.mockResolvedValue(undefined);
      await dbService.connect();

      // Then disconnect
      await dbService.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
      expect(dbService.isHealthy()).toBe(false);
    });

    it('should handle disconnection errors', async () => {
      const disconnectionError = new Error('Disconnection failed');
      mockPrisma.$disconnect.mockRejectedValue(disconnectionError);

      await expect(dbService.disconnect()).rejects.toThrow(
        'Disconnection failed'
      );
    });
  });

  describe('Health Checks', () => {
    it('should return health status', () => {
      expect(dbService.isHealthy()).toBe(false);
    });
    it('should perform health check successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const isHealthy = await dbService.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('should handle health check failures', async () => {
      const healthError = new Error('Health check failed');
      mockPrisma.$queryRaw.mockRejectedValue(healthError);

      const isHealthy = await dbService.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
  describe('Migration Management', () => {
    it('should run migrations in development', async () => {
      const { execSync } = await import('child_process');
      const mockExecSync = execSync as any;
      mockExecSync.mockReturnValue(undefined);

      await dbService.runMigrations();

      expect(mockExecSync).toHaveBeenCalledWith('npx prisma migrate deploy', {
        stdio: 'inherit',
      });
    });

    it('should handle migration errors', async () => {
      const { execSync } = await import('child_process');
      const mockExecSync = execSync as any;
      const migrationError = new Error('Migration failed');
      mockExecSync.mockImplementation(() => {
        throw migrationError;
      });

      await expect(dbService.runMigrations()).rejects.toThrow(
        'Migration failed'
      );
    });

    it('should generate Prisma client', async () => {
      const { execSync } = await import('child_process');
      const mockExecSync = execSync as any;
      mockExecSync.mockReturnValue(undefined);

      await dbService.generateClient();

      expect(mockExecSync).toHaveBeenCalledWith('npx prisma generate', {
        stdio: 'inherit',
      });
    });

    it('should handle client generation errors', async () => {
      const { execSync } = await import('child_process');
      const mockExecSync = execSync as any;
      const generationError = new Error('Client generation failed');
      mockExecSync.mockImplementation(() => {
        throw generationError;
      });

      await expect(dbService.generateClient()).rejects.toThrow(
        'Client generation failed'
      );
    });
  });
  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      await dbService.gracefulShutdown();

      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });

    it('should handle shutdown errors gracefully', async () => {
      const shutdownError = new Error('Shutdown failed');
      mockPrisma.$disconnect.mockRejectedValue(shutdownError);

      // Should not throw, just log error
      await expect(dbService.gracefulShutdown()).resolves.toBeUndefined();
    });
  });

  describe('Prisma Instance', () => {
    it('should have prisma instance available', () => {
      expect(dbService.prisma).toBeDefined();
      expect(dbService.prisma).toBe(mockPrisma);
    });
  });
});

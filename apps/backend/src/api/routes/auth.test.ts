import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authRouter } from './auth';

// Mock external dependencies
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockImplementation((payload: any) => {
    if (payload.type === 'refresh') {
      return 'mock-refresh-token';
    }
    return 'mock-access-token';
  }),
  verify: vi.fn().mockImplementation((token: string) => {
    if (token === 'refresh-token' || token === 'mock-refresh-token') {
      return { userId: 'user-1', type: 'refresh' };
    }
    if (token === 'invalid-token') {
      throw new Error('invalid token');
    }
    return { userId: 'user-1', type: 'access' };
  }),
}));

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn().mockImplementation((size: number) => ({
      toString: vi.fn().mockReturnValue('generated-reset-token'),
    })),
  },
  randomBytes: vi.fn().mockImplementation((size: number) => ({
    toString: vi.fn().mockReturnValue('generated-reset-token'),
  })),
}));

vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../infrastructure/email', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  },
}));

// Mock context with Prisma
const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  userSession: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockContext = {
  prisma: mockPrisma,
  user: null,
};

// Mock process.env
const originalEnv = process.env;

describe('Auth Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock implementations
    Object.values(mockPrisma).forEach(table => {
      if (typeof table === 'object') {
        Object.values(table).forEach(method => {
          if (typeof method === 'function') {
            method.mockReset();
          }
        });
      }
    });

    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Mock user creation
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'PLAYER',
        createdAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(mockUser);
      // Mock refresh token creation
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      // Mock user session creation
      mockPrisma.userSession.create.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(),
        ipAddress: null,
        userAgent: null,
      });

      const caller = authRouter.createCaller(mockContext as any);
      const result = await caller.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          role: 'PLAYER',
        },
        select: expect.any(Object),
      });
    });

    it('should throw error if user already exists', async () => {
      // Mock user exists
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        username: 'testuser',
        email: 'test@example.com',
      });

      const caller = authRouter.createCaller(mockContext as any);

      await expect(
        caller.register({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('User with this username or email already exists');
    });

    it('should validate input schema', async () => {
      const caller = authRouter.createCaller(mockContext as any);

      // Test invalid username (too short)
      await expect(
        caller.register({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();

      // Test invalid email
      await expect(
        caller.register({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow();

      // Test invalid password (too short)
      await expect(
        caller.register({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'PLAYER',
        isActive: true,
        loginAttempts: 0,
        lockedUntil: null,
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      // Mock user session creation
      mockPrisma.userSession.create.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(),
        ipAddress: null,
        userAgent: null,
      });

      const caller = authRouter.createCaller(mockContext as any);
      const result = await caller.login({
        identifier: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const caller = authRouter.createCaller(mockContext as any);

      await expect(
        caller.login({
          identifier: 'nonexistent',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const mockUserSession = {
        id: 'session-1',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000), // Valid for 24 hours
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'PLAYER',
          isActive: true,
        },
      };

      mockPrisma.userSession.findFirst.mockResolvedValue(mockUserSession);
      mockPrisma.userSession.update.mockResolvedValue({
        id: 'session-1',
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const caller = authRouter.createCaller(mockContext as any);
      const result = await caller.refresh({
        refreshToken: 'refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
    it('should throw error if refresh token is invalid', async () => {
      mockPrisma.userSession.findFirst.mockResolvedValue(null);

      const caller = authRouter.createCaller(mockContext as any);

      await expect(
        caller.refresh({
          refreshToken: 'invalid-token',
        })
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token for existing user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'reset-1',
        token: 'generated-reset-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const caller = authRouter.createCaller(mockContext as any);

      try {
        const result = await caller.forgotPassword({
          email: 'test@example.com',
        });

        expect(result).toHaveProperty(
          'message',
          'If an account with that email exists, a password reset link has been sent.'
        );
        expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    });
    it('should return success even for non-existent user (security)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const caller = authRouter.createCaller(mockContext as any);
      const result = await caller.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result).toHaveProperty(
        'message',
        'If an account with that email exists, a password reset link has been sent.'
      );
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      const mockResetToken = {
        id: 'reset-1',
        token: 'reset-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
        used: false,
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      };

      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(mockResetToken);
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'user-1', email: 'test@example.com' },
        { id: 'reset-1', used: true },
        { count: 0 },
      ]);

      const caller = authRouter.createCaller(mockContext as any);
      const result = await caller.resetPassword({
        token: 'reset-token',
        newPassword: 'newpassword123',
      });

      expect(result).toHaveProperty(
        'message',
        'Password has been reset successfully'
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if reset token is invalid', async () => {
      mockPrisma.passwordResetToken.findFirst.mockResolvedValue(null);

      const caller = authRouter.createCaller(mockContext as any);

      await expect(
        caller.resetPassword({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { createTRPCContext } from './trpc';
import { db } from '../infrastructure/database';

// Mock dependencies
vi.mock('../infrastructure/logging', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../infrastructure/database', () => ({
  db: {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      userSession: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
  verify: vi.fn(),
}));

vi.mock('../config', () => ({
  default: {
    security: {
      jwtSecret: 'test-secret',
    },
  },
}));

describe('tRPC Configuration', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      headers: {},
    };
    mockRes = {};
  });

  describe('createTRPCContext', () => {
    it('should create context without user when no authorization header', async () => {
      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        prisma: db.prisma,
      });
      expect(context.user).toBeUndefined();
    });

    it('should create context without user when authorization header is malformed', async () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      };

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toBeUndefined();
    });

    it('should create context with user when valid token is provided', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        characters: [
          {
            factionMembership: {
              factionId: 'faction-id',
            },
          },
        ],
      };
      const mockSession = {
        id: 'session-id',
        token,
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(db.prisma.userSession.findFirst).mockResolvedValue(
        mockSession as any
      );

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toEqual({
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        factionId: 'faction-id',
      });
    });

    it('should create context without user when user is inactive', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: false,
        characters: [],
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toBeUndefined();
    });

    it('should create context without user when session is expired', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        characters: [],
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(db.prisma.userSession.findFirst).mockResolvedValue(null);

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toBeUndefined();
    });

    it('should create context without user when JWT verification fails', async () => {
      const token = 'invalid-jwt-token';

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toBeUndefined();
    });

    it('should create context without factionId when user has no characters', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        characters: [],
      };
      const mockSession = {
        id: 'session-id',
        token,
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(db.prisma.userSession.findFirst).mockResolvedValue(
        mockSession as any
      );

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toEqual({
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
      expect(context.user?.factionId).toBeUndefined();
    });

    it('should create context without user when user is not found', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(null);

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toBeUndefined();
    });

    it('should handle character without faction membership', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        userId: 'user-id',
        type: 'access',
      };
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        characters: [
          {
            factionMembership: null,
          },
        ],
      };
      const mockSession = {
        id: 'session-id',
        token,
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any);
      vi.mocked(db.prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(db.prisma.userSession.findFirst).mockResolvedValue(
        mockSession as any
      );

      const context = await createTRPCContext({
        req: mockReq as Request,
        res: mockRes as Response,
      });

      expect(context.user).toEqual({
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
      expect(context.user?.factionId).toBeUndefined();
    });
  });
});

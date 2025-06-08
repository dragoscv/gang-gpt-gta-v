/**
 * tRPC configuration and context setup
 * Provides type-safe API layer for GangGPT frontend-backend communication
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { Request, Response } from 'express';
import superjson from 'superjson';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { logger } from '../infrastructure/logging';
import { PrismaClient } from '@prisma/client';
import { db } from '../infrastructure/database';
import config from '../config';

/**
 * Context type for tRPC procedures
 */
export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaClient;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    factionId?: string;
  };
}

/**
 * Create tRPC context from Express request/response
 */
export const createTRPCContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> => {
  const context: Context = {
    req,
    res,
    prisma: db.prisma,
  };
  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        config.security.jwtSecret
      ) as JwtPayload & {
        userId: string; // Changed from 'id' to 'userId' to match JWT payload
        type: string;
      };
      // Verify user still exists and is active
      const user = await db.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          characters: {
            select: {
              factionMembership: {
                select: {
                  factionId: true,
                },
              },
            },
          },
        },
      });

      // Also check if the session is still valid (not logged out)
      const activeSession = await db.prisma.userSession.findFirst({
        where: {
          token,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (user && user.isActive && activeSession) {
        const factionId = user.characters[0]?.factionMembership?.factionId;
        context.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          ...(factionId && { factionId }),
        };
      }
    } catch (error) {
      // Invalid token - context.user remains undefined
      logger.warn('Invalid JWT token:', error);
    }
  }

  return context;
};

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause ? error.cause : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Private procedure - requires authentication
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const privateProcedure = t.procedure.use(({ ctx, next }): any => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Admin procedure - requires admin role
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminProcedure = privateProcedure.use(({ ctx, next }): any => {
  if (ctx.user!.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
    });
  }

  return next({
    ctx,
  });
});

/**
 * Faction procedure - requires faction membership
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const factionProcedure = privateProcedure.use(({ ctx, next }): any => {
  if (!ctx.user!.factionId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Faction membership required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        ...ctx.user!,
        factionId: ctx.user!.factionId,
      },
    },
  });
});

export { t };

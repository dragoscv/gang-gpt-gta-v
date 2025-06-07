import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TRPCError } from '@trpc/server';
import { config } from '../../config';
import { logger } from '../../infrastructure/logging';

// ===== TYPES =====

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
  username?: string;
  role?: string;
  type: 'access' | 'refresh';
}

// ===== INPUT VALIDATION SCHEMAS =====

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ===== UTILITY FUNCTIONS =====

/**
 * Generate JWT tokens for user
 */
function generateTokens(
  userId: string,
  username: string,
  role: string
): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId, username, role, type: 'access' } as object,
    config.jwt.secret as string,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' } as object,
    config.jwt.refreshSecret as string,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Generate password reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate JWT token
 */
function validateToken(token: string, secret: string): CustomJwtPayload {
  try {
    return jwt.verify(token, secret) as CustomJwtPayload;
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
}

// ===== AUTHENTICATION ROUTER =====

export const authRouter = router({
  /**
   * Register a new user account
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if username already exists
        const existingUsername = await ctx.prisma.user.findUnique({
          where: { username: input.username },
        });

        if (existingUsername) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already exists',
          });
        }

        // Check if email already exists
        const existingEmail = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });

        if (existingEmail) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(
          input.password,
          config.security.bcryptRounds
        );

        // Create user with explicit role assignment
        const user = await ctx.prisma.user.create({
          data: {
            username: input.username,
            email: input.email,
            passwordHash,
            role: 'PLAYER', // Use string literal that matches enum
          },
        }); // Generate tokens
        const { accessToken, refreshToken } = generateTokens(
          user.id,
          user.username,
          user.role
        );

        // Create session
        const session = await ctx.prisma.userSession.create({
          data: {
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            ipAddress: ctx.req.ip || null,
            userAgent: ctx.req.headers['user-agent'] || null,
          },
        });

        return {
          message: 'Registration successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: session.expiresAt,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Registration error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed',
        });
      }
    }),

  /**
   * Login with username/email and password
   */
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    try {
      // Find user by username or email
      const user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { username: input.usernameOrEmail },
            { email: input.usernameOrEmail },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          passwordHash: true,
          role: true,
          lastLogin: true,
          isActive: true,
          isBanned: true,
          banReason: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is disabled',
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: user.banReason || 'Account is banned',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        input.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.username,
        user.role
      ); // Create session
      const session = await ctx.prisma.userSession.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          ipAddress: ctx.req.ip || null,
          userAgent: ctx.req.headers['user-agent'] || null,
        },
      });

      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      return {
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: new Date(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error('Login error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed',
      });
    }
  }),

  /**
   * Request password reset
   */
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Find user by email
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
          return {
            message:
              'If an account with that email exists, a reset link has been sent',
          };
        }

        // Generate reset token
        const resetToken = generateResetToken();
        // TODO: Use resetTokenExpiry when implementing proper reset token storage
        // const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token (you might want to create a separate table for this)
        // For now, we'll use a simple approach with the user record
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            // Note: You might want to add resetToken and resetTokenExpiry fields to the User model
            updatedAt: new Date(),
          },
        });

        // TODO: Send email with reset link
        // await emailService.sendPasswordResetEmail(user.email, resetToken);

        return {
          message:
            'If an account with that email exists, a reset link has been sent',
          // In development, return the token for testing
          ...(config.app.environment === 'development' && { resetToken }),
        };
      } catch (error) {
        logger.error('Forgot password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset request failed',
        });
      }
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input: _input }) => {
      try {
        // TODO: Validate reset token from database
        // For now, we'll implement a basic validation

        // TODO: Hash new password when implementing full reset functionality
        // const passwordHash = await bcrypt.hash(
        //   input.password,
        //   config.security.bcryptRounds
        // );

        // TODO: Find user by reset token and update password
        // This is a placeholder implementation

        return {
          message: 'Password reset successfully',
        };
      } catch (error) {
        logger.error('Reset password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset failed',
        });
      }
    }),

  /**
   * Refresh access token
   */
  refreshToken: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate refresh token
        const decoded = validateToken(
          input.refreshToken,
          config.jwt.refreshSecret
        );

        if (decoded.type !== 'refresh') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token type',
          });
        }

        // Find user and session
        const user = await ctx.prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user || !user.isActive || user.isBanned) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found or inactive',
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(
          user.id,
          user.username,
          user.role
        );

        // Update session
        await ctx.prisma.userSession.updateMany({
          where: {
            userId: user.id,
            refreshToken: input.refreshToken,
          },
          data: {
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        });

        return {
          message: 'Token refreshed successfully',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Token refresh error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token refresh failed',
        });
      }
    }),

  /**
   * Logout user
   */
  logout: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Delete session
        await ctx.prisma.userSession.deleteMany({
          where: { token: input.accessToken },
        });

        return {
          message: 'Logged out successfully',
        };
      } catch (error) {
        logger.error('Logout error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Logout failed',
        });
      }
    }),

  /**
   * Get current user profile
   */
  me: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Validate access token
        const decoded = validateToken(input.accessToken, config.jwt.secret);

        if (decoded.type !== 'access') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token type',
          });
        }

        // Find session and user
        const session = await ctx.prisma.userSession.findFirst({
          where: {
            token: input.accessToken,
            expiresAt: { gt: new Date() },
          },
          include: {
            user: {
              include: {
                characters: true,
              },
            },
          },
        });

        if (!session || !session.user.isActive || session.user.isBanned) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Session not found or user inactive',
          });
        }

        return {
          user: {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            role: session.user.role,
            lastLogin: session.user.lastLogin,
            createdAt: session.user.createdAt,
            characters: session.user.characters,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Get user profile error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to get user profile',
        });
      }
    }),
});

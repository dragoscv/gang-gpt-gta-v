import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { hash, compare } from 'bcryptjs';
import { sign, verify, SignOptions, JwtPayload } from 'jsonwebtoken';
import { router, publicProcedure, privateProcedure } from '../trpc';
import { logger } from '../../infrastructure/logging';
import { emailService } from '../../infrastructure/email';

// Custom JWT payload interface
interface CustomJwtPayload extends JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
}

// Request interface for extracting IP and user agent
interface RequestWithContext {
  ip?: string;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  headers?: { [key: string]: string | string[] | undefined };
}

// Input validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  identifier: z.string(), // username or email
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Helper function to generate JWT tokens
function generateTokens(
  userId: string,
  jwtSecret: string
): { accessToken: string; refreshToken: string } {
  const payload = { userId, type: 'access' };
  const refreshPayload = { userId, type: 'refresh' };

  const signOptions: SignOptions = {
    expiresIn: '1h',
    issuer: 'gang-gpt-server',
    audience: 'gang-gpt-client',
  };

  const refreshSignOptions: SignOptions = {
    expiresIn: '7d',
    issuer: 'gang-gpt-server',
    audience: 'gang-gpt-client',
  };

  const accessToken = sign(payload, jwtSecret, signOptions);
  const refreshToken = sign(refreshPayload, jwtSecret, refreshSignOptions);

  return { accessToken, refreshToken };
}

// Helper function to safely get IP address
function getClientIP(req: RequestWithContext): string | null {
  return (
    req?.ip ||
    req?.connection?.remoteAddress ||
    req?.socket?.remoteAddress ||
    null
  );
}

// Helper function to safely get user agent
function getUserAgent(req: RequestWithContext): string | null {
  const userAgent = req?.headers?.['user-agent'];
  if (Array.isArray(userAgent)) {
    return userAgent[0] || null;
  }
  return userAgent || null;
}

// Helper function to generate reset token
import crypto from 'crypto';

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const authRouter = router({
  // User registration
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user already exists
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [{ username: input.username }, { email: input.email }],
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this username or email already exists',
          });
        }

        // Hash password
        const hashedPassword = await hash(input.password, 12);

        // Create user using correct field names from schema
        const user = await ctx.prisma.user.create({
          data: {
            username: input.username,
            email: input.email,
            passwordHash: hashedPassword, // Use passwordHash instead of password
            role: 'PLAYER', // Default role
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        // Generate JWT tokens
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'JWT secret not configured',
          });
        }

        const { accessToken, refreshToken } = generateTokens(
          user.id,
          jwtSecret
        );

        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const ipAddress = getClientIP(ctx.req as RequestWithContext);
        const userAgent = getUserAgent(ctx.req as RequestWithContext);

        await ctx.prisma.userSession.create({
          data: {
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt,
            ipAddress,
            userAgent,
          },
        });

        // Send welcome email
        try {
          const emailSent = await emailService.sendWelcomeEmail(
            user.email,
            user.username
          );
          if (!emailSent) {
            logger.warn(`Failed to send welcome email to ${user.email}`);
          }
        } catch (emailError) {
          logger.error('Error sending welcome email:', emailError);
          // Don't fail registration if email fails
        }

        return {
          user,
          accessToken,
          refreshToken,
          message: 'User registered successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Registration error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register user',
        });
      }
    }),

  // User login
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    try {
      // Find user by username or email
      const user = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ username: input.identifier }, { email: input.identifier }],
        },
        select: {
          id: true,
          username: true,
          email: true,
          passwordHash: true, // Use passwordHash instead of password
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Account is disabled',
        });
      }

      // Verify password using passwordHash
      const isValidPassword = await compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'JWT secret not configured',
        });
      }

      const { accessToken, refreshToken } = generateTokens(user.id, jwtSecret);

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const ipAddress = getClientIP(ctx.req as RequestWithContext);
      const userAgent = getUserAgent(ctx.req as RequestWithContext);

      await ctx.prisma.userSession.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      // Update last login using correct field name
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }, // Use lastLogin instead of lastLoginAt
      });

      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        message: 'Login successful',
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

  // Refresh token
  refresh: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'JWT secret not configured',
          });
        }

        // Verify refresh token
        const decoded = verify(
          input.refreshToken,
          jwtSecret
        ) as CustomJwtPayload;

        if (decoded.type !== 'refresh') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token type',
          });
        } // Find session with user included
        const session = await ctx.prisma.userSession.findFirst({
          where: {
            refreshToken: input.refreshToken,
            userId: decoded.userId,
            expiresAt: { gt: new Date() },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        });

        if (!session || !session.user?.isActive) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired refresh token',
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(
          session.user.id,
          jwtSecret
        );

        // Update session
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        const ipAddress = getClientIP(ctx.req as RequestWithContext);
        const userAgent = getUserAgent(ctx.req as RequestWithContext);

        await ctx.prisma.userSession.update({
          where: { id: session.id },
          data: {
            token: accessToken,
            refreshToken,
            expiresAt: newExpiresAt,
            ipAddress,
            userAgent,
          },
        });

        return {
          user: session.user,
          accessToken,
          refreshToken,
          message: 'Token refreshed successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Token refresh error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to refresh token',
        });
      }
    }),

  // Get current user (protected route)
  me: privateProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          lastLogin: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        user,
        message: 'User retrieved successfully',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error('Get user error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user',
      });
    }
  }),
  // Get current user profile
  profile: privateProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          lastLogin: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        user,
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error('Profile error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve profile',
      });
    }
  }),

  // Logout (invalidate current session)
  logout: privateProcedure.mutation(async ({ ctx }) => {
    try {
      // Extract token from authorization header
      const authHeader = ctx.req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        });
      }

      const token = authHeader.substring(7);

      // Delete the session
      await ctx.prisma.userSession.deleteMany({
        where: {
          token,
          userId: ctx.user!.id,
        },
      });

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error('Logout error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Logout failed',
      });
    }
  }),

  // Logout from all devices
  logoutAll: privateProcedure.mutation(async ({ ctx }) => {
    try {
      // Delete all sessions for the user
      await ctx.prisma.userSession.deleteMany({
        where: {
          userId: ctx.user!.id,
        },
      });

      return {
        message: 'Logged out from all devices',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error('Logout all error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to logout from all devices',
      });
    }
  }),

  // Forgot password - Request password reset
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Find user by email
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });

        if (!user) {
          // Don't reveal if email exists - always return success for security
          return {
            message:
              'If an account with that email exists, a password reset link has been sent.',
          };
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Store reset token in database
        await ctx.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt,
          },
        });

        // Send password reset email
        logger.info(
          `Password reset requested for user ${user.email}. Token: ${resetToken}`
        );

        // Send email with reset link
        const emailSent = await emailService.sendPasswordResetEmail(
          user.email,
          resetToken
        );

        if (!emailSent) {
          logger.warn(`Failed to send password reset email to ${user.email}`);
        }

        return {
          message:
            'If an account with that email exists, a password reset link has been sent.',
        };
      } catch (error) {
        logger.error('Forgot password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process password reset request',
        });
      }
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Find valid reset token
        const resetToken = await ctx.prisma.passwordResetToken.findFirst({
          where: {
            token: input.token,
            expiresAt: { gt: new Date() },
            used: false,
          },
          include: { user: true },
        });

        if (!resetToken) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired reset token',
          });
        }

        // Hash new password
        const hashedPassword = await hash(input.newPassword, 12);

        // Update user password and mark token as used
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: hashedPassword },
          }),
          ctx.prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true },
          }),
          // Delete all existing sessions for security
          ctx.prisma.userSession.deleteMany({
            where: { userId: resetToken.userId },
          }),
        ]);

        logger.info(
          `Password reset successful for user ${resetToken.user.email}`
        );

        return {
          message: 'Password has been reset successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Reset password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        });
      }
    }),
});

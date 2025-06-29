/**
 * Validation schemas using Zod for GangGPT applications
 */
import { z } from 'zod';
import { GAME_CONFIG, MISSION_CONFIG } from '../constants';

// User validation schemas
export const userRegistrationSchema = z.object({
    username: z
        .string()
        .min(GAME_CONFIG.MIN_USERNAME_LENGTH, 'Username must be at least 3 characters')
        .max(GAME_CONFIG.MAX_USERNAME_LENGTH, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: z
        .string()
        .email('Invalid email format'),
    password: z
        .string()
        .min(GAME_CONFIG.MIN_PASSWORD_LENGTH, 'Password must be at least 8 characters')
        .max(GAME_CONFIG.MAX_PASSWORD_LENGTH, 'Password must be at most 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export const userLoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const passwordResetSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(GAME_CONFIG.MIN_PASSWORD_LENGTH, 'Password must be at least 8 characters')
        .max(GAME_CONFIG.MAX_PASSWORD_LENGTH, 'Password must be at most 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Character validation schemas
export const characterCreationSchema = z.object({
    name: z
        .string()
        .min(2, 'Character name must be at least 2 characters')
        .max(30, 'Character name must be at most 30 characters')
        .regex(/^[a-zA-Z\s]+$/, 'Character name can only contain letters and spaces'),
});

export const characterUpdateSchema = z.object({
    position: z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        z: z.number().finite(),
    }).optional(),
    health: z
        .number()
        .int()
        .min(0, 'Health cannot be negative')
        .max(GAME_CONFIG.MAX_HEALTH, `Health cannot exceed ${GAME_CONFIG.MAX_HEALTH}`)
        .optional(),
    armor: z
        .number()
        .int()
        .min(0, 'Armor cannot be negative')
        .max(GAME_CONFIG.MAX_ARMOR, `Armor cannot exceed ${GAME_CONFIG.MAX_ARMOR}`)
        .optional(),
    money: z
        .number()
        .int()
        .min(0, 'Money cannot be negative')
        .optional(),
    bank: z
        .number()
        .int()
        .min(0, 'Bank balance cannot be negative')
        .optional(),
});

// Mission validation schemas
export const missionGenerationSchema = z.object({
    playerId: z.string().cuid('Invalid player ID'),
    difficulty: z
        .number()
        .int()
        .min(MISSION_CONFIG.MIN_DIFFICULTY, `Difficulty must be at least ${MISSION_CONFIG.MIN_DIFFICULTY}`)
        .max(MISSION_CONFIG.MAX_DIFFICULTY, `Difficulty cannot exceed ${MISSION_CONFIG.MAX_DIFFICULTY}`)
        .optional(),
    missionType: z.enum(['DELIVERY', 'HEIST', 'ASSASSINATION', 'ESCORT', 'RECONNAISSANCE', 'CHAOS']).optional(),
    location: z.object({
        x: z.number().finite(),
        y: z.number().finite(),
        z: z.number().finite(),
    }).optional(),
});

export const missionUpdateSchema = z.object({
    status: z.enum(['AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']),
    progress: z.record(z.any()).optional(),
});

// Faction validation schemas
export const factionCreationSchema = z.object({
    name: z
        .string()
        .min(3, 'Faction name must be at least 3 characters')
        .max(50, 'Faction name must be at most 50 characters')
        .regex(/^[a-zA-Z0-9\s-_]+$/, 'Faction name can only contain letters, numbers, spaces, hyphens, and underscores'),
    description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    type: z.enum(['CRIMINAL', 'GOVERNMENT', 'BUSINESS', 'GANG', 'INDEPENDENT']),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code'),
});

export const factionUpdateSchema = z.object({
    description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code')
        .optional(),
    influence: z
        .number()
        .int()
        .min(0, 'Influence cannot be negative')
        .max(100, 'Influence cannot exceed 100')
        .optional(),
});

// AI interaction validation schemas
export const aiInteractionSchema = z.object({
    content: z
        .string()
        .min(1, 'Content cannot be empty')
        .max(1000, 'Content cannot exceed 1000 characters'),
    context: z.record(z.any()).optional(),
    maxTokens: z
        .number()
        .int()
        .min(10, 'Max tokens must be at least 10')
        .max(4000, 'Max tokens cannot exceed 4000')
        .optional(),
});

export const npcInteractionSchema = z.object({
    npcId: z.string().cuid('Invalid NPC ID'),
    playerId: z.string().cuid('Invalid player ID'),
    message: z
        .string()
        .min(1, 'Message cannot be empty')
        .max(500, 'Message cannot exceed 500 characters'),
    interactionType: z.enum(['conversation', 'trade', 'mission', 'combat']).optional(),
});

// WebSocket event validation schemas
export const socketEventSchema = z.object({
    type: z.string().min(1, 'Event type is required'),
    data: z.any(),
    timestamp: z.number().optional(),
    userId: z.string().optional(),
});

// API query validation schemas
export const paginationSchema = z.object({
    page: z
        .number()
        .int()
        .min(1, 'Page must be at least 1')
        .optional()
        .default(1),
    limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
        .default(20),
});

export const sortingSchema = z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const filterSchema = z.object({
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
});

// Configuration validation schemas
export const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1000).max(65535).default(4828),
    WEB_PORT: z.coerce.number().int().min(1000).max(65535).default(4829),

    // Database
    DATABASE_URL: z.string().url('Invalid database URL'),

    // Redis
    REDIS_HOST: z.string().min(1, 'Redis host is required'),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),

    // AI Service
    AZURE_OPENAI_ENDPOINT: z.string().url('Invalid Azure OpenAI endpoint'),
    AZURE_OPENAI_API_KEY: z.string().min(1, 'Azure OpenAI API key is required'),
    AZURE_OPENAI_DEPLOYMENT_NAME: z.string().min(1, 'Azure OpenAI deployment name is required'),
    AZURE_OPENAI_API_VERSION: z.string().default('2024-02-01'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),

    // Email (optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),
});

// Health check validation schemas
export const healthCheckSchema = z.object({
    service: z.string(),
    status: z.enum(['healthy', 'unhealthy', 'degraded']),
    lastCheck: z.date(),
    responseTime: z.number().optional(),
    details: z.record(z.any()).optional(),
});

// Export validation utility functions
export const validateEnv = (env: Record<string, unknown>) => {
    try {
        return environmentSchema.parse(env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
            throw new Error(`Missing or invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
};

export const validatePagination = (query: Record<string, unknown>) => {
    return paginationSchema.parse(query);
};

export const validateSorting = (query: Record<string, unknown>) => {
    return sortingSchema.parse(query);
};

export const validateFilter = (query: Record<string, unknown>) => {
    return filterSchema.parse(query);
};

// Type exports for TypeScript inference
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type CharacterCreation = z.infer<typeof characterCreationSchema>;
export type CharacterUpdate = z.infer<typeof characterUpdateSchema>;
export type MissionGeneration = z.infer<typeof missionGenerationSchema>;
export type MissionUpdate = z.infer<typeof missionUpdateSchema>;
export type FactionCreation = z.infer<typeof factionCreationSchema>;
export type FactionUpdate = z.infer<typeof factionUpdateSchema>;
export type AIInteraction = z.infer<typeof aiInteractionSchema>;
export type NPCInteraction = z.infer<typeof npcInteractionSchema>;
export type SocketEventValidation = z.infer<typeof socketEventSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Sorting = z.infer<typeof sortingSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type Environment = z.infer<typeof environmentSchema>;
export type HealthCheck = z.infer<typeof healthCheckSchema>;

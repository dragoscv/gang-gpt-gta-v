/**
 * Database client and utilities
 */
import { PrismaClient } from '@prisma/client';

// Create database client with enhanced configuration
export const createDatabaseClient = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'colorless',
    });
};

// Export a default instance
export const db = createDatabaseClient();

// Database connection utilities
export const connectDatabase = async (): Promise<void> => {
    try {
        await db.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await db.$disconnect();
        console.log('✅ Database disconnected successfully');
    } catch (error) {
        console.error('❌ Database disconnection failed:', error);
    }
};

// Health check utility
export const checkDatabaseHealth = async (): Promise<{ status: string; responseTime: number }> => {
    const start = Date.now();

    try {
        await db.$queryRaw`SELECT 1`;
        const responseTime = Date.now() - start;

        return {
            status: 'healthy',
            responseTime,
        };
    } catch (error) {
        const responseTime = Date.now() - start;

        return {
            status: 'unhealthy',
            responseTime,
        };
    }
};

// Transaction utility
export const withTransaction = async <T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
    return await db.$transaction(fn);
};

// Pagination utility
export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const paginate = async <T>(
    query: (skip: number, take: number) => Promise<T[]>,
    countQuery: () => Promise<number>,
    options: PaginationOptions
): Promise<PaginationResult<T>> => {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        query(skip, limit),
        countQuery(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

// Export Prisma types
export type {
    User,
    Character,
    Faction,
    Mission,
    NPC,
    Territory,
    AICompanion,
    NPCMemory,
    FactionMembership,
    PlayerAnalytics
} from '@prisma/client';

// Export Prisma client type
export type DatabaseClient = PrismaClient;

// Re-export Prisma client
export { PrismaClient } from '@prisma/client';

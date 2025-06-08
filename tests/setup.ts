/**
 * Jest test setup file
 * This file is executed before each test file
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:4831/gang_gpt_test_db';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:4832';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://test.openai.azure.com/';
process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || 'test-api-key';

// Global test timeout
jest.setTimeout(30000);

// Mock superjson for ESM compatibility
jest.mock('superjson', () => ({
    __esModule: true,
    default: {
        stringify: jest.fn((data) => JSON.stringify(data)),
        parse: jest.fn((str) => JSON.parse(str))
    },
    stringify: jest.fn((data) => JSON.stringify(data)),
    parse: jest.fn((str) => JSON.parse(str))
}));

// Mock tRPC modules for ESM compatibility
jest.mock('@trpc/server', () => ({
    __esModule: true,
    initTRPC: {
        context: jest.fn(() => ({
            create: jest.fn(() => ({
                router: jest.fn(),
                procedure: jest.fn(() => ({
                    input: jest.fn().mockReturnThis(),
                    output: jest.fn().mockReturnThis(),
                    query: jest.fn().mockReturnThis(),
                    mutation: jest.fn().mockReturnThis()
                })),
                middleware: jest.fn()
            }))
        }))
    },
    TRPCError: class TRPCError extends Error {
        constructor(opts: any) {
            super(opts.message);
            this.name = 'TRPCError';
        }
    }
}));

// Mock console methods to reduce noise in test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning') || args[0].includes('deprecated'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// Global test utilities
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidUUID(): R;
            toBeValidDate(): R;
        }
    }
}

// Custom Jest matchers
expect.extend({
    toBeValidUUID(received: any) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const pass = typeof received === 'string' && uuidRegex.test(received);

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false,
            };
        }
    },

    toBeValidDate(received: any) {
        const date = new Date(received);
        const pass = date instanceof Date && !isNaN(date.getTime());

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid date`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid date`,
                pass: false,
            };
        }
    },
});

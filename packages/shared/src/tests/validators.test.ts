/**
 * @file validators.test.ts
 * @description Tests for validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
    userRegistrationSchema,
    userLoginSchema,
    characterCreationSchema,
    missionGenerationSchema,
    factionCreationSchema,
    validateEnv
} from '../validators';

describe('Validation Schemas', () => {
    describe('userRegistrationSchema', () => {
        it('should validate valid user registration data', () => {
            const validData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'SecurePass123'
            };

            const result = userRegistrationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid username', () => {
            const invalidData = {
                username: 'ab', // too short
                email: 'test@example.com',
                password: 'SecurePass123'
            };

            const result = userRegistrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                username: 'testuser123',
                email: 'invalid-email',
                password: 'SecurePass123'
            };

            const result = userRegistrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject weak password', () => {
            const invalidData = {
                username: 'testuser123',
                email: 'test@example.com',
                password: 'weak' // too short and weak
            };

            const result = userRegistrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('userLoginSchema', () => {
        it('should validate valid login data', () => {
            const validData = {
                username: 'testuser',
                password: 'password123'
            };

            const result = userLoginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty username', () => {
            const invalidData = {
                username: '',
                password: 'password123'
            };

            const result = userLoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('characterCreationSchema', () => {
        it('should validate valid character name', () => {
            const validData = {
                name: 'John Doe'
            };

            const result = characterCreationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject name with numbers', () => {
            const invalidData = {
                name: 'John123'
            };

            const result = characterCreationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject too short name', () => {
            const invalidData = {
                name: 'A'
            };

            const result = characterCreationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('missionGenerationSchema', () => {
        it('should validate valid mission data', () => {
            const validData = {
                playerId: 'ckl2j3k4l5m6n7o8p9q0',
                difficulty: 3,
                missionType: 'DELIVERY' as const,
                location: { x: 100, y: 200, z: 50 }
            };

            const result = missionGenerationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid difficulty', () => {
            const invalidData = {
                playerId: 'ckl2j3k4l5m6n7o8p9q0',
                difficulty: 15 // too high
            };

            const result = missionGenerationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('factionCreationSchema', () => {
        it('should validate valid faction data', () => {
            const validData = {
                name: 'Test Faction',
                description: 'A test faction for testing purposes',
                type: 'GANG' as const,
                color: '#FF0000'
            };

            const result = factionCreationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid color', () => {
            const invalidData = {
                name: 'Test Faction',
                type: 'GANG' as const,
                color: 'red' // invalid hex format
            };

            const result = factionCreationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('validateEnv', () => {
        it('should validate correct environment variables', () => {
            const validEnv = {
                NODE_ENV: 'development',
                PORT: 4828,
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/ganggpt',
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com/',
                AZURE_OPENAI_API_KEY: '12345678901234567890123456789012',
                AZURE_OPENAI_DEPLOYMENT_NAME: 'gpt-4o-mini',
                JWT_SECRET: '12345678901234567890123456789012',
                JWT_REFRESH_SECRET: '12345678901234567890123456789012'
            };

            expect(() => validateEnv(validEnv)).not.toThrow();
        });

        it('should throw error for missing required variables', () => {
            const invalidEnv = {
                NODE_ENV: 'development'
                // missing required variables
            };

            expect(() => validateEnv(invalidEnv)).toThrow();
        });
    });
});

/**
 * @file constants.test.ts
 * @description Tests for application constants
 */
import { describe, it, expect } from 'vitest';
import {
    SERVER_CONFIG,
    GAME_CONFIG,
    AI_CONFIG,
    FACTION_CONFIG,
    MISSION_CONFIG,
    SECURITY_CONFIG,
    RATE_LIMIT_CONFIG,
    CACHE_CONFIG,
    DATABASE_CONFIG,
    WEBSOCKET_CONFIG,
    PERFORMANCE_TARGETS,
    ERROR_CODES,
    SUCCESS_MESSAGES,
    EVENT_TYPES,
    DEFAULT_TERRITORIES,
    ENV_KEYS
} from '../constants';

describe('Application Constants', () => {
    describe('SERVER_CONFIG', () => {
        it('should have valid server configuration values', () => {
            expect(SERVER_CONFIG.DEFAULT_PORT).toBe(4828);
            expect(SERVER_CONFIG.DEFAULT_WEB_PORT).toBe(4829);
            expect(SERVER_CONFIG.MAX_CONNECTIONS).toBe(1000);
            expect(SERVER_CONFIG.REQUEST_TIMEOUT).toBe(30000);
            expect(SERVER_CONFIG.BODY_LIMIT).toBe('10mb');
        });

        it('should have positive numeric values', () => {
            expect(SERVER_CONFIG.DEFAULT_PORT).toBeGreaterThan(0);
            expect(SERVER_CONFIG.DEFAULT_WEB_PORT).toBeGreaterThan(0);
            expect(SERVER_CONFIG.MAX_CONNECTIONS).toBeGreaterThan(0);
            expect(SERVER_CONFIG.REQUEST_TIMEOUT).toBeGreaterThan(0);
        });

        it('should be configured as constants', () => {
            expect(typeof SERVER_CONFIG).toBe('object');
            expect(SERVER_CONFIG.DEFAULT_PORT).toBe(4828);
        });
    });

    describe('GAME_CONFIG', () => {
        it('should have valid game configuration values', () => {
            expect(GAME_CONFIG.MAX_LEVEL).toBe(100);
            expect(GAME_CONFIG.STARTING_MONEY).toBe(5000);
            expect(GAME_CONFIG.STARTING_BANK).toBe(0);
            expect(GAME_CONFIG.STARTING_HEALTH).toBe(100);
            expect(GAME_CONFIG.MAX_HEALTH).toBe(100);
        });

        it('should have logical constraints', () => {
            expect(GAME_CONFIG.MIN_USERNAME_LENGTH).toBeLessThan(GAME_CONFIG.MAX_USERNAME_LENGTH);
            expect(GAME_CONFIG.MIN_PASSWORD_LENGTH).toBeLessThan(GAME_CONFIG.MAX_PASSWORD_LENGTH);
            expect(GAME_CONFIG.STARTING_HEALTH).toBeLessThanOrEqual(GAME_CONFIG.MAX_HEALTH);
            expect(GAME_CONFIG.STARTING_ARMOR).toBeLessThanOrEqual(GAME_CONFIG.MAX_ARMOR);
        });
    });

    describe('AI_CONFIG', () => {
        it('should have valid AI configuration values', () => {
            expect(AI_CONFIG.MAX_TOKENS).toBe(1000);
            expect(AI_CONFIG.DEFAULT_TEMPERATURE).toBe(0.7);
            expect(AI_CONFIG.MAX_CONTEXT_LENGTH).toBe(4000);
            expect(AI_CONFIG.MEMORY_RETENTION_HOURS).toBe(24);
        });

        it('should have valid temperature range', () => {
            expect(AI_CONFIG.DEFAULT_TEMPERATURE).toBeGreaterThan(0);
            expect(AI_CONFIG.DEFAULT_TEMPERATURE).toBeLessThanOrEqual(2);
        });

        it('should have positive timeout values', () => {
            expect(AI_CONFIG.RESPONSE_TIMEOUT).toBeGreaterThan(0);
            expect(AI_CONFIG.MEMORY_RETENTION_HOURS).toBeGreaterThan(0);
        });
    });

    describe('FACTION_CONFIG', () => {
        it('should have valid faction configuration values', () => {
            expect(FACTION_CONFIG.MIN_MEMBERS).toBe(1);
            expect(FACTION_CONFIG.MAX_MEMBERS).toBe(50);
            expect(FACTION_CONFIG.DEFAULT_INFLUENCE).toBe(10);
            expect(FACTION_CONFIG.MAX_INFLUENCE).toBe(100);
        });

        it('should have logical member constraints', () => {
            expect(FACTION_CONFIG.MIN_MEMBERS).toBeLessThan(FACTION_CONFIG.MAX_MEMBERS);
            expect(FACTION_CONFIG.MIN_MEMBERS).toBeGreaterThan(0);
        });

        it('should have valid influence range', () => {
            expect(FACTION_CONFIG.MIN_INFLUENCE).toBeLessThan(FACTION_CONFIG.MAX_INFLUENCE);
            expect(FACTION_CONFIG.DEFAULT_INFLUENCE).toBeGreaterThanOrEqual(FACTION_CONFIG.MIN_INFLUENCE);
            expect(FACTION_CONFIG.DEFAULT_INFLUENCE).toBeLessThanOrEqual(FACTION_CONFIG.MAX_INFLUENCE);
        });
    });

    describe('MISSION_CONFIG', () => {
        it('should have valid mission configuration values', () => {
            expect(MISSION_CONFIG.MIN_DIFFICULTY).toBe(1);
            expect(MISSION_CONFIG.MAX_DIFFICULTY).toBe(10);
            expect(MISSION_CONFIG.DEFAULT_DURATION).toBe(30);
            expect(MISSION_CONFIG.MIN_DURATION).toBe(5);
            expect(MISSION_CONFIG.MAX_DURATION).toBe(120);
        });

        it('should have logical duration constraints', () => {
            expect(MISSION_CONFIG.MIN_DURATION).toBeLessThan(MISSION_CONFIG.MAX_DURATION);
            expect(MISSION_CONFIG.DEFAULT_DURATION).toBeGreaterThanOrEqual(MISSION_CONFIG.MIN_DURATION);
            expect(MISSION_CONFIG.DEFAULT_DURATION).toBeLessThanOrEqual(MISSION_CONFIG.MAX_DURATION);
        });

        it('should have positive multipliers', () => {
            expect(MISSION_CONFIG.EXPERIENCE_MULTIPLIER).toBeGreaterThan(0);
            expect(MISSION_CONFIG.MONEY_MULTIPLIER).toBeGreaterThan(0);
        });
    });

    describe('SECURITY_CONFIG', () => {
        it('should have valid security configuration values', () => {
            expect(SECURITY_CONFIG.JWT_EXPIRES_IN).toBe('1h');
            expect(SECURITY_CONFIG.REFRESH_TOKEN_EXPIRES_IN).toBe('7d');
            expect(SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS).toBe(5);
            expect(SECURITY_CONFIG.SALT_ROUNDS).toBe(12);
        });

        it('should have reasonable security settings', () => {
            expect(SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS).toBeGreaterThan(0);
            expect(SECURITY_CONFIG.SALT_ROUNDS).toBeGreaterThanOrEqual(10);
            expect(SECURITY_CONFIG.LOCKOUT_DURATION).toBeGreaterThan(0);
            expect(SECURITY_CONFIG.TOKEN_LENGTH).toBeGreaterThanOrEqual(16);
        });
    });

    describe('RATE_LIMIT_CONFIG', () => {
        it('should have valid rate limiting values', () => {
            expect(RATE_LIMIT_CONFIG.WINDOW_MS).toBe(15 * 60 * 1000);
            expect(RATE_LIMIT_CONFIG.MAX_REQUESTS).toBe(100);
            expect(RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS).toBe(20);
            expect(RATE_LIMIT_CONFIG.API_MAX_REQUESTS).toBe(60);
        });

        it('should have stricter limits for auth endpoints', () => {
            expect(RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS).toBeLessThan(RATE_LIMIT_CONFIG.MAX_REQUESTS);
        });

        it('should have positive time windows', () => {
            expect(RATE_LIMIT_CONFIG.WINDOW_MS).toBeGreaterThan(0);
            expect(RATE_LIMIT_CONFIG.AUTH_WINDOW_MS).toBeGreaterThan(0);
            expect(RATE_LIMIT_CONFIG.API_WINDOW_MS).toBeGreaterThan(0);
        });
    });

    describe('CACHE_CONFIG', () => {
        it('should have valid cache TTL values', () => {
            expect(CACHE_CONFIG.DEFAULT_TTL).toBe(3600);
            expect(CACHE_CONFIG.SHORT_TTL).toBe(300);
            expect(CACHE_CONFIG.LONG_TTL).toBe(86400);
            expect(CACHE_CONFIG.MEMORY_TTL).toBe(1800);
        });

        it('should have logical TTL ordering', () => {
            expect(CACHE_CONFIG.SHORT_TTL).toBeLessThan(CACHE_CONFIG.DEFAULT_TTL);
            expect(CACHE_CONFIG.DEFAULT_TTL).toBeLessThan(CACHE_CONFIG.LONG_TTL);
        });

        it('should have positive TTL values', () => {
            Object.values(CACHE_CONFIG).forEach(ttl => {
                expect(ttl).toBeGreaterThan(0);
            });
        });
    });

    describe('DATABASE_CONFIG', () => {
        it('should have valid database configuration values', () => {
            expect(DATABASE_CONFIG.CONNECTION_TIMEOUT).toBe(10000);
            expect(DATABASE_CONFIG.IDLE_TIMEOUT).toBe(30000);
            expect(DATABASE_CONFIG.MAX_CONNECTIONS).toBe(20);
            expect(DATABASE_CONFIG.QUERY_TIMEOUT).toBe(5000);
        });

        it('should have reasonable timeout values', () => {
            expect(DATABASE_CONFIG.CONNECTION_TIMEOUT).toBeLessThan(DATABASE_CONFIG.IDLE_TIMEOUT);
            expect(DATABASE_CONFIG.QUERY_TIMEOUT).toBeLessThan(DATABASE_CONFIG.CONNECTION_TIMEOUT);
        });
    });

    describe('WEBSOCKET_CONFIG', () => {
        it('should have valid WebSocket configuration values', () => {
            expect(WEBSOCKET_CONFIG.PING_INTERVAL).toBe(25000);
            expect(WEBSOCKET_CONFIG.PING_TIMEOUT).toBe(5000);
            expect(WEBSOCKET_CONFIG.MAX_LISTENERS).toBe(100);
            expect(WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL).toBe(30000);
        });

        it('should have logical ping timing', () => {
            expect(WEBSOCKET_CONFIG.PING_TIMEOUT).toBeLessThan(WEBSOCKET_CONFIG.PING_INTERVAL);
        });
    });

    describe('PERFORMANCE_TARGETS', () => {
        it('should have valid performance target values', () => {
            expect(PERFORMANCE_TARGETS.API_RESPONSE_TIME).toBe(200);
            expect(PERFORMANCE_TARGETS.AI_RESPONSE_TIME).toBe(2000);
            expect(PERFORMANCE_TARGETS.DATABASE_QUERY_TIME).toBe(100);
            expect(PERFORMANCE_TARGETS.UPTIME_TARGET).toBe(99.99);
        });

        it('should have realistic performance targets', () => {
            expect(PERFORMANCE_TARGETS.DATABASE_QUERY_TIME).toBeLessThan(PERFORMANCE_TARGETS.API_RESPONSE_TIME);
            expect(PERFORMANCE_TARGETS.API_RESPONSE_TIME).toBeLessThan(PERFORMANCE_TARGETS.AI_RESPONSE_TIME);
            expect(PERFORMANCE_TARGETS.UPTIME_TARGET).toBeGreaterThan(99);
            expect(PERFORMANCE_TARGETS.UPTIME_TARGET).toBeLessThanOrEqual(100);
        });
    });

    describe('ERROR_CODES', () => {
        it('should have structured error codes', () => {
            expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_001');
            expect(ERROR_CODES.VALIDATION_INVALID_INPUT).toBe('VAL_001');
            expect(ERROR_CODES.DATABASE_CONNECTION_ERROR).toBe('DB_001');
            expect(ERROR_CODES.AI_SERVICE_UNAVAILABLE).toBe('AI_001');
        });

        it('should have unique error codes', () => {
            const codes = Object.values(ERROR_CODES);
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(codes.length);
        });

        it('should follow naming pattern', () => {
            Object.values(ERROR_CODES).forEach(code => {
                expect(code).toMatch(/^[A-Z_]+_\d{3}$/);
            });
        });

        it('should categorize errors properly', () => {
            const authCodes = Object.keys(ERROR_CODES).filter(key => key.startsWith('AUTH_'));
            const validationCodes = Object.keys(ERROR_CODES).filter(key => key.startsWith('VALIDATION_'));
            const dbCodes = Object.keys(ERROR_CODES).filter(key => key.startsWith('DATABASE_'));

            expect(authCodes.length).toBeGreaterThan(0);
            expect(validationCodes.length).toBeGreaterThan(0);
            expect(dbCodes.length).toBeGreaterThan(0);
        });
    });

    describe('SUCCESS_MESSAGES', () => {
        it('should have meaningful success messages', () => {
            expect(SUCCESS_MESSAGES.USER_CREATED).toBe('User account created successfully');
            expect(SUCCESS_MESSAGES.MISSION_COMPLETED).toBe('Mission completed successfully');
            expect(SUCCESS_MESSAGES.FACTION_JOINED).toBe('Successfully joined faction');
        });

        it('should have non-empty messages', () => {
            Object.values(SUCCESS_MESSAGES).forEach(message => {
                expect(message.length).toBeGreaterThan(0);
                expect(typeof message).toBe('string');
            });
        });
    });

    describe('EVENT_TYPES', () => {
        it('should have structured event type names', () => {
            expect(EVENT_TYPES.PLAYER_CONNECTED).toBe('player:connected');
            expect(EVENT_TYPES.MISSION_STARTED).toBe('mission:started');
            expect(EVENT_TYPES.FACTION_CREATED).toBe('faction:created');
            expect(EVENT_TYPES.WORLD_EVENT_STARTED).toBe('world:eventStarted');
        });

        it('should follow namespace:action pattern', () => {
            Object.values(EVENT_TYPES).forEach(eventType => {
                expect(eventType).toMatch(/^[a-z]+:[a-zA-Z]+$/);
            });
        });

        it('should categorize events properly', () => {
            const playerEvents = Object.values(EVENT_TYPES).filter(event => event.startsWith('player:'));
            const missionEvents = Object.values(EVENT_TYPES).filter(event => event.startsWith('mission:'));
            const factionEvents = Object.values(EVENT_TYPES).filter(event => event.startsWith('faction:'));

            expect(playerEvents.length).toBeGreaterThan(0);
            expect(missionEvents.length).toBeGreaterThan(0);
            expect(factionEvents.length).toBeGreaterThan(0);
        });
    });

    describe('DEFAULT_TERRITORIES', () => {
        it('should have valid territory data', () => {
            expect(DEFAULT_TERRITORIES).toHaveLength(5);

            DEFAULT_TERRITORIES.forEach(territory => {
                expect(territory.id).toBeDefined();
                expect(territory.name).toBeDefined();
                expect(territory.boundaries).toBeDefined();
                expect(territory.value).toBeGreaterThan(0);
                expect(typeof territory.strategic).toBe('boolean');
            });
        });

        it('should have unique territory IDs', () => {
            const ids = DEFAULT_TERRITORIES.map(t => t.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have valid boundary coordinates', () => {
            DEFAULT_TERRITORIES.forEach(territory => {
                const { x1, y1, x2, y2 } = territory.boundaries;
                expect(typeof x1).toBe('number');
                expect(typeof y1).toBe('number');
                expect(typeof x2).toBe('number');
                expect(typeof y2).toBe('number');
            });
        });

        it('should have strategic territories with higher values', () => {
            const strategicTerritories = DEFAULT_TERRITORIES.filter(t => t.strategic);
            const nonStrategicTerritories = DEFAULT_TERRITORIES.filter(t => !t.strategic);

            if (strategicTerritories.length > 0 && nonStrategicTerritories.length > 0) {
                const avgStrategicValue = strategicTerritories.reduce((sum, t) => sum + t.value, 0) / strategicTerritories.length;
                const avgNonStrategicValue = nonStrategicTerritories.reduce((sum, t) => sum + t.value, 0) / nonStrategicTerritories.length;

                expect(avgStrategicValue).toBeGreaterThanOrEqual(avgNonStrategicValue);
            }
        });
    });

    describe('ENV_KEYS', () => {
        it('should have valid environment variable keys', () => {
            expect(ENV_KEYS.DATABASE_URL).toBe('DATABASE_URL');
            expect(ENV_KEYS.REDIS_HOST).toBe('REDIS_HOST');
            expect(ENV_KEYS.JWT_SECRET).toBe('JWT_SECRET');
            expect(ENV_KEYS.NODE_ENV).toBe('NODE_ENV');
        });

        it('should have uppercase environment variable names', () => {
            Object.values(ENV_KEYS).forEach(key => {
                expect(key).toMatch(/^[A-Z_]+$/);
            });
        });

        it('should categorize environment variables properly', () => {
            const databaseKeys = Object.keys(ENV_KEYS).filter(key => key.includes('DATABASE'));
            const redisKeys = Object.keys(ENV_KEYS).filter(key => key.includes('REDIS'));
            const aiKeys = Object.keys(ENV_KEYS).filter(key => key.includes('AZURE_OPENAI'));

            expect(databaseKeys.length).toBeGreaterThan(0);
            expect(redisKeys.length).toBeGreaterThan(0);
            expect(aiKeys.length).toBeGreaterThan(0);
        });

        it('should have unique environment variable values', () => {
            const values = Object.values(ENV_KEYS);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('Constant Structure', () => {
        it('should have well-defined constant objects', () => {
            expect(typeof SERVER_CONFIG).toBe('object');
            expect(typeof GAME_CONFIG).toBe('object');
            expect(typeof ERROR_CODES).toBe('object');

            // Verify constants have expected properties
            expect(SERVER_CONFIG.DEFAULT_PORT).toBeDefined();
            expect(GAME_CONFIG.MAX_LEVEL).toBeDefined();
            expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBeDefined();
        });
    });

    describe('Cross-Reference Validation', () => {
        it('should have reasonable timeout relationships', () => {
            // WebSocket ping timeout should be less than ping interval
            expect(WEBSOCKET_CONFIG.PING_TIMEOUT).toBeLessThan(WEBSOCKET_CONFIG.PING_INTERVAL);

            // Database query timeout is reasonable for database operations
            expect(DATABASE_CONFIG.QUERY_TIMEOUT).toBeGreaterThan(1000); // At least 1 second
            expect(DATABASE_CONFIG.QUERY_TIMEOUT).toBeLessThan(DATABASE_CONFIG.CONNECTION_TIMEOUT);
        });

        it('should have consistent limits across rate limiting', () => {
            // Auth endpoints should have stricter limits
            expect(RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS).toBeLessThan(RATE_LIMIT_CONFIG.MAX_REQUESTS);
        });
    });
});

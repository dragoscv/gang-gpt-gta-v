/**
 * Application constants for GangGPT
 */

// Server Configuration
export const SERVER_CONFIG = {
    DEFAULT_PORT: 4828,
    DEFAULT_WEB_PORT: 4829,
    MAX_CONNECTIONS: 1000,
    REQUEST_TIMEOUT: 30000, // 30 seconds
    BODY_LIMIT: '10mb',
} as const;

// Game Configuration
export const GAME_CONFIG = {
    MAX_LEVEL: 100,
    STARTING_MONEY: 5000,
    STARTING_BANK: 0,
    STARTING_HEALTH: 100,
    STARTING_ARMOR: 0,
    MAX_HEALTH: 100,
    MAX_ARMOR: 100,
    EXPERIENCE_PER_LEVEL: 1000,
    MAX_USERNAME_LENGTH: 20,
    MIN_USERNAME_LENGTH: 3,
    MAX_PASSWORD_LENGTH: 128,
    MIN_PASSWORD_LENGTH: 8,
} as const;

// AI Configuration
export const AI_CONFIG = {
    MAX_TOKENS: 1000,
    DEFAULT_TEMPERATURE: 0.7,
    MAX_CONTEXT_LENGTH: 4000,
    MEMORY_RETENTION_HOURS: 24,
    MAX_MEMORIES_PER_NPC: 100,
    RESPONSE_TIMEOUT: 30000, // 30 seconds
} as const;

// Faction Configuration
export const FACTION_CONFIG = {
    MIN_MEMBERS: 1,
    MAX_MEMBERS: 50,
    DEFAULT_INFLUENCE: 10,
    MAX_INFLUENCE: 100,
    MIN_INFLUENCE: 0,
    TERRITORY_COUNT: 5,
} as const;

// Mission Configuration
export const MISSION_CONFIG = {
    MIN_DIFFICULTY: 1,
    MAX_DIFFICULTY: 10,
    DEFAULT_DURATION: 30, // minutes
    MAX_DURATION: 120, // minutes
    MIN_DURATION: 5, // minutes
    EXPERIENCE_MULTIPLIER: 100,
    MONEY_MULTIPLIER: 1000,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
    JWT_EXPIRES_IN: '1h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    PASSWORD_RESET_EXPIRES_IN: '15m',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000, // 15 minutes
    SALT_ROUNDS: 12,
    TOKEN_LENGTH: 32,
} as const;

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    AUTH_MAX_REQUESTS: 20,
    API_WINDOW_MS: 1 * 60 * 1000, // 1 minute
    API_MAX_REQUESTS: 60,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
    DEFAULT_TTL: 3600, // 1 hour
    SHORT_TTL: 300, // 5 minutes
    LONG_TTL: 86400, // 24 hours
    MEMORY_TTL: 1800, // 30 minutes
    SESSION_TTL: 3600, // 1 hour
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
    CONNECTION_TIMEOUT: 10000, // 10 seconds
    IDLE_TIMEOUT: 30000, // 30 seconds
    MAX_CONNECTIONS: 20,
    QUERY_TIMEOUT: 5000, // 5 seconds
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
    PING_INTERVAL: 25000, // 25 seconds
    PING_TIMEOUT: 5000, // 5 seconds
    MAX_LISTENERS: 100,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
} as const;

// Performance Targets
export const PERFORMANCE_TARGETS = {
    API_RESPONSE_TIME: 200, // milliseconds
    AI_RESPONSE_TIME: 2000, // milliseconds
    DATABASE_QUERY_TIME: 100, // milliseconds
    WEBSOCKET_LATENCY: 50, // milliseconds
    UPTIME_TARGET: 99.99, // percentage
} as const;

// Error Codes
export const ERROR_CODES = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_TOKEN_INVALID: 'AUTH_003',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_004',
    AUTH_ACCOUNT_LOCKED: 'AUTH_005',

    // Validation errors
    VALIDATION_INVALID_INPUT: 'VAL_001',
    VALIDATION_REQUIRED_FIELD: 'VAL_002',
    VALIDATION_INVALID_FORMAT: 'VAL_003',
    VALIDATION_VALUE_TOO_LONG: 'VAL_004',
    VALIDATION_VALUE_TOO_SHORT: 'VAL_005',

    // Database errors
    DATABASE_CONNECTION_ERROR: 'DB_001',
    DATABASE_QUERY_ERROR: 'DB_002',
    DATABASE_CONSTRAINT_ERROR: 'DB_003',
    DATABASE_NOT_FOUND: 'DB_004',
    DATABASE_DUPLICATE_ENTRY: 'DB_005',

    // AI Service errors
    AI_SERVICE_UNAVAILABLE: 'AI_001',
    AI_QUOTA_EXCEEDED: 'AI_002',
    AI_INVALID_RESPONSE: 'AI_003',
    AI_TIMEOUT: 'AI_004',
    AI_CONTENT_FILTERED: 'AI_005',

    // Game errors
    GAME_PLAYER_NOT_FOUND: 'GAME_001',
    GAME_FACTION_NOT_FOUND: 'GAME_002',
    GAME_MISSION_NOT_AVAILABLE: 'GAME_003',
    GAME_INSUFFICIENT_FUNDS: 'GAME_004',
    GAME_INVALID_ACTION: 'GAME_005',

    // Server errors
    SERVER_INTERNAL_ERROR: 'SRV_001',
    SERVER_SERVICE_UNAVAILABLE: 'SRV_002',
    SERVER_TIMEOUT: 'SRV_003',
    SERVER_OVERLOADED: 'SRV_004',
    SERVER_MAINTENANCE: 'SRV_005',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    USER_CREATED: 'User account created successfully',
    USER_AUTHENTICATED: 'User authenticated successfully',
    PASSWORD_RESET: 'Password reset email sent',
    PASSWORD_UPDATED: 'Password updated successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    MISSION_COMPLETED: 'Mission completed successfully',
    FACTION_JOINED: 'Successfully joined faction',
    FACTION_LEFT: 'Successfully left faction',
} as const;

// Event Types
export const EVENT_TYPES = {
    // Player events
    PLAYER_CONNECTED: 'player:connected',
    PLAYER_DISCONNECTED: 'player:disconnected',
    PLAYER_LEVEL_UP: 'player:levelUp',
    PLAYER_DEATH: 'player:death',
    PLAYER_RESPAWN: 'player:respawn',

    // Mission events
    MISSION_STARTED: 'mission:started',
    MISSION_COMPLETED: 'mission:completed',
    MISSION_FAILED: 'mission:failed',
    MISSION_CANCELLED: 'mission:cancelled',

    // Faction events
    FACTION_CREATED: 'faction:created',
    FACTION_MEMBER_JOINED: 'faction:memberJoined',
    FACTION_MEMBER_LEFT: 'faction:memberLeft',
    FACTION_WAR_STARTED: 'faction:warStarted',
    FACTION_WAR_ENDED: 'faction:warEnded',

    // World events
    WORLD_EVENT_STARTED: 'world:eventStarted',
    WORLD_EVENT_ENDED: 'world:eventEnded',
    TERRITORY_CAPTURED: 'world:territoryCaptured',
    ECONOMY_CHANGED: 'world:economyChanged',

    // AI events
    AI_COMPANION_RESPONSE: 'ai:companionResponse',
    AI_MISSION_GENERATED: 'ai:missionGenerated',
    AI_NPC_INTERACTION: 'ai:npcInteraction',
} as const;

// Default Territories
export const DEFAULT_TERRITORIES = [
    {
        id: 'downtown',
        name: 'Downtown Los Santos',
        boundaries: { x1: -800, y1: -800, x2: 800, y2: 800 },
        value: 100,
        strategic: true,
    },
    {
        id: 'grove_street',
        name: 'Grove Street',
        boundaries: { x1: 2400, y1: -1700, x2: 2700, y2: -1400 },
        value: 75,
        strategic: false,
    },
    {
        id: 'vinewood',
        name: 'Vinewood',
        boundaries: { x1: 300, y1: 1100, x2: 900, y2: 1500 },
        value: 90,
        strategic: true,
    },
    {
        id: 'los_santos_airport',
        name: 'Los Santos Airport',
        boundaries: { x1: -2500, y1: -2700, x2: -1500, y2: -2200 },
        value: 85,
        strategic: true,
    },
    {
        id: 'paleto_bay',
        name: 'Paleto Bay',
        boundaries: { x1: -700, y1: 6200, x2: 700, y2: 6700 },
        value: 60,
        strategic: false,
    },
] as const;

// Environment Variables Keys
export const ENV_KEYS = {
    // Database
    DATABASE_URL: 'DATABASE_URL',

    // Redis
    REDIS_HOST: 'REDIS_HOST',
    REDIS_PORT: 'REDIS_PORT',
    REDIS_PASSWORD: 'REDIS_PASSWORD',

    // AI Service
    AZURE_OPENAI_ENDPOINT: 'AZURE_OPENAI_ENDPOINT',
    AZURE_OPENAI_API_KEY: 'AZURE_OPENAI_API_KEY',
    AZURE_OPENAI_DEPLOYMENT_NAME: 'AZURE_OPENAI_DEPLOYMENT_NAME',

    // JWT
    JWT_SECRET: 'JWT_SECRET',
    JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',

    // Server
    NODE_ENV: 'NODE_ENV',
    PORT: 'PORT',
    WEB_PORT: 'WEB_PORT',

    // Email
    SMTP_HOST: 'SMTP_HOST',
    SMTP_PORT: 'SMTP_PORT',
    SMTP_USER: 'SMTP_USER',
    SMTP_PASS: 'SMTP_PASS',
} as const;

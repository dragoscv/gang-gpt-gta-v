import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  // Application Configuration
  app: {
    environment: string;
  };

  // Server Configuration
  server: {
    port: number;
    environment: string;
    corsOrigin: string;
  };

  // Database Configuration
  database: {
    url: string;
    ssl: boolean;
  };

  // Redis Configuration
  redis: {
    url: string;
    password?: string;
  };

  // Azure OpenAI Configuration
  ai: {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    deploymentName: string;
    maxTokens: number;
    temperature: number;
    memoryRetentionDays: number;
    maxConcurrentRequests: number;
  };
  // JWT Configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  // RAGE:MP Configuration
  ragemp: {
    name: string;
    gamemode: string;
    map: string;
    password?: string;
    maxPlayers: number;
    announce: boolean;
    syncRate: number;
  };

  // Security Configuration
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    jwtSecret: string;
  };

  // Logging Configuration
  logging: {
    level: string;
    fileEnabled: boolean;
    filePath: string;
  };

  // Feature Flags
  features: {
    aiCompanions: boolean;
    dynamicMissions: boolean;
    factionWars: boolean;
    playerAnalytics: boolean;
    voiceChatAI: boolean;
  };

  // Game Configuration
  game: {
    maxFactions: number;
    defaultFactionInfluence: number;
    factionUpdateInterval: number;
    missionGenerationCooldown: number;
    maxActiveMissionsPerPlayer: number;
    missionDifficultyScaling: boolean;
  };

  // Development Configuration
  development: {
    debugMode: boolean;
    mockAIResponses: boolean;
    enableDevCommands: boolean;
  };
}

const config: Config = {
  app: {
    environment: process.env.NODE_ENV || 'development',
  },

  server: {
    port: parseInt(process.env.PORT || '22005', 10),
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/gang_gpt_db',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  },

  ai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '150', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    memoryRetentionDays: parseInt(
      process.env.AI_MEMORY_RETENTION_DAYS || '30',
      10
    ),
    maxConcurrentRequests: parseInt(
      process.env.AI_MAX_CONCURRENT_REQUESTS || '10',
      10
    ),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  ragemp: {
    name: process.env.RAGEMP_NAME || 'GangGPT Server',
    gamemode: process.env.RAGEMP_GAMEMODE || 'freeroam',
    map: process.env.RAGEMP_MAP || 'GangGPT',
    ...(process.env.RAGEMP_PASSWORD && {
      password: process.env.RAGEMP_PASSWORD,
    }),
    maxPlayers: parseInt(process.env.RAGEMP_MAX_PLAYERS || '1000', 10),
    announce: process.env.RAGEMP_ANNOUNCE === 'true',
    syncRate: parseInt(process.env.RAGEMP_SYNC_RATE || '40', 10),
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10
    ),
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    ),
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/gang-gpt.log',
  },

  features: {
    aiCompanions: process.env.ENABLE_AI_COMPANIONS === 'true',
    dynamicMissions: process.env.ENABLE_DYNAMIC_MISSIONS === 'true',
    factionWars: process.env.ENABLE_FACTION_WARS === 'true',
    playerAnalytics: process.env.ENABLE_PLAYER_ANALYTICS === 'true',
    voiceChatAI: process.env.ENABLE_VOICE_CHAT_AI === 'true',
  },

  game: {
    maxFactions: parseInt(process.env.MAX_FACTIONS || '20', 10),
    defaultFactionInfluence: parseInt(
      process.env.DEFAULT_FACTION_INFLUENCE || '10',
      10
    ),
    factionUpdateInterval: parseInt(
      process.env.FACTION_UPDATE_INTERVAL_MS || '300000',
      10
    ),
    missionGenerationCooldown: parseInt(
      process.env.MISSION_GENERATION_COOLDOWN_MS || '60000',
      10
    ),
    maxActiveMissionsPerPlayer: parseInt(
      process.env.MAX_ACTIVE_MISSIONS_PER_PLAYER || '3',
      10
    ),
    missionDifficultyScaling: process.env.MISSION_DIFFICULTY_SCALING === 'true',
  },

  development: {
    debugMode: process.env.DEBUG_MODE === 'true',
    mockAIResponses: process.env.MOCK_AI_RESPONSES === 'true',
    enableDevCommands: process.env.ENABLE_DEV_COMMANDS === 'true',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export default config;
export { config };

/**
 * GangGPT Server - Main entry point
 * This demonstrates the AI-powered RAGE:MP server setup
 */

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import config from '@/config';
import { logger } from '@/infrastructure/logging';
import { db } from '@/infrastructure/database';
import { cache } from '@/infrastructure/cache';
import { aiService } from '@/modules/ai';
import { PlayerService } from '@/modules/players/player.service';
import { FactionService } from '@/modules/factions/faction.service';
import { WorldService } from '@/modules/world/world.service';
import { EconomyService } from '@/modules/economy/economy.service';
import { rageMPManager } from '@/infrastructure/ragemp/ragemp.manager';
import { WebSocketManager } from '@/infrastructure/websocket/websocket.manager';
import { appRouter } from './api';
import { createTRPCContext } from './api/trpc';

const app: Express = express();
const server = http.createServer(app);

// Export app for testing
export { app };

// Initialize services
const playerService = new PlayerService(db.prisma);
const factionService = new FactionService(db.prisma);
const worldService = new WorldService(db.prisma);
const economyService = new EconomyService(db.prisma);
const ragempManager = rageMPManager;
const webSocketManager = new WebSocketManager();
const dbManager = db; // Use the database service instance

// Middleware
app.use(helmet());
app.use(cors({ origin: config.server.corsOrigin }));
app.use(express.json());

// tRPC API endpoint
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error, type, path, input }) => {
      logger.error('tRPC Error', {
        type,
        path,
        input,
        error: error.message,
        stack: error.stack,
      });
    },
  })
);

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const cacheHealth = await cache.healthCheck();

    res.json({
      status: 'ok',
      environment: config.app.environment,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        ai: 'ready',
        redis: cacheHealth.redis.connected ? 'connected' : 'disconnected',
        cache: cacheHealth.overall ? 'operational' : 'degraded',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      services: {
        database: 'unknown',
        ai: 'unknown',
        redis: 'unknown',
        cache: 'unknown',
      },
    });
  }
});

// API endpoints
app.get('/api/stats', async (_req, res) => {
  try {
    const stats = {
      players: {
        total: await playerService.getTotalPlayers(),
        online: ragempManager.getOnlinePlayers().length,
      },
      factions: {
        total: await factionService.getTotalFactions(),
        activeEvents: 0,
      },
      world: {
        territories: worldService.getAllTerritories().length,
        activeEvents: worldService.getActiveEvents().length,
        stats: worldService.getWorldStats(),
      },
      economy: {
        marketItems: economyService.getAllMarketItems().length,
        indicators: economyService.getEconomicIndicators(),
        stats: economyService.getEconomyStats(),
      },
      server: await ragempManager.getServerStats(),
      ai: {
        model: config.ai.deploymentName,
        status: 'operational',
      },
      cache: await cache.getStats(),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch stats', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Demo AI endpoint
app.post('/api/ai/demo', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.generateCompanionResponse(
      'DEMO_NPC',
      `Respond to this player message in character as a street-smart NPC in Los Santos: "${message}"`,
      {
        characterName: 'Demo NPC',
        location: 'Downtown Los Santos',
      }
    );
    return res.json({
      npc: 'Demo NPC',
      response: response.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('AI demo failed', error);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Cache demo endpoints
app.post('/api/cache/demo', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Store in cache
    await cache.manager.setTemporary(key, value, ttl);

    return res.json({
      message: 'Value cached successfully',
      key,
      ttl: ttl || 60,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache demo failed', error);
    return res.status(500).json({ error: 'Cache operation failed' });
  }
});

app.get('/api/cache/demo/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const value = await cache.manager.getTemporary(key);

    if (value === null) {
      return res.status(404).json({ error: 'Key not found or expired' });
    }

    return res.json({
      key,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache retrieval failed', error);
    return res.status(500).json({ error: 'Cache operation failed' });
  }
});

// World state endpoints
app.get('/api/world/territories', async (_req, res) => {
  try {
    const territories = await worldService.getAllTerritories();
    res.json(territories);
  } catch (error) {
    logger.error('Failed to fetch territories', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/world/events', async (_req, res) => {
  try {
    const events = await worldService.getActiveEvents();
    res.json(events);
  } catch (error) {
    logger.error('Failed to fetch world events', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Economy endpoints
app.get('/api/economy/market', async (_req, res) => {
  try {
    const market = await economyService.getAllMarketItems();
    res.json(market);
  } catch (error) {
    logger.error('Failed to fetch market data', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/economy/indicators', async (_req, res) => {
  try {
    const indicators = await economyService.getEconomicIndicators();
    res.json(indicators);
  } catch (error) {
    logger.error('Failed to fetch economic indicators', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RAGE:MP server info endpoint
app.get('/api/server/info', async (_req, res) => {
  try {
    const serverInfo = await ragempManager.getServerStats();
    res.json(serverInfo);
  } catch (error) {
    logger.error('Failed to fetch server info', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Player management endpoints
app.post('/api/players/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    const result = await playerService.registerPlayer({
      username,
      email,
      password,
    });

    logger.info('Player registered successfully', { username, email });

    return res.status(201).json({
      message: 'Player registered successfully',
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        createdAt: result.registeredAt,
      },
    });
  } catch (error) {
    logger.error('Player registration failed', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Player management endpoints
app.post('/api/players/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    const result = await playerService.registerPlayer({
      username,
      email,
      password,
    });

    logger.info('Player registered successfully', { username, email });

    return res.status(201).json({
      message: 'Player registered successfully',
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        createdAt: result.registeredAt,
      },
    });
  } catch (error) {
    logger.error('Player registration failed', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/players/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const result = await playerService.authenticatePlayer(username, password);

    logger.info('Player logged in successfully', { username });

    return res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
      },
      token: result.token,
    });
  } catch (error) {
    logger.error('Player login failed', error);

    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/players/characters', async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({
        error: 'Character name and user ID are required',
      });
    }

    const character = await playerService.createCharacter({
      name,
      userId,
    });

    logger.info('Character created successfully', { name, userId });

    return res.status(201).json({
      message: 'Character created successfully',
      character: {
        id: character.id,
        name: character.name,
        level: character.level,
        money: character.money,
        health: character.health,
        createdAt: character.createdAt,
      },
    });
  } catch (error) {
    logger.error('Character creation failed', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Character creation failed' });
  }
});

app.get('/api/players/:userId/characters', async (req, res) => {
  try {
    const { userId } = req.params;

    const characters = await playerService.getPlayerCharacters(userId);

    return res.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characters: characters.map((char: any) => ({
        id: char.id,
        name: char.name,
        level: char.level,
        money: char.money,
        health: char.health,
        armor: char.armor,
        position: {
          x: char.positionX,
          y: char.positionY,
          z: char.positionZ,
        },
        lastPlayed: char.lastSeen,
        createdAt: char.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch player characters', error);
    return res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

app.put('/api/players/characters/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const updateData = req.body;

    const character = await playerService.updateCharacter(
      characterId,
      updateData
    );

    return res.json({
      message: 'Character updated successfully',
      character: {
        id: character.id,
        name: character.name,
        level: character.level,
        money: character.money,
        health: character.health,
        armor: character.armor,
        updatedAt: character.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Character update failed', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Character update failed' });
  }
});

// Faction management endpoints
app.post('/api/factions', async (req, res) => {
  try {
    const { name, description, type, color, leaderId, territory } = req.body;

    if (!name || !type || !color || !leaderId) {
      return res.status(400).json({
        error: 'Name, type, color, and leader ID are required',
      });
    }

    const faction = await factionService.createFaction({
      name,
      description,
      type,
      color,
      leaderId,
      territory,
    });

    logger.info('Faction created successfully', { name, type, leaderId });

    return res.status(201).json({
      message: 'Faction created successfully',
      faction: {
        id: faction.id,
        name: faction.name,
        description: faction.description,
        type: faction.type,
        color: faction.color,
        memberCount: 1,
        createdAt: faction.createdAt,
      },
    });
  } catch (error) {
    logger.error('Faction creation failed', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Faction creation failed' });
  }
});

app.get('/api/factions', async (_req, res) => {
  try {
    const factions = await factionService.getAllFactions();

    return res.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      factions: factions.map((faction: any) => ({
        id: faction.id,
        name: faction.name,
        description: faction.description,
        type: faction.type,
        color: faction.color,
        memberCount: faction.members?.length || 0,
        influence: faction.influence,
        createdAt: faction.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch factions', error);
    return res.status(500).json({ error: 'Failed to fetch factions' });
  }
});

app.get('/api/factions/:factionId', async (req, res) => {
  try {
    const { factionId } = req.params;

    const faction = await factionService.getFactionById(factionId);

    if (!faction) {
      return res.status(404).json({ error: 'Faction not found' });
    }

    return res.json({
      faction: {
        id: faction.id,
        name: faction.name,
        description: faction.description,
        type: faction.type,
        color: faction.color,
        influence: faction.influence,
        territory: faction.territory,
        aiPersonality: faction.aiPersonality,
        members:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          faction.members?.map((member: any) => ({
            id: member.id,
            characterName: member.character.name,
            rank: member.rank,
            joinedAt: member.joinedAt,
          })) || [],
        createdAt: faction.createdAt,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch faction details', error);
    return res.status(500).json({ error: 'Failed to fetch faction details' });
  }
});

app.post('/api/factions/:factionId/join', async (req, res) => {
  try {
    const { factionId } = req.params;
    const { characterId, rank = 'MEMBER' } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    const result = await factionService.addMemberToFaction(
      factionId,
      characterId,
      rank
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      message: 'Character joined faction successfully',
      membership: result.membership,
    });
  } catch (error) {
    logger.error('Failed to join faction', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to join faction' });
  }
});

// Enhanced AI NPC interaction endpoint
app.post('/api/ai/npc/interact', async (req, res) => {
  try {
    const { npcId, characterId, message, context } = req.body;

    if (!npcId || !characterId || !message) {
      return res.status(400).json({
        error: 'NPC ID, character ID, and message are required',
      });
    } // Generate contextual NPC response
    const response = await aiService.generateNPCDialogue(
      npcId,
      `${context?.characterName || 'Player'} says: "${message}". Respond as ${npcId} in the context of ${context?.location || 'Los Santos'}.`,
      {
        characterName: context?.characterName || 'Player',
        location: context?.location || 'Los Santos',
      }
    );

    return res.json({
      npcId,
      characterId,
      response: {
        content: response.content,
        timestamp: response.timestamp,
      },
    });
  } catch (error) {
    logger.error('NPC interaction failed', error);
    return res.status(500).json({ error: 'NPC interaction failed' });
  }
});

/**
 * Set up event listeners between services for cross-service communication
 */
function setupServiceEventListeners(): void {
  // World service events
  worldService.on('territoryChanged', data => {
    webSocketManager.broadcastLiveEvent({
      type: 'world_event',
      data: { type: 'territory_changed', ...data },
      timestamp: new Date(),
    });
  });

  worldService.on('worldEvent', event => {
    webSocketManager.broadcastLiveEvent({
      type: 'world_event',
      data: event,
      timestamp: new Date(),
    });
  });

  // Economy service events
  economyService.on('priceUpdate', data => {
    webSocketManager.broadcastLiveEvent({
      type: 'economy_update',
      data: { type: 'price_update', ...data },
      timestamp: new Date(),
    });
  });

  economyService.on('transactionCompleted', transaction => {
    webSocketManager.broadcastLiveEvent({
      type: 'economy_update',
      data: { type: 'transaction', transaction },
      timestamp: new Date(),
    });
  });

  // RAGE:MP events
  ragempManager.on('playerConnected', player => {
    webSocketManager.broadcastLiveEvent({
      type: 'player_move',
      data: { type: 'player_connected', player },
      timestamp: new Date(),
    });
  });

  ragempManager.on('playerDisconnected', playerId => {
    webSocketManager.broadcastLiveEvent({
      type: 'player_move',
      data: { type: 'player_disconnected', playerId },
      timestamp: new Date(),
    });
  });

  ragempManager.on('playerMoved', data => {
    webSocketManager.broadcastLiveEvent({
      type: 'player_move',
      data: { type: 'player_position', ...data },
      timestamp: new Date(),
      playerId: data.playerId,
      location: data.position,
    });
  });

  logger.info('✅ Service event listeners configured');
}

/**
 * Main entry point for the GangGPT server
 * Initializes RAGE:MP server with AI-powered features
 */
async function main(): Promise<void> {
  try {
    logger.info('🎮 Starting GangGPT Server...');
    logger.info(`📋 Environment: ${config.app.environment}`);
    logger.info(`🚀 Port: ${config.server.port}`);

    // Initialize database connection
    await dbManager.connect();
    logger.info('✅ Database connected successfully');

    // Initialize cache services (if not already connected)
    try {
      await cache.initialize();
      logger.info('✅ Cache services initialized successfully');
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err.message.includes('already connecting') ||
        err.message.includes('already connected')
      ) {
        logger.info('✅ Cache services already initialized');
      } else {
        throw error;
      }
    }

    // Initialize WebSocket manager
    webSocketManager.initialize(server);
    logger.info('✅ WebSocket manager initialized successfully');

    // Initialize RAGE:MP manager
    ragempManager.initialize();
    logger.info('✅ RAGE:MP manager initialized successfully');

    // Services are initialized in their constructors
    logger.info('✅ World service ready');
    logger.info('✅ Economy service ready');
    // Set up service event listeners
    setupServiceEventListeners();

    // Start Express server
    logger.info('🔄 Starting HTTP server...');
    server.listen(config.server.port, () => {
      logger.info(`🚀 GangGPT Server running on port ${config.server.port}`);
      logger.info(
        `📊 Health check: http://localhost:${config.server.port}/health`
      );
      logger.info(
        `🤖 AI Demo: POST http://localhost:${config.server.port}/api/ai/demo`
      );
      logger.info(`📈 Stats: http://localhost:${config.server.port}/api/stats`);
      logger.info(
        `🌍 World API: http://localhost:${config.server.port}/api/world/territories`
      );
      logger.info(
        `💰 Economy API: http://localhost:${config.server.port}/api/economy/market`
      );
      logger.info(
        `🎮 Server Info: http://localhost:${config.server.port}/api/server/info`
      );
      logger.info('🌍 Welcome to the AI-powered streets of Los Santos...');
    });

    // Add error handler for server
    server.on('error', (error: Error) => {
      logger.error('❌ Server error:', error);
    });
  } catch (error) {
    logger.error('❌ Failed to start GangGPT Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  await cache.disconnect();
  await dbManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  await cache.disconnect();
  await dbManager.disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process for Redis connection errors in development
  if (
    config.app.environment === 'development' &&
    reason &&
    typeof reason === 'object' &&
    'message' in reason &&
    (reason.message as string).includes('maxRetriesPerRequest')
  ) {
    logger.warn('Ignoring Redis connection error in development mode');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  if (config.app.environment === 'production') {
    process.exit(1);
  }
});

// Start the server
main().catch(error => {
  logger.error('💥 Unhandled error:', error);
  process.exit(1);
});

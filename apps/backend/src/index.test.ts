import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

// Mock all dependencies before importing the module
vi.mock('./config', () => ({
  default: {
    server: {
      port: 4830,
      host: 'localhost',
      corsOrigin: ['http://localhost:4830'],
    },
    app: {
      environment: 'test',
      name: 'gang-gpt-test',
      version: '0.1.0',
    },
    ragemp: {
      enabled: false,
      maxPlayers: 100,
    },
    ai: {
      apiKey: 'test-key',
      endpoint: 'https://test.openai.azure.com',
      maxTokens: 1000,
    },
    database: {
      url: 'test://localhost:4831/test',
    },
    redis: {
      host: 'localhost',
      port: 4832,
    },
  },
}));

vi.mock('./infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('./infrastructure/database', () => ({
  db: {
    prisma: {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      player: {
        count: vi.fn().mockResolvedValue(50),
      },
      faction: {
        count: vi.fn().mockResolvedValue(10),
      },
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('./infrastructure/cache', () => ({
  cache: {
    healthCheck: vi.fn().mockResolvedValue({
      redis: { connected: true },
      overall: true,
    }),
    getStats: vi.fn().mockResolvedValue({
      connections: 5,
      memory: '10MB',
    }),
    initialize: vi.fn(),
    disconnect: vi.fn(),
    manager: {
      setTemporary: vi.fn().mockResolvedValue(true),
      getTemporary: vi.fn().mockResolvedValue('cached-value'),
    },
  },
}));

vi.mock('./modules/ai', () => ({
  aiService: {
    generateResponse: vi.fn(),
    generateCompanionResponse: vi.fn().mockResolvedValue({
      content: 'Test AI response',
      usage: { tokens: 100 },
    }),
    generateNPCDialogue: vi.fn().mockResolvedValue({
      content: 'NPC response',
      timestamp: new Date().toISOString(),
    }),
  },
}));

vi.mock('./modules/players/player.service', () => ({
  PlayerService: vi.fn().mockImplementation(() => ({
    getTotalPlayers: vi.fn().mockResolvedValue(50),
    getPlayer: vi.fn(),
    createPlayer: vi.fn(),
    registerPlayer: vi.fn().mockResolvedValue({
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      registeredAt: new Date(),
    }),
    authenticatePlayer: vi.fn().mockResolvedValue({
      user: {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      },
      token: 'test-jwt-token',
    }),
    createCharacter: vi.fn().mockResolvedValue({
      id: 'char-123',
      name: 'TestCharacter',
      level: 1,
      money: 1000,
      health: 100,
      createdAt: new Date(),
    }),
    getPlayerCharacters: vi.fn().mockResolvedValue([
      {
        id: 'char-123',
        name: 'TestCharacter',
        level: 1,
        money: 1000,
        health: 100,
        armor: 0,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        lastSeen: new Date(),
        createdAt: new Date(),
      },
    ]),
    updateCharacter: vi.fn().mockResolvedValue({
      id: 'char-123',
      name: 'UpdatedCharacter',
      level: 2,
      money: 1500,
      health: 100,
      armor: 50,
      updatedAt: new Date(),
    }),
  })),
}));

vi.mock('./modules/factions/faction.service', () => ({
  FactionService: vi.fn().mockImplementation(() => ({
    getTotalFactions: vi.fn().mockResolvedValue(10),
    getFaction: vi.fn(),
    createFaction: vi.fn().mockResolvedValue({
      id: 'faction-123',
      name: 'Test Faction',
      description: 'A test faction',
      type: 'GANG',
      color: '#FF0000',
      createdAt: new Date(),
    }),
    getAllFactions: vi.fn().mockResolvedValue([
      {
        id: 'faction-123',
        name: 'Test Faction',
        description: 'A test faction',
        type: 'GANG',
        color: '#FF0000',
        members: [{ id: 'member-1' }, { id: 'member-2' }],
        influence: 75,
        createdAt: new Date(),
      },
    ]),
    getFactionById: vi.fn().mockResolvedValue({
      id: 'faction-123',
      name: 'Test Faction',
      description: 'A test faction',
      type: 'GANG',
      color: '#FF0000',
      influence: 75,
      territory: 'Downtown',
      aiPersonality: 'Aggressive',
      members: [
        {
          id: 'member-1',
          character: { name: 'TestChar1' },
          rank: 'LEADER',
          joinedAt: new Date(),
        },
      ],
      createdAt: new Date(),
    }),
    addMemberToFaction: vi.fn().mockResolvedValue({
      success: true,
      membership: {
        id: 'membership-123',
        factionId: 'faction-123',
        characterId: 'char-123',
        rank: 'MEMBER',
      },
    }),
  })),
}));

vi.mock('./modules/world/world.service', () => ({
  WorldService: vi.fn().mockImplementation(() => ({
    getWorldState: vi.fn(),
    updateWorldState: vi.fn(),
    getAllTerritories: vi.fn().mockReturnValue([
      { id: '1', name: 'Downtown', control: 'Faction A' },
      { id: '2', name: 'Grove Street', control: 'Faction B' },
    ]),
    getActiveEvents: vi
      .fn()
      .mockReturnValue([{ id: '1', type: 'gang_war', status: 'active' }]),
    getWorldStats: vi.fn().mockReturnValue({ players: 50, events: 1 }),
    on: vi.fn(),
  })),
}));

vi.mock('./modules/economy/economy.service', () => ({
  EconomyService: vi.fn().mockImplementation(() => ({
    getAllMarketItems: vi.fn().mockReturnValue([
      { id: '1', name: 'Weapon', price: 500 },
      { id: '2', name: 'Vehicle', price: 10000 },
    ]),
    getEconomicIndicators: vi.fn().mockReturnValue({
      inflation: 2.5,
      unemployment: 5.2,
      marketCap: 1000000,
    }),
    getEconomyStats: vi.fn().mockReturnValue({
      totalValue: 100000,
      transactions: 50,
      avgPrice: 2000,
    }),
    on: vi.fn(),
  })),
}));

vi.mock('./infrastructure/ragemp/ragemp.manager', () => ({
  rageMPManager: {
    getOnlinePlayers: vi.fn().mockReturnValue([
      { id: '1', name: 'Player1' },
      { id: '2', name: 'Player2' },
    ]),
    getServerStats: vi.fn().mockResolvedValue({
      onlinePlayers: 2,
      maxPlayers: 100,
      uptime: 3600,
      gamemode: 'roleplay',
      version: '1.0.0',
    }),
    initialize: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('./infrastructure/websocket/websocket.manager', () => ({
  WebSocketManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    broadcast: vi.fn(),
    broadcastLiveEvent: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./api', () => ({
  appRouter: {
    createCaller: vi.fn(),
  },
}));

vi.mock('./api/trpc', () => ({
  createTRPCContext: vi.fn(),
}));

vi.mock('@trpc/server/adapters/express', () => ({
  createExpressMiddleware: vi
    .fn()
    .mockReturnValue((req: any, res: any, next: any) => next()),
}));

describe('Application Entry Point', () => {
  let app: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import the app after mocks are set up
    const module = await import('./index');
    app = module.app;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load configuration successfully', async () => {
      const config = await import('./config');

      expect(config.default).toBeDefined();
      expect(config.default.server).toBeDefined();
      expect(config.default.server.port).toBe(4830);
      expect(config.default.app.environment).toBe('test');
    });
  });

  describe('Module Imports', () => {
    it('should import infrastructure modules successfully', async () => {
      const database = await import('./infrastructure/database');
      const cache = await import('./infrastructure/cache');
      const logging = await import('./infrastructure/logging');

      expect(database.db).toBeDefined();
      expect(cache.cache).toBeDefined();
      expect(logging.logger).toBeDefined();
    });

    it('should import service modules successfully', async () => {
      const playerService = await import('./modules/players/player.service');
      const factionService = await import('./modules/factions/faction.service');
      const worldService = await import('./modules/world/world.service');
      const economyService = await import('./modules/economy/economy.service');

      expect(playerService.PlayerService).toBeDefined();
      expect(factionService.FactionService).toBeDefined();
      expect(worldService.WorldService).toBeDefined();
      expect(economyService.EconomyService).toBeDefined();
    });

    it('should import API modules successfully', async () => {
      const api = await import('./api');
      const trpc = await import('./api/trpc');

      expect(api.appRouter).toBeDefined();
      expect(trpc.createTRPCContext).toBeDefined();
    });
  });

  describe('Express Application Setup', () => {
    it('should create express application without errors', async () => {
      const express = await import('express');

      expect(express.default).toBeDefined();
      expect(typeof express.default).toBe('function');
    });

    it('should respond to health check endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        environment: 'test',
        services: {
          database: 'connected',
          ai: 'ready',
          redis: 'connected',
          cache: 'operational',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should respond to stats endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body).toMatchObject({
        players: {
          total: 50,
          online: 2,
        },
        factions: {
          total: 10,
          activeEvents: 0,
        },
      });
    });

    it('should handle health check errors gracefully', async () => {
      // Mock cache to throw an error
      const { cache } = await import('./infrastructure/cache');
      vi.mocked(cache.healthCheck).mockRejectedValueOnce(
        new Error('Cache error')
      );

      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/health').expect(500);

      expect(response.body).toMatchObject({
        status: 'error',
        services: {
          database: 'unknown',
          ai: 'unknown',
          redis: 'unknown',
          cache: 'unknown',
        },
      });
    });
    it('should handle AI demo endpoint validation', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/demo')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Message is required',
      });
    });
  });

  describe('Middleware Setup', () => {
    it('should have CORS middleware configured', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      // Test preflight CORS request
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:4830')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBeLessThan(500);
    });

    it('should parse JSON requests', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json'); // Should not fail due to JSON parsing
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('AI Endpoints', () => {
    it('should handle AI demo endpoint successfully', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/demo')
        .send({ message: 'Hello there!' })
        .expect(200);

      expect(response.body).toMatchObject({
        npc: 'Demo NPC',
        response: 'Test AI response',
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle AI demo endpoint validation', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/demo')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Message is required',
      });
    });

    it('should handle AI NPC interaction endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/npc/interact')
        .send({
          npcId: 'npc-001',
          characterId: 'char-123',
          message: 'Hello NPC',
          context: {
            characterName: 'TestPlayer',
            location: 'Downtown',
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        npcId: 'npc-001',
        characterId: 'char-123',
        response: {
          content: 'NPC response',
        },
      });
    });

    it('should validate NPC interaction input', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/npc/interact')
        .send({ npcId: 'npc-001' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'NPC ID, character ID, and message are required',
      });
    });
  });

  describe('Cache Endpoints', () => {
    it('should handle cache demo set endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/cache/demo')
        .send({
          key: 'test-key',
          value: 'test-value',
          ttl: 120,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Value cached successfully',
        key: 'test-key',
        ttl: 120,
      });
    });

    it('should handle cache demo get endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/cache/demo/test-key')
        .expect(200);

      expect(response.body).toMatchObject({
        key: 'test-key',
        value: 'cached-value',
      });
    });

    it('should handle cache demo validation', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/cache/demo')
        .send({ key: 'test-key' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Key and value are required',
      });
    });

    it('should handle cache key not found', async () => {
      const { cache } = await import('./infrastructure/cache');
      vi.mocked(cache.manager.getTemporary).mockResolvedValueOnce(null);

      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/cache/demo/nonexistent-key')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Key not found or expired',
      });
    });
  });

  describe('World Endpoints', () => {
    it('should handle territories endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/world/territories')
        .expect(200);

      expect(response.body).toEqual([
        { id: '1', name: 'Downtown', control: 'Faction A' },
        { id: '2', name: 'Grove Street', control: 'Faction B' },
      ]);
    });

    it('should handle world events endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/api/world/events').expect(200);

      expect(response.body).toEqual([
        { id: '1', type: 'gang_war', status: 'active' },
      ]);
    });
  });

  describe('Economy Endpoints', () => {
    it('should handle market endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/economy/market')
        .expect(200);

      expect(response.body).toEqual([
        { id: '1', name: 'Weapon', price: 500 },
        { id: '2', name: 'Vehicle', price: 10000 },
      ]);
    });

    it('should handle economic indicators endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/economy/indicators')
        .expect(200);

      expect(response.body).toMatchObject({
        inflation: 2.5,
        unemployment: 5.2,
        marketCap: 1000000,
      });
    });
  });

  describe('Server Info Endpoints', () => {
    it('should handle server info endpoint', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/api/server/info').expect(200);

      expect(response.body).toMatchObject({
        onlinePlayers: 2,
        maxPlayers: 100,
        uptime: 3600,
        gamemode: 'roleplay',
        version: '1.0.0',
      });
    });
  });

  describe('Player Management Endpoints', () => {
    it('should handle player registration', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/players/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Player registered successfully',
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should validate player registration input', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/players/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Password must be at least 6 characters long',
      });
    });

    it('should handle player login', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/players/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'test-jwt-token',
      });
    });

    it('should validate login input', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/players/login')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Username and password are required',
      });
    });

    it('should handle character creation', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/players/characters')
        .send({
          name: 'TestCharacter',
          userId: 'user-123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Character created successfully',
        character: {
          id: 'char-123',
          name: 'TestCharacter',
          level: 1,
          money: 1000,
          health: 100,
        },
      });
    });

    it('should get player characters', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/players/user-123/characters')
        .expect(200);

      expect(response.body.characters).toHaveLength(1);
      expect(response.body.characters[0]).toMatchObject({
        id: 'char-123',
        name: 'TestCharacter',
        level: 1,
        money: 1000,
        health: 100,
      });
    });

    it('should update character', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .put('/api/players/characters/char-123')
        .send({ name: 'UpdatedCharacter', level: 2 })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Character updated successfully',
        character: {
          id: 'char-123',
          name: 'UpdatedCharacter',
          level: 2,
        },
      });
    });
  });

  describe('Faction Management Endpoints', () => {
    it('should create faction', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/factions')
        .send({
          name: 'Test Faction',
          description: 'A test faction',
          type: 'GANG',
          color: '#FF0000',
          leaderId: 'char-123',
          territory: 'Downtown',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Faction created successfully',
        faction: {
          id: 'faction-123',
          name: 'Test Faction',
          type: 'GANG',
          color: '#FF0000',
          memberCount: 1,
        },
      });
    });

    it('should get all factions', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app).get('/api/factions').expect(200);

      expect(response.body.factions).toHaveLength(1);
      expect(response.body.factions[0]).toMatchObject({
        id: 'faction-123',
        name: 'Test Faction',
        type: 'GANG',
        memberCount: 2,
        influence: 75,
      });
    });

    it('should get faction by ID', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .get('/api/factions/faction-123')
        .expect(200);

      expect(response.body.faction).toMatchObject({
        id: 'faction-123',
        name: 'Test Faction',
        type: 'GANG',
        influence: 75,
        territory: 'Downtown',
        aiPersonality: 'Aggressive',
      });
      expect(response.body.faction.members).toHaveLength(1);
    });

    it('should handle faction join', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/factions/faction-123/join')
        .send({
          characterId: 'char-123',
          rank: 'MEMBER',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Character joined faction successfully',
        membership: {
          id: 'membership-123',
          factionId: 'faction-123',
          characterId: 'char-123',
          rank: 'MEMBER',
        },
      });
    });

    it('should validate faction creation input', async () => {
      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/factions')
        .send({
          name: 'Test Faction',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Name, type, color, and leader ID are required',
      });
    });
  });
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { logger } = await import('./infrastructure/logging');
      const loggerSpy = vi.spyOn(logger, 'error');

      if (!app) {
        const module = await import('./index');
        app = module.app;
      } // Test error by sending invalid JSON
      const response = await request(app)
        .post('/api/ai/demo')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Express returns 400 for malformed JSON, but error handler might convert to 500
      expect([400, 500]).toContain(response.status);
    });

    it('should handle AI service errors gracefully', async () => {
      const { aiService } = await import('./modules/ai');
      vi.mocked(aiService.generateCompanionResponse).mockRejectedValueOnce(
        new Error('AI service error')
      );

      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/ai/demo')
        .send({ message: 'Hello' })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'AI service unavailable',
      });
    });

    it('should handle cache errors gracefully', async () => {
      const { cache } = await import('./infrastructure/cache');
      vi.mocked(cache.manager.setTemporary).mockRejectedValueOnce(
        new Error('Cache error')
      );

      if (!app) {
        const module = await import('./index');
        app = module.app;
      }

      const response = await request(app)
        .post('/api/cache/demo')
        .send({ key: 'test', value: 'test' })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Cache operation failed',
      });
    });
  });
});

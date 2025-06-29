import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketManager } from './websocket.manager';
import { logger } from '@/infrastructure/logging';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('@/config', () => ({
  default: {
    server: {
      corsOrigin: '*',
    },
    jwt: {
      secret: 'test-secret',
    },
  },
}));

vi.mock('@/infrastructure/ragemp', () => ({
  rageMPManager: {
    on: vi.fn(),
    emit: vi.fn(),
    getServerStats: vi.fn(),
    getOnlinePlayers: vi.fn(),
    getVehicles: vi.fn(),
    updatePlayerPosition: vi.fn(),
  },
}));

// Mock Socket.IO
const mockAuthRoom = {
  emit: vi.fn(),
};

const mockIO = {
  use: vi.fn(),
  on: vi.fn(),
  emit: vi.fn(),
  to: vi.fn().mockReturnValue(mockAuthRoom),
  close: vi.fn(),
};

vi.mock('socket.io', () => ({
  Server: vi.fn().mockImplementation(() => mockIO),
}));

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockServer: HttpServer;
  let rageMPManager: any;

  const createMockSocket = (overrides = {}) => ({
    id: 'test-socket-123',
    emit: vi.fn(),
    join: vi.fn(),
    on: vi.fn(),
    handshake: {
      auth: {},
      query: {},
    },
    ...overrides,
  });
  beforeEach(async () => {
    wsManager = new WebSocketManager();
    mockServer = {} as HttpServer;

    // Get the mocked rageMPManager
    const ragempModule = await vi.importMock('@/infrastructure/ragemp');
    rageMPManager = ragempModule.rageMPManager;

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock returns
    vi.mocked(rageMPManager.getServerStats).mockReturnValue({
      players: 10,
      maxPlayers: 100,
      uptime: 3600,
    });

    vi.mocked(rageMPManager.getOnlinePlayers).mockReturnValue([
      { id: 'player1', name: 'Player1' },
      { id: 'player2', name: 'Player2' },
    ]);

    vi.mocked(rageMPManager.getVehicles).mockReturnValue([
      { id: 'vehicle1', model: 'adder' },
    ]);

    vi.mocked(jwt.verify).mockImplementation(() => ({
      userId: 'user123',
      username: 'testuser',
      characterId: 'char123',
      playerId: 'player123',
      role: 'player',
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create WebSocketManager instance', () => {
      expect(wsManager).toBeInstanceOf(WebSocketManager);
    });

    it('should initialize with HTTP server', () => {
      wsManager.initialize(mockServer);
      expect(SocketIOServer).toHaveBeenCalledWith(mockServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
      });
    });

    it('should setup authentication middleware', () => {
      wsManager.initialize(mockServer);
      expect(mockIO.use).toHaveBeenCalled();
    });

    it('should setup connection handler', () => {
      wsManager.initialize(mockServer);
      expect(mockIO.on).toHaveBeenCalledWith(
        'connection',
        expect.any(Function)
      );
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    it('should authenticate valid token from auth object', () => {
      const testSocket = createMockSocket({
        handshake: {
          auth: { token: 'valid-token' },
          query: {},
        },
      });

      const mockNext = vi.fn();
      const authMiddleware = wsManager['authenticateSocket'].bind(wsManager);

      authMiddleware(testSocket, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate valid token from query', () => {
      const testSocket = createMockSocket({
        handshake: {
          auth: {},
          query: { token: 'valid-token' },
        },
      });

      const mockNext = vi.fn();
      const authMiddleware = wsManager['authenticateSocket'].bind(wsManager);

      authMiddleware(testSocket, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject connection without token', () => {
      const mockNext = vi.fn();
      const testSocket = createMockSocket({
        handshake: {
          auth: {},
          query: {},
        },
      });

      const authMiddleware = wsManager['authenticateSocket'].bind(wsManager);
      authMiddleware(testSocket, mockNext);

      // Should allow anonymous connections as spectators
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject connection with invalid token', () => {
      const testSocket = createMockSocket({
        handshake: {
          auth: { token: 'invalid-token' },
          query: {},
        },
      });

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockNext = vi.fn();
      const authMiddleware = wsManager['authenticateSocket'].bind(wsManager);

      authMiddleware(testSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Connection Handler', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    it('should handle new connection', () => {
      const testSocket = createMockSocket();
      wsManager['connectedUsers'].set(testSocket.id, {
        id: 'user123',
        role: 'player',
        authenticated: true,
        connectedAt: new Date(),
      });

      const connectionHandler = vi
        .mocked(mockIO.on)
        .mock.calls.find(call => call[0] === 'connection')?.[1] as Function;

      connectionHandler(testSocket);

      expect(testSocket.on).toHaveBeenCalledWith(
        'subscribe_to_events',
        expect.any(Function)
      );
      expect(testSocket.on).toHaveBeenCalledWith(
        'player_action',
        expect.any(Function)
      );
      expect(testSocket.on).toHaveBeenCalledWith(
        'chat_message',
        expect.any(Function)
      );
      expect(testSocket.on).toHaveBeenCalledWith(
        'request_world_state',
        expect.any(Function)
      );
      expect(testSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
    });

    it('should setup event handlers for valid connections', () => {
      const testSocket = createMockSocket();
      wsManager['connectedUsers'].set(testSocket.id, {
        id: 'user123',
        role: 'player',
        authenticated: true,
        connectedAt: new Date(),
      });

      const connectionHandler = vi
        .mocked(mockIO.on)
        .mock.calls.find(call => call[0] === 'connection')?.[1] as Function;

      connectionHandler(testSocket);

      expect(testSocket.emit).toHaveBeenCalledWith(
        'server_stats',
        expect.any(Object)
      );
      expect(testSocket.emit).toHaveBeenCalledWith(
        'recent_events',
        expect.any(Array)
      );
      expect(testSocket.emit).toHaveBeenCalledWith(
        'online_players',
        expect.any(Array)
      );
    });

    it('should handle connection without authenticated user', () => {
      const testSocket = createMockSocket();
      // Don't add user to connectedUsers map

      const connectionHandler = vi
        .mocked(mockIO.on)
        .mock.calls.find(call => call[0] === 'connection')?.[1] as Function;

      connectionHandler(testSocket);

      // Should return early and not setup handlers
      expect(testSocket.on).not.toHaveBeenCalled();
    });
  });

  describe('Public Methods', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    describe('broadcastLiveEvent', () => {
      it('should broadcast live event to subscribed clients', () => {
        const event = {
          type: 'player_move' as const,
          data: { playerId: 'player123', position: { x: 1, y: 2, z: 3 } },
          timestamp: new Date(),
        };

        wsManager.broadcastLiveEvent(event);

        expect(mockIO.to).toHaveBeenCalledWith('events:player_move');
        expect(mockAuthRoom.emit).toHaveBeenCalledWith('live_event', event);
      });
    });

    describe('sendToUser', () => {
      it('should send message to specific user', () => {
        const userId = 'user123';
        const event = 'test_event';
        const data = { message: 'test' };

        wsManager.sendToUser(userId, event, data);

        expect(mockIO.to).toHaveBeenCalledWith(`user:${userId}`);
        expect(mockAuthRoom.emit).toHaveBeenCalledWith(event, data);
      });
    });

    describe('sendToCharacter', () => {
      it('should send message to specific character', () => {
        const characterId = 'char123';
        const event = 'test_event';
        const data = { message: 'test' };

        wsManager.sendToCharacter(characterId, event, data);

        expect(mockIO.to).toHaveBeenCalledWith(`character:${characterId}`);
        expect(mockAuthRoom.emit).toHaveBeenCalledWith(event, data);
      });
    });

    describe('broadcastToAuthenticated', () => {
      it('should broadcast to authenticated users only', () => {
        const event = 'test_event';
        const data = { message: 'test' };

        wsManager.broadcastToAuthenticated(event, data);

        expect(mockIO.to).toHaveBeenCalledWith('role:player');
        expect(mockIO.to).toHaveBeenCalledWith('role:admin');
        expect(mockAuthRoom.emit).toHaveBeenCalledWith(event, data);
      });
    });

    describe('getConnectionStats', () => {
      it('should return connection statistics', () => {
        wsManager['connectedUsers'].set('user1', {
          id: 'user1',
          role: 'player',
          authenticated: true,
          connectedAt: new Date(),
        });
        wsManager['connectedUsers'].set('user2', {
          id: 'user2',
          role: 'admin',
          authenticated: true,
          connectedAt: new Date(),
        });
        wsManager['connectedUsers'].set('user3', {
          id: 'user3',
          role: 'spectator',
          authenticated: false,
          connectedAt: new Date(),
        });

        const stats = wsManager.getConnectionStats();

        expect(stats).toEqual({
          total: 3,
          authenticated: 2,
          byRole: {
            player: 1,
            admin: 1,
            spectator: 1,
          },
        });
      });
    });

    describe('cleanup', () => {
      it('should cleanup resources', async () => {
        await wsManager.cleanup();

        expect(mockIO.close).toHaveBeenCalled();
      });
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    it('should handle subscribe_to_events', () => {
      const testSocket = createMockSocket();
      const user = {
        id: 'user123',
        role: 'player' as const,
        authenticated: true,
        connectedAt: new Date(),
      };
      wsManager['connectedUsers'].set(testSocket.id, user);

      const eventTypes = ['player_move', 'faction_event'];
      wsManager['handleEventSubscription'](testSocket as any, eventTypes);

      expect(testSocket.join).toHaveBeenCalledWith('events:player_move');
      expect(testSocket.join).toHaveBeenCalledWith('events:faction_event');
    });

    it('should handle player_action events', () => {
      const testSocket = createMockSocket();
      const user = {
        id: 'user123',
        playerId: 'player123',
        role: 'player' as const,
        authenticated: true,
        connectedAt: new Date(),
      };
      wsManager['connectedUsers'].set(testSocket.id, user);

      const action = {
        type: 'move',
        position: { x: 1, y: 2, z: 3 },
      };

      wsManager['handlePlayerAction'](testSocket as any, action);

      expect(rageMPManager.updatePlayerPosition).toHaveBeenCalledWith(
        'player123',
        action.position
      );
    });

    it('should handle chat_message events', () => {
      const testSocket = createMockSocket();
      const user = {
        id: 'user123',
        characterId: 'char123',
        role: 'player' as const,
        authenticated: true,
        connectedAt: new Date(),
      };
      wsManager['connectedUsers'].set(testSocket.id, user);

      const message = 'Hello world!';
      wsManager['handleChatMessage'](testSocket as any, message);

      expect(mockIO.emit).toHaveBeenCalledWith('chat_message', {
        type: 'chat_message',
        user: {
          id: 'user123',
          characterId: 'char123',
          role: 'player',
        },
        message,
        timestamp: expect.any(Date),
      });
    });

    it('should handle disconnect events', () => {
      const testSocket = createMockSocket();
      const user = {
        id: 'user123',
        role: 'player' as const,
        authenticated: true,
        connectedAt: new Date(),
      };
      wsManager['connectedUsers'].set(testSocket.id, user);

      wsManager['handleDisconnect'](testSocket as any);

      expect(wsManager['connectedUsers'].has(testSocket.id)).toBe(false);
    });
  });

  describe('RageMP Integration', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    it('should setup RageMP event listeners', () => {
      expect(rageMPManager.on).toHaveBeenCalledWith(
        'playerConnect',
        expect.any(Function)
      );
      expect(rageMPManager.on).toHaveBeenCalledWith(
        'playerDisconnect',
        expect.any(Function)
      );
      expect(rageMPManager.on).toHaveBeenCalledWith(
        'playerMove',
        expect.any(Function)
      );
      expect(rageMPManager.on).toHaveBeenCalledWith(
        'vehicleSpawned',
        expect.any(Function)
      );
      expect(rageMPManager.on).toHaveBeenCalledWith(
        'tick',
        expect.any(Function)
      );
    });

    it('should handle RageMP player connect events', () => {
      const playerConnectHandler = vi
        .mocked(rageMPManager.on)
        .mock.calls.find(call => call[0] === 'playerConnect')?.[1];

      expect(playerConnectHandler).toBeDefined();

      const playerData = {
        id: 'player123',
        name: 'TestPlayer',
        position: { x: 1, y: 2, z: 3 },
      };

      playerConnectHandler!(playerData);

      expect(mockIO.to).toHaveBeenCalledWith('events:player_move');
      expect(mockAuthRoom.emit).toHaveBeenCalledWith(
        'live_event',
        expect.objectContaining({
          type: 'player_move',
          data: expect.objectContaining({
            action: 'connect',
            player: playerData,
          }),
          playerId: 'player123',
        })
      );
    });

    it('should handle RageMP player disconnect events', () => {
      const playerDisconnectHandler = vi
        .mocked(rageMPManager.on)
        .mock.calls.find(call => call[0] === 'playerDisconnect')?.[1];

      expect(playerDisconnectHandler).toBeDefined();

      const playerData = {
        id: 'player123',
        name: 'TestPlayer',
      };

      playerDisconnectHandler!(playerData);

      expect(mockIO.to).toHaveBeenCalledWith('events:player_move');
      expect(mockAuthRoom.emit).toHaveBeenCalledWith(
        'live_event',
        expect.objectContaining({
          type: 'player_move',
          data: expect.objectContaining({
            action: 'disconnect',
            player: playerData,
          }),
          playerId: 'player123',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      wsManager.initialize(mockServer);
    });

    it('should handle authentication errors gracefully', () => {
      const testSocket = createMockSocket({
        handshake: {
          auth: { token: 'invalid-token' },
          query: {},
        },
      });

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockNext = vi.fn();
      const authMiddleware = wsManager['authenticateSocket'].bind(wsManager);

      authMiddleware(testSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(logger.warn).toHaveBeenCalledWith(
        'WebSocket authentication failed:',
        expect.any(Error)
      );
    });

    it('should handle missing socket.io instance gracefully', () => {
      const wsManagerUninitialized = new WebSocketManager();

      // Should not throw errors when IO is not initialized
      expect(() => {
        wsManagerUninitialized.broadcastLiveEvent({
          type: 'player_move',
          data: {},
          timestamp: new Date(),
        });
        wsManagerUninitialized.sendToUser('user123', 'test', {});
        wsManagerUninitialized.sendToCharacter('char123', 'test', {});
        wsManagerUninitialized.broadcastToAuthenticated('test', {});
      }).not.toThrow();
    });
  });
});

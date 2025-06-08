import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server as HttpServer } from 'http';

// Mock dependencies
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/infrastructure/ragemp', () => ({
  rageMPManager: {
    getPlayerById: vi.fn(),
    getPlayerPosition: vi.fn(),
    broadcastEvent: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getServerStats: vi.fn().mockReturnValue({
      onlinePlayers: 5,
      maxPlayers: 100,
      uptime: 3600,
    }),
    getOnlinePlayers: vi.fn().mockReturnValue([
      { id: '1', name: 'Player1' },
      { id: '2', name: 'Player2' },
    ]),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

vi.mock('@/config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
    },
    server: {
      corsOrigin: ['http://localhost:4829'],
    },
    websocket: {
      cors: {
        origin: ['http://localhost:4829'],
        credentials: true,
      },
    },
  },
}));

// Mock Socket.IO
const mockSocket = {
  id: 'socket-123',
  join: vi.fn(),
  leave: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  handshake: {
    auth: { token: null as string | null },
    query: { token: null as string | null },
  },
};

const mockIo = {
  use: vi.fn(),
  on: vi.fn(),
  emit: vi.fn(),
  to: vi.fn(),
  sockets: {
    emit: vi.fn(),
  },
};

vi.mock('socket.io', () => ({
  Server: vi.fn().mockImplementation(() => mockIo),
}));

import { WebSocketManager } from './websocket.manager';
import jwt from 'jsonwebtoken';

describe('WebSocket Manager', () => {
  let wsManager: WebSocketManager;
  let mockHttpServer: HttpServer;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create new instances
    wsManager = new WebSocketManager();
    mockHttpServer = {} as HttpServer;

    // Reset mock implementations
    mockIo.use.mockImplementation(middleware => {
      // Simulate middleware execution with a mock socket
      const next = vi.fn();
      middleware(mockSocket, next);
    });

    mockIo.on.mockImplementation((event, handler) => {
      if (event === 'connection') {
        // Simulate connection event
        setTimeout(() => handler(mockSocket), 0);
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Instance Creation', () => {
    it('should create WebSocket manager instance', () => {
      expect(wsManager).toBeInstanceOf(WebSocketManager);
    });
  });

  describe('Initialization', () => {
    it('should initialize with HTTP server', () => {
      expect(() => wsManager.initialize(mockHttpServer)).not.toThrow();
    });

    it('should handle multiple initialization attempts gracefully', () => {
      wsManager.initialize(mockHttpServer);
      expect(() => wsManager.initialize(mockHttpServer)).not.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should authenticate valid tokens', () => {
      vi.mocked(jwt.verify).mockImplementation(
        () =>
          ({
            userId: 'user-123',
            username: 'testuser',
            characterId: 'char-123',
            playerId: 'player-123',
            role: 'player',
          }) as unknown
      );

      mockSocket.handshake.auth.token = 'valid-token';

      expect(() => wsManager.initialize(mockHttpServer)).not.toThrow();
    });

    it('should reject invalid tokens', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockSocket.handshake.auth.token = 'invalid-token';

      expect(() => wsManager.initialize(mockHttpServer)).not.toThrow();
    });

    it('should handle missing tokens', () => {
      mockSocket.handshake.auth.token = null;

      expect(() => wsManager.initialize(mockHttpServer)).not.toThrow();
    });
  });

  describe('Event Broadcasting', () => {
    beforeEach(() => {
      wsManager.initialize(mockHttpServer);
    });

    it('should broadcast live events to all clients', () => {
      const liveEvent = {
        type: 'player_move' as const,
        data: { playerId: 'player-123', position: { x: 1, y: 2, z: 3 } },
        timestamp: new Date(),
      };

      wsManager.broadcastLiveEvent(liveEvent);

      expect(mockIo.emit).toHaveBeenCalledWith('live_event', liveEvent);
    });

    it('should send events to specific users', () => {
      const mockToUser = { emit: vi.fn() };
      mockIo.to.mockReturnValue(mockToUser);

      wsManager.sendToUser('user-123', 'personal_message', {
        message: 'Welcome to GangGPT!',
      });

      expect(mockIo.to).toHaveBeenCalledWith('user-123');
      expect(mockToUser.emit).toHaveBeenCalledWith('personal_message', {
        message: 'Welcome to GangGPT!',
      });
    });

    it('should send events to characters', () => {
      const mockToCharacter = { emit: vi.fn() };
      mockIo.to.mockReturnValue(mockToCharacter);

      wsManager.sendToCharacter('char-123', 'character_update', {
        health: 100,
        level: 5,
      });

      expect(mockIo.to).toHaveBeenCalledWith('character:char-123');
      expect(mockToCharacter.emit).toHaveBeenCalledWith('character_update', {
        health: 100,
        level: 5,
      });
    });

    it('should broadcast to authenticated users only', () => {
      const mockSockets = { emit: vi.fn() };
      mockIo.to.mockReturnValue(mockSockets);

      wsManager.broadcastToAuthenticated('server_announcement', {
        message: 'Server maintenance in 10 minutes',
      });

      expect(mockIo.to).toHaveBeenCalledWith('authenticated');
      expect(mockSockets.emit).toHaveBeenCalledWith('server_announcement', {
        message: 'Server maintenance in 10 minutes',
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      wsManager.initialize(mockHttpServer);
    });
    it('should return connection statistics', () => {
      const stats = wsManager.getConnectionStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('authenticated');
      expect(stats).toHaveProperty('byRole');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.authenticated).toBe('number');
      expect(typeof stats.byRole).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle broadcast errors gracefully', () => {
      wsManager.initialize(mockHttpServer);

      // Mock an error in emit
      mockIo.emit.mockImplementation(() => {
        throw new Error('Socket error');
      });

      const liveEvent = {
        type: 'player_move' as const,
        data: { playerId: 'player-123' },
        timestamp: new Date(),
      };

      expect(() => wsManager.broadcastLiveEvent(liveEvent)).not.toThrow();
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should cleanup resources on shutdown', async () => {
      wsManager.initialize(mockHttpServer);

      await expect(wsManager.cleanup()).resolves.not.toThrow();
    });
  });
});

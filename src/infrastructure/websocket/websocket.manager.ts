/**
 * WebSocket Manager - Real-time communication using Socket.IO
 * Handles live updates for player positions, faction events, AI interactions, and world state
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@/infrastructure/logging';
import { rageMPManager } from '@/infrastructure/ragemp';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '@/config';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
  username: string;
}

interface PlayerAction {
  type: string;
  data?: object;
  position?: { x: number; y: number; z: number };
  message?: string;
}

export interface SocketUser {
  id: string;
  characterId?: string;
  playerId?: string;
  role: 'player' | 'admin' | 'spectator';
  authenticated: boolean;
  connectedAt: Date;
}

export interface LiveEvent {
  type:
    | 'player_move'
    | 'faction_event'
    | 'ai_interaction'
    | 'world_event'
    | 'economy_update';
  data: object;
  timestamp: Date;
  playerId?: string;
  location?: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * WebSocket Manager for real-time communication
 */
export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private eventHistory: LiveEvent[] = [];
  private maxEventHistory = 100;

  /**
   * Initialize WebSocket server
   */
  public initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.server.corsOrigin || '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.setupRageMPIntegration();

    logger.info('WebSocket server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.use((socket, next) => {
      this.authenticateSocket(socket, next);
    });

    this.io.on('connection', socket => {
      const user = this.connectedUsers.get(socket.id);
      if (!user) return;

      logger.info(`WebSocket client connected: ${user.id} (${user.role})`);

      // Send initial data
      this.sendInitialData(socket);

      // Handle client events
      socket.on('subscribe_to_events', (eventTypes: string[]) => {
        this.handleEventSubscription(socket, eventTypes);
      });

      socket.on('player_action', (action: PlayerAction) => {
        this.handlePlayerAction(socket, action);
      });

      socket.on('chat_message', (message: string) => {
        this.handleChatMessage(socket, message);
      });

      socket.on('request_world_state', () => {
        this.sendWorldState(socket);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Join user to appropriate rooms
      this.joinUserToRooms(socket, user);
    });
  }

  /**
   * Authenticate socket connection
   */
  private authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void
  ): void {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        // Allow anonymous connections for spectators
        const user: SocketUser = {
          id: socket.id,
          role: 'spectator',
          authenticated: false,
          connectedAt: new Date(),
        };
        this.connectedUsers.set(socket.id, user);
        return next();
      } // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as CustomJwtPayload;

      const user: SocketUser = {
        id: socket.id,
        characterId: decoded.characterId,
        playerId: decoded.playerId,
        role: decoded.role || 'player',
        authenticated: true,
        connectedAt: new Date(),
      };

      this.connectedUsers.set(socket.id, user);
      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Send initial data to newly connected client
   */
  private sendInitialData(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    // Send server stats
    const serverStats = rageMPManager.getServerStats();
    socket.emit('server_stats', serverStats);

    // Send recent events
    const recentEvents = this.eventHistory.slice(-20);
    socket.emit('recent_events', recentEvents);

    // Send online players (if authenticated)
    if (user.authenticated) {
      const onlinePlayers = rageMPManager.getOnlinePlayers();
      socket.emit('online_players', onlinePlayers);
    }
  }

  /**
   * Handle event subscription requests
   */
  private handleEventSubscription(socket: Socket, eventTypes: string[]): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !user.authenticated) return;

    eventTypes.forEach(eventType => {
      socket.join(`events:${eventType}`);
    });

    logger.debug(
      `User ${user.id} subscribed to events: ${eventTypes.join(', ')}`
    );
  }

  /**
   * Handle player actions from client
   */
  private handlePlayerAction(socket: Socket, action: PlayerAction): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !user.authenticated || !user.playerId) return;

    // Validate and process player action
    switch (action.type) {
      case 'move':
        if (action.position) {
          rageMPManager.updatePlayerPosition(user.playerId, action.position);
        }
        break;
      case 'chat':
        if (action.message) {
          this.broadcastChatMessage(user, action.message);
        }
        break;
      default:
        logger.warn(`Unknown player action type: ${action.type}`);
    }
  }

  /**
   * Handle chat messages
   */
  private handleChatMessage(socket: Socket, message: string): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !user.authenticated) return;

    this.broadcastChatMessage(user, message);
  }

  /**
   * Broadcast chat message to all connected clients
   */
  private broadcastChatMessage(user: SocketUser, message: string): void {
    const chatEvent = {
      type: 'chat_message',
      user: {
        id: user.id,
        characterId: user.characterId,
        role: user.role,
      },
      message,
      timestamp: new Date(),
    };

    this.io?.emit('chat_message', chatEvent);
    logger.info(`Chat message from ${user.id}: ${message}`);
  }

  /**
   * Send current world state to client
   */
  private sendWorldState(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const worldState = {
      players: rageMPManager.getOnlinePlayers(),
      vehicles: rageMPManager.getVehicles(),
      serverStats: rageMPManager.getServerStats(),
      timestamp: new Date(),
    };

    socket.emit('world_state', worldState);
  }

  /**
   * Join user to appropriate rooms based on role and location
   */
  private joinUserToRooms(socket: Socket, user: SocketUser): void {
    // Join general rooms
    socket.join('global');
    socket.join(`role:${user.role}`);

    if (user.authenticated && user.characterId) {
      socket.join(`character:${user.characterId}`);
    }

    if (user.playerId) {
      socket.join(`player:${user.playerId}`);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      logger.info(`WebSocket client disconnected: ${user.id}`);
      this.connectedUsers.delete(socket.id);
    }
  }

  /**
   * Setup integration with RAGE:MP events
   */
  private setupRageMPIntegration(): void {
    rageMPManager.on('playerConnect', player => {
      this.broadcastLiveEvent({
        type: 'player_move',
        data: {
          action: 'connect',
          player: {
            id: player.id,
            name: player.name,
            position: player.position,
          },
        },
        timestamp: new Date(),
        playerId: player.id,
        location: player.position,
      });
    });

    rageMPManager.on('playerDisconnect', player => {
      this.broadcastLiveEvent({
        type: 'player_move',
        data: {
          action: 'disconnect',
          player: {
            id: player.id,
            name: player.name,
          },
        },
        timestamp: new Date(),
        playerId: player.id,
      });
    });

    rageMPManager.on('playerMove', (player, position) => {
      this.broadcastLiveEvent({
        type: 'player_move',
        data: {
          action: 'move',
          playerId: player.id,
          position,
        },
        timestamp: new Date(),
        playerId: player.id,
        location: position,
      });
    });

    rageMPManager.on('vehicleSpawned', vehicle => {
      this.broadcastLiveEvent({
        type: 'world_event',
        data: {
          action: 'vehicle_spawned',
          vehicle,
        },
        timestamp: new Date(),
        location: vehicle.position,
      });
    });

    rageMPManager.on('tick', stats => {
      // Broadcast server stats every 10 seconds
      if (Date.now() % 10000 < 100) {
        this.io?.emit('server_stats_update', stats);
      }
    });
  }

  /**
   * Broadcast live event to all subscribed clients
   */
  public broadcastLiveEvent(event: LiveEvent): void {
    if (!this.io) return;

    // Add to event history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxEventHistory);
    }

    // Broadcast to subscribed clients
    this.io.to(`events:${event.type}`).emit('live_event', event);

    // Also broadcast to global room for important events
    if (['faction_event', 'world_event'].includes(event.type)) {
      this.io.to('global').emit('live_event', event);
    }
  }

  /**
   * Send private message to specific user
   */
  public sendToUser(userId: string, event: string, data: object): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send message to specific character
   */
  public sendToCharacter(
    characterId: string,
    event: string,
    data: object
  ): void {
    if (!this.io) return;

    this.io.to(`character:${characterId}`).emit(event, data);
  }

  /**
   * Broadcast to all authenticated users
   */
  public broadcastToAuthenticated(event: string, data: object): void {
    if (!this.io) return;

    this.io.to('role:player').emit(event, data);
    this.io.to('role:admin').emit(event, data);
  }

  /**
   * Get connected users statistics
   */
  public getConnectionStats(): {
    total: number;
    authenticated: number;
    byRole: Record<string, number>;
  } {
    const stats = {
      total: this.connectedUsers.size,
      authenticated: 0,
      byRole: {} as Record<string, number>,
    };

    this.connectedUsers.forEach(user => {
      if (user.authenticated) {
        stats.authenticated++;
      }
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.connectedUsers.clear();
    this.eventHistory = [];
    logger.info('WebSocket manager cleaned up');
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();

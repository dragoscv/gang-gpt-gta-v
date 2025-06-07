/**
 * RAGE:MP Server Integration
 * Real RAGE:MP server integration for GTA V multiplayer
 */

import { EventEmitter } from 'events';
import { logger } from '@/infrastructure/logging';
import { cache } from '@/infrastructure/cache';
import config from '@/config';

// RAGE:MP API - available when running in RAGE:MP context
declare const mp: any;

export interface PlayerData {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimension: number;
  interior: number;
  health: number;
  armor: number;
  money: number;
  level: number;
  isOnline: boolean;
  lastSeen: Date;
  characterId?: string;
  socialClub?: string;
  ip?: string;
  ping?: number;
}

export interface VehicleData {
  id: string;
  model: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  owner?: string;
  locked: boolean;
  engine: boolean;
  fuel: number;
  numberPlate?: string;
  color?: {
    primary: number;
    secondary: number;
  };
}

export interface ServerStats {
  onlinePlayers: number;
  maxPlayers: number;
  uptime: number;
  tickRate: number;
  memoryUsage: number;
  avgPing: number;
}

/**
 * RAGE:MP Server Manager
 * Handles real RAGE:MP server integration for GTA V multiplayer
 */
export class RageMPManager extends EventEmitter {
  private isRunning: boolean = false;
  private players: Map<string, PlayerData> = new Map();
  private vehicles: Map<string, VehicleData> = new Map();
  private serverStartTime: Date | null = null;
  private maxPlayers: number;

  constructor() {
    super();
    this.maxPlayers = config.ragemp.maxPlayers;
  }

  /**
   * Initialize RAGE:MP event handlers
   */
  public initialize(): void {
    if (typeof mp === 'undefined') {
      logger.error(
        'RAGE:MP is not available. Make sure the server is running in RAGE:MP context.'
      );
      return;
    }

    this.setupRageMPEventHandlers();
    this.serverStartTime = new Date();
    this.isRunning = true;

    logger.info('✅ RAGE:MP Manager initialized successfully');
    logger.info(`Server Name: ${config.ragemp.name}`);
    logger.info(`Gamemode: ${config.ragemp.gamemode}`);
    logger.info(`Max Players: ${config.ragemp.maxPlayers}`);

    this.emit('serverStarted');
  }

  /**
   * Setup real RAGE:MP event handlers
   */
  private setupRageMPEventHandlers(): void {
    // Player connection event
    mp.events.add('playerJoin', (player: any) => {
      const playerData: PlayerData = {
        id: player.id.toString(),
        name: player.name,
        position: player.position,
        dimension: player.dimension,
        interior: player.interior,
        health: player.health,
        armor: player.armour,
        money: 0, // Will be loaded from database
        level: 1, // Will be loaded from database
        isOnline: true,
        lastSeen: new Date(),
        socialClub: player.socialClub,
        ip: player.ip,
        ping: player.ping,
      };

      this.players.set(playerData.id, playerData);
      this.cachePlayerData(playerData);

      logger.info(`Player connected: ${playerData.name} (${playerData.id})`);
      this.emit('playerConnect', playerData);
    });

    // Player disconnection event
    mp.events.add(
      'playerQuit',
      (player: any, _exitType: string, reason: string) => {
        const playerData = this.players.get(player.id.toString());
        if (playerData) {
          playerData.isOnline = false;
          playerData.lastSeen = new Date();

          this.players.delete(player.id.toString());
          this.removePlayerFromCache(player.id.toString());

          logger.info(
            `Player disconnected: ${playerData.name} (${playerData.id}) - ${reason}`
          );
          this.emit('playerDisconnect', playerData, reason);
        }
      }
    );

    // Player death event
    mp.events.add(
      'playerDeath',
      (player: any, _reason: number, killer: any) => {
        const playerData = this.players.get(player.id.toString());
        if (playerData) {
          let killerData: PlayerData | undefined;
          if (killer && killer.type === 'player') {
            killerData = this.players.get(killer.id.toString());
          }

          logger.info(
            `Player death: ${playerData.name} ${killerData ? `killed by ${killerData.name}` : 'died'}`
          );
          this.emit('playerDeath', playerData, killerData);
        }
      }
    );

    // Player spawn event
    mp.events.add('playerSpawn', (player: any) => {
      const playerData = this.players.get(player.id.toString());
      if (playerData) {
        logger.debug(`Player spawned: ${playerData.name}`);
        this.emit('playerSpawn', playerData);
      }
    });

    // Player chat event
    mp.events.add('playerChat', (player: any, text: string) => {
      const playerData = this.players.get(player.id.toString());
      if (playerData) {
        logger.info(`[CHAT] ${playerData.name}: ${text}`);
        this.emit('playerChat', playerData, text);
      }
    });

    // Player command event
    mp.events.add('playerCommand', (player: any, command: string) => {
      const playerData = this.players.get(player.id.toString());
      if (playerData) {
        logger.info(`[COMMAND] ${playerData.name}: /${command}`);
        this.emit('playerCommand', playerData, command);
      }
    });

    // Vehicle events
    mp.events.add('vehicleSpawn', (vehicle: any) => {
      const vehicleData: VehicleData = {
        id: vehicle.id.toString(),
        model: vehicle.model,
        position: vehicle.position,
        rotation: vehicle.rotation,
        locked: vehicle.locked,
        engine: vehicle.engine,
        fuel: 100, // Default fuel
        numberPlate: vehicle.numberPlate,
        color: {
          primary: vehicle.getColor(0),
          secondary: vehicle.getColor(1),
        },
      };

      this.vehicles.set(vehicleData.id, vehicleData);
      logger.debug(`Vehicle spawned: ${vehicleData.model} (${vehicleData.id})`);
      this.emit('vehicleSpawned', vehicleData);
    });

    mp.events.add('vehicleDestroy', (vehicle: any) => {
      const vehicleData = this.vehicles.get(vehicle.id.toString());
      if (vehicleData) {
        this.vehicles.delete(vehicle.id.toString());
        logger.debug(
          `Vehicle destroyed: ${vehicleData.model} (${vehicleData.id})`
        );
        this.emit('vehicleDestroyed', vehicleData);
      }
    });

    // Player enter/exit vehicle events
    mp.events.add(
      'playerEnterVehicle',
      (player: any, vehicle: any, seat: number) => {
        const playerData = this.players.get(player.id.toString());
        const vehicleData = this.vehicles.get(vehicle.id.toString());

        if (playerData && vehicleData) {
          logger.debug(
            `${playerData.name} entered vehicle ${vehicleData.model} (seat ${seat})`
          );
          this.emit('playerEnterVehicle', playerData, vehicleData, seat);
        }
      }
    );

    mp.events.add('playerExitVehicle', (player: any, vehicle: any) => {
      const playerData = this.players.get(player.id.toString());
      const vehicleData = this.vehicles.get(vehicle.id.toString());

      if (playerData && vehicleData) {
        logger.debug(`${playerData.name} exited vehicle ${vehicleData.model}`);
        this.emit('playerExitVehicle', playerData, vehicleData);
      }
    });

    logger.info('RAGE:MP event handlers registered');
  }

  /**
   * Send message to player
   */
  public sendPlayerMessage(
    playerId: string,
    message: string,
    color?: string
  ): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      if (color) {
        player.outputChatBox(`!{${color}}${message}`);
      } else {
        player.outputChatBox(message);
      }

      const playerData = this.players.get(playerId);
      if (playerData) {
        this.emit('playerMessage', playerData, message, color);
      }
    }
  }

  /**
   * Send message to all players
   */
  public broadcastMessage(message: string, color?: string): void {
    mp.players.forEach((player: any) => {
      if (color) {
        player.outputChatBox(`!{${color}}${message}`);
      } else {
        player.outputChatBox(message);
      }
    });

    logger.info(`[BROADCAST] ${message}`);
    this.emit('broadcastMessage', message, color);
  }

  /**
   * Spawn vehicle
   */
  public spawnVehicle(
    vehicleData: Omit<VehicleData, 'id'>
  ): VehicleData | null {
    try {
      const vehicle = mp.vehicles.new(vehicleData.model, vehicleData.position, {
        heading: vehicleData.rotation.z,
        dimension: 0,
      });

      if (vehicleData.numberPlate) {
        vehicle.numberPlate = vehicleData.numberPlate;
      }

      if (vehicleData.color) {
        vehicle.setColor(
          vehicleData.color.primary,
          vehicleData.color.secondary
        );
      }

      vehicle.locked = vehicleData.locked;
      vehicle.engine = vehicleData.engine;

      const newVehicleData: VehicleData = {
        id: vehicle.id.toString(),
        ...vehicleData,
      };

      this.vehicles.set(newVehicleData.id, newVehicleData);
      logger.debug(
        `Vehicle spawned: ${newVehicleData.model} (${newVehicleData.id})`
      );

      return newVehicleData;
    } catch (error) {
      logger.error('Failed to spawn vehicle:', error);
      return null;
    }
  }

  /**
   * Destroy vehicle
   */
  public destroyVehicle(vehicleId: string): void {
    const vehicle = mp.vehicles.at(parseInt(vehicleId, 10));
    if (vehicle) {
      vehicle.destroy();

      const vehicleData = this.vehicles.get(vehicleId);
      if (vehicleData) {
        this.vehicles.delete(vehicleId);
        logger.debug(
          `Vehicle destroyed: ${vehicleData.model} (${vehicleData.id})`
        );
        this.emit('vehicleDestroyed', vehicleData);
      }
    }
  }

  /**
   * Teleport player
   */
  public teleportPlayer(
    playerId: string,
    position: { x: number; y: number; z: number },
    dimension?: number
  ): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      player.position = position;
      if (dimension !== undefined) {
        player.dimension = dimension;
      }

      const playerData = this.players.get(playerId);
      if (playerData) {
        playerData.position = position;
        if (dimension !== undefined) {
          playerData.dimension = dimension;
        }
        this.emit('playerMove', playerData, position);
      }
    }
  }

  /**
   * Set player health
   */
  public setPlayerHealth(playerId: string, health: number): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      player.health = Math.max(0, Math.min(100, health));

      const playerData = this.players.get(playerId);
      if (playerData) {
        playerData.health = health;
      }
    }
  }

  /**
   * Set player armor
   */
  public setPlayerArmor(playerId: string, armor: number): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      player.armour = Math.max(0, Math.min(100, armor));

      const playerData = this.players.get(playerId);
      if (playerData) {
        playerData.armor = armor;
      }
    }
  }

  /**
   * Kick player
   */
  public kickPlayer(
    playerId: string,
    reason: string = 'Kicked by admin'
  ): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      player.kick(reason);
      logger.info(`Player kicked: ${player.name} - ${reason}`);
    }
  }

  /**
   * Ban player
   */
  public banPlayer(playerId: string, reason: string = 'Banned by admin'): void {
    const player = mp.players.at(parseInt(playerId, 10));
    if (player) {
      // Note: RAGE:MP doesn't have a built-in ban system
      // You would need to implement this with a database
      logger.info(`Player banned: ${player.name} - ${reason}`);
      player.kick(`Banned: ${reason}`);
    }
  }

  /**
   * Get online players
   */
  public getOnlinePlayers(): PlayerData[] {
    return Array.from(this.players.values()).filter(p => p.isOnline);
  }

  /**
   * Get player by ID
   */
  public getPlayer(playerId: string): PlayerData | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get all vehicles
   */
  public getVehicles(): VehicleData[] {
    return Array.from(this.vehicles.values());
  }

  /**
   * Get server statistics
   */
  public getServerStats(): ServerStats {
    const uptime = this.serverStartTime
      ? Date.now() - this.serverStartTime.getTime()
      : 0;

    // Calculate average ping
    const onlinePlayers = this.getOnlinePlayers();
    const avgPing =
      onlinePlayers.length > 0
        ? onlinePlayers.reduce((sum, p) => sum + (p.ping || 0), 0) /
          onlinePlayers.length
        : 0;

    return {
      onlinePlayers: onlinePlayers.length,
      maxPlayers: this.maxPlayers,
      uptime: Math.floor(uptime / 1000), // seconds
      tickRate: config.ragemp.syncRate || 40,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      avgPing: Math.round(avgPing),
    };
  }

  /**
   * Check if server is running
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update player position (called by RAGE:MP automatically)
   */
  public updatePlayerPosition(
    playerId: string,
    position: { x: number; y: number; z: number }
  ): void {
    const playerData = this.players.get(playerId);
    if (playerData) {
      playerData.position = position;
      this.emit('playerMove', playerData, position);
    }
  }

  /**
   * Cache player data
   */
  private async cachePlayerData(player: PlayerData): Promise<void> {
    try {
      await cache.manager.setUserSession(player.id, {
        playerId: player.id,
        characterId: player.characterId,
        position: player.position,
        lastSeen: player.lastSeen,
        isOnline: player.isOnline,
      });
    } catch (error) {
      logger.error('Failed to cache player data:', error);
    }
  }

  /**
   * Remove player from cache
   */
  private async removePlayerFromCache(playerId: string): Promise<void> {
    try {
      await cache.manager.deleteUserSession(playerId);
      logger.debug(`Removed player ${playerId} from cache`);
    } catch (error) {
      logger.error('Failed to remove player from cache:', error);
    }
  }

  /**
   * Register custom command
   */
  public registerCommand(
    command: string,
    callback: (player: any, args: string[]) => void
  ): void {
    mp.events.addCommand(command, callback);
    logger.info(`Registered command: /${command}`);
  }

  /**
   * Register custom event
   */
  public registerEvent(
    eventName: string,
    callback: (...args: any[]) => void
  ): void {
    mp.events.add(eventName, callback);
    logger.debug(`Registered event: ${eventName}`);
  }

  /**
   * Get world instance
   */
  getWorld() {
    return mp.world;
  }

  /**
   * Call client-side function
   */
  callClient(player: any, eventName: string, ...args: any[]): void {
    if (player && player.call) {
      player.call(eventName, ...args);
    }
  }

  /**
   * Notify player with message
   */
  notifyPlayer(player: any, message: string, _type: string = 'info'): void {
    if (player && player.notify) {
      player.notify(message);
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.isRunning = false;
    this.serverStartTime = null;
    this.players.clear();
    this.vehicles.clear();
    this.removeAllListeners();
    logger.info('RAGE:MP manager cleaned up');
  }
}

// Export singleton instance
export const rageMPManager = new RageMPManager();

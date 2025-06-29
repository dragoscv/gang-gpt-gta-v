import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mp global
global.mp = undefined;

// Mock dependencies
vi.mock('../logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../cache', () => ({
  cache: {
    manager: {
      setUserSession: vi.fn(),
      deleteUserSession: vi.fn(),
    },
  },
}));

vi.mock('@/config', () => ({
  default: {
    ragemp: {
      enabled: false,
      maxPlayers: 100,
      gamemode: 'roleplay',
      port: 4830,
      name: 'GangGPT Test Server',
      syncRate: 40,
    },
  },
}));

describe('RAGEMP Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('Player Management', () => {
    it('should handle player operations', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(manager).toBeDefined();
      expect(typeof manager.getPlayer).toBe('function');
      expect(typeof manager.getOnlinePlayers).toBe('function');
      expect(typeof manager.sendPlayerMessage).toBe('function');
      expect(typeof manager.teleportPlayer).toBe('function');
    });

    it('should return undefined/empty results when RAGEMP is disabled', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const player = manager.getPlayer('test-id');
      expect(player).toBeUndefined();

      const players = manager.getOnlinePlayers();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBe(0);
    });
    it('should handle player health and armor', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // These methods should exist but will fail when mp is undefined
      expect(typeof manager.setPlayerHealth).toBe('function');
      expect(typeof manager.setPlayerArmor).toBe('function');
    });

    it('should handle player administration', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // These methods should exist but will fail when mp is undefined
      expect(typeof manager.kickPlayer).toBe('function');
      expect(typeof manager.banPlayer).toBe('function');
    });
  });

  describe('Event Management', () => {
    it('should handle event registration', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const handler = vi.fn();
      expect(() => manager.on('playerConnect', handler)).not.toThrow();
      expect(() => manager.off('playerConnect', handler)).not.toThrow();
    });
    it('should handle event broadcasting', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Test that the manager supports event registration
      expect(typeof manager.registerEvent).toBe('function');
      expect(typeof manager.broadcastMessage).toBe('function');
    });
  });

  describe('Server Management', () => {
    it('should handle server statistics', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const stats = manager.getServerStats();
      expect(stats).toBeDefined();
      expect(typeof stats.onlinePlayers).toBe('number');
      expect(typeof stats.maxPlayers).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });

    it('should handle server initialization', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => manager.initialize()).not.toThrow();
    });
    it('should handle server shutdown', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Test cleanup method
      expect(typeof manager.cleanup).toBe('function');
      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });
  describe('Vehicle Management', () => {
    it('should handle vehicle operations', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(typeof manager.spawnVehicle).toBe('function');
      expect(typeof manager.destroyVehicle).toBe('function');
      expect(typeof manager.getVehicles).toBe('function');
    });

    it('should return null for vehicle operations when disabled', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicles = manager.getVehicles();
      expect(Array.isArray(vehicles)).toBe(true);
      expect(vehicles.length).toBe(0);
    });
  });
  describe('World Management', () => {
    it('should handle world operations', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(typeof manager.getWorld).toBe('function');
      expect(typeof manager.updatePlayerPosition).toBe('function');
    });

    it('should handle world state changes', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Test position updates
      expect(() =>
        manager.updatePlayerPosition('test-id', { x: 0, y: 0, z: 0 })
      ).not.toThrow();
    });
  });

  describe('Module Export', () => {
    it('should export rageMPManager instance', async () => {
      const ragempModule = await import('./index');

      expect(ragempModule.rageMPManager).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    it('should setup event handlers when initialized', async () => {
      // Mock mp global for this test
      global.mp = {
        events: {
          add: vi.fn(),
          call: vi.fn(),
        },
        players: {
          broadcast: vi.fn(),
        },
        vehicles: {
          new: vi.fn(),
        },
        world: {
          time: { hour: 12, minute: 0, second: 0 },
          weather: 'sunny',
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      manager.initialize();

      expect(global.mp.events.add).toHaveBeenCalled();

      // Clean up
      global.mp = undefined;
    });

    it('should handle event emissions', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const emitSpy = vi.spyOn(manager, 'emit');

      // Test custom event emission
      manager.emit('testEvent', { data: 'test' });
      expect(emitSpy).toHaveBeenCalledWith('testEvent', { data: 'test' });
    });

    it('should handle player events when RAGEMP is available', async () => {
      global.mp = {
        events: {
          add: vi.fn(),
          call: vi.fn(),
        },
        players: {
          broadcast: vi.fn(),
          length: 0,
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      manager.initialize();

      // Check that player-related events were registered
      expect(global.mp.events.add).toHaveBeenCalledWith(
        'playerJoin',
        expect.any(Function)
      );
      expect(global.mp.events.add).toHaveBeenCalledWith(
        'playerQuit',
        expect.any(Function)
      );

      global.mp = undefined;
    });
  });

  describe('Player Data Management', () => {
    it('should handle player data operations correctly', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Test getting non-existent player - should return undefined, not null
      const player = manager.getPlayer('non-existent');
      expect(player).toBeUndefined();
    });

    it('should return correct online players count', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const players = manager.getOnlinePlayers();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBe(0);
    });
    it('should handle message sending to players', async () => {
      // Set up proper mp mock
      global.mp = {
        players: {
          at: vi.fn(() => undefined), // Return undefined for non-existent player
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Method should not throw, just return void
      expect(() =>
        manager.sendPlayerMessage('non-existent', 'test message')
      ).not.toThrow();

      global.mp = undefined;
    });
    it('should handle broadcasting messages', async () => {
      global.mp = {
        players: {
          forEach: vi.fn(callback => {
            // Mock player for forEach iteration
            const mockPlayer = { outputChatBox: vi.fn() };
            callback(mockPlayer);
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();
      expect(() => manager.broadcastMessage('test broadcast')).not.toThrow();
      expect(global.mp.players.forEach).toHaveBeenCalled();

      global.mp = undefined;
    });
    it('should handle broadcasting without RAGEMP', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Should throw when mp is undefined since the method doesn't handle this case
      expect(() => manager.broadcastMessage('test')).toThrow();
    });
  });

  describe('Vehicle Operations', () => {
    it('should handle vehicle spawning', async () => {
      global.mp = {
        vehicles: {
          new: vi.fn().mockReturnValue({ id: 'test-vehicle' }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicleData = {
        model: 'elegy',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        locked: false,
        engine: false,
        fuel: 100,
      };

      const vehicle = manager.spawnVehicle(vehicleData);
      expect(vehicle).toBeDefined();

      global.mp = undefined;
    });
    it('should handle vehicle spawning without RAGEMP', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicleData = {
        model: 'elegy',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        locked: false,
        engine: false,
        fuel: 100,
      };

      const vehicle = manager.spawnVehicle(vehicleData);
      expect(vehicle).toBeNull();
    });
    it('should handle vehicle destruction', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Should throw when mp is undefined since the method doesn't handle this case
      expect(() => manager.destroyVehicle('test-vehicle')).toThrow();
    });

    it('should get vehicles list', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicles = manager.getVehicles();
      expect(Array.isArray(vehicles)).toBe(true);
    });
  });

  describe('World State Management', () => {
    it('should get world information', async () => {
      global.mp = {
        world: {
          time: { hour: 12, minute: 30, second: 45 },
          weather: 'clear',
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const world = manager.getWorld();
      expect(world).toBeDefined();
      expect(world.time).toEqual({ hour: 12, minute: 30, second: 45 });
      expect(world.weather).toBe('clear');

      global.mp = undefined;
    });
    it('should handle world info without RAGEMP', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Should throw when mp is undefined since the method doesn't handle this case
      expect(() => manager.getWorld()).toThrow();
    });

    it('should update player positions', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => {
        manager.updatePlayerPosition('test-player', { x: 100, y: 200, z: 10 });
      }).not.toThrow();
    });
    it('should get world time and weather', async () => {
      global.mp = {
        world: {
          time: { hour: 12, minute: 0, second: 0 },
          weather: 'sunny',
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const world = manager.getWorld();
      expect(world.time.hour).toBe(12);
      expect(world.weather).toBe('sunny');

      global.mp = undefined;
    });
  });
  describe('Configuration Management', () => {
    it('should handle server running detection', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(typeof manager.isServerRunning).toBe('function');
      expect(manager.isServerRunning()).toBe(false);
    });

    it('should handle server configuration', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const stats = manager.getServerStats();
      expect(stats.maxPlayers).toBe(100); // From config
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Should not throw when mp is undefined
      expect(() => manager.initialize()).not.toThrow();
    });
    it('should handle method calls without RAGEMP context', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicleData = {
        model: 'car',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        locked: false,
        engine: false,
        fuel: 100,
      };
      // These methods should throw when mp is undefined since they don't handle this case
      expect(() => manager.sendPlayerMessage('test', 'msg')).toThrow();
      expect(() => manager.kickPlayer('test', 'reason')).toThrow();
      expect(() => manager.banPlayer('test', 'reason')).toThrow();
      // spawnVehicle catches errors and returns null instead of throwing
      expect(manager.spawnVehicle(vehicleData)).toBeNull();
    });

    it('should handle cleanup errors', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Advanced Player Management', () => {
    it('should handle player health and armor operations with RAGEMP', async () => {
      global.mp = {
        players: {
          at: vi.fn().mockReturnValue({
            health: 100,
            armour: 0,
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // These should not throw when mp is available
      expect(() => manager.setPlayerHealth('test-player', 50)).not.toThrow();
      expect(() => manager.setPlayerArmor('test-player', 75)).not.toThrow();

      global.mp = undefined;
    });

    it('should handle teleportPlayer with dimension', async () => {
      global.mp = {
        players: {
          at: vi.fn().mockReturnValue({
            position: { x: 0, y: 0, z: 0 },
            dimension: 0,
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => {
        manager.teleportPlayer('test-player', { x: 100, y: 200, z: 10 }, 5);
      }).not.toThrow();

      global.mp = undefined;
    });

    it('should handle kick and ban operations with RAGEMP', async () => {
      global.mp = {
        players: {
          at: vi.fn().mockReturnValue({
            name: 'TestPlayer',
            kick: vi.fn(),
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => manager.kickPlayer('test-player')).not.toThrow();
      expect(() => manager.banPlayer('test-player')).not.toThrow();
      expect(() =>
        manager.kickPlayer('test-player', 'Custom reason')
      ).not.toThrow();
      expect(() =>
        manager.banPlayer('test-player', 'Custom reason')
      ).not.toThrow();

      global.mp = undefined;
    });

    it('should handle player messaging with colors', async () => {
      global.mp = {
        players: {
          at: vi.fn().mockReturnValue({
            outputChatBox: vi.fn(),
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() =>
        manager.sendPlayerMessage('test-player', 'Test message', '#FF0000')
      ).not.toThrow();

      global.mp = undefined;
    });

    it('should handle broadcasting with colors', async () => {
      global.mp = {
        players: {
          forEach: vi.fn(callback => {
            const mockPlayer = { outputChatBox: vi.fn() };
            callback(mockPlayer);
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() =>
        manager.broadcastMessage('Test broadcast', '#00FF00')
      ).not.toThrow();

      global.mp = undefined;
    });
  });

  describe('Command and Event Registration', () => {
    it('should register commands with RAGEMP', async () => {
      global.mp = {
        events: {
          addCommand: vi.fn(),
          add: vi.fn(),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const commandHandler = vi.fn();
      expect(() =>
        manager.registerCommand('test', commandHandler)
      ).not.toThrow();
      expect(global.mp.events.addCommand).toHaveBeenCalledWith(
        'test',
        commandHandler
      );

      global.mp = undefined;
    });

    it('should register events with RAGEMP', async () => {
      global.mp = {
        events: {
          add: vi.fn(),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const eventHandler = vi.fn();
      expect(() =>
        manager.registerEvent('customEvent', eventHandler)
      ).not.toThrow();
      expect(global.mp.events.add).toHaveBeenCalledWith(
        'customEvent',
        eventHandler
      );

      global.mp = undefined;
    });

    it('should handle command and event registration without RAGEMP', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const handler = vi.fn();
      expect(() => manager.registerCommand('test', handler)).toThrow();
      expect(() => manager.registerEvent('testEvent', handler)).toThrow();
    });
  });

  describe('Client Communication', () => {
    it('should call client-side functions', async () => {
      const mockPlayer = {
        call: vi.fn(),
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() =>
        manager.callClient(mockPlayer, 'testEvent', 'arg1', 'arg2')
      ).not.toThrow();
      expect(mockPlayer.call).toHaveBeenCalledWith('testEvent', 'arg1', 'arg2');
    });

    it('should handle callClient with invalid player', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => manager.callClient(null, 'testEvent')).not.toThrow();
      expect(() => manager.callClient(undefined, 'testEvent')).not.toThrow();
      expect(() => manager.callClient({}, 'testEvent')).not.toThrow();
    });

    it('should notify players', async () => {
      const mockPlayer = {
        notify: vi.fn(),
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() =>
        manager.notifyPlayer(mockPlayer, 'Test notification')
      ).not.toThrow();
      expect(mockPlayer.notify).toHaveBeenCalledWith('Test notification');

      expect(() =>
        manager.notifyPlayer(mockPlayer, 'Error message', 'error')
      ).not.toThrow();
    });

    it('should handle notifyPlayer with invalid player', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      expect(() => manager.notifyPlayer(null, 'test')).not.toThrow();
      expect(() => manager.notifyPlayer(undefined, 'test')).not.toThrow();
      expect(() => manager.notifyPlayer({}, 'test')).not.toThrow();
    });
  });

  describe('Vehicle Management Advanced', () => {
    it('should handle complete vehicle spawning with all properties', async () => {
      const mockVehicle = {
        id: 'test-vehicle-123',
        setColor: vi.fn(),
        locked: false,
        engine: false,
        numberPlate: '',
        getColor: vi.fn(index => (index === 0 ? 255 : 128)),
      };

      global.mp = {
        vehicles: {
          new: vi.fn().mockReturnValue(mockVehicle),
          at: vi.fn().mockReturnValue({
            destroy: vi.fn(),
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicleData = {
        model: 'elegy',
        position: { x: 100, y: 200, z: 10 },
        rotation: { x: 0, y: 0, z: 90 },
        locked: true,
        engine: true,
        fuel: 75,
        numberPlate: 'TEST123',
        color: {
          primary: 255,
          secondary: 128,
        },
      };

      const result = manager.spawnVehicle(vehicleData);
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-vehicle-123');
      expect(mockVehicle.setColor).toHaveBeenCalledWith(255, 128);

      // Test vehicle destruction
      expect(() => manager.destroyVehicle('test-vehicle-123')).not.toThrow();

      global.mp = undefined;
    });

    it('should handle vehicle spawning errors', async () => {
      global.mp = {
        vehicles: {
          new: vi.fn().mockImplementation(() => {
            throw new Error('Vehicle spawn failed');
          }),
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const vehicleData = {
        model: 'invalid',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        locked: false,
        engine: false,
        fuel: 100,
      };

      const result = manager.spawnVehicle(vehicleData);
      expect(result).toBeNull();

      global.mp = undefined;
    });
  });

  describe('Server Statistics Advanced', () => {
    it('should calculate server stats with players', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      // Add some mock player data
      const mockPlayer = {
        id: 'test-player',
        name: 'TestPlayer',
        position: { x: 0, y: 0, z: 0 },
        dimension: 0,
        interior: 0,
        health: 100,
        armor: 0,
        money: 1000,
        level: 5,
        isOnline: true,
        lastSeen: new Date(),
        ping: 50,
      };

      // Use reflection to add player to internal map
      (manager as any).players.set('test-player', mockPlayer);

      const stats = manager.getServerStats();
      expect(stats.onlinePlayers).toBe(1);
      expect(stats.avgPing).toBe(50);
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.tickRate).toBe('number');
    });

    it('should handle empty server stats', async () => {
      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      const stats = manager.getServerStats();
      expect(stats.onlinePlayers).toBe(0);
      expect(stats.avgPing).toBe(0);
      expect(stats.uptime).toBe(0); // No start time set
    });
  });
  describe('Cache Operations', () => {
    it('should handle cache operations during player management', async () => {
      global.mp = {
        events: {
          add: vi.fn(),
        },
        players: {
          broadcast: vi.fn(),
        },
        vehicles: {
          new: vi.fn(),
        },
        world: {
          time: { hour: 12, minute: 0, second: 0 },
          weather: 'sunny',
        },
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      manager.initialize();

      // Simulate player join event to test caching
      const mockPlayer = {
        id: 1,
        name: 'TestPlayer',
        position: { x: 0, y: 0, z: 0 },
        dimension: 0,
        interior: 0,
        health: 100,
        armour: 0,
        socialClub: 'testclub',
        ip: '127.0.0.1',
        ping: 30,
      };

      // Find and call the playerJoin event handler
      const addCalls = (global.mp.events.add as any).mock.calls;
      const playerJoinCall = addCalls.find(
        (call: any) => call[0] === 'playerJoin'
      );

      if (playerJoinCall) {
        const playerJoinHandler = playerJoinCall[1];
        expect(() => playerJoinHandler(mockPlayer)).not.toThrow();

        // Import cache to check if it was called
        const cacheModule = await import('../cache');
        expect(cacheModule.cache.manager.setUserSession).toHaveBeenCalled();
      }

      global.mp = undefined;
    });
  });

  describe('Event Handler Coverage', () => {
    it('should handle all player events', async () => {
      global.mp = {
        events: {
          add: vi.fn(),
        },
        players: {
          broadcast: vi.fn(),
        },
        vehicles: {
          new: vi.fn(),
        },
        world: {},
      };

      const { RageMPManager } = await import('./ragemp.manager');
      const manager = new RageMPManager();

      manager.initialize();

      const addCalls = (global.mp.events.add as any).mock.calls;

      // Check all event handlers are registered
      const expectedEvents = [
        'playerJoin',
        'playerQuit',
        'playerDeath',
        'playerSpawn',
        'playerChat',
        'playerCommand',
        'vehicleSpawn',
        'vehicleDestroy',
        'playerEnterVehicle',
        'playerExitVehicle',
      ];

      expectedEvents.forEach(eventName => {
        const eventFound = addCalls.some((call: any) => call[0] === eventName);
        expect(eventFound).toBe(true);
      });

      global.mp = undefined;
    });
  });
});

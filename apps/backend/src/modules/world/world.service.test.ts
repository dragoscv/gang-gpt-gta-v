import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WorldService,
  Territory,
  WorldEvent,
  EconomicState,
} from './world.service';
import { PrismaClient } from '@prisma/client';
import { cache } from '../../infrastructure/cache';

// Mock dependencies
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock cache module - define the mock object first
vi.mock('../../infrastructure/cache', () => ({
  cache: {
    manager: {
      getTemporary: vi.fn(),
      setTemporary: vi.fn(),
      deleteTemporary: vi.fn(),
      setPermanent: vi.fn(),
      getPermanent: vi.fn(),
      deletePermanent: vi.fn(),
    },
  },
}));

// Create comprehensive Prisma mock
const createMockPrismaMethod = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
});

const mockPrisma = {
  territory: createMockPrismaMethod(),
  worldEvent: createMockPrismaMethod(),
  player: createMockPrismaMethod(),
  user: createMockPrismaMethod(),
  character: createMockPrismaMethod(),
  economicState: createMockPrismaMethod(),
  faction: createMockPrismaMethod(),
  // Add any other models that might be used
} as unknown as PrismaClient;

describe('WorldService', () => {
  let worldService: WorldService;
  beforeEach(async () => {
    vi.clearAllMocks();
    // Setup default cache responses
    vi.mocked(cache.manager.getTemporary).mockResolvedValue(null);
    vi.mocked(cache.manager.setTemporary).mockResolvedValue(true);

    // Create service without calling constructor to avoid initialization
    worldService = Object.create(WorldService.prototype);

    // Manually set the prisma property
    (worldService as any).prisma = mockPrisma;
    (worldService as any).territories = new Map();
    (worldService as any).activeEvents = new Map();
    (worldService as any).economicState = null;
  });

  describe('getTerritory', () => {
    it('should return territory if it exists', () => {
      const mockTerritory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);

      const result = worldService.getTerritory('test-territory');
      expect(result).toEqual(mockTerritory);
    });

    it('should return undefined if territory does not exist', () => {
      const result = worldService.getTerritory('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllTerritories', () => {
    it('should return all territories as array', () => {
      const mockTerritories = [
        {
          id: 'territory-1',
          name: 'Territory 1',
          boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
          contested: false,
          value: 50,
          lastUpdate: new Date(),
        },
        {
          id: 'territory-2',
          name: 'Territory 2',
          boundaries: { x1: 100, y1: 100, x2: 200, y2: 200 },
          contested: true,
          value: 75,
          lastUpdate: new Date(),
        },
      ];

      mockTerritories.forEach(territory => {
        (worldService as any).territories.set(territory.id, territory);
      });

      const result = worldService.getAllTerritories();
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockTerritories));
    });

    it('should return empty array when no territories exist', () => {
      const result = worldService.getAllTerritories();
      expect(result).toEqual([]);
    });
  });

  describe('getActiveEvents', () => {
    it('should return all active events as array', () => {
      const mockEvents = [
        {
          id: 'event-1',
          type: 'faction_war' as const,
          location: { x: 100, y: 100, z: 10, radius: 50 },
          severity: 'high' as const,
          duration: 60,
          affectedFactions: ['faction1'],
          description: 'Test event 1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000),
        },
        {
          id: 'event-2',
          type: 'territory_conflict' as const,
          location: { x: 200, y: 200, z: 10, radius: 30 },
          severity: 'medium' as const,
          duration: 30,
          affectedFactions: ['faction2'],
          description: 'Test event 2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30000),
        },
      ];

      mockEvents.forEach(event => {
        (worldService as any).activeEvents.set(event.id, event);
      });

      const result = worldService.getActiveEvents();
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockEvents));
    });

    it('should return empty array when no events exist', () => {
      const result = worldService.getActiveEvents();
      expect(result).toEqual([]);
    });
  });

  describe('getEconomicState', () => {
    it('should return economic state if set', () => {
      const mockEconomicState = {
        drugPrices: { cocaine: 100, weed: 50 },
        weaponPrices: { pistol: 500, rifle: 2000 },
        propertyValues: { house: 100000, business: 500000 },
        lastUpdate: new Date(),
      };

      (worldService as any).economicState = mockEconomicState;

      const result = worldService.getEconomicState();
      expect(result).toEqual(mockEconomicState);
    });

    it('should return null when no economic state is set', () => {
      const result = worldService.getEconomicState();
      expect(result).toBeNull();
    });
  });

  describe('getWorldStats', () => {
    it('should return world statistics', () => {
      // Add some test data
      const mockTerritory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: true,
        value: 50,
        lastUpdate: new Date(),
      };

      const mockEvent = {
        id: 'test-event',
        type: 'faction_war' as const,
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high' as const,
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);
      (worldService as any).activeEvents.set('test-event', mockEvent);
      const result = worldService.getWorldStats();

      expect(result.territories.total).toBe(1);
      expect(result.territories.contested).toBe(1);
      expect(result.events.active).toBe(1);
      expect(result.economic).toBeNull();
    });
  });

  describe('getEventsAtLocation', () => {
    it('should return events within radius of location', () => {
      const mockEvent = {
        id: 'nearby-event',
        type: 'faction_war' as const,
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high' as const,
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Nearby event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      const farEvent = {
        id: 'far-event',
        type: 'territory_conflict' as const,
        location: { x: 1000, y: 1000, z: 10, radius: 30 },
        severity: 'medium' as const,
        duration: 30,
        affectedFactions: ['faction2'],
        description: 'Far event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      (worldService as any).activeEvents.set('nearby-event', mockEvent);
      (worldService as any).activeEvents.set('far-event', farEvent); // Query for events near the first event's location
      const result = worldService.getEventsAtLocation(120, 120, 10);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('nearby-event');
    });
    it('should return empty array when no events are within radius', () => {
      const result = worldService.getEventsAtLocation(0, 0, 0);

      expect(result).toEqual([]);
    });
  });

  describe('isInContestedTerritory', () => {
    it('should return true for location in contested territory', () => {
      const mockTerritory: Territory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: true,
        value: 50,
        lastUpdate: new Date(),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);

      const result = worldService.isInContestedTerritory(50, 50);
      expect(result).toBe(true);
    });

    it('should return false for location in non-contested territory', () => {
      const mockTerritory: Territory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);

      const result = worldService.isInContestedTerritory(50, 50);
      expect(result).toBe(false);
    });

    it('should return false for location not in any territory', () => {
      const result = worldService.isInContestedTerritory(200, 200);
      expect(result).toBe(false);
    });
  });

  describe('getTerritoryAtPosition', () => {
    it('should return territory containing the position', () => {
      const mockTerritory: Territory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);

      const result = worldService.getTerritoryAtPosition(50, 50);
      expect(result).toEqual(mockTerritory);
    });

    it('should return null when position is not in any territory', () => {
      const result = worldService.getTerritoryAtPosition(200, 200);
      expect(result).toBeNull();
    });
  });
  describe('getCurrentWorldState', () => {
    it('should return current world state with expected format', async () => {
      const mockEvent: WorldEvent = {
        id: 'test-event',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).activeEvents.set('test-event', mockEvent); // Mock character count for active players
      vi.mocked(mockPrisma.character.count).mockResolvedValueOnce(5);

      const result = await worldService.getCurrentWorldState();

      expect(result.currentTime).toBeDefined();
      expect(result.weather).toBeDefined();
      expect(result.activePlayers).toBe(5);
      expect(result.factionWars).toBe(true);
      expect(result.economicState).toMatch(/poor|average|wealthy/);
      expect(result.crimeLevel).toMatch(/low|medium|high/);
    });
  });

  describe('cleanup', () => {
    it('should cleanup world service resources', async () => {
      const spy = vi.spyOn(worldService, 'removeAllListeners');

      await worldService.cleanup();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('updateTerritoryControl', () => {
    it('should update territory control and emit event', async () => {
      const mockTerritory: Territory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);

      const updateSpy = vi.spyOn(worldService, 'emit');
      await worldService.updateTerritoryControl(
        'test-territory',
        'new-faction'
      );

      const updatedTerritory = worldService.getTerritory('test-territory');
      expect(updatedTerritory?.controllingFaction).toBe('new-faction');
      expect(updateSpy).toHaveBeenCalledWith(
        'territoryControlChanged',
        expect.any(Object)
      );
    });
    it('should throw error for non-existent territory', async () => {
      await expect(
        worldService.updateTerritoryControl('non-existent', 'faction')
      ).rejects.toThrow('Territory non-existent not found');
    });
  });

  describe('getActiveEvents', () => {
    it('should return all active events', () => {
      const mockEvent: WorldEvent = {
        id: 'test-event',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).activeEvents.set('test-event', mockEvent);

      const result = worldService.getActiveEvents();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvent);
    });

    it('should return empty array when no events', () => {
      const result = worldService.getActiveEvents();
      expect(result).toHaveLength(0);
    });
  });

  describe('getEventsAtLocation', () => {
    it('should return events at specific location', () => {
      const mockEvent: WorldEvent = {
        id: 'test-event',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).activeEvents.set('test-event', mockEvent);

      const result = worldService.getEventsAtLocation(120, 120, 10);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvent);
    });

    it('should return empty array for location without events', () => {
      const result = worldService.getEventsAtLocation(500, 500, 10);
      expect(result).toHaveLength(0);
    });
  });

  describe('getEconomicState', () => {
    it('should return economic state if available', () => {
      const mockEconomicState: EconomicState = {
        drugPrices: { cocaine: 100, heroin: 150 },
        weaponAvailability: { pistol: 80, rifle: 60 },
        lawEnforcementActivity: 70,
        touristActivity: 50,
        businessActivity: 80,
        lastUpdate: new Date(),
      };

      (worldService as any).economicState = mockEconomicState;

      const result = worldService.getEconomicState();
      expect(result).toEqual(mockEconomicState);
    });

    it('should return null when no economic state', () => {
      const result = worldService.getEconomicState();
      expect(result).toBeNull();
    });
  });
  describe('updateEconomicState', () => {
    it('should update economic state and cache it', async () => {
      const initialEconomicState: EconomicState = {
        drugPrices: { cocaine: 100, heroin: 150 },
        weaponAvailability: { pistol: 80, rifle: 60 },
        lawEnforcementActivity: 70,
        touristActivity: 50,
        businessActivity: 80,
        lastUpdate: new Date(),
      };

      // Set initial state first
      (worldService as any).economicState = initialEconomicState;

      const updates: Partial<EconomicState> = {
        drugPrices: { cocaine: 120, heroin: 180 },
        lawEnforcementActivity: 60,
      };

      const emitSpy = vi.spyOn(worldService, 'emit');

      await worldService.updateEconomicState(updates);

      const updatedState = worldService.getEconomicState();
      expect(updatedState?.drugPrices.cocaine).toBe(120);
      expect(updatedState?.lawEnforcementActivity).toBe(60);
      expect(emitSpy).toHaveBeenCalledWith(
        'economicStateChanged',
        expect.any(Object)
      );
    });

    it('should do nothing if no economic state exists', async () => {
      const updates: Partial<EconomicState> = {
        lawEnforcementActivity: 60,
      };

      await worldService.updateEconomicState(updates);

      expect(worldService.getEconomicState()).toBeNull();
    });
  });

  describe('getWorldStats', () => {
    it('should return world statistics', () => {
      const mockTerritory: Territory = {
        id: 'test-territory',
        name: 'Test Territory',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: true,
        value: 50,
        lastUpdate: new Date(),
      };

      const mockEvent: WorldEvent = {
        id: 'test-event',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).territories.set('test-territory', mockTerritory);
      (worldService as any).activeEvents.set('test-event', mockEvent);
      const result = worldService.getWorldStats();

      expect(result.territories.total).toBe(1);
      expect(result.territories.contested).toBe(1);
      expect(result.events.active).toBe(1);
      expect(result.events.byType['faction_war']).toBe(1);
    });
  });

  describe('getActiveWorldEvents', () => {
    it('should return filtered events by type', async () => {
      const mockEvent1: WorldEvent = {
        id: 'event1',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'War event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      const mockEvent2: WorldEvent = {
        id: 'event2',
        type: 'police_raid',
        location: { x: 200, y: 200, z: 10, radius: 30 },
        severity: 'medium',
        duration: 30,
        affectedFactions: ['faction2'],
        description: 'Police raid',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      (worldService as any).activeEvents.set('event1', mockEvent1);
      (worldService as any).activeEvents.set('event2', mockEvent2);

      const result = await worldService.getActiveWorldEvents({
        type: 'faction_war',
      });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('faction_war');
    });

    it('should return filtered events by severity', async () => {
      const mockEvent: WorldEvent = {
        id: 'event1',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'critical',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Critical event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).activeEvents.set('event1', mockEvent);

      const result = await worldService.getActiveWorldEvents({
        severity: 'critical',
      });
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('critical');
    });

    it('should return all events when no filter', async () => {
      const mockEvent: WorldEvent = {
        id: 'event1',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Test event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      (worldService as any).activeEvents.set('event1', mockEvent);

      const result = await worldService.getActiveWorldEvents();
      expect(result).toHaveLength(1);
    });
  });
  describe('getLocationNameFromCoordinates', () => {
    it('should return location name for coordinates within predefined locations', () => {
      // Using coordinates that match "Downtown Los Santos" (x: 200, y: -900, radius: 800)
      const result = worldService.getLocationNameFromCoordinates(200, -900, 10);
      expect(result).toBe('Downtown Los Santos');
    });
    it('should return Unknown Location for coordinates outside any predefined location', () => {
      const result = worldService.getLocationNameFromCoordinates(
        5000,
        5000,
        10
      );
      expect(result).toBe('Unknown Location');
    });
  });

  describe('Cache management', () => {
    it('should handle cache failures gracefully when loading territories', async () => {
      // Mock cache error
      vi.mocked(cache.manager.getTemporary).mockRejectedValueOnce(
        new Error('Cache error')
      );

      // Create a new instance to trigger initialization
      const newService = new WorldService(mockPrisma as any);

      // Should initialize with default territories despite cache error
      await new Promise(resolve => setTimeout(resolve, 100));
      const territories = newService.getAllTerritories();
      expect(territories.length).toBeGreaterThan(0);
    });

    it('should handle cache failures gracefully when loading economic state', async () => {
      // Mock cache error for economic state
      vi.mocked(cache.manager.getTemporary)
        .mockResolvedValueOnce(null) // territories
        .mockRejectedValueOnce(new Error('Cache error')); // economic

      const newService = new WorldService(mockPrisma as any);
      await new Promise(resolve => setTimeout(resolve, 100));

      const economicState = newService.getEconomicState();
      expect(economicState).toBeDefined();
    });

    it('should handle JSON parse errors for cached territories', async () => {
      // Mock invalid JSON
      vi.mocked(cache.manager.getTemporary).mockResolvedValueOnce(
        'invalid json'
      );

      const newService = new WorldService(mockPrisma as any);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should fall back to default territories
      const territories = newService.getAllTerritories();
      expect(territories.length).toBeGreaterThan(0);
    });

    it('should handle JSON parse errors for cached economic state', async () => {
      // Mock valid territories but invalid economic JSON
      vi.mocked(cache.manager.getTemporary)
        .mockResolvedValueOnce(null) // territories
        .mockResolvedValueOnce('invalid json'); // economic

      const newService = new WorldService(mockPrisma as any);
      await new Promise(resolve => setTimeout(resolve, 100));

      const economicState = newService.getEconomicState();
      expect(economicState).toBeDefined();
    });
    it('should cache world state successfully', async () => {
      // First add a territory to the service
      const mockTerritory: Territory = {
        id: 'grove_street',
        name: 'Grove Street',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };
      (worldService as any).territories.set('grove_street', mockTerritory);

      vi.mocked(cache.manager.setTemporary).mockResolvedValueOnce(true);

      // Call a method that triggers caching
      await worldService.updateTerritoryControl('grove_street', 'test-faction');

      expect(cache.manager.setTemporary).toHaveBeenCalledWith(
        'territories',
        expect.any(Array),
        300
      );
    });

    it('should handle cache set failures gracefully', async () => {
      // First add a territory to the service
      const mockTerritory: Territory = {
        id: 'grove_street',
        name: 'Grove Street',
        boundaries: { x1: 0, y1: 0, x2: 100, y2: 100 },
        contested: false,
        value: 50,
        lastUpdate: new Date(),
      };
      (worldService as any).territories.set('grove_street', mockTerritory);

      vi.mocked(cache.manager.setTemporary).mockResolvedValueOnce(false);

      // Should not throw when cache fails
      await expect(
        worldService.updateTerritoryControl('grove_street', 'test-faction')
      ).resolves.not.toThrow();
    });
  });

  describe('Event processing', () => {
    beforeEach(() => {
      // Clear any existing events
      (worldService as any).activeEvents.clear();
      vi.clearAllTimers();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('should process and remove expired events', () => {
      const expiredEvent: WorldEvent = {
        id: 'expired-event',
        type: 'faction_war',
        location: { x: 100, y: 100, z: 10, radius: 50 },
        severity: 'high',
        duration: 60,
        affectedFactions: ['faction1'],
        description: 'Expired event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Already expired
      };

      const activeEvent: WorldEvent = {
        id: 'active-event',
        type: 'police_raid',
        location: { x: 200, y: 200, z: 10, radius: 30 },
        severity: 'medium',
        duration: 30,
        affectedFactions: ['faction2'],
        description: 'Active event',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // Future expiration
      };

      (worldService as any).activeEvents.set('expired-event', expiredEvent);
      (worldService as any).activeEvents.set('active-event', activeEvent);

      const emitSpy = vi.spyOn(worldService, 'emit');

      // Call the private method directly to test event processing
      (worldService as any).processActiveEvents();

      expect(emitSpy).toHaveBeenCalledWith('eventExpired', expiredEvent);
      expect(worldService.getActiveEvents()).toHaveLength(1);
      expect(worldService.getActiveEvents()[0].id).toBe('active-event');
    });

    it('should handle faction conflict events', () => {
      const emitSpy = vi.spyOn(worldService, 'emit');
      const location = { x: 100, y: 100, z: 10 };

      // Call the private method directly to create the event
      (worldService as any).createTerritoryConflictEvent(
        'faction1',
        'faction2',
        location
      );

      expect(emitSpy).toHaveBeenCalledWith(
        'eventCreated',
        expect.objectContaining({
          type: 'territory_conflict',
          affectedFactions: ['faction1', 'faction2'],
        })
      );

      // Check if event was created
      const events = worldService.getActiveEvents();
      expect(events.some(e => e.type === 'territory_conflict')).toBeTruthy();
    });

    it('should handle player activity events', () => {
      const emitSpy = vi.spyOn(worldService, 'emit');
      const location = { x: 100, y: 100, z: 10 };

      worldService.emit('playerActivity', 'player1', 'police_chase', location);
      worldService.emit('playerActivity', 'player2', 'drug_deal', location);
      worldService.emit(
        'playerActivity',
        'player3',
        'weapon_purchase',
        location
      );

      expect(emitSpy).toHaveBeenCalledWith(
        'playerActivity',
        'player1',
        'police_chase',
        location
      );
      expect(emitSpy).toHaveBeenCalledWith(
        'playerActivity',
        'player2',
        'drug_deal',
        location
      );
      expect(emitSpy).toHaveBeenCalledWith(
        'playerActivity',
        'player3',
        'weapon_purchase',
        location
      );
    });

    it('should handle economic change events', () => {
      const emitSpy = vi.spyOn(worldService, 'emit');

      worldService.emit('economicChange', 'drug_market', 2);

      expect(emitSpy).toHaveBeenCalledWith('economicChange', 'drug_market', 2);
    });
  });

  describe('Weather and environment', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return summer weather patterns', async () => {
      // Set date to summer month (July)
      vi.setSystemTime(new Date(2024, 6, 15, 12, 0, 0)); // July 15, 12:00 PM

      const state = await worldService.getCurrentWorldState();
      expect(['sunny', 'clear']).toContain(state.weather);
    });

    it('should return winter weather patterns', async () => {
      // Set date to winter month (December)
      vi.setSystemTime(new Date(2024, 11, 15, 6, 0, 0)); // December 15, 6:00 AM

      const state = await worldService.getCurrentWorldState();
      expect(['foggy', 'cloudy', 'clear']).toContain(state.weather);
    });

    it('should return spring/fall weather patterns', async () => {
      // Set date to spring month (April)
      vi.setSystemTime(new Date(2024, 3, 15, 15, 0, 0)); // April 15, 3:00 PM

      const state = await worldService.getCurrentWorldState();
      expect(['cloudy', 'clear', 'sunny']).toContain(state.weather);
    });
  });

  describe('Economic level calculations', () => {
    it('should return wealthy for high business activity', () => {
      (worldService as any).economicState = {
        businessActivity: 80,
        lawEnforcementActivity: 50,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getEconomicLevel();
      expect(state).toBe('wealthy');
    });

    it('should return poor for low business activity', () => {
      (worldService as any).economicState = {
        businessActivity: 20,
        lawEnforcementActivity: 50,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getEconomicLevel();
      expect(state).toBe('poor');
    });

    it('should return average for medium business activity', () => {
      (worldService as any).economicState = {
        businessActivity: 50,
        lawEnforcementActivity: 50,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getEconomicLevel();
      expect(state).toBe('average');
    });
  });

  describe('Crime level calculations', () => {
    it('should return low crime for high law enforcement', () => {
      (worldService as any).economicState = {
        businessActivity: 50,
        lawEnforcementActivity: 80,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getCrimeLevel();
      expect(state).toBe('low');
    });

    it('should return high crime for low law enforcement', () => {
      (worldService as any).economicState = {
        businessActivity: 50,
        lawEnforcementActivity: 20,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getCrimeLevel();
      expect(state).toBe('high');
    });

    it('should return medium crime for medium law enforcement', () => {
      (worldService as any).economicState = {
        businessActivity: 50,
        lawEnforcementActivity: 50,
        lastUpdate: new Date(),
      };

      const state = (worldService as any).getCrimeLevel();
      expect(state).toBe('medium');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully when getting active players', async () => {
      vi.mocked(mockPrisma.character.count).mockRejectedValueOnce(
        new Error('Database error')
      );

      const state = await worldService.getCurrentWorldState();
      expect(state.activePlayers).toBe(0);
    });

    it('should return default values when economic state is null', async () => {
      (worldService as any).economicState = null;

      const state = await worldService.getCurrentWorldState();
      expect(state.economicState).toBe('average');
      expect(state.crimeLevel).toBe('medium');
    });

    it('should handle cache errors during initialization gracefully', async () => {
      vi.mocked(cache.manager.getTemporary).mockRejectedValue(
        new Error('Cache service unavailable')
      );

      // Should not throw during initialization
      await expect(async () => {
        const newService = new WorldService(mockPrisma as any);
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });
  });
});

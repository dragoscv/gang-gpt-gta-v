import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldService } from './world.service';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock cache module
const mockCacheManager = {
  getTemporary: vi.fn(),
  setTemporary: vi.fn(),
  deleteTemporary: vi.fn(),
  setPermanent: vi.fn(),
  getPermanent: vi.fn(),
  deletePermanent: vi.fn(),
};

vi.mock('../../infrastructure/cache', () => ({
  cache: {
    manager: mockCacheManager,
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
  economicState: createMockPrismaMethod(),
  faction: createMockPrismaMethod(),
  // Add any other models that might be used
} as unknown as PrismaClient;

describe('WorldService', () => {
  let worldService: WorldService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default cache responses
    mockCacheManager.getTemporary.mockResolvedValue(null);
    mockCacheManager.setTemporary.mockResolvedValue(undefined);

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
      expect(result).toHaveProperty('totalTerritories', 1);
      expect(result).toHaveProperty('contestedTerritories', 1);
      expect(result).toHaveProperty('activeEvents', 1);
      expect(result.territories.total).toBe(1);
      expect(result.territories.contested).toBe(1);
      expect(result.events.active).toBe(1);
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
});

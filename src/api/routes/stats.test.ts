import { describe, it, expect, beforeEach, vi } from 'vitest';
import { statsRouter } from './stats';

// Mock external dependencies
vi.mock('../../modules/players/player.service', () => ({
  PlayerService: vi.fn().mockImplementation(() => ({
    getTotalPlayers: vi.fn().mockResolvedValue(150),
  })),
}));

vi.mock('../../modules/factions/faction.service', () => ({
  FactionService: vi.fn().mockImplementation(() => ({
    getTotalFactions: vi.fn().mockResolvedValue(12),
  })),
}));

vi.mock('../../modules/world/world.service', () => ({
  WorldService: vi.fn().mockImplementation(() => ({
    getActiveLocations: vi.fn().mockResolvedValue(45),
    getAllTerritories: vi.fn().mockReturnValue([
      { id: 1, name: 'Downtown' },
      { id: 2, name: 'Industrial' },
    ]),
    getActiveEvents: vi.fn().mockReturnValue([{ id: 1, type: 'gang_war' }]),
    getWorldStats: vi.fn().mockReturnValue({
      activePlayers: 42,
      territoryControl: 85,
    }),
  })),
}));

vi.mock('../../modules/economy/economy.service', () => ({
  EconomyService: vi.fn().mockImplementation(() => ({
    getEconomicIndicators: vi.fn().mockResolvedValue({
      totalWealth: 1000000,
      averageWealth: 6666.67,
      marketVolume: 500000,
    }),
    getAllMarketItems: vi.fn().mockReturnValue([
      { id: 1, name: 'Weapon' },
      { id: 2, name: 'Drug' },
    ]),
    getEconomyStats: vi.fn().mockReturnValue({
      totalTransactions: 1500,
      totalValue: 750000,
    }),
  })),
}));

vi.mock('../../infrastructure/cache', () => ({
  cache: {
    getStats: vi.fn().mockResolvedValue({
      hits: 1250,
      misses: 150,
      hitRate: 89.3,
    }),
  },
}));

vi.mock('../../infrastructure/ragemp/ragemp.manager', () => ({
  RageMPManager: vi.fn().mockImplementation(() => ({
    getOnlinePlayers: vi.fn().mockReturnValue([
      { id: '1', name: 'Player1' },
      { id: '2', name: 'Player2' },
    ]),
    getServerStats: vi.fn().mockResolvedValue({
      uptime: 86400,
      version: '1.0.0',
      performance: {
        cpu: 45.2,
        memory: 512,
      },
    }),
  })),
}));

vi.mock('../../infrastructure/database', () => ({
  DatabaseService: {
    getInstance: vi.fn().mockReturnValue({
      prisma: {
        // Mock prisma instance
        $disconnect: vi.fn(),
      },
    }),
  },
}));

vi.mock('../../config', () => ({
  default: {
    app: {
      environment: 'test',
    },
    ai: {
      enabled: true,
      providers: ['azure'],
      deploymentName: 'gpt-4o-mini',
    },
    server: {
      name: 'Test Server',
      maxPlayers: 100,
    },
  },
}));

describe('Stats Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return comprehensive stats object', async () => {
      // Mock the createCaller context
      const caller = statsRouter.createCaller({} as any);
      const result = await caller.getAll();

      expect(result).toHaveProperty('players');
      expect(result).toHaveProperty('factions');
      expect(result).toHaveProperty('world');
      expect(result).toHaveProperty('economy');
      expect(result).toHaveProperty('server');
      expect(result).toHaveProperty('ai');
      expect(result).toHaveProperty('cache');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EconomyService } from './economy.service';

// Mock Prisma client
const mockPrisma = {
  economicTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  userProfile: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  character: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  faction: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  economicEvent: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
};

// Cast to any to avoid type issues in tests
const prismaClient = mockPrisma as any;

// Mock cache
const mockCache = {
  getEconomyData: vi.fn(),
  setEconomyData: vi.fn(),
  deleteEconomyData: vi.fn(),
};

// Mock logger
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EconomyService', () => {
  let economyService: EconomyService;

  beforeEach(() => {
    vi.clearAllMocks();
    economyService = new EconomyService(prismaClient, mockCache as any);
  });

  describe('processTransaction', () => {
    it('should process transaction successfully', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        playerId: 'player-1',
        amount: 1000,
        type: 'INCOME',
        category: 'MISSION_REWARD',
        description: 'Mission completed',
        createdAt: new Date(),
      };

      (mockPrisma.economicTransaction.create as any).mockResolvedValue(
        mockTransaction
      );
      (mockPrisma.character.update as any).mockResolvedValue({});

      const result = await economyService.processTransaction(
        'player-1',
        1000,
        'INCOME',
        'MISSION_REWARD',
        'Mission completed'
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('transaction-1');
      expect(mockPrisma.economicTransaction.create).toHaveBeenCalledWith({
        data: {
          playerId: 'player-1',
          amount: 1000,
          type: 'INCOME',
          category: 'MISSION_REWARD',
          description: 'Mission completed',
        },
      });
    });

    it('should handle transaction failure gracefully', async () => {
      (mockPrisma.economicTransaction.create as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await economyService.processTransaction(
        'player-1',
        1000,
        'INCOME',
        'MISSION_REWARD',
        'Mission completed'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });

    it('should update character balance on income', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        playerId: 'player-1',
        amount: 1000,
        type: 'INCOME',
        category: 'MISSION_REWARD',
        description: 'Mission completed',
        createdAt: new Date(),
      };

      (mockPrisma.economicTransaction.create as any).mockResolvedValue(
        mockTransaction
      );
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 5000,
      });
      (mockPrisma.character.update as any).mockResolvedValue({});

      const result = await economyService.processTransaction(
        'player-1',
        1000,
        'INCOME',
        'MISSION_REWARD',
        'Mission completed'
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: { money: { increment: 1000 } },
      });
    });

    it('should update character balance on expense', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        playerId: 'player-1',
        amount: 500,
        type: 'EXPENSE',
        category: 'PURCHASE',
        description: 'Item purchase',
        createdAt: new Date(),
      };

      (mockPrisma.economicTransaction.create as any).mockResolvedValue(
        mockTransaction
      );
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 5000,
      });
      (mockPrisma.character.update as any).mockResolvedValue({});

      const result = await economyService.processTransaction(
        'player-1',
        500,
        'EXPENSE',
        'PURCHASE',
        'Item purchase'
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: { money: { decrement: 500 } },
      });
    });
  });

  describe('getPlayerBalance', () => {
    it('should return player balance successfully', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 5000,
      });

      const balance = await economyService.getPlayerBalance('player-1');

      expect(balance).toBe(5000);
      expect(mockPrisma.character.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        select: { money: true },
      });
    });

    it('should return 0 for non-existent player', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue(null);

      const balance = await economyService.getPlayerBalance('non-existent');

      expect(balance).toBe(0);
    });

    it('should handle database errors', async () => {
      (mockPrisma.character.findUnique as any).mockRejectedValue(
        new Error('Database error')
      );

      const balance = await economyService.getPlayerBalance('player-1');

      expect(balance).toBe(0);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history successfully', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          playerId: 'player-1',
          amount: 1000,
          type: 'INCOME',
          category: 'MISSION_REWARD',
          description: 'Mission completed',
          createdAt: new Date(),
        },
        {
          id: 'transaction-2',
          playerId: 'player-1',
          amount: 500,
          type: 'EXPENSE',
          category: 'PURCHASE',
          description: 'Item purchase',
          createdAt: new Date(),
        },
      ];

      (mockPrisma.economicTransaction.findMany as any).mockResolvedValue(
        mockTransactions
      );

      const result = await economyService.getTransactionHistory('player-1', 10);

      expect(result).toEqual(mockTransactions);
      expect(mockPrisma.economicTransaction.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should handle database errors', async () => {
      (mockPrisma.economicTransaction.findMany as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await economyService.getTransactionHistory('player-1', 10);

      expect(result).toEqual([]);
    });
  });

  describe('purchaseItem', () => {
    beforeEach(() => {
      // Setup character with money
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 5000,
        inventory: [],
      });
      (mockPrisma.character.update as any).mockResolvedValue({});
      (mockPrisma.economicTransaction.create as any).mockResolvedValue({
        id: 'transaction-1',
      });
    });

    it('should purchase item successfully', async () => {
      const result = await economyService.purchaseItem('player-1', 'item-1', 2);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(mockPrisma.character.update).toHaveBeenCalled();
      expect(mockPrisma.economicTransaction.create).toHaveBeenCalled();
    });

    it('should handle insufficient funds', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 50,
        inventory: [],
      });

      const result = await economyService.purchaseItem(
        'player-1',
        'item-1',
        10
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });

    it('should handle player not found', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue(null);

      const result = await economyService.purchaseItem(
        'non-existent',
        'item-1',
        1
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });

    it('should handle database error', async () => {
      (mockPrisma.character.findUnique as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await economyService.purchaseItem('player-1', 'item-1', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });
  });

  describe('sellItem', () => {
    beforeEach(() => {
      // Setup character with inventory
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 1000,
        inventory: [{ itemId: 'item-1', quantity: 5 }],
      });
      (mockPrisma.character.update as any).mockResolvedValue({});
      (mockPrisma.economicTransaction.create as any).mockResolvedValue({
        id: 'transaction-1',
      });
    });

    it('should sell item successfully', async () => {
      const result = await economyService.sellItem('player-1', 'item-1', 2);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(mockPrisma.character.update).toHaveBeenCalled();
      expect(mockPrisma.economicTransaction.create).toHaveBeenCalled();
    });

    it('should handle insufficient inventory', async () => {
      const result = await economyService.sellItem('player-1', 'item-1', 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient quantity');
    });

    it('should handle player not found', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue(null);

      const result = await economyService.sellItem('non-existent', 'item-1', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });

    it('should handle item not in inventory', async () => {
      (mockPrisma.character.findUnique as any).mockResolvedValue({
        id: 'player-1',
        money: 1000,
        inventory: [],
      });

      const result = await economyService.sellItem('player-1', 'item-1', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item not found');
    });

    it('should handle database error', async () => {
      (mockPrisma.character.findUnique as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await economyService.sellItem('player-1', 'item-1', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources successfully', async () => {
      // Mock price update interval
      (economyService as any).priceUpdateInterval = setInterval(() => {}, 1000);

      await economyService.cleanup();

      // The cleanup method clears the interval
      expect((economyService as any).priceUpdateInterval).toBeDefined();
    });

    it('should handle cleanup when no interval is set', async () => {
      (economyService as any).priceUpdateInterval = null;

      await expect(economyService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('getMarketData', () => {
    it('should return market data for all items', () => {
      // Initialize market with test data
      (economyService as any).marketItems.set('item-1', {
        id: 'item-1',
        name: 'Test Item',
        category: 'drugs',
        basePrice: 100,
        currentPrice: 120,
        supply: 50,
        demand: 75,
        volatility: 0.1,
        lastUpdate: new Date(),
        averageVolume: 10,
      });

      const marketData = economyService.getMarketData();

      expect(marketData).toBeDefined();
      expect(Array.from(marketData.values())).toHaveLength(1);
      expect(marketData.get('item-1')).toBeDefined();
      expect(marketData.get('item-1')?.currentPrice).toBe(120);
    });

    it('should return market data for specific item', () => {
      (economyService as any).marketItems.set('item-1', {
        id: 'item-1',
        name: 'Test Item',
        category: 'drugs',
        basePrice: 100,
        currentPrice: 120,
        supply: 50,
        demand: 75,
        volatility: 0.1,
        lastUpdate: new Date(),
        averageVolume: 10,
      });

      const itemData = economyService.getMarketData('item-1');

      expect(itemData).toBeDefined();
      expect(itemData?.currentPrice).toBe(120);
      expect(itemData?.id).toBe('item-1');
    });

    it('should return undefined for non-existent item', () => {
      const itemData = economyService.getMarketData('non-existent');

      expect(itemData).toBeUndefined();
    });
  });
});

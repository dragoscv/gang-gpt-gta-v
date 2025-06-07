/**
 * Economy Service - Manages the in-game economy and financial transactions
 * Handles dynamic pricing, market fluctuations, and economic events
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/infrastructure/logging';
import { cache } from '@/infrastructure/cache';
import { EventEmitter } from 'events';

export interface MarketItem {
  id: string;
  name: string;
  category: 'drugs' | 'weapons' | 'vehicles' | 'services' | 'property';
  basePrice: number;
  currentPrice: number;
  supply: number; // 0-100
  demand: number; // 0-100
  volatility: number; // 0-1 (how much price can fluctuate)
  lastUpdate: Date;
  averageVolume: number; // Average sales volume for the item
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'income' | 'expense';
  characterId: string;
  itemId?: string;
  amount: number;
  description: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface EconomicIndicators {
  inflation: number; // percentage
  unemployment: number; // percentage
  gdp: number; // gross domestic product
  criminalActivity: number; // 0-100
  tourism: number; // 0-100
  businessActivity: number; // 0-100
  lastUpdate: Date;
}

export interface BusinessVenture {
  id: string;
  name: string;
  type: 'restaurant' | 'club' | 'warehouse' | 'garage' | 'laundrette';
  ownerId: string;
  revenue: number;
  expenses: number;
  profit: number;
  employees: number;
  reputation: number; // 0-100
  location: {
    x: number;
    y: number;
    z: number;
  };
  isActive: boolean;
  lastUpdate: Date;
}

export class EconomyService extends EventEmitter {
  private marketItems: Map<string, MarketItem> = new Map();
  private recentTransactions: Transaction[] = [];
  private economicIndicators: EconomicIndicators | null = null;
  // TODO: Implement business ventures system
  // private businesses: Map<string, BusinessVenture> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaClient) {
    super();
    this.initializeEconomy();
  }

  /**
   * Initialize the economy system
   */
  private async initializeEconomy(): Promise<void> {
    try {
      logger.info('Initializing economy system...');

      // Load market items
      await this.loadMarketItems();

      // Load economic indicators
      await this.loadEconomicIndicators();

      // Start price fluctuation system
      this.startPriceFluctuations();

      logger.info(
        `Economy initialized with ${this.marketItems.size} market items`
      );
    } catch (error) {
      logger.error('Failed to initialize economy:', error);
      throw error;
    }
  }

  /**
   * Load market items from cache or initialize defaults
   */
  private async loadMarketItems(): Promise<void> {
    try {
      let cachedItems = null;
      try {
        cachedItems = await cache.manager.getTemporary('economy:market_items');
      } catch (cacheError) {
        logger.warn(
          'Failed to load market items from cache, using defaults:',
          cacheError
        );
      }

      if (cachedItems) {
        let items: MarketItem[];

        // Handle both JSON string and direct object cases
        if (typeof cachedItems === 'string') {
          try {
            items = JSON.parse(cachedItems) as MarketItem[];
          } catch (parseError) {
            logger.warn(
              'Failed to parse cached market items, using defaults:',
              parseError
            );
            items = [];
          }
        } else {
          items = cachedItems as MarketItem[];
        }

        items.forEach(item => {
          this.marketItems.set(item.id, item);
        });
        logger.info(`Loaded ${items.length} market items from cache`);
        return;
      }

      // Initialize default market items
      const defaultItems: MarketItem[] = [
        // Drugs
        {
          id: 'weed',
          name: 'Cannabis',
          category: 'drugs',
          basePrice: 50,
          currentPrice: 50,
          supply: 70,
          demand: 60,
          volatility: 0.3,
          lastUpdate: new Date(),
          averageVolume: 10,
        },
        {
          id: 'cocaine',
          name: 'Cocaine',
          category: 'drugs',
          basePrice: 200,
          currentPrice: 200,
          supply: 40,
          demand: 80,
          volatility: 0.5,
          lastUpdate: new Date(),
          averageVolume: 5,
        },
        {
          id: 'meth',
          name: 'Methamphetamine',
          category: 'drugs',
          basePrice: 150,
          currentPrice: 150,
          supply: 50,
          demand: 70,
          volatility: 0.4,
          lastUpdate: new Date(),
          averageVolume: 8,
        },
        // Weapons
        {
          id: 'pistol',
          name: 'Pistol',
          category: 'weapons',
          basePrice: 500,
          currentPrice: 500,
          supply: 80,
          demand: 60,
          volatility: 0.2,
          lastUpdate: new Date(),
          averageVolume: 3,
        },
        {
          id: 'assault_rifle',
          name: 'Assault Rifle',
          category: 'weapons',
          basePrice: 2500,
          currentPrice: 2500,
          supply: 30,
          demand: 90,
          volatility: 0.6,
          lastUpdate: new Date(),
          averageVolume: 1,
        },
        // Vehicles
        {
          id: 'sports_car',
          name: 'Sports Car',
          category: 'vehicles',
          basePrice: 50000,
          currentPrice: 50000,
          supply: 60,
          demand: 40,
          volatility: 0.1,
          lastUpdate: new Date(),
          averageVolume: 2,
        },
      ];

      defaultItems.forEach(item => {
        this.marketItems.set(item.id, item);
      });

      await this.cacheMarketItems();
      logger.info(`Initialized ${defaultItems.length} default market items`);
    } catch (error) {
      logger.error('Failed to load market items:', error);
      throw error;
    }
  }

  /**
   * Load economic indicators
   */
  private async loadEconomicIndicators(): Promise<void> {
    try {
      let cachedIndicators = null;
      try {
        cachedIndicators =
          await cache.manager.getTemporary('economy:indicators');
      } catch (cacheError) {
        logger.warn(
          'Failed to load economic indicators from cache, using defaults:',
          cacheError
        );
      }

      if (cachedIndicators) {
        // Handle both JSON string and direct object cases
        let parsedIndicators: any;
        if (typeof cachedIndicators === 'string') {
          try {
            parsedIndicators = JSON.parse(cachedIndicators);
          } catch (parseError) {
            logger.warn(
              'Failed to parse cached economic indicators, using defaults:',
              parseError
            );
            parsedIndicators = null;
          }
        } else {
          parsedIndicators = cachedIndicators;
        }

        // Validate that the cached indicators has all required properties
        if (
          parsedIndicators &&
          typeof parsedIndicators.inflation === 'number' &&
          typeof parsedIndicators.unemployment === 'number' &&
          typeof parsedIndicators.gdp === 'number' &&
          typeof parsedIndicators.criminalActivity === 'number' &&
          typeof parsedIndicators.tourism === 'number' &&
          typeof parsedIndicators.businessActivity === 'number'
        ) {
          this.economicIndicators = parsedIndicators as EconomicIndicators;
          logger.info('Loaded economic indicators from cache');
          return;
        }
      }

      // Initialize default indicators
      this.economicIndicators = {
        inflation: 2.5,
        unemployment: 15.0,
        gdp: 1000000,
        criminalActivity: 60,
        tourism: 40,
        businessActivity: 70,
        lastUpdate: new Date(),
      };

      await this.cacheEconomicIndicators();
      logger.info('Initialized default economic indicators');
    } catch (error) {
      logger.error('Failed to load economic indicators:', error);
      throw error;
    }
  }

  /**
   * Start price fluctuation system
   */
  private startPriceFluctuations(): void {
    // Update prices every 5 minutes
    this.priceUpdateInterval = setInterval(() => {
      this.updateMarketPrices();
    }, 300000);
  }

  /**
   * Update market prices based on supply, demand, and economic factors
   */
  private async updateMarketPrices(): Promise<void> {
    try {
      const updates: string[] = [];

      this.marketItems.forEach((item, _id) => {
        // Calculate price change based on supply/demand
        const supplyDemandRatio = item.demand / Math.max(item.supply, 1);
        const baseChange = (supplyDemandRatio - 1) * 0.1; // 10% change per point difference

        // Add economic factors
        const economicMultiplier = this.economicIndicators
          ? 1 + this.economicIndicators.inflation / 100
          : 1;

        // Calculate change based on real market forces instead of random volatility
        const marketForceChange = this.calculateMarketForceChange(item);

        const totalChange =
          (baseChange + marketForceChange) * economicMultiplier;
        const newPrice = Math.max(
          item.basePrice * 0.1, // Minimum 10% of base price
          item.currentPrice * (1 + totalChange)
        );

        if (Math.abs(newPrice - item.currentPrice) > item.currentPrice * 0.01) {
          item.currentPrice = newPrice;
          item.lastUpdate = new Date();
          updates.push(`${item.name}: $${newPrice.toFixed(2)}`);
        }

        // Adjust supply and demand based on real market activity
        this.adjustSupplyDemandFromActivity(item);
      });

      if (updates.length > 0) {
        await this.cacheMarketItems();
        this.emit('pricesUpdated', updates);
        logger.info(`Updated prices for ${updates.length} items`);
      }
    } catch (error) {
      logger.error('Failed to update market prices:', error);
    }
  }

  /**
   * Calculate market force changes based on real game events
   */
  private calculateMarketForceChange(item: MarketItem): number {
    // Check recent transactions and player activity to determine market forces
    const recentActivity = this.getRecentMarketActivity(item.id);

    // Base volatility factor
    let changeForce = 0;

    // Adjust based on recent sales volume
    if (recentActivity.salesVolume > item.averageVolume * 1.5) {
      changeForce += 0.05; // High demand pushes price up
    } else if (recentActivity.salesVolume < item.averageVolume * 0.5) {
      changeForce -= 0.03; // Low demand pushes price down
    }

    // Adjust based on world events
    if (recentActivity.worldEvents.includes('police_raid')) {
      changeForce += item.category === 'drugs' ? 0.1 : 0; // Police raids increase drug prices
    }

    if (recentActivity.worldEvents.includes('territory_conflict')) {
      changeForce += item.category === 'weapons' ? 0.08 : 0; // Conflicts increase weapon prices
    }

    // Apply item-specific volatility
    return changeForce * item.volatility;
  }

  /**
   * Adjust supply and demand based on real market activity
   */
  private adjustSupplyDemandFromActivity(item: MarketItem): void {
    const recentActivity = this.getRecentMarketActivity(item.id);

    // Adjust supply based on restocking events
    if (recentActivity.restockEvents > 0) {
      item.supply = Math.min(
        100,
        item.supply + recentActivity.restockEvents * 10
      );
    }

    // Adjust demand based on player purchases
    if (recentActivity.purchaseEvents > 0) {
      item.supply = Math.max(0, item.supply - recentActivity.purchaseEvents);
      item.demand = Math.min(
        100,
        item.demand + recentActivity.purchaseEvents * 2
      );
    }

    // Natural decay of demand over time
    const timeSinceLastPurchase = Date.now() - recentActivity.lastPurchaseTime;
    if (timeSinceLastPurchase > 3600000) {
      // 1 hour
      item.demand = Math.max(10, item.demand - 1);
    }
  }

  /**
   * Get recent market activity for an item
   */
  private getRecentMarketActivity(_itemId: string): {
    salesVolume: number;
    averagePrice: number;
    purchaseEvents: number;
    restockEvents: number;
    lastPurchaseTime: number;
    worldEvents: string[];
  } {
    // This would typically query the database for recent transactions
    // For now, return default values that represent normal market activity
    return {
      salesVolume: 5, // Normal sales volume
      averagePrice: 0,
      purchaseEvents: 2,
      restockEvents: 1,
      lastPurchaseTime: Date.now() - 1800000, // 30 minutes ago
      worldEvents: [], // Would be populated from world service events
    };
  }

  /**
   * Execute a purchase transaction
   */
  public async purchaseItem(
    characterId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const item = this.marketItems.get(itemId);
      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      const totalCost = item.currentPrice * quantity;

      // Get character data to check balance
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        return { success: false, error: 'Character not found' };
      }

      if (character.money < totalCost) {
        return { success: false, error: 'Insufficient funds' };
      }

      // Update character's money
      await this.prisma.character.update({
        where: { id: characterId },
        data: { money: character.money - totalCost },
      });

      // Create transaction record
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'purchase',
        characterId,
        itemId,
        amount: totalCost,
        description: `Purchased ${quantity}x ${item.name}`,
        timestamp: new Date(),
        metadata: { quantity, unitPrice: item.currentPrice },
      };

      this.recentTransactions.push(transaction);

      // Update market supply (decrease with purchase)
      item.supply = Math.max(0, item.supply - quantity * 2);
      item.demand = Math.min(100, item.demand + quantity * 1);

      await this.cacheMarketItems();
      this.emit('transactionCompleted', transaction);

      logger.info(
        `Purchase completed: ${character.name} bought ${quantity}x ${item.name} for $${totalCost}`
      );

      return { success: true, transaction };
    } catch (error) {
      logger.error('Purchase failed:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  /**
   * Execute a sale transaction
   */
  public async sellItem(
    characterId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const item = this.marketItems.get(itemId);
      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      // Apply a small discount for selling (market spread)
      const sellPrice = item.currentPrice * 0.9; // 10% discount
      const totalRevenue = sellPrice * quantity;

      // Get character data
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        return { success: false, error: 'Character not found' };
      }

      // Update character's money
      await this.prisma.character.update({
        where: { id: characterId },
        data: { money: character.money + totalRevenue },
      });

      // Create transaction record
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'sale',
        characterId,
        itemId,
        amount: totalRevenue,
        description: `Sold ${quantity}x ${item.name}`,
        timestamp: new Date(),
        metadata: { quantity, unitPrice: sellPrice },
      };

      this.recentTransactions.push(transaction);

      // Update market supply (increase with sale)
      item.supply = Math.min(100, item.supply + quantity * 2);
      item.demand = Math.max(0, item.demand - quantity * 1);

      await this.cacheMarketItems();
      this.emit('transactionCompleted', transaction);

      logger.info(
        `Sale completed: ${character.name} sold ${quantity}x ${item.name} for $${totalRevenue}`
      );

      return { success: true, transaction };
    } catch (error) {
      logger.error('Sale failed:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  /**
   * Get market item by ID
   */
  public getMarketItem(itemId: string): MarketItem | undefined {
    return this.marketItems.get(itemId);
  }

  /**
   * Get all market items
   */
  public getAllMarketItems(): MarketItem[] {
    return Array.from(this.marketItems.values());
  }

  /**
   * Get market items by category
   */
  public getMarketItemsByCategory(
    category: MarketItem['category']
  ): MarketItem[] {
    return Array.from(this.marketItems.values()).filter(
      item => item.category === category
    );
  }

  /**
   * Get recent transactions
   */
  public getRecentTransactions(limit: number = 50): Transaction[] {
    return this.recentTransactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get character's transaction history
   */
  public getCharacterTransactions(
    characterId: string,
    limit: number = 20
  ): Transaction[] {
    return this.recentTransactions
      .filter(tx => tx.characterId === characterId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get economic indicators
   */
  public getEconomicIndicators(): EconomicIndicators | null {
    return this.economicIndicators;
  }

  /**
   * Update economic indicators
   */
  public async updateEconomicIndicators(
    updates: Partial<EconomicIndicators>
  ): Promise<void> {
    if (!this.economicIndicators) return;

    this.economicIndicators = {
      ...this.economicIndicators,
      ...updates,
      lastUpdate: new Date(),
    };

    await this.cacheEconomicIndicators();
    this.emit('economicIndicatorsUpdated', this.economicIndicators);

    logger.info('Economic indicators updated');
  }

  /**
   * Get economy statistics
   */
  public getEconomyStats(): {
    market: {
      totalItems: number;
      averagePrice: number;
      totalVolume: number;
    };
    transactions: {
      total: number;
      volume24h: number;
      averageAmount: number;
    };
    indicators: EconomicIndicators | null;
  } {
    const marketItems = Array.from(this.marketItems.values());
    const averagePrice =
      marketItems.reduce((sum, item) => sum + item.currentPrice, 0) /
      marketItems.length;

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hTransactions = this.recentTransactions.filter(
      tx => tx.timestamp > last24h
    );
    const volume24h = recent24hTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const averageAmount =
      this.recentTransactions.length > 0
        ? this.recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) /
          this.recentTransactions.length
        : 0;

    return {
      market: {
        totalItems: marketItems.length,
        averagePrice,
        totalVolume: marketItems.reduce(
          (sum, item) => sum + item.supply * item.currentPrice,
          0
        ),
      },
      transactions: {
        total: this.recentTransactions.length,
        volume24h,
        averageAmount,
      },
      indicators: this.economicIndicators,
    };
  }

  /**
   * Cache market items
   */
  private async cacheMarketItems(): Promise<void> {
    try {
      const items = Array.from(this.marketItems.values());
      const success = await cache.manager.setTemporary(
        'economy:market_items',
        items,
        3600
      ); // 1 hour
      if (!success) {
        logger.warn(
          'Failed to cache market items to Redis, using memory fallback'
        );
      }
    } catch (error) {
      logger.warn('Failed to cache market items:', error);
    }
  }

  /**
   * Cache economic indicators
   */
  private async cacheEconomicIndicators(): Promise<void> {
    if (this.economicIndicators) {
      await cache.manager.setTemporary(
        'economy:indicators',
        this.economicIndicators,
        3600
      );
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    this.removeAllListeners();
    logger.info('Economy service cleaned up');
  }
}

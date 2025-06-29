/**
 * World Service - Manages game world state and environment
 * Handles territory control, world events, and environmental dynamics
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/infrastructure/logging';
import { cache } from '@/infrastructure/cache';
import { EventEmitter } from 'events';

export interface Territory {
  id: string;
  name: string;
  boundaries: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    z?: number;
  };
  controllingFaction?: string;
  contested: boolean;
  value: number;
  lastUpdate: Date;
}

export interface WorldEvent {
  id: string;
  type:
    | 'faction_war'
    | 'territory_conflict'
    | 'economic_shift'
    | 'weather_change'
    | 'police_raid';
  location: {
    x: number;
    y: number;
    z: number;
    radius: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // minutes
  affectedFactions: string[];
  description: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface EconomicState {
  drugPrices: Record<string, number>;
  weaponAvailability: Record<string, number>;
  lawEnforcementActivity: number; // 0-100
  touristActivity: number; // 0-100
  businessActivity: number; // 0-100
  lastUpdate: Date;
}

export class WorldService extends EventEmitter {
  private territories: Map<string, Territory> = new Map();
  private activeEvents: Map<string, WorldEvent> = new Map();
  private economicState: EconomicState | null = null;

  constructor(private prisma: PrismaClient) {
    super();
    this.initializeWorld();
  }

  /**
   * Initialize world state from cache or database
   */
  private async initializeWorld(): Promise<void> {
    try {
      logger.info('Initializing world state...');

      // Load territories from cache or initialize defaults
      await this.loadTerritories();

      // Load economic state
      await this.loadEconomicState();

      // Start world event processing
      this.startEventProcessing();

      logger.info(
        `World initialized with ${this.territories.size} territories`
      );
    } catch (error) {
      logger.error('Failed to initialize world state:', error);
      throw error;
    }
  }

  /**
   * Load territories from cache or initialize defaults
   */
  private async loadTerritories(): Promise<void> {
    try {
      // Try to load from cache first
      let cachedTerritories = null;
      try {
        cachedTerritories = await cache.manager.getTemporary('territories');
      } catch (cacheError) {
        logger.warn(
          'Failed to load territories from cache, using defaults:',
          cacheError
        );
      }

      if (cachedTerritories) {
        try {
          // If cached data is already an object, use it directly, otherwise parse JSON
          const territories = Array.isArray(cachedTerritories)
            ? cachedTerritories
            : ((typeof cachedTerritories === 'string'
                ? JSON.parse(cachedTerritories)
                : cachedTerritories) as Territory[]);
          territories.forEach(territory => {
            this.territories.set(territory.id, territory);
          });
          logger.info(`Loaded ${territories.length} territories from cache`);
          return;
        } catch (parseError) {
          logger.warn(
            'Failed to parse cached territories, using defaults:',
            parseError
          );
        }
      }

      // Initialize default territories for Los Santos
      const defaultTerritories: Territory[] = [
        {
          id: 'grove_street',
          name: 'Grove Street',
          boundaries: { x1: -2493, y1: -617, x2: -2393, y2: -517 },
          contested: false,
          value: 85,
          lastUpdate: new Date(),
        },
        {
          id: 'ballas_territory',
          name: 'Ballas Territory',
          boundaries: { x1: -2616, y1: -122, x2: -2516, y2: -22 },
          contested: false,
          value: 75,
          lastUpdate: new Date(),
        },
        {
          id: 'downtown_ls',
          name: 'Downtown Los Santos',
          boundaries: { x1: -762, y1: -818, x2: -562, y2: -618 },
          contested: true,
          value: 95,
          lastUpdate: new Date(),
        },
        {
          id: 'vinewood',
          name: 'Vinewood',
          boundaries: { x1: -1289, y1: -1098, x2: -1089, y2: -898 },
          contested: false,
          value: 90,
          lastUpdate: new Date(),
        },
        {
          id: 'del_perro',
          name: 'Del Perro',
          boundaries: { x1: -1756, y1: -1026, x2: -1556, y2: -826 },
          contested: false,
          value: 70,
          lastUpdate: new Date(),
        },
      ];

      defaultTerritories.forEach(territory => {
        this.territories.set(territory.id, territory);
      });

      // Cache the territories
      await this.cacheWorldState();

      logger.info(
        `Initialized ${defaultTerritories.length} default territories`
      );
    } catch (error) {
      logger.error('Failed to load territories:', error);
      throw error;
    }
  }

  /**
   * Load economic state from cache or initialize defaults
   */
  private async loadEconomicState(): Promise<void> {
    try {
      let cachedEconomic = null;
      try {
        cachedEconomic = await cache.manager.getTemporary('economic');
      } catch (cacheError) {
        logger.warn(
          'Failed to load economic state from cache, using defaults:',
          cacheError
        );
      }

      if (cachedEconomic) {
        try {
          // If cached data is already an object, use it directly, otherwise parse JSON
          this.economicState =
            typeof cachedEconomic === 'object'
              ? cachedEconomic
              : JSON.parse(cachedEconomic);
          logger.info('Loaded economic state from cache');
          return;
        } catch (parseError) {
          logger.warn(
            'Failed to parse cached economic state, using defaults:',
            parseError
          );
        }
      }

      // Initialize default economic state
      this.economicState = {
        drugPrices: {
          weed: 50,
          cocaine: 200,
          meth: 150,
          heroin: 300,
        },
        weaponAvailability: {
          pistol: 80,
          smg: 60,
          rifle: 40,
          shotgun: 70,
        },
        lawEnforcementActivity: 50,
        touristActivity: 60,
        businessActivity: 70,
        lastUpdate: new Date(),
      };

      // Try to cache the default state, but don't fail if cache is unavailable
      try {
        await this.cacheEconomicState();
      } catch (cacheError) {
        logger.warn('Failed to cache economic state:', cacheError);
      }

      logger.info('Initialized default economic state');
    } catch (error) {
      logger.error('Failed to load economic state:', error);
      throw error;
    }
  }

  /**
   * Start processing world events
   */
  private startEventProcessing(): void {
    // Process events every 30 seconds
    setInterval(() => {
      this.processActiveEvents();
    }, 30000);

    // Set up event listeners for real game events instead of generating random ones
    this.setupGameEventListeners();
  }

  /**
   * Set up event listeners for real game events from RAGE:MP manager
   */
  private setupGameEventListeners(): void {
    // Listen for faction events from other systems
    this.on(
      'factionConflict',
      (
        factionA: string,
        factionB: string,
        location: { x: number; y: number; z: number }
      ) => {
        this.createTerritoryConflictEvent(factionA, factionB, location);
      }
    );

    this.on(
      'playerActivity',
      (
        playerId: string,
        activity: string,
        location: { x: number; y: number; z: number }
      ) => {
        this.handlePlayerActivity(playerId, activity, location);
      }
    );

    this.on('economicChange', (changeType: string, magnitude: number) => {
      this.createEconomicEvent(changeType, magnitude);
    });

    logger.info('✅ World service game event listeners set up');
  }

  /**
   * Process active world events
   */
  private processActiveEvents(): void {
    const now = new Date();
    const expiredEvents: string[] = [];

    this.activeEvents.forEach((event, id) => {
      if (now > event.expiresAt) {
        expiredEvents.push(id);
        this.emit('eventExpired', event);
      }
    });

    // Remove expired events
    expiredEvents.forEach(id => this.activeEvents.delete(id));

    if (expiredEvents.length > 0) {
      logger.info(`Processed ${expiredEvents.length} expired world events`);
    }
  }
  /**
   * Create territory conflict event from faction activity
   */
  private createTerritoryConflictEvent(
    factionA: string,
    factionB: string,
    location: { x: number; y: number; z: number }
  ): void {
    const event: WorldEvent = {
      id: `territory_conflict_${Date.now()}`,
      type: 'territory_conflict',
      location: {
        x: location.x,
        y: location.y,
        z: location.z,
        radius: 200,
      },
      severity: 'high',
      duration: 30, // 30 minutes
      affectedFactions: [factionA, factionB],
      description: `Territory conflict between ${factionA} and ${factionB}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60000),
    };

    this.activeEvents.set(event.id, event);
    this.emit('eventCreated', event);

    logger.info(`Created territory conflict event: ${event.description}`);
  }

  /**
   * Handle player activity events
   */
  private handlePlayerActivity(
    playerId: string,
    activity: string,
    location: { x: number; y: number; z: number }
  ): void {
    // Create events based on player activities
    if (activity === 'police_chase') {
      this.createPoliceRaidEvent(location);
    } else if (activity === 'drug_deal') {
      this.createEconomicEvent('drug_market', 1);
    } else if (activity === 'weapon_purchase') {
      this.createEconomicEvent('weapon_market', 1);
    }

    logger.debug(`Handled player activity: ${activity} for player ${playerId}`);
  }

  /**
   * Create economic event
   */
  private createEconomicEvent(changeType: string, magnitude: number): void {
    const event: WorldEvent = {
      id: `economic_${changeType}_${Date.now()}`,
      type: 'economic_shift',
      location: {
        x: 0,
        y: 0,
        z: 0,
        radius: 5000, // City-wide effect
      },
      severity: magnitude > 2 ? 'high' : magnitude > 1 ? 'medium' : 'low',
      duration: 60, // 1 hour
      affectedFactions: [],
      description: `Economic shift in ${changeType} market`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60000),
    };

    this.activeEvents.set(event.id, event);
    this.emit('eventCreated', event);

    logger.info(`Created economic event: ${event.description}`);
  }

  /**
   * Create police raid event
   */
  private createPoliceRaidEvent(location: {
    x: number;
    y: number;
    z: number;
  }): void {
    const event: WorldEvent = {
      id: `police_raid_${Date.now()}`,
      type: 'police_raid',
      location: {
        x: location.x,
        y: location.y,
        z: location.z,
        radius: 300,
      },
      severity: 'high',
      duration: 20, // 20 minutes
      affectedFactions: [],
      description: 'Police raid in progress',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 60000),
    };

    this.activeEvents.set(event.id, event);
    this.emit('eventCreated', event);

    logger.info(
      `Created police raid event at location: ${location.x}, ${location.y}`
    );
  }
  // TODO: Uncomment when event descriptions are needed
  // /**
  //  * Generate event description based on type and severity
  //  */
  // private generateEventDescription(
  //   type: WorldEvent['type'],
  //   severity: string
  // ): string {
  //   const descriptions: Record<WorldEvent['type'], Record<string, string>> = {
  //     faction_war: {
  //       low: 'Minor faction skirmish reported',
  //       medium: 'Faction conflict escalating in the area',
  //       high: 'Major faction war breaking out',
  //     },
  //     territory_conflict: {
  //       low: 'Minor skirmish reported in the area',
  //       medium: 'Territorial dispute escalating between factions',
  //       high: 'Major confrontation over territory control',
  //     },
  //     economic_shift: {
  //       low: 'Small fluctuation in local market prices',
  //       medium: 'Significant changes in supply and demand',
  //       high: 'Major economic disruption affecting all businesses',
  //     },
  //     weather_change: {
  //       low: 'Minor weather disturbance reported',
  //       medium: 'Significant weather changes affecting the area',
  //       high: 'Severe weather conditions impacting operations',
  //     },
  //     police_raid: {
  //       low: 'Increased police patrols in the vicinity',
  //       medium: 'Police conducting investigations in the area',
  //       high: 'Major law enforcement operation underway',
  //     },
  //   };

  //   return descriptions[type]?.[severity] || 'Unknown event occurring';
  // }

  /**
   * Get territory by ID
   */
  public getTerritory(territoryId: string): Territory | undefined {
    return this.territories.get(territoryId);
  }

  /**
   * Get all territories
   */
  public getAllTerritories(): Territory[] {
    return Array.from(this.territories.values());
  }
  /**
   * Update territory control
   */
  public async updateTerritoryControl(
    territoryId: string,
    factionId: string | null
  ): Promise<void> {
    const territory = this.territories.get(territoryId);
    if (!territory) {
      throw new Error(`Territory ${territoryId} not found`);
    }

    const previousFaction = territory.controllingFaction;
    if (factionId) {
      territory.controllingFaction = factionId;
    } else {
      delete territory.controllingFaction;
    }
    territory.lastUpdate = new Date();

    await this.cacheWorldState();

    this.emit('territoryControlChanged', {
      territoryId,
      previousFaction,
      newFaction: factionId,
      territory,
    });

    logger.info(
      `Territory ${territoryId} control changed from ${previousFaction || 'none'} to ${factionId || 'none'}`
    );
  }

  /**
   * Get active world events
   */
  public getActiveEvents(): WorldEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Get events affecting a specific location
   */
  public getEventsAtLocation(
    x: number,
    y: number,
    z: number = 0
  ): WorldEvent[] {
    return this.getActiveEvents().filter(event => {
      const distance = Math.sqrt(
        Math.pow(event.location.x - x, 2) +
          Math.pow(event.location.y - y, 2) +
          Math.pow(event.location.z - z, 2)
      );
      return distance <= event.location.radius;
    });
  }

  /**
   * Get current economic state
   */
  public getEconomicState(): EconomicState | null {
    return this.economicState;
  }

  /**
   * Update economic state
   */
  public async updateEconomicState(
    updates: Partial<EconomicState>
  ): Promise<void> {
    if (!this.economicState) return;

    this.economicState = {
      ...this.economicState,
      ...updates,
      lastUpdate: new Date(),
    };

    await this.cacheEconomicState();
    this.emit('economicStateChanged', this.economicState);

    logger.info('Economic state updated');
  }

  /**
   * Get world statistics
   */
  public getWorldStats(): {
    territories: {
      total: number;
      controlled: number;
      contested: number;
    };
    events: {
      active: number;
      byType: Record<string, number>;
    };
    economic: EconomicState | null;
  } {
    const controlled = Array.from(this.territories.values()).filter(
      t => t.controllingFaction
    ).length;
    const contested = Array.from(this.territories.values()).filter(
      t => t.contested
    ).length;

    const eventsByType: Record<string, number> = {};
    this.activeEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      territories: {
        total: this.territories.size,
        controlled,
        contested,
      },
      events: {
        active: this.activeEvents.size,
        byType: eventsByType,
      },
      economic: this.economicState,
    };
  }

  /**
   * Cache world state
   */
  private async cacheWorldState(): Promise<void> {
    try {
      const territories = Array.from(this.territories.values());
      const success = await cache.manager.setTemporary(
        'territories',
        territories,
        300
      ); // 5 minutes TTL
      if (!success) {
        logger.warn(
          'Failed to cache world state to Redis, using memory fallback'
        );
      }
    } catch (error) {
      logger.warn('Failed to cache world state:', error);
    }
  }

  /**
   * Cache economic state
   */
  private async cacheEconomicState(): Promise<void> {
    try {
      if (this.economicState) {
        const success = await cache.manager.setTemporary(
          'economic',
          this.economicState,
          300
        ); // 5 minutes TTL
        if (!success) {
          logger.warn(
            'Failed to cache economic state to Redis, using memory fallback'
          );
        }
      }
    } catch (error) {
      logger.warn('Failed to cache economic state:', error);
    }
  }

  /**
   * Check if position is in contested territory
   */
  public isInContestedTerritory(x: number, y: number): boolean {
    return Array.from(this.territories.values()).some(territory => {
      if (!territory.contested) return false;

      return (
        x >= territory.boundaries.x1 &&
        x <= territory.boundaries.x2 &&
        y >= territory.boundaries.y1 &&
        y <= territory.boundaries.y2
      );
    });
  }

  /**
   * Get territory at position
   */
  public getTerritoryAtPosition(x: number, y: number): Territory | null {
    return (
      Array.from(this.territories.values()).find(territory => {
        return (
          x >= territory.boundaries.x1 &&
          x <= territory.boundaries.x2 &&
          y >= territory.boundaries.y1 &&
          y <= territory.boundaries.y2
        );
      }) || null
    );
  }

  /**
   * Get current world state for AI mission generation
   */
  public async getCurrentWorldState(): Promise<{
    currentTime: string;
    weather: string;
    activePlayers: number;
    factionWars: boolean;
    economicState: 'poor' | 'average' | 'wealthy';
    crimeLevel: 'low' | 'medium' | 'high';
  }> {
    const now = new Date();
    const activeEvents = Array.from(this.activeEvents.values());

    return {
      currentTime: now.toISOString(),
      weather: this.getWeatherState(),
      activePlayers: await this.getActivePlayersCount(),
      factionWars: activeEvents.some(event => event.type === 'faction_war'),
      economicState: this.getEconomicLevel(),
      crimeLevel: this.getCrimeLevel(),
    };
  }

  /**
   * Get active world events with filter support
   */
  public async getActiveWorldEvents(filter?: {
    type?: string;
    severity?: string;
  }): Promise<WorldEvent[]> {
    const events = Array.from(this.activeEvents.values());

    if (!filter) {
      return events;
    }

    return events.filter(event => {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.severity && event.severity !== filter.severity) return false;
      return true;
    });
  }

  /**
   * Get location name from coordinates
   */
  public getLocationNameFromCoordinates(
    x: number,
    y: number,
    _z: number
  ): string {
    // Los Santos location mapping based on coordinates
    // This is a simplified mapping - you'd want to expand this
    const locations = [
      {
        name: 'Los Santos International Airport',
        x: -1000,
        y: -3000,
        radius: 500,
      },
      { name: 'Downtown Los Santos', x: 200, y: -900, radius: 800 },
      { name: 'Vinewood Hills', x: 300, y: 1200, radius: 600 },
      { name: 'Grove Street', x: -100, y: -1600, radius: 300 },
      { name: 'Santa Monica Beach', x: -1500, y: -1000, radius: 400 },
      { name: 'Industrial District', x: 1000, y: -2000, radius: 700 },
    ];

    for (const location of locations) {
      const distance = Math.sqrt(
        Math.pow(x - location.x, 2) + Math.pow(y - location.y, 2)
      );
      if (distance <= location.radius) {
        return location.name;
      }
    }

    return 'Unknown Location';
  }

  /**
   * Helper methods for world state
   */
  private getWeatherState(): string {
    // Use game time and seasonal patterns instead of random weather
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const hour = now.getHours(); // 0-23

    // Seasonal weather patterns
    if (month >= 5 && month <= 8) {
      // Summer months
      if (hour >= 6 && hour <= 18) return 'sunny';
      return 'clear';
    } else if (month >= 11 || month <= 2) {
      // Winter months
      if (hour >= 5 && hour <= 7) return 'foggy';
      if (hour >= 18 || hour <= 6) return 'cloudy';
      return 'clear';
    } else {
      // Spring/Fall
      if (hour >= 14 && hour <= 17) return 'cloudy';
      if (hour >= 18 || hour <= 6) return 'clear';
      return 'sunny';
    }
  }

  private async getActivePlayersCount(): Promise<number> {
    try {
      const count = await this.prisma.character.count({
        where: { isOnline: true },
      });
      return count;
    } catch (error) {
      logger.warn('Failed to get active players count', { error });
      return 0;
    }
  }

  private getEconomicLevel(): 'poor' | 'average' | 'wealthy' {
    if (!this.economicState) return 'average';
    const businessLevel = this.economicState.businessActivity;
    if (businessLevel > 70) return 'wealthy';
    if (businessLevel < 30) return 'poor';
    return 'average';
  }

  private getCrimeLevel(): 'low' | 'medium' | 'high' {
    if (!this.economicState) return 'medium';
    const lawLevel = this.economicState.lawEnforcementActivity;
    if (lawLevel > 70) return 'low';
    if (lawLevel < 30) return 'high';
    return 'medium';
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.removeAllListeners();
    logger.info('World service cleaned up');
  }
}

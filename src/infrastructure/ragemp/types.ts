/**
 * Enhanced RAGE:MP Type Definitions for GangGPT
 * Provides type safety and additional properties for RAGE:MP entities
 * Note: RAGE:MP APIs are inherently dynamic and require any types
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Import RAGE:MP declarations
import './ragemp.d.ts';

// Basic RAGE:MP Player extension
export interface GangGPTPlayer extends Mp.Player {
  user?: {
    id: string;
    username: string;
    email: string;
    faction?: {
      id: string;
      name: string;
      role: string;
    };
    stats: {
      level: number;
      experience: number;
      money: number;
      respect: number;
    };
    lastSeen: Date;
  };

  // AI Companion data
  companion?: {
    personality: string;
    relationship: number;
    lastInteraction: Date;
    memory: Array<{
      event: string;
      timestamp: Date;
      importance: number;
    }>;
  };

  // Session data
  session: {
    loginTime: Date;
    lastActivity: Date;
    isAFK: boolean;
    location?: {
      x: number;
      y: number;
      z: number;
      dimension: number;
    };
  };
}

// Vehicle with metadata
export interface GangGPTVehicle extends Mp.Vehicle {
  owner?: string;
  faction?: string;
  locked: boolean;
  fuel: number;
  mileage: number;
  lastUsed: Date;
  customizations?: Record<string, any>;
}

// Enhanced faction data structure
export interface Faction {
  id: string;
  name: string;
  description: string;
  type: 'GANG' | 'LAW_ENFORCEMENT' | 'BUSINESS' | 'GOVERNMENT';
  territory: {
    name: string;
    bounds: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    influence: number;
  };
  members: Array<{
    playerId: string;
    role: string;
    joinDate: Date;
    contribution: number;
  }>;
  resources: {
    money: number;
    weapons: number;
    vehicles: number;
    properties: number;
  };
  relationships: Record<
    string,
    {
      factionId: string;
      status: 'ALLIED' | 'NEUTRAL' | 'HOSTILE';
      reputation: number;
    }
  >;
  aiPersonality: {
    aggression: number;
    cooperation: number;
    expansion: number;
    loyalty: number;
  };
}

// Mission system types
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'DELIVERY' | 'COMBAT' | 'HEIST' | 'TERRITORY' | 'BUSINESS';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

  participants: {
    playerId: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  }[];

  objectives: Array<{
    id: string;
    description: string;
    completed: boolean;
    location?: {
      x: number;
      y: number;
      z: number;
    };
  }>;

  rewards: {
    money: number;
    experience: number;
    items?: string[];
  };

  timeLimit?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// AI NPC types
export interface AINPC {
  id: string;
  name: string;
  model: string;
  personality: {
    aggression: number;
    friendliness: number;
    intelligence: number;
    loyalty: number;
  };

  role: 'GUARD' | 'VENDOR' | 'INFORMANT' | 'GANG_MEMBER' | 'CIVILIAN';
  faction?: string;

  position: {
    x: number;
    y: number;
    z: number;
    heading: number;
    dimension: number;
  };

  behavior: {
    patrol?: Array<{
      x: number;
      y: number;
      z: number;
    }>;
    dialogue?: Array<{
      trigger: string;
      response: string;
    }>;
    schedule?: Array<{
      time: string;
      action: string;
      location?: {
        x: number;
        y: number;
        z: number;
      };
    }>;
  };

  memory: Array<{
    playerId: string;
    interaction: string;
    timestamp: Date;
    sentiment: number;
  }>;
}

// World state management
export interface WorldState {
  time: {
    hour: number;
    minute: number;
    day: number;
    month: number;
    year: number;
  };

  weather: {
    type: string;
    intensity: number;
    duration: number;
  };

  economy: {
    inflation: number;
    marketTrends: Record<string, number>;
    unemployment: number;
  };

  territories: Record<
    string,
    {
      controller: string;
      influence: number;
      lastConflict?: Date;
    }
  >;

  events: Array<{
    id: string;
    type: string;
    description: string;
    impact: Record<string, number>;
    active: boolean;
    startTime: Date;
    endTime?: Date;
  }>;
}

// Event system types
export interface GameEvent {
  id: string;
  type:
    | 'PLAYER_JOIN'
    | 'PLAYER_LEAVE'
    | 'FACTION_WAR'
    | 'MISSION_START'
    | 'MISSION_COMPLETE'
    | 'TERRITORY_CAPTURED';
  data: Record<string, any>;
  timestamp: Date;
  participants: string[];
}

// Server configuration
export interface ServerConfig {
  maxPlayers: number;
  gamemode: string;
  map: string;

  ai: {
    enabled: boolean;
    maxNPCs: number;
    updateInterval: number;
    memoryRetention: number;
  };

  economy: {
    startingMoney: number;
    salaryInterval: number;
    inflationRate: number;
  };

  factions: {
    maxMembers: number;
    territoryConflictCooldown: number;
    influenceDecayRate: number;
  };

  missions: {
    maxActiveMissions: number;
    generationInterval: number;
    difficultyScaling: boolean;
  };
}

// Type guards for runtime type checking
export function isGangGPTPlayer(player: Mp.Player): player is GangGPTPlayer {
  return 'session' in player;
}

export function isGangGPTVehicle(
  vehicle: Mp.Vehicle
): vehicle is GangGPTVehicle {
  return 'fuel' in vehicle;
}

// Event payload types for type-safe event handling
export type EventPayloads = {
  'player:join': { player: GangGPTPlayer };
  'player:leave': { player: GangGPTPlayer; reason: string };
  'faction:created': { faction: Faction; creator: GangGPTPlayer };
  'mission:started': { mission: Mission; participants: GangGPTPlayer[] };
  'mission:completed': { mission: Mission; success: boolean };
  'territory:captured': {
    territory: string;
    oldController: string;
    newController: string;
  };
  'ai:interaction': { npc: AINPC; player: GangGPTPlayer; message: string };
};

export type EventNames = keyof EventPayloads;

// Utility type for event handlers
export type EventHandler<T extends EventNames> = (
  payload: EventPayloads[T]
) => void | Promise<void>;

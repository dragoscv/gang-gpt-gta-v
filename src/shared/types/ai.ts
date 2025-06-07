/**
 * AI Service Configuration
 */
export interface AIServiceConfig {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
  model: string;
  maxTokens: number;
}

/**
 * Mission types enum matching Prisma schema
 */
export type MissionType =
  | 'DELIVERY'
  | 'ELIMINATION'
  | 'PROTECTION'
  | 'INFILTRATION'
  | 'HEIST'
  | 'RACING'
  | 'COLLECTION'
  | 'EXPLORATION'
  | 'SOCIAL';

/**
 * AI Response from OpenAI service
 */
export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  timestamp: Date;
  error?: boolean;
}

/**
 * Context information for AI prompt generation
 */
export interface AIPromptContext {
  characterName?: string;
  characterBackground?: string;
  location?: string | undefined;
  factionName?: string | undefined;
  factionId?: string | undefined;
  relationshipLevel?: string;
  recentEvents?: string[];
  npcRole?: string;
  mood?: string;
  playerLevel?: number;
  gameState?: GameState | undefined;
}

/**
 * Game state information
 */
export interface GameState {
  currentTime: string;
  weather: string;
  activePlayers: number;
  factionWars: boolean;
  economicState: 'poor' | 'average' | 'wealthy';
  crimeLevel: 'low' | 'medium' | 'high';
}

/**
 * AI Companion memory entry
 */
export interface AIMemoryEntry {
  id: string;
  companionId: string;
  playerId: string;
  content: string;
  type: 'conversation' | 'event' | 'relationship' | 'mission';
  importance: number; // 1-10 scale
  emotionalContext: string;
  timestamp: Date;
  isDecayed: boolean;
}

/**
 * NPC AI behavior configuration
 */
export interface NPCBehaviorConfig {
  npcId: string;
  personality: NPCPersonality;
  loyalty: number; // -100 to 100
  aggression: number; // 0 to 100
  intelligence: number; // 0 to 100
  conversationStyle: 'formal' | 'casual' | 'street' | 'professional';
  specialties: string[];
  fears: string[];
  goals: string[];
}

/**
 * NPC personality traits
 */
export interface NPCPersonality {
  openness: number; // 0 to 100
  conscientiousness: number; // 0 to 100
  extraversion: number; // 0 to 100
  agreeableness: number; // 0 to 100
  neuroticism: number; // 0 to 100
}

/**
 * Mission generation parameters
 */
export interface MissionGenerationParams {
  difficulty: number; // 1-10
  playerLevel: number;
  factionId?: string;
  missionType:
    | 'heist'
    | 'delivery'
    | 'elimination'
    | 'territory'
    | 'investigation'
    | 'social';
  timeConstraint?: number; // minutes
  playerCount: number;
  availableAssets: string[];
  restrictions: string[];
}

/**
 * Generated mission structure - Enhanced for mission service
 */
export interface GeneratedMission {
  id?: string;
  title: string;
  description: string;
  objectives: string[] | MissionObjective[];
  rewards: string[] | MissionRewards;
  difficulty: number;
  estimatedDuration: number;
  location: string;
  requirements?: string[] | MissionRequirements;
  missionType?: MissionType;
  narrative?: string;
  worldStateImpact?: string[];
  // Chain properties
  previousMissionId?: string;
  chainPosition?: number;
  chainId?: string;
  estimatedTime?: number; // minutes - for backward compatibility
  lore?: string; // for backward compatibility
}

/**
 * Mission objective
 */
export interface MissionObjective {
  id: string;
  description: string;
  type: 'location' | 'elimination' | 'collection' | 'interaction' | 'time';
  isOptional: boolean;
  coordinates?: { x: number; y: number; z: number };
  targetId?: string;
  quantity?: number;
  timeLimit?: number; // seconds
}

/**
 * Mission rewards
 */
export interface MissionRewards {
  money: number;
  experience: number;
  reputation: number;
  items: string[];
  unlocks: string[];
}

/**
 * Mission requirements
 */
export interface MissionRequirements {
  minLevel: number;
  requiredFaction?: string;
  requiredItems: string[];
  requiredSkills: string[];
  maxPlayers: number;
  minPlayers: number;
}

/**
 * AI Analytics event
 */
export interface AIAnalyticsEvent {
  id: string;
  eventType:
    | 'companion_interaction'
    | 'npc_dialogue'
    | 'mission_generated'
    | 'error_occurred';
  playerId: string;
  aiEntityId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTime: number; // milliseconds
  success: boolean;
  errorType?: string;
  timestamp: Date;
  metadata: Record<string, string | number | boolean | null | undefined>;
}

/**
 * AI Memory Context for enhanced NPC interactions
 */
export interface AIMemoryContext {
  recentMemories: MemoryEntry[];
  relationships: RelationshipMemory[];
  emotionalState: EmotionalState;
  personalityTraits: PersonalityTraits;
}

/**
 * Memory entry for NPC memory system
 */
export interface MemoryEntry {
  id: string;
  content: string;
  emotionalContext: string;
  importance: number;
  timestamp: Date;
  decay: number;
  associatedPlayers: string[];
}

/**
 * Relationship memory between NPCs and players
 */
export interface RelationshipMemory {
  playerId: string;
  playerName: string;
  trust: number;
  respect: number;
  fear: number;
  loyalty: number;
  lastInteraction: Date;
  significantEvents: string[];
}

/**
 * Emotional state for AI characters
 */
export interface EmotionalState {
  happiness: number;
  anger: number;
  fear: number;
  excitement: number;
  stress: number;
  confidence: number;
}

/**
 * Personality traits for consistent AI behavior
 */
export interface PersonalityTraits {
  aggressiveness: number;
  loyalty: number;
  intelligence: number;
  greed: number;
  humor: number;
  trustworthiness: number;
}

/**
 * Content filtering result
 */
export interface ContentFilterResult {
  isAppropriate: boolean;
  flaggedCategories: string[];
  confidence: number;
  suggestedAlternative?: string;
}

/**
 * Mission generation context
 */
export interface MissionGenerationContext {
  playerLevel: number;
  difficulty: number;
  factionContext: AIPromptContext;
  availableLocations: string[];
  recentMissions: string[];
  playerPreferences: PlayerPreferences;
  // Adding missing properties that are used in mission.service.ts
  playerMemories?: string[];
  worldEvents?: string[];
  suggestedMissionTypes?: string[];
  missionChainContext?: {
    isChain: boolean;
    chainPosition?: number;
    totalChainLength?: number;
    previousMissionOutcome?: string;
  };
}

/**
 * Player preferences for mission generation
 */
export interface PlayerPreferences {
  missionTypes: string[];
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'extreme';
  playstyle: 'stealth' | 'aggressive' | 'diplomatic' | 'mixed';
  teamPreference: 'solo' | 'small_group' | 'large_group';
}

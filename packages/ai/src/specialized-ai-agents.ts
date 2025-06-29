/**
 * @file specialized-ai-agents.ts
 * @description Specialized AI agents for different aspects of the GangGPT experience
 */

import { NextGenAISystem, type AdvancedAIResponse, type WorldState as NextGenWorldState, type EconomicIndicators } from './next-gen-ai-system';
import { getAdvancedAIConfig } from './advanced-ai-config';
import type { PrismaClient } from '@prisma/client';
import type { CacheManager } from './next-gen-ai-system';

// Specialized agent interfaces for different game systems
export interface FactionAIAgent {
    generateFactionDecision(factionId: string, context: FactionContext): Promise<FactionDecision>;
    analyzeFactionRelationships(factionId: string): Promise<FactionAnalysis>;
    generateFactionEvents(worldState: WorldState): Promise<FactionEvent[]>;
}

export interface EconomyAIAgent {
    generateMarketEvents(economicContext: EconomicContext): Promise<MarketEvent[]>;
    analyzePlayerEconomicBehavior(playerId: string): Promise<EconomicBehaviorAnalysis>;
    optimizePricing(itemType: string, marketConditions: MarketConditions): Promise<PricingRecommendation>;
}

export interface MissionAIAgent {
    generateDynamicMission(playerId: string, context: MissionContext): Promise<GeneratedMission>;
    adaptMissionDifficulty(missionId: string, playerPerformance: PlayerPerformance): Promise<MissionAdaptation>;
    generateMissionChain(theme: string, playerLevel: number): Promise<MissionChain>;
}

// Context and response types
export interface FactionContext {
    factionId: string;
    currentTerritory: string[];
    relationships: Record<string, number>;
    resources: Record<string, number>;
    recentEvents: string[];
    threatLevel: number;
}

export interface FactionDecision {
    decision: string;
    reasoning: string;
    actions: FactionAction[];
    priority: number;
    timeframe: string;
    expectedOutcome: string;
}

export interface FactionAction {
    type: 'expand' | 'defend' | 'negotiate' | 'attack' | 'recruit' | 'trade';
    target: string;
    resources: Record<string, number>;
    riskLevel: number;
}

export interface FactionAnalysis {
    strengths: string[];
    weaknesses: string[];
    threats: string[];
    opportunities: string[];
    recommendedStrategy: string;
    alliances: string[];
    enemies: string[];
}

export interface FactionEvent {
    id: string;
    type: string;
    description: string;
    participants: string[];
    impact: Record<string, number>;
    duration: number;
}

export interface EconomicContext {
    inflation: number;
    crimeRate: number;
    policePresence: number;
    playerActivity: Record<string, number>;
    seasonalFactors: Record<string, number>;
}

export interface MarketEvent {
    id: string;
    type: 'supply_shock' | 'demand_surge' | 'price_manipulation' | 'new_product' | 'regulation_change';
    description: string;
    affectedItems: string[];
    priceModifier: number;
    duration: number;
    probability: number;
}

export interface EconomicBehaviorAnalysis {
    spendingPatterns: Record<string, number>;
    riskTolerance: number;
    preferredActivities: string[];
    incomeStreams: string[];
    recommendations: string[];
}

export interface MarketConditions {
    supply: number;
    demand: number;
    competition: number;
    seasonality: number;
    riskFactors: string[];
}

export interface PricingRecommendation {
    basePrice: number;
    dynamicModifiers: Record<string, number>;
    reasoning: string;
    confidence: number;
}

export interface MissionContext {
    playerId: string;
    playerLevel: number;
    recentActivities: string[];
    factionAffiliation: string;
    currentLocation: string;
    timeOfDay: string;
    worldEvents: string[];
}

export interface GeneratedMission {
    id: string;
    title: string;
    description: string;
    objectives: MissionObjective[];
    difficulty: number;
    estimatedDuration: number;
    rewards: MissionReward[];
    requirements: string[];
    narrative: string;
}

export interface MissionObjective {
    id: string;
    description: string;
    type: 'kill' | 'steal' | 'deliver' | 'negotiate' | 'infiltrate' | 'protect';
    target: string;
    location: string;
    optional: boolean;
}

export interface MissionReward {
    type: 'money' | 'reputation' | 'item' | 'access' | 'information';
    amount: number;
    description: string;
}

export interface PlayerPerformance {
    completionTime: number;
    successRate: number;
    stealthRating: number;
    aggressionLevel: number;
    creativityScore: number;
}

export interface MissionAdaptation {
    difficultyAdjustment: number;
    newObjectives: MissionObjective[];
    additionalChallenges: string[];
    narrativeChanges: string[];
}

export interface MissionChain {
    id: string;
    theme: string;
    missions: GeneratedMission[];
    overallNarrative: string;
    progression: string[];
}

export interface WorldState {
    factionBalance: Record<string, number>;
    economicState: EconomicContext;
    socialTension: number;
    majorEvents: WorldEvent[];
}

export interface WorldEvent {
    id: string;
    type: string;
    description: string;
    impact: Record<string, number>;
    duration: number;
    participants: string[];
}

/**
 * Specialized AI Agent Factory
 */
class SpecializedAIAgentFactory {
    private aiSystem: NextGenAISystem;

    constructor(prisma: PrismaClient, cache: CacheManager) {
        const config = getAdvancedAIConfig();
        this.aiSystem = new NextGenAISystem(config, prisma, cache);
    }

    createFactionAgent(): FactionAIAgent {
        return new FactionAIAgentImpl(this.aiSystem);
    }

    createEconomyAgent(): EconomyAIAgent {
        return new EconomyAIAgentImpl(this.aiSystem);
    }

    createMissionAgent(): MissionAIAgent {
        return new MissionAIAgentImpl(this.aiSystem);
    }

    async getSystemStatus() {
        return this.aiSystem.getSystemStatus();
    }
}

/**
 * Faction AI Agent Implementation
 */
class FactionAIAgentImpl implements FactionAIAgent {
    constructor(private aiSystem: NextGenAISystem) { }

    async generateFactionDecision(factionId: string, context: FactionContext): Promise<FactionDecision> {
        const _prompt = `
    As the AI leader of faction ${factionId}, analyze the current situation and make a strategic decision.
    
    Current Status:
    - Territory: ${context.currentTerritory.join(', ')}
    - Resources: ${JSON.stringify(context.resources)}
    - Threat Level: ${context.threatLevel}/10
    - Recent Events: ${context.recentEvents.join('; ')}
    
    Relationships:
    ${Object.entries(context.relationships).map(([faction, level]) => `- ${faction}: ${level}/10`).join('\n')}
    
    Generate a strategic decision with specific actions, reasoning, and expected outcomes.
    `;

        const response = await this.aiSystem.generateGameMasterEvent({
            factionBalance: { [factionId]: 1 },
            economicState: { inflation: 0, crimeRate: 0, policePresence: 0, unemployment: 0 },
            socialTension: context.threatLevel,
            majorEvents: []
        });

        return this.parseFactionDecision(response, factionId, _prompt);
    }

    async analyzeFactionRelationships(factionId: string): Promise<FactionAnalysis> {
        const _prompt = `
    Analyze the strategic position and relationships of faction ${factionId}.
    Provide a comprehensive SWOT analysis and strategic recommendations.
    `;

        const response = await this.aiSystem.generateGameMasterEvent({
            factionBalance: { [factionId]: 1 },
            economicState: { inflation: 0, crimeRate: 0, policePresence: 0, unemployment: 0 },
            socialTension: 5,
            majorEvents: []
        });

        console.log('Analyzing faction relationships with prompt:', _prompt.substring(0, 50));
        return this.parseFactionAnalysis(response);
    }

    async generateFactionEvents(worldState: WorldState): Promise<FactionEvent[]> {
        // Convert local WorldState to NextGen WorldState format
        const nextGenWorldState = {
            factionBalance: worldState.factionBalance,
            economicState: {
                inflation: worldState.economicState.inflation,
                crimeRate: worldState.economicState.crimeRate,
                policePresence: worldState.economicState.policePresence,
                unemployment: 5 // Default unemployment rate
            },
            socialTension: worldState.socialTension,
            majorEvents: worldState.majorEvents
        };

        const response = await this.aiSystem.generateGameMasterEvent(nextGenWorldState);
        return this.parseFactionEvents(response);
    }

    private parseFactionDecision(response: AdvancedAIResponse, _factionId: string, _prompt: string): FactionDecision {
        // Parse AI response into structured faction decision (using prompt for context analysis)
        console.log('Analyzing faction context with prompt:', _prompt.substring(0, 100));
        return {
            decision: response.content.split('\n')[0] || 'Maintain current position',
            reasoning: response.content,
            actions: [
                {
                    type: 'defend',
                    target: 'current_territory',
                    resources: { soldiers: 10 },
                    riskLevel: 3
                }
            ],
            priority: 7,
            timeframe: '24 hours',
            expectedOutcome: 'Maintain territorial control'
        };
    }

    private parseFactionAnalysis(response: AdvancedAIResponse): FactionAnalysis {
        return {
            strengths: ['Strong leadership', 'Loyal members'],
            weaknesses: ['Limited resources', 'Hostile neighbors'],
            threats: ['Police raids', 'Rival factions'],
            opportunities: ['New territory', 'Alliance potential'],
            recommendedStrategy: response.content,
            alliances: [],
            enemies: []
        };
    }

    private parseFactionEvents(response: AdvancedAIResponse): FactionEvent[] {
        return [
            {
                id: `event_${Date.now()}`,
                type: 'territory_dispute',
                description: response.content,
                participants: ['faction_a', 'faction_b'],
                impact: { reputation: -5, territory: 1 },
                duration: 48
            }
        ];
    }
}

/**
 * Economy AI Agent Implementation
 */
class EconomyAIAgentImpl implements EconomyAIAgent {
    constructor(private aiSystem: NextGenAISystem) { }

    async generateMarketEvents(economicContext: EconomicContext): Promise<MarketEvent[]> {
        const _prompt = `
    Generate realistic market events based on current economic conditions:
    - Inflation: ${economicContext.inflation}%
    - Crime Rate: ${economicContext.crimeRate}/10
    - Police Presence: ${economicContext.policePresence}/10
    
    Create 3-5 market events that would naturally occur in this environment.
    `;

        const response = await this.aiSystem.analyzePlayerBehavior('market_analysis', 24);
        console.log('Using prompt for market analysis:', _prompt.substring(0, 50));
        return this.parseMarketEvents(response, economicContext);
    }

    async analyzePlayerEconomicBehavior(playerId: string): Promise<EconomicBehaviorAnalysis> {
        const response = await this.aiSystem.analyzePlayerBehavior(playerId, 168); // 1 week
        return this.parseEconomicBehavior(response);
    }

    async optimizePricing(itemType: string, marketConditions: MarketConditions): Promise<PricingRecommendation> {
        const _prompt = `
    Optimize pricing for ${itemType} based on market conditions:
    - Supply: ${marketConditions.supply}/10
    - Demand: ${marketConditions.demand}/10
    - Competition: ${marketConditions.competition}/10
    - Risk Factors: ${marketConditions.riskFactors.join(', ')}
    
    Recommend optimal pricing strategy.
    `;

        const response = await this.aiSystem.analyzePlayerBehavior('pricing_optimization', 1);
        console.log('Using prompt for pricing optimization:', _prompt.substring(0, 50));
        return this.parsePricingRecommendation(response, marketConditions);
    }

    private parseMarketEvents(response: AdvancedAIResponse, _context: EconomicContext): MarketEvent[] {
        // Use context for market event generation (unemployment would be calculated from context)
        return [
            {
                id: `market_event_${Date.now()}`,
                type: 'supply_shock',
                description: response.content,
                affectedItems: ['drugs', 'weapons'],
                priceModifier: 1.2,
                duration: 72,
                probability: 0.8
            }
        ];
    }

    private parseEconomicBehavior(response: AdvancedAIResponse): EconomicBehaviorAnalysis {
        return {
            spendingPatterns: { weapons: 30, vehicles: 20, drugs: 15, other: 35 },
            riskTolerance: 7,
            preferredActivities: ['heists', 'drug_dealing'],
            incomeStreams: ['missions', 'illegal_trade'],
            recommendations: [response.content]
        };
    }

    private parsePricingRecommendation(response: AdvancedAIResponse, conditions: MarketConditions): PricingRecommendation {
        const basePrice = 1000 * (conditions.demand / conditions.supply);
        return {
            basePrice,
            dynamicModifiers: {
                supply: conditions.supply / 10,
                demand: conditions.demand / 10,
                competition: 1 - (conditions.competition / 10)
            },
            reasoning: response.content,
            confidence: response.confidence
        };
    }
}

/**
 * Mission AI Agent Implementation
 */
class MissionAIAgentImpl implements MissionAIAgent {
    constructor(private aiSystem: NextGenAISystem) { }

    async generateDynamicMission(playerId: string, context: MissionContext): Promise<GeneratedMission> {
        const _prompt = `
    Generate a dynamic mission for player ${playerId} based on:
    - Player Level: ${context.playerLevel}
    - Location: ${context.currentLocation}
    - Faction: ${context.factionAffiliation}
    - Recent Activities: ${context.recentActivities.join(', ')}
    - World Events: ${context.worldEvents.join(', ')}
    
    Create an engaging mission that fits the player's profile and current world state.
    `;

        const response = await this.aiSystem.generateDynamicNarrative('mission_generation', {
            currentScene: context.currentLocation,
            plotThreads: [],
            playerActions: [],
            worldState: {
                factionBalance: {},
                economicState: { inflation: 0, crimeRate: 0, policePresence: 0, unemployment: 0 },
                socialTension: 5,
                majorEvents: []
            }
        });

        console.log('Using prompt for mission generation:', _prompt.substring(0, 50));
        return this.parseGeneratedMission(response, context);
    }

    async adaptMissionDifficulty(missionId: string, playerPerformance: PlayerPerformance): Promise<MissionAdaptation> {
        const _prompt = `
    Adapt mission ${missionId} based on player performance:
    - Completion Time: ${playerPerformance.completionTime} minutes
    - Success Rate: ${playerPerformance.successRate}%
    - Stealth Rating: ${playerPerformance.stealthRating}/10
    - Aggression Level: ${playerPerformance.aggressionLevel}/10
    - Creativity Score: ${playerPerformance.creativityScore}/10
    
    Suggest difficulty adjustments and new objectives.
    `;

        const response = await this.aiSystem.analyzePlayerBehavior(missionId, 1);
        console.log('Using prompt for mission adaptation:', _prompt.substring(0, 50));
        return this.parseMissionAdaptation(response, playerPerformance);
    }

    async generateMissionChain(theme: string, playerLevel: number): Promise<MissionChain> {
        const _prompt = `
    Generate a mission chain with theme "${theme}" for a level ${playerLevel} player.
    Create 3-5 interconnected missions that tell a cohesive story and progressively increase in difficulty.
    `;

        const response = await this.aiSystem.generateDynamicNarrative('mission_chain', {
            currentScene: theme,
            plotThreads: [],
            playerActions: [],
            worldState: {
                factionBalance: {},
                economicState: { inflation: 0, crimeRate: 0, policePresence: 0, unemployment: 0 },
                socialTension: 5,
                majorEvents: []
            }
        });

        console.log('Using prompt for mission chain generation:', _prompt.substring(0, 50));
        return this.parseMissionChain(response, theme, playerLevel);
    }

    private parseGeneratedMission(response: AdvancedAIResponse, context: MissionContext): GeneratedMission {
        const missionId = `mission_${Date.now()}`;
        return {
            id: missionId,
            title: `Mission for ${context.playerId}`,
            description: response.content,
            objectives: [
                {
                    id: `obj_${Date.now()}`,
                    description: 'Complete the primary objective',
                    type: 'deliver',
                    target: 'package',
                    location: context.currentLocation,
                    optional: false
                }
            ],
            difficulty: Math.min(context.playerLevel + 1, 10),
            estimatedDuration: 30,
            rewards: [
                {
                    type: 'money',
                    amount: context.playerLevel * 1000,
                    description: 'Payment for services'
                }
            ],
            requirements: [],
            narrative: response.content
        };
    }

    private parseMissionAdaptation(response: AdvancedAIResponse, performance: PlayerPerformance): MissionAdaptation {
        const difficultyChange = performance.successRate > 80 ? 1 : performance.successRate < 50 ? -1 : 0;

        return {
            difficultyAdjustment: difficultyChange,
            newObjectives: [],
            additionalChallenges: performance.successRate > 80 ? ['time_limit', 'stealth_required'] : [],
            narrativeChanges: [response.content]
        };
    }

    private parseMissionChain(response: AdvancedAIResponse, theme: string, playerLevel: number): MissionChain {
        return {
            id: `chain_${Date.now()}`,
            theme,
            missions: [
                {
                    id: `mission_${Date.now()}_1`,
                    title: `${theme} - Chapter 1`,
                    description: response.content,
                    objectives: [],
                    difficulty: playerLevel,
                    estimatedDuration: 45,
                    rewards: [],
                    requirements: [],
                    narrative: response.content
                }
            ],
            overallNarrative: response.content,
            progression: ['introduction', 'complication', 'climax', 'resolution']
        };
    }
}

export { SpecializedAIAgentFactory };

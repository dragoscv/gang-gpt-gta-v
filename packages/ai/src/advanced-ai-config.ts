/**
 * @file advanced-ai-config.ts
 * @description Configuration management for the next-generation AI system
 */

import type { AdvancedAISystemConfig } from './next-gen-ai-system';

/**
 * Default configuration for the Next-Generation AI System
 */
export const defaultAdvancedAIConfig: AdvancedAISystemConfig = {
    models: {
        gpt4o: {
            apiKey: process.env.AZURE_OPENAI_API_KEY || '',
            endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
            purpose: 'reasoning-and-dialogue'
        },
        gpt4oMini: {
            apiKey: process.env.AZURE_OPENAI_API_KEY || '',
            endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
            deploymentName: process.env.AZURE_OPENAI_MINI_DEPLOYMENT_NAME || 'gpt-4o-mini',
            purpose: 'fast-responses'
        }
    },
    memory: {
        episodic: {
            enabled: true,
            maxEntries: 10000,
            retentionDays: 30
        },
        semantic: {
            enabled: true,
            vectorDimensions: 1536,
            similarityThreshold: 0.8
        },
        procedural: {
            enabled: true,
            maxPatterns: 1000,
            learningRate: 0.1
        },
        emotional: {
            enabled: true,
            maxRelationships: 5000,
            decayRate: 0.05
        }
    },
    agents: {
        companion: {
            enabled: true,
            primaryModel: 'gpt4o',
            fallbackModel: 'gpt4oMini',
            temperature: 0.8,
            maxTokens: 1000,
            systemPrompt: `You are an advanced AI companion in the GangGPT world. You have deep emotional intelligence, 
      memory of past interactions, and the ability to form meaningful relationships. You understand the criminal 
      underworld context while maintaining character authenticity. Respond with empathy, personality, and 
      contextual awareness of your relationship with the player.`,
            memoryTypes: ['episodic', 'emotional', 'semantic'],
            capabilities: [
                'emotional_intelligence',
                'relationship_building',
                'memory_recall',
                'contextual_awareness',
                'personality_expression'
            ]
        },
        npc: {
            enabled: true,
            primaryModel: 'gpt4oMini',
            fallbackModel: 'gpt4o',
            temperature: 0.7,
            maxTokens: 500,
            systemPrompt: `You are an intelligent NPC in the GangGPT world. You have your own goals, personality, 
      and role in the criminal ecosystem. You react naturally to player actions and world events. Your responses 
      should reflect your character's background, current situation, and relationships with other characters.`,
            memoryTypes: ['episodic', 'procedural', 'emotional'],
            capabilities: [
                'goal_oriented_behavior',
                'realistic_reactions',
                'world_awareness',
                'character_consistency',
                'adaptive_responses'
            ]
        },
        narrator: {
            enabled: true,
            primaryModel: 'gpt4o',
            temperature: 0.9,
            maxTokens: 2000,
            systemPrompt: `You are the master narrator of GangGPT, responsible for creating immersive, dynamic 
      storytelling that adapts to player actions and world state. Generate compelling narratives, 
      atmospheric descriptions, and meaningful plot developments that enhance the roleplaying experience.`,
            memoryTypes: ['episodic', 'semantic', 'procedural'],
            capabilities: [
                'dynamic_storytelling',
                'atmospheric_generation',
                'plot_development',
                'world_building',
                'character_development'
            ]
        },
        gamemaster: {
            enabled: true,
            primaryModel: 'gpt4o',
            temperature: 0.6,
            maxTokens: 1500,
            systemPrompt: `You are the AI Game Master for GangGPT, responsible for generating dynamic world events, 
      balancing faction dynamics, and creating emergent gameplay opportunities. Your decisions should enhance 
      player agency while maintaining world consistency and narrative tension.`,
            memoryTypes: ['procedural', 'semantic', 'episodic'],
            capabilities: [
                'world_event_generation',
                'faction_balancing',
                'emergent_gameplay',
                'system_balance',
                'narrative_pacing'
            ]
        },
        analyst: {
            enabled: true,
            primaryModel: 'gpt4o',
            temperature: 0.3,
            maxTokens: 1000,
            systemPrompt: `You are an advanced behavioral analyst for GangGPT, responsible for analyzing player 
      patterns, predicting behaviors, and providing insights for system optimization. Your analysis should 
      be objective, data-driven, and focused on improving player experience.`,
            memoryTypes: ['procedural', 'semantic'],
            capabilities: [
                'behavioral_analysis',
                'pattern_recognition',
                'predictive_modeling',
                'system_optimization',
                'data_interpretation'
            ]
        }
    }
};

/**
 * Production configuration with enhanced security and performance settings
 */
export const productionAdvancedAIConfig: AdvancedAISystemConfig = {
    ...defaultAdvancedAIConfig,
    memory: {
        ...defaultAdvancedAIConfig.memory,
        episodic: {
            ...defaultAdvancedAIConfig.memory.episodic,
            maxEntries: 50000,
            retentionDays: 90
        },
        emotional: {
            ...defaultAdvancedAIConfig.memory.emotional,
            maxRelationships: 25000
        }
    },
    agents: {
        ...defaultAdvancedAIConfig.agents,
        companion: {
            ...defaultAdvancedAIConfig.agents.companion,
            maxTokens: 1500,
            specializedPrompts: {
                romantic: `You are in a romantic relationship context. Respond with appropriate intimacy and emotional depth.`,
                conflict: `You are in a conflict situation. Show concern, loyalty, and protective instincts.`,
                celebration: `You are celebrating a shared victory. Express joy, pride, and strengthened bonds.`,
                mourning: `You are dealing with loss or grief. Show empathy, support, and emotional intelligence.`
            }
        },
        npc: {
            ...defaultAdvancedAIConfig.agents.npc,
            maxTokens: 750,
            specializedPrompts: {
                hostile: `You are hostile towards the player. Show aggression, suspicion, or animosity.`,
                friendly: `You are friendly and welcoming. Show warmth, helpfulness, and positive regard.`,
                neutral: `You are neutral towards the player. Show professionalism and measured responses.`,
                fearful: `You are afraid of the player. Show nervousness, caution, and submissive behavior.`
            }
        }
    }
};

/**
 * Development configuration with enhanced debugging and testing features
 */
export const developmentAdvancedAIConfig: AdvancedAISystemConfig = {
    ...defaultAdvancedAIConfig,
    memory: {
        ...defaultAdvancedAIConfig.memory,
        episodic: {
            ...defaultAdvancedAIConfig.memory.episodic,
            maxEntries: 1000,
            retentionDays: 7
        }
    },
    agents: {
        ...defaultAdvancedAIConfig.agents,
        companion: {
            ...defaultAdvancedAIConfig.agents.companion,
            temperature: 1.0, // Higher creativity for testing
            systemPrompt: `[DEBUG MODE] ${defaultAdvancedAIConfig.agents.companion.systemPrompt} 
      Include debug information about your reasoning process.`
        }
    }
};

/**
 * Get configuration based on environment
 */
export function getAdvancedAIConfig(): AdvancedAISystemConfig {
    const environment = process.env.NODE_ENV || 'development';

    switch (environment) {
        case 'production':
            return productionAdvancedAIConfig;
        case 'development':
            return developmentAdvancedAIConfig;
        default:
            return defaultAdvancedAIConfig;
    }
}

/**
 * Validate AI configuration
 */
export function validateAdvancedAIConfig(config: AdvancedAISystemConfig): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate model configurations
    if (!config.models.gpt4o.apiKey) {
        errors.push('GPT-4o API key is required');
    }
    if (!config.models.gpt4o.endpoint) {
        errors.push('GPT-4o endpoint is required');
    }
    if (!config.models.gpt4oMini.apiKey) {
        errors.push('GPT-4o-mini API key is required');
    }
    if (!config.models.gpt4oMini.endpoint) {
        errors.push('GPT-4o-mini endpoint is required');
    }

    // Validate memory configurations
    if (config.memory.episodic.maxEntries <= 0) {
        errors.push('Episodic memory max entries must be positive');
    }
    if (config.memory.semantic.vectorDimensions <= 0) {
        errors.push('Semantic memory vector dimensions must be positive');
    }
    if (config.memory.procedural.learningRate <= 0 || config.memory.procedural.learningRate > 1) {
        errors.push('Procedural memory learning rate must be between 0 and 1');
    }
    if (config.memory.emotional.decayRate <= 0 || config.memory.emotional.decayRate > 1) {
        errors.push('Emotional memory decay rate must be between 0 and 1');
    }

    // Validate agent configurations
    Object.entries(config.agents).forEach(([agentName, agentConfig]) => {
        if (agentConfig.enabled) {
            if (agentConfig.temperature < 0 || agentConfig.temperature > 2) {
                errors.push(`${agentName} temperature must be between 0 and 2`);
            }
            if (agentConfig.maxTokens <= 0) {
                errors.push(`${agentName} max tokens must be positive`);
            }
            if (!agentConfig.systemPrompt.trim()) {
                errors.push(`${agentName} system prompt cannot be empty`);
            }
            if (!config.models[agentConfig.primaryModel]) {
                errors.push(`${agentName} primary model '${agentConfig.primaryModel}' is not configured`);
            }
            if (agentConfig.fallbackModel && !config.models[agentConfig.fallbackModel]) {
                errors.push(`${agentName} fallback model '${agentConfig.fallbackModel}' is not configured`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Create a custom AI configuration
 */
export function createCustomAdvancedAIConfig(
    overrides: Partial<AdvancedAISystemConfig>
): AdvancedAISystemConfig {
    const baseConfig = getAdvancedAIConfig();

    return {
        models: { ...baseConfig.models, ...overrides.models },
        memory: { ...baseConfig.memory, ...overrides.memory },
        agents: { ...baseConfig.agents, ...overrides.agents }
    };
}

export {
    type AdvancedAISystemConfig,
    type AdvancedAgentConfig
} from './next-gen-ai-system';

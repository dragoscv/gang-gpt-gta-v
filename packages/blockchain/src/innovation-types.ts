import { z } from 'zod';

/**
 * Blockchain configuration schemas and types
 */

// Network configuration
export const NetworkConfigSchema = z.object({
    name: z.string(),
    rpcUrl: z.string().url(),
    chainId: z.number(),
    symbol: z.string(),
    blockExplorer: z.string().url().optional(),
    gasPrice: z.string().optional(),
});

export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

// Blockchain configuration
export const BlockchainConfigSchema = z.object({
    solana: NetworkConfigSchema.optional(),
    ethereum: NetworkConfigSchema.optional(),
    polygon: NetworkConfigSchema.optional(),
    defaultNetwork: z.enum(['solana', 'ethereum', 'polygon']),
    ipfsGateway: z.string().url().default('https://gateway.pinata.cloud'),
    pinataApiKey: z.string().optional(),
    pinataSecretKey: z.string().optional(),
});

export type BlockchainConfig = z.infer<typeof BlockchainConfigSchema>;

// VR/AR integration schemas
export const VREnvironmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['vr', 'ar', 'mixed']),
    location: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
    }),
    rotation: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
    }),
    scale: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
    }),
    assets: z.array(z.object({
        id: z.string(),
        type: z.enum(['model', 'texture', 'animation', 'sound']),
        url: z.string().url(),
        metadata: z.record(z.any()),
    })),
    interactions: z.array(z.object({
        id: z.string(),
        type: z.enum(['touch', 'gaze', 'gesture', 'voice']),
        trigger: z.record(z.any()),
        action: z.record(z.any()),
    })),
    physics: z.object({
        gravity: z.number(),
        friction: z.number(),
        restitution: z.number(),
    }),
    lighting: z.object({
        ambient: z.string(),
        directional: z.array(z.object({
            direction: z.array(z.number()),
            color: z.string(),
            intensity: z.number(),
        })),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type VREnvironment = z.infer<typeof VREnvironmentSchema>;

// AR object schema
export const ARObjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['marker', 'markerless', 'location']),
    anchor: z.object({
        type: z.enum(['image', 'plane', 'face', 'gps']),
        data: z.record(z.any()),
    }),
    content: z.object({
        model: z.string().url().optional(),
        video: z.string().url().optional(),
        image: z.string().url().optional(),
        text: z.string().optional(),
        animation: z.string().url().optional(),
    }),
    tracking: z.object({
        enabled: z.boolean(),
        confidence: z.number().min(0).max(1),
        stability: z.number().min(0).max(1),
    }),
    occlusion: z.boolean(),
    shadows: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ARObject = z.infer<typeof ARObjectSchema>;

// VR interaction schema
export const VRInteractionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    environmentId: z.string(),
    action: z.enum(['grab', 'throw', 'teleport', 'gesture', 'voice']),
    target: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
    }),
    timestamp: z.date(),
    duration: z.number(),
    success: z.boolean(),
    metadata: z.record(z.any()),
});

export type VRInteraction = z.infer<typeof VRInteractionSchema>;

// Multi-modal AI schemas
export const AIModalitySchema = z.object({
    type: z.enum(['text', 'voice', 'vision', 'gesture', 'emotion']),
    enabled: z.boolean(),
    confidence: z.number().min(0).max(1),
    language: z.string().optional(),
    model: z.string(),
    config: z.record(z.any()),
});

export type AIModality = z.infer<typeof AIModalitySchema>;

export const MultiModalRequestSchema = z.object({
    id: z.string(),
    userId: z.string(),
    sessionId: z.string(),
    modalities: z.array(AIModalitySchema),
    input: z.object({
        text: z.string().optional(),
        audio: z.string().url().optional(),
        image: z.string().url().optional(),
        video: z.string().url().optional(),
        gesture: z.record(z.any()).optional(),
    }),
    context: z.record(z.any()),
    timestamp: z.date(),
});

export type MultiModalRequest = z.infer<typeof MultiModalRequestSchema>;

export const MultiModalResponseSchema = z.object({
    id: z.string(),
    requestId: z.string(),
    outputs: z.array(z.object({
        modality: z.enum(['text', 'voice', 'image', 'video', 'animation']),
        content: z.any(),
        confidence: z.number().min(0).max(1),
        metadata: z.record(z.any()),
    })),
    processing: z.object({
        duration: z.number(),
        tokens: z.number(),
        cost: z.number(),
    }),
    timestamp: z.date(),
});

export type MultiModalResponse = z.infer<typeof MultiModalResponseSchema>;

// Voice synthesis schemas
export const VoiceProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    characterId: z.string(),
    language: z.string(),
    gender: z.enum(['male', 'female', 'neutral']),
    age: z.enum(['child', 'young', 'adult', 'elderly']),
    accent: z.string().optional(),
    speed: z.number().min(0.5).max(2.0),
    pitch: z.number().min(0.5).max(2.0),
    volume: z.number().min(0).max(1),
    emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'excited', 'calm']),
    personality: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;

export const SpeechSynthesisRequestSchema = z.object({
    id: z.string(),
    text: z.string(),
    voiceProfileId: z.string(),
    options: z.object({
        ssml: z.boolean().default(false),
        format: z.enum(['mp3', 'wav', 'ogg']).default('mp3'),
        quality: z.enum(['low', 'medium', 'high']).default('medium'),
        streaming: z.boolean().default(false),
    }),
    timestamp: z.date(),
});

export type SpeechSynthesisRequest = z.infer<typeof SpeechSynthesisRequestSchema>;

// Edge computing schemas
export const EdgeNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    location: z.object({
        country: z.string(),
        region: z.string(),
        city: z.string(),
        latitude: z.number(),
        longitude: z.number(),
    }),
    capacity: z.object({
        cpu: z.number(),
        memory: z.number(),
        storage: z.number(),
        bandwidth: z.number(),
    }),
    utilization: z.object({
        cpu: z.number().min(0).max(100),
        memory: z.number().min(0).max(100),
        storage: z.number().min(0).max(100),
        bandwidth: z.number().min(0).max(100),
    }),
    services: z.array(z.string()),
    status: z.enum(['online', 'offline', 'maintenance']),
    latency: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type EdgeNode = z.infer<typeof EdgeNodeSchema>;

export const EdgeDeploymentSchema = z.object({
    id: z.string(),
    name: z.string(),
    service: z.string(),
    version: z.string(),
    nodes: z.array(z.string()),
    config: z.record(z.any()),
    routing: z.object({
        strategy: z.enum(['round-robin', 'latency', 'load', 'geography']),
        weights: z.record(z.number()),
    }),
    monitoring: z.object({
        enabled: z.boolean(),
        metrics: z.array(z.string()),
        alerts: z.array(z.object({
            metric: z.string(),
            threshold: z.number(),
            action: z.string(),
        })),
    }),
    status: z.enum(['deploying', 'running', 'stopped', 'failed']),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type EdgeDeployment = z.infer<typeof EdgeDeploymentSchema>;

// Cross-platform schemas
export const PlatformSchema = z.object({
    type: z.enum(['pc', 'mobile', 'console', 'web', 'vr']),
    os: z.string(),
    version: z.string(),
    capabilities: z.array(z.string()),
    limitations: z.array(z.string()),
    performance: z.object({
        cpu: z.number(),
        gpu: z.number(),
        memory: z.number(),
        storage: z.number(),
    }),
});

export type Platform = z.infer<typeof PlatformSchema>;

export const CrossPlatformConfigSchema = z.object({
    targetPlatforms: z.array(PlatformSchema),
    features: z.record(z.object({
        enabled: z.boolean(),
        platformSpecific: z.record(z.any()),
    })),
    ui: z.object({
        responsive: z.boolean(),
        adaptiveLayout: z.boolean(),
        platformThemes: z.record(z.any()),
    }),
    performance: z.object({
        optimization: z.enum(['battery', 'performance', 'balanced']),
        streaming: z.object({
            quality: z.enum(['low', 'medium', 'high', 'adaptive']),
            bandwidth: z.number(),
        }),
    }),
});

export type CrossPlatformConfig = z.infer<typeof CrossPlatformConfigSchema>;

// Innovation tracking schemas
export const InnovationMetricSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['performance', 'user_experience', 'scalability', 'innovation']),
    value: z.number(),
    unit: z.string(),
    target: z.number().optional(),
    trend: z.enum(['up', 'down', 'stable']),
    timestamp: z.date(),
});

export type InnovationMetric = z.infer<typeof InnovationMetricSchema>;

export const ExperimentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    hypothesis: z.string(),
    methodology: z.string(),
    parameters: z.record(z.any()),
    results: z.record(z.any()).optional(),
    status: z.enum(['design', 'running', 'analysis', 'completed', 'failed']),
    startDate: z.date(),
    endDate: z.date().optional(),
    participants: z.array(z.string()),
    metrics: z.array(InnovationMetricSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

// Error handling
export class BlockchainError extends Error {
    constructor(
        message: string,
        public code: string,
        public blockchain?: string,
        public txHash?: string
    ) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class VRError extends Error {
    constructor(
        message: string,
        public code: string,
        public environmentId?: string
    ) {
        super(message);
        this.name = 'VRError';
    }
}

export class AIError extends Error {
    constructor(
        message: string,
        public code: string,
        public modality?: string
    ) {
        super(message);
        this.name = 'AIError';
    }
}

export class EdgeError extends Error {
    constructor(
        message: string,
        public code: string,
        public nodeId?: string
    ) {
        super(message);
        this.name = 'EdgeError';
    }
}

// Service interfaces
export interface IVRService {
    createEnvironment(environment: Omit<VREnvironment, 'id' | 'createdAt' | 'updatedAt'>): Promise<VREnvironment>;
    updateEnvironment(id: string, updates: Partial<VREnvironment>): Promise<VREnvironment>;
    deleteEnvironment(id: string): Promise<void>;
    getEnvironment(id: string): Promise<VREnvironment | null>;
    listEnvironments(userId?: string): Promise<VREnvironment[]>;
    trackInteraction(interaction: Omit<VRInteraction, 'id' | 'timestamp'>): Promise<VRInteraction>;
    getInteractions(environmentId: string, timeRange?: { start: Date; end: Date }): Promise<VRInteraction[]>;
}

export interface IAIService {
    processMultiModal(request: MultiModalRequest): Promise<MultiModalResponse>;
    synthesizeSpeech(request: SpeechSynthesisRequest): Promise<string>;
    createVoiceProfile(profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<VoiceProfile>;
    updateVoiceProfile(id: string, updates: Partial<VoiceProfile>): Promise<VoiceProfile>;
    getVoiceProfile(id: string): Promise<VoiceProfile | null>;
    listVoiceProfiles(characterId?: string): Promise<VoiceProfile[]>;
}

export interface IEdgeService {
    deployService(deployment: Omit<EdgeDeployment, 'id' | 'createdAt' | 'updatedAt'>): Promise<EdgeDeployment>;
    updateDeployment(id: string, updates: Partial<EdgeDeployment>): Promise<EdgeDeployment>;
    stopDeployment(id: string): Promise<void>;
    getDeployment(id: string): Promise<EdgeDeployment | null>;
    listDeployments(): Promise<EdgeDeployment[]>;
    getEdgeNodes(): Promise<EdgeNode[]>;
    getOptimalNode(location: { latitude: number; longitude: number }): Promise<EdgeNode>;
}

export interface ICrossPlatformService {
    adaptContent(content: any, platform: Platform): Promise<any>;
    optimizePerformance(config: CrossPlatformConfig, platform: Platform): Promise<any>;
    syncUserData(userId: string, platforms: Platform[]): Promise<void>;
    validateCompatibility(feature: string, platform: Platform): Promise<boolean>;
}

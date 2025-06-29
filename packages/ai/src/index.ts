// AI package entry point
export const AI_VERSION = '1.0.0';

// Type exports - will be expanded as we build the AI services
export interface AIConfig {
    apiKey: string;
    endpoint: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

export interface AIResponse {
    content: string;
    tokens: number;
    model: string;
    timestamp: Date;
}

export interface PromptTemplate {
    system: string;
    template: string;
    variables: string[];
}

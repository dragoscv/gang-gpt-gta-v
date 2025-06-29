// Game-related types
export interface Player {
    id: string;
    username: string;
    level: number;
    experience: number;
    money: number;
    bank: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
    health: number;
    armor: number;
    isOnline: boolean;
}

export interface Faction {
    id: string;
    name: string;
    type: FactionType;
    influence: number;
    territory?: string;
    color: string;
    isActive: boolean;
    leaderId?: string;
}

export enum FactionType {
    CRIMINAL = 'CRIMINAL',
    GOVERNMENT = 'GOVERNMENT',
    BUSINESS = 'BUSINESS',
    GANG = 'GANG',
    INDEPENDENT = 'INDEPENDENT'
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    difficulty: number;
    rewards: MissionReward[];
    status: MissionStatus;
    estimatedDuration: number;
    location?: string;
}

export enum MissionType {
    DELIVERY = 'DELIVERY',
    HEIST = 'HEIST',
    ASSASSINATION = 'ASSASSINATION',
    ESCORT = 'ESCORT',
    RECONNAISSANCE = 'RECONNAISSANCE',
    CHAOS = 'CHAOS'
}

export enum MissionStatus {
    AVAILABLE = 'AVAILABLE',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export interface MissionReward {
    type: 'money' | 'experience' | 'item' | 'reputation';
    amount: number;
    description: string;
}

// AI-related types
export interface AIResponse {
    content: string;
    timestamp: Date;
    tokensUsed: number;
    model: string;
}

export interface NPCMemory {
    id: string;
    npcId: string;
    playerId?: string;
    content: string;
    emotionalContext?: string;
    importance: number;
    createdAt: Date;
    lastAccessed: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Authentication types
export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    PLAYER = 'PLAYER',
    BANNED = 'BANNED'
}

export interface JWTPayload {
    userId: string;
    username: string;
    role: UserRole;
    iat: number;
    exp: number;
}

// WebSocket Event types
export interface SocketEvent<T = unknown> {
    type: string;
    data: T;
    timestamp: number;
    userId?: string;
}

// Configuration types
export interface DatabaseConfig {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
}

export interface AIConfig {
    apiKey: string;
    endpoint: string;
    apiVersion: string;
    model: string;
    maxTokens: number;
}

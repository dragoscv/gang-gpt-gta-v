'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseRealTimeDataOptions {
    refreshInterval?: number;
    enabled?: boolean;
}

interface UseRealTimeDataReturn<T> {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useRealTimeData<T>(
    endpoint: string,
    options: UseRealTimeDataOptions = {}
): UseRealTimeDataReturn<T> {
    const { refreshInterval = 5000, enabled = true } = options;

    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        try {
            setError(null);

            // For development, return mock data based on endpoint
            const mockData = generateMockData<T>(endpoint);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

            setData(mockData);
            setIsLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch data'));
            setIsLoading(false);
        }
    }, [endpoint, enabled]);

    const refetch = useCallback(() => {
        setIsLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!enabled || refreshInterval <= 0) return;

        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData, refreshInterval, enabled]);

    return { data, isLoading, error, refetch };
}

// Mock data generator for development
function generateMockData<T>(endpoint: string): T {
    if (endpoint.includes('/api/metrics/server')) {
        return {
            playerCount: Math.floor(Math.random() * 800) + 100,
            maxPlayers: 1000,
            serverLoad: Math.floor(Math.random() * 60) + 10,
            aiResponseTime: Math.floor(Math.random() * 150) + 50,
            uptime: 86400 * 7 + Math.random() * 86400,
            activeEvents: Math.floor(Math.random() * 20) + 5,
            factionsActive: Math.floor(Math.random() * 8) + 3,
            economyHealth: Math.floor(Math.random() * 30) + 70,
        } as T;
    }

    if (endpoint.includes('/api/metrics/activity')) {
        const activities = [
            'Started a heist',
            'Joined faction meeting',
            'Completed mission',
            'Purchased property',
            'Engaged in combat',
            'Trading with players',
            'Exploring new territory',
            'Building alliance'
        ];

        const factions = ['Los Santos Police', 'Grove Street', 'Ballas', 'Vagos', 'Mafia', 'Triads'];
        const locations = ['Downtown', 'Grove Street', 'Vinewood', 'Sandy Shores', 'Paleto Bay', 'Del Perro'];

        return Array.from({ length: 15 }, (_, i) => ({
            id: `activity-${i}`,
            username: `Player${Math.floor(Math.random() * 1000)}`,
            faction: factions[Math.floor(Math.random() * factions.length)],
            activity: activities[Math.floor(Math.random() * activities.length)],
            location: locations[Math.floor(Math.random() * locations.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000),
            status: ['online', 'busy', 'away'][Math.floor(Math.random() * 3)] as 'online' | 'busy' | 'away',
        })) as T;
    }

    if (endpoint.includes('/api/ai/insights')) {
        const insights = [
            {
                id: 'insight-1',
                type: 'performance',
                title: 'Server Performance Optimal',
                description: 'AI response times are consistently under 150ms, indicating optimal server performance.',
                confidence: 0.94,
                timestamp: new Date(Date.now() - Math.random() * 1800000),
                actionable: false,
            },
            {
                id: 'insight-2',
                type: 'behavior',
                title: 'Increased Player Cooperation',
                description: 'Player cooperation metrics have increased by 23% this week, suggesting successful faction dynamics.',
                confidence: 0.87,
                timestamp: new Date(Date.now() - Math.random() * 3600000),
                actionable: true,
            },
            {
                id: 'insight-3',
                type: 'prediction',
                title: 'Peak Activity Forecast',
                description: 'AI predicts 40% increase in player activity during weekend hours based on historical patterns.',
                confidence: 0.91,
                timestamp: new Date(Date.now() - Math.random() * 7200000),
                actionable: true,
            },
            {
                id: 'insight-4',
                type: 'alert',
                title: 'Faction Imbalance Detected',
                description: 'Grove Street faction has grown to 45% of total players. Consider balancing incentives.',
                confidence: 0.96,
                timestamp: new Date(Date.now() - Math.random() * 900000),
                actionable: true,
            }
        ];

        return insights as T;
    }

    // Social endpoints
    if (endpoint.includes('/api/social/players')) {
        const factions = ['Los Santos Police', 'Grove Street', 'Ballas', 'Vagos', 'Mafia', 'Triads'];
        const activityTypes = ['achievement', 'mission', 'social', 'combat', 'economic'] as const;
        const relationshipTypes = ['friend', 'ally', 'rival', 'enemy'] as const;

        return Array.from({ length: 30 }, (_, i) => ({
            id: `player-${i}`,
            username: `Player${i + 1}`,
            displayName: `Player ${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            faction: factions[Math.floor(Math.random() * factions.length)],
            level: Math.floor(Math.random() * 100) + 1,
            reputation: Math.floor(Math.random() * 50000) + 1000,
            status: ['online', 'offline', 'away', 'busy'][Math.floor(Math.random() * 4)] as 'online' | 'offline' | 'away' | 'busy',
            lastSeen: new Date(Date.now() - Math.random() * 604800000),
            joinedAt: new Date(Date.now() - Math.random() * 31536000000),
            playtime: Math.floor(Math.random() * 1000000) + 10000,
            bio: Math.random() > 0.5 ? `Bio for Player ${i + 1}. Experienced GTA V player and roleplay enthusiast.` : undefined,
            achievements: Array.from({ length: Math.floor(Math.random() * 15) + 1 }, (_, j) => ({
                id: `achievement-${i}-${j}`,
                name: `Achievement ${j + 1}`,
                description: `Description for achievement ${j + 1}`,
                icon: '🏆',
                category: ['combat', 'social', 'economic', 'exploration'][Math.floor(Math.random() * 4)],
                rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)] as 'common' | 'rare' | 'epic' | 'legendary',
                unlockedAt: new Date(Date.now() - Math.random() * 2592000000),
                progress: 100,
                maxProgress: 100,
            })),
            relationships: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, k) => ({
                id: `relationship-${i}-${k}`,
                playerId: `player-${(i + k + 1) % 30}`,
                playerName: `Player ${((i + k + 1) % 30) + 1}`,
                playerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${(i + k + 1) % 30}`,
                type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
                strength: Math.floor(Math.random() * 100) + 1,
                establishedAt: new Date(Date.now() - Math.random() * 2592000000),
                lastInteraction: new Date(Date.now() - Math.random() * 86400000),
                interactions: Math.floor(Math.random() * 100) + 1,
            })),
            activity: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, l) => ({
                id: `activity-${i}-${l}`,
                type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
                description: `Completed ${['mission', 'heist', 'race', 'business deal'][Math.floor(Math.random() * 4)]}`,
                timestamp: new Date(Date.now() - Math.random() * 3600000),
                participants: Math.random() > 0.5 ? [`player-${(i + 1) % 30}`, `player-${(i + 2) % 30}`] : undefined,
                location: ['Downtown', 'Grove Street', 'Vinewood'][Math.floor(Math.random() * 3)],
                reward: Math.random() > 0.5 ? Math.floor(Math.random() * 10000) + 1000 : undefined,
            })),
        })) as T;
    }

    if (endpoint.includes('/api/social/events')) {
        const eventTypes = ['faction_meeting', 'heist_planning', 'tournament', 'celebration'] as const;
        const statuses = ['upcoming', 'active', 'completed', 'cancelled'] as const;

        return Array.from({ length: 10 }, (_, i) => ({
            id: `event-${i}`,
            title: `Event ${i + 1}`,
            description: `Description for event ${i + 1}. Join us for an exciting gaming experience!`,
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            organizer: `Player${Math.floor(Math.random() * 30) + 1}`,
            participants: Array.from({ length: Math.floor(Math.random() * 15) + 1 }, (_, j) => `player-${j}`),
            maxParticipants: Math.floor(Math.random() * 20) + 10,
            startTime: new Date(Date.now() + Math.random() * 604800000),
            endTime: new Date(Date.now() + Math.random() * 604800000 + 3600000),
            location: ['Downtown', 'Grove Street', 'Vinewood', 'Sandy Shores'][Math.floor(Math.random() * 4)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            requirements: Math.random() > 0.5 ? {
                level: Math.floor(Math.random() * 50) + 1,
                faction: ['Grove Street', 'Ballas'][Math.floor(Math.random() * 2)],
                reputation: Math.floor(Math.random() * 10000) + 1000,
            } : undefined,
        })) as T;
    }

    if (endpoint.includes('/api/social/leaderboards')) {
        const mockPlayers = Array.from({ length: 20 }, (_, i) => ({
            id: `player-${i}`,
            username: `Player${i + 1}`,
            displayName: `Player ${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            faction: ['Los Santos Police', 'Grove Street', 'Ballas'][Math.floor(Math.random() * 3)],
            level: Math.floor(Math.random() * 100) + 1,
            reputation: Math.floor(Math.random() * 50000) + 1000,
            playtime: Math.floor(Math.random() * 1000000) + 10000,
            lastSeen: new Date(),
            joinedAt: new Date(),
            status: 'online' as const,
            bio: undefined,
            achievements: Array.from({ length: Math.floor(Math.random() * 20) + 1 }, () => ({
                id: 'test',
                name: 'Test',
                description: 'Test',
                icon: '🏆',
                category: 'test',
                rarity: 'common' as const,
                unlockedAt: new Date(),
                progress: 100,
                maxProgress: 100,
            })),
            relationships: [],
            activity: [],
        }));

        return {
            level: mockPlayers
                .sort((a, b) => b.level - a.level)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    value: player.level,
                    change: Math.floor(Math.random() * 10) - 5,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
            reputation: mockPlayers
                .sort((a, b) => b.reputation - a.reputation)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    value: player.reputation,
                    change: Math.floor(Math.random() * 1000) - 500,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
            social: mockPlayers
                .sort((a, b) => b.achievements.length - a.achievements.length)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    value: player.achievements.length,
                    change: Math.floor(Math.random() * 5) - 2,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
        } as T;
    }

    // Legacy endpoints for compatibility
    if (endpoint.includes('/api/players/statistics')) {
        const factions = ['Los Santos Police', 'Grove Street', 'Ballas', 'Vagos', 'Mafia', 'Triads'];
        const playstyles = ['aggressive', 'diplomatic', 'strategic', 'social'];
        const ranks = ['Rookie', 'Member', 'Lieutenant', 'Captain', 'Boss'];

        return Array.from({ length: 50 }, (_, i) => ({
            id: `player-${i}`,
            username: `Player${i + 1}`,
            displayName: `Player ${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            faction: factions[Math.floor(Math.random() * factions.length)],
            level: Math.floor(Math.random() * 100) + 1,
            reputation: Math.floor(Math.random() * 50000) + 1000,
            playtime: Math.floor(Math.random() * 1000000) + 10000,
            lastSeen: new Date(Date.now() - Math.random() * 604800000),
            status: ['online', 'offline', 'away'][Math.floor(Math.random() * 3)] as 'online' | 'offline' | 'away',
            rank: ranks[Math.floor(Math.random() * ranks.length)],
            achievements: Array.from({ length: Math.floor(Math.random() * 20) + 1 }, (_, j) => ({
                id: `achievement-${i}-${j}`,
                name: `Achievement ${j + 1}`,
                description: `Description for achievement ${j + 1}`,
                category: ['combat', 'social', 'economic', 'exploration'][Math.floor(Math.random() * 4)],
                rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)] as 'common' | 'rare' | 'epic' | 'legendary',
                unlockedAt: new Date(Date.now() - Math.random() * 2592000000),
                progress: 100,
                maxProgress: 100,
            })),
            stats: {
                missionsCompleted: Math.floor(Math.random() * 500),
                heistsParticipated: Math.floor(Math.random() * 50),
                businessesOwned: Math.floor(Math.random() * 10),
                moneyEarned: Math.floor(Math.random() * 10000000),
                killDeathRatio: Math.random() * 3 + 0.5,
                criminalRating: Math.floor(Math.random() * 1000),
                socialRating: Math.floor(Math.random() * 1000),
                territoryControlled: Math.floor(Math.random() * 20),
                alliancesFormed: Math.floor(Math.random() * 15),
                betrayalsCommitted: Math.floor(Math.random() * 5),
            },
            preferences: {
                preferredActivities: ['heists', 'missions', 'pvp', 'roleplay'].slice(0, Math.floor(Math.random() * 3) + 1),
                playstyle: playstyles[Math.floor(Math.random() * playstyles.length)] as 'aggressive' | 'diplomatic' | 'strategic' | 'social',
                riskTolerance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
                teamwork: ['solo', 'small-group', 'large-group'][Math.floor(Math.random() * 3)] as 'solo' | 'small-group' | 'large-group',
                communication: ['text', 'voice', 'mixed'][Math.floor(Math.random() * 3)] as 'text' | 'voice' | 'mixed',
            },
        })) as T;
    }

    if (endpoint.includes('/api/players/leaderboards')) {
        const mockPlayers = Array.from({ length: 20 }, (_, i) => ({
            id: `player-${i}`,
            username: `Player${i + 1}`,
            displayName: `Player ${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            faction: ['Los Santos Police', 'Grove Street', 'Ballas'][Math.floor(Math.random() * 3)],
            level: Math.floor(Math.random() * 100) + 1,
            reputation: Math.floor(Math.random() * 50000) + 1000,
            playtime: Math.floor(Math.random() * 1000000) + 10000,
            lastSeen: new Date(),
            status: 'online' as const,
            rank: 'Member',
            achievements: [],
            stats: {
                missionsCompleted: Math.floor(Math.random() * 500),
                heistsParticipated: Math.floor(Math.random() * 50),
                businessesOwned: Math.floor(Math.random() * 10),
                moneyEarned: Math.floor(Math.random() * 10000000),
                killDeathRatio: Math.random() * 3 + 0.5,
                criminalRating: Math.floor(Math.random() * 1000),
                socialRating: Math.floor(Math.random() * 1000),
                territoryControlled: Math.floor(Math.random() * 20),
                alliancesFormed: Math.floor(Math.random() * 15),
                betrayalsCommitted: Math.floor(Math.random() * 5),
            },
            preferences: {
                preferredActivities: ['heists'],
                playstyle: 'aggressive' as const,
                riskTolerance: 'high' as const,
                teamwork: 'small-group' as const,
                communication: 'voice' as const,
            },
        }));

        return {
            level: mockPlayers
                .sort((a, b) => b.level - a.level)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    score: player.level,
                    change: Math.floor(Math.random() * 10) - 5,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
            reputation: mockPlayers
                .sort((a, b) => b.reputation - a.reputation)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    score: player.reputation,
                    change: Math.floor(Math.random() * 1000) - 500,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
            playtime: mockPlayers
                .sort((a, b) => b.playtime - a.playtime)
                .slice(0, 10)
                .map((player, index) => ({
                    rank: index + 1,
                    player,
                    score: Math.floor(player.playtime / 3600), // Convert to hours
                    change: Math.floor(Math.random() * 20) - 10,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                })),
        } as T;
    }

    // Default fallback
    return {} as T;
}

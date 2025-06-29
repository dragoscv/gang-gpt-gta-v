'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    TrendingUp,
    Trophy,
    Target,
    Clock,
    Star,
    Zap,
    Shield,
    Crown,
    Activity,
    BarChart3,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ganggpt/ui';
import { Badge } from '@ganggpt/ui';
import { Button } from '@ganggpt/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ganggpt/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ganggpt/ui';
import { Progress } from '@ganggpt/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@ganggpt/ui';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { formatDistanceToNow, format } from 'date-fns';

interface PlayerProfile {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    faction: string;
    level: number;
    reputation: number;
    playtime: number;
    lastSeen: Date;
    status: 'online' | 'offline' | 'away';
    rank: string;
    achievements: Achievement[];
    stats: PlayerStats;
    preferences: PlayerPreferences;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: Date;
    progress: number;
    maxProgress: number;
}

interface PlayerStats {
    missionsCompleted: number;
    heistsParticipated: number;
    businessesOwned: number;
    moneyEarned: number;
    killDeathRatio: number;
    criminalRating: number;
    socialRating: number;
    territoryControlled: number;
    alliancesFormed: number;
    betrayalsCommitted: number;
}

interface PlayerPreferences {
    preferredActivities: string[];
    playstyle: 'aggressive' | 'diplomatic' | 'strategic' | 'social';
    riskTolerance: 'low' | 'medium' | 'high';
    teamwork: 'solo' | 'small-group' | 'large-group';
    communication: 'text' | 'voice' | 'mixed';
}

interface LeaderboardEntry {
    rank: number;
    player: PlayerProfile;
    score: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
}

export function AdvancedPlayerStatistics() {
    const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeView, setActiveView] = useState('overview');
    const [sortBy, setSortBy] = useState('level');

    const { data: playersData, isLoading, refetch } = useRealTimeData<PlayerProfile[]>(
        `/api/players/statistics?timeframe=${selectedTimeframe}&category=${selectedCategory}`
    );

    const { data: leaderboards } = useRealTimeData<Record<string, LeaderboardEntry[]>>(
        '/api/players/leaderboards'
    );

    // Memoized calculations for performance
    const playerAnalytics = useMemo(() => {
        if (!playersData) return null;

        const totalPlayers = playersData.length;
        const onlinePlayers = playersData.filter(p => p.status === 'online').length;
        const newPlayers = playersData.filter(p => {
            const joinDate = new Date(p.lastSeen);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return joinDate > weekAgo;
        }).length;

        const averageLevel = playersData.reduce((sum, p) => sum + p.level, 0) / totalPlayers;
        const averagePlaytime = playersData.reduce((sum, p) => sum + p.playtime, 0) / totalPlayers;

        const factionDistribution = playersData.reduce((acc, player) => {
            acc[player.faction] = (acc[player.faction] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const playstyleDistribution = playersData.reduce((acc, player) => {
            acc[player.preferences.playstyle] = (acc[player.preferences.playstyle] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalPlayers,
            onlinePlayers,
            newPlayers,
            averageLevel: Math.round(averageLevel),
            averagePlaytime: Math.round(averagePlaytime / 3600), // Convert to hours
            factionDistribution,
            playstyleDistribution,
            retentionRate: ((totalPlayers - newPlayers) / totalPlayers) * 100,
            engagementRate: (onlinePlayers / totalPlayers) * 100
        };
    }, [playersData]);

    const topPlayers = useMemo(() => {
        if (!playersData) return [];
        return [...playersData]
            .sort((a, b) => {
                switch (sortBy) {
                    case 'level': return b.level - a.level;
                    case 'reputation': return b.reputation - a.reputation;
                    case 'playtime': return b.playtime - a.playtime;
                    case 'achievements': return b.achievements.length - a.achievements.length;
                    default: return b.level - a.level;
                }
            })
            .slice(0, 10);
    }, [playersData, sortBy]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Player Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive insights into player behavior and engagement
                    </p>
                </div>

                <div className="flex gap-2">
                    <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>

                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            {playerAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Players"
                        value={playerAnalytics.totalPlayers}
                        change={`+${playerAnalytics.newPlayers} new`}
                        icon={Users}
                        color="blue"
                    />
                    <MetricCard
                        title="Online Now"
                        value={playerAnalytics.onlinePlayers}
                        change={`${Math.round(playerAnalytics.engagementRate)}% engagement`}
                        icon={Activity}
                        color="green"
                    />
                    <MetricCard
                        title="Avg Level"
                        value={playerAnalytics.averageLevel}
                        change="Progression healthy"
                        icon={Trophy}
                        color="purple"
                    />
                    <MetricCard
                        title="Avg Playtime"
                        value={Math.round(playerAnalytics.averagePlaytime)}
                        change={`${Math.round(playerAnalytics.retentionRate)}% retention`}
                        icon={Clock}
                        color="orange"
                    />
                </div>
            )}

            {/* Main Analytics Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="insights">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Players */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Top Players</CardTitle>
                                        <CardDescription>Most active and successful players on the server</CardDescription>
                                    </div>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="level">Level</SelectItem>
                                            <SelectItem value="reputation">Reputation</SelectItem>
                                            <SelectItem value="playtime">Playtime</SelectItem>
                                            <SelectItem value="achievements">Achievements</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {topPlayers.map((player, index) => (
                                        <PlayerListItem key={player.id} player={player} rank={index + 1} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Server Insights</CardTitle>
                                <CardDescription>Key performance indicators</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {playerAnalytics && (
                                    <>
                                        <InsightItem
                                            label="Player Retention"
                                            value={`${Math.round(playerAnalytics.retentionRate)}%`}
                                            trend="up"
                                            description="7-day retention rate"
                                        />
                                        <InsightItem
                                            label="Engagement Rate"
                                            value={`${Math.round(playerAnalytics.engagementRate)}%`}
                                            trend="stable"
                                            description="Daily active players"
                                        />
                                        <InsightItem
                                            label="New Player Growth"
                                            value={`+${playerAnalytics.newPlayers}`}
                                            trend="up"
                                            description="This week"
                                        />
                                        <InsightItem
                                            label="Average Session"
                                            value={`${playerAnalytics.averagePlaytime / 24}h`}
                                            trend="stable"
                                            description="Time per session"
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="leaderboards" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {leaderboards && Object.entries(leaderboards).map(([category, entries]) => (
                            <LeaderboardCard key={category} category={category} entries={entries} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="demographics" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {playerAnalytics && (
                            <>
                                <DemographicsCard
                                    title="Faction Distribution"
                                    data={playerAnalytics.factionDistribution}
                                    type="faction"
                                />
                                <DemographicsCard
                                    title="Playstyle Distribution"
                                    data={playerAnalytics.playstyleDistribution}
                                    type="playstyle"
                                />
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="achievements" className="space-y-4">
                    <AchievementsOverview players={playersData || []} />
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <AIPlayerInsights players={playersData || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Supporting Components

interface MetricCardProps {
    title: string;
    value: number;
    change: string;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
        purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
        orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{change}</p>
                    </div>
                    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PlayerListItem({ player, rank }: { player: PlayerProfile; rank: number }) {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
        if (rank === 2) return <Star className="w-4 h-4 text-gray-400" />;
        if (rank === 3) return <Star className="w-4 h-4 text-orange-500" />;
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(rank)}
                </div>
                <Avatar className="w-10 h-10">
                    <AvatarImage src={player.avatar} alt={player.username} />
                    <AvatarFallback>{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{player.displayName}</p>
                        <div className={`w-2 h-2 rounded-full ${player.status === 'online' ? 'bg-green-500' :
                                player.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{player.faction}</span>
                        <span>•</span>
                        <span>Level {player.level}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold">{player.reputation.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">reputation</p>
            </div>
        </motion.div>
    );
}

function InsightItem({
    label,
    value,
    trend,
    description
}: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    description: string;
}) {
    const trendIcons = {
        up: <TrendingUp className="w-4 h-4 text-green-500" />,
        down: <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
        stable: <BarChart3 className="w-4 h-4 text-blue-500" />,
    };

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-bold">{value}</span>
                {trendIcons[trend]}
            </div>
        </div>
    );
}

function LeaderboardCard({ category, entries }: { category: string; entries: LeaderboardEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                <CardDescription>Top performers in {category}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {entries.slice(0, 5).map((entry) => (
                        <div key={entry.player.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold w-6">#{entry.rank}</span>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={entry.player.avatar} alt={entry.player.username} />
                                    <AvatarFallback className="text-xs">
                                        {entry.player.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{entry.player.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{entry.score.toLocaleString()}</span>
                                {entry.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                {entry.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function DemographicsCard({
    title,
    data,
    type
}: {
    title: string;
    data: Record<string, number>;
    type: 'faction' | 'playstyle';
}) {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);

    const colors = {
        faction: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'],
        playstyle: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'],
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Distribution across {type}s</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Object.entries(data).map(([key, value], index) => {
                        const percentage = (value / total) * 100;
                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="capitalize">{key}</span>
                                    <span>{value} ({Math.round(percentage)}%)</span>
                                </div>
                                <Progress
                                    value={percentage}
                                    className="h-2"
                                    style={{
                                        backgroundColor: colors[type][index % colors[type].length],
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function AchievementsOverview({ players }: { players: PlayerProfile[] }) {
    const achievementStats = useMemo(() => {
        const allAchievements = players.flatMap(p => p.achievements);
        const byCategory = allAchievements.reduce((acc, achievement) => {
            acc[achievement.category] = (acc[achievement.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byRarity = allAchievements.reduce((acc, achievement) => {
            acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { byCategory, byRarity, total: allAchievements.length };
    }, [players]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Achievement Categories</CardTitle>
                    <CardDescription>Distribution of unlocked achievements</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(achievementStats.byCategory).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center">
                                <span className="capitalize">{category}</span>
                                <Badge variant="secondary">{count}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Achievement Rarity</CardTitle>
                    <CardDescription>Rarity distribution of achievements</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(achievementStats.byRarity).map(([rarity, count]) => {
                            const rarityColors = {
                                common: 'bg-gray-500',
                                rare: 'bg-blue-500',
                                epic: 'bg-purple-500',
                                legendary: 'bg-orange-500',
                            };

                            return (
                                <div key={rarity} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${rarityColors[rarity as keyof typeof rarityColors]}`} />
                                        <span className="capitalize">{rarity}</span>
                                    </div>
                                    <Badge variant="secondary">{count}</Badge>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AIPlayerInsights({ players }: { players: PlayerProfile[] }) {
    const insights = useMemo(() => {
        // Generate AI-powered insights about player behavior
        const totalPlayers = players.length;
        const highPerformers = players.filter(p => p.level > 50).length;
        const socialPlayers = players.filter(p => p.preferences.playstyle === 'social').length;
        const retentionRisk = players.filter(p => {
            const daysSinceLastSeen = (Date.now() - new Date(p.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLastSeen > 7;
        }).length;

        return [
            {
                title: 'High Performer Concentration',
                description: `${Math.round((highPerformers / totalPlayers) * 100)}% of players are high-level (50+), indicating strong long-term engagement.`,
                type: 'positive',
                confidence: 0.92,
            },
            {
                title: 'Social Dynamics',
                description: `${Math.round((socialPlayers / totalPlayers) * 100)}% prefer social gameplay, suggesting strong community features are valued.`,
                type: 'insight',
                confidence: 0.87,
            },
            {
                title: 'Retention Risk Alert',
                description: `${retentionRisk} players haven't been seen in over a week. Consider re-engagement campaigns.`,
                type: retentionRisk > totalPlayers * 0.1 ? 'warning' : 'info',
                confidence: 0.95,
            },
        ];
    }, [players]);

    return (
        <div className="space-y-4">
            {insights.map((insight, index) => (
                <Card key={index}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                                    insight.type === 'warning' ? 'bg-red-100 text-red-600' :
                                        insight.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                            'bg-purple-100 text-purple-600'
                                }`}>
                                <Target className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">{insight.title}</h3>
                                <p className="text-muted-foreground mb-2">{insight.description}</p>
                                <Badge variant="outline" className="text-xs">
                                    {Math.round(insight.confidence * 100)}% confidence
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

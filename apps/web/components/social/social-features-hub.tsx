'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    MessageSquare,
    Trophy,
    Star,
    Shield,
    Crown,
    Heart,
    UserPlus,
    UserMinus,
    Search,
    Filter,
    Calendar,
    MapPin,
    Clock,
    ThumbsUp,
    Award,
    Target,
    Handshake
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ganggpt/ui';
import { Badge } from '@ganggpt/ui';
import { Button } from '@ganggpt/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ganggpt/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@ganggpt/ui';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { formatDistanceToNow } from 'date-fns';

interface PlayerProfile {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    faction: string;
    level: number;
    reputation: number;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: Date;
    joinedAt: Date;
    playtime: number;
    bio?: string;
    achievements: Achievement[];
    relationships: PlayerRelationship[];
    activity: RecentActivity[];
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: Date;
    progress: number;
    maxProgress: number;
}

interface PlayerRelationship {
    id: string;
    playerId: string;
    playerName: string;
    playerAvatar?: string;
    type: 'friend' | 'ally' | 'rival' | 'enemy';
    strength: number; // 0-100
    establishedAt: Date;
    lastInteraction: Date;
    interactions: number;
}

interface RecentActivity {
    id: string;
    type: 'achievement' | 'mission' | 'social' | 'combat' | 'economic';
    description: string;
    timestamp: Date;
    participants?: string[];
    location?: string;
    reward?: number;
}

interface SocialEvent {
    id: string;
    title: string;
    description: string;
    type: 'faction_meeting' | 'heist_planning' | 'tournament' | 'celebration';
    organizer: string;
    participants: string[];
    maxParticipants: number;
    startTime: Date;
    endTime: Date;
    location: string;
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
    requirements?: {
        level?: number;
        faction?: string;
        reputation?: number;
    };
}

interface LeaderboardEntry {
    rank: number;
    player: PlayerProfile;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
}

export function SocialFeaturesHub() {
    const [activeView, setActiveView] = useState('profiles');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const { data: players } = useRealTimeData<PlayerProfile[]>('/api/social/players');
    const { data: events } = useRealTimeData<SocialEvent[]>('/api/social/events');
    const { data: leaderboards } = useRealTimeData<Record<string, LeaderboardEntry[]>>('/api/social/leaderboards');

    // Filter players based on search and filter criteria
    const filteredPlayers = useMemo(() => {
        if (!players) return [];

        let filtered = players.filter(player =>
            player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.faction.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (selectedFilter !== 'all') {
            filtered = filtered.filter(player => {
                switch (selectedFilter) {
                    case 'online': return player.status === 'online';
                    case 'friends': return player.relationships.some(r => r.type === 'friend');
                    case 'faction': return true; // Would filter by user's faction
                    case 'high-level': return player.level >= 50;
                    default: return true;
                }
            });
        }

        return filtered;
    }, [players, searchTerm, selectedFilter]);

    const upcomingEvents = useMemo(() => {
        return events?.filter(event => event.status === 'upcoming').slice(0, 5) || [];
    }, [events]);

    const topAchievers = useMemo(() => {
        if (!players) return [];
        return players
            .sort((a, b) => b.achievements.length - a.achievements.length)
            .slice(0, 5);
    }, [players]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Hub</h1>
                    <p className="text-muted-foreground">
                        Connect with players, track achievements, and participate in events
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Players</option>
                        <option value="online">Online Now</option>
                        <option value="friends">Friends</option>
                        <option value="faction">Same Faction</option>
                        <option value="high-level">High Level (50+)</option>
                    </select>
                </div>
            </div>

            {/* Social Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SocialStatCard
                    title="Online Players"
                    value={players?.filter(p => p.status === 'online').length || 0}
                    icon={Users}
                    color="green"
                    description="Currently active"
                />
                <SocialStatCard
                    title="Active Events"
                    value={events?.filter(e => e.status === 'active').length || 0}
                    icon={Calendar}
                    color="blue"
                    description="Happening now"
                />
                <SocialStatCard
                    title="Total Friendships"
                    value={players?.reduce((sum, p) => sum + p.relationships.filter(r => r.type === 'friend').length, 0) || 0}
                    icon={Heart}
                    color="pink"
                    description="Server connections"
                />
                <SocialStatCard
                    title="Achievements Today"
                    value={players?.reduce((sum, p) => sum + p.achievements.filter(a =>
                        new Date(a.unlockedAt).toDateString() === new Date().toDateString()
                    ).length, 0) || 0}
                    icon={Trophy}
                    color="orange"
                    description="Unlocked today"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profiles">Profiles</TabsTrigger>
                    <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="relationships">Relationships</TabsTrigger>
                    <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                </TabsList>

                <TabsContent value="profiles" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlayers.map((player, index) => (
                            <PlayerProfileCard key={player.id} player={player} index={index} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="leaderboards" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {leaderboards && Object.entries(leaderboards).map(([category, entries]) => (
                            <LeaderboardCard key={category} category={category} entries={entries.slice(0, 10)} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <UpcomingEventsCard events={upcomingEvents} />
                        <CreateEventCard />
                    </div>
                </TabsContent>

                <TabsContent value="achievements" className="space-y-4">
                    <AchievementsShowcase players={players || []} />
                </TabsContent>

                <TabsContent value="relationships" className="space-y-4">
                    <RelationshipNetwork players={players || []} />
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <ActivityFeed players={players || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Supporting Components

interface SocialStatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: 'green' | 'blue' | 'pink' | 'orange';
    description: string;
}

function SocialStatCard({ title, value, icon: Icon, color, description }: SocialStatCardProps) {
    const colorClasses = {
        green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
        blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        pink: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
        orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PlayerProfileCard({ player, index }: { player: PlayerProfile; index: number }) {
    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
        offline: 'bg-gray-500',
    };

    const friendsCount = player.relationships.filter(r => r.type === 'friend').length;
    const rivalsCount = player.relationships.filter(r => r.type === 'rival' || r.type === 'enemy').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <Avatar className="w-16 h-16">
                                <AvatarImage src={player.avatar} alt={player.username} />
                                <AvatarFallback>
                                    {player.displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${statusColors[player.status]}`} />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{player.displayName}</h3>
                                {player.level >= 75 && <Crown className="w-4 h-4 text-yellow-500" />}
                                {player.reputation > 10000 && <Star className="w-4 h-4 text-blue-500" />}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Badge variant="outline" className="text-xs">{player.faction}</Badge>
                                <span>Level {player.level}</span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {player.bio || "No bio available"}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {friendsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3" />
                                        {player.achievements.length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        {rivalsCount}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                        <UserPlus className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <MessageSquare className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function LeaderboardCard({ category, entries }: { category: string; entries: LeaderboardEntry[] }) {
    const categoryIcons = {
        level: Trophy,
        reputation: Star,
        playtime: Clock,
        achievements: Award,
        social: Users,
    };

    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Trophy;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} Leaders
                </CardTitle>
                <CardDescription>Top performers in {category}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {entries.map((entry, index) => (
                        <div key={entry.player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold w-6 ${index === 0 ? 'text-yellow-500' :
                                        index === 1 ? 'text-gray-400' :
                                            index === 2 ? 'text-orange-500' : 'text-muted-foreground'
                                    }`}>
                                    #{entry.rank}
                                </span>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={entry.player.avatar} alt={entry.player.username} />
                                    <AvatarFallback className="text-xs">
                                        {entry.player.displayName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{entry.player.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{entry.player.faction}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">{entry.value.toLocaleString()}</p>
                                <div className="flex items-center gap-1">
                                    {entry.trend === 'up' && <span className="text-green-500 text-xs">↗</span>}
                                    {entry.trend === 'down' && <span className="text-red-500 text-xs">↘</span>}
                                    {entry.trend === 'stable' && <span className="text-gray-500 text-xs">→</span>}
                                    <span className="text-xs text-muted-foreground">
                                        {entry.change > 0 ? '+' : ''}{entry.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function UpcomingEventsCard({ events }: { events: SocialEvent[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Events
                </CardTitle>
                <CardDescription>Join community events and activities</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                    {event.participants.length}/{event.maxParticipants}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(event.startTime)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline">
                                    Join Event
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function CreateEventCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Event
                </CardTitle>
                <CardDescription>Organize your own community events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <input
                    type="text"
                    placeholder="Event title..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                    placeholder="Event description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="datetime-local"
                        className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                        type="text"
                        placeholder="Location"
                        className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <Button className="w-full">
                    Create Event
                </Button>
            </CardContent>
        </Card>
    );
}

function AchievementsShowcase({ players }: { players: PlayerProfile[] }) {
    const recentAchievements = useMemo(() => {
        const allAchievements = players.flatMap(player =>
            player.achievements.map(achievement => ({
                ...achievement,
                playerName: player.displayName,
                playerAvatar: player.avatar,
            }))
        );

        return allAchievements
            .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
            .slice(0, 12);
    }, [players]);

    const rarityColors = {
        common: 'bg-gray-100 text-gray-800 border-gray-200',
        rare: 'bg-blue-100 text-blue-800 border-blue-200',
        epic: 'bg-purple-100 text-purple-800 border-purple-200',
        legendary: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                    <CardDescription>Latest accomplishments across the server</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentAchievements.map((achievement, index) => (
                            <motion.div
                                key={`${achievement.id}-${achievement.playerName}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-lg border ${rarityColors[achievement.rarity]}`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={achievement.playerAvatar} alt={achievement.playerName} />
                                        <AvatarFallback className="text-xs">
                                            {achievement.playerName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{achievement.playerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(achievement.unlockedAt)} ago
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {achievement.rarity}
                                    </Badge>
                                </div>
                                <h4 className="font-semibold mb-1">{achievement.name}</h4>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function RelationshipNetwork({ players }: { players: PlayerProfile[] }) {
    const relationshipStats = useMemo(() => {
        const allRelationships = players.flatMap(p => p.relationships);
        const friendships = allRelationships.filter(r => r.type === 'friend').length;
        const alliances = allRelationships.filter(r => r.type === 'ally').length;
        const rivalries = allRelationships.filter(r => r.type === 'rival').length;
        const conflicts = allRelationships.filter(r => r.type === 'enemy').length;

        return { friendships, alliances, rivalries, conflicts };
    }, [players]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{relationshipStats.friendships}</p>
                        <p className="text-sm text-muted-foreground">Friendships</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Handshake className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{relationshipStats.alliances}</p>
                        <p className="text-sm text-muted-foreground">Alliances</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{relationshipStats.rivalries}</p>
                        <p className="text-sm text-muted-foreground">Rivalries</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Shield className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{relationshipStats.conflicts}</p>
                        <p className="text-sm text-muted-foreground">Conflicts</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ActivityFeed({ players }: { players: PlayerProfile[] }) {
    const activities = useMemo(() => {
        const allActivities = players.flatMap(player =>
            player.activity.map(activity => ({
                ...activity,
                playerName: player.displayName,
                playerAvatar: player.avatar,
                playerFaction: player.faction,
            }))
        );

        return allActivities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);
    }, [players]);

    const activityIcons = {
        achievement: Trophy,
        mission: Target,
        social: Users,
        combat: Shield,
        economic: Star,
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Real-time server activity from all players</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {activities.map((activity, index) => {
                        const Icon = activityIcons[activity.type];

                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                                <div className="flex-shrink-0">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={activity.playerAvatar} alt={activity.playerName} />
                                        <AvatarFallback className="text-xs">
                                            {activity.playerName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{activity.playerName}</span>
                                        <Badge variant="outline" className="text-xs">{activity.playerFaction}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatDistanceToNow(activity.timestamp)} ago</span>
                                        {activity.location && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {activity.location}
                                                </span>
                                            </>
                                        )}
                                        {activity.reward && (
                                            <>
                                                <span>•</span>
                                                <span className="text-green-600">${activity.reward.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

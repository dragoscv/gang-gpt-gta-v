'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Users,
    Zap,
    TrendingUp,
    AlertTriangle,
    Shield,
    Brain,
    Globe,
    Clock,
    Target,
    Gamepad2,
    Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ganggpt/ui';
import { Badge } from '@ganggpt/ui';
import { Progress } from '@ganggpt/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ganggpt/ui';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { formatDistanceToNow } from 'date-fns';

interface ServerMetrics {
    playerCount: number;
    maxPlayers: number;
    serverLoad: number;
    aiResponseTime: number;
    uptime: number;
    activeEvents: number;
    factionsActive: number;
    economyHealth: number;
}

interface PlayerActivity {
    id: string;
    username: string;
    faction: string;
    activity: string;
    location: string;
    timestamp: Date;
    status: 'online' | 'busy' | 'away';
}

interface AIInsight {
    id: string;
    type: 'performance' | 'behavior' | 'prediction' | 'alert';
    title: string;
    description: string;
    confidence: number;
    timestamp: Date;
    actionable: boolean;
}

export function RealTimeDashboard() {
    const { data: serverMetrics, isLoading } = useRealTimeData<ServerMetrics>('/api/metrics/server');
    const { data: playerActivity } = useRealTimeData<PlayerActivity[]>('/api/metrics/activity');
    const { data: aiInsights } = useRealTimeData<AIInsight[]>('/api/ai/insights');

    const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
    const [activeView, setActiveView] = useState('overview');

    // Memoized calculations for performance
    const serverHealth = useMemo(() => {
        if (!serverMetrics) return 0;
        const loadScore = Math.max(0, 100 - serverMetrics.serverLoad);
        const performanceScore = Math.max(0, 100 - (serverMetrics.aiResponseTime / 10));
        const capacityScore = (serverMetrics.playerCount / serverMetrics.maxPlayers) * 50; // Half weight
        return Math.round((loadScore + performanceScore + capacityScore) / 3);
    }, [serverMetrics]);

    const recentActivity = useMemo(() => {
        return playerActivity?.slice(0, 8) || [];
    }, [playerActivity]);

    const criticalInsights = useMemo(() => {
        return aiInsights?.filter(insight =>
            insight.type === 'alert' || insight.confidence > 0.85
        ).slice(0, 5) || [];
    }, [aiInsights]);

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
                    <h1 className="text-3xl font-bold tracking-tight">GangGPT Server Dashboard</h1>
                    <p className="text-muted-foreground">
                        Real-time insights and analytics for your AI-powered GTA V server
                    </p>
                </div>

                <div className="flex gap-2">
                    <Badge variant={serverHealth > 80 ? 'success' : serverHealth > 60 ? 'warning' : 'destructive'}>
                        <Activity className="w-3 h-3 mr-1" />
                        Server Health: {serverHealth}%
                    </Badge>
                    <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Last Updated: {formatDistanceToNow(new Date())} ago
                    </Badge>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Active Players"
                    value={serverMetrics?.playerCount || 0}
                    max={serverMetrics?.maxPlayers || 1000}
                    icon={Users}
                    trend="+12% from yesterday"
                    color="blue"
                />
                <MetricCard
                    title="AI Response Time"
                    value={`${serverMetrics?.aiResponseTime || 0}ms`}
                    icon={Brain}
                    trend="Within optimal range"
                    color="green"
                />
                <MetricCard
                    title="Active Events"
                    value={serverMetrics?.activeEvents || 0}
                    icon={Zap}
                    trend="3 new missions generated"
                    color="purple"
                />
                <MetricCard
                    title="Server Load"
                    value={`${serverMetrics?.serverLoad || 0}%`}
                    icon={Activity}
                    trend="Stable performance"
                    color="orange"
                />
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="players">Players</TabsTrigger>
                    <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Server Status */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Server Status Overview
                                </CardTitle>
                                <CardDescription>
                                    Real-time monitoring of server components and health metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>CPU Usage</span>
                                            <span>{serverMetrics?.serverLoad || 0}%</span>
                                        </div>
                                        <Progress value={serverMetrics?.serverLoad || 0} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Player Capacity</span>
                                            <span>
                                                {serverMetrics?.playerCount || 0}/{serverMetrics?.maxPlayers || 1000}
                                            </span>
                                        </div>
                                        <Progress
                                            value={((serverMetrics?.playerCount || 0) / (serverMetrics?.maxPlayers || 1000)) * 100}
                                            className="h-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Active Factions</span>
                                            <span>{serverMetrics?.factionsActive || 0}</span>
                                        </div>
                                        <Progress value={(serverMetrics?.factionsActive || 0) * 10} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Economy Health</span>
                                            <span>{serverMetrics?.economyHealth || 0}%</span>
                                        </div>
                                        <Progress value={serverMetrics?.economyHealth || 0} className="h-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <QuickActionButton
                                    icon={Shield}
                                    title="Emergency Mode"
                                    description="Activate server protection"
                                    variant="destructive"
                                />
                                <QuickActionButton
                                    icon={Brain}
                                    title="AI Calibration"
                                    description="Optimize AI responses"
                                    variant="default"
                                />
                                <QuickActionButton
                                    icon={Gamepad2}
                                    title="Event Generator"
                                    description="Create new missions"
                                    variant="secondary"
                                />
                                <QuickActionButton
                                    icon={Users}
                                    title="Player Management"
                                    description="Moderate players"
                                    variant="outline"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="players" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Player Activity</CardTitle>
                            <CardDescription>
                                Live feed of player actions and interactions across the server
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${activity.status === 'online' ? 'bg-green-500' :
                                                        activity.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                                                    }`} />
                                                <div>
                                                    <p className="font-medium">{activity.username}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {activity.activity} in {activity.location}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-xs">
                                                    {activity.faction}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(activity.timestamp)} ago
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai-insights" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5" />
                                AI-Generated Insights
                            </CardTitle>
                            <CardDescription>
                                Machine learning insights and recommendations for server optimization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {criticalInsights.map((insight, index) => (
                                    <motion.div
                                        key={insight.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-4 rounded-lg border ${insight.type === 'alert' ? 'border-destructive bg-destructive/5' :
                                                insight.confidence > 0.9 ? 'border-primary bg-primary/5' :
                                                    'border-border bg-background'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                                                    {insight.type === 'performance' && <TrendingUp className="w-4 h-4 text-primary" />}
                                                    {insight.type === 'behavior' && <Users className="w-4 h-4 text-blue-500" />}
                                                    {insight.type === 'prediction' && <Brain className="w-4 h-4 text-purple-500" />}
                                                    <h4 className="font-medium">{insight.title}</h4>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {insight.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {Math.round(insight.confidence * 100)}% confidence
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(insight.timestamp)} ago
                                                    </span>
                                                    {insight.actionable && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Actionable
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                                <CardDescription>
                                    Server performance indicators and optimization opportunities
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <PerformanceMetric
                                        label="Response Time"
                                        value={`${serverMetrics?.aiResponseTime || 0}ms`}
                                        target="< 200ms"
                                        status={serverMetrics && serverMetrics.aiResponseTime < 200 ? 'good' : 'warning'}
                                    />
                                    <PerformanceMetric
                                        label="Uptime"
                                        value={`${Math.round((serverMetrics?.uptime || 0) / 3600)}h`}
                                        target="99.9%"
                                        status="good"
                                    />
                                    <PerformanceMetric
                                        label="Memory Usage"
                                        value="68%"
                                        target="< 80%"
                                        status="good"
                                    />
                                    <PerformanceMetric
                                        label="Database Queries"
                                        value="45ms avg"
                                        target="< 100ms"
                                        status="good"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Health</CardTitle>
                                <CardDescription>
                                    Overall system status and component health monitoring
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <SystemComponent name="Web Server" status="healthy" uptime="99.9%" />
                                    <SystemComponent name="Database" status="healthy" uptime="99.8%" />
                                    <SystemComponent name="AI Service" status="healthy" uptime="99.7%" />
                                    <SystemComponent name="Redis Cache" status="healthy" uptime="99.9%" />
                                    <SystemComponent name="RAGE:MP" status="healthy" uptime="99.6%" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Supporting Components

interface MetricCardProps {
    title: string;
    value: string | number;
    max?: number;
    icon: React.ElementType;
    trend: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, max, icon: Icon, trend, color }: MetricCardProps) {
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
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </p>
                            {max && (
                                <span className="text-sm text-muted-foreground">/ {max.toLocaleString()}</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                    </div>
                    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface QuickActionButtonProps {
    icon: React.ElementType;
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
}

function QuickActionButton({ icon: Icon, title, description, variant }: QuickActionButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 rounded-lg text-left transition-colors ${variant === 'destructive' ? 'bg-destructive/10 hover:bg-destructive/20 border border-destructive/20' :
                    variant === 'secondary' ? 'bg-secondary hover:bg-secondary/80' :
                        variant === 'outline' ? 'border border-border hover:bg-accent' :
                            'bg-primary/10 hover:bg-primary/20 border border-primary/20'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
        </motion.button>
    );
}

interface PerformanceMetricProps {
    label: string;
    value: string;
    target: string;
    status: 'good' | 'warning' | 'error';
}

function PerformanceMetric({ label, value, target, status }: PerformanceMetricProps) {
    const statusColors = {
        good: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
    };

    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">Target: {target}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold ${statusColors[status]}`}>{value}</p>
                <div className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-green-500' :
                        status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
            </div>
        </div>
    );
}

interface SystemComponentProps {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
}

function SystemComponent({ name, status, uptime }: SystemComponentProps) {
    const statusConfig = {
        healthy: { color: 'bg-green-500', text: 'Healthy' },
        warning: { color: 'bg-yellow-500', text: 'Warning' },
        error: { color: 'bg-red-500', text: 'Error' },
    };

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusConfig[status].color}`} />
                <span className="font-medium">{name}</span>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium">{statusConfig[status].text}</p>
                <p className="text-xs text-muted-foreground">{uptime} uptime</p>
            </div>
        </div>
    );
}

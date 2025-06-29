'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Target } from 'lucide-react';
import { apiClient } from '@/lib/trpc';

interface ServerStats {
  players: {
    total: number;
    online: number;
  };
  factions: {
    total: number;
    activeEvents: number;
  };
  world: {
    territories: number;
    activeEvents: number;
    stats: any;
  };
  economy: {
    marketItems: number;
    indicators: any;
    stats: any;
  };
  server: {
    onlinePlayers: number;
    maxPlayers: number;
    uptime: number;
    tickRate: number;
    memoryUsage: number;
    avgPing: number;
  };
  ai: {
    model: string;
    status: string;
  };
  cache: any;
}

interface StatItem {
  icon: any;
  value: string;
  label: string;
  change: string;
  color: string;
}

export function Statistics() {
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Initialize client-side time
    setCurrentTime(new Date().toLocaleTimeString());

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);
  // Only execute on the client side
  useEffect(() => {
    // Avoid running on server
    if (typeof window === 'undefined') {
      return;
    }

    const fetchStats = async () => {
      try {
        console.log('Fetching statistics data...');

        // Use our apiClient to fetch stats
        try {
          console.log('Attempting to fetch stats with apiClient.getStats()');
          const data = await apiClient.getStats();
          console.log('Stats data received:', data);
          setServerStats(data as ServerStats);
          setError(null);
          return;
        } catch (statsError: any) {
          console.error('apiClient.getStats failed:', statsError);
        }

        // Try direct REST API as a fallback
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4828';
          const restUrl = `${baseUrl}/api/stats`;
          console.log(`Trying direct REST API URL: ${restUrl}`);

          const response = await fetch(restUrl);
          if (!response.ok) {
            throw new Error(`REST API failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('REST API data received:', data);
          setServerStats(data as ServerStats);
          setError(null);
        } catch (restError: any) {
          console.error('Direct REST fetch failed:', restError);
          throw restError; // Let the outer catch handle it
        }
      } catch (err: any) {
        console.error('Failed to fetch stats with all methods:', err);
        setError(err.message);

        // Create mock data as last resort
        console.log('Creating mock data as last resort');
        setServerStats({
          players: { total: 9, online: 0 },
          factions: { total: 0, activeEvents: 1 },
          world: { territories: 5, activeEvents: 0, stats: {} },
          economy: { marketItems: 6, indicators: {}, stats: {} },
          server: { onlinePlayers: 0, maxPlayers: 1000, uptime: 99.9, tickRate: 40, memoryUsage: 20, avgPing: 32 },
          ai: { model: 'gpt-4o-mini', status: 'operational' },
          cache: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const displayStats: StatItem[] = [
    {
      icon: Users,
      value: loading ? '...' : error ? 'N/A' : serverStats?.players.online.toString() || '0',
      label: 'Active Players',
      change: loading ? '' : '+12%',
      color: 'blue-500',
    },
    {
      icon: Zap,
      value: loading ? '...' : error ? 'N/A' : '∞',
      label: 'AI Interactions',
      change: loading ? '' : 'Daily',
      color: 'yellow-500',
    },
    {
      icon: Target,
      value: loading ? '...' : error ? 'N/A' : serverStats?.world.activeEvents.toString() || '0',
      label: 'Active Events',
      change: loading ? '' : '+250%',
      color: 'red-500',
    },
    {
      icon: TrendingUp,
      value: loading ? '...' : error ? 'N/A' : '99.9%',
      label: 'Server Uptime',
      change: 'This Month',
      color: 'green-500',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('statistics-section');
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  if (error) {
    return (
      <section id="statistics-section" className="py-24 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Server Statistics</h2>
          <p className="text-red-400">Failed to load statistics: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="statistics-section" className="py-24 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`
            text-5xl font-black text-white mb-6 transition-all duration-1000
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            Live Server{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Statistics
            </span>
          </h2>
          <p className={`
            text-xl text-white/80 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            See how our AI-powered world is thriving with real-time data from Los Santos.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div
                key={index}
                className={`
                  relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm bg-white/5
                  transition-all duration-1000 hover:scale-105 hover:border-white/20 hover:bg-white/10
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                `}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Background Glow */}
                <div className="absolute inset-0 rounded-2xl opacity-20 transition-opacity duration-500 hover:opacity-30 bg-gradient-to-br from-blue-500/20 to-transparent" />

                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-lg">
                    <Icon className={`h-8 w-8 text-${stat.color}`} />
                  </div>
                </div>

                {/* Value */}
                <div className="relative z-10 mb-4">
                  <div className="text-4xl font-black text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-white/90 mb-1">
                    {stat.label}
                  </div>
                  <div className={`text-sm font-medium text-${stat.color}`}>
                    {stat.change}
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className={`
          text-center mt-16 transition-all duration-1000 delay-800
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>          <p className="text-white/60 text-sm">
            Statistics updated every 30 seconds • Server Time: {currentTime}
          </p>
        </div>
      </div>
    </section>
  );
}

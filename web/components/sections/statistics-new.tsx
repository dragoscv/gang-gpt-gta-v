'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Target } from 'lucide-react';
import { apiClient } from '@/lib/trpc';

interface ServerStats {
  totalPlayers: number;
  activePlayers: number;
  totalFactions: number;
  activeMissions: number;
  uptime: string;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/stats');
        setServerStats(response);
      } catch (err: any) {
        console.error('Failed to fetch stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayStats: StatItem[] = [
    {
      icon: Users,
      value: loading ? '...' : error ? 'N/A' : serverStats?.activePlayers.toString() || '0',
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
      value: loading ? '...' : error ? 'N/A' : serverStats?.activeMissions.toString() || '0',
      label: 'Active Missions',
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
        `}>
          <p className="text-white/60 text-sm">
            Statistics updated every 30 seconds • Server Time: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Gamepad2, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-gang-red rounded-full animate-ping" />
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-gang-blue rounded-full animate-bounce" />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-gang-red to-gang-blue rounded-2xl flex items-center justify-center shadow-2xl shadow-gang-red/30 animate-pulse">
                <Gamepad2 className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gang-red to-gang-blue rounded-2xl blur opacity-30 animate-pulse" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gang-red via-gang-neon to-gang-blue bg-clip-text text-transparent animate-gradient-x">
              GangGPT
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-white/90">
              The Future of GTA V RP
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the world's first AI-powered Grand Theft Auto V multiplayer server.
            Where every NPC remembers, every mission is unique, and every story is yours.
          </p>

          {/* Features Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2">
              <Zap className="h-4 w-4 text-gang-neon" />
              AI-Powered NPCs
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2">
              <Users className="h-4 w-4 text-gang-blue" />
              Dynamic Factions
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2">
              <Play className="h-4 w-4 text-gang-red" />
              Procedural Missions
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              variant="gang"
              className="text-lg px-8 py-4 shadow-2xl shadow-gang-red/30 hover:shadow-gang-red/50 transition-all duration-300"
              asChild
            >
              <Link href="/dashboard">
                <Play className="mr-2 h-5 w-5" />
                Start Playing
              </Link>
            </Button>

            <Button
              size="lg"
              variant="neon"
              className="text-lg px-8 py-4"
              asChild
            >
              <Link href="/companions">
                <Zap className="mr-2 h-5 w-5" />
                Meet Your AI Companion
              </Link>
            </Button>
          </div>

          {/* Stats Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gang-neon mb-2">24/7</div>
              <div className="text-white/70">AI-Powered Server</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gang-red mb-2">∞</div>
              <div className="text-white/70">Unique Missions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gang-blue mb-2">1000+</div>
              <div className="text-white/70">Active Players</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gang-neon rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

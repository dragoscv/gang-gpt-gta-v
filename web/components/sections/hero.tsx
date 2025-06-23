'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Gamepad2, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RageLauncher } from '@/components/ui/rage-launcher';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse shadow-lg shadow-gang-neon/50" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-gang-red rounded-full animate-ping shadow-lg shadow-gang-red/50" />
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-gang-blue rounded-full animate-bounce shadow-lg shadow-gang-blue/50" />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse delay-500 shadow-lg shadow-gang-neon/50" />
        <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-gang-yellow rounded-full animate-ping delay-1000 shadow-sm shadow-gang-yellow/50" />
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-gang-purple rounded-full animate-pulse delay-300 shadow-lg shadow-gang-purple/50" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>          {/* Logo Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-r from-gang-red via-gang-neon to-gang-blue rounded-2xl flex items-center justify-center shadow-2xl shadow-gang-red/30 animate-pulse hover:animate-none transition-all duration-300 group-hover:scale-110">
                <Gamepad2 className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gang-red via-gang-neon to-gang-blue rounded-2xl blur-lg opacity-30 group-hover:opacity-60 animate-pulse transition-all duration-300" />
              <div className="absolute -inset-2 bg-gradient-to-r from-gang-red via-gang-neon to-gang-blue rounded-2xl blur-xl opacity-10 group-hover:opacity-30 transition-all duration-300" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gang-red via-gang-neon to-gang-blue bg-clip-text text-transparent animate-gradient-x bg-300% drop-shadow-lg">
              GangGPT
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-white/90 drop-shadow-md">
              The Future of GTA V RP
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the world's first AI-powered Grand Theft Auto V multiplayer server.
            Where every NPC remembers, every mission is unique, and every story is yours.
          </p>          {/* Features Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2 hover:bg-white/20 hover:border-gang-neon/50 hover:shadow-lg hover:shadow-gang-neon/20 transition-all duration-300 cursor-default group">
              <Zap className="h-4 w-4 text-gang-neon group-hover:animate-pulse" />
              <span className="font-medium">AI-Powered NPCs</span>
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2 hover:bg-white/20 hover:border-gang-blue/50 hover:shadow-lg hover:shadow-gang-blue/20 transition-all duration-300 cursor-default group">
              <Users className="h-4 w-4 text-gang-blue group-hover:animate-pulse" />
              <span className="font-medium">Dynamic Factions</span>
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90 flex items-center gap-2 hover:bg-white/20 hover:border-gang-red/50 hover:shadow-lg hover:shadow-gang-red/20 transition-all duration-300 cursor-default group">
              <Play className="h-4 w-4 text-gang-red group-hover:animate-pulse" />
              <span className="font-medium">Procedural Missions</span>
            </div>
          </div>          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <RageLauncher
              size="lg"
              variant="gang"
              className="text-lg px-8 py-4 shadow-2xl shadow-gang-red/30 hover:shadow-gang-red/50 hover:scale-105 transition-all duration-300 border border-transparent hover:border-gang-red/30"
            />

            <Button
              size="lg"
              variant="neon"
              className="text-lg px-8 py-4 hover:scale-105 transition-all duration-300"
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

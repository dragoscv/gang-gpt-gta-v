'use client';

import { useState } from 'react';
import { Brain, Users, Zap, Shield, Globe, Gamepad2 } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered NPCs',
    description: 'Every character remembers your interactions, develops relationships, and evolves their personality based on your choices.',
    color: 'gang-neon',
    bgColor: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    icon: Users,
    title: 'Dynamic Factions',
    description: 'Join or create factions with AI-driven politics, territory control, and ever-changing alliances that shape the world.',
    color: 'gang-blue',
    bgColor: 'from-blue-500/20 to-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Procedural Missions',
    description: 'No two missions are the same. AI generates unique challenges based on your playstyle, faction relationships, and world events.',
    color: 'gang-red',
    bgColor: 'from-red-500/20 to-pink-500/20',
  },
  {
    icon: Shield,
    title: 'Persistent World',
    description: 'Your actions have lasting consequences. The world continues to evolve even when you\'re offline, creating a living ecosystem.',
    color: 'gang-purple',
    bgColor: 'from-purple-500/20 to-indigo-500/20',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description: 'Play in Romanian or English with AI that understands cultural context and adapts to local roleplay styles.',
    color: 'gang-green',
    bgColor: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: Gamepad2,
    title: 'Next-Gen Technology',
    description: 'Built on RAGE:MP with cutting-edge AI integration, delivering the most advanced GTA V multiplayer experience.',
    color: 'gang-orange',
    bgColor: 'from-orange-500/20 to-yellow-500/20',
  },
];

export function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gang-red to-gang-blue bg-clip-text text-transparent">
              Revolutionary Features
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of roleplay gaming with AI technology that brings
            Los Santos to life like never before.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index} className={`
                  relative p-8 rounded-2xl border border-white/10 backdrop-blur-sm
                  transition-all duration-500 cursor-pointer group
                  ${isHovered ? `scale-105 border-white/20 bg-gradient-to-br ${feature.bgColor}` : 'hover:scale-105 hover:border-white/20 bg-white/5'}
                `}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full blur-3xl" />
                </div>

                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-xl mb-6 flex items-center justify-center
                  transition-all duration-500 relative z-10
                  ${isHovered ? 'bg-white/20 shadow-2xl' : 'bg-white/10'}
                `}>                  <Icon
                    className={`
                      h-8 w-8 transition-all duration-500
                      ${isHovered ? `text-${feature.color} scale-110 drop-shadow-glow` : 'text-white/80'}
                    `}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className={`
                    text-2xl font-bold mb-4 transition-all duration-500
                    ${isHovered ? 'text-white' : 'text-white/90'}
                  `}>
                    {feature.title}
                  </h3>
                  <p className={`
                    text-lg leading-relaxed transition-all duration-500
                    ${isHovered ? 'text-white/90' : 'text-white/70'}
                  `}>
                    {feature.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className={`
                  absolute inset-0 rounded-2xl transition-all duration-500
                  ${isHovered ? 'shadow-2xl shadow-white/10' : ''}
                `} />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-white/60 mb-8">
            Ready to experience the future of GTA V roleplay?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-gang-red to-gang-blue text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-gang-red/30 transition-all duration-300">
              Join the Revolution
            </button>
            <button className="px-8 py-4 border-2 border-gang-neon text-gang-neon font-semibold rounded-xl hover:bg-gang-neon hover:text-black transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

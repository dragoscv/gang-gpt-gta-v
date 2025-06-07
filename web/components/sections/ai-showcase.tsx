'use client';

import { useState } from 'react';
import { MessageCircle, Brain, Heart, Zap, User, Bot } from 'lucide-react';

const aiFeatures = [
  {
    title: 'Smart Conversations',
    description: 'NPCs remember your past interactions and respond with context-aware dialogue.',
    icon: MessageCircle,
    demo: {
      player: "Hey Marcus, remember when we robbed that bank last week?",
      npc: "Of course! That was intense. I still can't believe we got away with it. Are you planning something similar?",
      context: "Marcus remembers the shared experience and your criminal history together."
    }
  },
  {
    title: 'Emotional Intelligence',
    description: 'Characters develop feelings, hold grudges, and form deep relationships.',
    icon: Heart,
    demo: {
      player: "I need your help with something dangerous.",
      npc: "After what happened to Tony? I don't know... I'm still shaken up about losing him. Maybe we should lay low.",
      context: "Maria shows emotional response to previous traumatic events affecting her decision-making."
    }
  },
  {
    title: 'Dynamic Personalities',
    description: 'Each NPC has unique traits that evolve based on their experiences.',
    icon: Brain,
    demo: {
      player: "Want to start a new crew?",
      npc: "I've been thinking the same thing! After seeing how the Ballas operate, I think we could do better. I have some ideas...",
      context: "Jake's ambition has grown after observing other factions, shaping his personality."
    }
  }
];

export function AIShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-gang-neon/10 to-gang-blue/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gang-neon to-gang-blue bg-clip-text text-transparent">
                AI in Action
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Experience how our advanced AI creates living, breathing characters that
              remember, learn, and evolve with every interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Selection */}
            <div className="space-y-6">
              {aiFeatures.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;

                return (
                  <div
                    key={index}
                    className={`
                      p-6 rounded-2xl border cursor-pointer transition-all duration-500
                      ${isActive
                        ? 'border-gang-neon/50 bg-gang-neon/10 shadow-2xl shadow-gang-neon/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }
                    `}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                        ${isActive ? 'bg-gang-neon/20 text-gang-neon' : 'bg-white/10 text-white/70'}
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1">
                        <h3 className={`
                          text-xl font-bold mb-2 transition-all duration-500
                          ${isActive ? 'text-gang-neon' : 'text-white/90'}
                        `}>
                          {feature.title}
                        </h3>
                        <p className={`
                          leading-relaxed transition-all duration-500
                          ${isActive ? 'text-white/90' : 'text-white/70'}
                        `}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Demo Chat Interface */}
            <div className="relative">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 min-h-[400px]">
                {/* Chat Header */}
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-r from-gang-red to-gang-blue rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">AI Companion</div>
                    <div className="text-sm text-gang-neon">● Online</div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4 mb-6">
                  {/* Player Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="bg-gang-blue/20 rounded-2xl rounded-br-md px-4 py-3 border border-gang-blue/30">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-gang-blue" />
                          <span className="text-sm font-medium text-gang-blue">You</span>
                        </div>
                        <p className="text-white/90">
                          {aiFeatures[activeFeature].demo.player}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NPC Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 border border-white/20">
                        <div className="flex items-center space-x-2 mb-1">
                          <Bot className="h-4 w-4 text-gang-neon" />
                          <span className="text-sm font-medium text-gang-neon">NPC</span>
                        </div>
                        <p className="text-white/90 mb-2">
                          {aiFeatures[activeFeature].demo.npc}
                        </p>
                        <div className="text-xs text-white/60 italic">
                          <Zap className="h-3 w-3 inline mr-1" />
                          {aiFeatures[activeFeature].demo.context}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex items-center space-x-2 text-white/60">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gang-neon rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gang-neon rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gang-neon rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gang-neon rounded-full animate-pulse opacity-60" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gang-red rounded-full animate-ping opacity-40" />
            </div>
          </div>

          {/* Bottom Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-gang-red/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-gang-red" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Memory System</h3>
              <p className="text-white/70">NPCs remember conversations, relationships, and shared experiences.</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-gang-neon/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-gang-neon" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-time Adaptation</h3>
              <p className="text-white/70">AI personalities evolve based on player interactions and world events.</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-gang-blue/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-gang-blue" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Emotional Depth</h3>
              <p className="text-white/70">Characters express genuine emotions and form meaningful relationships.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { MessageCircle, Brain, Heart, Zap, User } from 'lucide-react';

const companions = [
  {
    name: 'Marcus "The Brain"',
    specialty: 'Strategy & Planning',
    personality: 'Analytical, Loyal, Strategic',
    relationship: 'Trusted Lieutenant',
    mood: 'Focused',
    lastSeen: '2 minutes ago',
    avatar: 'from-gang-neon to-gang-blue',
    messages: 12,
  },
  {
    name: 'Sofia "Ghost"',
    specialty: 'Stealth & Infiltration',
    personality: 'Mysterious, Skilled, Independent',
    relationship: 'Professional Partner',
    mood: 'Alert',
    lastSeen: '15 minutes ago',
    avatar: 'from-gang-purple to-gang-red',
    messages: 8,
  },
  {
    name: 'Tommy "Wheels"',
    specialty: 'Driving & Logistics',
    personality: 'Energetic, Reliable, Humorous',
    relationship: 'Close Friend',
    mood: 'Excited',
    lastSeen: '1 hour ago',
    avatar: 'from-gang-orange to-gang-yellow',
    messages: 24,
  },
];

export default function CompanionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gang-red to-gang-blue bg-clip-text text-transparent mb-4">
          AI Companions
        </h1>
        <p className="text-white/80 text-lg">
          Meet your AI-powered crew members. Each companion has a unique personality, remembers your history, and evolves based on your interactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {companions.map((companion, index) => (
          <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group">
            {/* Avatar and Status */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-r ${companion.avatar} rounded-full flex items-center justify-center shadow-lg`}>
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gang-green rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-gang-neon transition-colors">
                  {companion.name}
                </h3>
                <p className="text-gang-neon text-sm">{companion.specialty}</p>
                <p className="text-white/60 text-xs">Last seen: {companion.lastSeen}</p>
              </div>
            </div>

            {/* Personality & Relationship */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-4 w-4 text-gang-blue" />
                <span className="text-white/70 text-sm">Personality</span>
              </div>
              <p className="text-white/80 text-sm mb-3">{companion.personality}</p>

              <div className="flex items-center space-x-2 mb-2">
                <Heart className="h-4 w-4 text-gang-red" />
                <span className="text-white/70 text-sm">Relationship</span>
              </div>
              <p className="text-white/80 text-sm">{companion.relationship}</p>
            </div>

            {/* Current Mood */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/5">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-gang-yellow" />
                <span className="text-white/70 text-sm">Current Mood</span>
              </div>
              <span className="text-gang-yellow font-medium">{companion.mood}</span>
            </div>

            {/* Messages Count */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-gang-neon" />
                <span className="text-white/70">{companion.messages} messages</span>
              </div>
              <div className="w-2 h-2 bg-gang-red rounded-full animate-pulse" />
            </div>

            {/* Action Button */}
            <button className="w-full py-3 bg-gradient-to-r from-gang-neon to-gang-blue text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-gang-neon/30 transition-all group-hover:shadow-gang-neon/20">
              Start Conversation
            </button>
          </div>
        ))}
      </div>

      {/* Chat Interface Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Active Conversation</h2>
          <div className="space-y-4 mb-4">
            <div className="flex justify-end">
              <div className="bg-gang-blue/20 rounded-2xl rounded-br-md px-4 py-3 border border-gang-blue/30 max-w-[80%]">
                <p className="text-white/90">Hey Marcus, what's the situation with the heist?</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 border border-white/20 max-w-[80%]">
                <p className="text-white/90">I've been analyzing the security patterns. The Pacific Standard has a 3-minute window during shift change at 2 AM. Perfect timing for our crew.</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-gang-neon"
            />
            <button className="px-6 py-3 bg-gang-neon text-black font-semibold rounded-xl hover:bg-gang-neon/90 transition-colors">
              Send
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Companion Features</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-red/20 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-gang-red" />
              </div>
              <div>
                <div className="text-white font-medium">Persistent Memory</div>
                <div className="text-white/60 text-sm">Remembers all interactions and relationships</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-blue/20 rounded-lg flex items-center justify-center">
                <Heart className="h-4 w-4 text-gang-blue" />
              </div>
              <div>
                <div className="text-white font-medium">Emotional Development</div>
                <div className="text-white/60 text-sm">Relationships evolve based on your choices</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-neon/20 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-gang-neon" />
              </div>
              <div>
                <div className="text-white font-medium">Dynamic Responses</div>
                <div className="text-white/60 text-sm">Context-aware AI conversations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

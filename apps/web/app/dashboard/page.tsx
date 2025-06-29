import { Shield, Users, Zap, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gang-red to-gang-blue bg-clip-text text-transparent mb-4">
          Player Dashboard
        </h1>
        <p className="text-white/80 text-lg">
          Welcome back to Los Santos. Your AI-powered adventure continues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gang-red/20 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-gang-red" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Level 42</div>
              <div className="text-white/60">Player Level</div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gang-blue/20 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-gang-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Grove Street</div>
              <div className="text-white/60">Current Faction</div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gang-neon/20 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-gang-neon" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-white/60">Missions Completed</div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gang-green/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-gang-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">$2.5M</div>
              <div className="text-white/60">Total Earnings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-red/20 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-gang-red" />
              </div>
              <div>
                <div className="text-white font-medium">Completed heist mission</div>
                <div className="text-white/60 text-sm">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-blue/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-gang-blue" />
              </div>
              <div>
                <div className="text-white font-medium">Joined faction meeting</div>
                <div className="text-white/60 text-sm">5 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">AI Companion Status</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-gang-neon to-gang-blue rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">Marcus "The Brain"</div>
              <div className="text-gang-neon text-sm">● Active</div>
            </div>
          </div>
          <p className="text-white/70 mb-4">
            "Ready for the next job, boss. I've been analyzing police patrol patterns
            and found some interesting opportunities..."
          </p>
          <button className="w-full py-3 bg-gradient-to-r from-gang-neon to-gang-blue text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

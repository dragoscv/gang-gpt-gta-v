import { Users, Crown, Map, TrendingUp } from 'lucide-react';

const factions = [
  {
    name: 'Grove Street Families',
    leader: 'Carl "CJ" Johnson',
    members: 24,
    territory: 'East Los Santos',
    reputation: 'Respected',
    color: 'gang-green',
    description: 'The original gang from Grove Street, known for loyalty and street credibility.',
  },
  {
    name: 'Los Santos Ballas',
    leader: 'Big Smoke',
    members: 31,
    territory: 'Idlewood',
    reputation: 'Feared',
    color: 'gang-purple',
    description: 'Ruthless competitors with a strong presence in the drug trade.',
  },
  {
    name: 'Vagos',
    leader: 'El Jefe',
    members: 18,
    territory: 'East Beach',
    reputation: 'Rising',
    color: 'gang-yellow',
    description: 'Ambitious newcomers expanding their influence rapidly.',
  },
];

export default function FactionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gang-red to-gang-blue bg-clip-text text-transparent mb-4">
          Gang Factions
        </h1>
        <p className="text-white/80 text-lg">
          Explore the dynamic world of Los Santos gangs, each powered by AI-driven politics and evolving relationships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {factions.map((faction, index) => (
          <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 bg-${faction.color}/20 rounded-xl flex items-center justify-center`}>
                <Users className={`h-6 w-6 text-${faction.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{faction.name}</h3>
                <div className="flex items-center space-x-2 text-white/60">
                  <Crown className="h-4 w-4" />
                  <span>{faction.leader}</span>
                </div>
              </div>
            </div>

            <p className="text-white/70 mb-4">{faction.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{faction.members}</div>
                <div className="text-white/60 text-sm">Members</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold text-${faction.color}`}>{faction.reputation}</div>
                <div className="text-white/60 text-sm">Status</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-white/60 mb-4">
              <Map className="h-4 w-4" />
              <span>{faction.territory}</span>
            </div>

            <button className={`w-full py-3 bg-gradient-to-r from-${faction.color} to-${faction.color}/80 text-white font-semibold rounded-xl hover:shadow-lg transition-all`}>
              View Details
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Territory Control</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-white">East Los Santos</span>
              <span className="text-gang-green font-semibold">Grove Street</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-white">Idlewood</span>
              <span className="text-gang-purple font-semibold">Ballas</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-white">East Beach</span>
              <span className="text-gang-yellow font-semibold">Vagos</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Events</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-red/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-gang-red" />
              </div>
              <div>
                <div className="text-white font-medium">Territory dispute in Downtown</div>
                <div className="text-white/60 text-sm">Grove Street vs Ballas - 3 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-gang-blue/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-gang-blue" />
              </div>
              <div>
                <div className="text-white font-medium">New alliance formed</div>
                <div className="text-white/60 text-sm">Vagos and Los Santos Triads - 8 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { Statistics } from '@/components/sections/statistics';
import { AIShowcase } from '@/components/sections/ai-showcase';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Dynamic animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-gang-red/10 via-transparent to-gang-blue/10" />

      {/* Animated particles/dots */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse opacity-60" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-gang-red rounded-full animate-ping opacity-40" />
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-gang-blue rounded-full animate-bounce opacity-50" />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-gang-neon rounded-full animate-pulse delay-500 opacity-60" />
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-gang-yellow rounded-full animate-ping delay-300 opacity-30" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-gang-purple rounded-full animate-pulse delay-700 opacity-40" />
      </div>

      <div className="relative z-10">
        <Hero />
        <Features />
        <AIShowcase />
        <Statistics />
      </div>
    </div>
  );
}

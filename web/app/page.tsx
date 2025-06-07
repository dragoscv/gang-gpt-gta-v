import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { Statistics } from '@/components/sections/statistics';
import { AIShowcase } from '@/components/sections/ai-showcase';

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background with GTA V style */}
      <div className="absolute inset-0 bg-los-santos bg-cover bg-center bg-fixed opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

      <div className="relative z-10">
        <Hero />
        <Features />
        <AIShowcase />
        <Statistics />
      </div>
    </div>
  );
}

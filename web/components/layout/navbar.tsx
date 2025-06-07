'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Gamepad2, Users, Zap, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navigation = [
  { name: 'Home', href: '/', icon: Gamepad2 },
  { name: 'Factions', href: '/factions', icon: Users },
  { name: 'AI Companions', href: '/companions', icon: Zap },
  { name: 'Dashboard', href: '/dashboard', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-gang-red to-gang-blue rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-gang-red to-gang-blue bg-clip-text text-transparent">
                GangGPT
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="btn btn-outline px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="btn btn-primary px-4 py-2"
            >
              Join Server
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="flex items-center px-5 space-x-3">
              <Link
                href="/auth/login"
                className="btn btn-outline px-4 py-2 w-full"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary px-4 py-2 w-full"
                onClick={() => setIsOpen(false)}
              >
                Join Server
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

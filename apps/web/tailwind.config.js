/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',        // GTA-themed colors
        gang: {
          red: '#DC2626',
          blue: '#2563EB',
          green: '#059669',
          yellow: '#D97706',
          purple: '#7C3AED',
          orange: '#EA580C',
          neon: '#00FFFF',
        },
        'gang-red': '#DC2626',
        'gang-blue': '#2563EB',
        'gang-green': '#059669',
        'gang-yellow': '#D97706',
        'gang-purple': '#7C3AED',
        'gang-orange': '#EA580C',
        'gang-neon': '#00FFFF',
        neon: {
          pink: '#FF00FF',
          cyan: '#00FFFF',
          lime: '#00FF00',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-roboto-mono)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'los-santos': "url('/images/los-santos-bg.jpg')",
      }, animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'gaming-bounce': 'gamingBounce 1s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 1.5s ease-in-out infinite',
        'connect-pulse': 'connectPulse 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(139, 69, 255, 0.5), 0 0 40px rgba(139, 69, 255, 0.3), 0 0 60px rgba(139, 69, 255, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(139, 69, 255, 0.8), 0 0 60px rgba(139, 69, 255, 0.5), 0 0 90px rgba(139, 69, 255, 0.3)'
          }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        gamingBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-5px) scale(1.02)' }
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
          '75%': { opacity: '0.9' }
        },
        connectPulse: {
          '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)'
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
          }
        }
      },
      dropShadow: {
        'glow': '0 0 8px rgba(0, 255, 255, 0.6)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          bg: '#07090e',
          surface: '#0d121c',
          surfaceHover: '#141b29',
          card: '#111724',
          border: 'rgba(255, 255, 255, 0.07)',
          felt: '#0d5c38',
          feltLight: '#127045',
          feltDark: '#052b19',
          rail: '#1c120c',
          railDark: '#0e0805',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          goldDark: '#b45309',
        }
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-gold-lg': '0 0 40px rgba(245, 158, 11, 0.5)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'inner-felt': 'inset 0 0 70px rgba(0, 0, 0, 0.9)',
        'card': '0 6px 16px rgba(0, 0, 0, 0.6)',
        'table-rail': '0 20px 60px rgba(0, 0, 0, 0.95), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'deal-card': 'dealCard 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'turn-pulse': 'turnPulse 1.8s ease-in-out infinite',
      },
      keyframes: {
        dealCard: {
          '0%': { transform: 'translateY(-30px) scale(0.7) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1) rotate(0deg)', opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        turnPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.4), inset 0 0 8px rgba(245, 158, 11, 0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(245, 158, 11, 0.8), inset 0 0 14px rgba(245, 158, 11, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b1120',
        surface: {
          DEFAULT: '#111a2e',
          raised: '#16223c',
          input: '#1c2536',
        },
        line: '#283452',
        ink: {
          DEFAULT: '#e6edf7',
          muted: '#94a3c4',
          faint: '#5b6b8c',
        },
        brand: {
          DEFAULT: '#6366f1',
          soft: '#818cf8',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'spin-slow': { '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 0.15s ease-out',
        'spin-slow': 'spin-slow 1.2s linear infinite',
      },
      fontFamily: {
        sans: [
          'Inter', 'ui-sans-serif', 'system-ui',
          '-apple-system', 'Segoe UI', 'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

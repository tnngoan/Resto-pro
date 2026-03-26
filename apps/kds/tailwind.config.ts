import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#F5F0EB', // Warm off-white
        secondary: '#B3B3B3', // Muted gray
        tertiary: '#808080', // Darker gray
        surface: {
          dark: '#1A1A1A', // Main background (charcoal)
          medium: '#2E2E2E', // Card background
          light: '#3F3F3F', // Subtle highlight/border
        },
        gold: {
          50: '#FFFBF0',
          100: '#FFF3D6',
          200: '#FFE8AD',
          300: '#FFD580',
          400: '#FFC857',
          500: '#C9A96E', // THE RED CHAIR brand gold (timers < 10min)
          600: '#B39355',
          700: '#9D7F42',
          800: '#876B2F',
          900: '#71571C',
        },
        crimson: {
          50: '#FFF1F2',
          100: '#FFE3E5',
          200: '#FFC7CB',
          300: '#FF9DAF',
          400: '#FF5A6E',
          500: '#8B1A1A', // THE RED CHAIR brand crimson (timers 10-20min)
          600: '#A01515',
          700: '#8B1A1A',
          800: '#6B0F0F',
          900: '#4B0A0A',
        },
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#4A7C59', // Sage green for ready status
          600: '#3D6647',
          700: '#2F5037',
          800: '#213B28',
          900: '#132619',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#C94444', // Error red for timers > 20min
          600: '#B83B3B',
          700: '#A73232',
          800: '#8B2A2A',
          900: '#6F2121',
        },
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      borderRadius: {
        card: '8px',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
        'blink-red': 'blink-red 0.5s step-start infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'blink-red': {
          '0%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#8B1A1A',
          dark: '#5C1A1A',
          light: '#A52020',
        },
        gold: {
          DEFAULT: '#C9A96E',
          dark: '#A88B4A',
          light: '#D4BC8A',
        },
        surface: {
          base: '#1A1A1A',
          dark: '#242424',
          medium: '#2E2E2E',
          light: '#333333',
        },
        text: {
          primary: '#F5F0EB',
          secondary: '#A89B8C',
          tertiary: '#6B5E52',
        },
        success: '#4A7C59',
        warning: '#C9A96E',
        error: '#C94444',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        button: '6px',
        modal: '12px',
      },
    },
  },
  plugins: [],
};

export default config;

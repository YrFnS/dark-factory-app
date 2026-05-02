import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0d0f',
        'bg-secondary': '#161618',
        'bg-tertiary': '#1e1e21',
        'border': '#2a2a2e',
        'text-primary': '#e8e8ec',
        'text-secondary': '#8b8b94',
        'accent-amber': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-green': '#22c55e',
        'accent-blue': '#3b82f6',
      },
    },
  },
  plugins: [],
};

export default config;

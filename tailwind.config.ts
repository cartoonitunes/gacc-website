import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gacc-cream': '#f9edcd',
        'gacc-brown': '#8B4513',
        'gacc-gold': '#DAA520',
        // GSwap: sampled from the GrandpaCoin logo (#1a150f background, ochre fur, gold glint).
        'gs-ink': '#0f0c08',
        'gs-night': '#1a150f',
        'gs-panel': '#231b13',
        'gs-raised': '#2c2218',
        'gs-line': '#3b2f21',
        'gs-ochre': '#c68a4b',
        'gs-amber': '#c47f34',
        'gs-glint': '#d6ab67',
        'gs-bronze': '#977039',
        'gs-muted': '#a8977c',
        'gs-good': '#8fbf6a',
        'gs-bad': '#e2725b',
      },
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EVE Medical - Clinical Hightech Palette
        'eve': {
          // Backgrounds - deep clinical blues
          'bg': '#0a0f1a',
          'card': '#0f1628',
          'border': '#1a2744',
          
          // Text
          'muted': '#7a8ba8',
          
          // Primary accent - clinical cyan/teal
          'accent': '#00e5c7',
          'accent-soft': '#00b8a0',
          
          // Secondary - electric blue
          'blue': '#00a8ff',
          'blue-soft': '#0088d4',
          
          // Status colors
          'red': '#ff5a5a',
          'yellow': '#ffc107',
          'green': '#00d68f',
          
          // Special - verification purple
          'verify': '#a78bfa',
          'verify-bg': '#1a1535',
        },
        // ATC therapeutic area colors
        'atc': {
          'A': '#f59e0b',
          'C': '#ef4444',
          'N': '#a78bfa',
          'M': '#3b82f6',
          'J': '#10b981',
          'R': '#ec4899',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // EVE Medical — Clinical Archive Palette
        // Neutral, low-affect, evidence-focused
        'eve': {
          // Backgrounds — neutral gray
          'bg': '#f5f6f8',
          'card': '#ffffff',
          'border': '#dce0e6',
          
          // Text
          'text': '#2d3748',
          'text-strong': '#1a202c',
          'muted': '#64748b',
          
          // Accent — muted blue-gray (not AI-blue)
          'accent': '#5a7a94',
          'accent-dim': 'rgba(90, 122, 148, 0.15)',
          
          // Verification — subtle
          'verify': '#6b7c93',
          
          // Functional — minimal
          'info': '#5a7a94',
          'caution': '#8b7355',
        },
        // ATC therapeutic area colors — muted, categorical
        'atc': {
          'A': '#7a8c6e',  // Metabolism
          'C': '#6e7a8c',  // Cardiovascular
          'N': '#8c7a6e',  // CNS
          'M': '#7a6e8c',  // Musculoskeletal
          'J': '#6e8c7a',  // Anti-infectives
          'R': '#8c6e7a',  // Respiratory
        }
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

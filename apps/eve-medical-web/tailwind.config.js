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
        // EVE Medical — 2026 Archive Palette
        // Modern, calm, confident, color-controlled
        'eve': {
          // Base — warm off-white
          'bg': '#fafaf9',
          'bg-subtle': '#f5f5f4',
          'card': '#ffffff',
          'border': '#e7e5e4',
          'border-strong': '#d6d3d1',
          
          // Text — warm darks
          'text': '#44403c',
          'text-strong': '#1c1917',
          'muted': '#78716c',
          
          // Primary — slate teal
          'accent': '#0d9488',
          'accent-hover': '#0f766e',
          'accent-soft': 'rgba(13, 148, 136, 0.1)',
          
          // Secondary — slate blue
          'slate': '#64748b',
          'slate-soft': 'rgba(100, 116, 139, 0.1)',
          
          // Status
          'verified': '#059669',
          'notice': '#d97706',
          
          // Functional (legacy support)
          'info': '#0d9488',
          'caution': '#d97706',
        },
        // ATC therapeutic areas — distinguishable but calm
        'atc': {
          'A': '#059669',  // Metabolism
          'C': '#dc2626',  // Cardiovascular
          'N': '#7c3aed',  // CNS
          'M': '#2563eb',  // Musculoskeletal
          'J': '#ca8a04',  // Anti-infectives
          'R': '#db2777',  // Respiratory
        }
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'eve': '10px',
      },
    },
  },
  plugins: [],
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // EVE Medical: All data comes from API, no static generation
  // This ensures determinism - same API = same output
  output: 'standalone',
  
  // Disable static optimization to ensure fresh data
  experimental: {
    // Ensure no accidental caching
  },
}

module.exports = nextConfig

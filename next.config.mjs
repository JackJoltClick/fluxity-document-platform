/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude worker-service directory from Next.js compilation
  webpack: (config, { isServer }) => {
    // Ignore worker-service directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/worker-service/**'],
    }
    
    return config
  },
  
  // Exclude worker-service from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Exclude worker-service from ESLint
  eslint: {
    dirs: ['app', 'src', 'middleware.ts'],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Required to use the "use cache" directive
  cacheComponents: true,
  
  // Existing compiler setting
  reactCompiler: true,
  
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;

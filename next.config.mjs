/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tree-shake large packages more aggressively per-route
    optimizePackageImports: ["antd", "lucide-react"],
  },
};

export default nextConfig;

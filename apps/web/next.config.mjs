/** @type {import('next').NextConfig} */
const isWindows = process.platform === "win32";

const nextConfig = {
  output: isWindows ? undefined : "standalone",
  experimental: {
    serverComponentsExternalPackages: ["bullmq"]
  }
};

export default nextConfig;

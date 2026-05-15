/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api"
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig

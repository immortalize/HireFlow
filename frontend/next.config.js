/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'hireflow.com','192.168.1.130'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
}

module.exports = nextConfig

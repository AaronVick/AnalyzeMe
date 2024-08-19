/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['analyze-me.vercel.app'],
  },
  webpack: (config) => {
    config.externals.push({
      sharp: "commonjs sharp",
    });
    return config;
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['analyze-me.vercel.app'],
  },
  // Comment out the custom Webpack configuration for now
  // webpack: (config) => {
  //   config.externals.push({
  //     sharp: "commonjs sharp",
  //   });
  //   return config;
  // },
}

module.exports = nextConfig;

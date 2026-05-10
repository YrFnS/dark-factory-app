/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const port = parseInt(process.env.PORT || '3001', 10);

module.exports = nextConfig;

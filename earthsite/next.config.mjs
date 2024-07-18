/** @type {import('next').NextConfig} */
// next.config.mjs
import 'dotenv/config';

const nextConfig = {
  reactStrictMode: true,
  env: {
    password: process.env.password,
    // 他の環境変数も必要に応じてここに追加できます
  },
};

export default nextConfig;

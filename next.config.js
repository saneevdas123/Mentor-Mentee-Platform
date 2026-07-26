/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'exceljs', 'nodemailer', 'googleapis', 'node-cron'],
  },
};

module.exports = nextConfig;

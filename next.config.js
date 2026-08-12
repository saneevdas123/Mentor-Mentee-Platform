/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongoose', 'exceljs', 'nodemailer', 'googleapis', 'node-cron', 'pdf-parse'],
};

module.exports = nextConfig;

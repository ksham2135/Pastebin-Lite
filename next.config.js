/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensure proper environment variable handling
    env: {
        TEST_MODE: process.env.TEST_MODE || '0',
    },
};

module.exports = nextConfig;

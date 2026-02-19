import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: process.env.BASE_PATH || '', // Set basePath for GitHub Pages if needed
    images: {
        unoptimized: true,
    },
};

export default withNextIntl(nextConfig);

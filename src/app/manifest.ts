import type { MetadataRoute } from 'next'

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

    return {
        name: 'FFXIV Guildleve Calculator',
        short_name: 'LeveCalc',
        description: 'Find the most profitable tradecraft leves in FFXIV',
        start_url: `${basePath}/`,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: `${basePath}/icons/icon-192x192.png`,
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: `${basePath}/icons/icon-512x512.png`,
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}

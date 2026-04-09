import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tukang Lapor — Sistem Pelaporan ESG',
    short_name: 'Tukang Lapor',
    description: 'Platform pelaporan ESG sekolah berbasis AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F4F0',
    theme_color: '#16A34A',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

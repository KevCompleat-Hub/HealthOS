import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HealthOS', short_name: 'HealthOS', description: 'Wochenplanung für Bewegung, Training und Gewohnheiten.',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', lang: 'de',
    background_color: '#ECF0EB', theme_color: '#1D5945',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

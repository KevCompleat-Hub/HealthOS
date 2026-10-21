import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EvoVive', short_name: 'EvoVive', id: '/', description: 'Wochenplanung für Bewegung, Training und Gewohnheiten.',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', lang: 'de',
    background_color: '#F3F1EA', theme_color: '#24543F',
    icons: [
      { src: '/icons/evovive-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/evovive-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/evovive-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

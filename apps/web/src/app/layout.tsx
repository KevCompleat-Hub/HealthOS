import type { Metadata, Viewport } from 'next';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import '@fontsource/schibsted-grotesk/500.css';
import '@fontsource/schibsted-grotesk/600.css';
import '@fontsource/schibsted-grotesk/700.css';
import './legacy.css';
import './beta.css';

export const metadata: Metadata = {
  title: 'EvoVive',
  description: 'Persönliche Wochenplanung für Bewegung, Training und Gewohnheiten. Geschlossene Beta.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'EvoVive', statusBarStyle: 'default' },
  icons: { icon: [{ url: '/icons/evovive-32.png', sizes: '32x32' }, { url: '/icons/evovive.svg', type: 'image/svg+xml' }], apple: '/icons/evovive-apple-touch.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F3F1EA' }, { media: '(prefers-color-scheme: dark)', color: '#0E1613' }],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body>{children}</body></html>;
}

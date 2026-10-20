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
  title: 'HealthOS',
  description: 'Persönliche Wochenplanung für Bewegung, Training und Gewohnheiten. Geschlossene Beta.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'HealthOS', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ECF0EB' }, { media: '(prefers-color-scheme: dark)', color: '#0E1613' }],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body>{children}</body></html>;
}

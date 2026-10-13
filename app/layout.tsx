import type { Metadata } from 'next';
import './globals.css';
import './form-motion.css';
import './form-status.css';
import './page-motion.css';
import './cookies.css';
import './brand-chrome.css';
import './contact.css';
import '@/app/brand-motion.css';
import { CookieConsent } from '@/components/cookie-consent';
import { VideoInterstitial } from '@/components/video-interstitial';
import { homeNavigationBootstrap } from '@/lib/home-navigation';
import { hostingMarkupBootstrap } from '@/lib/hosting-markup';
import './interstitial.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lif.cr'),
  authors: [{ name: 'Daniel Víquez Azofeifa' }],
  creator: 'Daniel Víquez Azofeifa para LAICA 2026',
  publisher: 'LAICA',
  title: {
    default: 'LIF | Tomalo a tu manera',
    template: '%s | LIF',
  },
  description:
    'La vida adulta es complicada. Refrescate con tu sabor LIF favorito, recetas y nuevos momentos para disfrutar.',
  icons: {
    icon: [
      {
        url: '/brand/lif-favicon-32-v2.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/brand/lif-favicon-192-v2.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcut: '/brand/lif-favicon-32-v2.png',
    apple: {
      url: '/brand/lif-apple-touch-180-v2.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
  openGraph: {
    title: 'LIF | Tomalo a tu manera',
    description: 'Conocé los sabores LIF, explorá recetas y jugá con nosotros.',
    siteName: 'LIF.CR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIF | Tomalo a tu manera',
    description: 'Conocé los sabores LIF, explorá recetas y jugá con nosotros.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: hostingMarkupBootstrap + homeNavigationBootstrap }} /></head>
      <body>
        {children}
        <CookieConsent />
        <VideoInterstitial />
      </body>
    </html>
  );
}

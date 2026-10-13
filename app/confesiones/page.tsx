import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-chrome';
import { ConfessionsContent } from '@/components/confessions-content';

export const metadata: Metadata = {
  title: 'Confesiones del adulting',
  description: 'Un espacio para compartir, con consentimiento, esas pequeñas confesiones de la vida adulta.',
  alternates: { canonical: '/confesiones/' },
};

export default function ConfessionsPage() {
  return <SiteShell><main className="inner-page confessions-page"><ConfessionsContent storiesUnavailable={process.env.LIF_BLOCK_CONFESSIONS_CONTENT === 'true'} /></main></SiteShell>;
}

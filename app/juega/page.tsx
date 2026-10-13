import type { Metadata } from 'next';
import { GamesHub } from '@/components/games';
import { SiteShell } from '@/components/site-chrome';
import {
  INITIAL_RANKING_SLOT,
  requestPublicRanking,
  type InitialRanking,
} from '@/lib/gaming/initial-ranking';

export const metadata: Metadata = {
  title: 'Jugá con LIF | Memoria LIF y Snake LIF',
  description:
    'Jugá Memoria LIF y Snake LIF, descubrí los nuevos sabores y alcanzá tu lugar en el ranking.',
  alternates: { canonical: '/juega/' },
};

export default async function GamesPage() {
  const initialRanking: InitialRanking =
    process.env.NODE_ENV === 'development'
      ? await requestPublicRanking('http://localhost:3000')
      : INITIAL_RANKING_SLOT;
  return (
    <SiteShell>
      <main className="lif-games-page">
        <GamesHub
          initialRanking={initialRanking}
          rankingPreview={process.env.LIF_CLIENT_PREVIEW === 'true'}
        />
      </main>
    </SiteShell>
  );
}

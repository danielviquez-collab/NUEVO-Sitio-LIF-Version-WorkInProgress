import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-chrome';
import { ConfessionCommunity } from '@/components/confession-community';
import { SectionInProgress } from '@/components/section-in-progress';
import '@/app/confessions.css';

export const metadata: Metadata = {
  title: 'Todas las confesiones del adulting',
  description: 'Todos los Blogs y Vlogs de las confesiones del adulting de LIF.',
  alternates: { canonical: '/confesiones/todas/' },
};

export default function AllConfessionsPage() {
  return <SiteShell><main>{process.env.LIF_BLOCK_CONFESSIONS_CONTENT === 'true' ? <SectionInProgress /> : <ConfessionCommunity all />}</main></SiteShell>;
}

import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { SiteShell } from '@/components/site-chrome';
import { SocialLinks } from '@/components/social-links';
import StaticLink from '@/components/static-link';
import '@/app/confessions.css';

export const metadata: Metadata = { title: 'Gracias por tu confesión', robots: { index: false, follow: false } };

export default function ConfessionThanksPage() {
  return <SiteShell><main className="confession-thanks">
    <Image src="/brand/lif-official.svg" alt="LIF" width={154} height={96} unoptimized />
    <p className="eyebrow">Confesiones del adulting</p>
    <h1>Gracias por<br /><em>contar la tuya.</em></h1>
    <p>La vida adulta se lleva mejor cuando la compartimos.</p>
    <h2>Sigamos la conversación en nuestras redes.</h2>
    <SocialLinks />
    <StaticLink href="/confesiones" className="text-link"><ArrowLeft aria-hidden="true" />Volver a confesiones</StaticLink>
  </main></SiteShell>;
}

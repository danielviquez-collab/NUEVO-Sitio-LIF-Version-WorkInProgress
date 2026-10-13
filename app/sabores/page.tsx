import type { Metadata } from 'next';
import { FlavorCatalog } from '@/components/flavor-catalog';
import { SiteShell } from '@/components/site-chrome';
import '@/app/flavors.css';

export const metadata: Metadata = {
  title: 'Sabores | Té frío y limonadas para cada momento',
  description: 'Conocé todos los sabores LIF y consultá la información nutricional oficial de cada producto.',
  alternates: { canonical: '/sabores/' },
};

export default function FlavorsPage() {
  return (
    <SiteShell>
      <main className="inner-page flavors-page">
        <section className="page-hero page-hero-flavors">
          <h1>Un sabor para<br /><em>cada antojo.</em></h1>
          <p>Elegí tu favorito, encontrá algo nuevo y consultá su información nutricional.</p>
        </section>
        <section className="flavor-catalog" aria-label="Todos los sabores LIF">
          <FlavorCatalog />
        </section>
      </main>
    </SiteShell>
  );
}

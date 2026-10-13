import type { Metadata } from 'next';
import { RecipesBrowser } from '@/components/recipes-browser';
import { SiteShell } from '@/components/site-chrome';

export const metadata: Metadata = {
  title: 'Recetario | Bebidas, postres y antojos',
  description: 'Encontrá recetas publicadas por LIF y filtrá por tipo de receta o por el momento que querés disfrutar.',
  alternates: { canonical: '/recetario/' },
};

export default function RecipePage() {
  return (
    <SiteShell>
      <main className="inner-page recipe-page">
        <section className="page-hero page-hero-recipes">
          <p className="eyebrow">El recetario LIF</p>
          <h1>¿Qué se te<br /><em>antoja hoy?</em></h1>
          <p>Buscá por lo que querés preparar o por el plan que se armó.</p>
        </section>
        <section className="recipe-library" aria-labelledby="recipe-library-title">
          <div className="library-intro"><div><p className="eyebrow">Recetas para hacerlas a tu manera</p><h2 id="recipe-library-title">Encontrá tu próxima mezcla.</h2></div></div>
          <RecipesBrowser />
        </section>
      </main>
    </SiteShell>
  );
}

'use client';

import { ArrowRight, ArrowUpRight, Gamepad2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from './static-link';
import { SiteShell } from '@/components/site-chrome';
import { FlavorShowcase } from '@/components/flavor-showcase';
import { CampaignActor } from '@/components/campaign-actor';
import { recipes } from '@/lib/lif-content';
import '@/app/home.css';

const picks = [recipes[0], recipes[2]];

export function HomeContent() {
  const homeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = homeRef.current?.querySelectorAll('.campaign-recipes, .campaign-confession');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
    }), { threshold: .1 });
    sections?.forEach((section) => { if (section.getBoundingClientRect().top > window.innerHeight) section.classList.add('will-reveal'); observer.observe(section); });
    const visibleMotion = new Set<Element>();
    const motionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) visibleMotion.add(entry.target);
      else visibleMotion.delete(entry.target);
      entry.target.setAttribute('data-motion-active', String(entry.isIntersecting && !document.hidden));
    }), { threshold: .2 });
    homeRef.current?.querySelectorAll('[data-viewport-motion]').forEach((element) => motionObserver.observe(element));
    const updateVisibility = () => visibleMotion.forEach((element) => element.setAttribute('data-motion-active', String(!document.hidden)));
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { observer.disconnect(); motionObserver.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);
  return (
    <SiteShell>
      <main className="campaign-home" ref={homeRef}>
        <section className="campaign-hero" aria-labelledby="home-title">
          <div className="campaign-headline">
            <h1 id="home-title">Cambiá el sabor <span>de tu día.</span></h1>
          </div>
          <div className="campaign-products">
            <div className="campaign-artwork" aria-hidden="true">
              <Image className="campaign-decoration campaign-stevia" src="/brand/con-stevia.svg" alt="" width={140} height={140} />
              <Image className="campaign-decoration campaign-calories" src="/brand/bajo-en-calorias.svg" alt="" width={190} height={100} />
            </div>
            <FlavorShowcase />
          </div>
          <Link href="/sabores/" className="showcase-catalog">Todos los sabores <ArrowUpRight aria-hidden="true" /></Link>
        </section>
        <section className="campaign-play" aria-labelledby="play-home-title" data-viewport-motion>
          <div className="campaign-play-inner">
            <Gamepad2 className="campaign-game-icon" aria-hidden="true" />
            <div><p>Jugá con LIF</p><h2 id="play-home-title">Dale play a tu pausa.</h2></div>
            <Link className="campaign-play-button" href="/juega/"><Gamepad2 className="play-controller" aria-hidden="true" /><span>Vamos a jugar</span><ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>
        <section className="campaign-recipes" aria-labelledby="home-recipes-title">
          <div className="campaign-section-heading"><div><p className="eyebrow">Recetario</p><h2 id="home-recipes-title">Se antoja algo <em>diferente.</em></h2></div><Link className="text-link" href="/recetario/">Todas las recetas <ArrowUpRight aria-hidden="true" /></Link></div>
          <div className="campaign-recipe-grid">
            {picks.map((recipe) => <Link className="campaign-recipe" href="/recetario/" key={recipe.slug}>
              <div className="campaign-recipe-image">{recipe.image && <Image src={recipe.image} alt={recipe.title} width={900} height={675} style={{ objectFit: recipe.imageFit ?? 'cover' }} unoptimized loading="lazy" />}<span className="campaign-recipe-open" aria-hidden="true"><ArrowUpRight /></span></div>
              <div className="campaign-recipe-caption"><span>{recipe.category}</span><h3>{recipe.title}</h3></div>
            </Link>)}
          </div>
        </section>
        <section className="campaign-confession" aria-labelledby="confession-home-title" data-viewport-motion>
          <div className="campaign-confession-inner">
            <CampaignActor actor="lego" />
            <div className="campaign-confession-copy">
            <span className="campaign-quote" aria-hidden="true">“</span>
            <p className="eyebrow">Confesiones del adulting</p>
            <h2 id="confession-home-title">La vida adulta no viene con manual.</h2>
            <p>Pero sí con historias que merecen salir del chat.</p>
            <Link href="/confesiones/">Entrá a las confesiones <ArrowUpRight aria-hidden="true" /></Link>
            </div>
            <CampaignActor actor="plantas" />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

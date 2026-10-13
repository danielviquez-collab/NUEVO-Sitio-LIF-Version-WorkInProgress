'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ConfessionVideo } from './confession-video';
import { ConfessionForm } from './confession-form';
import { ConfessionCommunity } from './confession-community';
import { SectionInProgress } from './section-in-progress';
import '@/app/confessions.css';

export function ConfessionsContent({ storiesUnavailable = false }: { storiesUnavailable?: boolean }) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <section className="confession-hero">
        <div className="confession-hero-copy"><p className="eyebrow">Confesiones del adulting</p><h1>Nos pasa a<br /><em>todos.</em></h1><p>Ese momento en que la vida adulta te agarró sin avisar. Contalo, acá entendemos.</p><button className="action-button lif-highlight-action confession-open" type="button" aria-haspopup="dialog" onClick={() => setFormOpen(true)}>Contar la mía <MessageCircle aria-hidden="true" /></button></div>
        <ConfessionVideo />
        <div className="confession-prompt-art" aria-label="Preguntas para inspirar una confesión"><span>¿Dijiste “ya voy”<br />y seguías en pijama?</span><i>¿Pagaste algo<br />y no sabés qué era?</i><b>¿Abriste la refri<br />sin saber qué buscabas?</b></div>
      </section>
      {storiesUnavailable ? <SectionInProgress /> : <>
      <section className="confession-editorial">
        <div className="editorial-heading"><p className="eyebrow">Cosas que nos pasan</p><h2>Un espacio para reírnos un poco de la vida adulta.</h2><p>Renzo también tiene una historia que contar.</p><div className="editorial-question"><p>¿Cuál fue tu “esto ya cuenta como ser adulto” de esta semana?</p></div></div>
        <figure className="confession-reel-sticker">
          <figcaption>Renzo <span>Confesiones del adulting</span></figcaption>
          <ConfessionVideo variant="reel" src="/campaign/renzo-lif.mp4" poster="/campaign/renzo-lif-poster.webp" label="Reel de Renzo: una historia de la vida adulta" />
        </figure>
      </section>
      <ConfessionCommunity />
      </>}
      {formOpen && <ConfessionForm onClose={() => setFormOpen(false)} />}
    </>
  );
}

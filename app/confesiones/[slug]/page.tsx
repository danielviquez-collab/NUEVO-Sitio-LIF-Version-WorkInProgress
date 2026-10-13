import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { confessionStories } from '@/lib/confession-stories';
import { SiteShell } from '@/components/site-chrome';
import { SectionInProgress } from '@/components/section-in-progress';
import StaticLink from '@/components/static-link';
import '@/app/confessions.css';

export function generateStaticParams() { return confessionStories.map(({ slug }) => ({ slug })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (process.env.LIF_BLOCK_CONFESSIONS_CONTENT === 'true') return { title: 'Confesiones en proceso', alternates: { canonical: `/confesiones/${slug}/` }, robots: { index: false, follow: true } };
  const story = confessionStories.find(item => item.slug === slug);
  return { title: story ? `${story.name}: ${story.alias}` : 'Confesiones', description: story?.excerpt, alternates: { canonical: `/confesiones/${slug}/` } };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = confessionStories.findIndex(item => item.slug === slug);
  if (index < 0) notFound();
  if (process.env.LIF_BLOCK_CONFESSIONS_CONTENT === 'true') return <SiteShell><main><SectionInProgress /></main></SiteShell>;
  const story = confessionStories[index];
  const next = confessionStories[(index + 1) % confessionStories.length];
  return <SiteShell><main className="confession-reading">
    <StaticLink className="text-link" href="/confesiones#historias"><ArrowLeft aria-hidden="true" />Volver a confesiones</StaticLink>
    <header><p className="eyebrow">{story.name} · {story.age} años</p><h1><span className="story-alias-tag">Alias:</span>“{story.alias}”</h1></header>
    <article aria-label={`Historia de ${story.name}`}>
      {story.paragraphs.map((paragraph, i) => <p key={i} className={i === story.paragraphs.length - 1 ? 'story-signoff' : undefined}>{paragraph}</p>)}
    </article>
    <nav aria-label="Más historias"><StaticLink className="text-link" href={`/confesiones/${next.slug}`}>La historia de {next.name} <ArrowRight aria-hidden="true" /></StaticLink></nav>
  </main></SiteShell>;
}

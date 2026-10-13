'use client';

import { useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight, Clapperboard, MessageSquareText } from 'lucide-react';
import { confessionStories, communityVideos } from '@/lib/confession-stories';
import { communityOrder, type CommunityOrder } from '@/lib/community-session';
import { ConfessionVideo } from './confession-video';
import { ConfessionStoryPreview } from './confession-story-preview';
import StaticLink from './static-link';

const initialOrder = { videos: communityVideos.map((video) => video.id), stories: confessionStories.map((story) => story.slug) };
let sessionOrder: CommunityOrder | undefined;
const subscribeOrder = () => () => {};
const serverOrder = () => initialOrder;
function readSessionOrder() {
  if (typeof window === 'undefined') return initialOrder;
  if (!sessionOrder) {
    let storage: Storage | undefined;
    try { storage = window.sessionStorage; } catch { /* Private browsing can deny storage access. */ }
    sessionOrder = communityOrder(initialOrder.videos, initialOrder.stories, storage);
  }
  return sessionOrder;
}

function CommunityVlog({ video }: { video: typeof communityVideos[number] }) {
  return <figure className="community-video-sticker" data-video-id={video.id}>
    <figcaption><span className="community-format"><Clapperboard aria-hidden="true" />Vlog</span><span className="community-video-title">{video.title}</span></figcaption>
    <div className="community-media">
      <ConfessionVideo variant="community" src={video.src} poster={video.poster} label={video.title} />
      <p className="community-credit"><span>{video.creator}</span><span>{video.network}</span></p>
    </div>
  </figure>;
}

export function ConfessionCommunity({ all = false }: { all?: boolean }) {
  const order = useSyncExternalStore(subscribeOrder, readSessionOrder, serverOrder);
  const videos = order.videos.map((id) => communityVideos.find((video) => video.id === id)!);
  const stories = order.stories.map((slug) => confessionStories.find((story) => story.slug === slug)!);

  return <section id="historias" className="confession-community" aria-labelledby="community-title" data-all={all}>
    <header className="community-heading">
      {all && <StaticLink href="/confesiones#historias" className="text-link community-back"><ArrowLeft aria-hidden="true" />Volver a confesiones</StaticLink>}
      <p className="eyebrow">Confesiones del adulting</p>
      {all ? <h1 id="community-title">Todas las<br /><em>confesiones.</em></h1> : <h2 id="community-title">La vida adulta.<br /><em>Sin filtro.</em></h2>}
    </header>
    <div className="community-rows">
      {stories.map((story, index) => <div key={`${story.slug}-${videos[index].id}`} className="community-row">
        <CommunityVlog video={videos[index]} />
        <article className="community-story" aria-labelledby={`story-${story.slug}`}>
          <p className="community-format"><MessageSquareText aria-hidden="true" />Blog</p>
          <p className="community-byline">{story.name} <span>{story.age} años</span></p>
          <h3 id={`story-${story.slug}`}><span className="story-alias-tag">Alias:</span>“{story.alias}”</h3>
          <ConfessionStoryPreview paragraphs={story.paragraphs} />
          <StaticLink className="text-link" href={`/confesiones/${story.slug}`} aria-label={`Leer más: ${story.name}`}>Leer más <ArrowRight aria-hidden="true" /></StaticLink>
        </article>
      </div>)}
    </div>
    {all ? <div className="community-overflow">{videos.slice(stories.length).map((video) => <CommunityVlog key={video.id} video={video} />)}</div>
      : <StaticLink href="/confesiones/todas" className="text-link community-more">Ver todas las confesiones <ArrowRight aria-hidden="true" /></StaticLink>}
  </section>;
}

'use client';
// Official, pre-optimized packshots are also used by the game preloader.
/* eslint-disable next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { GAME_FLAVORS } from '@/lib/gaming/config';
import {
  isMediaOverlayActive,
  subscribeMediaOverlay,
} from '@/lib/media-priority';

const flavors = GAME_FLAVORS.filter((flavor) => flavor.isNew);

export function HeroPackshots() {
  const stage = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let visible = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setPlaying(
        visible &&
          !document.hidden &&
          !motion.matches &&
          !isMediaOverlayActive(),
      );
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    const unsubscribe = subscribeMediaOverlay(update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
      unsubscribe();
    };
  }, []);

  return (
    <figure ref={stage} className="game-hub-packshots" data-playing={playing}>
      <figcaption className="sr-only">
        Nuevos sabores LIF: {flavors.map((flavor) => flavor.name).join(', ')}.
      </figcaption>
      {flavors.map((flavor, index) => (
        <div
          className="game-hub-pack"
          key={flavor.name}
          aria-hidden="true"
          data-flavor={flavor.name}
          style={
            {
              '--pack-delay': `${-((flavors.length - index) % flavors.length) * 4}s`,
            } as CSSProperties
          }
        >
          <img
            src={flavor.image}
            alt=""
            width={992}
            height={1113}
            loading="eager"
          />
          <span className="game-new-sticker">
            NUEVO
            <br />
            SABOR
          </span>
        </div>
      ))}
    </figure>
  );
}

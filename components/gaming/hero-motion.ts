'use client';
import { useEffect, useRef, useState } from 'react';
import {
  isMediaOverlayActive,
  subscribeMediaOverlay,
} from '@/lib/media-priority';

export function useHeroMotion() {
  const element = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    let visible = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(motion.matches);
      setPlaying(
        visible &&
          !document.hidden &&
          !motion.matches &&
          !isMediaOverlayActive(),
      );
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.2 },
    );
    observer.observe(element.current);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    const unsubscribe = subscribeMediaOverlay(update);
    return () => {
      observer.disconnect();
      unsubscribe();
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
    };
  }, []);
  return { element, playing, reduced };
}

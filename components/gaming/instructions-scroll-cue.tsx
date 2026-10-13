'use client';
import { useEffect, useState, type RefObject } from 'react';
import { ArrowDown } from 'lucide-react';

export function InstructionsScrollCue({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;
    const update = () =>
      setMore(list.scrollHeight - list.clientHeight - list.scrollTop > 3);
    const frame = requestAnimationFrame(update);
    const resize = new ResizeObserver(update);
    resize.observe(list);
    if (list.lastElementChild) resize.observe(list.lastElementChild);
    list.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      list.removeEventListener('scroll', update);
    };
  }, [scrollRef]);
  if (!more) return null;
  return (
    <button
      className="game-instructions-scroll-cue"
      type="button"
      aria-label="Ver más instrucciones"
      title="Ver más instrucciones"
      aria-controls="lif-game-instructions"
      onClick={() => {
        const list = scrollRef.current;
        list?.scrollBy({
          top: list.clientHeight * 0.75,
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
      }}
    >
      <ArrowDown aria-hidden="true" />
    </button>
  );
}

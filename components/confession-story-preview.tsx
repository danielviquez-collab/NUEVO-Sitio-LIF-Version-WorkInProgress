'use client';

import { useEffect, useRef, useState } from 'react';
import { fitStoryPreview } from '@/lib/story-preview';

export function ConfessionStoryPreview({ paragraphs }: { paragraphs: readonly string[] }) {
  const container = useRef<HTMLDivElement>(null);
  const measurement = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => paragraphs.slice(0, 1));

  useEffect(() => {
    const box = container.current;
    const ruler = measurement.current;
    if (!box || !ruler) return;
    let frame = 0;
    let disposed = false;
    function measure() {
      if (disposed || !box!.clientWidth || !box!.clientHeight) return;
      const available = box!.clientHeight;
      const result = fitStoryPreview(paragraphs, candidate => {
        ruler!.replaceChildren(...candidate.map(text => {
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          return paragraph;
        }));
        return ruler!.getBoundingClientRect().height <= available;
      });
      setVisible(previous => previous.join('\n') === result.join('\n') ? previous : result);
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    schedule();
    void document.fonts.ready.then(() => { if (!disposed) schedule(); });
    document.fonts.addEventListener('loadingdone', schedule);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); document.fonts.removeEventListener('loadingdone', schedule); };
  }, [paragraphs]);

  return <div ref={container} className="community-story-preview">
    <div className="story-preview-copy">{visible.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    <div ref={measurement} className="story-preview-copy story-preview-measure" aria-hidden="true" />
  </div>;
}

'use client';
/* eslint-disable next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import type { GameId } from '@/lib/gaming/config';
import { GAME_FLAVORS } from '@/lib/gaming/config';
import { drawSnake, loadGameImages } from '@/lib/gaming/render';
export function GamePreview({ game }: { game: GameId }) {
  return game === 'memory_lif' ? <MemoryPreview /> : <SnakePreview />;
}
function SnakePreview() {
  const cell = 24;
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let disposed = false,
      frame = 0,
      visible = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(canvas.current!);
    void loadGameImages()
      .then((images) => {
        if (disposed) return;
        const start = performance.now();
        function draw(now: number) {
          if (disposed) return;
          if (visible) {
            const t = reduced ? 3.4 : Math.max(0, (now - start) / 1000);
            ctx!.clearRect(0, 0, 600, 280);
            ctx!.fillStyle = '#d3ed85';
            ctx!.fillRect(0, 0, 600, 280);
            {
              const loop = Array.from({ length: 44 }, (_, i) => {
                if (i < 16) return { x: 5 + i, y: 3 };
                if (i < 23) return { x: 20, y: 4 + i - 16 };
                if (i < 38) return { x: 19 - (i - 23), y: 10 };
                return { x: 5, y: 9 - (i - 38) };
              });
              const tick = t * 7,
                at = Math.floor(tick) % 44,
                fraction = tick % 1;
              const eaten = Math.max(0, Math.floor((tick + 32) / 44));
              const length = 5 + (eaten % 7);
              const fruit = loop[12];
              if (at !== 12) {
                const img = images.get(GAME_FLAVORS[eaten % 3].image)!;
                const height = 56,
                  width = (height * img.naturalWidth) / img.naturalHeight;
                ctx!.drawImage(
                  img,
                  fruit.x * cell + cell / 2 - width / 2,
                  fruit.y * cell + cell / 2 - height / 2,
                  width,
                  height,
                );
              }
              drawSnake(
                ctx!,
                Array.from({ length }, (_, i) => {
                  const a = loop[(at - i + 440) % 44],
                    b = loop[(at - i - 1 + 440) % 44];
                  return {
                    x: b.x + (a.x - b.x) * fraction,
                    y: b.y + (a.y - b.y) * fraction,
                  };
                }),
                at < 16 ? 'right' : at < 23 ? 'down' : at < 38 ? 'left' : 'up',
                cell,
                now,
              );
              const since = (tick - 12 + 4400) % 44;
              if (since < 5) {
                ctx!.globalAlpha = 1 - since / 5;
                ctx!.fillStyle = '#008c37';
                ctx!.font = 'bold 28px sans-serif';
                ctx!.fillText('+1', fruit.x * cell, fruit.y * cell - since * 7);
                ctx!.globalAlpha = 1;
              }
            }
          }
          if (!reduced) frame = requestAnimationFrame(draw);
        }
        draw(performance.now());
        if (canvas.current) canvas.current.dataset.rendered = 'true';
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return (
    <canvas
      width={600}
      height={280}
      ref={canvas}
      className="game-preview-canvas"
      aria-hidden="true"
    />
  );
}

function MemoryPreview() {
  const [{ step, round }, setPreview] = useState({ step: 0, round: 0 }),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = true;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    const timer = setInterval(() => {
      if (visible)
        setPreview((current) => ({
          step: (current.step + 1) % 12,
          round: current.round + (current.step === 11 ? 1 : 0),
        }));
    }, 850);
    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, []);
  return (
    <div
      ref={root}
      className="memory-preview game-preview-canvas"
      aria-hidden="true"
    >
      {(round % 2 === 0
        ? [0, 1, 2, 0, 3, 2, 1, 3]
        : [2, 3, 0, 1, 0, 1, 3, 2]
      ).map((flavor, index, layout) => {
        const pair = layout.slice(0, index).includes(flavor),
          matchStep = 3 + flavor * 2,
          revealed = step === 0 || step >= matchStep - (pair ? 0 : 1);
        return (
          <span
            key={`${round}-${index}`}
            className="memory-preview-card"
            data-front={revealed || undefined}
            data-match={step >= matchStep || undefined}
          >
            <span className="memory-card-body">
              <span className="memory-face memory-back">
                <img src="/brand/lif-official.svg" alt="" />
              </span>
              <span className="memory-face memory-front">
                <img src={GAME_FLAVORS[flavor].image} alt="" />
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

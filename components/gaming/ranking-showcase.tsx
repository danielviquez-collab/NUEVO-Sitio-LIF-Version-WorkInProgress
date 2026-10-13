'use client';
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The scrollable ranking region needs keyboard focus. */

import { ArrowDown, Hand, LoaderCircle, Sparkle, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Leaderboard } from '@/lib/gaming/client';
import { GAME_CONFIG } from '@/lib/gaming/config';
import {
  advancePodiumScoreReveal,
  podiumScoreValue,
  PODIUM_SCORE_REVEAL_MS,
} from '@/lib/gaming/score-reveal';
import { useHeroMotion } from './hero-motion';
import {
  PodiumScoreFigure,
  RankingPodiumPlayers,
  RankingTableRows,
} from './ranking-content';

function PodiumScore({ score }: { score: number }) {
  const { element, playing, reduced } = useHeroMotion();
  const progress = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (reduced) {
      progress.current = PODIUM_SCORE_REVEAL_MS;
      let active = true;
      queueMicrotask(() => {
        if (active) setElapsed(PODIUM_SCORE_REVEAL_MS);
      });
      return () => {
        active = false;
      };
    }
    if (!playing || progress.current >= PODIUM_SCORE_REVEAL_MS) return;
    let frame = 0;
    let previous: number | undefined;
    const advance = (time: number) => {
      if (previous !== undefined) {
        progress.current = advancePodiumScoreReveal(
          progress.current,
          time - previous,
        );
      }
      previous = time;
      setElapsed(progress.current);
      if (progress.current < PODIUM_SCORE_REVEAL_MS)
        frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing, reduced]);
  const value = reduced ? score : podiumScoreValue(score, elapsed);
  return <PodiumScoreFigure element={element} score={score} value={value} />;
}

export function RankingPodium({ ranking }: { ranking: Leaderboard | null }) {
  const { element, playing } = useHeroMotion();
  useEffect(() => {
    const root = element.current;
    if (!root) return;
    let disposed = false,
      frame = 0;
    const fit = () => {
      if (disposed) return;
      const names = Array.from(
        root.querySelectorAll<HTMLElement>('[data-nickname]'),
      );
      const maximums = names.map((name) =>
        parseFloat(
          getComputedStyle(name).getPropertyValue('--podium-name-max'),
        ),
      );
      names.forEach((name, i) =>
        name.style.setProperty('--podium-name-size', `${maximums[i]}px`),
      );
      // Actual glyph widths include emojis; cap each following place below its predecessor.
      let previous = Infinity;
      names.forEach((name, i) => {
        const pulse = i === 0 ? 1.14 : 1;
        const scale = Math.min(
          1,
          Math.max(1, name.clientWidth - 10) /
            Math.max(1, name.firstElementChild!.scrollWidth * pulse),
        );
        const size =
          Math.floor(Math.min(maximums[i] * scale, previous * 0.88) * 10) / 10;
        name.style.setProperty('--podium-name-size', `${size}px`);
        previous = size;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    void document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    fit();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', schedule);
    };
  }, [element, ranking?.top]);
  return (
    <div
      ref={element}
      className="game-podium-motion"
      data-playing={playing}
      aria-busy={ranking === null}
      data-lif-ranking-state
    >
      <h3 className="game-podium-title" aria-label="Top 3 jugadores">
        <span className="game-podium-award" aria-hidden="true">
          <span className="game-podium-award-art">
            <Image
              src="/gaming/podium/top-players-award-v1.png"
              alt=""
              width={1448}
              height={1086}
              loading="lazy"
              unoptimized
            />
            <span className="game-podium-award-cup">
              TOP <b>3</b>
            </span>
            <span className="game-podium-award-ribbon">JUGADORES</span>
            <Sparkle className="game-podium-award-glint game-podium-award-glint-1" />
            <Sparkle className="game-podium-award-glint game-podium-award-glint-2" />
            <Sparkle className="game-podium-award-glint game-podium-award-glint-3" />
          </span>
        </span>
      </h3>
      <div
        className="game-podium-lighting game-podium-center-lighting"
        aria-hidden="true"
      >
        <div className="game-podium-spotlight game-podium-spotlight-center">
          <div className="game-podium-gimbal">
            <span className="game-podium-beam" />
            <span className="game-podium-lamp" />
          </div>
        </div>
      </div>
      <div className="game-podium-scene">
        <div className="game-podium-lighting" aria-hidden="true">
          <div className="game-podium-spotlight game-podium-spotlight-left">
            <div className="game-podium-gimbal">
              <span className="game-podium-beam" />
              <span className="game-podium-lamp" />
            </div>
          </div>
          <div className="game-podium-spotlight game-podium-spotlight-right">
            <div className="game-podium-gimbal">
              <span className="game-podium-beam" />
              <span className="game-podium-lamp" />
            </div>
          </div>
        </div>
        <Image
          className="game-podium-stage"
          src="/gaming/podium/podium-green-stage-v1.png"
          alt=""
          aria-hidden="true"
          width={1942}
          height={809}
          loading="lazy"
          unoptimized
        />
        <ol
          className="game-ranking-podium"
          data-lif-ranking="podium"
          aria-label="Podio de los primeros tres lugares"
        >
          {ranking && (
            <RankingPodiumPlayers
              ranking={ranking}
              renderScore={(row) => <PodiumScore score={row.score} />}
            />
          )}
        </ol>
      </div>
    </div>
  );
}

export function RankingList({ ranking }: { ranking: Leaderboard | null }) {
  const { element, playing, reduced } = useHeroMotion();
  const scroll = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const updateScroll = useCallback(() => {
    const list = scroll.current;
    if (!list) return;
    setOverflow(list.scrollHeight > list.clientHeight + 1);
    setAtEnd(list.scrollTop + list.clientHeight >= list.scrollHeight - 2);
  }, []);
  useEffect(() => {
    const list = scroll.current;
    if (!list) return;
    const observer = new ResizeObserver(updateScroll);
    observer.observe(list);
    updateScroll();
    return () => observer.disconnect();
  }, [ranking?.top.length, updateScroll]);
  const rows = ranking?.top.slice(0, GAME_CONFIG.LEADERBOARD_SIZE) ?? [];
  return (
    <div
      ref={element}
      className="game-ranking-list"
      data-playing={playing}
      data-scrollable={rows.length > 0 && overflow}
      data-reduced={reduced}
      aria-busy={ranking === null}
      data-lif-ranking-state
    >
      <section
        ref={scroll}
        id="lif-ranking-scroll"
        className="game-ranking-scroll"
        tabIndex={0}
        aria-label="Ranking unificado: veinte mejores puntuaciones LIF"
        onScroll={() => {
          setInteracted(true);
          updateScroll();
        }}
      >
        <table aria-label="Ranking unificado: veinte mejores puntajes LIF">
          <thead>
            <tr>
              <th scope="col">POSICIÓN</th>
              <th scope="col">NICKNAME</th>
              <th scope="col">JUEGO</th>
              <th scope="col">SCORE</th>
            </tr>
          </thead>
          <tbody data-lif-ranking="rows">
            {!rows.length && (
              <tr>
                <td colSpan={4} className="game-ranking-status">
                  <div role="status">
                    {ranking === null ? (
                      <>
                        <LoaderCircle aria-hidden="true" />
                        <span>Cargando ranking…</span>
                      </>
                    ) : (
                      <>
                        <Trophy aria-hidden="true" />
                        <strong>Estrená el ranking.</strong>
                        <span>Tu próximo récord puede abrir la lista.</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {ranking && <RankingTableRows ranking={ranking} />}
          </tbody>
        </table>
      </section>
      {rows.length > 0 && overflow && (
        <button
          type="button"
          className="game-ranking-scroll-cue"
          aria-controls="lif-ranking-scroll"
          aria-label={
            atEnd ? 'Volver a las primeras posiciones' : 'Ver mas posiciones'
          }
          title={
            atEnd ? 'Volver a las primeras posiciones' : 'Ver mas posiciones'
          }
          data-prompt={!interacted}
          data-direction={atEnd ? 'up' : 'down'}
          onClick={() => {
            setInteracted(true);
            const list = scroll.current;
            if (!list) return;
            list.scrollBy({
              top: list.clientHeight * 0.75 * (atEnd ? -1 : 1),
              behavior: reduced ? 'instant' : 'smooth',
            });
          }}
        >
          <Hand className="game-ranking-scroll-hand" aria-hidden="true" />
          <ArrowDown className="game-ranking-scroll-arrow" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

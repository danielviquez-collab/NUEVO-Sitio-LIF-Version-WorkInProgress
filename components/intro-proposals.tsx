'use client';
/* eslint-disable jsx-a11y/prefer-tag-over-role */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  ArrowLeft,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { INTRO_PROPOSALS, introPose } from '@/lib/intro-proposals';
import { IntroProposalAudio } from '@/lib/intro-proposal-audio';
import {
  completeIntroPose,
  INTRO_PARTS,
  type IntroPart,
} from '@/lib/intro-choreography';
import { lifLogoVector, lifLogoViewBox } from '@/lib/lif-logo-vector';
import { CINEMATIC_NAMES, cinematicIntroPose } from '@/lib/intro-cinematic';
import StaticLink from './static-link';

const initialCenters: Record<IntroPart, { x: number; y: number }> = {
  leaf: { x: 548, y: 538 },
  letterL: { x: 407, y: 570 },
  letterI: { x: 501, y: 575 },
  letterF: { x: 660, y: 530 },
  dot: { x: 502, y: 450 },
  laica: { x: 633, y: 633 },
};
function motionTransform(
  pose: { x: number; y: number; rotation: number; sx: number; sy: number },
  center: { x: number; y: number },
) {
  return `translate(${pose.x} ${pose.y}) translate(${center.x} ${center.y}) rotate(${pose.rotation}) scale(${pose.sx} ${pose.sy}) translate(${-center.x} ${-center.y})`;
}
export function IntroProposals({
  initial = 'actual',
  wholeLogo = false,
  cinematic = false,
}: {
  initial?: string;
  wholeLogo?: boolean;
  cinematic?: boolean;
}) {
  const maskPrefix = useId().replaceAll(':', '');
  const [selected, setSelected] = useState(
    INTRO_PROPOSALS.find((p) => p.id === initial) ?? INTRO_PROPOSALS[0],
  );
  const [treatment, setTreatment] = useState(true),
    [volume, setVolume] = useState(70),
    [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<
    'idle' | 'loading' | 'playing' | 'paused' | 'done'
  >('idle');
  const [timeMs, setTimeMs] = useState(selected.durationMs),
    [error, setError] = useState('');
  const [reduced, setReduced] = useState(false);
  const [player] = useState(() => new IntroProposalAudio());
  const frame = useRef(0),
    generation = useRef(0),
    logo = useRef<SVGSVGElement>(null);
  const [centers, setCenters] = useState(initialCenters);
  const ready = centers !== initialCenters;
  const stopPlayback = useCallback(() => {
    generation.current++;
    cancelAnimationFrame(frame.current);
    player.stop();
  }, [player]);
  useEffect(() => {
    const measurement = requestAnimationFrame(() => {
      const next = { ...initialCenters };
      for (const part of INTRO_PARTS) {
        const bounds = logo.current
          ?.querySelector<SVGGElement>(`[data-part="${part}"]`)
          ?.getBBox();
        if (bounds)
          next[part] = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
          };
      }
      setCenters(next);
    });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener('change', change);
    return () => {
      cancelAnimationFrame(measurement);
      stopPlayback();
      player.dispose();
      media.removeEventListener('change', change);
    };
  }, [player, stopPlayback]);
  function stop() {
    stopPlayback();
    setTimeMs(selected.durationMs);
    setPhase('idle');
    setError('');
  }
  function select(index: number) {
    stop();
    const next = INTRO_PROPOSALS[index];
    setSelected(next);
    setTimeMs(next.durationMs);
  }
  function navigateTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % INTRO_PROPOSALS.length;
    else if (event.key === 'ArrowLeft')
      next = (index + INTRO_PROPOSALS.length - 1) % INTRO_PROPOSALS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = INTRO_PROPOSALS.length - 1;
    else return;
    event.preventDefault();
    select(next);
    document
      .getElementById(`intro-option-${INTRO_PROPOSALS[next].id}`)
      ?.focus();
  }
  async function play(restart = false) {
    const offset =
      !restart && phase === 'paused' && timeMs < selected.durationMs - 0.5
        ? timeMs
        : 0;
    cancelAnimationFrame(frame.current);
    const request = ++generation.current;
    player.setVolume(muted ? 0 : volume / 100);
    setPhase('loading');
    setError('');
    try {
      if (
        !(await player.play(
          treatment ? selected.refined : selected.raw,
          offset,
        )) ||
        request !== generation.current
      )
        return;
      setTimeMs(offset);
      setPhase('playing');
      function draw() {
        if (request !== generation.current) return;
        const ms = player.timeMs();
        setTimeMs(ms);
        if (ms >= player.duration() - 0.5) {
          setTimeMs(selected.durationMs);
          setPhase('done');
          player.stop();
        } else frame.current = requestAnimationFrame(draw);
      }
      frame.current = requestAnimationFrame(draw);
    } catch {
      if (request !== generation.current) return;
      setPhase('idle');
      setTimeMs(selected.durationMs);
      setError('No se pudo preparar el sonido. Volvé a intentar.');
    }
  }
  const pause = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setTimeMs(player.pause());
    setPhase('paused');
  }, [player]);
  function seek(ms: number) {
    stopPlayback();
    setTimeMs(ms);
    setPhase('paused');
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden && phase === 'playing') pause();
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [phase, pause]);
  const pose = introPose(selected, reduced ? selected.durationMs : timeMs);
  const cinematicPose = cinematic
    ? cinematicIntroPose(selected, reduced ? selected.durationMs : timeMs)
    : null;
  const full =
    cinematicPose ??
    (wholeLogo
      ? completeIntroPose(selected, reduced ? selected.durationMs : timeMs)
      : null);
  const progress = Math.min(1, timeMs / selected.durationMs);
  const seconds = (timeMs / 1000).toFixed(2);
  return (
    <main
      className="intro-review"
      data-phase={phase}
      data-proposal={selected.id}
      data-time={timeMs.toFixed(3)}
      data-choreography={
        cinematic ? 'cinematic' : wholeLogo ? 'complete' : 'reference'
      }
      data-ready={ready}
      aria-busy={!ready}
    >
      <header className="intro-review-header">
        <StaticLink href="/" className="intro-back" title="Volver al sitio">
          <ArrowLeft aria-hidden="true" />
          <span>Volver al sitio</span>
        </StaticLink>
        <nav className="intro-mode" aria-label="Versión de entrada">
          <StaticLink
            href={`/pruebas/entrada?opcion=${selected.id}`}
            aria-current={!wholeLogo && !cinematic ? 'page' : undefined}
          >
            Actual
          </StaticLink>
          <StaticLink
            href={`/pruebas/entrada-completa?opcion=${selected.id}`}
            aria-current={wholeLogo && !cinematic ? 'page' : undefined}
          >
            Animación I
          </StaticLink>
          <StaticLink
            href={`/pruebas/entrada-cinematica?opcion=${selected.id}`}
            aria-current={cinematic ? 'page' : undefined}
          >
            Animación II
          </StaticLink>
        </nav>
        <span className="intro-local">Vista local</span>
      </header>
      <div
        className="intro-options"
        role="tablist"
        aria-label="Propuestas de entrada"
      >
        {INTRO_PROPOSALS.map((proposal, index) => (
          <button
            key={proposal.id}
            type="button"
            disabled={!ready}
            role="tab"
            id={`intro-option-${proposal.id}`}
            aria-selected={selected.id === proposal.id}
            aria-controls="intro-scene"
            tabIndex={selected.id === proposal.id ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => navigateTabs(event, index)}
          >
            <span>0{index + 1}</span>
            {cinematic ? CINEMATIC_NAMES[proposal.id] : proposal.name}
          </button>
        ))}
      </div>
      <section
        id="intro-scene"
        className="intro-scene"
        role="tabpanel"
        aria-labelledby={`intro-option-${selected.id}`}
      >
        <svg
          ref={logo}
          className="intro-logo-vector"
          viewBox={lifLogoViewBox}
          aria-label="LIF, una marca de LAICA"
          role="img"
          style={{ transform: `scale(${full ? 1 : pose.cameraScale})` }}
        >
          {cinematicPose && (
            <defs>
              {INTRO_PARTS.filter((part) => part !== 'dot').map((part) => {
                const m = cinematicPose.material[part];
                return (
                  <clipPath
                    key={part}
                    id={`${maskPrefix}-${part}`}
                    clipPathUnits="userSpaceOnUse"
                  >
                    <circle cx={m.x} cy={m.y} r={m.radius} />
                  </clipPath>
                );
              })}
            </defs>
          )}
          <g
            data-ensemble="true"
            transform={
              full
                ? motionTransform(full.ensemble, { x: 548, y: 538 })
                : undefined
            }
          >
            {cinematicPose && (
              <path
                data-motion-trail="true"
                d={cinematicPose.trail
                  .map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`)
                  .join(' ')}
                fill="none"
                stroke="#ffda27"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={cinematicPose.trailOpacity}
              />
            )}
            {INTRO_PARTS.map((part, index) => (
              <g
                key={part}
                data-part={part}
                opacity={
                  full
                    ? full.parts[part].opacity
                    : part === 'dot'
                      ? pose.opacity
                      : part === 'leaf'
                        ? pose.leafOpacity
                        : part === 'laica'
                          ? pose.signatureOpacity
                          : pose.letterOpacity[index - 1]
                }
                transform={
                  full
                    ? motionTransform(full.parts[part], centers[part])
                    : part === 'dot'
                      ? motionTransform(pose, centers.dot)
                      : part === 'leaf'
                        ? `translate(0 ${pose.leafY})`
                        : undefined
                }
              >
                {cinematicPose && part !== 'dot' ? (
                  <>
                    <g data-ink={cinematicPose.material[part].ink}>
                      {lifLogoVector[part].map((path, i) => (
                        <path
                          key={i}
                          {...path}
                          fill="none"
                          stroke={part === 'leaf' ? '#009b3c' : '#ffffff'}
                          strokeWidth={part === 'leaf' ? 6 : 3}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          pathLength={1}
                          strokeDasharray="1"
                          strokeDashoffset={
                            1 - cinematicPose.material[part].ink
                          }
                          opacity={cinematicPose.material[part].outline}
                        />
                      ))}
                    </g>
                    <g
                      clipPath={`url(#${maskPrefix}-${part})`}
                      opacity={cinematicPose.material[part].fill}
                    >
                      {lifLogoVector[part].map((path, i) => (
                        <path key={i} {...path} />
                      ))}
                    </g>
                  </>
                ) : (
                  lifLogoVector[part].map((path, i) => (
                    <path key={i} {...path} />
                  ))
                )}
              </g>
            ))}
          </g>
        </svg>
      </section>
      <footer className="intro-review-footer">
        <div className="intro-track">
          <div>
            <strong>
              {cinematic ? CINEMATIC_NAMES[selected.id] : selected.name}
            </strong>
            <span>{selected.source}</span>
          </div>
          <fieldset className="intro-treatment" disabled={!ready}>
            <legend className="sr-only">Versión de audio</legend>
            <button
              type="button"
              aria-pressed={!treatment}
              onClick={() => {
                stop();
                setTreatment(false);
              }}
            >
              Original
            </button>
            <button
              type="button"
              aria-pressed={treatment}
              onClick={() => {
                stop();
                setTreatment(true);
              }}
            >
              Ajustado
            </button>
          </fieldset>
        </div>
        <div className="intro-timeline">
          <span
            className="intro-timeline-fill"
            style={{ width: `${progress * 100}%` }}
          />
          {selected.cues.map((at) => (
            <i
              key={at}
              style={{ left: `${(at / selected.durationMs) * 100}%` }}
              data-passed={timeMs >= at || undefined}
            />
          ))}
          <input
            type="range"
            min={0}
            max={selected.durationMs}
            step={1}
            value={timeMs}
            disabled={!ready || phase === 'loading'}
            aria-label="Posición de la animación"
            aria-valuetext={`${seconds} segundos`}
            onChange={(event) => seek(Number(event.target.value))}
          />
        </div>
        <div className="intro-controls">
          <div className="intro-transport">
            <button
              type="button"
              title={phase === 'playing' ? 'Pausar' : 'Reproducir'}
              aria-label={phase === 'playing' ? 'Pausar' : 'Reproducir'}
              disabled={!ready || phase === 'loading'}
              onClick={() => (phase === 'playing' ? pause() : void play())}
            >
              {phase === 'loading' ? (
                <LoaderCircle className="intro-loading" />
              ) : phase === 'playing' ? (
                <Pause />
              ) : (
                <Play />
              )}
            </button>
            <button
              type="button"
              title="Repetir"
              disabled={!ready}
              aria-label="Repetir"
              onClick={() => void play(true)}
            >
              <RotateCcw />
            </button>
            <button
              type="button"
              title="Detener"
              disabled={!ready}
              aria-label="Detener"
              onClick={stop}
            >
              <Square />
            </button>
            <output className="intro-time">
              {seconds} / {(selected.durationMs / 1000).toFixed(2)} s
            </output>
          </div>
          <div className="intro-volume">
            <button
              type="button"
              title={muted ? 'Activar sonido' : 'Silenciar'}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              aria-pressed={muted}
              disabled={!ready}
              onClick={() => {
                setMuted(!muted);
                player.setVolume(!muted ? 0 : volume / 100);
              }}
            >
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              aria-label="Volumen"
              disabled={!ready}
              onChange={(event) => {
                const next = Number(event.target.value);
                setVolume(next);
                setMuted(false);
                player.setVolume(next / 100);
              }}
            />
          </div>
        </div>
        <output className="intro-status" aria-live="polite">
          {error || (phase === 'loading' ? 'Preparando audio…' : '')}
        </output>
      </footer>
    </main>
  );
}

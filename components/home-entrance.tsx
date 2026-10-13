'use client';

import { createContext, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import Link from './static-link';
import { AnimatedLifLogo } from './animated-lif-logo';

const INTRO_DURATION = 1950;
export const EntranceContext = createContext(false);

export function HomeEntrance({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const [phase, setPhase] = useState<'pending' | 'playing' | 'done'>('pending');
  const [iteration, setIteration] = useState(0);
  const [travel, setTravel] = useState<CSSProperties>({});
  const [audioActive, setAudioActive] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const homeRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<number | null>(null);
  const playbackId = useRef(0);
  const focusRef = useRef<HTMLElement | null>(null);
  const manualReplay = useRef(false);

  const finish = useCallback(() => {
    playbackId.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    audioRef.current?.pause();
    setAudioActive(false);
    setPhase('done');
    if (manualReplay.current || document.activeElement?.closest('.logo-entry-overlay')) {
      window.requestAnimationFrame(() => {
        const target = focusRef.current?.isConnected ? focusRef.current : homeRef.current?.parentElement?.querySelector<HTMLElement>('.intro-home-sound, .brand-lockup');
        target?.focus({ preventScroll: true });
      });
    }
  }, []);

  const start = useCallback((withSound: boolean) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const id = ++playbackId.current;
    manualReplay.current = withSound;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.hidden || (reducedMotion && !withSound)) { finish(); return; }
    focusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const target = homeRef.current?.querySelector<HTMLImageElement>('.brand-lockup img');
    const bounds = target?.getBoundingClientRect();
    const width = Math.min(440, window.innerWidth * .82);
    if (target && bounds) {
      setTravel({
        '--logo-travel-x': `${bounds.left + bounds.width / 2 - window.innerWidth / 2}px`,
        '--logo-travel-y': `${bounds.top + bounds.height / 2 - window.innerHeight / 2}px`,
        '--logo-travel-scale': Math.min(target.offsetWidth, target.offsetHeight * 956 / 600) / width,
      } as CSSProperties);
    }
    setIteration((value) => value + 1);
    setPhase(reducedMotion ? 'done' : 'playing');
    setAudioActive(false);
    const started = performance.now();
    const audio = audioRef.current;
    let muted = false;
    try {
      if (withSound) sessionStorage.removeItem('lif-intro-muted');
      else muted = sessionStorage.getItem('lif-intro-muted') === 'true';
    } catch { /* Audio preferences remain optional when storage is unavailable. */ }
    if (audio && !muted) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = .8;
      // Never wait for audio permission or buffering before revealing the site.
      void audio.play().then(() => {
        if (id !== playbackId.current) return;
        const lag = (performance.now() - started) / 1000;
        if (lag > .18 || document.hidden) {
          audio.pause();
          setSoundBlocked(true);
          return;
        }
        if (lag > .03) audio.currentTime = lag;
        setAudioActive(true);
        setSoundBlocked(false);
      }).catch(() => {
        if (id === playbackId.current) { setAudioActive(false); setSoundBlocked(true); }
      });
    }
    timerRef.current = window.setTimeout(finish, INTRO_DURATION);
  }, [finish]);

  function silence() {
    audioRef.current?.pause();
    setAudioActive(false);
    setSoundBlocked(true);
    try { sessionStorage.setItem('lif-intro-muted', 'true'); } catch { /* Keep the current visit muted. */ }
  }

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      if (!preview && document.documentElement.dataset.homeEntry === 'content') finish();
      else start(false);
    }, 0);
    const onVisibility = () => { if (document.hidden) finish(); };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => { if (motion.matches) finish(); };
    const audio = audioRef.current;
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    return () => {
      playbackId.current += 1;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      audio?.pause();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
    };
  }, [finish, preview, start]);

  const soundLabel = audioActive ? 'Silenciar bienvenida' : 'Repetir bienvenida con sonido';
  return (
    <EntranceContext.Provider value={phase !== 'done'}>
    <div className={`home-entrance${phase === 'playing' ? ' is-entering' : ''}`} data-intro-state={phase}>
      <audio ref={audioRef} src="/audio/lif-pour.mp3" preload="auto" onEnded={() => setAudioActive(false)} />
      <div className="entrance-home" ref={homeRef} inert={phase === 'playing' || undefined}>{children}</div>
      {phase !== 'done' && (
        <div className={`logo-entry-overlay${phase === 'pending' ? ' is-waiting' : ''}`} key={iteration} style={travel} role="region" aria-label="Bienvenida a LIF" onKeyDown={(event) => { if (event.key === 'Escape') finish(); }}>
          <div className="logo-entry-traveler"><AnimatedLifLogo animate={phase === 'playing'} /></div>
          <div className="intro-overlay-controls">
            <button type="button" className="intro-sound" title={soundLabel} aria-label={soundLabel} onClick={() => {
              if (audioActive) silence();
              else start(true);
            }}>{audioActive ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}</button>
            <button type="button" className="intro-skip" onClick={finish}>Entrar <ArrowRight aria-hidden="true" /></button>
          </div>
        </div>
      )}
      {preview && phase === 'done' && (
        <button type="button" className="intro-sound intro-home-sound" title={soundLabel} aria-label={soundLabel} data-sound-blocked={soundBlocked || undefined} onClick={() => {
          if (audioActive) silence();
          else start(true);
        }}>{audioActive || !soundBlocked ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}</button>
      )}
      {preview && phase === 'done' && <div className="motion-review-controls">
        <button type="button" onClick={() => start(true)}><RotateCcw aria-hidden="true" /> Repetir con sonido</button>
        <a href="/brand/lif-official.svg" target="_blank" rel="noreferrer">Logo original</a>
        <Link href="/">Ver sitio <ArrowRight aria-hidden="true" /></Link>
      </div>}
      <noscript><style>{'.logo-entry-overlay,.intro-home-sound{display:none!important}'}</style></noscript>
    </div>
    </EntranceContext.Provider>
  );
}

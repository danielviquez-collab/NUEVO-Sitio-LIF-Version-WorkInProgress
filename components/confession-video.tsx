'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { playWithMutedFallback } from '@/lib/media-playback';
import { isMediaOverlayActive, subscribeMediaOverlay } from '@/lib/media-priority';
import { pageMedia } from '@/lib/visible-media';

type Props = { variant?: 'hero' | 'reel' | 'community'; src?: string; poster?: string; label?: string };

export function ConfessionVideo({ variant = 'hero', src = '/campaign/gato-lif.mp4', poster = '/campaign/gato-lif-poster.webp', label = 'Anuncio LIF: una pausa en la vida adulta' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const attempt = useRef(0);
  const requestPlayback = useRef<(automatic: boolean) => void>(() => {});
  const selectVideo = useRef<() => void>(() => {});
  const selectedVideo = useRef(false);
  const refreshPriority = useRef<() => void>(() => {});
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const hoverPlayback = useRef(false);
  const explicitPlayback = useRef(false);
  const interactive = variant === 'community';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    let ratio = 0;
    let selected = false;
    let disposed = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function canPlay(automatic: boolean) {
      return !disposed && visible && selected && !document.hidden && !manuallyPaused.current && !isMediaOverlayActive()
        && (!automatic || (visible && !reducedMotion.matches));
    }
    function resume(automatic = true) {
      if (!canPlay(automatic)) return;
      const currentAttempt = ++attempt.current;
      const isCurrent = () => currentAttempt === attempt.current && canPlay(automatic);
      void playWithMutedFallback(video!, isCurrent).then(() => {
        if (isCurrent()) setMuted(video!.muted);
      }).catch(() => {
        // The existing play control remains available after a failed attempt.
        if (isCurrent()) setPlaying(false);
      });
    }
    function stop() {
      attempt.current++;
      video!.pause();
    }
    requestPlayback.current = resume;

    const candidate = pageMedia.register((active) => {
      selected = active;
      selectedVideo.current = active;
      if (active) resume(!interactive);
      else stop();
    });
    const updateCandidate = () => candidate.update(ratio, !interactive && !reducedMotion.matches, !manuallyPaused.current && !document.hidden && !isMediaOverlayActive());
    selectVideo.current = () => { updateCandidate(); candidate.select(); };
    refreshPriority.current = updateCandidate;

    const observer = new IntersectionObserver(([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      visible = ratio >= .3;
      updateCandidate();
      if (visible && selected) resume(!interactive);
      else { explicitPlayback.current = false; hoverPlayback.current = false; stop(); }
    }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] });
    observer.observe(video);
    const onVisibility = () => { updateCandidate(); if (document.hidden) stop(); else resume(); };
    const onMotion = () => { updateCandidate(); if (reducedMotion.matches) stop(); else resume(); };
    const unsubscribe = subscribeMediaOverlay((active) => { updateCandidate(); if (active) stop(); else resume(); });
    const onPageHide = () => stop();
    const onPageShow = () => resume();
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotion);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      disposed = true;
      requestPlayback.current = () => {};
      selectVideo.current = () => {};
      refreshPriority.current = () => {};
      candidate.dispose();
      unsubscribe();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotion);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      stop();
    };
  }, [src, interactive]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video || isMediaOverlayActive()) return;
    if (video.paused) {
      explicitPlayback.current = true;
      manuallyPaused.current = false;
      selectVideo.current();
      requestPlayback.current(false);
    } else {
      explicitPlayback.current = false;
      manuallyPaused.current = true;
      attempt.current++;
      video.pause();
      refreshPriority.current();
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video || isMediaOverlayActive()) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) {
      explicitPlayback.current = true;
      manuallyPaused.current = false;
      selectVideo.current();
      requestPlayback.current(false);
    }
  }

  function replay() {
    const video = videoRef.current;
    if (!video) return;
    if (interactive) {
      manuallyPaused.current = true;
      explicitPlayback.current = false;
      setPlaying(false);
      refreshPriority.current();
      return;
    }
    // Keep the user's sound choice (or the browser's muted fallback) on repeats.
    video.currentTime = 0;
    requestPlayback.current(true);
  }

  return (
    <section className={`confession-video${variant !== 'hero' ? ' confession-video-reel' : ''}${interactive ? ' confession-video-community' : ''}`} aria-label={label} data-playing={playing} onPointerEnter={(event) => {
      if (!interactive || event.pointerType !== 'mouse' || !matchMedia('(min-width: 1101px) and (hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches || isMediaOverlayActive()) return;
      hoverPlayback.current = true;
      manuallyPaused.current = false;
      selectVideo.current();
      requestPlayback.current(false);
    }} onPointerLeave={() => {
      if (!interactive || !hoverPlayback.current || explicitPlayback.current) return;
      hoverPlayback.current = false;
      manuallyPaused.current = true;
      attempt.current++;
      videoRef.current?.pause();
      refreshPriority.current();
    }}>
      {/* Supplied campaign videos include on-screen copy; no separate caption track was provided. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} src={src} poster={poster} playsInline preload={variant !== 'hero' ? 'none' : 'metadata'} aria-label={label} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => { if (interactive) setPosition(event.currentTarget.currentTime); }} onEnded={replay} onPlay={(event) => {
        if (isMediaOverlayActive() || !selectedVideo.current) { event.currentTarget.pause(); return; }
        setPlaying(true);
      }} onPause={() => setPlaying(false)} onVolumeChange={(event) => setMuted(event.currentTarget.muted)} onError={() => setFailed(true)} />
      {interactive && !playing && !failed && <button type="button" className="community-play" onClick={togglePlayback} aria-label={`Reproducir ${label}`}><Play aria-hidden="true" fill="currentColor" /></button>}
      {interactive && duration > 0 && <input className="community-seek" type="range" min={0} max={duration} step={.1} value={position} aria-label={`Avance de ${label}`} onChange={(event) => { const time = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = time; setPosition(time); }} />}
      {failed ? <p className="video-error">No se pudo cargar el video.</p> : <div className="video-controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pausar video' : 'Reproducir video'} title={playing ? 'Pausar video' : 'Reproducir video'}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
        <button type="button" onClick={toggleSound} aria-label={muted ? 'Activar sonido' : 'Silenciar video'} title={muted ? 'Activar sonido' : 'Silenciar video'} aria-pressed={!muted}>{muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
      </div>}
    </section>
  );
}

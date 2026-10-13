'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { track } from '@/lib/analytics';
import { isGameSessionActive, subscribeGameSession } from '@/lib/game-session';
import { campaignConfig, campaignSessionKey, localCampaignQA } from '@/lib/interstitial-config';
import { internalDestination, InterstitialSession, restoreSession } from '@/lib/interstitial-session';
import { playWithMutedFallback } from '@/lib/media-playback';
import { acquireMediaOverlay, isMediaOverlayActive } from '@/lib/media-priority';

type QAState = { seconds: number; threshold: number; game: boolean; grace: number; status: string; video: string };

export function VideoInterstitial() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const retryRef = useRef<() => void>(() => {});
  const skipRef = useRef<() => void>(() => {});
  const soundRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const [needsPlay, setNeedsPlay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [skipRemaining, setSkipRemaining] = useState<number | null>(null);
  const [qa, setQA] = useState<QAState | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || !video) return;
    const params = new URLSearchParams(location.search);
    const testing = localCampaignQA(process.env.NODE_ENV === 'development', location.hostname, location.search);
    const config = campaignConfig(testing);
    const forcedVideo = testing ? params.get('lifVideo') : null;
    if (forcedVideo && config.videos.some((item) => item.id === forcedVideo)) config.videos = config.videos.map((item) => ({ ...item, weight: item.id === forcedVideo ? 1 : 0 }));
    if (testing && params.get('lifVideoError') === '1') config.videos = config.videos.map((item) => ({ ...item, src: '/videos/interstitial/qa-missing.mp4' }));
    const sessionKey = campaignSessionKey(config.campaignId, testing);
    let disposed = false;
    let resetting = false;
    let raw: string | null = null;
    let storageWorks = true;
    try {
      raw = sessionStorage.getItem(sessionKey);
      // If frequency capping cannot survive document navigation, fail open.
      sessionStorage.setItem(`${sessionKey}_available`, '1');
      sessionStorage.removeItem(`${sessionKey}_available`);
    } catch { storageWorks = false; }
    const session = new InterstitialSession(config, Date.now(), restoreSession(raw, config));
    session.data.failed ||= !storageWorks;

    function updateQA() {
      if (!testing || disposed) return;
      setQA({ seconds: Math.floor(session.data.activeSeconds), threshold: session.data.threshold, game: session.data.gameActive,
        grace: Math.max(0, Math.ceil((session.data.graceUntil - Date.now()) / 1000)),
        status: session.data.seen ? 'Campaña vista' : session.data.failed ? 'Desactivado por error' : session.active ? 'Video activo' : session.eligible ? 'Elegible: próxima navegación' : 'Acumulando tiempo', video: session.video?.name ?? 'Sin video' });
    }
    function save() {
      if (resetting) return;
      try { sessionStorage.setItem(sessionKey, JSON.stringify(session.data)); }
      catch { session.data.failed = true; }
    }
    resetRef.current = () => {
      resetting = true;
      try { sessionStorage.removeItem(sessionKey); }
      catch { resetting = false; return; }
      location.reload();
    };
    queueMicrotask(updateQA);
    // A campaign already shown in this session installs no background listeners.
    if (!config.enabled || session.disabled) return () => { disposed = true; };

    let prepared = false;
    let destinationRoute = '';
    let impressionSent = false;
    let lastProgress = performance.now();
    let lastMediaTime = 0;
    let oldBodyOverflow = '';
    let oldRootOverflow = '';
    let locked = false;
    let previousFocus: HTMLElement | null = null;
    let releaseMedia: (() => void) | null = null;
    let playAttempt = 0;
    const sourceRoute = location.pathname;
    const attentive = () => !document.hidden && document.hasFocus()
      && (session.active || (!isMediaOverlayActive() && !document.querySelector('dialog[open]')));
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const constrained = !!connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');

    function event(name: string, extra: Record<string, string> = {}) {
      track(name, { campaign_id: config.campaignId, video_id: session.video?.id ?? '', video_name: session.video?.name ?? '',
        source_route: sourceRoute, destination_route: destinationRoute, eligibility_seconds: String(session.data.threshold), ...extra });
    }
    function prepare() {
      if (prepared || session.disabled || !session.video) return;
      prepared = true;
      video!.preload = 'auto';
      video!.src = session.video.src;
      video!.load();
    }
    function restorePage() {
      playAttempt++;
      video!.pause();
      if (dialog!.open) dialog!.close();
      if (locked) {
        document.body.style.overflow = oldBodyOverflow;
        document.documentElement.style.overflow = oldRootOverflow;
        locked = false;
      }
      releaseMedia?.();
      releaseMedia = null;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }
    function navigate(destination: string | null) {
      if (!destination) return;
      save();
      restorePage();
      location.assign(destination);
    }
    function fail(reason: string) {
      if (disposed || session.data.failed || session.data.seen) return;
      event('lif_interstitial_error', { reason });
      if (session.active) navigate(session.fail());
      else { session.data.failed = true; save(); }
      updateQA();
    }
    function play() {
      if (!session.active || disposed) return;
      const currentAttempt = ++playAttempt;
      const isCurrent = () => currentAttempt === playAttempt && !disposed && session.active && attentive();
      lastProgress = performance.now();
      setNeedsPlay(false);
      void playWithMutedFallback(video!, isCurrent).then((result) => {
        if (!isCurrent()) return;
        setMuted(video!.muted);
        setNeedsPlay(result === 'blocked');
      }).catch(() => { if (isCurrent()) fail('play_rejected'); });
    }
    retryRef.current = () => { video.muted = false; setMuted(false); play(); };
    soundRef.current = () => {
      if (!session.active || disposed) return;
      video.muted = !video.muted;
      setMuted(video.muted);
      if (!video.muted) play();
    };
    function onOtherMediaPlay(event: Event) {
      if (session.active && event.target instanceof HTMLMediaElement && event.target !== video) event.target.pause();
    }
    function show() {
      try {
        setSkipRemaining(config.skipAfterSeconds);
        oldBodyOverflow = document.body.style.overflow;
        oldRootOverflow = document.documentElement.style.overflow;
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        locked = true;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        releaseMedia = acquireMediaOverlay();
        document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => { if (media !== video && !media.paused) media.pause(); });
        prepare();
        video!.muted = false;
        setMuted(false);
        dialog!.showModal();
        dialog!.focus({ preventScroll: true });
        if (!impressionSent) { event('lif_interstitial_impression'); impressionSent = true; }
        // Stay inside the trusted click call stack, including on iOS.
        play();
        updateQA();
      } catch { fail('overlay_failed'); }
    }

    function onNavigation(click: MouseEvent) {
      if (!(click.target instanceof Element)) return;
      if (!session.active && (isMediaOverlayActive() || document.querySelector('dialog[open]'))) return;
      const link = click.target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      let destination = internalDestination({ href: link.href, target: link.target, download: link.hasAttribute('download'),
        modified: click.ctrlKey || click.metaKey || click.shiftKey || click.altKey, button: click.button, prevented: click.defaultPrevented }, location.href);
      if (!destination) return;
      if (testing) {
        const testDestination = new URL(destination);
        for (const key of ['lifInterstitialQA', 'lifVideo', 'lifVideoError']) {
          const value = params.get(key);
          if (value) testDestination.searchParams.set(key, value);
        }
        destination = testDestination.href;
      }
      session.setAttention(attentive(), Date.now());
      session.setGameActive(isGameSessionActive(), Date.now());
      if (session.eligible && !session.data.eligibleReported) { session.data.eligibleReported = true; event('lif_interstitial_eligible'); }
      const decision = session.requestNavigation(destination, Date.now());
      if (decision === 'pass') {
        if (session.data.gameActive) session.setGameActive(false, Date.now());
        session.setAttention(false, Date.now());
        save();
        if (testing) { click.preventDefault(); location.assign(destination); }
        return;
      }
      click.preventDefault();
      if (decision === 'blocked') return;
      destinationRoute = new URL(destination).pathname;
      show();
    }
    function onAttention() {
      session.setAttention(attentive(), Date.now());
      lastProgress = performance.now();
      if (session.active) {
        if (!attentive()) { playAttempt++; video!.pause(); }
        else if (!video!.ended) play();
      }
      save();
    }
    function onPlaying() {
      if (session.started()) event('lif_interstitial_video_start');
      lastProgress = performance.now();
      setNeedsPlay(false);
    }
    function onEnded() {
      if (!video!.ended) return;
      const destination = session.complete();
      if (!destination) return;
      event('lif_interstitial_video_complete');
      navigate(destination);
    }
    skipRef.current = () => {
      const destination = session.skip(video.currentTime);
      if (!destination) return;
      event('lif_interstitial_video_skip', { played_seconds: String(Math.floor(video.currentTime)) });
      navigate(destination);
    };
    function onError() { fail('media_error'); }
    function onTime() {
      if (!session.active) return;
      if (video!.currentTime > lastMediaTime) { lastProgress = performance.now(); lastMediaTime = video!.currentTime; }
      setSkipRemaining(Math.max(0, Math.ceil(config.skipAfterSeconds - video!.currentTime)));
    }
    function leavePage() {
      session.setGameActive(false, Date.now());
      session.setAttention(false, Date.now());
      if (session.active) { session.data.failed = true; session.pending = null; session.phase = 'idle'; }
      save();
      restorePage();
    }
    const unsubscribe = subscribeGameSession((active) => {
      session.setGameActive(active, Date.now());
      save();
      updateQA();
    });
    session.setGameActive(isGameSessionActive(), Date.now());
    session.setAttention(attentive(), Date.now());
    save();
    const clock = window.setInterval(() => {
      session.setAttention(attentive(), Date.now());
      if (session.eligible && !session.data.eligibleReported) { session.data.eligibleReported = true; event('lif_interstitial_eligible'); }
      if (session.shouldPreload(Date.now(), constrained)) prepare();
      save();
      updateQA();
    }, 1000);
    const watchdog = window.setInterval(() => {
      if (!session.active || !attentive()) { lastProgress = performance.now(); return; }
      if (performance.now() - lastProgress >= config.loadFailureTimeoutSeconds * 1000) fail('playback_timeout');
    }, 500);
    document.addEventListener('click', onNavigation);
    document.addEventListener('play', onOtherMediaPlay, true);
    document.addEventListener('visibilitychange', onAttention);
    window.addEventListener('focus', onAttention);
    window.addEventListener('blur', onAttention);
    window.addEventListener('pagehide', leavePage);
    window.addEventListener('pageshow', onAttention);
    window.addEventListener('popstate', leavePage);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('timeupdate', onTime);
    return () => {
      disposed = true;
      window.clearInterval(clock);
      window.clearInterval(watchdog);
      unsubscribe();
      document.removeEventListener('click', onNavigation);
      document.removeEventListener('play', onOtherMediaPlay, true);
      document.removeEventListener('visibilitychange', onAttention);
      window.removeEventListener('focus', onAttention);
      window.removeEventListener('blur', onAttention);
      window.removeEventListener('pagehide', leavePage);
      window.removeEventListener('pageshow', onAttention);
      window.removeEventListener('popstate', leavePage);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('timeupdate', onTime);
      leavePage();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  return <>
    <dialog ref={dialogRef} className="lif-interstitial" aria-label="Publicidad LIF" tabIndex={-1} onCancel={(event) => event.preventDefault()}>
      {/* These supplied spots have embedded on-screen copy; no caption transcript was supplied. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} playsInline preload="none" controls={false} disablePictureInPicture disableRemotePlayback aria-label="Video publicitario de LIF" onVolumeChange={(event) => setMuted(event.currentTarget.muted)} />
      <button className="interstitial-sound" type="button" onClick={() => soundRef.current()} aria-label={muted ? 'Activar sonido' : 'Silenciar video'} title={muted ? 'Activar sonido' : 'Silenciar video'} aria-pressed={!muted}>
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </button>
      <button className="interstitial-skip" type="button" disabled={skipRemaining !== 0} onClick={() => skipRef.current()} aria-label={skipRemaining === 0 ? 'Skip: continuar al sitio' : `Skip disponible en ${skipRemaining ?? 8} segundos`}>
        Skip{skipRemaining !== null && skipRemaining > 0 ? ` · ${skipRemaining} s` : <SkipForward aria-hidden="true" />}
      </button>
      {needsPlay && <button className="interstitial-play" type="button" onClick={() => retryRef.current()}><Play aria-hidden="true" />Tocá para reproducir</button>}
    </dialog>
    {qa && <aside className="interstitial-qa" aria-label="Pruebas locales del anuncio">
      <strong>Pruebas locales</strong><output>{qa.status} · {qa.seconds}/{qa.threshold} s · {qa.video} · Juego: {qa.game ? 'protegido' : 'inactivo'} · Gracia: {qa.grace} s</output>
      <button type="button" onClick={() => resetRef.current()}>Reiniciar campaña</button>
    </aside>}
  </>;
}

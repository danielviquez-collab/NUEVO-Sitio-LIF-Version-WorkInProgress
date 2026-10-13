'use client';
// Keep the official SVG separate from the moving fabric, at its native ratio.
/* eslint-disable next/no-img-element */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { GAME_CONFIG as C } from '@/lib/gaming/config';
import type { GameAudio } from '@/lib/gaming/audio';
import {
  curtainContentOffset,
  curtainLogoOffset,
  curtainLogoOpacity,
  curtainLogoShine,
  curtainLogoWidth,
  curtainOpenProgress,
  curtainPanelWidth,
  curtainSpotlightsAt,
  CURTAIN_HOLD_MS,
  CURTAIN_CONTENT_REVEAL_MS,
  CURTAIN_LOGO_SHINE_START_MS,
  CURTAIN_LOGO_SHINE_DURATION_MS,
} from '@/lib/gaming/curtain-motion';

export function GameCurtain({
  onComplete,
  texture,
  audio,
  shellRef,
}: {
  onComplete: () => void;
  texture: HTMLImageElement;
  audio: GameAudio;
  shellRef: RefObject<HTMLDivElement | null>;
}) {
  const root = useRef<HTMLDivElement>(null),
    fabric = useRef<HTMLCanvasElement>(null),
    stage = useRef<HTMLDivElement>(null),
    logo = useRef<HTMLImageElement>(null),
    shine = useRef<HTMLDivElement>(null),
    done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useLayoutEffect(() => {
    const element = root.current,
      canvas = fabric.current,
      backdrop = stage.current,
      logoImage = logo.current,
      shineLayer = shine.current,
      shell = shellRef.current,
      context = canvas?.getContext('2d');
    if (
      !element ||
      !canvas ||
      !backdrop ||
      !logoImage ||
      !shineLayer ||
      !context
    )
      return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const playback = motion.matches
      ? undefined
      : audio.startCurtain(CURTAIN_HOLD_MS);
    const shinePlayback = playback
      ? audio.startLogoShine(
          playback,
          CURTAIN_LOGO_SHINE_START_MS - CURTAIN_HOLD_MS,
        )
      : undefined;
    let width = 1,
      height = 1,
      ratio = 1,
      frame = 0,
      elapsed = 0,
      activeElapsed = 0,
      tailElapsed = 0,
      previous: number | undefined;

    function resize(entries?: ResizeObserverEntry[]) {
      const bounds = entries?.[0]?.contentRect;
      width = bounds?.width || element!.clientWidth || innerWidth * 0.96;
      height = bounds?.height || element!.clientHeight || innerHeight * 0.94;
      // One uniform pixel ratio prevents the old independent-axis distortion.
      ratio = Math.min(
        devicePixelRatio,
        2,
        Math.sqrt(4_000_000 / (width * height)),
      );
      canvas!.width = Math.ceil(width * ratio);
      canvas!.height = Math.ceil(height * ratio);
      logoImage!.style.width = `${curtainLogoWidth(width, height)}px`;
      shineLayer!.style.width = logoImage!.style.width;
      paintFrame();
    }

    function paintFrame() {
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.clearRect(0, 0, width, height);
      if (motion.matches) {
        shineLayer!.style.opacity = '0';
        updateContent(0, 1);
        element!.style.opacity = String(Math.max(0, 1 - elapsed / 350));
        return;
      }
      element!.style.opacity = '1';
      const progress = curtainOpenProgress(elapsed);
      backdrop!.style.opacity = '1';
      updateContent(
        curtainContentOffset(elapsed, height),
        elapsed >= CURTAIN_CONTENT_REVEAL_MS ? 1 : 0,
      );
      const opacity = curtainLogoOpacity(elapsed);
      logoImage!.style.opacity = String(opacity);
      logoImage!.style.transform = `translate3d(-50%, calc(-50% + ${curtainLogoOffset(elapsed, height)}px), 0)`;
      const shineMotion = curtainLogoShine(
        shinePlayback?.elapsedMs() ?? elapsed - CURTAIN_LOGO_SHINE_START_MS,
        shinePlayback?.durationMs ?? CURTAIN_LOGO_SHINE_DURATION_MS,
      );
      shineLayer!.style.transform = logoImage!.style.transform;
      shineLayer!.style.opacity = String(opacity * shineMotion.opacity);
      shineLayer!.style.setProperty(
        '--game-logo-shine-offset',
        `${shineMotion.offset}%`,
      );
      const half = width / 2,
        bands = 160,
        bandHeight = height / bands,
        sourceWidth = texture.naturalWidth / 2;

      for (const side of [-1, 1]) {
        context!.save();
        if (side === 1) {
          context!.translate(width, 0);
          context!.scale(-1, 1);
        }
        context!.beginPath();
        context!.moveTo(0, 0);
        for (let band = 0; band <= bands; band++) {
          const y = band / bands;
          context!.lineTo(half * curtainPanelWidth(y, progress), y * height);
        }
        context!.lineTo(0, height);
        context!.closePath();
        context!.clip();
        for (let band = 0; band < bands; band++) {
          const y = band / bands,
            next = (band + 1) / bands,
            bandWidth =
              half *
              Math.max(
                curtainPanelWidth(y, progress),
                curtainPanelWidth(next, progress),
              );
          if (bandWidth < 0.01) continue;
          context!.drawImage(
            texture,
            0,
            y * texture.naturalHeight,
            sourceWidth,
            texture.naturalHeight / bands,
            0,
            band * bandHeight,
            bandWidth + 0.5,
            bandHeight + 0.5,
          );
        }
        context!.restore();
      }
      context!.save();
      context!.globalCompositeOperation = 'source-atop';
      const radius = Math.min(width * 0.145, height * 0.23);
      for (const light of curtainSpotlightsAt(activeElapsed, width, height)) {
        const glow = context!.createRadialGradient(
          light.x,
          light.y,
          radius * 0.08,
          light.x,
          light.y,
          radius,
        );
        glow.addColorStop(0, '#fffbdc88');
        glow.addColorStop(0.52, '#fffbdc55');
        glow.addColorStop(1, '#fffbdc00');
        context!.fillStyle = glow;
        context!.fillRect(
          light.x - radius,
          light.y - radius,
          radius * 2,
          radius * 2,
        );
      }
      context!.restore();
    }

    function updateContent(offset: number, opacity: number) {
      if (!shell) return;
      shell.style.setProperty('--game-entry-opacity', String(opacity));
      shell.style.setProperty('--game-entry-offset', `${offset}px`);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    function draw(now: number) {
      const delta =
        previous !== undefined && !document.hidden
          ? Math.min(48, Math.max(0, now - previous))
          : 0;
      activeElapsed += delta;
      if (motion.matches || !playback) elapsed = activeElapsed;
      else {
        const soundElapsed = playback.elapsedMs();
        if (soundElapsed >= playback.durationMs) tailElapsed += delta;
        elapsed =
          soundElapsed > 0
            ? CURTAIN_HOLD_MS + soundElapsed + tailElapsed
            : Math.min(activeElapsed, CURTAIN_HOLD_MS);
      }
      previous = now;
      paintFrame();
      if (elapsed < (motion.matches ? 350 : C.CURTAIN_OPEN_DURATION_MS))
        frame = requestAnimationFrame(draw);
      else done.current();
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      playback?.stop();
      shinePlayback?.stop();
      for (const key of ['--game-entry-opacity', '--game-entry-offset'])
        shell?.style.removeProperty(key);
    };
  }, [texture, audio, shellRef]);

  return (
    <div ref={root} className="lif-game-curtain" aria-hidden="true">
      <div ref={stage} className="lif-game-curtain-stage" />
      <img
        ref={logo}
        className="lif-game-curtain-logo"
        src="/brand/lif-official.svg"
        alt=""
        width="956"
        height="600"
        decoding="sync"
      />
      <div ref={shine} className="lif-game-curtain-logo-shine">
        <span />
      </div>
      <canvas ref={fabric} className="lif-game-curtain-fabric" />
    </div>
  );
}

'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Flavor } from '@/lib/lif-content';
import { frameAdvance, paintedPackBounds, sachetPhases, type PackBounds } from '@/lib/sachet-motion';

export type SachetSource = { image: HTMLImageElement; button: HTMLButtonElement; bounds: PackBounds; src: string };
export function captureSachet(button: HTMLButtonElement): SachetSource | null {
  const image = button.querySelector<HTMLImageElement>('.pack-image');
  if (!image) return null;
  return { image, button, src: image.currentSrc || image.src,
    bounds: paintedPackBounds(image.getBoundingClientRect(), image.naturalWidth || image.width, image.naturalHeight || image.height) };
}

let sceneModule: ReturnType<typeof importScene> | undefined;
function importScene() { return import('@/lib/sachet-scene'); }
export function preloadSachetScene() { return sceneModule ??= importScene().catch((error) => { sceneModule = undefined; throw error; }); }
const CloseSachetContext = createContext<() => void>(() => {});
export function useSachetClose() { return useContext(CloseSachetContext); }

async function readyImage(image: HTMLImageElement, signal: AbortSignal) {
  if (!image.complete) await new Promise<void>((resolve, reject) => {
    const cleanup = () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); signal.removeEventListener('abort', aborted); };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('Unable to load sachet artwork')); };
    const aborted = () => { cleanup(); reject(new DOMException('Closed', 'AbortError')); };
    image.addEventListener('load', loaded, { once: true }); image.addEventListener('error', failed, { once: true }); signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
  if (!image.naturalWidth) throw new Error('Empty sachet artwork');
  await image.decode().catch(() => { if (!image.naturalWidth) throw new Error('Invalid sachet artwork'); });
  signal.throwIfAborted();
}

export function SachetSelection({ source, flavor, onClose, children }: {
  source: SachetSource | null; flavor: Flavor; onClose: () => void; children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<() => void>(() => {});
  const requestClose = useCallback(() => closeRef.current(), []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const veil = dialog.querySelector<HTMLElement>('.sachet-veil')!;
    const viewportElement = dialog.querySelector<HTMLElement>('.sachet-viewport')!;
    const host = dialog.querySelector<HTMLElement>('.sachet-scene')!;
    const panel = dialog.querySelector<HTMLElement>('.sachet-panel')!;
    const earlyClose = dialog.querySelector<HTMLButtonElement>('.sachet-sequence-close')!;
    const panelClose = panel.querySelector<HTMLButtonElement>('.dialog-close')!;
    const originalImage = source?.button.querySelector<HTMLImageElement>('.pack-image');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const { signal } = controller;
    let scene: ReturnType<typeof import('@/lib/sachet-scene')['createSachetScene']> | undefined;
    let frame = 0;
    let closing = false;
    let disposed = false;
    let viewport: PackBounds;
    const scroll = { x: window.scrollX, y: window.scrollY };
    const previousBody = {
      overflow: document.body.style.overflow, position: document.body.style.position,
      top: document.body.style.top, left: document.body.style.left, right: document.body.style.right,
      paddingRight: document.body.style.paddingRight,
    };
    const previousVisibility = originalImage?.style.visibility ?? '';
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const bodyPadding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;

    function setPhase(phase: string) {
      dialog.dataset.phase = phase;
      dialog.dataset.sequence = [dialog.dataset.sequence, phase].filter(Boolean).join(' ');
      dialog.setAttribute('aria-busy', String(phase !== 'nutritionVisible'));
    }
    function resize() {
      const visual = window.visualViewport;
      viewport = { left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0,
        width: visual?.width ?? window.innerWidth, height: visual?.height ?? window.innerHeight };
      Object.assign(viewportElement.style, { left: `${viewport.left}px`, top: `${viewport.top}px`, width: `${viewport.width}px`, height: `${viewport.height}px` });
      viewportElement.style.setProperty('--nutrition-max-height', `${Math.min(900, viewport.height - 48)}px`);
      // Browser chrome changes only geometry. They never complete or cancel the sequence.
      scene?.resize(viewport);
    }
    function animate(duration: number, update: (progress: number) => void) {
      return new Promise<void>((resolve, reject) => {
        let elapsed = 0;
        let previous: number | null = null;
        const abort = () => { cancelAnimationFrame(frame); signal.removeEventListener('abort', abort); reject(new DOMException('Closed', 'AbortError')); };
        signal.addEventListener('abort', abort, { once: true });
        function step(now: number) {
          if (signal.aborted) return abort();
          elapsed += frameAdvance(previous, now, document.hidden);
          previous = now;
          const progress = preference.matches ? 1 : Math.min(1, elapsed / duration);
          update(progress);
          if (progress === 1) { signal.removeEventListener('abort', abort); resolve(); }
          else frame = requestAnimationFrame(step);
        }
        update(0);
        frame = requestAnimationFrame(step);
      });
    }
    function showPanel() {
      host.hidden = true;
      panel.style.opacity = '1';
      panel.inert = false;
      panel.removeAttribute('aria-hidden');
      earlyClose.hidden = true;
      veil.style.opacity = '1';
      setPhase('nutritionVisible');
      panelClose.focus({ preventScroll: true });
    }
    async function run() {
      setPhase('preparing');
      try {
        if (preference.matches || !source || !originalImage || !flavor.back) {
          setPhase('reducedMotion');
          await animate(150, (p) => { veil.style.opacity = String(p); panel.style.opacity = String(p); });
          if (!signal.aborted) showPanel();
          return;
        }
        originalImage.loading = 'eager';
        const backImage = flavor.back.image ? new window.Image() : null;
        if (backImage) backImage.src = flavor.back.image!;
        const [module] = await Promise.all([
          preloadSachetScene(), readyImage(originalImage, signal),
          ...(backImage ? [readyImage(backImage, signal)] : []), document.fonts.ready,
        ]);
        signal.throwIfAborted();
        const bounds = paintedPackBounds(originalImage.getBoundingClientRect(), originalImage.naturalWidth, originalImage.naturalHeight);
        scene = module.createSachetScene(host, originalImage, backImage, flavor.back, bounds, panel);
        scene.resize(viewport);
        originalImage.style.visibility = 'hidden';
        for (const [phase, duration] of sachetPhases) {
          signal.throwIfAborted();
          setPhase(phase);
          await animate(duration, (p) => {
            if (phase === 'focusing') veil.style.opacity = String(p);
            scene!.render(phase, p);
          });
        }
        if (!signal.aborted) showPanel();
      } catch (error) {
        if (signal.aborted || disposed) return;
        console.error('Sachet presentation unavailable', error);
        dialog.dataset.animationError = 'true';
        showPanel();
      }
    }
    async function close() {
      if (disposed || closing) return;
      closing = true;
      controller.abort();
      setPhase('closing');
      panel.inert = true;
      earlyClose.disabled = true;
      if (originalImage) originalImage.style.visibility = previousVisibility;
      const duration = preference.matches ? 80 : 160;
      const viewportOpacity = getComputedStyle(viewportElement).opacity;
      const veilOpacity = getComputedStyle(veil).opacity;
      // Keep the final styles after WAAPI releases them, until React unmounts the dialog.
      viewportElement.style.opacity = '0';
      veil.style.opacity = '0';
      const fade = viewportElement.animate([{ opacity: viewportOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
      const shade = veil.animate([{ opacity: veilOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
      try { await Promise.all([fade.finished, shade.finished]); if (!disposed) onClose(); } catch { /* Unmount restores all state below. */ }
      finally { fade.cancel(); shade.cancel(); }
    }

    closeRef.current = () => { void close(); };
    Object.assign(document.body.style, { overflow: 'hidden', position: 'fixed', top: `${-scroll.y}px`, left: `${-scroll.x}px`, right: '0', paddingRight: `${bodyPadding + gutter}px` });
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    dialog.showModal();
    resize();
    earlyClose.focus({ preventScroll: true });
    void run();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', resize);

    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      scene?.dispose();
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', resize);
      dialog.close();
      if (originalImage) originalImage.style.visibility = previousVisibility;
      Object.assign(document.body.style, previousBody);
      window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
      if (source?.button.isConnected) source.button.focus({ preventScroll: true });
    };
  }, [source, flavor, onClose]);

  return <dialog ref={dialogRef} className="sachet-dialog" aria-label={`Información nutricional: ${flavor.name}`} onCancel={(event) => { event.preventDefault(); requestClose(); }}>
    <div className="sachet-veil" aria-hidden="true" />
    <div className="sachet-viewport">
      <div className="sachet-scene" aria-hidden="true" />
      <button className="icon-button sachet-sequence-close" type="button" aria-label="Cerrar información nutricional" autoFocus onClick={requestClose}><X aria-hidden="true" /></button>
      <div className="sachet-panel"><CloseSachetContext value={requestClose}>{children}</CloseSachetContext></div>
    </div>
  </dialog>;
}

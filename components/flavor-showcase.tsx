'use client';

import { useCallback, useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import { EntranceContext } from './home-entrance';
import { FlavorPack } from './flavor-pack';
import { flavors } from '@/lib/lif-content';
import { track } from '@/lib/analytics';
import { changedOrientation, needsCarouselRebuild, sameShowcaseSize } from '@/lib/showcase-resize';

const collection = [...flavors.filter((flavor) => flavor.isNew), ...flavors.filter((flavor) => !flavor.isNew)];
const AUTOPLAY_INTERVAL = 4000;

export function FlavorShowcase() {
  const entranceActive = useContext(EntranceContext);
  const [viewportRef, carousel] = useEmblaCarousel({ loop: true, align: 'center', duration: 30, watchResize: false });
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState<number | null>(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const pointerDownRef = useRef(false);
  const resizeFrameRef = useRef<number | null>(null);

  // Each pack stays mounted; its scale and rotation follow its track position,
  // including the slides Embla moves across the loop boundary.
  const updatePositions = useCallback((api: EmblaCarouselType) => {
    const engine = api.internalEngine();
    const progress = api.scrollProgress();
    const slides = api.slideNodes();
    const offsets = api.scrollSnapList().map((snap, index) => {
      let distance = snap - progress;
      engine.slideLooper.loopPoints.forEach((point) => {
        if (index !== point.index || point.target() === 0) return;
        distance = point.target() < 0 ? snap - (1 + progress) : snap + (1 - progress);
      });
      return Math.max(-1, Math.min(1, distance * slides.length));
    });
    const newFocus = Math.max(...offsets.map((offset, index) => collection[index].isNew ? 1 - Math.abs(offset) : 0));
    offsets.forEach((offset, index) => {
      const distance = Math.abs(offset);
      const prominence = collection[index].isNew ? .18 * (1 - distance) ** 2 : 0;
      const scale = 1 - distance * .30 + prominence - distance * .06 * newFocus;
      const pack = slides[index].querySelector<HTMLElement>('.showcase-pack-motion');
      if (pack) {
        pack.style.transform = `translateY(${distance * 16}px) rotate(${offset * 12}deg) scale(${scale})`;
        pack.style.opacity = String(1 - distance * .24 * newFocus);
      }
    });
    // Start the highlight at visual arrival, before Embla's sub-pixel settling ends.
    const selected = api.selectedScrollSnap();
    if (!pointerDownRef.current && Math.abs(offsets[selected]) < .025) setArrived(selected);
  }, []);

  useEffect(() => {
    if (!carousel) return;
    const select = () => { setActive(carousel.selectedScrollSnap()); setArrived(null); };
    const settle = () => setArrived(carousel.selectedScrollSnap());
    const down = () => { pointerDownRef.current = true; setDragging(true); setArrived(null); };
    const up = () => { pointerDownRef.current = false; setDragging(false); updatePositions(carousel); };
    updatePositions(carousel);
    carousel.on('scroll', updatePositions).on('reInit', updatePositions).on('select', select).on('settle', settle).on('pointerDown', down).on('pointerUp', up);
    return () => { carousel.off('scroll', updatePositions).off('reInit', updatePositions).off('select', select).off('settle', settle).off('pointerDown', down).off('pointerUp', up); };
  }, [carousel, updatePositions]);

  useEffect(() => {
    if (!carousel) return;
    const root = carousel.rootNode();
    const track = carousel.containerNode();
    const headline = regionRef.current?.closest('.campaign-hero')?.querySelector<HTMLElement>('.campaign-headline');
    const readSize = () => ({
      width: root.clientWidth, height: track.clientHeight,
      slideWidth: carousel.slideNodes()[0]?.offsetWidth ?? 0,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.visualViewport?.height ?? window.innerHeight,
    });
    let measured = readSize();
    let candidate = measured;
    let headlineWasVisible = false;
    const rememberHeadline = () => {
      if (resizeFrameRef.current !== null || !headline) return;
      const rect = headline.getBoundingClientRect();
      headlineWasVisible = rect.top >= 0 && rect.bottom <= measured.viewportHeight;
    };
    rememberHeadline();
    const measure = () => {
      const next = readSize();
      // Rotation may deliver several intermediate viewport sizes. Wait for two
      // matching layout frames, then let Embla rebuild its own loop coordinates.
      if (!sameShowcaseSize(candidate, next)) {
        candidate = next;
        resizeFrameRef.current = requestAnimationFrame(measure);
        return;
      }
      if (next.width && needsCarouselRebuild(measured, next)) {
        carousel.reInit({ startIndex: carousel.selectedScrollSnap() });
        pointerDownRef.current = false;
        setDragging(false);
      }
      updatePositions(carousel);
      if (changedOrientation(measured, next) && headlineWasVisible && headline && (window.visualViewport?.scale ?? 1) === 1) {
        const top = headline.getBoundingClientRect().top;
        if (top < 0) window.scrollBy({ top, behavior: 'instant' });
      }
      measured = next;
      resizeFrameRef.current = null;
      rememberHeadline();
    };
    const schedule = () => {
      if (resizeFrameRef.current === null) resizeFrameRef.current = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(track);
    carousel.slideNodes().forEach((slide) => observer.observe(slide));
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.addEventListener('scroll', rememberHeadline, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', rememberHeadline);
      if (resizeFrameRef.current !== null) cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    };
  }, [carousel, updatePositions]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    if (regionRef.current) observer.observe(regionRef.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!carousel || entranceActive || hovered || focused || dragging || !visible || reduceMotion) return;
    const timer = window.setInterval(() => { if (!document.hidden && resizeFrameRef.current === null) carousel.scrollNext(); }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [carousel, active, entranceActive, focused, hovered, dragging, reduceMotion, visible]);

  function change(index: number) {
    const next = (index + collection.length) % collection.length;
    carousel?.scrollTo(next, reduceMotion);
    track('flavor_carousel_change', { flavor: collection[next].name, source: 'manual' });
  }

  return (
    <section
      className="flavor-showcase" ref={regionRef} aria-label="Sabores LIF" aria-roledescription="carrusel"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <div className="showcase-viewport" ref={viewportRef}>
        <div className="showcase-track">
          {collection.map((flavor, index) => (
            <article className={`showcase-flavor${index === active ? ' is-active' : ''}${flavor.isNew ? ' is-new' : ''}${index === active && index === arrived && !entranceActive ? ' has-arrived' : ''}`} key={flavor.slug} aria-label={flavor.name} aria-roledescription="diapositiva" aria-hidden={index !== active}>
              <div className="showcase-pack-motion" style={{ '--pack-aspect': flavor.isNew ? 992 / 1113 : 1361 / 1486, ...(flavor.isNew && flavor.image ? { '--pack-mask': `url("${flavor.image}")` } : {}) } as CSSProperties}><FlavorPack flavor={flavor} className="showcase-pack" eager /></div>
            </article>
          ))}
        </div>
      </div>
      <h2 className="showcase-name" aria-live={focused ? 'polite' : 'off'}>{collection[active].name}</h2>
      <fieldset className="showcase-pagination">
        <legend className="sr-only">Elegí un sabor</legend>
        {collection.map((flavor, index) => <button key={flavor.slug} type="button" aria-label={flavor.name} title={flavor.name} aria-current={active === index ? 'true' : undefined} onClick={() => change(index)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); change(active + (event.key === 'ArrowRight' ? 1 : -1)); } }}><span /></button>)}
      </fieldset>
    </section>
  );
}

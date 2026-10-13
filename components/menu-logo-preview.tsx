'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import { SiteFooter, SiteHeader } from './site-chrome';
import Link from './static-link';
import {
  LOGO_BASE_HEIGHT,
  LOGO_BASE_WIDTH,
  MENU_LOGO_TIMING,
  logoFlightFrames,
  logoPose,
  logoTransform,
  type LogoPose,
} from '@/lib/menu-logo-motion';

type Phase = 'footer' | 'to-menu' | 'menu' | 'to-footer';

function movingPose(element: HTMLElement): LogoPose {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
  return {
    x: matrix.m41 + LOGO_BASE_WIDTH / 2,
    y: matrix.m42 + LOGO_BASE_HEIGHT / 2,
    width: Math.hypot(matrix.m11, matrix.m12) * LOGO_BASE_WIDTH,
    angle: (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI,
  };
}

export function MenuLogoPreview({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const moving = useRef<HTMLDivElement>(null);
  const destination = useRef<HTMLImageElement>(null);
  const flight = useRef<Animation | null>(null);
  const phaseRef = useRef<Phase>('footer');
  const [phase, setPhase] = useState<Phase>('footer');
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useLayoutEffect(() => {
    // Transfer logo ownership and start its flight on the same browser frame.
    const frame = requestAnimationFrame(() => {
      const proxy = moving.current;
      const footerImage =
        root.current?.querySelector<HTMLImageElement>('.footer-center img');
      const menuImage = destination.current;
      if (!proxy || !footerImage || !menuImage) return;
      const previous = phaseRef.current;
      const wasFlying = Boolean(flight.current);
      const current = wasFlying ? movingPose(proxy) : null;
      flight.current?.cancel();
      flight.current = null;

      if (!matchMedia('(max-width: 700px)').matches) {
        changePhase('footer');
        return;
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        changePhase(open ? 'menu' : 'footer');
        return;
      }
      if ((open && previous === 'menu') || (!open && previous === 'footer'))
        return;

      const from =
        current ??
        logoPose(
          (previous === 'menu'
            ? menuImage
            : footerImage
          ).getBoundingClientRect(),
          previous === 'menu' ? undefined : window.innerHeight,
        );
      const to = open
        ? logoPose(menuImage.getBoundingClientRect())
        : logoPose(footerImage.getBoundingClientRect(), window.innerHeight);
      proxy.style.transform = logoTransform(from);
      changePhase(open ? 'to-menu' : 'to-footer');
      const animation = proxy.animate(logoFlightFrames(from, to, open), {
        duration: open ? MENU_LOGO_TIMING.enter : MENU_LOGO_TIMING.return,
        easing: 'linear',
        fill: 'forwards',
      });
      flight.current = animation;
      animation.onfinish = () => {
        if (flight.current !== animation) return;
        proxy.style.transform = logoTransform(to);
        flight.current = null;
        changePhase(open ? 'menu' : 'footer');
        animation.cancel();
      };
      window.dispatchEvent(new Event('lif:snake-route'));
    });
    return () => cancelAnimationFrame(frame);
  }, [open, revision, changePhase]);

  useEffect(() => {
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRevision((value) => value + 1));
    };
    const onScroll = () => {
      if (flight.current) remeasure();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const nav = root.current?.querySelector('.primary-nav');
    const onMenuScroll = () =>
      window.dispatchEvent(new Event('lif:snake-route'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    nav?.addEventListener('scroll', onMenuScroll, { passive: true });
    reduced.addEventListener('change', remeasure);
    return () => {
      cancelAnimationFrame(frame);
      flight.current?.cancel();
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      nav?.removeEventListener('scroll', onMenuScroll);
      reduced.removeEventListener('change', remeasure);
    };
  }, []);

  const returning = !open && phase !== 'footer';
  return (
    <div
      ref={root}
      className="lif-site menu-logo-preview"
      data-logo-phase={phase}
      data-menu-open={open || returning}
    >
      <SiteHeader
        preview={{
          open,
          returning,
          onOpenChange: setOpen,
          footer: (
            <div className="menu-preview-logo-slot">
              <Link
                className="menu-preview-logo-link"
                href="/"
                aria-label="LIF, inicio"
                data-home-entry="logo"
              >
                <Image
                  ref={destination}
                  src="/brand/lif-official.svg"
                  alt="LIF"
                  width={956}
                  height={600}
                />
              </Link>
            </div>
          ),
        }}
      />
      <button
        className="menu-preview-backdrop"
        type="button"
        tabIndex={-1}
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
      />
      {children}
      <SiteFooter />
      <div ref={moving} className="menu-preview-moving-logo" aria-hidden="true">
        <Image
          src="/brand/lif-official.svg"
          alt=""
          width={956}
          height={600}
          priority
        />
      </div>
    </div>
  );
}

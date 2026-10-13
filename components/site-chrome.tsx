'use client';

import { lazy, Suspense, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import Image from 'next/image';
import Link from './static-link';
import { usePathname } from 'next/navigation';
import { officialLinks } from '@/lib/lif-content';
import { openCookiePreferences } from '@/lib/consent';
import { SocialLinks } from './social-links';
import { NavGameSnake } from './nav-game-snake';
const Contact = lazy(() =>
  import('./contact-modal').then((m) => ({ default: m.ContactModal })),
);

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/recetario/', label: 'Recetas' },
  { href: '/confesiones/', label: 'Confesiones' },
  { href: '/juega/', label: 'Jugá con LIF' },
  { href: '/sabores/', label: 'Productos' },
];

type MenuPreview = {
  open: boolean;
  returning: boolean;
  onOpenChange: (open: boolean) => void;
  footer: ReactNode;
};

export function SiteHeader({ preview }: { preview?: MenuPreview } = {}) {
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const menuOpen = preview?.open ?? localMenuOpen;
  const setMenuOpen = preview?.onOpenChange ?? setLocalMenuOpen;
  const [contactOpen, setContactOpen] = useState(false);
  const pathname = usePathname();
  const showContact = () => {
    setMenuOpen(false);
    setContactOpen(true);
  };

  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/" aria-label="LIF, inicio" data-home-entry="logo">
        <Image
          src="/brand/lif-official.svg"
          alt="LIF"
          width={956}
          height={600}
          priority
        />
      </Link>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-nav"
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav
        id="primary-nav"
        className={`primary-nav${menuOpen ? ' is-open' : ''}${preview?.returning ? ' is-returning' : ''}`}
        aria-label="Navegación principal"
        inert={preview?.returning || undefined}
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-home-entry={item.href === '/' ? 'content' : undefined}
            className={item.href === '/juega/' ? 'nav-game-link' : undefined}
            aria-current={
              pathname?.replace(/\/$/, '') === item.href.replace(/\/$/, '')
                ? 'page'
                : undefined
            }
            onClick={() => setMenuOpen(false)}
          >
            {item.href === '/juega/' ? (
              <span className="game-nav-label">
                <span className="game-nav-word">Jugá</span> con LIF
              </span>
            ) : (
              item.label
            )}
            <ArrowRight className="menu-nav-arrow" aria-hidden="true" />
          </Link>
        ))}
        <button
          type="button"
          className="nav-contact-button"
          aria-haspopup="dialog"
          onClick={showContact}
        >
          Contáctenos
        </button>
        {preview?.footer}
      </nav>
      <div className="header-social" aria-label="Redes de LIF">
        <SocialLinks />
      </div>
      <NavGameSnake />
      {contactOpen && (
        <Suspense fallback={null}>
          <Contact onClose={() => setContactOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-layout">
        <section
          className="footer-contact"
          aria-label="Contacto y redes sociales"
        >
          <div className="footer-contact-list">
            <a
              className="footer-contact-item"
              href={`mailto:${officialLinks.email}`}
            >
              <Mail aria-hidden="true" />
              <span>{officialLinks.email}</span>
            </a>
            <a className="footer-contact-item" href={officialLinks.phoneHref}>
              <Phone aria-hidden="true" />
              <span>{officialLinks.phone}</span>
            </a>
            <span className="footer-contact-item">
              <MapPin aria-hidden="true" />
              <span>{officialLinks.address}</span>
            </span>
          </div>
          <nav className="footer-social" aria-label="Redes sociales">
            <SocialLinks />
            <a
              className="footer-laica"
              href={officialLinks.laica}
              target="_blank"
              rel="noreferrer"
            >
              LAICA <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>
        </section>
        <Link className="footer-center" href="/" aria-label="LIF, inicio" data-home-entry="logo">
          <Image
            src="/brand/lif-official.svg"
            alt="LIF"
            width={956}
            height={600}
          />
        </Link>
        <nav className="footer-nav" aria-label="Enlaces del pie de página">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} data-home-entry={item.href === '/' ? 'content' : undefined}>
              {item.label}
            </Link>
          ))}
          <Link href="/juega/#reglamento">Reglamentos</Link>
          <button
            type="button"
            className="footer-cookie-preferences"
            onClick={openCookiePreferences}
          >
            Preferencias de cookies
          </button>
        </nav>
      </div>
      <div className="footer-copyright">
        © {new Date().getFullYear()} LIF. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="lif-site">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

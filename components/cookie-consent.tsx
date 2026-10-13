'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Cookie, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { applyConsent, CONSENT_KEY, readConsent, saveConsent } from '@/lib/consent';

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const sync = () => {
      const choice = readConsent();
      setVisible(!choice);
      setAnalytics(choice?.analytics ?? false);
      setMarketing(choice?.marketing ?? false);
      applyConsent(choice);
    };
    applyConsent(null, 'default');
    sync();
    const configure = () => { sync(); setOpen(true); };
    const onStorage = (event: StorageEvent) => { if (event.key === CONSENT_KEY || event.key === null) sync(); };
    window.addEventListener('lif:open-cookie-preferences', configure);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('lif:open-cookie-preferences', configure); window.removeEventListener('storage', onStorage); };
  }, []);

  function choose(measurement: boolean, advertising: boolean) {
    saveConsent(measurement, advertising);
    setAnalytics(measurement);
    setMarketing(advertising);
    setVisible(false);
    setOpen(false);
  }

  if (pathname?.startsWith('/prueba-logo')) return null;

  return <>
    {visible && !open && <aside className="cookie-notice" aria-label="Preferencias de cookies">
      <Cookie className="cookie-notice-icon" aria-hidden="true" />
      <div className="cookie-notice-copy"><h2>También elegís tus cookies.</h2><p>Las necesarias permiten que el sitio funcione. Vos decidís si autorizás las de medición y publicidad. Podés cambiar tu elección en cualquier momento.</p><button className="cookie-details" onClick={() => setOpen(true)}>Cómo las usamos</button></div>
      <div className="cookie-notice-actions"><button className="cookie-accept" onClick={() => choose(true, true)}>Aceptar todas</button><button onClick={() => choose(false, false)}>Solo necesarias</button><button className="cookie-configure" onClick={() => setOpen(true)}>Configurar cookies</button></div>
    </aside>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="cookie-preferences" showCloseButton={false}>
        <DialogClose className="cookie-dialog-close" aria-label="Cerrar preferencias"><X aria-hidden="true" /></DialogClose>
        <DialogTitle>Cookies a tu manera</DialogTitle>
        <DialogDescription>Elegí qué permitís. Las categorías opcionales están desactivadas hasta que las autorices.</DialogDescription>
        <div className="cookie-category"><div><strong>Necesarias</strong><p>Permiten recordar tus preferencias y el funcionamiento básico del sitio.</p></div><span className="cookie-required">Siempre activas</span></div>
        <div className="cookie-category"><div><label htmlFor="consent-analytics">Medición</label><p>Permiten medir visitas e interacciones para mejorar el sitio.</p></div><Switch id="consent-analytics" aria-label="Permitir cookies de medición" checked={analytics} onCheckedChange={setAnalytics} /></div>
        <div className="cookie-category"><div><label htmlFor="consent-marketing">Publicidad</label><p>Permiten personalizar anuncios y medir las campañas de la marca.</p></div><Switch id="consent-marketing" aria-label="Permitir cookies de publicidad" checked={marketing} onCheckedChange={setMarketing} /></div>
        <details className="cookie-storage-details"><summary>Sobre tu elección</summary><p>Guardamos estas preferencias en este navegador durante 180 días. Podés modificarlas desde “Preferencias de cookies” en el pie de página. Borrar los datos del navegador elimina esta elección.</p></details>
        <div className="cookie-preferences-actions"><button onClick={() => choose(false, false)}>Solo necesarias</button><button className="cookie-accept" onClick={() => choose(analytics, marketing)}>Guardar preferencias</button></div>
      </DialogContent>
    </Dialog>
  </>;
}

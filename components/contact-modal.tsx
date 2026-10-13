'use client';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import Image from 'next/image';
import { Check, Mail, MapPin, Phone, Send, X } from 'lucide-react';
import { officialLinks } from '@/lib/lif-content';
import { acquireMediaOverlay } from '@/lib/media-priority';
import { FormSubmissionStatus } from './form-submission-status';
import { ContactLocationFields } from './contact-location-fields';
import { emptyContactLocation } from '@/lib/contact-location';
import { playFormSendSound, stopFormSendSound } from '@/lib/form-submission-audio';
export function ContactModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null),
    request = useRef(crypto.randomUUID()),
    sending = useRef(false),
    controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState(''),
    [location, setLocation] = useState(emptyContactLocation);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const before = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    const release = acquireMediaOverlay();
    el.showModal();
    document.body.style.overflow = 'hidden';
    el.querySelector<HTMLElement>('input')?.focus();
    return () => {
      stopFormSendSound();
      controller.current?.abort();
      el.close();
      document.body.style.overflow = overflow;
      release();
      before?.focus({ preventScroll: true });
    };
  }, []);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    sending.current = true;
    playFormSendSound();
    const pending = new AbortController();
    controller.current = pending;
    const timeout = window.setTimeout(() => pending.abort(), 30000);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: pending.signal,
        body: JSON.stringify({
          request: request.current,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          message: data.get('message'),
          website: data.get('website'),
          consent: data.get('consent') === 'on',
          ...location,
        }),
      });
      const result = (await response.json()) as { saved?: boolean };
      if (!response.ok || !result.saved) throw new Error();
      setSent(true);
    } catch {
      setError(
        'No se pudo confirmar tu mensaje. Reintentá o escribinos por correo.',
      );
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="lif-contact-dialog"
      aria-labelledby="lif-contact-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!sending.current) onClose();
      }}
    >
      <div className="lif-contact-content">
        <button
          className="contact-close"
          aria-label="Cerrar contacto"
          title="Cerrar"
          onClick={onClose}
          disabled={busy}
        >
          <X />
        </button>
        <header>
          <Image
            src="/brand/lif-official.svg"
            alt="LIF"
            width={70}
            height={44}
          />
          <h2 id="lif-contact-title">¡Hablemos!</h2>
        </header>
        {sent ? (
          <output className="contact-success">
            <Check />
            <h3>Mensaje registrado.</h3>
            <p>Gracias por escribirnos. Pura vida.</p>
            <button className="contact-submit" onClick={onClose}>
              Listo
            </button>
          </output>
        ) : (
          <form className="form-with-status" onSubmit={submit} aria-busy={busy}>
            <FormSubmissionStatus busy={busy} message="Enviando tu mensaje…" detail="Estamos confirmando la recepción." />
            <div className="contact-fields">
              <label>
                Nombre completo
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                Correo electrónico
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                Teléfono <span>(opcional)</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={25}
                  disabled={busy}
                />
              </label>
              <label className="contact-message">
                Tu mensaje
                <textarea
                  name="message"
                  minLength={10}
                  maxLength={3000}
                  rows={4}
                  required
                  disabled={busy}
                />
              </label>
            </div>
            <ContactLocationFields value={location} onChange={setLocation} busy={busy} portalRef={dialog} />
            <label className="contact-trap" aria-hidden="true">
              Sitio web
              <input name="website" tabIndex={-1} autoComplete="off" disabled={busy} />
            </label>
            <label className="contact-consent">
              <input name="consent" type="checkbox" required disabled={busy} />
              Autorizo el uso de estos datos para responder mi consulta.
            </label>
            {error && (
              <p className="contact-error" role="alert">
                {error}
              </p>
            )}
            <button className="contact-submit" disabled={busy}>
              <Send />
              {busy ? 'Registrando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
        <address className="contact-official">
          <a href={`mailto:${officialLinks.email}`}>
            <Mail />
            {officialLinks.email}
          </a>
          <a href={officialLinks.phoneHref}>
            <Phone />
            {officialLinks.phone}
          </a>
          <span>
            <MapPin />
            {officialLinks.address}
          </span>
        </address>
      </div>
    </dialog>
  );
}

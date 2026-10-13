'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { FormSubmissionStatus } from './form-submission-status';
import { acquireMediaOverlay } from '@/lib/media-priority';
import { confessionPayload, submitConfession, readConfessionVideo, validateVideoFile, MAX_CONFESSION_LENGTH } from '@/lib/confession-submission';
import { track } from '@/lib/analytics';
import { playFormSendSound, stopFormSendSound } from '@/lib/form-submission-audio';

export function ConfessionForm({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const requestId = useRef('');
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [video, setVideo] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    const release = acquireMediaOverlay();
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      stopFormSendSound();
      request.current?.abort();
      dialog.close();
      document.body.style.overflow = oldOverflow;
      release();
      previous?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (status) statusRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [status]);

  async function handleSubmit(event: { preventDefault: () => void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    if (sending.current) return;
    const fields = new FormData(event.currentTarget);
    const text = (key: string) => { const value = fields.get(key); return typeof value === 'string' ? value : ''; };
    const controller = new AbortController();
    request.current = controller;
    sending.current = true;
    playFormSendSound();
    setBusy(true);
    setStatus('');
    dialogRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    let received = false;
    const timeout = window.setTimeout(() => controller.abort('timeout'), video ? 120000 : 20000);
    try {
      requestId.current ||= crypto.randomUUID();
      if (!process.env.NEXT_PUBLIC_CONFESSIONS_ENDPOINT) throw new Error('El envío no está disponible todavía. Tu texto y tu video no se enviaron.');
      const upload = video ? await readConfessionVideo(video, controller.signal) : undefined;
      const payload = confessionPayload({ confession: text('confession'), alias: text('alias'), consent: fields.get('consent') === 'on', website: text('website'), video: upload }, requestId.current);
      await submitConfession(payload, process.env.NEXT_PUBLIC_CONFESSIONS_ENDPOINT, controller.signal);
      if (controller.signal.aborted) return;
      track('confession_submitted', { source: 'confesiones' });
      // Direct navigation keeps the acknowledgement free of advertising interruptions.
      window.location.assign('/gracias-confesion');
      received = true;
    } catch (error) {
      if (controller.signal.aborted && controller.signal.reason !== 'timeout') return;
      setStatus(controller.signal.reason === 'timeout' ? 'El envío tardó más de lo esperado. Tu texto sigue aquí; intentá de nuevo.' : error instanceof Error ? error.message : 'No pudimos enviar tu confesión. Intentá de nuevo.');
    } finally {
      window.clearTimeout(timeout);
      if (!received) {
        sending.current = false;
        if (!controller.signal.aborted || controller.signal.reason === 'timeout') setBusy(false);
      }
    }
  }

  return <dialog ref={dialogRef} className="detail-dialog confession-dialog" aria-labelledby="confession-form-title" aria-describedby="confession-form-description" onCancel={(event) => { event.preventDefault(); if (!sending.current) onClose(); }}>
    <header className="confession-dialog-heading">
      <p className="eyebrow">Tu historia, tus reglas</p>
      <button className="icon-button" type="button" aria-label="Cerrar formulario" onClick={onClose} disabled={busy}><X aria-hidden="true" /></button>
    </header>
    <h2 id="confession-form-title" hidden={busy}>Contalo en confianza.</h2>
    <p id="confession-form-description" hidden={busy}>Podés usar un alias. Nada se publica sin tu autorización y la revisión del equipo de LIF.</p>
    <FormSubmissionStatus busy={busy} className="confession-send-status" message="Enviando tu confesión…" detail={video ? 'Tu video puede tardar unos momentos.' : 'Estamos confirmando la recepción.'} />
    <form className="confession-form" onSubmit={handleSubmit} aria-busy={busy} onChange={() => { if (!sending.current) { requestId.current = ''; setStatus(''); } }}>
      <fieldset disabled={busy} hidden={busy}>
        <label>Tu confesión<textarea name="confession" required={!video} rows={5} maxLength={MAX_CONFESSION_LENGTH} placeholder="Contanos qué pasó…" /></label>
        <label className="confession-upload">Tu video (opcional)<input ref={fileInput} type="file" name="video" aria-describedby="confession-video-format" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={(event) => {
          event.stopPropagation();
          requestId.current = '';
          const file = event.target.files?.[0];
          if (!file) { setVideo(null); return; }
          try { validateVideoFile(file); setVideo(file); setStatus(''); }
          catch (error) { event.target.value = ''; setVideo(null); setStatus(error instanceof Error ? error.message : 'Revisá el video.'); }
        }} /><small id="confession-video-format">Video vertical, formato Reel / TikTok (9:16).<br />MP4, MOV o WebM · Hasta 25 MB</small></label>
        {video && <div className="confession-upload-name"><span>{video.name} · {(video.size / 1024 / 1024).toFixed(1)} MB</span><button className="icon-button" type="button" aria-label="Quitar video" onClick={() => { setVideo(null); if (fileInput.current) fileInput.current.value = ''; requestId.current = ''; }}><X aria-hidden="true" /></button></div>}
        <label>¿Cómo te mostramos?<input name="alias" maxLength={32} placeholder="Alias (opcional)" autoComplete="off" /></label>
        <div className="confession-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="consent-row"><input name="consent" type="checkbox" required />Autorizo al equipo de LIF a guardar, revisar y publicar mi confesión y el video que adjunte, con el alias que indiqué. Tengo permiso para compartir este contenido.</label>
        <button className="action-button action-dark" type="submit"><Send aria-hidden="true" />{busy ? 'Enviando…' : 'Enviar para revisión'}</button>
      </fieldset>
      {status && <p ref={statusRef} className="form-status" role="alert">{status}</p>}
    </form>
  </dialog>;
}

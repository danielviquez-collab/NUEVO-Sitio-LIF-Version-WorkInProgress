export const MAX_CONFESSION_LENGTH = 5000;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export type ConfessionVideoUpload = { name: string; type: string; size: number; base64: string };
export type ConfessionInput = { confession: string; alias: string; consent: boolean; website: string; video?: ConfessionVideoUpload };
export type ConfessionPayload = { id: string; confession: string; alias: string; consent: true; consentVersion: '2026-09'; source: 'lif-confesiones'; createdAt: string; video?: ConfessionVideoUpload };

export function validateVideoFile(file: { name: string; type: string; size: number }) {
  if (!file.size || file.size > MAX_VIDEO_BYTES) throw new Error('El video debe pesar menos de 25 MB.');
  if (!/\.(mp4|mov|webm)$/i.test(file.name) || (file.type && !['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type))) throw new Error('Elegí un video MP4, MOV o WebM.');
}

export function readConfessionVideo(file: File, signal: AbortSignal): Promise<ConfessionVideoUpload> {
  validateVideoFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new DOMException('Aborted', 'AbortError')); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    reader.onloadend = () => signal.removeEventListener('abort', abort);
    reader.onerror = () => reject(new Error('No pudimos leer el video. Seleccionalo de nuevo.'));
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result.split(',')[1] : undefined;
      if (!base64) { reject(new Error('No pudimos leer el video.')); return; }
      const type = file.type || (/\.mov$/i.test(file.name) ? 'video/quicktime' : /\.webm$/i.test(file.name) ? 'video/webm' : 'video/mp4');
      resolve({ name: file.name, type, size: file.size, base64 });
    };
    reader.readAsDataURL(file);
  });
}

export function confessionPayload(input: ConfessionInput, id: string): ConfessionPayload {
  const confession = input.confession.trim();
  const alias = input.alias.trim();
  if (input.website || (!confession && !input.video) || confession.length > MAX_CONFESSION_LENGTH || alias.length > 32 || !input.consent || !id) {
    throw new Error('Revisá tu confesión y la autorización antes de enviar.');
  }
  if (input.video) validateVideoFile(input.video);
  return { id, confession, alias, consent: true, consentVersion: '2026-09', source: 'lif-confesiones', createdAt: new Date().toISOString(), ...(input.video ? { video: input.video } : {}) };
}

export async function submitConfession(payload: ConfessionPayload, endpoint: string | undefined, signal: AbortSignal) {
  if (!endpoint) throw new Error('El envío no está disponible todavía. Tu texto no se envió. Podés intentarlo más tarde.');
  // Simple CORS request: Apps Script does not provide an OPTIONS endpoint.
  try {
    const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal });
    if (!response.ok) throw new Error('Unconfirmed submission');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true || !('id' in result) || result.id !== payload.id) throw new Error('Unconfirmed submission');
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('No pudimos confirmar el envío. Tu texto sigue aquí para que lo intentés de nuevo.');
  }
}

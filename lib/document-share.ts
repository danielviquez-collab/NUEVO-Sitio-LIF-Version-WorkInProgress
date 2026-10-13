export const PUBLIC_PREVIEW_ORIGIN = 'https://lifnewsitev1.netlify.app';

export function publicDocumentUrl(path: string, origin: string) {
  const site = new URL(origin);
  const local = site.hostname === 'localhost' || site.hostname.endsWith('.localhost')
    || site.hostname === '127.0.0.1' || site.hostname === '[::1]';
  return new URL(path, local ? PUBLIC_PREVIEW_ORIGIN : site.origin).href;
}

export function documentWhatsAppUrl(path: string, title: string, origin: string) {
  const url = new URL('https://wa.me/');
  url.searchParams.set('text', `${title}\nDescargá el PDF de LIF: ${publicDocumentUrl(path, origin)}`);
  return url.href;
}

'use client';

import { useSyncExternalStore } from 'react';
import { MessageCircle } from 'lucide-react';
import { track } from '@/lib/analytics';
import { documentWhatsAppUrl, PUBLIC_PREVIEW_ORIGIN } from '@/lib/document-share';

const subscribe = () => () => {};
const browserOrigin = () => window.location.origin;
const serverOrigin = () => PUBLIC_PREVIEW_ORIGIN;

export function DocumentWhatsAppLink({ href, title, kind }: {
  href: string;
  title: string;
  kind: 'recipe' | 'nutrition';
}) {
  const origin = useSyncExternalStore(subscribe, browserOrigin, serverOrigin);
  return (
    <a className="document-whatsapp" href={documentWhatsAppUrl(href, title, origin)}
      target="_blank" rel="noopener noreferrer" title="Compartir el enlace al PDF por WhatsApp"
      aria-label={kind === 'recipe' ? 'Enviar receta por WhatsApp' : 'Enviar ficha nutricional por WhatsApp'}
      onClick={() => track('document_whatsapp_share', { document_type: kind, document: href })}>
      <MessageCircle aria-hidden="true" />Enviar por WhatsApp
    </a>
  );
}

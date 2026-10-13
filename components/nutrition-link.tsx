'use client';

import { Download } from 'lucide-react';
import { track } from '@/lib/analytics';
import { DocumentWhatsAppLink } from './document-whatsapp-link';

export function NutritionLink({ href, flavor, share = false }: { href: string; flavor: string; share?: boolean }) {
  const download = (
    <a
      className="text-link"
      href={href}
      download
      onClick={() => track('nutrition_open', { flavor })}
    >
      Descargar ficha (PDF) <Download aria-hidden="true" />
    </a>
  );
  return share ? (
    <div className="nutrition-document-actions">
      {download}
      <DocumentWhatsAppLink href={href} title={`Ficha nutricional LIF: ${flavor}`} kind="nutrition" />
    </div>
  ) : download;
}

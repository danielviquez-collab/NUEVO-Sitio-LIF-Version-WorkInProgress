import test from 'node:test';
import assert from 'node:assert/strict';
import { publicDocumentUrl, documentWhatsAppUrl, PUBLIC_PREVIEW_ORIGIN } from './document-share.ts';

test('Local previews share the downloadable public PDF, never localhost', () => {
  for (const origin of ['http://localhost:3000', 'http://127.0.0.1:4207', 'http://[::1]:3000', 'http://lif.localhost:3000']) {
    assert.equal(publicDocumentUrl('/recipes/pdf/sorbete.pdf', origin), `${PUBLIC_PREVIEW_ORIGIN}/recipes/pdf/sorbete.pdf`);
  }
});

test('Hosted sites share the PDF from their actual origin', () => {
  for (const origin of ['https://lif.cr', 'https://lifnewsitev1.netlify.app', 'https://preview.example.com']) {
    assert.equal(publicDocumentUrl('/nutrition/te-blanco-fresa.pdf', origin), `${origin}/nutrition/te-blanco-fresa.pdf`);
  }
});

test('WhatsApp preserves the full title, accents and the exact downloadable file link', () => {
  const title = 'Sorbete de Limón & Pitahaya';
  const link = new URL(documentWhatsAppUrl('/recipes/pdf/sorbete.pdf', title, 'https://lif.cr'));
  assert.equal(link.origin + link.pathname, 'https://wa.me/');
  assert.equal(link.searchParams.get('text'), `${title}\nDescargá el PDF de LIF: https://lif.cr/recipes/pdf/sorbete.pdf`);
  assert.equal(link.searchParams.size, 1);
});

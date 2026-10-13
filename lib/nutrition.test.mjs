import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { flavors } from './lif-content.ts';
import { nutritionFacts } from './nutrition.ts';

const officialHashes = {
  'te-verde-maracuya': '5bae8988a9c6107a70645d07ac465863dfec7ff7d01f097d2301e915aaf5fa15',
  'te-blanco-fresa': '1e203b8faaa326f4b29fa4759cb9b888f9b5c4f08fa9c7a178ea7ba8ab3a141b',
  'te-frio-manzana': '6799936b20988d3e62068ce12481c8223c26fff148526bc577d4a69fb4b9e918',
};

test('all 13 flavors provide nutrition data and a valid local PDF', () => {
  assert.equal(flavors.length, 13);
  for (const flavor of flavors) {
    assert.ok(nutritionFacts[flavor.slug], flavor.slug);
    assert.equal(flavor.nutrition, `/nutrition/${flavor.slug}.pdf`);
    const pdf = readFileSync(new URL(`../public${flavor.nutrition}`, import.meta.url));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  }
});

test('each new flavor downloads its own unmodified official sheet supplied on 2026-09-29', () => {
  for (const [slug, hash] of Object.entries(officialHashes)) {
    const pdf = readFileSync(new URL(`../public/nutrition/${slug}.pdf`, import.meta.url));
    assert.equal(createHash('sha256').update(pdf).digest('hex'), hash, slug);
  }
});

test('new flavor tables exactly match the supplied sheets, including intentionally blank references', () => {
  for (const slug of Object.keys(officialHashes)) {
    assert.deepEqual(nutritionFacts[slug], {
      energy: '75 kJ / 20 kcal',
      referenceYear: 2020,
      rows: [
        { label: 'Grasa total', amount: '0 g', reference: '0 %' },
        { label: 'Grasa saturada', amount: '0 g' },
        { label: 'Carbohidratos totales', amount: '5 g', reference: '2 %' },
        { label: 'Azúcar', amount: '5 g' },
        { label: 'Fibra', amount: '0 g', reference: '0 %' },
        { label: 'Proteína', amount: '0 g', reference: '0 %' },
        { label: 'Sodio**', amount: '30 mg', reference: '1 %' },
      ],
    }, slug);
  }
});

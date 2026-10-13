import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = new URL('../work/nutrition-new-flavors/', import.meta.url);
await mkdir(output, { recursive: true });
const cases = [
  ['te-verde-maracuya', 'Té verde, maracuyá'],
  ['te-blanco-fresa', 'Té blanco, fresa'],
  ['te-frio-manzana', 'Té frío, manzana'],
];
const expectedRows = [
  ['Energía', '75 kJ / 20 kcal', ''], ['Energía de la grasa', '0 kJ (0 kcal)', ''],
  ['Grasa total', '0 g', '0 %'], ['Grasa saturada', '0 g', ''],
  ['Carbohidratos totales', '5 g', '2 %'], ['Azúcar', '5 g', ''],
  ['Fibra', '0 g', '0 %'], ['Proteína', '0 g', '0 %'], ['Sodio**', '30 mg', '1 %'],
];
const results = [];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

try {
  for (const [layout, width, height, reducedMotion] of [
    ['desktop', 1440, 1000, 'no-preference'], ['tablet', 820, 1180, 'no-preference'],
    ['mobile', 390, 844, 'no-preference'], ['narrow', 320, 568, 'no-preference'],
    ['reduced-motion', 390, 844, 'reduce'],
  ]) {
    if (process.env.LAYOUT && process.env.LAYOUT !== layout) continue;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: width < 1000 });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('lif-cookie-preferences-v1', JSON.stringify({
      necessary: true, analytics: false, marketing: false, savedAt: Date.now(), version: 1,
    })));
    await page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/sabores`);
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(({ name }) =>
      /\/(?:lib\/)?sachet-scene(?:\.ts|-[^/]+\.js)(?:\?|$)/.test(name)));
    assert.equal(await page.locator('.pending-data').count(), 0, 'No flavor should still be pending');
    assert.equal(await page.locator('.catalog-item-new').count(), 3, 'Keep new-flavor styling');
    assert.equal(await page.locator('.catalog-grid a[download]').count(), 13);

    for (const [slug, name] of cases) {
      console.log(`Checking ${layout}: ${slug}`);
      const button = page.getByRole('button', { name: `Ver información nutricional de ${name}`, exact: true });
      await button.click();
      await page.waitForFunction(() => document.querySelector('.sachet-dialog')?.dataset.phase === 'nutritionVisible');
      const dialog = page.locator('.sachet-dialog');
      assert.equal(await dialog.getAttribute('data-animation-error'), null);
      const panel = page.locator('.sachet-panel');
      assert.equal(await panel.locator('h2').innerText(), name);
      assert.deepEqual(await panel.locator('tbody tr').evaluateAll(rows => rows.map(row =>
        [...row.cells].map(cell => cell.textContent.trim()))), expectedRows);
      assert.match(await panel.locator('.nutrition-serving').innerText(), /Tamaño de porción: 6,25 g.*250 mL.*\nPorciones por empaque: 4\./);
      assert.equal(await panel.locator('.nutrition-table thead').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(0, 0, 0)');
      assert.match(await panel.locator('.nutrition-footnote').innerText(), /2020/);
      const geometry = await panel.evaluate(el => {
        const bounds = el.getBoundingClientRect();
        const card = el.querySelector('.nutrition-dialog');
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          scrollWidth: card.scrollWidth, clientWidth: card.clientWidth,
          children: [...card.children].map(child => ({ tag: child.tagName, width: child.getBoundingClientRect().width })) };
      });
      await page.screenshot({ path: new URL(`${layout}-${slug}.png`, output).pathname });
      assert.ok(geometry.left >= 0 && geometry.right <= width + 1);
      assert.ok(geometry.top >= 0 && geometry.bottom <= height + 1);
      assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1, `No horizontal clipping: ${JSON.stringify(geometry)}`);
      const link = panel.getByRole('link', { name: 'Descargar ficha (PDF)' });
      assert.equal(await link.getAttribute('href'), `/nutrition/${slug}.pdf`);
      const downloading = page.waitForEvent('download');
      await link.click();
      const download = await downloading;
      assert.equal(await download.failure(), null);
      assert.equal(download.suggestedFilename(), `${slug}.pdf`);
      assert.equal(sha256(await readFile(await download.path())),
        sha256(await readFile(new URL(`../public/nutrition/${slug}.pdf`, import.meta.url))));
      await panel.getByRole('button', { name: 'Cerrar información nutricional' }).click();
      await dialog.waitFor({ state: 'detached' });
      results.push({ layout, slug, table: 'verified', download: 'identical', geometry });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(new URL('verification.json', output), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: 'passed', scenarios: results.length }));
} finally {
  await browser.close();
}

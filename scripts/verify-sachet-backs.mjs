import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { flavors } from '../lib/lif-content.ts';

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = new URL(process.env.LIF_SACHET_QA_OUTPUT || '../work/sachet-backs-2026-10-12/', import.meta.url);
await mkdir(output, { recursive: true });
const collection = [...flavors.filter(flavor => flavor.isNew), ...flavors.filter(flavor => !flavor.isNew)];
const results = [];
const skipped = [];
for (const [engine, name, width, height, all] of [
  ['chromium', 'desktop', 1440, 1000, true],
  ['chromium', 'mobile', 390, 844, true],
  ['chromium', 'tablet', 820, 1180, false],
  ['chromium', 'narrow', 320, 568, false],
  ['chromium', 'landscape', 844, 390, false],
  ['webkit', 'safari-mobile', 390, 844, false],
]) {
  let browser;
  try {
    browser = await (engine === 'webkit' ? webkit.launch() : chromium.launch({ channel: 'chrome' }));
  } catch (error) {
    if (engine !== 'webkit' || !error.message.includes("Executable doesn't exist") || process.env.REQUIRE_WEBKIT === '1') throw error;
    skipped.push({ engine, name, reason: 'WebKit executable is not installed; physical Safari/iPhone remains pending.' });
    console.log(`Skipped ${name}: WebKit executable not installed`);
    continue;
  }
  try {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1000, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('lif-cookie-preferences-v1', JSON.stringify({ necessary: true, analytics: false, marketing: false, savedAt: Date.now(), version: 1 }));
      sessionStorage.setItem('lif_interstitial_campaign_v1_session_v2', JSON.stringify({ seen: true }));
    });
    await page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/sabores`);
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(({ name }) => /sachet-scene/.test(name)));
    await page.evaluate(async backs => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('.catalog-pack-button img')].map(async image => { image.loading = 'eager'; await image.decode(); }));
      // Decode artwork before virtual time starts; network waits use real time.
      window.qaBackImages = await Promise.all(backs.map(async src => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return image;
      }));
    }, collection.map(flavor => flavor.back.image));
    await page.clock.install();
    for (const index of all ? collection.map((_, index) => index) : [0, 3, 12]) {
      const flavor = collection[index];
      const button = page.locator('.catalog-pack-button').nth(index);
      await button.scrollIntoViewIfNeeded();
      await button.evaluate(element => element.click());
      let phase;
      for (let step = 0; step < 500; step++) {
        await page.clock.runFor(16);
        phase = await page.locator('.sachet-dialog').getAttribute('data-phase');
        if (phase === 'backVisible') break;
        assert.notEqual(phase, 'nutritionVisible', `${name}/${flavor.slug}: reverse skipped`);
      }
      assert.equal(phase, 'backVisible', `${name}/${flavor.slug}: reverse never shown`);
      const reverse = await page.evaluate(() => {
        const dialog = document.querySelector('.sachet-dialog');
        const back = dialog.querySelector('.sachet-back');
        const image = back.querySelector('img');
        const bounds = image.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const drawing = canvas.getContext('2d');
        drawing.drawImage(image, 0, 0);
        const pixels = drawing.getImageData(0, 0, canvas.width, canvas.height).data;
        let opaque = 0;
        let colored = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] > 200) {
            opaque++;
            if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 35) colored++;
          }
        }
        return { image: new URL(image.src).pathname, medium: back.dataset.medium, artwork: back.dataset.artwork,
          printedVisibility: getComputedStyle(dialog.querySelector('.sachet-print')).visibility,
          background: getComputedStyle(back).backgroundColor, mask: getComputedStyle(back).maskImage,
          naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, corners: pixels[3], opaque, colored,
          x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
          error: dialog.dataset.animationError ?? null, sequence: dialog.dataset.sequence };
      });
      assert.equal(reverse.image, flavor.back.image);
      assert.equal(reverse.medium, flavor.back.medium);
      assert.equal(reverse.artwork, 'official');
      assert.equal(reverse.printedVisibility, 'hidden', 'The HTML panel obscures the original reverse');
      assert.equal(reverse.background, 'rgba(0, 0, 0, 0)');
      assert.equal(reverse.mask, 'none');
      assert.equal(reverse.error, null);
      assert.equal(reverse.corners, 0, 'Opaque exterior frame');
      assert.ok(reverse.opaque > 500000 && reverse.colored > 200000, 'Missing/blank packet artwork');
      assert.ok(reverse.x >= 0 && reverse.x + reverse.width <= width + 1);
      assert.ok(reverse.y >= 0 && reverse.y + reverse.height <= height + 1);
      await page.screenshot({ path: new URL(`${name}-${flavor.slug}-back.png`, output).pathname });
      await page.clock.runFor(1100);
      assert.equal(await page.locator('.sachet-dialog').getAttribute('data-phase'), 'nutritionVisible');
      assert.equal(await page.locator('.sachet-panel h2').innerText(), flavor.name);
      assert.equal(await page.locator('.sachet-panel a[download]').getAttribute('href'), `/nutrition/${flavor.slug}.pdf`);
      assert.ok(await page.locator('.sachet-panel .nutrition-table').isVisible());
      assert.equal(await page.locator('.sachet-panel .nutrition-table thead').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(0, 0, 0)');
      assert.equal(await page.locator('.sachet-panel .nutrition-serving').evaluate(element => getComputedStyle(element).borderTopColor), 'rgb(0, 0, 0)');
      if (index === 0) await page.screenshot({ path: new URL(`${name}-nutrition.png`, output).pathname });
      await page.keyboard.press('Escape');
      await page.clock.runFor(300);
      await page.locator('.sachet-dialog').waitFor({ state: 'detached' });
      assert.equal(await button.evaluate(element => getComputedStyle(element.querySelector('.pack-image')).visibility), 'visible');
      assert.equal(await page.evaluate(() => document.body.style.position), '');
      results.push({ engine, name, flavor: flavor.slug, ...reverse });
      console.log(`Verified ${name}: ${flavor.name}`);
    }
    assert.deepEqual(errors, [], `${name}: browser errors`);
    await context.close();
  } finally { await browser.close(); }
}
await writeFile(new URL('results.json', output), JSON.stringify({ scenarios: results.length, realSubmissions: 0, results, skipped }, null, 2));
console.log(JSON.stringify({ status: 'passed-available-engines', scenarios: results.length, skipped, output: output.pathname }));

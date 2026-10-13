import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = new URL('../work/nutrition-close/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];

try {
  for (const [name, width, height, reducedMotion] of [
    ['desktop', 1440, 1000, 'no-preference'],
    ['tablet', 820, 1180, 'no-preference'],
    ['mobile', 390, 844, 'no-preference'],
    ['narrow', 320, 568, 'no-preference'],
    ['landscape', 844, 390, 'no-preference'],
    ['reduced-motion', 390, 844, 'reduce'],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: width < 1000 });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('lif-cookie-preferences-v1', JSON.stringify({ necessary: true, analytics: false, marketing: false, savedAt: Date.now(), version: 1 }));
      // Inspect the exact handoff between WAAPI and React, including frames too brief for screenshots.
      window.closeSamples = [];
      window.expansionSamples = [];
      const sampleExpansion = () => {
        const dialog = document.querySelector('.sachet-dialog');
        if (dialog?.dataset.phase === 'nutritionExpanding') {
          const print = dialog.querySelector('.sachet-print');
          const back = dialog.querySelector('.sachet-back');
          const card = print?.querySelector('.nutrition-dialog');
          if (print && back && card) {
            const bounds = card.getBoundingClientRect();
            window.expansionSamples.push({
              printZ: new DOMMatrixReadOnly(getComputedStyle(print).transform).m43,
              backZ: new DOMMatrixReadOnly(getComputedStyle(back).transform).m43,
              backOpacity: Number(getComputedStyle(back).opacity),
              cardOpacity: getComputedStyle(card).opacity,
              background: getComputedStyle(card).backgroundColor,
              width: bounds.width, height: bounds.height,
            });
          }
        }
        requestAnimationFrame(sampleExpansion);
      };
      requestAnimationFrame(sampleExpansion);
      // oxlint-disable-next-line typescript/unbound-method -- Invoked with the original animation as this below.
      const cancel = Animation.prototype.cancel;
      Animation.prototype.cancel = function () {
        const target = this.effect?.target;
        const before = target instanceof Element ? getComputedStyle(target).opacity : null;
        cancel.call(this);
        if (target instanceof Element && target.matches('.sachet-viewport, .sachet-veil')) {
          window.closeSamples.push({ target: target.className, before, after: getComputedStyle(target).opacity,
            exposed: target.isConnected && !!target.closest('dialog[open]') });
        }
      };
    });
    await page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/sabores`);
    await page.locator('.catalog-pack-button').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    // The catalog preloads its scene from useEffect, after the server-rendered buttons hydrate.
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(({ name }) =>
      /\/(?:lib\/)?sachet-scene(?:\.ts|-[^/]+\.js)(?:\?|$)/.test(name)));

    for (const [index, mode] of [[4, 'close'], [0, 'close'], [12, 'escape'], [4, 'early'], [4, 'close']]) {
      console.log(`Checking ${name}, flavor ${index}, ${mode}`);
      const button = page.locator('.catalog-pack-button').nth(index);
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 350)));
      const originalScroll = await page.evaluate(() => scrollY);
      await button.click();
      const dialog = page.locator('.sachet-dialog');
      if (mode === 'early' && reducedMotion !== 'reduce') {
        await page.waitForFunction(() => document.querySelector('.sachet-dialog')?.dataset.phase === 'turning');
      } else {
        try {
          await page.waitForFunction(() => document.querySelector('.sachet-dialog')?.dataset.phase === 'nutritionVisible');
        } catch (error) {
          await page.screenshot({ path: new URL(`${name}-failure.png`, output).pathname });
          console.error(await page.evaluate(() => ({ phase: document.querySelector('.sachet-dialog')?.dataset.phase,
            sequence: document.querySelector('.sachet-dialog')?.dataset.sequence, hidden: document.hidden })), errors);
          throw error;
        }
      }
      assert.equal(await dialog.getAttribute('data-animation-error'), null, `${name}: opening failed`);
      const expansion = await page.evaluate(() => window.expansionSamples.splice(0));
      if (mode !== 'early' && reducedMotion !== 'reduce') {
        assert.ok(expansion.length >= 3, `${name}: missing expansion frames`);
        for (const sample of expansion) {
          assert.ok(sample.backOpacity === 0 || sample.printZ > sample.backZ,
            `${name}: printed information crossed behind the visible pack (${sample.printZ} <= ${sample.backZ})`);
          assert.equal(sample.cardOpacity, '1', `${name}: nutrition content became transparent`);
          assert.equal(sample.background, 'rgb(255, 255, 255)', `${name}: nutrition background is not solid white`);
        }
        for (let i = 1; i < expansion.length; i++) {
          assert.ok(expansion[i].width >= expansion[i - 1].width - .5, `${name}: expansion width bounced`);
          assert.ok(expansion[i].height >= expansion[i - 1].height - .5, `${name}: expansion height bounced`);
        }
        const handoff = await page.evaluate(() => {
          const print = document.querySelector('.sachet-print');
          const matrix = new DOMMatrixReadOnly(getComputedStyle(print).transform);
          const panel = document.querySelector('.sachet-panel').getBoundingClientRect();
          return { xScale: matrix.m11, yScale: matrix.m22, z: matrix.m43,
            width: parseFloat(print.style.width), height: parseFloat(print.style.height),
            panelWidth: panel.width, panelHeight: panel.height };
        });
        assert.equal(handoff.xScale, 1, `${name}: final width changed during handoff`);
        assert.equal(handoff.yScale, 1, `${name}: final height changed during handoff`);
        assert.equal(handoff.z, 0, `${name}: final perspective changed during handoff`);
        assert.ok(Math.abs(handoff.width - handoff.panelWidth) < 1, `${name}: final panel width mismatch`);
        assert.ok(Math.abs(handoff.height - handoff.panelHeight) < 1, `${name}: final panel height mismatch`);
      }
      if (mode === 'close' && index === 4) await page.screenshot({ path: new URL(`${name}-open.png`, output).pathname });
      if (mode === 'escape') await page.keyboard.press('Escape');
      else await dialog.getByRole('button', { name: 'Cerrar información nutricional' }).filter({ visible: true }).click();
      await dialog.waitFor({ state: 'detached' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const state = await button.evaluate(el => ({ focused: document.activeElement === el, scroll: scrollY,
        bodyPosition: document.body.style.position, imageVisible: getComputedStyle(el.querySelector('.pack-image')).visibility,
        samples: window.closeSamples.splice(0) }));
      results.push({ name, index, mode, originalScroll, expansion, ...state });
      await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
      assert.ok(state.samples.length >= 2, `${name}: missing fade checks`);
      for (const sample of state.samples) {
        assert.ok(!sample.exposed || Number(sample.after) <= Number(sample.before) + .001,
          `${name}: ${sample.target} reappears after cancellation (${sample.before} -> ${sample.after})`);
      }
      assert.equal(state.bodyPosition, '', `${name}: body remains locked`);
      assert.equal(state.imageVisible, 'visible', `${name}: original pack remains hidden`);
      assert.ok(state.focused, `${name}: focus not restored`);
      assert.ok(Math.abs(state.scroll - originalScroll) <= 1, `${name}: scroll jumped`);
    }
    assert.deepEqual(errors, [], `${name}: browser errors`);
    await page.screenshot({ path: new URL(`${name}-closed.png`, output).pathname });
    await context.close();
  }
  console.log(JSON.stringify({ scenarios: results.length, status: 'passed', output: output.pathname }));
} finally {
  await browser.close();
}

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { HOME_NAVIGATION_KEY, homeEntryFromStorage, homeNavigationBootstrap, homeNavigationRequest } from './home-navigation.ts';

const now = 200000;
const click = { button: 0, defaultPrevented: false, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, target: '' };

function boot(pathname, raw) {
  const data = new Map(raw ? [[HOME_NAVIGATION_KEY, raw]] : []);
  const context = {
    sessionStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) },
    location: { pathname }, document: { documentElement: { dataset: {} }, addEventListener: () => {} }, Date: { now: () => now },
  };
  vm.runInNewContext(homeNavigationBootstrap, context);
  return { context, data };
}

test('An initial visit shows the welcome; both logo and Home menu clicks choose their own entrance', () => {
  assert.equal(homeEntryFromStorage(null, now), 'logo');
  for (const mode of ['logo', 'content']) {
    const request = homeNavigationRequest(mode, click, now);
    assert.equal(homeEntryFromStorage(request, now + 1000), mode);
    assert.equal(boot('/', request).context.document.documentElement.dataset.homeEntry, mode);
  }
});

test('A menu return suppresses the overlay before paint and is consumed only once', () => {
  const { context, data } = boot('/', homeNavigationRequest('content', click, now));
  assert.equal(context.document.documentElement.dataset.homeEntry, 'content');
  assert.equal(data.size, 0);
  vm.runInNewContext(homeNavigationBootstrap, context);
  assert.equal(context.document.documentElement.dataset.homeEntry, 'logo', 'A fresh reload restores the welcome');
});

test('Other pages and stale or malformed requests do not accidentally suppress the welcome', () => {
  assert.equal(boot('/recetario', homeNavigationRequest('content', click, now)).context.document.documentElement.dataset.homeEntry, undefined);
  for (const raw of ['bad json', 'null', '{}', JSON.stringify({ mode: 'other', at: now }),
    homeNavigationRequest('content', click, now - 120001), homeNavigationRequest('content', click, now + 1)]) {
    assert.equal(homeEntryFromStorage(raw, now), 'logo');
  }
  assert.equal(homeEntryFromStorage(homeNavigationRequest('content', click, now), now + 119999), 'content', 'Keep the choice through an interstitial');
});

test('New-tab, modified, cancelled and non-primary clicks do not alter the current tab entrance', () => {
  for (const override of [{ button: 1 }, { defaultPrevented: true }, { ctrlKey: true }, { metaKey: true },
    { altKey: true }, { shiftKey: true }, { target: '_blank' }]) {
    assert.equal(homeNavigationRequest('content', { ...click, ...override }, now), null);
  }
  assert.ok(homeNavigationRequest('content', { ...click, target: '_self' }, now));
});

test('Blocked browser storage never prevents the document from loading', () => {
  assert.doesNotThrow(() => vm.runInNewContext(homeNavigationBootstrap, {
    get sessionStorage() { throw new Error('Storage unavailable'); },
    document: { addEventListener: () => {} },
  }));
});

test('Native links record the chosen entrance before React hydrates, including clicks on their images', () => {
  const { context, data } = boot('/confesiones', null);
  let listener;
  context.document.addEventListener = (_type, callback) => { listener = callback; };
  class Anchor {
    constructor(mode) { this.dataset = { homeEntry: mode }; this.target = ''; }
  }
  class Target {
    constructor(anchor) { this.anchor = anchor; }
    closest() { return this.anchor; }
  }
  context.Element = Target;
  context.HTMLAnchorElement = Anchor;
  vm.runInNewContext(homeNavigationBootstrap, context);
  for (const mode of ['logo', 'content']) {
    listener({ ...click, target: new Target(new Anchor(mode)) });
    assert.equal(homeEntryFromStorage(data.get(HOME_NAVIGATION_KEY), now), mode);
  }
  listener({ ...click, metaKey: true, target: new Target(new Anchor('logo')) });
  assert.equal(homeEntryFromStorage(data.get(HOME_NAVIGATION_KEY), now), 'content');
});

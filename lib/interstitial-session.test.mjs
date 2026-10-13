import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignConfig, campaignSessionKey, localCampaignQA } from './interstitial-config.ts';
import { readFileSync } from 'node:fs';
import { chooseVideo, internalDestination, InterstitialSession, restoreSession } from './interstitial-session.ts';
import { isGameSessionActive, setGameSessionPhase, subscribeGameSession } from './game-session.ts';

const config = campaignConfig(false);
const destination = 'https://lif.test/sabores';
function clock() {
  let now = 0;
  const session = new InterstitialSession(config, now, undefined, () => 0);
  session.setAttention(true, now);
  return { session, now: () => now, advance(seconds) { for (let i = 0; i < seconds; i++) session.tick(now += 1000); } };
}

test('1-3: eligibility never opens the ad; a valid navigation does', () => {
  const c = clock();
  c.advance(59);
  assert.equal(c.session.requestNavigation(destination, c.now()), 'pass');
  c.advance(5);
  assert.equal(c.session.eligible, true);
  assert.equal(c.session.active, false);
  assert.equal(c.session.requestNavigation(destination, c.now()), 'show');
  assert.equal(c.session.pending, destination);
  c.session.started();
  assert.equal(c.session.complete(), destination);
  assert.equal(c.session.data.seen, true);
});

test('4: 30 seconds browsing plus 3 minutes playing is 30 browsing seconds', () => {
  const c = clock(); c.advance(30);
  c.session.setGameActive(true, c.now()); c.advance(180);
  assert.equal(c.session.data.activeSeconds, 30);
  c.session.setGameActive(false, c.now()); c.advance(1);
  assert.equal(c.session.data.activeSeconds, 31);
});

test('5-8: starting and leaving an eligible game never triggers an ad; grace is 15 seconds', () => {
  const c = clock(); c.advance(65);
  c.session.setGameActive(true, c.now());
  assert.equal(c.session.active, false);
  assert.equal(c.session.requestNavigation(destination, c.now()), 'pass');
  c.session.setGameActive(false, c.now());
  c.advance(3); assert.equal(c.session.requestNavigation(destination, c.now()), 'pass');
  c.advance(11); assert.equal(c.session.requestNavigation(destination, c.now()), 'pass');
  c.advance(1); assert.equal(c.session.requestNavigation(destination, c.now()), 'show');
});

test('9: background or unfocused time does not count, including after tab restoration', () => {
  const c = clock(); c.advance(30); c.session.setAttention(false, c.now()); c.advance(300);
  assert.equal(c.session.data.activeSeconds, 30);
  assert.equal(c.session.requestNavigation(destination, c.now()), 'pass');
  c.session.setAttention(true, c.now()); c.advance(1);
  assert.equal(c.session.data.activeSeconds, 31);
});

test('10: double taps preserve one overlay and the first destination; ended is idempotent', () => {
  const c = clock(); c.advance(60);
  assert.equal(c.session.requestNavigation(destination, c.now()), 'show');
  assert.equal(c.session.requestNavigation('https://lif.test/recetario', c.now()), 'blocked');
  c.session.started(); c.advance(12);
  assert.equal(c.session.data.activeSeconds, 60);
  assert.equal(c.session.complete(), destination);
  assert.equal(c.session.complete(), null);
  assert.equal(c.session.fail(), null);
});

test('11-12: completed campaign survives document reload and performs no preload', () => {
  const c = clock(); c.advance(60); c.session.requestNavigation(destination, c.now()); c.session.started(); c.session.complete();
  const restored = restoreSession(JSON.stringify(c.session.data), config);
  const session = new InterstitialSession(config, c.now(), restored);
  session.setAttention(true, c.now());
  assert.equal(session.requestNavigation(destination, c.now()), 'pass');
  assert.equal(session.shouldPreload(c.now(), false), false);
  assert.equal(campaignSessionKey('v1', false), 'lif_interstitial_campaign_v1_session_v2');
  assert.notEqual(campaignSessionKey('v1', false), campaignSessionKey('v2', false));
});

test('13-14: only same-tab internal page navigation qualifies', () => {
  const current = 'https://lif.test/juega';
  for (const intent of [
    { href: '#minijuegos' }, { href: '/juega?modo=timing' }, { href: '/juega/#reglamento' },
    { href: 'https://instagram.com/lifstevia' }, { href: 'mailto:mercadeo@laica.co.cr' },
    { href: 'tel:+50622846000' }, { href: '/nutrition/limon.pdf' }, { href: '/videos/interstitial/test.mp4' },
    { href: '/sabores', download: true }, { href: '/sabores', target: '_blank' },
    { href: '/sabores', modified: true }, { href: '/sabores', button: 1 },
    { href: '/sabores', prevented: true }, { href: 'javascript:alert(1)' },
  ]) assert.equal(internalDestination(intent, current), null, JSON.stringify(intent));
  assert.equal(internalDestination({ href: '/sabores' }, current), destination);
  assert.equal(internalDestination({ href: '/confesiones/todas' }, current), 'https://lif.test/confesiones/todas');
  assert.equal(internalDestination({ href: '/gracias-confesion' }, current), null);
  assert.equal(internalDestination({ href: '/juega/#reglamento' }, 'https://lif.test/'), 'https://lif.test/juega/#reglamento');
});

test('a new browser session can show a campaign seen in a previous session', () => {
  const previous = clock();
  previous.advance(60);
  previous.session.requestNavigation(destination, previous.now());
  previous.session.started(); previous.session.skip(8);
  assert.equal(previous.session.data.seen, true);
  const next = clock(); next.advance(60);
  assert.equal(next.session.requestNavigation(destination, next.now()), 'show');
  assert.notEqual(campaignSessionKey('v1', true), campaignSessionKey('v1', false));
});

test('the browser adapter never reads or writes a permanent seen flag', () => {
  const source = readFileSync(new URL('../components/video-interstitial.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|campaignSeenKey/);
  assert.match(source, /sessionStorage\.getItem\(sessionKey\)/);
  assert.match(source, /sessionStorage\.setItem\(sessionKey/);
});

test('15: technical failure allows the original navigation, never marks seen and prevents retry loops', () => {
  const c = clock(); c.advance(60); c.session.requestNavigation(destination, c.now());
  assert.equal(c.session.complete(), null);
  assert.equal(c.session.fail(), destination);
  assert.equal(c.session.data.seen, false);
  const restored = new InterstitialSession(config, c.now(), restoreSession(JSON.stringify(c.session.data), config));
  restored.setAttention(true, c.now());
  assert.equal(restored.requestNavigation(destination, c.now()), 'pass');
});

test('19: both games protect every lifecycle phase and unmount releases protection', () => {
  const changes = [];
  const unsubscribe = subscribeGameSession((active) => changes.push(active));
  for (const game of ['memory_lif', 'timing']) {
    for (const phase of ['countdown', 'playing', 'paused', 'game-over-transition', 'restarting']) {
      setGameSessionPhase(game, phase); assert.equal(isGameSessionActive(), true);
    }
    setGameSessionPhase(game, null); assert.equal(isGameSessionActive(), false);
  }
  unsubscribe();
  assert.deepEqual(changes, [true, false, true, false]);
});

test('state survives full-document links, preserving selection and grace after abandonment', () => {
  const c = clock(); c.advance(65); c.session.setGameActive(true, c.now());
  const restored = new InterstitialSession(config, 200000, restoreSession(JSON.stringify(c.session.data), config));
  assert.equal(restored.data.activeSeconds, 65);
  assert.equal(restored.video.id, c.session.video.id);
  assert.equal(restored.data.graceUntil, 215000);
  assert.equal(restored.data.gameActive, false);
});

test('only one selected video preloads after 40 active seconds; never while playing or on constrained connections', () => {
  const c = clock(); c.advance(39); assert.equal(c.session.shouldPreload(c.now(), false), false);
  c.advance(1); assert.equal(c.session.shouldPreload(c.now(), false), true);
  assert.equal(c.session.shouldPreload(c.now(), true), false);
  c.session.setGameActive(true, c.now()); assert.equal(c.session.shouldPreload(c.now(), false), false);
});

test('weights, disabled campaigns and invalid stored data are handled safely', () => {
  assert.equal(chooseVideo(config.videos, () => 0).id, 'gato');
  assert.equal(chooseVideo(config.videos, () => .4).id, 'lego');
  assert.equal(chooseVideo(config.videos, () => .9).id, 'plantas');
  assert.equal(chooseVideo(config.videos.map(v => ({...v, enabled:false}))), undefined);
  assert.equal(restoreSession('not json', config), undefined);
  assert.equal(restoreSession('{"threshold":-1}', config), undefined);
  const disabled = new InterstitialSession({ ...config, enabled: false }, 0);
  disabled.setAttention(true, 0); disabled.tick(1000);
  assert.equal(disabled.data.activeSeconds, 0);
  assert.equal(disabled.requestNavigation(destination, 1000), 'pass');
});

test('QA cannot change production behavior or be enabled on a public host', () => {
  assert.equal(localCampaignQA(false, 'localhost', '?lifInterstitialQA=1'), false);
  assert.equal(localCampaignQA(true, 'lif.cr', '?lifInterstitialQA=1'), false);
  assert.equal(localCampaignQA(true, 'localhost', '?lifInterstitialQA=1'), true);
  assert.equal(campaignConfig(false).minBrowsingActiveTimeSeconds, 60);
  assert.equal(campaignConfig(false).maxBrowsingActiveTimeSeconds, 120);
  assert.equal(campaignConfig(true).minBrowsingActiveTimeSeconds, 3);
});

test('skip requires 8 seconds of playback and consumes the campaign only once', () => {
  const c = clock(); c.advance(65); c.session.requestNavigation(destination, c.now());
  assert.equal(c.session.skip(8), null);
  c.session.started();
  for (const seconds of [0, 7.99, NaN, Infinity]) assert.equal(c.session.skip(seconds), null);
  assert.equal(c.session.data.seen, false);
  assert.equal(c.session.skip(8), destination);
  assert.equal(c.session.data.seen, true);
  assert.equal(c.session.skip(9), null);
  assert.equal(c.session.complete(), null);
  const restored = new InterstitialSession(config, c.now(), restoreSession(JSON.stringify(c.session.data), config));
  restored.setAttention(true, c.now());
  assert.equal(restored.requestNavigation(destination, c.now()), 'pass');
  assert.equal(restored.shouldPreload(c.now(), false), false);
});

import type { CampaignVideo, InterstitialConfig } from './interstitial-config';

export type SessionData = { threshold: number; videoId: string; activeSeconds: number; graceUntil: number; gameActive: boolean; failed: boolean; eligibleReported: boolean; seen: boolean };
type Phase = 'idle' | 'opening' | 'playing' | 'navigating';

export function chooseVideo(videos: readonly CampaignVideo[], random = Math.random): CampaignVideo | undefined {
  const available = videos.filter((video) => video.enabled && Number.isFinite(video.weight) && video.weight > 0);
  const total = available.reduce((sum, video) => sum + video.weight, 0);
  let point = random() * total;
  return available.find((video) => { point -= video.weight; return point < 0; }) ?? available.at(-1);
}

export function restoreSession(raw: string | null, config: InterstitialConfig): SessionData | undefined {
  try {
    const data = JSON.parse(raw ?? 'null') as SessionData | null;
    if (!data || ![data.threshold, data.activeSeconds, data.graceUntil].every(Number.isFinite)
      || data.threshold < config.minBrowsingActiveTimeSeconds || data.threshold > config.maxBrowsingActiveTimeSeconds
      || data.activeSeconds < 0 || data.graceUntil < 0
      || ![data.gameActive, data.failed, data.eligibleReported, data.seen].every((item) => typeof item === 'boolean')
      || !config.videos.some((video) => video.enabled && video.weight > 0 && video.id === data.videoId)) return undefined;
    return data;
  } catch { return undefined; }
}

export class InterstitialSession {
  readonly config: InterstitialConfig;
  readonly video: CampaignVideo | undefined;
  data: SessionData;
  phase: Phase = 'idle';
  pending: string | null = null;
  attentive = false;
  private lastTick: number;

  constructor(config: InterstitialConfig, now: number, restored?: SessionData, random = Math.random) {
    this.config = config;
    this.video = restored ? config.videos.find((video) => video.id === restored.videoId) : chooseVideo(config.videos, random);
    this.data = restored ? { ...restored } : {
      threshold: config.minBrowsingActiveTimeSeconds + Math.floor(random() * (config.maxBrowsingActiveTimeSeconds - config.minBrowsingActiveTimeSeconds + 1)),
      videoId: this.video?.id ?? '', activeSeconds: 0, graceUntil: 0, gameActive: false, failed: false, eligibleReported: false, seen: false,
    };
    this.lastTick = now;
    // A document restored with an active game means the previous game was abandoned.
    if (this.data.gameActive) { this.data.gameActive = false; this.data.graceUntil = now + config.gameExitGracePeriodSeconds * 1000; }
  }

  get disabled() { return !this.config.enabled || !this.video || this.data.seen || this.data.failed; }
  get eligible() { return !this.disabled && this.data.activeSeconds >= this.data.threshold; }
  get active() { return this.phase === 'opening' || this.phase === 'playing'; }

  tick(now: number) {
    const elapsed = Math.min(2000, Math.max(0, now - this.lastTick)) / 1000;
    this.lastTick = now;
    if (!this.disabled && this.attentive && !this.data.gameActive && this.phase === 'idle') this.data.activeSeconds += elapsed;
  }

  setAttention(attentive: boolean, now: number) { this.tick(now); this.attentive = attentive; }
  setGameActive(active: boolean, now: number) {
    this.tick(now);
    if (this.data.gameActive && !active) this.data.graceUntil = now + this.config.gameExitGracePeriodSeconds * 1000;
    this.data.gameActive = active;
  }

  shouldPreload(now: number, constrained: boolean) {
    return !constrained && !this.disabled && this.attentive && !this.data.gameActive && this.phase === 'idle'
      && now >= this.data.graceUntil && this.data.activeSeconds >= this.config.preloadAfterBrowsingSeconds;
  }

  requestNavigation(destination: string, now: number): 'pass' | 'show' | 'blocked' {
    this.tick(now);
    if (this.active || this.phase === 'navigating') return 'blocked';
    if (!this.attentive || this.disabled || this.data.gameActive || now < this.data.graceUntil || !this.eligible) return 'pass';
    this.phase = 'opening';
    this.pending = destination;
    return 'show';
  }

  started() {
    if (this.phase !== 'opening') return false;
    this.phase = 'playing';
    return true;
  }

  complete() {
    if (this.phase !== 'playing') return null;
    this.data.seen = true;
    return this.navigate();
  }

  skip(playedSeconds: number) {
    if (this.phase !== 'playing' || !Number.isFinite(playedSeconds) || playedSeconds < this.config.skipAfterSeconds) return null;
    // An intentional skip consumes the campaign, without reporting completion.
    this.data.seen = true;
    return this.navigate();
  }

  fail() {
    if (!this.active) return null;
    this.data.failed = true;
    return this.navigate();
  }

  private navigate() {
    this.phase = 'navigating';
    const destination = this.pending;
    this.pending = null;
    return destination;
  }
}

export type NavigationIntent = { href: string; target?: string | null; download?: boolean; modified?: boolean; button?: number; prevented?: boolean };
const sitePages = new Set(['/', '/recetario', '/sabores', '/confesiones', '/confesiones/todas', '/juega']);
const pagePath = (value: string) => value.replace(/\/+$/, '') || '/';

export function internalDestination(intent: NavigationIntent, current: string): string | null {
  if (intent.prevented || intent.modified || (intent.button ?? 0) !== 0 || intent.download
    || (intent.target && intent.target.toLowerCase() !== '_self')) return null;
  try {
    const source = new URL(current);
    const destination = new URL(intent.href, source);
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== source.origin
      || !sitePages.has(pagePath(destination.pathname)) || pagePath(destination.pathname) === pagePath(source.pathname)) return null;
    return destination.href;
  } catch { return null; }
}

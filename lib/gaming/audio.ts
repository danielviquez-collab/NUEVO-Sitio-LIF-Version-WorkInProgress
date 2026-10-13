import {
  GAME_CONFIG as C,
  JINGLE_ASSETS,
  GAME_SOUND_ASSETS,
} from './config.ts';
export type Sound =
  | 'button'
  | 'curtain'
  | 'countdown'
  | 'normal'
  | 'new'
  | 'logo'
  | 'super'
  | 'powerup'
  | 'boost'
  | 'penalty'
  | 'complete'
  | 'flip'
  | 'mismatch'
  | 'shuffle'
  | 'peek'
  | 'radar';
export type InteractionSound = 'match' | 'turn' | 'blocked';
export type AudioPlayback = {
  startsAt: number;
  durationMs: number;
  elapsedMs: () => number;
  stop: () => void;
};
export class GameAudio {
  context: AudioContext | null = null;
  muted = false;
  lastJingle = -1;
  sequence = 0;
  musicTimer: number | null = null;
  musicBeat = 0;
  buffers = new Map<string, AudioBuffer>();
  ready: Promise<void> | null = null;
  media = new Map<string, AudioBufferSourceNode>();
  master: GainNode | null = null;
  buttonEndsAt = 0;
  readonly buttonSound: string;
  constructor(buttonSound = GAME_SOUND_ASSETS.button) {
    this.buttonSound = buttonSound;
    try {
      this.muted = sessionStorage.getItem('lif.games.mute') === '1';
    } catch {
      /* Session storage is optional. */
    }
  }
  unlock() {
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.context.destination);
    }
    void this.context.resume().catch(() => {});
    this.ready ??= Promise.all(
      [
        ...JINGLE_ASSETS,
        ...Object.values({ ...GAME_SOUND_ASSETS, button: this.buttonSound }),
      ].map(async (src) => {
        const response = await fetch(src);
        if (!response.ok)
          throw new Error('No se pudo cargar el sonido de la partida.');
        const buffer = await this.context!.decodeAudioData(
          await response.arrayBuffer(),
        );
        this.buffers.set(src, buffer);
      }),
    )
      .then(() => {})
      .catch((error) => {
        this.ready = null;
        throw error;
      });
  }
  setMuted(value: boolean) {
    this.muted = value;
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        value ? 0 : 1,
        this.context.currentTime,
        0.025,
      );
    try {
      sessionStorage.setItem('lif.games.mute', value ? '1' : '0');
    } catch {}
  }
  tone(
    frequency: number,
    at: number,
    duration: number,
    volume = 0.04,
    type: OscillatorType = 'sine',
  ) {
    const ctx = this.context;
    if (!ctx || this.muted || ctx.state !== 'running') return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + at);
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + at + 0.012);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + at + duration,
    );
    oscillator.connect(gain);
    gain.connect(this.master ?? ctx.destination);
    oscillator.start(ctx.currentTime + at);
    oscillator.stop(ctx.currentTime + at + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  play(sound: Sound | InteractionSound) {
    if (sound === 'button' || sound === 'curtain') {
      this.playAsset(
        sound,
        sound === 'button' ? this.buttonSound : GAME_SOUND_ASSETS.curtain,
      );
      return;
    }
    const asset =
      sound === 'mismatch' || sound === 'penalty'
        ? GAME_SOUND_ASSETS.mismatch
        : sound === 'normal' || sound === 'new' || sound === 'logo'
          ? GAME_SOUND_ASSETS.food
          : sound === 'match' || sound === 'turn' || sound === 'blocked'
            ? GAME_SOUND_ASSETS[sound]
            : null;
    if (asset) {
      this.playAsset('effect', asset);
      return;
    }
    if (sound === 'match' || sound === 'turn' || sound === 'blocked') return;
    const notes: Record<Exclude<Sound, 'button' | 'curtain'>, number[]> = {
      countdown: [520],
      normal: [660, 880],
      new: [660, 880, 1100, 1320],
      logo: [520, 780, 1040],
      super: [440, 660, 880, 1100, 1320],
      powerup: [520, 1040],
      boost: [520, 1040, 1560],
      penalty: [190, 120],
      complete: [660, 880, 1040, 1320],
      flip: [420],
      mismatch: [340, 300],
      shuffle: [400, 560, 720],
      peek: [780, 1040],
      radar: [680, 920],
    };
    notes[sound].forEach((f, i) =>
      this.tone(
        f,
        i * 0.065,
        0.14,
        sound === 'penalty' ? 0.04 : 0.045,
        sound === 'penalty' ? 'triangle' : 'sine',
      ),
    );
  }
  music(active: boolean) {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (active)
      this.musicTimer = window.setInterval(() => {
        const notes = [220, 0, 330, 0, 294, 0, 392, 0];
        const note = notes[this.musicBeat++ % notes.length];
        if (note) this.tone(note, 0, 0.22, 0.012, 'triangle');
      }, 310);
  }
  playAsset(
    key: string,
    src: string,
    offset = 0,
    delay = 0,
  ): AudioPlayback | undefined {
    const ctx = this.context,
      buffer = this.buffers.get(src);
    if (!ctx || !buffer) return;
    this.stopAsset(key);
    const source = ctx.createBufferSource();
    const from = Math.max(0, Math.min(offset, buffer.duration - 0.01));
    const startsAt = ctx.currentTime + delay;
    const durationMs = (buffer.duration - from) * 1000;
    source.buffer = buffer;
    source.connect(this.master ?? ctx.destination);
    source.start(delay ? startsAt : 0, from);
    if (key === 'button') this.buttonEndsAt = startsAt + durationMs / 1000;
    this.media.set(key, source);
    source.onended = () => {
      source.disconnect();
      if (this.media.get(key) === source) {
        this.media.delete(key);
        if (key === 'button') this.buttonEndsAt = 0;
      }
    };
    return {
      startsAt,
      durationMs,
      elapsedMs: () => {
        // The output clock follows audible playback, including device latency.
        const output = ctx.getOutputTimestamp?.();
        const time = output?.performanceTime
          ? output.contextTime!
          : ctx.currentTime;
        return Math.max(0, Math.min(durationMs, (time - startsAt) * 1000));
      },
      stop: () => {
        if (this.media.get(key) === source) this.stopAsset(key);
      },
    };
  }
  stopAsset(key: string) {
    const source = this.media.get(key);
    this.media.delete(key);
    if (key === 'button') this.buttonEndsAt = 0;
    try {
      source?.stop();
    } catch {}
  }
  start() {
    this.playAsset('start', GAME_SOUND_ASSETS.start);
  }
  startRoulette() {
    this.stopAsset('button');
    void this.context?.resume().catch(() => {});
    return this.playAsset('roulette', GAME_SOUND_ASSETS.roulette, 0, 0.04);
  }
  startCurtain(holdMs = 0) {
    const delay = Math.max(
      holdMs / 1000,
      0.04 + Math.max(0, this.buttonEndsAt - (this.context?.currentTime ?? 0)),
    );
    return this.playAsset('curtain', GAME_SOUND_ASSETS.curtain, 0, delay);
  }
  startLogoShine(curtain: AudioPlayback, offsetMs: number) {
    const delay = Math.max(
      0,
      curtain.startsAt + offsetMs / 1000 - (this.context?.currentTime ?? 0),
    );
    return this.playAsset('logo-shine', GAME_SOUND_ASSETS.logoShine, 0, delay);
  }
  syncBoost(remaining: number, paused: boolean) {
    if (!remaining || paused) {
      this.stopAsset('boost');
      return;
    }
    if (!this.media.has('boost'))
      this.playAsset(
        'boost',
        GAME_SOUND_ASSETS.boost,
        C.BOOST_DURATION_SECONDS - remaining / 1000,
      );
  }
  defeat() {
    this.music(false);
    this.stopAsset('boost');
    this.stopAsset('start');
    if (!this.buffers.size) return;
    let index =
      C.GAME_OVER_JINGLE_MODE === 'fixed'
        ? 0
        : C.GAME_OVER_JINGLE_MODE === 'sequential'
          ? this.sequence++ % 3
          : Math.floor(Math.random() * 3);
    if (C.GAME_OVER_JINGLE_MODE === 'random' && index === this.lastJingle)
      index = (index + 1 + Math.floor(Math.random() * 2)) % 3;
    this.lastJingle = index;
    this.playAsset('defeat', JINGLE_ASSETS[index]);
  }
  stop() {
    this.music(false);
    for (const key of this.media.keys()) this.stopAsset(key);
  }
  dispose() {
    this.stop();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.ready = null;
    this.buffers.clear();
  }
}

import { audibleIntroTime } from './intro-proposals.ts';

export class IntroProposalAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private generation = 0;
  private startsAt = 0;
  private durationMs = 0;
  private offsetMs = 0;
  private volume = 0.7;

  async play(url: string, offsetMs = 0) {
    this.stop();
    const generation = this.generation;
    this.context ??= new AudioContext();
    if (!this.gain) {
      this.gain = this.context.createGain();
      this.gain.connect(this.context.destination);
    }
    this.gain.gain.value = this.volume;
    await this.context.resume();
    if (!this.buffers.has(url)) {
      const context = this.context;
      const buffer = fetch(url)
        .then(async (response) => {
          if (!response.ok) throw new Error('No se pudo preparar el audio.');
          return context.decodeAudioData(await response.arrayBuffer());
        })
        .catch((error) => {
          this.buffers.delete(url);
          throw error;
        });
      this.buffers.set(url, buffer);
    }
    const buffer = await this.buffers.get(url)!;
    if (generation !== this.generation) return false;
    this.durationMs = buffer.duration * 1000;
    this.offsetMs = Math.max(0, Math.min(offsetMs, this.durationMs));
    this.startsAt = this.context.currentTime + 0.06;
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.gain);
    this.source.start(this.startsAt, this.offsetMs / 1000);
    return true;
  }
  timeMs() {
    return this.context && this.source
      ? audibleIntroTime(
          this.context,
          this.startsAt,
          this.durationMs,
          this.offsetMs,
        )
      : this.offsetMs;
  }
  duration() {
    return this.durationMs;
  }
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.context && this.gain)
      this.gain.gain.setTargetAtTime(
        this.volume,
        this.context.currentTime,
        0.025,
      );
  }
  pause() {
    const time = this.timeMs();
    this.stop();
    this.offsetMs = time;
    return time;
  }
  stop() {
    this.generation++;
    try {
      this.source?.stop();
    } catch {
      /* The source may already have ended. */
    }
    this.source?.disconnect();
    this.source = undefined;
    this.offsetMs = 0;
  }
  dispose() {
    this.stop();
    const context = this.context;
    this.context = undefined;
    this.gain = undefined;
    this.durationMs = 0;
    this.startsAt = 0;
    void context?.close().catch(() => {});
    this.buffers.clear();
  }
}

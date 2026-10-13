type Candidate = { ratio: number; automatic: boolean; allowed: boolean; manual: boolean; onSelect: (selected: boolean) => void };

// One visible page video owns playback; a small margin prevents scroll jitter.
export class VisibleMediaCoordinator {
  private candidates = new Map<symbol, Candidate>();
  private selected: symbol | null = null;

  register(onSelect: Candidate['onSelect']) {
    const key = Symbol('page-video');
    this.candidates.set(key, { ratio: 0, automatic: true, allowed: true, manual: false, onSelect });
    return {
      update: (ratio: number, automatic: boolean, allowed = true) => {
        const candidate = this.candidates.get(key);
        if (!candidate) return;
        candidate.ratio = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
        candidate.automatic = automatic;
        candidate.allowed = allowed;
        if (!allowed || candidate.ratio < .3) candidate.manual = false;
        this.reconcile();
      },
      select: () => {
        const candidate = this.candidates.get(key);
        if (candidate?.allowed && candidate.ratio >= .3) {
          for (const other of this.candidates.values()) other.manual = false;
          candidate.manual = true;
          this.activate(key);
        }
      },
      dispose: () => {
        if (this.selected === key) this.activate(null);
        this.candidates.delete(key);
        this.reconcile();
      },
    };
  }

  private activate(key: symbol | null) {
    if (key === this.selected) return;
    const previous = this.selected;
    this.selected = key;
    if (previous) this.candidates.get(previous)?.onSelect(false);
    if (key) this.candidates.get(key)?.onSelect(true);
  }

  private reconcile() {
    const eligible = [...this.candidates].filter(([, item]) => item.allowed && (item.automatic || item.manual) && item.ratio >= .3);
    eligible.sort((a, b) => b[1].ratio - a[1].ratio);
    const best = eligible[0];
    const current = this.selected ? this.candidates.get(this.selected) : null;
    if (current?.allowed && current.manual && current.ratio >= .3) return;
    if (current?.allowed && (current.automatic || current.manual) && current.ratio >= .3 && best && best[1].ratio < current.ratio + .08) return;
    this.activate(best?.[0] ?? null);
  }
}

export const pageMedia = new VisibleMediaCoordinator();

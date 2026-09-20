// Web Audio API Synthesizer for Casino & Poker Sound Effects

class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('poker_sound_muted') === 'true';
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('poker_sound_muted', this.muted ? 'true' : 'false');
    }
    return this.muted;
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Card swoosh / deal sound
  public playDeal(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  // Card collect sound (whoosh / gather)
  public playCollect(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  // Ceramic / metal chip clink sound
  public playChip(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    // Two rapid high-frequency clinks
    [0, 0.05].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400 + Math.random() * 400, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + delay + 0.06);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.06);
    });
  }

  // Knock on wood (check action)
  public playCheck(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    [0, 0.09].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + delay + 0.07);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.07);
    });
  }

  // Fold sound
  public playFold(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Victory celebration chime (arpeggio)
  public playWin(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const delay = idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  }
}

export const sounds = new SoundEffects();

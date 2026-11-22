import { FLAVORS, type FlavorId } from '../data/flavors';

/**
 * 100% procedural Web Audio API ASMR Foley Synthesizer.
 * Zero external audio samples — synthesizes:
 * - Cold-pressed fresh pour stream (stereo bandpass-filtered pink noise driven by scroll speed)
 * - Effervescent bubble/droplet chirps (fast pitch-swept sine pops)
 * - Crushed ice crystal clinks (inharmonic high-Q modal resonance bank)
 * - Subtle dome-lid tactile snap on layer crossings
 */
export class TropisipFoleyEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pourGain: GainNode | null = null;
  private pourFilterLow: BiquadFilterNode | null = null;
  private pourFilterHigh: BiquadFilterNode | null = null;
  private enabled = false;
  private lastLayerIndex = -1;
  private lastClinkTime = 0;
  private lastBubbleTime = 0;
  private currentViscosity = 0.78;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setFlavorProfile(flavorId: FlavorId): void {
    this.currentViscosity = FLAVORS[flavorId].pulpDensity;
  }

  public async enable(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      return false;
    }

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.buildPourGraph(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.enabled = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.42, this.ctx.currentTime, 0.06);
    }

    this.playIceClink(0.7);
    return true;
  }

  public disable(): void {
    this.enabled = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    }
    if (this.pourGain && this.ctx) {
      this.pourGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
    }
  }

  private buildPourGraph(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    this.masterGain = master;

    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 2.5);
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
        b6 = white * 0.115926;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filterLow = ctx.createBiquadFilter();
    filterLow.type = 'bandpass';
    filterLow.frequency.value = 620;
    filterLow.Q.value = 1.65;

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = 'bandpass';
    filterHigh.frequency.value = 2150;
    filterHigh.Q.value = 2.4;

    const pourGain = ctx.createGain();
    pourGain.gain.value = 0.0001;

    noise.connect(filterLow);
    noise.connect(filterHigh);
    filterLow.connect(pourGain);
    filterHigh.connect(pourGain);
    pourGain.connect(master);
    noise.start();

    this.pourGain = pourGain;
    this.pourFilterLow = filterLow;
    this.pourFilterHigh = filterHigh;
  }

  public onScroll(scrollVelocity: number, activeLayerIndex: number): void {
    if (!this.enabled || !this.ctx || !this.pourGain || !this.pourFilterLow || !this.pourFilterHigh) {
      return;
    }

    const now = this.ctx.currentTime;
    const speed = Math.min(1, Math.abs(scrollVelocity) / 28);

    const targetPourGain = speed > 0.03 ? Math.min(0.28, speed * 0.32) : 0.0001;
    const viscosityShift = (1 - this.currentViscosity) * 340;
    this.pourGain.gain.setTargetAtTime(targetPourGain, now, 0.045);
    this.pourFilterLow.frequency.setTargetAtTime(520 + speed * 480 + viscosityShift, now, 0.05);
    this.pourFilterHigh.frequency.setTargetAtTime(1850 + speed * 1100 + viscosityShift, now, 0.05);

    if (speed > 0.12 && now - this.lastBubbleTime > 0.075 + (1 - speed) * 0.16) {
      this.lastBubbleTime = now;
      this.playBubblePop(0.18 + speed * 0.35);
    }

    if (activeLayerIndex !== this.lastLayerIndex) {
      if (activeLayerIndex >= 0 && now - this.lastClinkTime > 0.18) {
        this.lastClinkTime = now;
        if (activeLayerIndex === 0 || activeLayerIndex === 5) {
          this.playTactileSnap(0.45);
        } else {
          this.playIceClink(0.55 + (activeLayerIndex === 4 ? 0.3 : 0));
        }
      }
      this.lastLayerIndex = activeLayerIndex;
    }
  }

  public playFlavorSwitch(flavorId: FlavorId): void {
    this.setFlavorProfile(flavorId);
    if (!this.enabled) {
      return;
    }
    this.playIceClink(0.8);
    window.setTimeout(() => {
      if (this.enabled) {
        this.playBubblePop(0.55);
      }
    }, 65);
  }

  public playMacroClick(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) {
      return;
    }
    this.playTactileSnap(0.5);
  }

  public playIceClink(intensity = 0.65): void {
    if (!this.enabled || !this.ctx || !this.masterGain) {
      return;
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.14;
    const partials = [2380, 3810, 5490, 7820];
    const decays = [0.17, 0.12, 0.085, 0.055];
    const gains = [0.16, 0.11, 0.065, 0.035];

    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(freq * jitter * 0.985, now + decays[idx]);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gains[idx] * intensity, now + 0.0018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + decays[idx] + 0.02);
    });
  }

  private playBubblePop(intensity = 0.35): void {
    if (!this.enabled || !this.ctx || !this.masterGain) {
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const startFreq = 320 + Math.random() * 340;
    const endFreq = startFreq * (2.3 + Math.random() * 0.9);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.048);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09 * intensity, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  private playTactileSnap(intensity = 0.5): void {
    if (!this.enabled || !this.ctx || !this.masterGain) {
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.032);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14 * intensity, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public dispose(): void {
    this.disable();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

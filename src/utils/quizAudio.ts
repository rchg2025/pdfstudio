/**
 * Web Audio procedural background music generator & UI sound effects
 * 100% offline, zero external dependencies, CORS-free, works inside LMS iframes & mobile browsers.
 */

export type MusicTrack = 'none' | 'lofi' | 'piano' | 'ambient' | 'custom';

class QuizAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: any = null;
  private ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private masterGain: GainNode | null = null;
  private volume = 0.55;
  private currentTrack: MusicTrack = 'none';
  private customAudioEl: HTMLAudioElement | null = null;

  public async initContext(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    } catch (e) {
      console.warn('AudioContext init error:', e);
      return false;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.customAudioEl) {
      this.customAudioEl.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public async startMusic(track: MusicTrack, customUrl?: string) {
    this.stopMusic();
    if (track === 'none') return;

    if (track === 'custom') {
      if (!customUrl || !customUrl.trim()) return;
      this.currentTrack = 'custom';
      this.isPlaying = true;
      try {
        let directUrl = customUrl.trim();
        if (directUrl.includes('drive.google.com') || directUrl.includes('docs.google.com')) {
          if (directUrl.includes('/file/d/')) {
            const match = directUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              directUrl = `https://docs.google.com/uc?export=download&id=${match[1]}`;
            }
          }
        }
        this.customAudioEl = new Audio(directUrl);
        this.customAudioEl.loop = true;
        this.customAudioEl.volume = this.volume;
        await this.customAudioEl.play();
      } catch (err) {
        console.warn('Custom audio playback error, fallback to procedural ambient:', err);
        this.playAmbientLoop();
      }
      return;
    }

    await this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentTrack = track;
    this.isPlaying = true;

    if (track === 'lofi') {
      this.playLofiLoop();
    } else if (track === 'piano') {
      this.playPianoLoop();
    } else if (track === 'ambient') {
      this.playAmbientLoop();
    }
  }

  public stopMusic() {
    this.isPlaying = false;
    this.currentTrack = 'none';
    if (this.customAudioEl) {
      try {
        this.customAudioEl.pause();
        this.customAudioEl.currentTime = 0;
        this.customAudioEl = null;
      } catch {}
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Dừng các node ambient nếu có
    if (this.ambientNodes.length > 0) {
      this.ambientNodes.forEach(({ osc, gain }) => {
        try {
          if (this.ctx) {
            gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
            setTimeout(() => {
              try { osc.stop(); osc.disconnect(); } catch {}
            }, 600);
          } else {
            osc.stop();
          }
        } catch {}
      });
      this.ambientNodes = [];
    }
  }

  public isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): MusicTrack {
    return this.currentTrack;
  }

  // 1. Nhạc Lofi Hip-Hop Chill (Cm9 - Fm9 - Bb13 - Ebmaj7)
  private playLofiLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const chords = [
      [130.81, 155.56, 196.00, 233.08, 293.66], // C, Eb, G, Bb, D
      [174.61, 207.65, 261.63, 311.13, 392.00], // F, Ab, C, Eb, G
      [116.54, 146.83, 174.61, 233.08, 293.66], // Bb, D, F, Bb, D
      [155.56, 196.00, 233.08, 293.66, 349.23], // Eb, G, Bb, D, F
    ];

    let chordIdx = 0;
    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, this.ctx.currentTime);

        const startTime = this.ctx.currentTime;
        const duration = 3.6;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.15 + (i * 0.04));
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime + (i * 0.04));
        osc.stop(startTime + duration + 0.2);
      });

      this.timerId = setTimeout(tick, 3500);
    };

    tick();
  }

  // 2. Nhạc Piano Thư Giãn (Pentatonic C / Am)
  private playPianoLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const n1 = notes[Math.floor(Math.random() * notes.length)];
      const n2 = notes[Math.floor(Math.random() * notes.length)];

      [n1, n2].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const startTime = this.ctx.currentTime + (idx * 0.25);
        const duration = 2.8;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      });

      const nextDelay = 1800 + Math.random() * 1200;
      this.timerId = setTimeout(tick, nextDelay);
    };

    tick();
  }

  // 3. Âm Hưởng Ambient Tự Nhiên (Smooth Pad Crossfade)
  private playAmbientLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const notes = [130.81, 196.00, 261.63, 329.63, 392.00]; // C Major Pad
    const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 2.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      nodes.push({ osc, gain });
    });

    this.ambientNodes = nodes;

    // Lặp chu kỳ thay đổi nhẹ nhàng
    const breathe = () => {
      if (!this.isPlaying || !this.ctx) return;
      nodes.forEach(({ gain }, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const target = 0.08 + Math.random() * 0.12;
        gain.gain.linearRampToValueAtTime(target, now + 3 + idx * 0.5);
      });
      this.timerId = setTimeout(breathe, 4000);
    };
    breathe();
  }

  // === HIỆU ỨNG ÂM THANH TƯƠNG TÁC (SOUND EFFECTS) ===

  // Âm thanh bấm chọn phương án (Crisp Pop / Chime)
  public async playClickSound() {
    try {
      await this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  // Âm thanh chuyển câu hỏi (Soft Tick / Swoosh)
  public async playNavSound() {
    try {
      await this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  // Âm thanh hoàn thành nộp bài / Chúc mừng (Fanfare Chime)
  public async playSuccessSound() {
    try {
      await this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.1));

        const start = this.ctx.currentTime + (idx * 0.1);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {}
  }

  // Thử âm thanh kiểm tra loa
  public async testSound(): Promise<boolean> {
    const ok = await this.initContext();
    if (!ok) return false;
    await this.playClickSound();
    setTimeout(() => this.playNavSound(), 120);
    return true;
  }
}

export const quizAudio = new QuizAudioEngine();

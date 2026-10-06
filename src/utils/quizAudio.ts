/**
 * Web Audio procedural background music generator & UI sound effects
 * 100% offline, zero external dependencies, CORS-free, works inside LMS iframes.
 */

class QuizAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: any = null;
  private masterGain: GainNode | null = null;
  private volume = 0.25;
  private currentTrack: 'none' | 'lofi' | 'piano' | 'ambient' = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume() {
    return this.volume;
  }

  public startMusic(track: 'none' | 'lofi' | 'piano' | 'ambient') {
    this.stopMusic();
    if (track === 'none') return;

    this.initContext();
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
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isMusicPlaying() {
    return this.isPlaying;
  }

  public getCurrentTrack() {
    return this.currentTrack;
  }

  // Chords for Lofi (Cm9 - Fm9 - Bb13 - Ebmaj7)
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

      // Play soft electric piano sound
      chord.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, this.ctx.currentTime);

        const startTime = this.ctx.currentTime;
        const duration = 3.6;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.15 + (i * 0.04));
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

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

  // Chords for Gentle Piano
  private playPianoLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Calming pentatonic notes in C major / A minor
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      // Pick 2 harmonious notes
      const n1 = notes[Math.floor(Math.random() * notes.length)];
      const n2 = notes[Math.floor(Math.random() * notes.length)];

      [n1, n2].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const startTime = this.ctx.currentTime + (idx * 0.3);
        const duration = 2.4;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

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

  // Soft Ambient Pad
  private playAmbientLoop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const notes = [110, 164.81, 220, 277.18, 329.63]; // A minor pad

    notes.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
    });
  }

  // UI Sound Effects
  public playClickSound() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  public playSuccessSound() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.08));

        const start = this.ctx.currentTime + (idx * 0.08);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {}
  }
}

export const quizAudio = new QuizAudioEngine();

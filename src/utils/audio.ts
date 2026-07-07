/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a simple retro synth tone
  playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    try {
      const audioCtx = this.getContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Web Audio API not supported or user gesture needed:', e);
    }
  }

  // Click / Reel Tick
  playClick() {
    this.playTone(600, 'sine', 0.05, 0.05);
  }

  // Coin drop sound
  playCoin() {
    this.playTone(987.77, 'sine', 0.1, 0.08);
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.15, 0.08);
    }, 70);
  }

  // Card slide sound
  playCard() {
    try {
      const audioCtx = this.getContext();
      const bufferSize = audioCtx.sampleRate * 0.1;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      whiteNoise.start();
    } catch (e) {
      this.playTone(150, 'triangle', 0.1, 0.1);
    }
  }

  // Dice roll shaker
  playDice() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(200 + Math.random() * 100, 'triangle', 0.05, 0.08);
      }, i * 60);
    }
  }

  // Prize wheel continuous ticking
  playWheelTick(index: number = 0) {
    this.playTone(400 - (index % 8) * 15, 'sine', 0.02, 0.03);
  }

  // Scratch card friction sound
  playScratch() {
    this.playTone(120 + Math.random() * 80, 'triangle', 0.04, 0.06);
  }

  // Golden jackpot fanfare on winning
  playWinFanfare() {
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpeggio
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.3, 0.12);
      }, idx * 100);
    });
  }

  // Loss beep
  playLose() {
    this.playTone(220, 'sawtooth', 0.2, 0.08);
    setTimeout(() => {
      this.playTone(147, 'sawtooth', 0.4, 0.08);
    }, 180);
  }
}

export const sounds = new SoundEngine();
export default sounds;

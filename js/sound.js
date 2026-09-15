/* ═══════════════════════════════════════════════════════════
   UNIMALL — SOUND & MICRO-HAPTIC ENGINE (js/sound.js)
   Zero-asset, pure Web Audio API synthesizer for tactile UI feel.
   ═══════════════════════════════════════════════════════════ */

'use strict';

window.UniMallSound = (function () {
  let ctx = null;

  function isSoundEnabled() {
    return localStorage.getItem('unimall_sound_enabled') !== 'false';
  }

  function getContext() {
    if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  return {
    isEnabled() {
      return isSoundEnabled();
    },

    toggle(enable) {
      localStorage.setItem('unimall_sound_enabled', enable ? 'true' : 'false');
    },

    playPop(pitchMultiplier = 1) {
      this.play('pop', pitchMultiplier);
    },

    playTap(freq = 240) {
      this.play('tap', freq);
    },

    playSuccess() {
      this.play('success');
    },

    playPing() {
      this.play('ping');
    },

    play(type = 'pop', opt = 1) {
      if (!isSoundEnabled()) return;
      try {
        const audio = getContext();
        if (!audio) return;

        const now = audio.currentTime;

        if (type === 'pop') {
          // Soft, tactile bubble pop for adding items & button taps
          const mult = typeof opt === 'number' ? opt : 1;
          const osc = audio.createOscillator();
          const gain = audio.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(420 * mult, now);
          osc.frequency.exponentialRampToValueAtTime(840 * mult, now + 0.04);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          osc.connect(gain);
          gain.connect(audio.destination);

          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'success') {
          // Dual-chord celebratory chime for placing orders & promo codes
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = audio.createOscillator();
            const gain = audio.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.065);

            gain.gain.setValueAtTime(0.08, now + i * 0.065);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.38);

            osc.connect(gain);
            gain.connect(audio.destination);

            osc.start(now + i * 0.065);
            osc.stop(now + i * 0.065 + 0.40);
          });
        } else if (type === 'tap') {
          // Ultra-subtle wooden micro-tap for tabs, chips & toggles
          const baseFreq = typeof opt === 'number' ? opt : 240;
          const osc = audio.createOscillator();
          const gain = audio.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.025);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          osc.connect(gain);
          gain.connect(audio.destination);

          osc.start(now);
          osc.stop(now + 0.03);
        } else if (type === 'ping') {
          // Glass ping for notifications & connectivity changes
          const osc = audio.createOscillator();
          const gain = audio.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(audio.destination);

          osc.start(now);
          osc.stop(now + 0.24);
        }
      } catch (e) {
        // Audio policy or silent failure
      }
    }
  };
})();

// Provide convenient global alias
window.soundFX = window.UniMallSound;

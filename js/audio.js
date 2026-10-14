/**
 * Audio.js - Web Audio API Synthesizer for DNF Arcade Action SFX & Heavy Metal BGM
 */

const SoundEngine = (() => {
    let ctx = null;
    let bgmOsc = null;
    let bgmGain = null;
    let isBgmPlaying = false;

    function init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            ctx = new AudioContext();
        }
    }

    function ensureContext() {
        if (!ctx) init();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    function playTone(freq, type, duration, startGain = 0.3, endGain = 0.01) {
        ensureContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(startGain, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endGain, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    function playSlashSound() {
        ensureContext();
        if (!ctx) return;
        playTone(320, 'sawtooth', 0.1, 0.4, 0.01);
    }

    function playLaunchSound() {
        ensureContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.25);

            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    }

    function playGhostSlashSound() {
        ensureContext();
        if (!ctx) return;
        playTone(90, 'square', 0.4, 0.6, 0.01);
    }

    function playWaveSound() {
        ensureContext();
        if (!ctx) return;
        playTone(220, 'sawtooth', 0.3, 0.5, 0.01);
    }

    function playDashSound() {
        ensureContext();
        if (!ctx) return;
        playTone(450, 'sine', 0.12, 0.3, 0.01);
    }

    function playHitSound() {
        ensureContext();
        if (!ctx) return;
        playTone(110, 'square', 0.1, 0.5, 0.01);
    }

    function playCoinSound() {
        ensureContext();
        if (!ctx) return;
        playTone(987.77, 'sine', 0.15, 0.25, 0.01);
    }

    function playLevelUpSound() {
        ensureContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                playTone(freq, 'triangle', 0.2, 0.3, 0.01);
            }, idx * 90);
        });
    }

    function startBGM() {
        ensureContext();
        if (!ctx || isBgmPlaying) return;

        try {
            isBgmPlaying = true;
            // Synth heavy metal bass beat sequence
            bgmOsc = ctx.createOscillator();
            bgmGain = ctx.createGain();

            bgmOsc.type = 'sawtooth';
            bgmOsc.frequency.setValueAtTime(110, ctx.currentTime); // Low A

            bgmGain.gain.setValueAtTime(0.08, ctx.currentTime);

            bgmOsc.connect(bgmGain);
            bgmGain.connect(ctx.destination);

            bgmOsc.start();
        } catch (e) {
            console.warn("BGM start error:", e);
        }
    }

    function stopBGM() {
        if (bgmOsc) {
            try {
                bgmOsc.stop();
                bgmOsc.disconnect();
            } catch (e) {}
            bgmOsc = null;
        }
        isBgmPlaying = false;
    }

    return {
        init,
        playSlashSound,
        playLaunchSound,
        playGhostSlashSound,
        playWaveSound,
        playDashSound,
        playHitSound,
        playCoinSound,
        playLevelUpSound,
        startBGM,
        stopBGM
    };
})();

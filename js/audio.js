/**
 * Audio.js - Procedural Sound Effects & Music Generator using Web Audio API
 */

const SoundEngine = (() => {
    let ctx = null;
    let bgmOscillator = null;
    let bgmGain = null;
    let isMuted = false;
    let bgmTimer = null;

    function init() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioCtx();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    function playTone(freq, duration, type = 'sine', startGain = 0.3, endGain = 0.001) {
        if (!ctx || isMuted) return;
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
            console.error(e);
        }
    }

    function playSlashSound() {
        if (!ctx || isMuted) return;
        init();
        // White noise slash effect
        const bufferSize = ctx.sampleRate * 0.12; // 120ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    }

    function playHitSound() {
        if (!ctx || isMuted) return;
        init();
        playTone(150, 0.15, 'sawtooth', 0.4, 0.01);
    }

    function playSpellSound() {
        if (!ctx || isMuted) return;
        init();
        // Sweeping fire frequency
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch (e) {}
    }

    function playDashSound() {
        if (!ctx || isMuted) return;
        init();
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
    }

    function playCoinSound() {
        if (!ctx || isMuted) return;
        init();
        playTone(987.77, 0.08, 'sine', 0.25, 0.01); // B5
        setTimeout(() => {
            playTone(1318.51, 0.15, 'sine', 0.25, 0.01); // E6
        }, 80);
    }

    function playLevelUpSound() {
        if (!ctx || isMuted) return;
        init();
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
        notes.forEach((freq, index) => {
            setTimeout(() => {
                playTone(freq, 0.2, 'triangle', 0.3, 0.01);
            }, index * 70);
        });
    }

    function startBGM() {
        if (!ctx) init();
        if (bgmTimer) clearInterval(bgmTimer);

        // Simple ambient dungeon melody generator
        const scale = [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63]; // D minor pentatonic/aeolian
        let noteIdx = 0;

        bgmTimer = setInterval(() => {
            if (isMuted) return;
            const freq = scale[Math.floor(Math.random() * scale.length)];
            playTone(freq, 0.8, 'sine', 0.06, 0.001);
        }, 600);
    }

    function stopBGM() {
        if (bgmTimer) {
            clearInterval(bgmTimer);
            bgmTimer = null;
        }
    }

    return {
        init,
        playSlashSound,
        playHitSound,
        playSpellSound,
        playDashSound,
        playCoinSound,
        playLevelUpSound,
        startBGM,
        stopBGM
    };
})();

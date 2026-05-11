let audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    return window.AudioContext || window.webkitAudioContext || null;
}

export function initAudio() {
    try {
        if (!audioCtx) {
            const AudioContextCtor = getAudioContext();
            if (!AudioContextCtor) return null;
            audioCtx = new AudioContextCtor();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    } catch {
        return null;
    }
}

function getReadyContext() {
    if (!audioCtx || audioCtx.state === 'suspended') return null;
    return audioCtx;
}

function playTone({ type = 'sine', frequency = 440, duration = 0.08, gain = 0.08, start = 0, endFrequency = null }) {
    try {
        const ctx = getReadyContext();
        if (!ctx) return;

        const now = ctx.currentTime + start;
        const oscillator = ctx.createOscillator();
        const volume = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        if (endFrequency !== null) {
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
        }

        volume.gain.setValueAtTime(0.0001, now);
        volume.gain.exponentialRampToValueAtTime(gain, now + 0.01);
        volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(volume);
        volume.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    } catch {
        // Audio should never interrupt gameplay.
    }
}

function playNoise({ duration = 0.15, gain = 0.08 }) {
    try {
        const ctx = getReadyContext();
        if (!ctx) return;

        const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const decay = 1 - i / length;
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const source = ctx.createBufferSource();
        const volume = ctx.createGain();
        const now = ctx.currentTime;

        volume.gain.setValueAtTime(gain, now);
        volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.buffer = buffer;
        source.connect(volume);
        volume.connect(ctx.destination);
        source.start(now);
        source.stop(now + duration + 0.02);
    } catch {
        // Audio should never interrupt gameplay.
    }
}

function playSequence(notes, noteDuration, gap = 0.025, gain = 0.075) {
    notes.forEach((frequency, index) => {
        playTone({
            type: 'sine',
            frequency,
            duration: noteDuration,
            gain,
            start: index * (noteDuration + gap),
        });
    });
}

export function playJump() {
    playTone({ type: 'sine', frequency: 440, duration: 0.08, gain: 0.055 });
}

export function playCorn() {
    playTone({ type: 'sine', frequency: 880, duration: 0.06, gain: 0.075 });
}

export function playHit() {
    playNoise({ duration: 0.15, gain: 0.11 });
}

export function playShieldOn() {
    playTone({ type: 'triangle', frequency: 300, endFrequency: 600, duration: 0.12, gain: 0.07 });
}

export function playShieldBreak() {
    playTone({ type: 'sawtooth', frequency: 400, endFrequency: 100, duration: 0.2, gain: 0.075 });
}

export function playStageClear() {
    playSequence([523.25, 659.25, 783.99], 0.08, 0.025, 0.07);
}

export function playVictory() {
    playSequence([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.1, 0.03, 0.07);
}

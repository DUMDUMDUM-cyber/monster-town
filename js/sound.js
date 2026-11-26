// Voices (the tablet's own English speech), sound effects and soft music.
// Everything is generated in code: no audio files to download or license.

// ---------- Speech ----------
const VOICE = {
  moko: { pitch: 1.15, rate: 0.88 },
  gumi: { pitch: 1.6, rate: 0.95 },
  tobi: { pitch: 0.75, rate: 0.82 },
};
const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Ana',
  'Microsoft Zira', 'Karen', 'Moira', 'Tessa', 'Google UK English Female', 'Serena', 'Daniel'];

let voice = null;
let speaking = false;
const listeners = [];

function chooseVoice() {
  if (!('speechSynthesis' in window)) return null;
  const all = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang) || v.lang === 'en');
  if (!all.length) return null;
  for (const name of PREFERRED) {
    const v = all.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return all.find((v) => /en[-_]US/i.test(v.lang)) || all[0];
}

if ('speechSynthesis' in window) {
  voice = chooseVoice();
  speechSynthesis.addEventListener?.('voiceschanged', () => { voice = chooseVoice(); });
}

export const voiceName = () => (voice ? `${voice.name} (${voice.lang})` : null);
export const isSpeaking = () => speaking;
export const onSpeech = (fn) => listeners.push(fn);
const emit = (state, who) => listeners.forEach((fn) => fn(state, who));

// Every stopSpeech() starts a new "generation": anything said before it is cut off, its
// promise ends at once, and if a speech engine still starts it late, it is cancelled again.
let gen = 0;
const pending = new Set();
export function stopSpeech() {
  gen++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  for (const f of [...pending]) f();
}

export function say(text, who = 'moko') {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      setTimeout(resolve, 400 + text.length * 40);
      return;
    }
    if (!voice) voice = chooseVoice();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = 'en-US';
    }
    const p = VOICE[who] || VOICE.moko;
    u.pitch = p.pitch;
    u.rate = p.rate;
    u.volume = 1;
    let done = false;
    const mine = gen;
    const finish = () => {
      if (done) return;
      done = true;
      pending.delete(finish);
      clearTimeout(timer);
      speaking = false;
      duck(false);
      emit('end', who);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    u.onstart = () => { if (mine !== gen || done) speechSynthesis.cancel(); };
    pending.add(finish);
    const timer = setTimeout(finish, 1800 + text.length * 120);
    speaking = true;
    duck(true);
    emit('start', who);
    speechSynthesis.speak(u);
  });
}

// ---------- Audio engine ----------
let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.6;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  // A silent utterance unlocks speech on iOS.
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) {
    ctx.suspend();
    stopSpeech();
  } else ctx.resume();
});

function tone(freq, dur, { type = 'sine', vol = 0.3, when = 0, to = null, attack = 0.005 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur, { when = 0, vol = 0.3, filter = 'bandpass', freq = 1500, q = 1 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  pop: () => tone(520, 0.12, { to: 980, vol: 0.35 }),
  ting: () => {
    tone(1318, 0.6, { vol: 0.25 });
    tone(1760, 0.7, { vol: 0.18, when: 0.08 });
  },
  click: () => {
    tone(180, 0.06, { type: 'square', vol: 0.15 });
    noise(0.05, { vol: 0.25, freq: 3000 });
  },
  boop: () => tone(330, 0.25, { to: 210, vol: 0.25, type: 'triangle' }),
  giggle: () => [0, 0.09, 0.18, 0.27].forEach((w, i) => tone(900 + i * 120, 0.08, { when: w, to: 1300 + i * 100, vol: 0.18 })),
  yay: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, { when: i * 0.09, type: 'triangle', vol: 0.25 })),
  clap: () => {
    for (let i = 0; i < 14; i++) noise(0.07, { when: i * 0.11 + Math.random() * 0.05, vol: 0.35, freq: 1400 + Math.random() * 600, q: 0.8 });
  },
  whoosh: () => noise(0.35, { vol: 0.2, filter: 'highpass', freq: 1200 }),
  choo: () => {
    tone(740, 0.5, { type: 'triangle', vol: 0.18, attack: 0.05 });
    tone(880, 0.5, { type: 'triangle', vol: 0.14, attack: 0.05 });
    for (let i = 0; i < 6; i++) noise(0.14, { when: 0.5 + i * 0.28, vol: 0.28, filter: 'lowpass', freq: 900 });
  },
  rotate: () => tone(700, 0.08, { to: 500, vol: 0.2, type: 'triangle' }),
};

// ---------- Music: a gentle generated loop ----------
let musicOn = false;
let musicTimer = null;
let nextTime = 0;
let step = 0;
const BPM = 96;
const STEP = 60 / BPM / 2; // eighth notes
const C = 261.63;
const f = (semi) => C * Math.pow(2, semi / 12);
// Pentatonic phrases (semitones from middle C, null = rest), 16 steps each.
const PHRASES = [
  [12, null, 9, null, 7, null, 9, 12, 14, null, 12, null, 9, null, null, null],
  [7, null, 9, null, 12, null, 9, null, 7, 4, null, 2, 4, null, null, null],
  [12, null, 14, null, 16, null, 14, 12, 9, null, 12, null, 14, null, null, null],
  [9, null, 7, null, 4, null, 7, null, 2, null, 4, null, 0, null, null, null],
];
const BASS = [0, 0, 5, 7]; // C, C, F, G per phrase

function musicNote(freq, when, dur, vol, type) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(musicBus);
  o.start(when);
  o.stop(when + dur + 0.05);
}

function schedule() {
  while (nextTime < ctx.currentTime + 0.4) {
    const phrase = Math.floor(step / 16) % PHRASES.length;
    const s = step % 16;
    const n = PHRASES[phrase][s];
    if (n != null) musicNote(f(n), nextTime, STEP * 1.8, 0.09, 'triangle');
    if (s % 4 === 0) musicNote(f(BASS[phrase] - 12), nextTime, STEP * 3.5, 0.08, 'sine');
    nextTime += STEP;
    step++;
  }
}

function duck(on) {
  if (!ctx || !musicOn) return;
  musicBus.gain.setTargetAtTime(on ? 0.12 : 0.45, ctx.currentTime, 0.15);
}

export function setMusic(on) {
  if (!ctx) return;
  musicOn = on;
  if (on) {
    if (!musicTimer) {
      nextTime = ctx.currentTime + 0.1;
      musicTimer = setInterval(schedule, 100);
    }
    musicBus.gain.setTargetAtTime(speaking ? 0.12 : 0.45, ctx.currentTime, 0.3);
  } else {
    musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

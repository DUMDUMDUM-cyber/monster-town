// Activities: short moves that make Moko, Gumi and Tobi feel alive (DESAIN.md section 11,
// "Karakter lebih hidup"). Each activity is a class "do-<name>" on the .char element; the
// keyframes are in style.css and move only the rig parts made in art.js (transform and
// opacity only). Props come from art.js propParts().
import { propParts } from './art.js';
import { pick, toStage } from './util.js';

// name: [length in ms, keep the last frame after it ends]
const ACTS = {
  // run and jump
  jog: [2400], runin: [1000], runout: [900, true], hjump: [1300], flip: [1500], roll: [2000],
  // play alone
  kick: [2200], yoyo: [2600], bubbles: [3000], water: [3000],
  // funny reactions
  surprised: [1300], laugh: [2400], sneeze: [1800], yawn: [2000], doze: [0, true], look: [1600],
  // signature moves
  dance: [3000], jelly: [2600], spinrun: [2800],
};
export const ACT_NAMES = Object.keys(ACTS);
export const SIGN = { moko: 'dance', gumi: 'jelly', tobi: 'spinrun' };
export const actMs = (name) => (ACTS[name] ? ACTS[name][0] : 0);

const SLOT = { hand: '.att-hand-r', body: '.c-prop-b', ground: '.c-prop-g' };
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Stop whatever the character is doing and put it back at rest.
export function stopAct(el) {
  if (!el || !el._act) return;
  const { name, done } = el._act;
  el._act = null;
  clearTimeout(el._actT);
  el.classList.remove('doing', 'do-' + name);
  const svg = el.querySelector('.char-svg');
  if (svg) {
    svg.querySelectorAll('.prop').forEach((p) => p.remove());
    svg.style.removeProperty('--dx');
  }
  done();
}

export const actName = (el) => (el && el._act ? el._act.name : '');
export const isIdleAct = (el) => !!(el && el._act && el._act.idle);

// Play one activity. Resolves when it ends (or is stopped).
// opts.idle: started by the idle timer, so speech may stop it. opts.dx: run distance in px
// (on stage) for runin/runout; use offLeft(el) to run to/from the left edge.
export function act(el, name, { idle = false, dx } = {}) {
  if (!el || !el.isConnected || !ACTS[name]) return Promise.resolve();
  stopAct(el);
  if (reduced()) return Promise.resolve();
  const svg = el.querySelector('.char-svg');
  if (!svg) return Promise.resolve();
  const who = el.dataset.who || (svg.className.baseVal.match(/cs-(\w+)/) || [])[1];
  const parts = propParts(name, who);
  for (const [slot, markup] of Object.entries(parts)) {
    const host = svg.querySelector(SLOT[slot]);
    if (host) host.insertAdjacentHTML('beforeend', `<g class="prop">${markup}</g>`);
  }
  if (dx != null) svg.style.setProperty('--dx', ((dx * 200) / (el.offsetWidth || 200)).toFixed(0) + 'px');
  const [ms, hold] = ACTS[name];
  return new Promise((resolve) => {
    el._act = { name, idle, done: resolve };
    void el.offsetWidth;
    el.classList.add('doing', 'do-' + name);
    if (!ms) return;
    el._actT = setTimeout(() => {
      if (!hold) stopAct(el);
      else resolve();
    }, ms);
  });
}

// Distance (stage px) that takes the character just past the left edge of the stage.
export function offLeft(el) {
  const r = el.getBoundingClientRect();
  const left = toStage(r.left, r.top).x;
  return -(left + el.offsetWidth + 40);
}

// Random choices. Signature moves come up more often for their own character.
const IDLE = ['jog', 'hjump', 'flip', 'roll', 'kick', 'yoyo', 'bubbles', 'water', 'sneeze', 'yawn', 'look'];
let lastIdle = '';
export function idleAct(who) {
  let n;
  do n = Math.random() < 0.25 ? SIGN[who] : pick(IDLE);
  while (n === lastIdle);
  lastIdle = n;
  return n;
}
export const cheerAct = (who) => pick(['hjump', 'flip', 'jog', SIGN[who]]);
export const tapAct = () => pick(['laugh', 'hjump', 'look']);

// Every 6-12 s, one of the characters (still on screen and not busy) does something,
// when ok() says it is a good moment. Returns a stop function.
export function idleLoop(els, ok, min = 6000, max = 12000) {
  let t = 0;
  const wait = () => min + Math.random() * (max - min);
  const tick = () => {
    const live = els.filter((e) => e.isConnected);
    if (!live.length) return;
    let next = wait();
    const free = live.filter((e) => !e._act && e.style.display !== 'none');
    if (free.length && ok()) {
      const el = pick(free);
      const n = idleAct(el.dataset.who);
      act(el, n, { idle: true });
      next += actMs(n);
    }
    t = setTimeout(tick, next);
  };
  t = setTimeout(tick, wait() * 0.6);
  return () => clearTimeout(t);
}

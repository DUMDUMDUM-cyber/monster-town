// Everything the game remembers lives only on this tablet (localStorage).
import { todayKey } from './util.js';

const KEY = 'monsterland.v1';
const DEFAULTS = {
  name: '',
  music: true,
  limit: 0, // minutes per day, 0 = no limit
  levels: {},
  plays: {},
  topic: 0,
  found: [],
  wear: {},
  day: '',
  secs: 0,
};

// Bump when the level content changes so much that saved levels no longer fit.
// 2 = harder levels (DESAIN.md 7.6): everyone starts again at level 2, once.
const LEVELS_VERSION = 2;

let data = load();

function load() {
  let d;
  try {
    d = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (_) {
    d = { ...DEFAULTS };
  }
  if (d.levelsVersion !== LEVELS_VERSION) {
    d.levels = {};
    d.levelsVersion = LEVELS_VERSION;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { /* keep playing */ }
  }
  return d;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (_) {
    /* storage full or blocked: keep playing anyway */
  }
}

export const get = (k) => data[k];
export function set(k, v) {
  data[k] = v;
  save();
}

export const START_LEVEL = 2;
export const level = (id) => data.levels[id] || START_LEVEL;
export function setLevel(id, v) {
  data.levels = { ...data.levels, [id]: Math.max(1, Math.min(5, v)) };
  save();
}
export const plays = (id) => data.plays[id] || 0;
export function addPlay(id) {
  data.plays = { ...data.plays, [id]: plays(id) + 1 };
  save();
}

export function nextTopic(count) {
  const t = data.topic % count;
  data.topic = (data.topic + 1) % count;
  save();
  return t;
}

function rollDay() {
  const k = todayKey();
  if (data.day !== k) {
    data.day = k;
    data.secs = 0;
    save();
  }
}

export function secondsToday() {
  rollDay();
  return data.secs;
}

let unsaved = 0;
export function addSecond() {
  rollDay();
  data.secs += 1;
  if (++unsaved >= 10) {
    unsaved = 0;
    save();
  }
}

export function resetToday() {
  rollDay();
  data.secs = 0;
  save();
}

export function timeIsUp() {
  const lim = data.limit || 0;
  return lim > 0 && secondsToday() >= lim * 60;
}

// Accessories (DESAIN.md 8.1): which ones were found, and what each character wears
// ({ moko: { head: 'crown', eyes: null, ... } }).
export const found = () => data.found || [];
export function addFound(id) {
  if (found().includes(id)) return;
  data.found = [...found(), id];
  save();
}
export const wearing = (who) => ({ ...((data.wear || {})[who] || {}) });
export const wornIds = (who) => Object.values(wearing(who)).filter((id) => id && found().includes(id));
export function setWear(who, slot, id) {
  const w = wearing(who);
  w[slot] = id || null;
  data.wear = { ...(data.wear || {}), [who]: w };
  save();
}

export function resetProgress() {
  data.levels = {};
  data.plays = {};
  data.topic = 0;
  save();
}

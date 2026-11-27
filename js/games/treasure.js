// Treasure hunt! — plan first, then Go (DESAIN.md 8.1). The character stands on the left, a
// chest on the right, and obstacles in between: gap → bridge, high cliff → spring, very wide
// gap → balloon, tall step → ramp. The child drags tools from the tray onto the obstacles and
// presses Go. The character stops with "Oops!" at the first missing or wrong tool (no hint).
// Levels: 1 gap + cliff, tools exact; 2 three obstacles (balloon and ramp appear);
// 3 three or four, sizes must fit (short/long bridge, small/big spring) with wrong sizes in
// the tray; 4 four, sizes, and a key on a high deck; 5 five, sizes, key on a very high deck.
import { h, pick, shuffle, sample, sleep, anim, placeAt, draggable } from '../util.js';
import { grad, lineOf, chestSVG } from '../art.js';
import { sfx } from '../sound.js';
import { act, stopAct, offLeft } from '../acts.js';
import { ACC, ACC_BY, accSVG } from '../acc.js';
import * as S from '../store.js';

// Everything sits high enough that the tray stays well above the bottom edge of phones.
const G = 470; // top of the sand path
const SAND = G + 132; // bottom of the sand
const CH_W = 92;
const CH_H = CH_W * 1.2;
const FOOT = CH_H * (233 / 240);
const START_X = 70;
const CHEST_X = 1124;
const PX0 = 130;
const PX1 = 1034;
const TRAY_TOP = SAND + 6; // keep in step with .tr-tray in style.css
const TRAY_FLOOR = TRAY_TOP + 86;

// Obstacle sizes (before squeezing them to fit the screen).
const BODY = { gap: { s: 100, l: 160 }, wide: 240, cliff: 110, step: 130, key: 120 };
const PRE = { gap: 84, wide: 84, cliff: 84, step: 124, key: 84 };
const CLIFF_H = { s: 120, l: 200 };
const STEP_H = 80;
const DECK = { s: 132, l: 206 }; // height of the key deck above the sand
const POWER = { s: 140, l: 215 }; // how high each spring throws
const SPRING = { s: [54, 46], l: [62, 82] };
const BALLOON = [70, 120];

const P = (c, w = 2.2) => `fill="${grad(c)}" stroke="${lineOf(c)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const L = (c, w = 2.2) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
// Shared soft gradients are links like url(#mlgRRGGBB); swap them for the plain colour.
const flat = (svg) => svg.replace(/url\(#ml[gu]([0-9a-fA-F]{6})\)/g, '#$1');
const box = (w, hh, inner) => `<svg viewBox="0 0 ${w} ${hh}" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${inner}</svg>`;

// ---------------------------------------------------------------- tool pictures
function bridgeArt(w) {
  let planks = '';
  for (let x = 14; x < w - 6; x += 16) planks += `<path d="M${x} 15 V27" ${L('#9A6A3E', 2)}/>`;
  return box(w, 34, `<path d="M5 3 V20 M${w - 5} 3 V20" ${L('#8A5A33', 5)}/><path d="M5 5 Q${w / 2} 16 ${w - 5} 5" ${L('#C9A27A', 3)}/>`
    + `<rect x="0" y="14" width="${w}" height="13" rx="4" ${P('#D6A26A', 2.2)}/>${planks}`);
}
function springArt(size) {
  const [w, hh] = SPRING[size];
  let coil = `M${w / 2} ${hh - 6}`;
  const n = size === 'l' ? 7 : 4;
  for (let i = 1; i <= n; i++) coil += ` L${i % 2 ? w - 10 : 10} ${hh - 6 - ((hh - 16) * i) / n}`;
  return box(w, hh, `<g class="spring-coil" style="transform-origin:${w / 2}px ${hh}px"><rect x="4" y="${hh - 7}" width="${w - 8}" height="7" rx="3" ${P('#8C92AA', 1.8)}/>`
    + `<path d="${coil}" ${L('#6E7390', 6)}/><path d="${coil}" ${L('#C9CEDF', 3)}/><rect x="0" y="2" width="${w}" height="10" rx="5" ${P('#EF476F', 2)}/></g>`);
}
function balloonArt() {
  const [w, hh] = BALLOON;
  const b = (x, y, c) => `<path d="M${x} ${y + 21} L${w / 2} ${hh - 12}" ${L('#8A6A4A', 1.6)}/><ellipse cx="${x}" cy="${y}" rx="17" ry="21" ${P(c, 2.2)}/><path d="M${x - 3} ${y + 20} l3 4 3 -4 z" fill="${lineOf(c)}"/><ellipse cx="${x - 6}" cy="${y - 8}" rx="4" ry="6" fill="#fff" opacity=".55"/>`;
  return box(w, hh, `${b(20, 30, '#3A86FF')}${b(50, 28, '#FFD166')}${b(35, 52, '#EF476F')}<rect x="${w / 2 - 14}" y="${hh - 14}" width="28" height="10" rx="5" ${P('#B07445', 2)}/>`);
}
function rampArt(w) {
  let lines = '';
  for (let k = 1; k < 4; k++) lines += `<path d="M${(w * k) / 4} ${STEP_H} L${(w * k) / 4} ${STEP_H - (STEP_H * k) / 4}" ${L('#B98A5A', 2)}/>`;
  return box(w, STEP_H, `<path d="M0 ${STEP_H} L${w} 2 L${w} ${STEP_H} Z" ${P('#E0B47A', 2.4)}/>${lines}<path d="M2 ${STEP_H - 2} L${w - 2} 4" ${L('#FFF0D0', 3)} opacity=".6"/>`);
}
const keyArt = () => box(56, 30, `<circle cx="13" cy="15" r="10" fill="none" stroke="${lineOf('#FFCF4D')}" stroke-width="8"/><circle cx="13" cy="15" r="10" fill="none" stroke="#FFCF4D" stroke-width="5"/><rect x="22" y="12" width="32" height="7" rx="3" ${P('#FFCF4D', 1.8)}/><rect x="40" y="18" width="6" height="9" rx="2" ${P('#FFCF4D', 1.6)}/><rect x="48" y="18" width="5" height="7" rx="2" ${P('#FFCF4D', 1.6)}/>`);

// ---------------------------------------------------------------- puzzle making
const reducedNow = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function terrain(n, L) {
  const pool = ['gap', 'gap', 'cliff', 'cliff', 'wide', 'step'];
  let kinds;
  if (L === 1) kinds = ['gap', 'cliff'];
  else if (L === 2) {
    const first = pick(['wide', 'step']);
    const rest = shuffle(['gap', 'cliff', first === 'wide' ? 'step' : 'wide']).slice(0, 2);
    kinds = [first, ...rest];
  } else kinds = sample(pool.map((k, i) => k + i), n).map((k) => k.replace(/\d+$/, ''));
  const sized = L >= 3;
  return shuffle(kinds).map((kind) => ({ kind, size: sized && (kind === 'gap' || kind === 'cliff') ? pick(['s', 'l']) : 's' }));
}

function makePuzzle(L, last) {
  for (let tries = 0; tries < 20; tries++) {
    let obs;
    if (L <= 2) obs = terrain(L === 1 ? 2 : 3, L);
    else if (L === 3) obs = terrain(pick([3, 4]), L);
    else obs = terrain(L === 4 ? 3 : 4, L);
    if (L >= 4) obs.splice(1 + Math.floor(Math.random() * obs.length), 0, { kind: 'key', size: L === 5 ? 'l' : pick(['s', 'l']) });
    const sig = obs.map((o) => o.kind + o.size).join();
    if (sig !== last) return { obs, sig };
  }
  return null;
}

const need = (ob) => (ob.kind === 'gap' ? { type: 'bridge', size: ob.size }
  : ob.kind === 'wide' ? { type: 'balloon' }
    : ob.kind === 'step' ? { type: 'ramp' }
      : { type: 'spring', size: ob.size });

function trayTools(obs, L) {
  const tools = obs.map(need);
  const has = (t) => tools.some((x) => x.type === t.type && x.size === t.size);
  const extra = [];
  if (L === 2) {
    const other = shuffle([{ type: 'bridge', size: 's' }, { type: 'spring', size: 's' }, { type: 'balloon' }, { type: 'ramp' }]).find((t) => !has(t));
    if (other) extra.push(other);
  } else if (L >= 3) {
    // Wrong sizes (bawaan): the other size of each sized tool.
    for (const t of shuffle(tools)) {
      if (!t.size) continue;
      const o = { type: t.type, size: t.size === 's' ? 'l' : 's' };
      if (!has(o) && !extra.some((x) => x.type === o.type && x.size === o.size)) extra.push(o);
    }
    extra.splice(2);
  }
  return shuffle([...tools, ...extra]);
}

// ---------------------------------------------------------------- the game
export default {
  id: 'treasure',
  title: 'Treasure',
  titleId: 'Harta Karun',
  card: '#FFE3B8',
  art: 'treasure',

  startRound(ctx) {
    ctx.setPlace('beach');
    const walker = ctx.makeChar(ctx.who, CH_W, 'tr-walker');
    ctx.area.append(walker);
    ctx.useChar(walker);
    ctx.round = { walker, last: '' };
  },

  question(ctx) {
    return chest(ctx);
  },
};

async function chest(ctx) {
  const LV = ctx.level;
  const R = ctx.round;
  const walker = R.walker;
  const made = makePuzzle(LV, R.last);
  R.last = made.sig;
  const obs = made.obs;

  // Lay the obstacles out from left to right, squeezed to fit.
  const width = (o) => PRE[o.kind] + (o.kind === 'gap' ? BODY.gap[o.size] : BODY[o.kind]);
  const total = obs.reduce((s, o) => s + width(o), 0) + 40;
  const f = Math.min(1, (PX1 - PX0) / total);
  const spare = Math.max(0, PX1 - PX0 - total) / (obs.length + 1);
  let x = PX0 + spare;
  for (const o of obs) {
    x += (PRE[o.kind] * f) + spare;
    o.x0 = x;
    o.w = (o.kind === 'gap' ? BODY.gap[o.size] : BODY[o.kind]) * f;
    o.x1 = x + o.w;
    o.h = o.kind === 'cliff' ? CLIFF_H[o.size] : o.kind === 'step' ? STEP_H : o.kind === 'key' ? DECK[o.size] : 0;
    x = o.x1;
  }
  const bridgeLen = (size) => BODY.gap[size] * f + 40;
  const rampW = 112 * f;

  // ---- scenery: sand path with holes (the sea shows through), cliffs, steps, the key deck
  const scene = h('div', { class: 'tr-scene' });
  const solid = [];
  let from = -20;
  for (const o of obs) {
    if (o.kind === 'gap' || o.kind === 'wide') { solid.push([from, o.x0]); from = o.x1; }
  }
  solid.push([from, 1220]);
  let art = solid.map(([a, b]) => `<path d="M${a} ${G + 4} Q${a} ${G - 2} ${a + 6} ${G - 2} H${b - 6} Q${b} ${G - 2} ${b} ${G + 4} V${SAND} H${a} Z" ${P('#F3D7A0', 3)}/>`
    + `<path d="M${a + 4} ${G + 10} H${b - 4}" ${L('#FFF2D6', 4)} opacity=".7"/>`).join('');
  for (let k = 0; k < 18; k++) {
    const sx = 30 + ((k * 211) % 1150);
    if (solid.some(([a, b]) => sx > a + 10 && sx < b - 10)) art += `<path d="M${sx} ${G + 52 + ((k * 37) % 60)} q5 -6 10 0" ${L('#D9B57A', 3)}/>`;
  }
  for (const o of obs) {
    if (o.kind === 'gap') {
      for (const rx of [o.x0 - 30, o.x1 + 30]) art += `<ellipse cx="${rx}" cy="${G - 5}" rx="8" ry="7" ${P('#AEB4C8', 2)}/>`;
    } else if (o.kind === 'cliff') {
      art += `<path d="M${o.x0} ${G + 6} V${G - o.h + 14} Q${o.x0} ${G - o.h} ${o.x0 + 14} ${G - o.h} H${o.x1 - 14} Q${o.x1} ${G - o.h} ${o.x1} ${G - o.h + 14} V${G + 6} Z" ${P('#C99C72', 3)}/>`
        + `<path d="M${o.x0 + 4} ${G - o.h + 4} H${o.x1 - 4}" ${L('#8CBE72', 8)}/><path d="M${o.x0 + 20} ${G - o.h + 40} l14 10 M${o.x1 - 30} ${G - o.h + 80} l10 14 M${o.x0 + 30} ${G - 40} l16 6" ${L('#A97E58', 3)}/>`;
    } else if (o.kind === 'step') {
      art += `<path d="M${o.x0} ${G + 6} V${G - o.h + 12} Q${o.x0} ${G - o.h} ${o.x0 + 12} ${G - o.h} H${o.x1 - 12} Q${o.x1} ${G - o.h} ${o.x1} ${G - o.h + 12} V${G + 6} Z" ${P('#E9C98E', 3)}/><path d="M${o.x0 + 8} ${G - o.h + 22} H${o.x1 - 8}" ${L('#D2AE70', 3)}/>`;
    } else if (o.kind === 'key') {
      const top = G - o.h;
      art += `<path d="M${o.x0 + 10} ${G} V${top + 10} M${o.x1 - 10} ${G} V${top + 10}" ${L('#9A6A3E', 7)}/>`
        + `<rect x="${o.x0 - 8}" y="${top}" width="${o.w + 16}" height="14" rx="5" ${P('#C08048', 2.4)}/>`;
    }
  }
  scene.append(h('div', { class: 'tr-ground', html: `<svg viewBox="0 0 1200 800" width="1200" height="800" aria-hidden="true">${art}</svg>` }));
  scene.append(h('div', { class: 'tr-tray' }));
  const chestEl = h('div', { class: 'tr-chest', style: { width: '150px', height: '90px' } });
  const keyOb = obs.find((o) => o.kind === 'key');
  // Flat colours (no links to shared gradients) and the shadow drawn in, so nothing depends on
  // effects that iOS Safari can lose.
  const drawChest = (open, locked) => {
    chestEl.innerHTML = flat(chestSVG({ open, locked }).replace('style="overflow:visible">', 'style="overflow:visible"><ellipse cx="100" cy="112" rx="66" ry="7" fill="#5A3E22" opacity=".22"/>'));
  };
  drawChest(false, !!keyOb);
  scene.append(chestEl);
  chestEl.style.left = CHEST_X - 75 + 'px';
  chestEl.style.top = G - 84 + 'px';
  let keyEl = null;
  const keyHome = () => {
    if (!keyEl) return;
    keyEl.style.left = (keyOb.x0 + keyOb.x1) / 2 - 28 + 'px';
    keyEl.style.top = G - keyOb.h - 40 + 'px';
    keyEl.style.opacity = '1';
    keyEl.firstChild.classList.add('bob');
  };
  if (keyOb) {
    keyEl = h('div', { class: 'tr-key', style: { width: '56px', height: '30px' } }, h('div', { class: 'tr-key-in bob', html: flat(keyArt()) }));
    scene.append(keyEl);
    keyHome();
  }
  const goBtn = h('button', { class: 'go-btn pop-in', 'aria-label': 'Go' }, 'Go!');
  scene.append(goBtn);
  if (R.scene) R.scene.remove();
  ctx.area.insertBefore(scene, walker);
  R.scene = scene;

  // ---- drop spots: one per obstacle
  // Each spot has a dashed box that shows while a tool is dragged (and faintly while empty).
  const slots = obs.map((o) => {
    const gapLike = o.kind === 'gap' || o.kind === 'wide';
    const box = gapLike
      ? { x0: o.x0 - 12, x1: o.x1 + 12, y0: G - 78, y1: G + 26 }
      : { x0: o.x0 - 118, x1: o.x0 + 4, y0: G - 128, y1: G + 6 };
    const mark = h('div', { class: 'tr-slot' });
    Object.assign(mark.style, { left: box.x0 + 'px', top: box.y0 + 'px', width: box.x1 - box.x0 + 'px', height: box.y1 - box.y0 + 'px' });
    scene.append(mark);
    return { ob: o, tool: null, box, mark, x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 };
  });
  // The spot for a drop at c: inside a box (with a wide margin), else the nearest one close by.
  const slotAt = (c) => {
    let best = null;
    let bd = Infinity;
    for (const s of slots) {
      const dx = Math.max(s.box.x0 - c.x, 0, c.x - s.box.x1);
      const dy = Math.max(s.box.y0 - c.y, 0, c.y - s.box.y1);
      const d = Math.hypot(dx, dy) + Math.hypot(s.x - c.x, s.y - c.y) * 0.01;
      if (d < bd) { bd = d; best = s; }
    }
    return bd <= 110 ? best : null;
  };
  const markSlots = (hot) => {
    for (const s of slots) {
      s.mark.classList.toggle('filled', !!s.tool);
      s.mark.classList.toggle('hot', s === hot);
    }
  };

  // ---- tools in the tray
  const tools = trayTools(obs, LV).map((t) => {
    let w;
    let hh;
    let artHtml;
    if (t.type === 'bridge') { w = bridgeLen(t.size); hh = 34; artHtml = bridgeArt(w); }
    else if (t.type === 'spring') { [w, hh] = SPRING[t.size]; artHtml = springArt(t.size); }
    else if (t.type === 'balloon') { [w, hh] = BALLOON; artHtml = balloonArt(); }
    else { w = rampW; hh = STEP_H; artHtml = rampArt(w); }
    const inner = h('div', { class: 'tr-tool-in', html: artHtml });
    const el = h('div', { class: `tr-tool tool-${t.type}`, 'aria-label': t.type }, inner);
    el.style.width = w + 'px';
    el.style.height = hh + 'px';
    return { ...t, w, h: hh, el, inner, slot: null };
  });
  const gapX = 34;
  const trayW = tools.reduce((s, t) => s + t.w, 0) + gapX * (tools.length - 1);
  let tx = 600 - trayW / 2;
  for (const t of tools) {
    t.homeX = tx;
    t.homeY = TRAY_FLOOR - t.h;
    t.el.style.left = tx + 'px';
    t.el.style.top = t.homeY + 'px';
    t.el.dataset.homeLeft = tx;
    t.el.dataset.homeTop = t.homeY;
    tx += t.w + gapX;
    scene.append(t.el);
  }

  const fits = (t, o) => {
    if (!t) return false;
    if (o.kind === 'gap') return (t.type === 'bridge' && t.size === o.size) || t.type === 'balloon';
    if (o.kind === 'wide') return t.type === 'balloon';
    if (o.kind === 'step') return t.type === 'ramp' || t.type === 'spring';
    return t.type === 'spring' && POWER[t.size] >= o.h; // cliff and key deck
  };

  // Where a tool sits on an obstacle (it sits there even when it is the wrong one).
  function seat(t, slot) {
    const o = slot.ob;
    let left;
    let top = G - t.h;
    let rot = '';
    const gapLike = o.kind === 'gap' || o.kind === 'wide';
    if (t.type === 'bridge') {
      if (gapLike) {
        const room = o.kind === 'gap' ? o.w + 46 : o.w;
        top = G - 18;
        if (t.w < o.w + 8) { left = o.x0 - 14; rot = 'rotate(26deg)'; }
        else if (t.w > room) { left = (o.x0 + o.x1) / 2 - t.w / 2; top -= 16; rot = 'rotate(-7deg)'; }
        else left = (o.x0 + o.x1) / 2 - t.w / 2;
      } else { left = o.x0 - t.w - 6; top = G - 24; }
    } else if (o.kind === 'key' && t.type === 'spring') left = o.x0 - t.w - 6;
    else if (gapLike) left = o.x0 - t.w - 4;
    else left = o.x0 - t.w - (t.type === 'ramp' ? 0 : 6);
    t.el.style.transition = 'left .25s ease, top .25s ease';
    t.el.style.left = left + 'px';
    t.el.style.top = top + 'px';
    t.inner.style.transform = rot;
    t.inner.style.transformOrigin = rot.includes('26') ? '0 50%' : '50% 50%';
  }
  function toTray(t) {
    if (t.slot) t.slot.tool = null;
    t.slot = null;
    t.inner.style.transform = '';
    t.el.style.transition = 'left .38s cubic-bezier(.3,1.5,.5,1), top .38s cubic-bezier(.3,1.5,.5,1)';
    t.el.style.left = t.homeX + 'px';
    t.el.style.top = t.homeY + 'px';
  }
  let running = false;
  tools.forEach(dragTool);
  scene.dbg = { slots, tools, fits }; // for testing from the console

  function dragTool(t) {
    return draggable(t.el, {
      onLift() { t.inner.style.transform = ''; sfx.pop(); scene.classList.add('placing'); markSlots(null); },
      onMove(c) { markSlots(slotAt(c)); },
      onEnd() { scene.classList.remove('placing'); },
      onTap() { if (!running && t.slot) { sfx.pop(); toTray(t); markSlots(null); } },
      onDrop(c) {
        const best = slotAt(c);
        if (!best) {
          if (t.slot) t.slot.tool = null;
          t.slot = null;
          markSlots(null);
          return false;
        }
        if (t.slot) t.slot.tool = null;
        if (best.tool && best.tool !== t) toTray(best.tool);
        best.tool = t;
        t.slot = best;
        sfx.click();
        seat(t, best);
        markSlots(null);
        return true;
      },
    });
  }

  // ---- walking
  const pos = { x: START_X, y: G };
  const followers = [];
  const setPos = (px, py) => {
    pos.x = px;
    pos.y = py;
    walker.style.left = px - CH_W / 2 + 'px';
    walker.style.top = py - FOOT + 'px';
    for (const fl of followers) {
      fl.el.style.left = px + fl.dx + 'px';
      fl.el.style.top = py + fl.dy + 'px';
    }
  };
  const quick = reducedNow();
  function move(tx2, ty2, { speed = 250, ms, lift = 0, cls = 'running' } = {}) {
    const x0 = pos.x;
    const y0 = pos.y;
    const dist = Math.hypot(tx2 - x0, ty2 - y0);
    const dur = ms || Math.max(120, (dist / speed) * 1000);
    if (quick) { setPos(tx2, ty2); return sleep(Math.min(250, dur / 3)); }
    if (cls) walker.classList.add(cls);
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = (now) => {
        if (!ctx.alive()) return resolve();
        const u = Math.min(1, (now - t0) / dur);
        setPos(x0 + (tx2 - x0) * u, y0 + (ty2 - y0) * u - lift * 4 * u * (1 - u));
        if (u < 1) requestAnimationFrame(step);
        else { if (cls) walker.classList.remove(cls); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }
  const boing = (t) => { if (t) anim(t.inner, 'boing', 450); sfx.rotate(); };

  stopAct(walker);
  walker.style.opacity = '1';
  setPos(START_X, G);
  await act(walker, 'runin', { dx: offLeft(walker) });
  if (!ctx.alive()) return undefined;

  const ask = ctx.index === 0
    ? (keyOb ? 'Get the key, then open the chest! Put the tools on the path, then press Go!' : 'Help me get to the treasure! Put the tools on the path, then press Go!')
    : (keyOb ? 'Get the key and the treasure! Then press Go!' : 'Put the tools on the path, then press Go!');
  ctx.prompt(ask);

  return new Promise((resolve) => {
    goBtn.addEventListener('click', async () => {
      if (running) return;
      // Every spot needs a tool first (the key deck too), so the child always makes a choice.
      const empty = slots.filter((s) => !s.tool);
      if (empty.length) {
        sfx.boop();
        for (const s of empty) anim(s.mark, 'wiggle', 600);
        scene.classList.add('remind');
        setTimeout(() => scene.classList.remove('remind'), 1400);
        ctx.say(empty.some((s) => s.ob.kind === 'key') ? 'Put a tool here to get the key!' : 'Put a tool in every box!');
        return;
      }
      running = true;
      sfx.whoosh();
      anim(goBtn, 'pop', 400);
      goBtn.disabled = true;
      ctx.clearPrompt();
      for (const t of tools) t.el.dataset.locked = '1';
      const ok = await walk();
      if (!ctx.alive()) return;
      if (ok) { resolve(); return; }
      // Oops: back to the start; the tools stay where the child put them.
      await sleep(600);
      walker.style.transition = 'opacity .3s';
      walker.style.opacity = '0';
      await sleep(quick ? 50 : 320);
      followers.length = 0;
      setPos(START_X, G);
      keyHome();
      for (const t of tools) {
        t.el.style.opacity = '1';
        t.el.classList.remove('flying');
        if (t.slot) seat(t, t.slot);
        delete t.el.dataset.locked;
      }
      walker.style.opacity = '1';
      running = false;
      goBtn.disabled = false;
      ctx.setPrompt(ask);
    });
  });

  async function oops(el) {
    ctx.no(el || walker, 'Oops!');
    act(walker, 'surprised');
    await sleep(900);
    return false;
  }

  async function walk() {
    let haveKey = !keyOb;
    for (const s of slots) {
      const o = s.ob;
      const t = s.tool;
      if (!ctx.alive()) return false;
      if (o.kind === 'gap' || o.kind === 'wide') {
        if (t && t.type === 'balloon' && fits(t, o)) {
          await move(o.x0 - 30, G);
          t.el.style.transition = 'none';
          followers.push({ el: t.el, dx: -t.w / 2, dy: -CH_H - t.h + 40 });
          setPos(pos.x, pos.y);
          walker.classList.add('float');
          sfx.whoosh();
          await move(o.x1 + 34, G, { ms: 1600, lift: 150, cls: '' });
          walker.classList.remove('float');
          followers.length = 0;
          t.el.classList.add('flying');
        } else if (fits(t, o)) {
          await move(o.x1 + 26, G);
        } else {
          await move(o.x0 - 24, G);
          return oops(t ? t.el : null);
        }
      } else {
        const springX = t && t.type === 'spring' ? parseFloat(t.el.style.left) + t.w / 2 : 0;
        if (t && t.type === 'spring') {
          await move(springX, G);
          boing(t);
          if (!fits(t, o)) {
            await move(springX - 6, G, { ms: 900, lift: POWER[t.size] * 0.75, cls: 'leap' });
            return oops(t.el);
          }
          const top = G - o.h;
          if (o.kind === 'key') {
            const mid = (o.x0 + o.x1) / 2;
            await move(mid, top, { ms: 900, lift: 70, cls: 'leap' });
            if (keyEl) {
              sfx.ting();
              haveKey = true;
              keyEl.firstChild.classList.remove('bob');
              keyEl.style.transition = 'none';
              followers.push({ el: keyEl, dx: -28, dy: -CH_H - 30 });
              setPos(pos.x, pos.y);
            }
            await move(o.x1 + 40, G, { ms: 650, lift: 40, cls: 'leap' });
          } else {
            await move(o.x0 + 28, top, { ms: 900, lift: 60, cls: 'leap' });
            await move(o.x1 - 22, top);
            await move(o.x1 + 36, G, { ms: 600, lift: 36, cls: 'leap' });
          }
        } else if (t && t.type === 'ramp' && o.kind !== 'key') {
          await move(o.x0 - t.w + 8, G);
          if (!fits(t, o)) {
            await move(o.x0 - 10, G - STEP_H + 4, { speed: 160 });
            await move(o.x0 - t.w + 8, G, { speed: 300 });
            return oops(t.el);
          }
          await move(o.x0 + 10, G - o.h, { speed: 190 });
          await move(o.x1 - 20, G - o.h);
          await move(o.x1 + 36, G, { ms: 600, lift: 36, cls: 'leap' });
        } else if (o.kind === 'key') {
          // Nothing to jump with: walk on under the deck (the chest stays locked).
          await move(o.x1 + 30, G);
        } else {
          await move(o.x0 - 30, G);
          anim(walker, 'wiggle', 500);
          return oops(t ? t.el : null);
        }
      }
    }
    await move(CHEST_X - 104, G);
    if (!haveKey) {
      anim(chestEl.firstChild, 'wiggle', 500);
      return oops(chestEl.firstChild);
    }
    // Open it!
    if (keyEl) {
      followers.length = 0;
      keyEl.style.transition = 'left .4s ease, top .4s ease, opacity .4s';
      keyEl.style.left = CHEST_X - 28 + 'px';
      keyEl.style.top = G - 40 + 'px';
      await sleep(420);
      keyEl.style.opacity = '0';
    }
    sfx.yay();
    drawChest(true, false);
    anim(chestEl.firstChild, 'pop', 500);
    await prize();
    return true;
  }

  async function prize() {
    const at = { x: CHEST_X, y: G - 70 };
    if (ctx.index < 4) {
      await ctx.yes(pick(['Gold coins', 'Shiny gems', 'Treasure', 'Gold and gems']), at);
      await sleep(300);
      return;
    }
    // Chest 5: a new accessory (or a big gem when everything is found).
    const left = ACC.filter((a) => !S.found().includes(a.id));
    const card = h('div', { class: 'tr-prize' });
    if (left.length) {
      const a = pick(left);
      S.addFound(a.id);
      card.innerHTML = accSVG(a.id);
      ctx.area.append(card);
      placeAt(card, CHEST_X - 60, G - 140);
      requestAnimationFrame(() => card.classList.add('up'));
      ctx.burst(600, 330, 16, 260);
      await ctx.yes(`A ${ACC_BY[a.id].name}`, at);
      await ctx.say('You can wear it!');
    } else {
      card.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><path d="M20 38 L36 16 H64 L80 38 L50 86 Z" ${P('#5BC0EB', 3)}/><path d="M20 38 H80 M36 16 L44 38 L50 86 M64 16 L56 38" ${L('#2E8FB8', 2.4)}/><path d="M38 22 L32 34" ${L('#FFFFFF', 3)}/></svg>`;
      ctx.area.append(card);
      placeAt(card, CHEST_X - 60, G - 140);
      requestAnimationFrame(() => card.classList.add('up'));
      ctx.burst(600, 330, 16, 260);
      await ctx.yes('A big gem', at);
    }
    await sleep(500);
    card.remove();
  }
}



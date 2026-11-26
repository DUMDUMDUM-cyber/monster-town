// Train time! — drag track pieces into the gaps so the train can reach the station.
// Levels (DESAIN.md 7.6): 1-3 longer routes with turns, rivers and turned pieces;
// 4 a junction: fix the track and set the switch so the train reaches the named station;
// 5 coloured stations: set the switch so each animal gets off at its station.
import { h, pick, rand, sample, shuffle, sleep, anim, placeAt, draggable } from '../util.js';
import { engineSVG, wagonSVG, stationSVG, tunnelSVG, picSVG, grad, lineOf } from '../art.js';
import { sfx } from '../sound.js';

const COLS = 8;
const ROWS = 5;
const T = 96;
const OX = (1200 - COLS * T) / 2;
const OY = 108;
const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
const ORD = 'NESW';
const CW = { N: 'E', E: 'S', S: 'W', W: 'N' };
const key = (a, b) => [a, b].sort((x, y) => ORD.indexOf(x) - ORD.indexOf(y)).join('');
const rotKey = (k) => key(CW[k[0]], CW[k[1]]);
const BASE_ROT = { EW: 0, NS: 90, NE: 0, ES: 90, SW: 180, NW: 270 };
const TYPES = Object.keys(BASE_ROT);
const isStraight = (k) => k === 'EW' || k === 'NS';
const PASSENGERS = ['dog', 'cat', 'duck', 'pig', 'rabbit', 'frog', 'sheep', 'cow', 'lion'];
const WAGON_COLORS = ['#3A86FF', '#FFD166', '#06D6A0'];

const LEVELS = {
  1: { turns: [2, 4], rivers: 1, gaps: 3, decoys: 1, rotate: false, curveGaps: 1, bridgeGap: true },
  2: { turns: [4, 6], rivers: 1, gaps: 4, decoys: 1, rotate: true, curveGaps: 2 },
  3: { turns: [6, 8], rivers: 2, gaps: 6, decoys: 2, rotate: true, curveGaps: 3, bridgeGap: true },
};
// Level 4: named stations, each with a picture sign.
const PLACES = [
  { name: 'farm', sign: 'cow' }, { name: 'zoo', sign: 'lion' }, { name: 'pond', sign: 'duck' }, { name: 'garden', sign: 'flower' },
];
// Level 5: coloured stations.
const ST_COLORS = { red: '#E85D6A', blue: '#4C8DF0', yellow: '#FFD166', green: '#5DBB63' };
const WAIT_AT = 230; // how far along the track the train waits at level 5

const WATER = '<rect width="100" height="100" fill="#86C9E6"/><path d="M12 30 q10 -8 20 0 t20 0 M48 72 q10 -8 20 0 t20 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>';
const svg100 = (inner) => `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${inner}</svg>`;

function trackG(type, bridge) {
  const straight = isStraight(type);
  const sleepers = straight ? 'M0 50 H100' : 'M50 0 A50 50 0 0 0 100 50';
  const rails = straight ? 'M0 37 H100 M0 63 H100' : 'M63 0 A37 37 0 0 0 100 37 M37 0 A63 63 0 0 0 100 63';
  const deck = bridge ? '<rect x="-2" y="16" width="104" height="68" fill="#D4A06E" stroke="#8A5A33" stroke-width="3"/><path d="M0 16 H100 M0 84 H100" stroke="#8A5A33" stroke-width="6"/>' : '';
  return `<g transform="rotate(${BASE_ROT[type]} 50 50)">${deck}<path d="${sleepers}" stroke="#B0835A" stroke-width="40" stroke-dasharray="8 8" fill="none"/><path d="${rails}" stroke="#6E6A80" stroke-width="6" fill="none"/><path d="${rails}" stroke="#B7B3C6" stroke-width="2" fill="none"/></g>`;
}
const trackSVG = (type, bridge, water) => svg100(`${water ? WATER : ''}${trackG(type, bridge)}`);

// A switch: every way is drawn, the ways not in use are pale. The dot shows where the train goes.
function junctionSVG(exits, active) {
  const dot = { N: [50, 10], E: [90, 50], S: [50, 90] }[active];
  const pale = exits.filter((d) => d !== active).map((d) => `<g opacity=".3">${trackG(key('W', d))}</g>`).join('');
  return svg100(`${pale}${trackG(key('W', active))}<rect class="sw-ring" x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#FFF3C4" stroke-width="5"/><circle cx="${dot[0]}" cy="${dot[1]}" r="9" fill="${grad('#FFD166')}" stroke="${lineOf('#FFD166')}" stroke-width="2.4"/>`);
}

function genPath(cfg) {
  for (let t = 0; t < 1500; t++) {
    let rivers = [];
    if (cfg.rivers === 1) rivers = [rand(2, 5)];
    if (cfg.rivers === 2) { const a = rand(1, 3); rivers = [a, rand(a + 2, 6)]; }
    let r = rand(0, ROWS - 1);
    let c = 0;
    let entry = 'W';
    let vrun = 0;
    const cells = [];
    const pV = cfg.turns[1] === 0 ? 0 : cfg.turns[1] >= 6 ? 0.75 : 0.5;
    for (let guard = 0; guard < 80; guard++) {
      const opts = [];
      if (!rivers.includes(c)) {
        if (entry === 'N' || entry === 'S') {
          const cont = entry === 'N' ? 'S' : 'N';
          const nr = r + DIR[cont][1];
          if (vrun < 2 && nr >= 0 && nr < ROWS && Math.random() < 0.35) opts.push(cont);
        } else if (Math.random() < pV) {
          if (r > 0) opts.push('N');
          if (r < ROWS - 1) opts.push('S');
        }
      }
      const exit = opts.length ? pick(opts) : 'E';
      cells.push({ c, r, entry, exit, type: key(entry, exit), bridge: rivers.includes(c) });
      if (exit === 'E') {
        if (c === COLS - 1) break;
        c++;
        entry = 'W';
        vrun = 0;
      } else {
        r += DIR[exit][1];
        entry = OPP[exit];
        vrun++;
      }
    }
    const last = cells[cells.length - 1];
    if (last.c !== COLS - 1 || last.exit !== 'E') continue;
    const turns = cells.filter((x) => !isStraight(x.type)).length;
    if (turns < cfg.turns[0] || turns > cfg.turns[1]) continue;
    return { cells, rivers, r0: cells[0].r, r1: last.r };
  }
  const r = rand(0, ROWS - 1);
  const cells = Array.from({ length: COLS }, (_, c) => ({ c, r, entry: 'W', exit: 'E', type: 'EW', bridge: false }));
  return { cells, rivers: [], r0: r, r1: r };
}

function chooseGaps(cells, cfg) {
  const idx = cells.map((_, i) => i);
  for (let t = 0; t < 400; t++) {
    const pickIdx = sample(idx, cfg.gaps);
    const g = pickIdx.map((i) => cells[i]);
    if (g.filter((x) => !isStraight(x.type)).length < (cfg.curveGaps || 0)) continue;
    if (cfg.bridgeGap && !g.some((x) => x.bridge)) continue;
    return pickIdx;
  }
  return sample(idx, cfg.gaps);
}

// A track that splits at column J of the middle row. Each way ends at its own station row.
function junctionLayout(L) {
  const R = 2;
  const J = L === 4 ? rand(2, 4) : rand(2, 3);
  const exits = L === 4 ? ['N', 'S'] : ['N', 'E', 'S'];
  const rowOf = { N: L === 4 ? rand(0, 1) : 0, E: R, S: L === 4 ? rand(3, 4) : 4 };
  const trunk = Array.from({ length: J }, (_, c) => ({ c, r: R, entry: 'W', exit: 'E', type: 'EW', bridge: false }));
  const branches = {};
  for (const d of exits) {
    const cells = [];
    const end = rowOf[d];
    if (d !== 'E') {
      const step = d === 'N' ? -1 : 1;
      for (let r = R + step; r !== end; r += step) cells.push({ c: J, r, entry: OPP[d], exit: d, type: 'NS', bridge: false });
      cells.push({ c: J, r: end, entry: OPP[d], exit: 'E', type: key(OPP[d], 'E'), bridge: false });
    }
    for (let c = J + 1; c < COLS; c++) cells.push({ c, r: end, entry: 'W', exit: 'E', type: 'EW', bridge: false });
    branches[d] = cells;
  }
  const routeOf = (d) => ({
    cells: [...trunk, { c: J, r: R, entry: 'W', exit: d, type: key('W', d), bridge: false }, ...branches[d]],
    r0: R,
    r1: rowOf[d],
  });
  return { R, J, exits, rowOf, trunk, branches, routeOf, cells: [...trunk, ...exits.flatMap((d) => branches[d])] };
}

const cellCenter = (c, r) => ({ x: OX + c * T + T / 2, y: OY + r * T + T / 2 });

function edgePoint(cell, d) {
  const p = cellCenter(cell.c, cell.r);
  return { x: p.x + DIR[d][0] * (T / 2), y: p.y + DIR[d][1] * (T / 2) };
}

function routePoints(path) {
  const pts = [];
  const s = cellCenter(-1, path.r0);
  pts.push({ x: s.x - 30, y: s.y });
  for (const cell of path.cells) {
    const a = edgePoint(cell, cell.entry);
    const b = edgePoint(cell, cell.exit);
    if (isStraight(cell.type)) {
      pts.push(a, b);
    } else {
      const ew = [cell.entry, cell.exit].find((d) => d === 'E' || d === 'W');
      const ns = [cell.entry, cell.exit].find((d) => d === 'N' || d === 'S');
      const cc = cellCenter(cell.c, cell.r);
      const corner = { x: cc.x + DIR[ew][0] * (T / 2), y: cc.y + DIR[ns][1] * (T / 2) };
      const a0 = Math.atan2(a.y - corner.y, a.x - corner.x);
      let a1 = Math.atan2(b.y - corner.y, b.x - corner.x);
      if (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
      if (a0 - a1 > Math.PI) a1 += Math.PI * 2;
      for (let i = 0; i <= 8; i++) {
        const an = a0 + ((a1 - a0) * i) / 8;
        pts.push({ x: corner.x + Math.cos(an) * (T / 2), y: corner.y + Math.sin(an) * (T / 2) });
      }
    }
  }
  const e = cellCenter(COLS, path.r1);
  pts.push({ x: e.x + 10, y: e.y });
  const dist = [0];
  for (let i = 1; i < pts.length; i++) dist.push(dist[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, dist, len: dist[dist.length - 1] };
}

function pointAt(route, s) {
  const { pts, dist } = route;
  if (s <= 0) return { ...pts[0], a: Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) };
  let i = 1;
  while (i < dist.length - 1 && dist[i] < s) i++;
  const seg = dist[i] - dist[i - 1] || 1;
  const t = Math.min(1, (s - dist[i - 1]) / seg);
  const p0 = pts[i - 1];
  const p1 = pts[i];
  return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t, a: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
}

// The engine and one wagon per passenger, drawn at distance s along the route.
function showTrain(area, route, passengers, s) {
  const layer = h('div');
  const parts = [{ el: h('div', { class: 'train-car', html: engineSVG(), style: { width: '70px', height: '44px' } }), back: 0 }];
  passengers.forEach((p, i) => parts.push({ el: h('div', { class: 'train-car', html: wagonSVG(WAGON_COLORS[i % 3], p), style: { width: '64px', height: '44px' } }), back: 70 * (i + 1) }));
  for (const p of parts) layer.append(p.el);
  area.append(layer);
  placeTrain(parts, route, s);
  return { layer, parts };
}

function placeTrain(parts, route, s) {
  for (const p of parts) {
    const q = pointAt(route, s - p.back);
    p.el.style.left = q.x - parseFloat(p.el.style.width) / 2 + 'px';
    p.el.style.top = q.y - 22 + 'px';
    p.el.style.transform = `rotate(${q.a}rad)`;
  }
}

// Drive to the end of the route. Resolves with the train's layer (the caller may remove it).
function runTrain(area, route, passengers, from = 0) {
  const { layer, parts } = showTrain(area, route, passengers, from);
  const total = route.len;
  const speed = 260;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now) => {
      const s = from + ((now - t0) / 1000) * speed;
      placeTrain(parts, route, Math.min(total, s));
      if (s < total && area.isConnected) requestAnimationFrame(frame);
      else resolve(layer);
    };
    requestAnimationFrame(frame);
  });
}

// The board: track, gaps, water, and (levels 4-5) the switch tile.
function drawBoard(area, cells, gapSet, rivers = [], jn = null) {
  const board = h('div', { class: 'rail-board', style: { left: OX + 'px', top: OY + 'px', width: COLS * T + 'px', height: ROWS * T + 'px' } });
  area.append(board);
  const at = new Map(cells.map((cell) => [`${cell.c},${cell.r}`, cell]));
  const gaps = [];
  let jTile = null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = at.get(`${c},${r}`);
      const tile = h('div', { class: 'tile', style: { left: c * T + 'px', top: r * T + 'px', width: T + 'px', height: T + 'px' } });
      if (jn && c === jn.c && r === jn.r) {
        tile.classList.add('switch');
        jTile = tile;
      } else if (!cell) {
        if (rivers.includes(c)) tile.innerHTML = svg100(WATER);
      } else if (gapSet.has(cell)) {
        tile.innerHTML = svg100(`${cell.bridge ? WATER : ''}<rect class="gap-rect" x="8" y="8" width="84" height="84" rx="14" fill="rgba(255,251,242,.65)" stroke="#5E7F4A" stroke-width="4" stroke-dasharray="10 8"/>`);
        tile.classList.add('gap');
        gaps.push({ el: tile, cell, filled: false });
      } else {
        tile.innerHTML = trackSVG(cell.type, cell.bridge, cell.bridge);
      }
      board.append(tile);
    }
  }
  return { board, gaps, jTile };
}

// Pieces for the tray: one per gap plus decoys.
function makeTray(area, gaps, cfg) {
  const gapKeys = new Set(gaps.map((g) => `${g.cell.type}${g.cell.bridge ? 'B' : ''}`));
  const pieces = gaps.map((g) => {
    let type = g.cell.type;
    if (cfg.rotate) {
      const turns = isStraight(type) ? pick([0, 1]) : rand(1, 3);
      for (let k = 0; k < turns; k++) type = rotKey(type);
    }
    return { type, bridge: g.cell.bridge };
  });
  for (let d = 0; d < cfg.decoys; d++) {
    let cand;
    let guard = 0;
    do {
      cand = { type: pick(TYPES), bridge: cfg.rivers > 0 && Math.random() < 0.25 };
      if (cand.bridge && !isStraight(cand.type)) cand.bridge = false;
    } while (!cfg.rotate && gapKeys.has(`${cand.type}${cand.bridge ? 'B' : ''}`) && guard++ < 50);
    pieces.push(cand);
  }
  const tray = shuffle(pieces);
  const step = Math.min(112, 820 / tray.length);
  const x0 = 720 - (step * (tray.length - 1)) / 2;
  return tray.map((pc, i) => {
    const el = h('div', { class: 'track-piece pop-in', style: { width: T + 'px', height: T + 'px', animationDelay: i * 50 + 'ms' } });
    const inner = h('div', { class: 'rot', html: trackSVG(pc.type, pc.bridge, false) });
    el.append(inner);
    area.append(el);
    placeAt(el, x0 + i * step, 692);
    return { el, inner, pc };
  });
}

function wireTray(ctx, els, gaps, cfg, onPlace) {
  for (const p of els) {
    draggable(p.el, {
      onTap: () => {
        if (!cfg.rotate || p.el.dataset.locked) return;
        p.pc.type = rotKey(p.pc.type);
        p.inner.innerHTML = trackSVG(p.pc.type, p.pc.bridge, false);
        anim(p.inner, 'turn', 260);
        sfx.rotate();
      },
      onDrop: (pt) => {
        const g = nearestGap(pt, gaps.filter((x) => !x.filled));
        if (!g) return false;
        if (g.cell.type !== p.pc.type || g.cell.bridge !== p.pc.bridge) {
          ctx.no(null);
          return false;
        }
        g.filled = true;
        p.el.dataset.locked = '1';
        p.el.classList.add('placed');
        g.el.innerHTML = trackSVG(g.cell.type, g.cell.bridge, g.cell.bridge);
        p.el.remove();
        anim(g.el, 'pop', 400);
        sfx.click();
        onPlace(g);
        return true;
      },
    });
  }
}

function nearestGap(pt, open) {
  let best = null;
  let bestD = 80;
  for (const o of open) {
    const c = cellCenter(o.cell.c, o.cell.r);
    const d = Math.hypot(c.x - pt.x, c.y - pt.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

function placeStation(area, row, opts) {
  const big = !!opts.sign;
  const el = h('div', { class: 'station', html: stationSVG(opts), style: { width: big ? '120px' : '104px', height: big ? '143px' : '124px' } });
  area.append(el);
  placeAt(el, OX + COLS * T + (big ? 68 : 62), OY + row * T + T / 2 - (big ? 28 : 22));
  return el;
}

// Levels 1-3: one route with gaps.
async function routeQuestion(ctx) {
  const cfg = LEVELS[ctx.level];
  const path = genPath(cfg);
  const gapSet = new Set(chooseGaps(path.cells, cfg).map((i) => path.cells[i]));
  const area = ctx.area;
  area.innerHTML = '';
  await sleep(60);

  const { gaps } = drawBoard(area, path.cells, gapSet, path.rivers);
  const tunnel = h('div', { class: 'tunnel', html: tunnelSVG(), style: { width: '104px', height: '112px' } });
  area.append(tunnel);
  placeAt(tunnel, OX - 46, OY + path.r0 * T + T / 2 - 8);
  const station = h('div', { class: 'station', html: stationSVG(), style: { width: '128px', height: '152px' } });
  area.append(station);
  placeAt(station, OX + COLS * T + 70, OY + path.r1 * T + T / 2 - 40);
  const els = makeTray(area, gaps, cfg);

  if (!(await hello(ctx))) return;
  return new Promise((resolve) => {
    let left = gaps.length;
    const finish = async () => {
      ctx.clearPrompt();
      for (const p of els) if (!p.el.dataset.locked) p.el.style.opacity = 0.35;
      const riders = sample(PASSENGERS, 3);
      await sleep(300);
      await ctx.say(`All aboard! ${riders[0]}, ${riders[1]} and ${riders[2]}!`);
      if (!ctx.alive()) return;
      sfx.choo();
      await runTrain(area, routePoints(path), riders);
      if (!ctx.alive()) return;
      anim(station, 'pop', 500);
      await ctx.yes('Choo choo');
      resolve();
    };
    wireTray(ctx, els, gaps, cfg, () => { if (--left === 0) finish(); });
    ctx.prompt(cfg.rotate ? 'Fix the track! Tap a piece to turn it.' : 'Fix the track for the train!');
  });
}

async function hello(ctx) {
  if (ctx.round.first) {
    ctx.round.first = false;
    await ctx.say('Choo choo! The train needs your help!');
  }
  return ctx.alive();
}

// Levels 4-5: a switch decides which way the train goes.
async function junctionQuestion(ctx) {
  const L = ctx.level;
  const lay = junctionLayout(L);
  const { exits, rowOf, routeOf } = lay;
  const jn = { c: lay.J, r: lay.R };
  const first = !ctx.round.told;
  ctx.round.told = true;

  // Level 4: one gap on the shared track and one on every branch, so the gaps don't give the way away.
  const gapSet = new Set();
  if (L === 4) {
    gapSet.add(pick(lay.trunk));
    for (const d of exits) gapSet.add(pick(lay.branches[d]));
  } else {
    // Level 5: one gap on every branch (after the switch, so the waiting train is never on one).
    for (const d of exits) gapSet.add(pick(lay.branches[d]));
  }
  const area = ctx.area;
  area.innerHTML = '';
  await sleep(60);
  const { gaps, jTile } = drawBoard(area, lay.cells, gapSet, [], jn);
  const tunnel = h('div', { class: 'tunnel', html: tunnelSVG(), style: { width: '104px', height: '112px' } });
  area.append(tunnel);
  placeAt(tunnel, OX - 46, OY + lay.R * T + T / 2 - 8);

  let active = pick(exits);
  const drawSwitch = () => { jTile.innerHTML = junctionSVG(exits, active); };
  drawSwitch();

  const stations = {};
  let target = null;
  let jobs = [];
  if (L === 4) {
    const places = sample(PLACES.filter((p) => p.name !== ctx.round.place), exits.length);
    exits.forEach((d, i) => { stations[d] = { ...places[i], el: placeStation(area, rowOf[d], { sign: places[i].sign }) }; });
    target = pick(exits);
    ctx.round.place = stations[target].name;
  } else {
    const names = sample(Object.keys(ST_COLORS), exits.length);
    exits.forEach((d, i) => { stations[d] = { name: names[i], el: placeStation(area, rowOf[d], { roof: ST_COLORS[names[i]], pale: true }) }; });
    const animals = sample(PASSENGERS, 2);
    jobs = sample(exits, 2).map((d, i) => ({ animal: animals[i], d }));
  }
  const els = makeTray(area, gaps, { rotate: true, decoys: 1, rivers: 0 });

  if (!(await hello(ctx))) return;
  return new Promise((resolve) => {
    let busy = false;
    let timer = null;
    let waiting = null;
    const riders = sample(PASSENGERS, 2);
    const jobText = () => jobs.map((j) => `The ${j.animal} gets off at the ${stations[j.d].name} station.`).join(' ');

    const routeOpen = (d) => gaps.every((g) => g.filled || !routeOf(d).cells.includes(g.cell));

    // Level 4: the train sets off by itself once the way the switch points to is whole.
    const check = () => {
      clearTimeout(timer);
      if (L !== 4) return;
      timer = setTimeout(() => { if (!busy && ctx.alive() && routeOpen(active)) go(active); }, 900);
    };

    // Level 5: the train waits on the track; tap it to go.
    const park = () => {
      waiting = showTrain(area, routePoints(routeOf(active)), jobs.map((j) => j.animal), WAIT_AT);
      for (const p of waiting.parts) {
        p.el.classList.add('waiting');
        p.el.addEventListener('click', () => { if (!busy) go(active); });
      }
    };

    const go = async (d) => {
      busy = true;
      sfx.choo();
      if (L === 4) {
        const layer = await runTrain(area, routePoints(routeOf(d)), riders);
        if (!ctx.alive()) return;
        if (d === target) {
          anim(stations[d].el, 'pop', 500);
          await ctx.yes(`The ${stations[d].name}`);
          resolve();
          return;
        }
        await ctx.no(stations[d].el);
        layer.remove();
        busy = false;
        return;
      }
      if (!routeOpen(d)) {
        // The way the switch points to still has a hole: fix it first.
        busy = false;
        for (const g of gaps) if (!g.filled && routeOf(d).cells.includes(g.cell)) anim(g.el, 'wiggle', 600);
        sfx.boop();
        ctx.say('Fix the track first!');
        return;
      }
      waiting.layer.remove();
      const layer = await runTrain(area, routePoints(routeOf(d)), jobs.map((j) => j.animal), WAIT_AT);
      if (!ctx.alive()) return;
      const job = jobs.find((j) => j.d === d);
      if (job) {
        jobs = jobs.filter((j) => j !== job);
        const off = h('div', { class: 'rider pop-in', html: picSVG(job.animal), style: { width: '58px', height: '58px' } });
        area.append(off);
        placeAt(off, OX + COLS * T + 18, OY + rowOf[d] * T + T / 2 + 30);
        sfx.giggle();
        anim(stations[d].el, 'pop', 500);
        await ctx.say(`Bye-bye, ${job.animal}!`);
      } else {
        await ctx.no(stations[d].el);
      }
      if (!ctx.alive()) return;
      layer.remove();
      if (!jobs.length) {
        await ctx.yes('Everyone is home');
        resolve();
        return;
      }
      park();
      busy = false;
      if (job) ctx.prompt(jobText());
    };

    jTile.addEventListener('click', () => {
      if (busy) return;
      active = exits[(exits.indexOf(active) + 1) % exits.length];
      drawSwitch();
      anim(jTile, 'pop', 300);
      sfx.rotate();
      check();
    });

    if (L === 4) {
      wireTray(ctx, els, gaps, { rotate: true }, () => check());
      const place = stations[target].name;
      ctx.prompt(first ? `Take the train to the ${place}! Fix the track, and tap the switch to pick the way.` : `Take the train to the ${place}!`);
    } else {
      wireTray(ctx, els, gaps, { rotate: true }, () => {});
      park();
      ctx.prompt(first ? `${jobText()} Fix the track, set the switch, then tap the train!` : jobText());
    }
  });
}

export default {
  id: 'train',
  title: 'Train time',
  titleId: 'Rel Kereta',
  card: '#D8F3C8',
  art: 'train',

  startRound(ctx) {
    ctx.setPlace('country');
    ctx.round = { first: true };
  },

  question(ctx) {
    return ctx.level >= 4 ? junctionQuestion(ctx) : routeQuestion(ctx);
  },
};

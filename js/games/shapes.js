// Shape it! — drag a shape into its hole, or build a picture from shapes.
// Levels (DESAIN.md 7.6): 1 four holes, 2 turned holes (tap to turn), 3 build a picture
// (3-5 pieces), 4 bigger pictures (6-8 pieces), 5 big pictures (8-10 pieces, some turned).
import { h, pick, sample, shuffle, anim, cap, placeAt, moveTo, nearest, draggable, sleep } from '../util.js';
import { shapeSVG, SHAPE_SIZE } from '../art.js';
import { sfx } from '../sound.js';

const L1 = ['circle', 'square', 'triangle'];
const L2 = [...L1, 'star', 'heart'];
const L3 = [...L2, 'rectangle', 'oval', 'diamond'];
const TURNY = ['triangle', 'heart', 'star', 'rectangle', 'oval', 'diamond'];
const PERIOD = { rectangle: 180, oval: 180, diamond: 180, triangle: 360, heart: 360, star: 360, circle: 90, square: 90 };
const COLORS = ['#EF476F', '#3A86FF', '#FFD166', '#06D6A0', '#FF9542', '#9B5DE5', '#FF8FB1'];
const HOLE_FILL = 'rgba(70,38,18,0.36)';

const part = (s, x, y, w, hh, c, rot) => ({ s, x, y, w, h: hh, c, rot });

// Pictures to build. x/y are offsets from the picture centre. Later parts sit on top.
const SMALL = [
  { name: 'a house', parts: [
    part('square', 0, 70, 220, 180, '#FFD166'), part('triangle', 0, -90, 270, 140, '#EF476F'), part('rectangle', 0, 115, 64, 90, '#A0673A')] },
  { name: 'a rocket', parts: [
    part('rectangle', 0, 30, 110, 200, '#E3ECFF'), part('triangle', 0, -125, 110, 110, '#EF476F'), part('circle', 0, -10, 60, 60, '#3A86FF'),
    part('triangle', -85, 110, 60, 80, '#FF9542'), part('triangle', 85, 110, 60, 80, '#FF9542')] },
  { name: 'a car', parts: [
    part('rectangle', 0, 20, 320, 100, '#3A86FF'), part('rectangle', 0, -65, 180, 80, '#CFEFFF'),
    part('circle', -95, 80, 84, 84, '#5E6278'), part('circle', 95, 80, 84, 84, '#5E6278')] },
  { name: 'a tree', parts: [
    part('rectangle', 0, 105, 60, 130, '#A0673A'), part('circle', 0, -50, 230, 210, '#4FB548'),
    part('circle', -50, -70, 44, 44, '#EF476F'), part('circle', 45, -20, 44, 44, '#EF476F')] },
  { name: 'a fish', parts: [
    part('oval', -30, 0, 240, 150, '#FF9542'), part('triangle', 135, 0, 110, 120, '#FFD166', 90), part('circle', -100, -20, 34, 34, '#33294A')] },
  { name: 'a snowman', parts: [
    part('circle', 0, 95, 210, 210, '#FFFFFF'), part('circle', 0, -70, 150, 150, '#FFFFFF'),
    part('rectangle', 0, -165, 120, 56, '#33294A'), part('triangle', 0, -65, 30, 40, '#FF9542', 90)] },
  { name: 'a boat', parts: [
    part('rectangle', 0, 110, 300, 70, '#A0673A'), part('rectangle', 0, -10, 16, 180, '#5E6278'),
    part('triangle', 60, -20, 110, 150, '#FFFFFF'), part('triangle', 30, -122, 44, 40, '#EF476F', 90)] },
];

// Level 4: 6-8 pieces.
const BIG = [
  { name: 'a house', parts: [
    part('rectangle', 85, -125, 40, 80, '#A0673A'), part('square', 0, 60, 230, 180, '#FFD166'), part('triangle', 0, -95, 290, 130, '#EF476F'),
    part('rectangle', 0, 105, 60, 90, '#A0673A'), part('square', -70, 30, 54, 54, '#CFEFFF'), part('square', 70, 30, 54, 54, '#CFEFFF'),
    part('circle', -235, -140, 90, 90, '#FF9542')] },
  { name: 'a train', parts: [
    part('square', -85, -60, 110, 110, '#EF476F'), part('rectangle', 10, 40, 300, 100, '#3A86FF'), part('square', -85, -70, 56, 56, '#CFEFFF'),
    part('rectangle', 100, -50, 44, 80, '#5E6278'), part('circle', 135, -130, 56, 56, '#FFFFFF'),
    part('circle', -90, 105, 80, 80, '#5E6278'), part('circle', 10, 105, 80, 80, '#5E6278'), part('circle', 110, 105, 80, 80, '#5E6278')] },
  { name: 'a flower', parts: [
    part('rectangle', 0, 100, 30, 200, '#4FB548'), part('oval', -60, 120, 100, 50, '#06D6A0'), part('oval', 60, 80, 100, 50, '#06D6A0'),
    part('circle', 0, -160, 90, 90, '#FF8FB1'), part('circle', 65, -95, 90, 90, '#FF8FB1'), part('circle', 0, -30, 90, 90, '#FF8FB1'),
    part('circle', -65, -95, 90, 90, '#FF8FB1'), part('circle', 0, -95, 76, 76, '#FFD166')] },
  { name: 'a butterfly', parts: [
    part('circle', -90, -60, 150, 150, '#9B5DE5'), part('circle', 90, -60, 150, 150, '#9B5DE5'),
    part('circle', -75, 80, 110, 110, '#FF8FB1'), part('circle', 75, 80, 110, 110, '#FF8FB1'),
    part('oval', 0, 10, 50, 230, '#5E6278'), part('circle', 0, -125, 70, 70, '#5E6278'),
    part('circle', -95, -65, 50, 50, '#FFD166'), part('circle', 95, -65, 50, 50, '#FFD166')] },
  { name: 'a cat', parts: [
    part('triangle', -85, -115, 90, 100, '#FF9542'), part('triangle', 85, -115, 90, 100, '#FF9542'), part('circle', 0, 0, 260, 240, '#FF9542'),
    part('oval', -55, -20, 40, 60, '#33294A'), part('oval', 55, -20, 40, 60, '#33294A'), part('triangle', 0, 38, 50, 40, '#FF8FB1', 180)] },
  { name: 'a bus', parts: [
    part('rectangle', 0, 0, 400, 160, '#FFD166'),
    part('square', -150, -30, 60, 60, '#CFEFFF'), part('square', -75, -30, 60, 60, '#CFEFFF'), part('square', 0, -30, 60, 60, '#CFEFFF'), part('square', 75, -30, 60, 60, '#CFEFFF'),
    part('rectangle', 150, 10, 60, 110, '#FF9542'), part('circle', -110, 90, 84, 84, '#5E6278'), part('circle', 110, 90, 84, 84, '#5E6278')] },
];

// Level 5: 8-10 pieces, and some must be turned first.
const HUGE = [
  { name: 'a robot', parts: [
    part('star', 0, -215, 56, 54, '#FFD166'), part('rectangle', 0, -135, 140, 110, '#A9B8D0'),
    part('circle', -32, -140, 36, 36, '#3A86FF'), part('circle', 32, -140, 36, 36, '#3A86FF'),
    part('rectangle', 0, 10, 190, 170, '#06D6A0'), part('heart', 0, 0, 60, 54, '#EF476F'),
    part('rectangle', -125, 0, 44, 130, '#A9B8D0'), part('rectangle', 125, 0, 44, 130, '#A9B8D0'),
    part('rectangle', -50, 145, 50, 100, '#5E6278'), part('rectangle', 50, 145, 50, 100, '#5E6278')] },
  { name: 'a castle', parts: [
    part('rectangle', -160, 20, 80, 240, '#E3D3B8'), part('rectangle', 160, 20, 80, 240, '#E3D3B8'), part('rectangle', 0, 60, 260, 160, '#E3D3B8'),
    part('triangle', -160, -150, 110, 100, '#EF476F'), part('triangle', 160, -150, 110, 100, '#EF476F'), part('triangle', 0, -75, 150, 110, '#3A86FF'),
    part('rectangle', 0, 100, 70, 80, '#A0673A'), part('diamond', -160, -20, 40, 60, '#CFEFFF'), part('diamond', 160, -20, 40, 60, '#CFEFFF')] },
  { name: 'a rocket', parts: [
    part('rectangle', 0, 20, 130, 240, '#E3ECFF'), part('triangle', 0, -155, 130, 110, '#EF476F'),
    part('circle', 0, -45, 64, 64, '#3A86FF'), part('circle', 0, 45, 44, 44, '#3A86FF'),
    part('triangle', -100, 110, 70, 100, '#FF9542'), part('triangle', 100, 110, 70, 100, '#FF9542'),
    part('triangle', 0, 178, 70, 66, '#FFD166', 180), part('star', -210, -130, 60, 58, '#FFD166'), part('star', 200, -40, 60, 58, '#FFD166')] },
  { name: 'a boat', parts: [
    part('circle', -225, -150, 100, 100, '#FFD166'), part('rectangle', 0, -40, 26, 250, '#A0673A'),
    part('triangle', 72, -50, 120, 180, '#FFFFFF'), part('triangle', -60, -20, 90, 130, '#FF8FB1'), part('triangle', 32, -150, 50, 40, '#EF476F', 90),
    part('rectangle', 0, 120, 340, 80, '#3A86FF'),
    part('circle', -100, 120, 34, 34, '#FFFFFF'), part('circle', 0, 120, 34, 34, '#FFFFFF'), part('circle', 100, 120, 34, 34, '#FFFFFF')] },
  { name: 'an owl', parts: [
    part('triangle', -80, -150, 70, 80, '#A0673A'), part('triangle', 80, -150, 70, 80, '#A0673A'),
    part('oval', 0, 0, 260, 320, '#C98B5A'), part('oval', 0, 60, 150, 190, '#F2D9B8'),
    part('circle', -55, -70, 100, 100, '#FFFFFF'), part('circle', 55, -70, 100, 100, '#FFFFFF'),
    part('circle', -55, -70, 44, 44, '#33294A'), part('circle', 55, -70, 44, 44, '#33294A'),
    part('triangle', 0, -12, 44, 40, '#FF9542', 180)] },
];

const rotOK = (shape, a, b) => (((a - b) % PERIOD[shape]) + 720) % PERIOD[shape] === 0;
// A turn is only worth asking for when it clearly changes how the piece looks.
const canTurn = (p) => ['triangle', 'heart', 'star'].includes(p.s)
  || (['rectangle', 'oval', 'diamond'].includes(p.s) && Math.max(p.w, p.h) / Math.min(p.w, p.h) >= 1.3);

function makeShapeEl(cls, shape, fill, w, hh, rot, opts) {
  const inner = h('div', { class: 'rot', html: shapeSVG(shape, fill, opts), style: { transform: `rotate(${rot}deg)` } });
  return h('div', { class: cls, style: { width: w + 'px', height: hh + 'px' } }, inner);
}

async function holeQuestion(ctx) {
  const turn = ctx.level === 2;
  const nh = 4;
  const pool = turn ? TURNY : L3;
  const target = pick(pool.filter((s) => s !== ctx.round.last));
  ctx.round.last = target;
  const shapes = shuffle([target, ...sample(pool, nh - 1, [target])]);
  const area = ctx.area;
  area.innerHTML = '';
  area.append(h('div', { class: 'wood-board', style: { left: '110px', top: '120px', width: '980px', height: '340px' } }));

  const holes = shapes.map((s, i) => {
    const [w, hh] = SHAPE_SIZE[s];
    const rot = turn ? pick([0, 90, 180, 270]) : 0;
    const el = makeShapeEl('hole', s, HOLE_FILL, w, hh, rot, { stroke: '#6B4325', sw: 4 });
    area.append(el);
    placeAt(el, 110 + (i + 0.5) * (980 / nh), 290);
    return { el, shape: s, rot };
  });

  const hole = holes.find((x) => x.shape === target);
  let rot = 0;
  if (turn) {
    do rot = pick([0, 90, 180, 270]); while (rotOK(target, rot, hole.rot));
  }
  const [w, hh] = SHAPE_SIZE[target];
  const piece = makeShapeEl('piece pop-in', target, pick(COLORS), w, hh, rot);
  area.append(piece);
  placeAt(piece, 660, 640);
  const rotEl = piece.firstChild;

  return new Promise((resolve) => {
    let done = false;
    draggable(piece, {
      onTap: () => {
        if (!turn || done) return;
        rot = (rot + 90) % 360;
        rotEl.style.transform = `rotate(${rot}deg)`;
        sfx.rotate();
      },
      onDrop: (p) => {
        if (done) return true;
        const hit = nearest(p, holes, 150);
        if (!hit) return false;
        if (hit.shape === target && rotOK(target, rot, hit.rot)) {
          done = true;
          piece.dataset.locked = '1';
          const c = centerOfEl(hit.el);
          moveTo(piece, c.x, c.y, 220);
          sfx.click();
          setTimeout(() => anim(piece, 'pop', 500), 220);
          ctx.yes(target).then(resolve);
          return true;
        }
        ctx.no(hit.el);
        return false;
      },
    });
    ctx.prompt(turn ? `${cap(target)}! Tap it to turn it, then put it in its home.` : `${cap(target)}! Put the ${target} in its home.`);
  });
}

function centerOfEl(el) {
  return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
}

async function buildQuestion(ctx) {
  const L = ctx.level;
  const set = L === 3 ? SMALL : L === 4 ? BIG : HUGE;
  const pic = pick(set.filter((p) => p.name !== ctx.round.last));
  ctx.round.last = pic.name;
  const area = ctx.area;
  area.innerHTML = '';
  const many = pic.parts.length > 5;
  const CX = 640;
  const CY = many ? 330 : 310;
  const slots = pic.parts.map((p, i) => {
    const el = makeShapeEl('slot', p.s, 'rgba(255,255,255,0.55)', p.w, p.h, p.rot || 0, { stroke: '#8A6A4A', sw: 4, dash: '10 8' });
    el.style.zIndex = 2 * i + 1;
    area.append(el);
    placeAt(el, CX + p.x, CY + p.y);
    return { el, part: p, key: `${p.s}-${p.w}-${p.h}`, filled: false };
  });

  // Level 5: some pieces come turned the wrong way.
  const turned = new Set();
  if (L === 5) {
    const can = pic.parts.map((p, i) => i).filter((i) => canTurn(pic.parts[i]));
    for (const i of sample(can, pic.parts.length >= 10 ? 3 : 2)) turned.add(i);
  }

  const order = shuffle(pic.parts.map((p, i) => i));
  const rows = many ? 2 : 1;
  const perRow = Math.ceil(order.length / rows);
  const trayX0 = 300;
  const trayX1 = 1140;
  const step = (trayX1 - trayX0) / perRow;
  const maxDisp = many ? 92 : 120;
  const pieces = order.map((idx, j) => {
    const p = pic.parts[idx];
    const base = p.rot || 0;
    let rot = base;
    if (turned.has(idx)) {
      const ks = PERIOD[p.s] === 180 ? [1, 3] : [1, 2, 3];
      rot = (base + 90 * pick(ks)) % 360;
    }
    const el = makeShapeEl('piece build-piece pop-in', p.s, p.c, p.w, p.h, rot);
    const k = Math.min(1, maxDisp / Math.max(p.w, p.h));
    el.style.setProperty('--k', k);
    el.style.zIndex = 40;
    area.append(el);
    const row = Math.floor(j / perRow);
    const inRow = row === rows - 1 ? order.length - row * perRow : perRow;
    const x = (trayX0 + trayX1) / 2 + (j % perRow - (inRow - 1) / 2) * step;
    placeAt(el, x, many ? 640 + row * 102 : 690);
    return { el, rotEl: el.firstChild, key: `${p.s}-${p.w}-${p.h}`, part: p, idx, rot };
  });

  await ctx.prompt(L === 5 ? `Let's build ${pic.name}! Tap a piece to turn it.` : `Let's build ${pic.name}!`);
  return new Promise((resolve) => {
    let left = pieces.length;
    for (const pc of pieces) {
      draggable(pc.el, {
        onTap: () => {
          if (L !== 5 || pc.el.dataset.locked) return;
          pc.rot = (pc.rot + 90) % 360;
          pc.rotEl.style.transform = `rotate(${pc.rot}deg)`;
          sfx.rotate();
        },
        onDrop: (pt) => {
          const open = slots.filter((s) => !s.filled);
          // A free slot of the same shape and size, turned the same way. Parts may overlap.
          const fit = open.filter((s) => s.key === pc.key && rotOK(pc.part.s, pc.rot, s.part.rot || 0));
          const hit = nearest(pt, fit, 170);
          if (!hit) {
            if (nearest(pt, open, 120)) ctx.no(null);
            return false;
          }
          hit.filled = true;
          pc.el.dataset.locked = '1';
          pc.el.style.setProperty('--k', 1);
          pc.el.style.zIndex = 2 * slots.indexOf(hit) + 2;
          const c = centerOfEl(hit.el);
          moveTo(pc.el, c.x, c.y, 220);
          sfx.click();
          left--;
          if (left === 0) {
            setTimeout(async () => {
              for (const s of slots) s.el.style.opacity = 0;
              for (const q of pieces) anim(q.el, 'pop', 600);
              await ctx.yes(pic.name);
              resolve();
            }, 300);
          } else {
            ctx.say(cap(pc.part.s) + '!');
          }
          return true;
        },
      });
    }
  });
}

export default {
  id: 'shapes',
  title: 'Shape it',
  titleId: 'Puzzle Bentuk',
  card: '#F0E4FF',
  art: 'shapes',

  startRound(ctx) {
    ctx.setPlace('table');
    ctx.round = { last: null };
  },

  async question(ctx) {
    await sleep(100);
    return ctx.level >= 3 ? buildQuestion(ctx) : holeQuestion(ctx);
  },
};

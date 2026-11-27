// Count it! — tap each thing to count it, then tap the right number.
// Levels (DESAIN.md 7.6): 1 count 3-10, 2 add to 5, 3 count 11-20 and add to 10,
// 4 take away (the things really leave), 5 story problems with Moko, Gumi and Tobi.
import { h, pick, rand, shuffle, sample, sleep, anim, cap, placeAt, moveTo, NUM } from '../util.js';
import { picSVG, charSVG, CHARS } from '../art.js';
import { sfx } from '../sound.js';

// How things leave: up and away, or off to the right.
const AWAY = {
  fly: { one: 'flies away', many: 'fly away', dx: 320, dy: -640, r: -12 },
  swim: { one: 'swims away', many: 'swim away', dx: 1000, dy: 20, r: 0 },
  drive: { one: 'drives away', many: 'drive away', dx: 1100, dy: 0, r: 0 },
  run: { one: 'runs away', many: 'run away', dx: 1100, dy: -20, r: 0 },
  roll: { one: 'rolls away', many: 'roll away', dx: 1000, dy: 30, r: 540 },
  hop: { one: 'hops away', many: 'hop away', dx: 1000, dy: -90, r: 0 },
};

const OBJS = [
  { pic: 'apple', one: 'apple', many: 'apples', away: 'roll', food: true },
  { pic: 'duck', one: 'duck', many: 'ducks', away: 'fly' },
  { pic: 'ball', one: 'ball', many: 'balls', color: '#3A86FF', away: 'roll' },
  { pic: 'fish', one: 'fish', many: 'fish', away: 'swim' },
  { pic: 'car', one: 'car', many: 'cars', color: '#EF476F', away: 'drive' },
  { pic: 'banana', one: 'banana', many: 'bananas', food: true },
  { pic: 'strawberry', one: 'strawberry', many: 'strawberries', food: true },
  { pic: 'cat', one: 'cat', many: 'cats', away: 'run' },
  { pic: 'flower', one: 'flower', many: 'flowers' },
  { pic: 'bird', one: 'bird', many: 'birds', away: 'fly' },
  { pic: 'rabbit', one: 'rabbit', many: 'rabbits', away: 'hop' },
  { pic: 'balloon', one: 'balloon', many: 'balloons', color: '#FF8FB1', away: 'fly' },
];
const noun = (obj, n) => (n === 1 ? obj.one : obj.many);
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function scatter(n, box) {
  const w = box.x1 - box.x0;
  const hh = box.y1 - box.y0;
  const cols = Math.max(1, Math.ceil(Math.sqrt((n * w) / hh)));
  const rows = Math.ceil(n / cols);
  const cell = Math.min(w / cols, hh / rows);
  const size = Math.min(130, cell * 0.8);
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols;
    const col = i % cols;
    const x = box.x0 + w / 2 + (col - (inRow - 1) / 2) * cell + (Math.random() - 0.5) * cell * 0.16;
    const y = box.y0 + hh / 2 + (row - (rows - 1) / 2) * cell + (Math.random() - 0.5) * cell * 0.16;
    out.push({ x, y, size });
  }
  return out;
}

function choices(n, k, max) {
  const set = new Set([n]);
  for (const d of shuffle([1, -1, 2, -2, 3, -3, 4, -4])) {
    if (set.size >= k) break;
    const v = n + d;
    if (v >= 1 && v <= max) set.add(v);
  }
  for (let v = 1; set.size < k && v <= max; v++) set.add(v);
  return [...set].sort((a, b) => a - b);
}

function makeObj(area, obj, p, delay = 0, still = false) {
  const el = h('div', { class: `obj pop-in${still ? ' still' : ''}`, html: picSVG(obj.pic, obj.color), style: { width: p.size + 'px', height: p.size + 'px', animationDelay: delay + 'ms' } });
  area.append(el);
  placeAt(el, p.x, p.y);
  return { el, counted: false };
}

// The thing really leaves: it flies, swims, drives, runs, rolls or hops off and fades.
function leave(el, how, i) {
  const a = AWAY[how];
  el.classList.remove('pop-in');
  const go = el.animate(
    [{ transform: 'translate(0, 0) rotate(0deg)', opacity: 1 }, { offset: 0.75, opacity: 1 }, { transform: `translate(${a.dx}px, ${a.dy}px) rotate(${a.r}deg)`, opacity: 0 }],
    { duration: reduced() ? 250 : 1500, delay: reduced() ? 0 : i * 120, easing: 'ease-in', fill: 'forwards' });
  go.onfinish = () => el.remove();
}

// Eaten: a little squash, then gone.
function eaten(el, i) {
  el.classList.remove('pop-in');
  const go = el.animate(
    [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.15, .85)', opacity: 1, offset: 0.35 }, { transform: 'scale(0)', opacity: 0 }],
    { duration: reduced() ? 200 : 700, delay: reduced() ? 0 : i * 260, easing: 'ease-in', fill: 'forwards' });
  go.onfinish = () => el.remove();
}

// Number buttons along the bottom. Resolves when the right one is tapped.
function numberRow(ctx, n, max, obj, question) {
  return new Promise((resolve) => {
    const area = ctx.area;
    const nums = choices(n, 4, max);
    const bw = 124;
    const gap = 30;
    const total = nums.length * bw + (nums.length - 1) * gap;
    let busy = false;
    let done = false;
    nums.forEach((v, i) => {
      const btn = h('button', { class: 'num-btn pop-in', style: { width: bw + 'px', height: bw + 'px', animationDelay: i * 60 + 'ms' } }, String(v));
      area.append(btn);
      placeAt(btn, 660 - total / 2 + bw / 2 + i * (bw + gap), 690);
      btn.addEventListener('click', async () => {
        if (done || busy) return;
        busy = true;
        sfx.pop();
        await ctx.say(cap(NUM[v]) + '!');
        busy = false;
        if (!ctx.alive()) return;
        if (v === n) {
          done = true;
          btn.classList.add('right');
          anim(btn, 'pop', 500);
          await ctx.yes(`${NUM[n]} ${noun(obj, n)}`);
          resolve();
        } else {
          ctx.no(btn);
        }
      });
    });
    ctx.prompt(question);
  });
}

async function storyQuestion(ctx) {
  const area = ctx.area;
  area.innerHTML = '';
  const [wa, wb] = sample(['moko', 'gumi', 'tobi'], 2);
  const A = CHARS[wa].name;
  const B = CHARS[wb].name;
  const kinds = ['give', 'away', 'giveTo', 'eat'];
  const kind = kinds[(ctx.index + (ctx.round.shift || 0)) % kinds.length];
  const obj = pick(OBJS.filter((o) => (kind === 'away' ? o.away : kind === 'eat' ? o.food : true) && o.pic !== ctx.round.pic));
  ctx.round.pic = obj.pic;
  let a;
  let b;
  if (kind === 'give') { a = rand(2, 7); b = rand(1, Math.min(5, 10 - a)); }
  else { a = rand(4, 10); b = rand(1, Math.min(5, a - 1)); }
  const n = kind === 'give' ? a + b : a - b;
  const withB = kind === 'give' || kind === 'giveTo';

  const charA = h('div', { class: 'char story-char pop-in', html: charSVG(wa), style: { width: '170px', height: '204px' } });
  area.append(charA);
  placeAt(charA, 175, 330);
  let charB = null;
  if (withB) {
    charB = h('div', { class: 'char story-char pop-in', html: charSVG(wb), style: { width: '170px', height: '204px' } });
    area.append(charB);
    placeAt(charB, 1075, 330);
  }
  const boxA = { x0: 290, y0: 150, x1: withB ? 770 : 1120, y1: 540 };
  const boxB = { x0: 820, y0: 190, x1: 975, y1: 500 };
  const spotsA = scatter(kind === 'give' ? a + b : a, boxA);
  let objs = spotsA.slice(0, a).map((p, i) => makeObj(area, obj, p, i * 50, true));
  await sleep(300 + a * 50);
  anim(charA, 'jump', 600);
  await ctx.say(`${A} has ${NUM[a]} ${noun(obj, a)}.`);
  if (!ctx.alive()) return;

  if (kind === 'give') {
    const from = scatter(b, boxB);
    const late = spotsA.slice(a).map((p, i) => makeObj(area, obj, { ...from[i], size: p.size }, i * 60, true));
    anim(charB, 'jump', 600);
    const said = ctx.say(`${B} gives ${A} ${NUM[b]} more.`);
    await sleep(reduced() ? 100 : 900);
    sfx.whoosh();
    late.forEach((o, i) => setTimeout(() => moveTo(o.el, spotsA[a + i].x, spotsA[a + i].y, reduced() ? 10 : 800), i * 120));
    await said;
    objs = objs.concat(late);
  } else {
    const go = sample(objs, b);
    objs = objs.filter((o) => !go.includes(o));
    if (kind === 'giveTo') {
      const to = scatter(b, boxB);
      const said = ctx.say(`${A} gives ${NUM[b]} to ${B}.`);
      await sleep(reduced() ? 100 : 700);
      sfx.whoosh();
      go.forEach((o, i) => setTimeout(() => moveTo(o.el, to[i].x, to[i].y, reduced() ? 10 : 800), i * 120));
      await said;
      anim(charB, 'cheer', 1000);
    } else if (kind === 'away') {
      const how = AWAY[obj.away];
      sfx.whoosh();
      go.forEach((o, i) => leave(o.el, obj.away, i));
      await ctx.say(`${cap(NUM[b])} ${noun(obj, b)} ${b === 1 ? how.one : how.many}.`);
    } else {
      const said = ctx.say(`${A} eats ${NUM[b]} ${noun(obj, b)}.`);
      go.forEach((o, i) => { setTimeout(() => sfx.pop(), reduced() ? 0 : i * 260); eaten(o.el, i); });
      anim(charA, 'giggle', 600);
      await said;
    }
  }
  if (!ctx.alive()) return;
  await sleep(400);
  if (!ctx.alive()) return;
  return numberRow(ctx, n, 10, obj, `How many ${obj.many} does ${A} have now?`);
}

export default {
  id: 'count',
  title: 'Count it',
  titleId: 'Hitung & Ketuk',
  card: '#FFE3E3',
  art: 'count',

  startRound(ctx) {
    ctx.setPlace('candy');
    ctx.round = { last: 0, shift: rand(0, 3) };
  },

  async question(ctx) {
    const L = ctx.level;
    if (L >= 5) return storyQuestion(ctx);
    let mode = 'count';
    let n;
    let a = 0;
    let b = 0;
    let max;
    do {
      if (L === 1) { n = rand(3, 10); max = 10; }
      else if (L === 2) { mode = 'add'; a = rand(1, 4); b = rand(1, 5 - a); n = a + b; max = 6; }
      else if (L === 3 && ctx.index % 2 === 0) { mode = 'count'; n = rand(11, 20); max = 20; }
      else if (L === 3) { mode = 'add'; a = rand(2, 8); b = rand(1, 10 - a); n = a + b; max = 12; }
      else { mode = 'take'; a = rand(3, 10); b = rand(1, Math.min(5, a - 1)); n = a - b; max = 10; }
    } while (n === ctx.round.last);
    ctx.round.last = n;
    const obj = pick(mode === 'take' ? OBJS.filter((o) => o.away) : OBJS);
    const area = ctx.area;
    area.innerHTML = '';
    const make = (p, delay) => makeObj(area, obj, p, delay);

    let objs = [];
    if (mode === 'count') {
      objs = scatter(n, { x0: 210, y0: 130, x1: 1150, y1: 570 }).map((p, i) => make(p, i * 50));
      await sleep(300 + n * 50);
    } else if (mode === 'add') {
      const pa = scatter(a, { x0: 210, y0: 140, x1: 660, y1: 570 });
      const pb = scatter(b, { x0: 720, y0: 140, x1: 1150, y1: 570 });
      objs = pa.map((p, i) => make(p, i * 60));
      await sleep(250 + a * 60);
      await ctx.say(`${cap(NUM[a])} ${noun(obj, a)}.`);
      if (!ctx.alive()) return;
      sfx.whoosh();
      const late = pb.map((p) => {
        const o = make(p, 0);
        o.el.classList.remove('pop-in');
        o.el.classList.add('slide-in');
        return o;
      });
      objs = objs.concat(late);
      if (L === 3) area.append(h('div', { class: 'sum-label' }, `${a} + ${b}`));
      await ctx.say(`And ${NUM[b]} more!`);
      if (!ctx.alive()) return;
    } else {
      objs = scatter(a, { x0: 210, y0: 140, x1: 1150, y1: 570 }).map((p, i) => make(p, i * 50));
      await sleep(300 + a * 50);
      await ctx.say(`${cap(NUM[a])} ${noun(obj, a)}.`);
      if (!ctx.alive()) return;
      const go = sample(objs, b);
      objs = objs.filter((o) => !go.includes(o));
      sfx.whoosh();
      go.forEach((o, i) => leave(o.el, obj.away, i));
      const how = AWAY[obj.away];
      await ctx.say(`${cap(NUM[b])} ${b === 1 ? how.one : how.many}!`);
      if (!ctx.alive()) return;
      area.append(h('div', { class: 'sum-label' }, `${a} − ${b}`));
      await sleep(500);
      if (!ctx.alive()) return;
    }

    return new Promise((resolve) => {
      let counted = 0;
      let phase = 'count';
      objs.forEach((o) => {
        o.el.addEventListener('pointerdown', () => {
          if (phase !== 'count' || o.counted) return;
          o.counted = true;
          counted++;
          sfx.pop();
          o.el.classList.add('counted');
          o.el.append(h('div', { class: 'badge' }, String(counted)));
          anim(o.el, 'pop', 400);
          ctx.say(cap(NUM[counted]));
          if (counted === n) {
            phase = 'answer';
            ctx.clearPrompt();
            setTimeout(() => {
              if (ctx.alive()) numberRow(ctx, n, max, obj, `How many ${obj.many}${mode === 'count' ? '' : ' now'}?`).then(resolve);
            }, 900);
          }
        });
      });
      ctx.prompt(mode === 'add' ? `Let's count them all! Tap each ${obj.one}.` : `Let's count! Tap each ${obj.one}.`);
    });
  },
};

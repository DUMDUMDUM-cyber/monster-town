// Colour mixing — pour paints into the bowl and see the new colour (DESAIN.md 8.3).
// The first question of every round is free play: mix anything you like (two mixes).
// Levels: 1 make orange / green / purple (red, yellow, blue pots; mixes after two pours),
// 2 also pink, light blue, grey (white and black pots too), 3 make a colour, or "red and blue
// make...?" (pick the colour), 4 three-colour mixes (brown, light green...) — the child
// presses Mix when ready, 5 only three-colour mixes and three-colour questions.
import { h, sleep, pick, shuffle, sample, anim, placeAt, centerOf } from '../util.js';
import { icon } from '../art.js';
import { sfx } from '../sound.js';

export const PAINT = { red: '#EF476F', yellow: '#FFD166', blue: '#3A86FF', white: '#FFFFFF', black: '#3A3A48' };
const MIXES = {
  'red+yellow': ['orange', '#FF9542'],
  'blue+yellow': ['green', '#4FBF6A'],
  'blue+red': ['purple', '#9B6BE0'],
  'red+white': ['pink', '#FF9BB5'],
  'blue+white': ['light blue', '#9FD0FF'],
  'black+white': ['grey', '#A3A3AE'],
  'white+yellow': ['light yellow', '#FFF0A8'],
  'black+red': ['dark red', '#A02840'],
  'black+blue': ['dark blue', '#22408C'],
  'black+yellow': ['olive green', '#8C8A3A'],
  'blue+red+yellow': ['brown', '#9A6238'],
  'blue+white+yellow': ['light green', '#A8E6A0'],
  'blue+red+white': ['light purple', '#CDB8EC'],
  'red+white+yellow': ['peach', '#FFC29A'],
};
const keyOf = (set) => [...set].sort().join('+');
// What do these paints make? A single paint stays itself.
export function mixOf(set) {
  if (set.size === 1) { const c = [...set][0]; return [c, PAINT[c]]; }
  return MIXES[keyOf(set)] || ['a new colour', '#8E7A6A'];
}
const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const GOALS = {
  1: ['red+yellow', 'blue+yellow', 'blue+red'],
  2: ['red+yellow', 'blue+yellow', 'blue+red', 'red+white', 'blue+white', 'black+white'],
  3: ['red+yellow', 'blue+yellow', 'blue+red', 'red+white', 'blue+white', 'black+white', 'white+yellow'],
  4: ['blue+red+yellow', 'blue+white+yellow', 'blue+red+white', 'red+white+yellow', 'red+white', 'blue+white', 'black+white', 'blue+red'],
  5: ['blue+red+yellow', 'blue+white+yellow', 'blue+red+white', 'red+white+yellow'],
};

const potSVG = (c) => `<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true"><path d="M20 30 H80 L76 96 Q75 104 66 104 H34 Q25 104 24 96 Z" fill="#FFFBF2" stroke="#A08062" stroke-width="3.5"/><path d="M24 50 H76 L74 94 Q73 100 66 100 H34 Q27 100 26 94 Z" fill="${c}" stroke="${c === '#FFFFFF' ? '#D8D2C6' : 'none'}" stroke-width="2"/><rect x="14" y="18" width="72" height="16" rx="7" fill="${c}" stroke="#A08062" stroke-width="3.5"/><path d="M32 60 V88" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/></svg>`;
const bowlSVG = `<svg viewBox="0 0 240 150" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><ellipse cx="120" cy="142" rx="86" ry="8" fill="#5A3E22" opacity=".15"/><path d="M10 40 Q14 140 120 140 Q226 140 230 40 Z" fill="#E7F2FA" stroke="#7FA6C2" stroke-width="5"/><ellipse class="mix-paint" cx="120" cy="44" rx="104" ry="20" fill="#E7F2FA"/><ellipse cx="120" cy="40" rx="110" ry="22" fill="none" stroke="#7FA6C2" stroke-width="5"/><path d="M34 70 Q40 110 80 124" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".6"/></svg>`;

export default {
  id: 'mix',
  title: 'Mix colours',
  titleId: 'Campur Warna',
  card: '#FFE1EC',
  art: 'mix',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('playroom');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    if (ctx.index === 0) return board(ctx, null);
    if (L === 3 && Math.random() < 0.5) return askResult(ctx, 2);
    if (L === 5 && Math.random() < 0.4) return askResult(ctx, 3);
    const goal = pick(GOALS[L].filter((g) => g !== ctx.round.last));
    ctx.round.last = goal;
    return board(ctx, goal);
  },
};

// The paint table: pots on a shelf, a big bowl in the middle.
function board(ctx, goal) {
  const L = ctx.level;
  const free = !goal;
  const names = L === 1 ? ['red', 'yellow', 'blue'] : ['red', 'yellow', 'blue', 'white', 'black'];
  const auto = L <= 3; // mixes on its own after two pours
  const bowl = h('div', { class: 'mix-bowl', html: bowlSVG });
  ctx.area.append(bowl);
  placeAt(bowl, 640, 520);
  const paintEl = bowl.querySelector('.mix-paint');
  let goalEl = null;
  if (goal) {
    const [gName, gCol] = MIXES[goal];
    goalEl = h('div', { class: 'mix-goal pop-in' }, h('div', { class: 'mix-blob', style: { background: gCol } }), h('span', null, '?'));
    ctx.area.append(goalEl);
    placeAt(goalEl, 1075, 250);
    goalEl.addEventListener('click', () => ctx.say(`Make ${gName}!`));
  }
  const pots = names.map((n, i) => {
    const pot = h('button', { class: 'mix-pot pop-in', 'aria-label': n, html: potSVG(PAINT[n]), style: { animationDelay: i * 70 + 'ms' } });
    ctx.area.append(pot);
    placeAt(pot, 590 + (i - (names.length - 1) / 2) * 142, 250);
    return [n, pot];
  });
  const mixBtn = h('button', { class: 'mix-btn', 'aria-label': 'Mix', html: icon('replay', 52, 3.2) });
  const emptyBtn = h('button', { class: 'mix-empty', 'aria-label': 'Empty the bowl', html: icon('close', 40, 3.4) });
  ctx.area.append(mixBtn, emptyBtn);
  placeAt(mixBtn, 900, 560);
  placeAt(emptyBtn, 380, 560);
  let poured = new Set();
  let busy = false;
  let mixes = 0;
  const show = () => {
    paintEl.setAttribute('fill', poured.size ? mixOf(poured)[1] : '#E7F2FA');
    paintEl.classList.toggle('streaky', poured.size > 1);
    mixBtn.classList.toggle('on', !auto && poured.size >= 2);
    emptyBtn.classList.toggle('on', poured.size > 0);
  };
  const reset = () => { poured = new Set(); show(); };
  show();
  return new Promise((resolve) => {
    const finish = async () => {
      busy = true;
      bowl.classList.add('stir');
      sfx.whoosh();
      await sleep(900);
      bowl.classList.remove('stir');
      paintEl.classList.remove('streaky');
      const parts = [...poured];
      const [made] = mixOf(poured);
      ctx.burst(640, 470, 10, 160);
      if (free) {
        mixes++;
        sfx.ting();
        await ctx.say(`${cap(andList(parts))} make ${made}!`);
        if (mixes >= 2) { await ctx.yes('What a lovely mix'); resolve(); return; }
        reset();
        busy = false;
        return;
      }
      if (keyOf(poured) === goal) {
        goalEl.querySelector('span').textContent = '';
        goalEl.classList.add('right');
        anim(goalEl, 'pop', 500);
        await ctx.yes(`${cap(andList(parts))} make ${made}`, { x: 640, y: 470 });
        resolve();
        return;
      }
      await ctx.no(bowl, `${cap(andList(parts))} make ${made}. Try again!`);
      reset();
      busy = false;
    };
    for (const [n, pot] of pots) {
      pot.addEventListener('click', async () => {
        if (busy) return;
        if (poured.has(n) || poured.size >= 3) { anim(pot, 'wiggle', 400); return; }
        busy = true;
        sfx.pop();
        // The pot flies over the bowl and tips; a stream of paint falls into the bowl.
        const c = centerOf(pot);
        pot.style.setProperty('--dx', 575 - c.x + 'px');
        pot.style.setProperty('--dy', 360 - c.y + 'px');
        pot.classList.add('pour');
        ctx.say(n);
        await sleep(420);
        const stream = h('div', { class: 'mix-stream', style: { background: PAINT[n], left: '643px', top: '384px' } });
        ctx.area.append(stream);
        await sleep(520);
        stream.classList.add('end');
        pot.classList.remove('pour');
        setTimeout(() => stream.remove(), 300);
        poured.add(n);
        show();
        busy = false;
        if (auto && poured.size === 2) finish();
      });
    }
    mixBtn.addEventListener('click', () => { if (!busy && poured.size >= 2) finish(); });
    emptyBtn.addEventListener('click', () => { if (!busy && poured.size) { sfx.whoosh(); reset(); } });
    ctx.prompt(free ? 'Mix any colours you like! Tap two paints.'
      : `Make ${MIXES[goal][0]}!${auto ? '' : ' Then press Mix.'}`);
  });
}

// "Red and blue make...?" — tap the right colour.
function askResult(ctx, n) {
  const goals = Object.keys(MIXES).filter((k) => k.split('+').length === n && !k.includes('black'));
  const goal = pick(goals.filter((g) => g !== ctx.round.last));
  ctx.round.last = goal;
  const [name, col] = MIXES[goal];
  const parts = goal.split('+');
  const row = h('div', { class: 'mix-sum pop-in' });
  parts.forEach((p, i) => {
    if (i) row.append(h('span', { class: 'mix-plus' }, '+'));
    row.append(h('div', { class: 'mix-blob', style: { background: PAINT[p] } }));
  });
  row.append(h('span', { class: 'mix-plus' }, '='), h('div', { class: 'mix-blob mix-q' }, '?'));
  ctx.area.append(row);
  placeAt(row, 640, 260);
  const others = sample(Object.values(MIXES).filter(([nm]) => nm !== name), 3);
  const options = shuffle([[name, col], ...others]);
  return new Promise((resolve) => {
    let done = false;
    options.forEach(([nm, c], i) => {
      const b = h('button', { class: 'card mix-choice pop-in', 'aria-label': nm, style: { animationDelay: i * 80 + 'ms' } }, h('div', { class: 'mix-blob big', style: { background: c } }));
      ctx.area.append(b);
      placeAt(b, 640 + (i - 1.5) * 200, 540);
      b.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (nm === name) {
          done = true;
          b.classList.add('right');
          const q = row.querySelector('.mix-q');
          q.textContent = '';
          q.style.background = col;
          await ctx.yes(`${cap(andList(parts))} make ${name}`);
          resolve();
        } else {
          ctx.no(b, `That is ${nm}. Try again!`);
        }
      });
    });
    ctx.prompt(`${cap(andList(parts))} make...?`);
  });
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

// Monster shop — pay for things with coins (DESAIN.md 8.4).
// Levels: 1 prices 1-3 with 1-coins, 2 prices 3-6 with 1-coins, 3 prices 3-8 with 1- and
// 2-coins, 4 prices 6-10 with 1-, 2- and 5-coins, 5 two things: how much for both?
import { h, pick, shuffle, sample, anim, placeAt, NUM } from '../util.js';
import { picSVG, icon } from '../art.js';
import { sfx } from '../sound.js';

const THINGS = ['apple', 'banana', 'egg', 'milk', 'bread', 'cake', 'cheese', 'strawberry', 'orange', 'grapes', 'carrot', 'watermelon', 'ball', 'teddy bear', 'balloon', 'book', 'car', 'doll'];
const COIN = {
  1: { fill: '#F2B45A', line: '#B77A2A', size: 76 },
  2: { fill: '#FFD43B', line: '#C9952C', size: 92 },
  5: { fill: '#CBD5E6', line: '#7D8AA6', size: 108 },
};
export const coinSVG = (v) => {
  const c = COIN[v];
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><circle cx="50" cy="52" r="44" fill="${c.line}"/><circle cx="50" cy="48" r="44" fill="${c.fill}" stroke="${c.line}" stroke-width="4"/><circle cx="50" cy="48" r="33" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/><text x="50" y="64" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-size="46" font-weight="700" fill="${c.line}">${v}</text><ellipse cx="34" cy="26" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 34 26)"/></svg>`;
};
const coins = (p) => `${NUM[p]} ${p === 1 ? 'coin' : 'coins'}`;

function thingCard(ctx, name, price, x, y, s = 240) {
  const card = h('div', { class: 'card pic-card shop-thing pop-in', style: { width: s + 'px', height: s + 'px' } },
    h('div', { class: 'pic', html: picSVG(name), style: { width: '78%', height: '78%' } }),
    h('div', { class: 'shop-tag' }, h('span', { class: 'shop-tag-coin', html: coinSVG(1) }), h('b', null, String(price))));
  ctx.area.append(card);
  placeAt(card, x, y);
  return card;
}

export default {
  id: 'shop',
  title: 'Monster shop',
  titleId: 'Toko Monster',
  card: '#FFE6C7',
  art: 'shop',

  startRound(ctx) {
    ctx.round = { last: null, told: false };
    ctx.setPlace('kitchen');
  },

  question(ctx) {
    ctx.area.innerHTML = '';
    if (ctx.level >= 5) return both(ctx);
    return pay(ctx);
  },
};

function pay(ctx) {
  const L = ctx.level;
  const [lo, hi] = [[1, 3], [3, 6], [3, 8], [6, 10]][L - 1];
  const kinds = L >= 4 ? [1, 2, 5] : L === 3 ? [1, 2] : [1];
  const name = pick(THINGS.filter((t) => t !== ctx.round.last));
  ctx.round.last = name;
  const price = lo + Math.floor(Math.random() * (hi - lo + 1));
  const thing = thingCard(ctx, name, price, 470, 300);
  const tray = h('div', { class: 'shop-tray pop-in' });
  const undo = h('button', { class: 'shop-undo', 'aria-label': 'Take the coins back', html: icon('back', 40, 3.2) });
  ctx.area.append(tray, undo);
  placeAt(tray, 870, 300);
  placeAt(undo, 1080, 410);
  const ok = h('button', { class: 'clk-ok pop-in', 'aria-label': 'Pay', html: icon('check', 64, 3.4) });
  ctx.area.append(ok);
  placeAt(ok, 1060, 615);
  // The coins in the tray: tap one to take it back. Nothing is checked until the child taps OK.
  let paid = [];
  const total = () => paid.reduce((a, b) => a + b.v, 0);
  const clear = () => { paid = []; tray.innerHTML = ''; };
  return new Promise((resolve) => {
    let done = false;
    let wrong = 0;
    undo.addEventListener('click', () => { if (!done && paid.length) { sfx.whoosh(); clear(); } });
    ok.addEventListener('click', async () => {
      if (done) return;
      sfx.pop();
      anim(ok, 'press', 300);
      const t = total();
      if (t === price) {
        done = true;
        thing.classList.add('right');
        await ctx.yes(`That's ${coins(price)}`, { x: 870, y: 300 });
        resolve();
        return;
      }
      wrong++;
      if (!t) ctx.no(tray, `Put some coins on the plate first!`);
      else if (t > price) ctx.no(tray, `That's ${coins(t)}. Too many! Tap a coin to take it back.`);
      else ctx.no(tray, `That's ${coins(t)}. We need ${coins(price)}. Add more!`);
      if (wrong >= 3 && kinds.length > 1) ctx.say(`It costs ${coins(price)}. Count carefully!`);
    });
    const x0 = 640 - ((kinds.length - 1) * 170) / 2;
    kinds.forEach((v, i) => {
      const s = COIN[v].size + 30;
      const btn = h('button', { class: 'shop-coin pop-in', 'aria-label': coins(v), html: coinSVG(v), style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } });
      ctx.area.append(btn);
      placeAt(btn, x0 + i * 170, 620);
      btn.addEventListener('click', () => {
        if (done || paid.length >= 14) return;
        sfx.click();
        anim(btn, 'press', 300);
        const c = h('button', { class: 'shop-paid pop-in', 'aria-label': `Take back ${coins(v)}`, html: coinSVG(v), style: { width: COIN[v].size * 0.7 + 'px', height: COIN[v].size * 0.7 + 'px' } });
        const item = { v, el: c };
        paid.push(item);
        tray.append(c);
        c.addEventListener('click', () => {
          if (done) return;
          sfx.whoosh();
          paid = paid.filter((x) => x !== item);
          c.remove();
        });
      });
    });
    let text = `The ${name} costs ${coins(price)}. Put ${coins(price)} on the plate, then press OK!`;
    if (kinds.length > 1 && !ctx.round.told) {
      ctx.round.told = true;
      text += kinds.includes(5) ? ' A big coin is five!' : ' A big coin is two!';
    }
    ctx.prompt(text);
  });
}

// Two things: add the prices.
function both(ctx) {
  const [a, b] = sample(THINGS, 2);
  const pa = 1 + Math.floor(Math.random() * 5);
  const pb = 1 + Math.floor(Math.random() * 5);
  const sum = pa + pb;
  thingCard(ctx, a, pa, 470, 290, 220);
  thingCard(ctx, b, pb, 810, 290, 220);
  const plus = h('div', { class: 'shop-plus' }, '+');
  ctx.area.append(plus);
  placeAt(plus, 640, 290);
  const opts = new Set([sum]);
  while (opts.size < 3) {
    const o = sum + pick([-2, -1, 1, 2]);
    if (o >= 2 && o <= 10) opts.add(o);
  }
  return new Promise((resolve) => {
    let done = false;
    shuffle([...opts]).forEach((o, i) => {
      const btn = h('button', { class: 'num-btn pop-in', style: { width: '130px', height: '130px', animationDelay: i * 80 + 'ms' } }, String(o));
      ctx.area.append(btn);
      placeAt(btn, 480 + i * 170, 590);
      btn.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (o === sum) {
          done = true;
          btn.classList.add('right');
          await ctx.yes(`${NUM[pa]} and ${NUM[pb]} make ${NUM[sum]}`);
          resolve();
        } else {
          ctx.no(btn);
        }
      });
    });
    ctx.prompt(`The ${a} costs ${NUM[pa]}, and the ${b} costs ${NUM[pb]}. How many coins for both?`);
  });
}

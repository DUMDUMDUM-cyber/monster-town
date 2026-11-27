// Memory cards — turn two cards over, find the pairs (DESAIN.md 8.2).
// Levels: 1 three pairs, 2 four pairs, 3 five pairs, 4 six pairs of a number and that many
// things, 5 six pairs where the colour must match too (same picture in different colours).
// A board counts as "right first time" when there were no more wrong turns than pairs.
import { h, sleep, pick, shuffle, sample, anim, placeAt } from '../util.js';
import { picSVG } from '../art.js';
import { sfx } from '../sound.js';

const PICS = ['dog', 'cat', 'fish', 'duck', 'pig', 'frog', 'lion', 'apple', 'banana', 'carrot', 'cake', 'ball', 'car', 'teddy bear', 'book', 'balloon', 'flower', 'butterfly', 'plane', 'crab'];
const COUNTABLE = ['apple', 'ball', 'fish', 'flower', 'duck', 'balloon'];
const COLORABLE = ['ball', 'car', 'book', 'cup', 'shoe', 'hat', 'balloon', 'sock'];
const COLORS = { red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0' };
const NUM_COLOR = ['#4C8DF0', '#E85D6A', '#3FB58A', '#FF9542', '#9B6BE0', '#E86FA0'];

const BACK = `<svg viewBox="0 0 100 100" width="62%" height="62%" aria-hidden="true"><path d="M50 8 L61 37 L92 38 L67 57 L76 88 L50 70 L24 88 L33 57 L8 38 L39 37 Z" fill="#E6DAFF" stroke="#7A5CC8" stroke-width="4" stroke-linejoin="round"/></svg>`;

// n small pictures in a neat little grid (a card with "3 apples").
export function manySVG(word, n) {
  const spots = {
    1: [[50, 50]], 2: [[28, 50], [72, 50]], 3: [[28, 32], [72, 32], [50, 72]], 4: [[28, 30], [72, 30], [28, 72], [72, 72]],
    5: [[24, 26], [76, 26], [50, 50], [24, 76], [76, 76]], 6: [[24, 28], [50, 28], [76, 28], [24, 72], [50, 72], [76, 72]],
  }[n];
  const s = n <= 2 ? 44 : n <= 4 ? 38 : 30;
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${spots.map(([x, y]) => `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 100 100" overflow="visible">${picSVG(word).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`).join('')}</svg>`;
}
const numSVG = (n) => `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><text x="50" y="74" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-size="74" font-weight="700" fill="${NUM_COLOR[n - 1]}" stroke="#5A4632" stroke-width="2.5" paint-order="stroke">${n}</text></svg>`;

// Cards for one board: [{ key, html, say }], each key twice.
function makeBoard(L, ctx) {
  const small = ctx.index < 2;
  if (L === 4) {
    const nums = shuffle([1, 2, 3, 4, 5, 6]).slice(0, small ? 5 : 6);
    const word = pick(COUNTABLE);
    return nums.flatMap((n) => [
      { key: n, html: numSVG(n), say: String(n) },
      { key: n, html: manySVG(word, n), say: String(n) },
    ]);
  }
  if (L === 5) {
    const words = sample(COLORABLE, 2);
    const cols = sample(Object.keys(COLORS), 3);
    const kinds = words.flatMap((w) => cols.map((c) => ({ key: `${c} ${w}`, html: picSVG(w, COLORS[c]), say: `${c} ${w}` })));
    const use = small ? kinds.slice(0, 5) : kinds;
    return use.flatMap((k) => [k, { ...k }]);
  }
  const pairs = L === 1 ? 3 : L === 2 ? 4 : small ? 4 : 5;
  return sample(PICS, pairs).flatMap((w) => [{ key: w, html: picSVG(w), say: w }, { key: w, html: picSVG(w), say: w }]);
}

function layout(n) {
  const cols = n <= 6 ? 3 : n <= 8 ? 4 : n <= 10 ? 5 : 4;
  const rows = Math.ceil(n / cols);
  const s = rows >= 3 ? 150 : 172;
  const gap = rows >= 3 ? 20 : 28;
  const x0 = 650 - ((cols - 1) * (s + gap)) / 2;
  const y0 = (rows >= 3 ? 425 : 440) - ((rows - 1) * (s + gap)) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + (i % cols) * (s + gap), y: y0 + Math.floor(i / cols) * (s + gap), s }));
}

export default {
  id: 'memory',
  title: 'Memory',
  titleId: 'Kartu Memori',
  card: '#EDE4FF',
  art: 'memory',

  startRound(ctx) {
    ctx.setPlace('sea');
  },

  question(ctx) {
    const L = ctx.level;
    const cards = shuffle(makeBoard(L, ctx));
    const spots = layout(cards.length);
    const pairs = cards.length / 2;
    ctx.area.innerHTML = '';
    return new Promise((resolve) => {
      let open = [];
      let busy = false;
      let found = 0;
      let wrong = 0;
      cards.forEach((c, i) => {
        const { x, y, s } = spots[i];
        const el = h('button', { class: 'mem-card pop-in', 'aria-label': 'card', style: { width: s + 'px', height: s + 'px', animationDelay: i * 50 + 'ms' } },
          h('div', { class: 'mem-in' },
            h('div', { class: 'mem-face mem-back', html: BACK }),
            h('div', { class: 'mem-face mem-front' }, h('div', { class: 'pic', html: c.html }))));
        ctx.area.append(el);
        placeAt(el, x, y);
        el.addEventListener('click', async () => {
          if (busy || el.classList.contains('open')) return;
          sfx.pop();
          el.classList.add('open');
          open.push({ el, c });
          if (open.length < 2) return;
          const [a, b] = open;
          open = [];
          if (a.c.key === b.c.key) {
            a.el.classList.add('done');
            b.el.classList.add('done');
            found++;
            sfx.ting();
            ctx.burst(b.el.offsetLeft + s / 2, b.el.offsetTop + s / 2, 8, 120);
            anim(a.el, 'pop', 500);
            anim(b.el, 'pop', 500);
            if (found >= pairs) {
              busy = true;
              if (wrong > pairs) ctx.miss();
              await sleep(400);
              await ctx.yes('You found them all', { x: 650, y: 420 });
              resolve();
            } else {
              ctx.say(L === 5 ? cap(a.c.say) : L === 4 ? `${a.c.say}!` : `Two ${plural(a.c.say)}!`);
            }
          } else {
            wrong++;
            busy = true;
            await sleep(900);
            a.el.classList.remove('open');
            b.el.classList.remove('open');
            busy = false;
          }
        });
      });
      const ask = L === 4 ? 'Match each number with the right group!'
        : L === 5 ? 'Find the pairs. The colour must match too!'
          : 'Turn over two cards. Find the pairs!';
      ctx.prompt(ask);
    });
  },
};

function cap(s) { return s[0].toUpperCase() + s.slice(1) + '!'; }
function plural(w) {
  if (w === 'fish') return 'fish';
  if (w === 'butterfly') return 'butterflies';
  if (w === 'teddy bear') return 'teddy bears';
  return w.endsWith('s') ? w : w + 's';
}

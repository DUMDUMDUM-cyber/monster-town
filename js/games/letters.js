// Letters A–Z — find letters, big and little letters, first sounds, build words (DESAIN.md 8.3).
// Levels: 1 find the letter (3 big letters), 2 find the little letter that goes with a big one
// (4 choices), 3 which letter does the picture start with? (4 choices, mixed-up look-alikes
// such as b/d), 4 build a three-letter word (cat, dog...) from tiles, 5 build a four-letter word
// (fish, duck...) with more wrong tiles.
import { h, sleep, pick, shuffle, sample, anim, placeAt } from '../util.js';
import { picSVG } from '../art.js';
import { sfx } from '../sound.js';

// One picture word per letter (its usual first sound).
const WORD = { A: 'apple', B: 'ball', C: 'cat', D: 'dog', E: 'egg', F: 'fish', G: 'grapes', H: 'hat', L: 'lion', M: 'milk', O: 'orange', P: 'pig', R: 'rabbit', S: 'sock', T: 'teddy bear' };
const LETTERS = Object.keys(WORD);
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOOKALIKE = { b: ['d', 'p', 'q'], d: ['b', 'p', 'q'], p: ['q', 'b', 'd'], m: ['n', 'w'], n: ['m', 'h', 'u'], h: ['n', 'b'], a: ['o', 'e', 'd'], e: ['c', 'a', 'o'], c: ['e', 'o'], o: ['c', 'a'], g: ['q', 'p'], f: ['t', 'l'], t: ['f', 'l'], l: ['i', 't'], r: ['n', 'v'], s: ['z', 'c'] };
const SHORT = ['cat', 'dog', 'pig', 'cow', 'car', 'cup', 'hat', 'egg', 'bed'];
const LONG = ['fish', 'frog', 'duck', 'ball', 'cake', 'bird', 'book', 'lion', 'doll', 'shoe', 'sock', 'milk', 'crab'];
const COLS = ['#4C8DF0', '#E85D6A', '#3FB58A', '#FF9542', '#9B6BE0', '#E86FA0', '#2FA7C9'];
const colOf = (ch) => COLS[ch.toUpperCase().charCodeAt(0) % COLS.length];

const letterBtn = (ch, size, i) => h('button', { class: 'card ltr-card pop-in', 'aria-label': ch, style: { width: size + 'px', height: size + 'px', fontSize: size * 0.62 + 'px', color: colOf(ch), animationDelay: i * 70 + 'ms' } }, ch);

export default {
  id: 'letters',
  title: 'Letters',
  titleId: 'Huruf A–Z',
  card: '#E3F0FF',
  art: 'letters',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('table');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    if (L <= 3) return choose(ctx);
    return build(ctx, L === 4 ? SHORT : LONG, L === 4 ? 2 : 3);
  },
};

function choose(ctx) {
  const L = ctx.level;
  const T = pick(LETTERS.filter((x) => x !== ctx.round.last));
  ctx.round.last = T;
  const word = WORD[T];
  let options;
  let target;
  let text;
  let praise;
  if (L === 1) {
    target = T;
    options = shuffle([T, ...sample(ALPHA.filter((x) => x !== T), 2)]);
    text = `Find the letter ${T}! ${T}, like ${word}.`;
    praise = `${T}, like ${word}`;
  } else if (L === 2) {
    target = T.toLowerCase();
    const look = LOOKALIKE[target] || [];
    const pool = [...look, ...sample(ALPHA.map((x) => x.toLowerCase()).filter((x) => x !== target && !look.includes(x)), 3)];
    options = shuffle([target, ...pool.slice(0, 3)]);
    text = `This is big ${T}. Find little ${target}!`;
    praise = `Big ${T}, little ${target}`;
  } else {
    // Level 3: picture first, then which letter it starts with. Big or little letters.
    const small = Math.random() < 0.5;
    target = small ? T.toLowerCase() : T;
    const look = small ? (LOOKALIKE[target] || []) : [];
    const pool = [...look, ...sample(ALPHA.filter((x) => x !== T).map((x) => (small ? x.toLowerCase() : x)).filter((x) => x !== target && !look.includes(x)), 3)];
    options = shuffle([target, ...pool.slice(0, 3)]);
    text = `${cap(word)} starts with...?`;
    praise = `${cap(word)} starts with ${T}`;
  }
  // Left side: the big letter (level 2) or the picture (level 3).
  if (L >= 2) {
    const side = L === 2
      ? h('div', { class: 'ltr-show pop-in', style: { color: colOf(T) } }, T)
      : h('div', { class: 'ltr-show pop-in' }, h('div', { class: 'pic', html: picSVG(word) }));
    ctx.area.append(side);
    placeAt(side, 330, 410);
    side.addEventListener('click', () => ctx.say(text));
  }
  const n = options.length;
  const s = n === 3 ? 220 : 170;
  const gap = n === 3 ? 50 : 26;
  const cx = L >= 2 ? 800 : 640;
  const x0 = cx - ((n - 1) * (s + gap)) / 2;
  return new Promise((resolve) => {
    let done = false;
    options.forEach((ch, i) => {
      const b = letterBtn(ch, s, i);
      ctx.area.append(b);
      placeAt(b, x0 + i * (s + gap), 410);
      b.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (ch === target) {
          done = true;
          b.classList.add('right');
          await ctx.yes(praise);
          resolve();
        } else {
          ctx.no(b, `That is ${ch}. Try again!`);
        }
      });
    });
    ctx.prompt(text);
  });
}

// Spell the word: tap the letters in order. Each tile goes into the next box.
function build(ctx, words, extra) {
  const word = pick(words.filter((w) => w !== ctx.round.last));
  ctx.round.last = word;
  const letters = word.toUpperCase().split('');
  const pic = h('div', { class: 'ltr-show pop-in' }, h('div', { class: 'pic', html: picSVG(word) }));
  ctx.area.append(pic);
  placeAt(pic, 300, 330);
  const bs = 120;
  const slots = letters.map((_, i) => {
    const sl = h('div', { class: 'ltr-slot' });
    ctx.area.append(sl);
    placeAt(sl, 560 + i * (bs + 16) + bs / 2, 330);
    return sl;
  });
  const decoys = sample(ALPHA.filter((x) => !letters.includes(x)), extra);
  const tiles = shuffle([...letters.map((c, i) => ({ c, i })), ...decoys.map((c) => ({ c, i: -1 }))]);
  const ts = tiles.length > 6 ? 106 : 118;
  const tg = tiles.length > 6 ? 16 : 20;
  const tx0 = 640 - ((tiles.length - 1) * (ts + tg)) / 2;
  return new Promise((resolve) => {
    let at = 0;
    let done = false;
    tiles.forEach((t, k) => {
      const b = letterBtn(t.c, ts, k);
      ctx.area.append(b);
      placeAt(b, tx0 + k * (ts + tg), 590);
      b.addEventListener('click', async () => {
        if (done || b.classList.contains('used')) return;
        if (t.c === letters[at]) {
          sfx.ting();
          b.classList.add('used');
          const sl = slots[at];
          sl.textContent = t.c;
          sl.style.color = colOf(t.c);
          sl.classList.add('filled');
          anim(sl, 'pop', 400);
          at++;
          if (at >= letters.length) {
            done = true;
            await sleep(300);
            await ctx.yes(`${letters.join(', ')}... ${word}`, { x: 700, y: 330 });
            resolve();
          } else {
            ctx.say(t.c);
          }
        } else {
          sfx.pop();
          ctx.no(b, at === 0 ? `${cap(word)} starts with ${letters[0]}...` : 'Try again!');
        }
      });
    });
    ctx.prompt(`Let's spell ${word}! ${word}...`);
    pic.addEventListener('click', () => ctx.say(word));
  });
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

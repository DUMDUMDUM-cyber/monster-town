// Which one is different? — tap the one that does not belong (DESAIN.md 8.2).
// Levels: 1 three the same and one other picture, 2 one has another colour or size,
// 3 groups (three animals and one food), 4 five cards with a harder group (things that
// fly, live in water, you can wear, you can eat), 5 one card has a different number of things.
import { h, pick, shuffle, sample, placeAt } from '../util.js';
import { picSVG } from '../art.js';
import { sfx } from '../sound.js';
import { manySVG } from './memory.js';

const COLORS = { red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0' };
const PICS = ['dog', 'cat', 'fish', 'duck', 'pig', 'frog', 'lion', 'apple', 'banana', 'carrot', 'cake', 'ball', 'car', 'teddy bear', 'book', 'balloon', 'flower', 'plane'];
const COLORABLE = ['ball', 'car', 'book', 'cup', 'shoe', 'hat', 'balloon', 'sock', 'flower'];
const KINDS = [
  { id: 'animal', words: ['dog', 'cat', 'cow', 'pig', 'rabbit', 'horse', 'sheep', 'lion', 'frog', 'duck'], not: 'an animal' },
  { id: 'food', words: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'carrot', 'bread', 'cake', 'cheese', 'egg'], not: 'food' },
  { id: 'toy', words: ['ball', 'car', 'teddy bear', 'doll', 'book', 'balloon'], not: 'a toy' },
];
const GROUPS = [
  { id: 'fly', words: ['bird', 'duck', 'butterfly', 'plane'], odd: ['dog', 'cat', 'pig', 'cow', 'fish', 'horse'], why: (w) => `The ${w} can't fly` },
  { id: 'water', words: ['fish', 'crab', 'duck', 'frog'], odd: ['dog', 'cat', 'lion', 'horse', 'sheep', 'rabbit'], why: (w) => `The ${w} doesn't live in water` },
  { id: 'wear', words: ['hat', 'shoe', 'shirt', 'sock'], odd: ['ball', 'car', 'book', 'cup', 'spoon', 'chair'], why: (w) => `You can't wear a ${w}` },
  { id: 'eat', words: ['apple', 'banana', 'bread', 'cake', 'cheese', 'carrot'], odd: ['ball', 'book', 'shoe', 'spoon', 'car', 'sock'], why: (w) => `You can't eat a ${w}` },
];
const COUNTABLE = ['apple', 'ball', 'fish', 'flower', 'duck', 'balloon', 'car', 'cake'];

// { cards: [{ html, size?, odd? }], praise }
function make(L, ctx) {
  const round = ctx.round;
  if (L === 1) {
    const [a, b] = sample(PICS, 2);
    return { cards: [{ html: picSVG(a) }, { html: picSVG(a) }, { html: picSVG(a) }, { html: picSVG(b), odd: true }], praise: `The ${b}` };
  }
  if (L === 2) {
    const w = pick(COLORABLE);
    const [c1, c2] = sample(Object.keys(COLORS), 2);
    const bySize = Math.random() < 0.4;
    const same = () => ({ html: picSVG(w, COLORS[c1]) });
    const odd = bySize ? { html: picSVG(w, COLORS[c1]), size: pick([46, 100]), odd: true } : { html: picSVG(w, COLORS[c2]), odd: true };
    return { cards: [same(), same(), same(), same(), odd].slice(ctx.index < 2 ? 1 : 0), praise: bySize ? `This ${w} is a different size` : `The ${c2} ${w}` };
  }
  if (L === 3) {
    const [g, o] = sample(KINDS.filter((k) => k.id !== round.last), 2);
    round.last = g.id;
    const ws = sample(g.words, ctx.index < 2 ? 3 : 4);
    const ow = pick(o.words);
    return { cards: [...ws.map((w) => ({ html: picSVG(w) })), { html: picSVG(ow), odd: true }], praise: `The ${ow} is not ${g.not}` };
  }
  if (L === 4) {
    const g = pick(GROUPS.filter((x) => x.id !== round.last));
    round.last = g.id;
    const ws = sample(g.words, 4);
    const ow = pick(g.odd);
    return { cards: [...ws.map((w) => ({ html: picSVG(w) })), { html: picSVG(ow), odd: true }], praise: g.why(ow) };
  }
  // Level 5: count. Every card shows other things, so the child has to count.
  const n = 2 + Math.floor(Math.random() * 4);
  const m = n + (Math.random() < 0.5 || n === 5 ? -1 : 1);
  const ws = sample(COUNTABLE, 4);
  return {
    cards: [...ws.slice(0, 3).map((w) => ({ html: manySVG(w, n) })), { html: manySVG(ws[3], m), odd: true }],
    praise: `That one has ${m}. The others have ${n}`,
    ask: 'Which one has a different number?',
  };
}

export default {
  id: 'odd',
  title: 'Odd one out',
  titleId: 'Mana yang Beda',
  card: '#E2F4D8',
  art: 'odd',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('farm');
  },

  question(ctx) {
    const q = make(ctx.level, ctx);
    const cards = shuffle(q.cards);
    ctx.area.innerHTML = '';
    const n = cards.length;
    const s = n >= 5 ? 180 : 210;
    const gap = n >= 5 ? 26 : 40;
    const x0 = 650 - ((n - 1) * (s + gap)) / 2;
    return new Promise((resolve) => {
      let done = false;
      cards.forEach((c, i) => {
        const pic = h('div', { class: 'pic', html: c.html });
        pic.style.width = pic.style.height = (c.size || 80) + '%';
        const card = h('button', { class: 'card pic-card pop-in', 'aria-label': `card ${i + 1}`, style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } }, pic);
        ctx.area.append(card);
        placeAt(card, x0 + i * (s + gap), 400);
        card.addEventListener('click', async () => {
          if (done) return;
          sfx.pop();
          if (c.odd) {
            done = true;
            card.classList.add('right');
            await ctx.yes(q.praise);
            resolve();
          } else {
            ctx.no(card);
          }
        });
      });
      ctx.prompt(q.ask || (ctx.level >= 3 ? 'Which one does not belong?' : 'Which one is different?'));
    });
  },
};

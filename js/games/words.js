// Find it! — hear an English word, tap the right picture (or touch the monster's body).
// Levels (DESAIN.md 7.6): 1 four cards, 2 one detail (size or colour), 3 size + colour or
// six cards, 4 groups ("something you can eat"), 5 first letter ("starts with B").
import { h, pick, shuffle, sample, anim, cap, toStage, placeAt } from '../util.js';
import { picSVG, charSVG, bodyPartAt } from '../art.js';
import { sfx } from '../sound.js';
import * as S from '../store.js';

export const TOPICS = [
  { id: 'animals', place: 'farm', words: ['dog', 'cat', 'fish', 'bird', 'cow', 'duck', 'pig', 'rabbit', 'horse', 'sheep', 'frog', 'lion'] },
  { id: 'food', place: 'kitchen', words: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'watermelon', 'carrot', 'milk', 'bread', 'egg', 'cake', 'cheese'] },
  { id: 'toys', place: 'playroom', words: ['ball', 'car', 'teddy bear', 'doll', 'book', 'cup', 'chair', 'bed', 'shoe', 'hat', 'spoon', 'clock'] },
  { id: 'body', place: 'mirror' },
];
const PLURAL = new Set(['grapes']);
const COLORABLE = ['ball', 'car', 'book', 'cup', 'chair', 'shoe', 'hat'];
export const COLORS = { red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0' };
const EASY = ['eyes', 'nose', 'mouth', 'ears', 'hands', 'feet', 'tummy'];
const HARD = ['hair', 'teeth', 'knees'];
const ALL = [...EASY, ...HARD];
const SIZES = ['big', 'small'];
const otherSize = (s) => (s === 'big' ? 'small' : 'big');

// Every picture the harder levels may show.
const EVERY = [...TOPICS[0].words, ...TOPICS[1].words, ...TOPICS[2].words, 'balloon', 'flower', 'shirt', 'sock', 'butterfly', 'plane', 'crab'];

// Level 4: groups. "bad" lists pictures that could fairly count as an answer, so they never
// appear as a wrong card.
const GROUPS = [
  { id: 'eat', ask: 'Find something you can eat!', why: (w) => `You can eat the ${w}`,
    words: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'watermelon', 'carrot', 'bread', 'egg', 'cake', 'cheese'],
    bad: ['milk', 'fish', 'crab', 'cow', 'pig', 'sheep', 'duck', 'bird', 'rabbit'] },
  { id: 'fly', ask: 'Find something that can fly!', why: (w) => `The ${w} can fly`,
    words: ['bird', 'duck', 'butterfly', 'plane'], bad: ['balloon'] },
  { id: 'water', ask: 'Find something that lives in water!', why: (w) => `The ${w} lives in water`,
    words: ['fish', 'crab'], bad: ['duck', 'frog'] },
  { id: 'wear', ask: 'Find something you can wear!', why: (w) => `You can wear the ${w}`,
    words: ['hat', 'shoe', 'shirt', 'sock'], bad: [] },
];

// Level 5: first letters. Only words whose first sound is the letter's usual sound
// (no "ch" or "sh" words as answers or examples).
const LETTERS = {
  B: ['ball', 'banana', 'bird', 'book', 'bed', 'balloon', 'butterfly', 'bread'],
  C: ['cat', 'cow', 'car', 'cake', 'cup', 'carrot', 'clock', 'crab'],
  D: ['dog', 'duck', 'doll'],
  F: ['fish', 'frog', 'flower'],
  H: ['hat', 'horse'],
  P: ['pig', 'plane'],
  S: ['sock', 'spoon', 'strawberry'],
};
export const LETTER_COLOR = { B: '#4C8DF0', C: '#E85D6A', D: '#3FB58A', F: '#FF9542', H: '#9B6BE0', P: '#E86FA0', S: '#2FA7C9' };

// Level 4 (body): riddles.
const RIDDLES = [
  { q: 'What do you hear with?', a: 'ears' },
  { q: 'What do you see with?', a: 'eyes' },
  { q: 'What do you smell with?', a: 'nose' },
  { q: 'What do you talk with?', a: 'mouth' },
  { q: 'What do you clap with?', a: 'hands' },
  { q: 'What do you walk with?', a: 'feet' },
  { q: 'What do you comb?', a: 'hair' },
  { q: 'What do you chew with?', a: 'teeth' },
  { q: 'Where does your food go?', a: 'tummy' },
  { q: 'What do you bend when you sit down?', a: 'knees' },
];

export const label = (it) => [it.size, it.color, it.word].filter(Boolean).join(' ');
export const questionText = (it) => `Where ${PLURAL.has(it.word) ? 'are' : 'is'} the ${label(it)}?`;
const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// Also used by the race (games/race.js).
export function makeItems(topic, L, ctx) {
  const last = ctx.round.last;
  const words = topic.words;
  const fresh = (list) => pick(list.filter((w) => w !== last)) || pick(list);
  const many = ctx.index < 2 ? 4 : 6;
  if (L === 1) {
    const target = { word: fresh(words) };
    const others = sample(words, 3, [target.word]).map((w) => ({ word: w }));
    return { target, options: shuffle([target, ...others]) };
  }
  const colorTopic = topic.id === 'toys';
  if (L === 2) {
    if (colorTopic && Math.random() < 0.6) {
      const tw = fresh(COLORABLE);
      const [c1, c2] = sample(Object.keys(COLORS), 2);
      const other = pick(COLORABLE.filter((w) => w !== tw));
      const target = { word: tw, color: c1 };
      return { target, options: shuffle([target, { word: tw, color: c2 }, { word: other, color: c1 }, { word: other, color: c2 }]) };
    }
    const tw = fresh(words);
    const s1 = pick(SIZES);
    const [o1, o2] = sample(words, 2, [tw]);
    const target = { word: tw, size: s1 };
    return { target, options: shuffle([target, { word: tw, size: otherSize(s1) }, { word: o1, size: s1 }, { word: o2, size: otherSize(s1) }]) };
  }
  if (L === 3) {
    if (colorTopic) {
      const tw = fresh(COLORABLE);
      const s1 = pick(SIZES);
      const [c1, c2] = sample(Object.keys(COLORS), 2);
      const target = { word: tw, size: s1, color: c1 };
      return {
        target,
        options: shuffle([target, { word: tw, size: otherSize(s1), color: c1 }, { word: tw, size: s1, color: c2 }, { word: tw, size: otherSize(s1), color: c2 }]),
      };
    }
    const tw = fresh(words);
    const s1 = pick(SIZES);
    const target = { word: tw, size: s1 };
    const opts = [target, { word: tw, size: otherSize(s1) }];
    for (const w of sample(words, 2, [tw])) opts.push({ word: w, size: 'big' }, { word: w, size: 'small' });
    return { target, options: shuffle(opts) };
  }
  if (L === 4) {
    const g = pick(GROUPS.filter((x) => x.id !== ctx.round.key));
    ctx.round.key = g.id;
    const target = { word: fresh(g.words) };
    const pool = EVERY.filter((w) => !g.words.includes(w) && !g.bad.includes(w));
    const others = sample(pool, many - 1).map((w) => ({ word: w }));
    return { target, options: shuffle([target, ...others]), ask: g.ask, praise: g.why(target.word) };
  }
  // Level 5: first letter
  const letter = pick(Object.keys(LETTERS).filter((k) => k !== ctx.round.key));
  ctx.round.key = letter;
  const [tw, example] = sample(LETTERS[letter], 2);
  const target = { word: tw };
  const pool = EVERY.filter((w) => w[0].toUpperCase() !== letter);
  const others = sample(pool, many - 1).map((w) => ({ word: w }));
  return {
    target,
    options: shuffle([target, ...others]),
    letter,
    ask: `Find the one that starts with ${letter}... ${letter}, like ${example}!`,
    praise: `${tw} starts with ${letter}`,
  };
}

// Card spots. With a letter on the left, the cards move right and get a little smaller.
function layout(n, side) {
  const cx = side ? 735 : 600;
  if (n <= 4) {
    const s = side ? 198 : n === 2 ? 300 : n === 3 ? 280 : 236;
    const gap = side ? 22 : n === 4 ? 34 : 50;
    const total = n * s + (n - 1) * gap;
    const x0 = cx - total / 2 + s / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (s + gap), y: 370, s }));
  }
  const s = side ? 196 : 210;
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    out.push({ x: cx + (col - 1) * (s + 36), y: 255 + row * (s + 34), s });
  }
  return out;
}

function sparkle(area, e) {
  const p = toStage(e.clientX, e.clientY);
  const sp = h('div', { class: 'sparkle', style: { width: '70px', height: '70px' } });
  area.append(sp);
  placeAt(sp, p.x, p.y);
  setTimeout(() => sp.remove(), 650);
}

function distinct(pool, n, needHard) {
  for (;;) {
    const s = sample(pool, n);
    if (!needHard || s.some((p) => HARD.includes(p))) return s;
  }
}

async function bodyQuestion(ctx) {
  const L = ctx.level;
  const big = ctx.round.big;
  let steps;
  let text;
  let praise;
  if (L === 1) {
    steps = [pick(ALL.filter((p) => p !== ctx.round.last))];
  } else if (L === 2) {
    steps = distinct(EASY, 2, false);
  } else if (L === 3) {
    steps = distinct(ALL, 2, true);
  } else if (L === 4) {
    const r = pick(RIDDLES.filter((x) => x.a !== ctx.round.last));
    steps = [r.a];
    text = r.q;
    praise = `My ${r.a}`;
  } else {
    steps = distinct(ALL, 3, true);
  }
  ctx.round.last = steps[0];
  if (!text) text = `Touch my ${steps.join(', then my ')}!`;
  if (!praise) praise = andList(steps);
  return new Promise((resolve) => {
    let i = 0;
    let done = false;
    big.onpointerdown = async (e) => {
      if (done) return;
      const r = big.getBoundingClientRect();
      const region = bodyPartAt(ctx.who, ((e.clientX - r.left) / r.width) * 200, ((e.clientY - r.top) / r.height) * 240);
      if (!region) return;
      sparkle(ctx.area, e);
      if (region.parts.includes(steps[i])) {
        sfx.giggle();
        anim(big, 'giggle', 500);
        i++;
        if (i >= steps.length) {
          done = true;
          await ctx.yes(praise);
          resolve();
        } else {
          ctx.say(cap(steps[i - 1]) + '!');
        }
      } else {
        i = 0;
        ctx.no(null);
      }
    };
    ctx.prompt(text);
  });
}

export default {
  id: 'words',
  title: 'Find it',
  titleId: 'Ketuk Gambar',
  card: '#FFF0C2',
  art: 'words',

  startRound(ctx) {
    const topic = TOPICS[S.nextTopic(TOPICS.length)];
    ctx.round = { topic, last: null, key: null };
    ctx.setPlace(topic.place);
    if (topic.id === 'body') {
      const big = h('div', { class: 'char big-char', html: charSVG(ctx.who), style: { width: '360px', height: '432px' } });
      ctx.area.append(big);
      placeAt(big, 600, 420);
      ctx.round.big = big;
      ctx.useChar(big);
    }
  },

  question(ctx) {
    const topic = ctx.round.topic;
    if (topic.id === 'body') return bodyQuestion(ctx);
    const q = makeItems(topic, ctx.level, ctx);
    const { target, options } = q;
    ctx.round.last = target.word;
    ctx.area.innerHTML = '';
    if (q.letter) {
      const card = h('div', { class: 'big-letter pop-in', style: { color: LETTER_COLOR[q.letter] } }, q.letter, h('span', null, q.letter.toLowerCase()));
      ctx.area.append(card);
      card.addEventListener('click', () => { anim(card, 'pop', 500); ctx.say(q.ask); });
    }
    const spots = layout(options.length, !!q.letter);
    return new Promise((resolve) => {
      let done = false;
      options.forEach((item, i) => {
        const { x, y, s } = spots[i];
        const inner = h('div', { class: 'pic', html: picSVG(item.word, COLORS[item.color]) });
        const pct = item.size === 'small' ? 46 : item.size === 'big' ? 92 : 82;
        inner.style.width = inner.style.height = pct + '%';
        const card = h('button', { class: 'card pic-card pop-in', 'aria-label': label(item), style: { width: s + 'px', height: s + 'px', animationDelay: i * 70 + 'ms' } }, inner);
        ctx.area.append(card);
        placeAt(card, x, y);
        card.addEventListener('click', async () => {
          if (done) return;
          sfx.pop();
          if (item === target) {
            done = true;
            card.classList.add('right');
            anim(card, 'pop', 500);
            await ctx.yes(q.praise || label(target));
            resolve();
          } else {
            ctx.no(card);
          }
        });
      });
      ctx.prompt(q.ask || questionText(target));
    });
  },
};

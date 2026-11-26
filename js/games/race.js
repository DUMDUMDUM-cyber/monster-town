// Race! — three runners on a park track (DESAIN.md 8.1). Everyone keeps running; a question
// appears on the board above. A right answer makes the child's runner dash; a wrong one gives
// "Try again!" (no hint) and the others catch up. The five questions are mixed from the five
// Paket 1 games, each at the child's level in that game, and answered by tapping.
// Race levels 1-5 set how fast the others are, and 3 (levels 1-2) or 4 choices (3-5).
// The others adapt: always right wins narrowly; many mistakes may mean 2nd or 3rd place
// (silver or bronze, "Good try! Let's race again!"). Medals are not stored.
import { h, pick, rand, shuffle, sample, sleep, anim, placeAt, NUM } from '../util.js';
import { picSVG, shapeSVG, wagonSVG, engineSVG } from '../art.js';
import { sfx } from '../sound.js';
import * as S from '../store.js';
import { makeItems, TOPICS, COLORS as WCOLORS, LETTER_COLOR, label, questionText } from './words.js';

const reducedNow = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const RUN_W = 112;
const RUN_H = RUN_W * 1.2;
const FOOT = RUN_H * (233 / 240);
const LANE_Y = [562, 676, 790]; // feet of the runners, back lane first
const X0 = 86;
const X1 = 1080; // finish line

// ---------------------------------------------------------------- questions
// Each maker returns { ask, praise, show (html or ''), choices: [{ html, label, right }] }.
const pic = (word, color, pct = 82) => `<div class="pic" style="width:${pct}%;height:${pct}%">${picSVG(word, color)}</div>`;

function wordsQ(L, n, mem) {
  const topic = pick(TOPICS.filter((t) => t.words));
  const q = makeItems(topic, L, { round: mem.words || (mem.words = { last: null, key: null }), index: 3 });
  mem.words.last = q.target.word;
  const others = sample(q.options.filter((o) => o !== q.target), n - 1);
  const size = (it) => (it.size === 'small' ? 46 : it.size === 'big' ? 92 : 82);
  return {
    ask: q.ask || questionText(q.target),
    praise: q.praise || label(q.target),
    show: q.letter ? `<div class="big-letter race-letter" style="color:${LETTER_COLOR[q.letter]}">${q.letter}<span>${q.letter.toLowerCase()}</span></div>` : '',
    choices: shuffle([q.target, ...others]).map((it) => ({ html: pic(it.word, WCOLORS[it.color], size(it)), label: label(it), right: it === q.target })),
  };
}

const THINGS = [
  ['apple', 'apples'], ['duck', 'ducks'], ['ball', 'balls', '#3A86FF'], ['fish', 'fish'], ['car', 'cars', '#EF476F'],
  ['banana', 'bananas'], ['strawberry', 'strawberries'], ['cat', 'cats'], ['flower', 'flowers'], ['bird', 'birds'], ['rabbit', 'rabbits'],
];
const AWAY = { duck: 'fly away', bird: 'fly away', fish: 'swim away', car: 'drive away', cat: 'run away', rabbit: 'hop away', ball: 'roll away', apple: 'roll away' };
const NAMES = ['Moko', 'Gumi', 'Tobi'];
function things(word, color, count, faded = 0) {
  const size = count > 12 ? 50 : count > 8 ? 58 : 66;
  const cells = Array.from({ length: count }, (_, i) => `<div class="race-thing ${i >= count - faded ? 'gone' : ''}" style="width:${size}px;height:${size}px">${picSVG(word, color)}</div>`);
  return `<div class="race-things">${cells.join('')}</div>`;
}
function numberChoices(answer, n) {
  const near = shuffle([answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((v) => v >= 0 && v <= 20));
  return shuffle([answer, ...near.slice(0, n - 1)]).map((v) => ({ html: `<span class="race-num">${v}</span>`, label: NUM[v], right: v === answer }));
}
function countQ(L, n) {
  const [one, many, color] = pick(THINGS);
  if (L === 1) {
    const k = rand(3, 10);
    return { ask: `How many ${many}?`, praise: `${NUM[k]} ${k === 1 ? one : many}`, show: things(one, color, k), choices: numberChoices(k, n) };
  }
  if (L === 2 || (L === 3 && Math.random() < 0.5)) {
    const top = L === 2 ? 5 : 10;
    const a = rand(1, top - 1);
    const b = rand(1, top - a);
    return {
      ask: `${NUM[a]} ${a === 1 ? one : many} and ${NUM[b]} more. How many in all?`,
      praise: `${NUM[a + b]} ${many}`,
      show: `<div class="race-sum">${things(one, color, a)}<span class="race-plus">+</span>${things(one, color, b)}</div>`,
      choices: numberChoices(a + b, n),
    };
  }
  if (L === 3) {
    const k = rand(11, 16);
    return { ask: `How many ${many}?`, praise: `${NUM[k]} ${many}`, show: things(one, color, k), choices: numberChoices(k, n) };
  }
  if (L === 4) {
    const movers = THINGS.filter(([w]) => AWAY[w]);
    const [o2, m2, c2] = pick(movers);
    const all = rand(4, 9);
    const go = rand(1, all - 2);
    return {
      ask: `There are ${NUM[all]} ${m2}. ${NUM[go]} ${go === 1 ? AWAY[o2].replace('fly', 'flies').replace('swim', 'swims').replace('drive', 'drives').replace('run', 'runs').replace('hop', 'hops').replace('roll', 'rolls') : AWAY[o2]}. How many are left?`,
      praise: `${NUM[all - go]} ${all - go === 1 ? o2 : m2}`,
      show: things(o2, c2, all, go),
      choices: numberChoices(all - go, n),
    };
  }
  // Level 5: a little story, just listening.
  const [p1, p2] = sample(NAMES, 2);
  const a = rand(2, 6);
  const b = rand(1, 4);
  if (Math.random() < 0.5) {
    return { ask: `${p1} has ${NUM[a]} ${many}. ${p2} gives ${p1} ${NUM[b]} more. How many ${many} does ${p1} have now?`, praise: `${NUM[a + b]} ${many}`, show: '', choices: numberChoices(a + b, n) };
  }
  const big = a + b;
  return { ask: `${p1} has ${NUM[big]} ${many}. ${p1} gives ${NUM[b]} to ${p2}. How many ${many} does ${p1} have now?`, praise: `${NUM[a]} ${many}`, show: '', choices: numberChoices(a, n) };
}

const SHAPES1 = ['circle', 'square', 'triangle'];
const SHAPES2 = [...SHAPES1, 'star', 'heart'];
const SHAPES3 = [...SHAPES2, 'rectangle', 'oval', 'diamond'];
const SHAPE_COLORS = ['#EF476F', '#3A86FF', '#FFD166', '#06D6A0', '#FF9542', '#9B5DE5', '#FF8FB1'];
const CORNERS = [
  { ask: 'Which shape has three corners?', a: 'triangle', bad: [] },
  { ask: 'Which shape has no corners?', a: 'circle', bad: ['oval', 'heart'] },
  { ask: 'Which shape has five points?', a: 'star', bad: [] },
  { ask: 'Which shape has four sides that are all the same?', a: 'square', bad: ['diamond', 'rectangle'] },
];
const shapeCard = (s, c, turn = 0) => `<div class="race-shape" style="transform:rotate(${turn}deg)">${shapeSVG(s, c)}</div>`;
function shapesQ(L, n, mem) {
  const cols = shuffle(SHAPE_COLORS);
  if (L === 5) {
    const c = pick(CORNERS.filter((x) => x.a !== mem.shape));
    mem.shape = c.a;
    const others = sample(SHAPES3, n - 1, [c.a, ...c.bad]);
    return { ask: c.ask, praise: `The ${c.a}`, show: '', choices: shuffle([c.a, ...others]).map((s, i) => ({ html: shapeCard(s, cols[i]), label: s, right: s === c.a })) };
  }
  const pool = L === 1 ? SHAPES1 : L === 2 ? SHAPES2 : SHAPES3;
  const a = pick(pool.filter((s) => s !== mem.shape));
  mem.shape = a;
  const others = sample(pool, n - 1, [a]);
  const turn = () => (L === 4 ? pick([0, 30, 60, 90, 135, 200]) : 0);
  return { ask: `Which one is the ${a}?`, praise: `The ${a}`, show: '', choices: shuffle([a, ...others]).map((s, i) => ({ html: shapeCard(s, cols[i], turn()), label: s, right: s === a })) };
}

const C = {
  red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0', orange: '#FF9542',
  purple: '#9B5DE5', pink: '#FF8FB1', brown: '#A0673A', black: '#3A3A48',
};
const BASIC = ['red', 'blue', 'yellow', 'green'];
const PAINTED = ['ball', 'car', 'cup', 'hat', 'shoe', 'balloon', 'book'];
const GROUPS = [
  { name: 'an animal', words: ['dog', 'cat', 'cow', 'fish', 'bird', 'duck', 'pig', 'rabbit', 'horse', 'sheep', 'frog', 'lion'] },
  { name: 'food', words: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'watermelon', 'carrot', 'bread', 'egg', 'cake', 'cheese'] },
  { name: 'a toy', words: ['ball', 'teddy bear', 'doll', 'balloon'] },
  { name: 'something you wear', words: ['hat', 'shoe', 'shirt', 'sock'] },
];
function colorsQ(L, n, mem) {
  if (L === 1 || L === 3) {
    const pool = L === 1 ? BASIC : Object.keys(C);
    const thing = pick(PAINTED);
    const a = pick(pool.filter((c) => c !== mem.color));
    mem.color = a;
    const rest = sample(pool, n - 1, [a]);
    return { ask: `Which one is ${a}?`, praise: a, show: '', choices: shuffle([a, ...rest]).map((c) => ({ html: pic(thing, C[c]), label: `${c} ${thing}`, right: c === a })) };
  }
  if (L === 2) {
    const shapes = ['circle', 'square', 'triangle', 'star'];
    const ac = pick(BASIC);
    const as = pick(shapes);
    const oc = pick(BASIC.filter((c) => c !== ac));
    const os = pick(shapes.filter((s) => s !== as));
    const opts = shuffle([[ac, as], [oc, as], [ac, os], [oc, os]]).filter((o) => !(o[0] === ac && o[1] === as)).slice(0, n - 1);
    return {
      ask: `Find the ${ac} ${as}!`,
      praise: `The ${ac} ${as}`,
      show: '',
      choices: shuffle([[ac, as], ...opts]).map(([c, s]) => ({ html: shapeCard(s, C[c]), label: `${c} ${s}`, right: c === ac && s === as })),
    };
  }
  if (L === 4) {
    if (Math.random() < 0.5) {
      const g = pick(GROUPS);
      const a = pick(g.words);
      const pool = GROUPS.filter((x) => x !== g).flatMap((x) => x.words).filter((w) => !g.words.includes(w));
      const rest = sample(pool, n - 1);
      return { ask: `Which one is ${g.name}?`, praise: `The ${a}`, show: '', choices: shuffle([a, ...rest]).map((w) => ({ html: pic(w), label: w, right: w === a })) };
    }
    const thing = pick(['ball', 'teddy bear', 'duck', 'apple', 'fish', 'flower', 'balloon']);
    const sizes = [34, 52, 70, 90].slice(0, n);
    const big = Math.random() < 0.5;
    const a = big ? Math.max(...sizes) : Math.min(...sizes);
    return {
      ask: `Which ${thing} is the ${big ? 'biggest' : 'smallest'}?`,
      praise: `The ${big ? 'biggest' : 'smallest'} ${thing}`,
      show: '',
      choices: shuffle(sizes).map((s) => ({ html: pic(thing, undefined, s), label: `${thing}`, right: s === a })),
    };
  }
  // Level 5: two rules at once.
  const thing = pick(['ball', 'car', 'cup', 'hat', 'balloon']);
  const [c1, c2] = sample(BASIC, 2);
  const size = pick(['big', 'small']);
  const other = size === 'big' ? 'small' : 'big';
  const opts = [[size, c1], [other, c1], [size, c2], [other, c2]].slice(0, Math.max(n, 3));
  const pickOpts = shuffle([opts[0], ...shuffle(opts.slice(1)).slice(0, n - 1)]);
  return {
    ask: `Find the ${size} ${c1} ${thing}!`,
    praise: `The ${size} ${c1} ${thing}`,
    show: '',
    choices: pickOpts.map(([s, c]) => ({ html: pic(thing, C[c], s === 'big' ? 92 : 46), label: `${s} ${c} ${thing}`, right: s === size && c === c1 })),
  };
}

const WAGON = { red: '#E85D6A', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0', purple: '#9B5DE5', orange: '#FF9542' };
const RIDERS = ['dog', 'cat', 'duck', 'pig', 'rabbit', 'frog'];
// Patterns per level: the unit repeats; the child picks the next wagon.
const PATTERNS = { 1: ['AB'], 2: ['AAB', 'ABC', 'ABB'], 3: ['ABC', 'AABB', 'ABB'], 4: ['AABB', 'ABBC', 'ABCC', 'AABC'] };
const wagon = (c, a) => `<div class="race-wagon">${wagonSVG(WAGON[c], a)}</div>`;
function trainQ(L, n) {
  const shown = L <= 2 ? 5 : 6;
  if (L === 5) {
    // Colours repeat AB and riders repeat ABC: both must be right.
    const cols = sample(Object.keys(WAGON), 2);
    const rid = sample(RIDERS, 3);
    const seq = Array.from({ length: shown + 1 }, (_, i) => [cols[i % 2], rid[i % 3]]);
    const [ac, aa] = seq[shown];
    const oc = cols.find((c) => c !== ac);
    const oa = rid.filter((r) => r !== aa);
    const opts = shuffle([[oc, aa], [ac, oa[0]], [oc, oa[1]], [ac, oa[1]]]).slice(0, n - 1);
    return {
      ask: 'Which wagon comes next?',
      praise: `The ${ac} wagon with the ${aa}`,
      show: trainShow(seq.slice(0, shown)),
      choices: shuffle([[ac, aa], ...opts]).map(([c, a]) => ({ html: wagon(c, a), label: `${c} wagon with a ${a}`, right: c === ac && a === aa })),
    };
  }
  const unit = pick(PATTERNS[L]);
  const letters = [...new Set(unit)];
  const cols = sample(Object.keys(WAGON), letters.length);
  const colOf = (ch) => cols[letters.indexOf(ch)];
  const rider = pick(RIDERS);
  const seq = Array.from({ length: shown + 1 }, (_, i) => [colOf(unit[i % unit.length]), rider]);
  const ans = seq[shown][0];
  const rest = shuffle([...cols.filter((c) => c !== ans), ...sample(Object.keys(WAGON), 3, cols)]).slice(0, n - 1);
  return {
    ask: 'Which wagon comes next?',
    praise: `The ${ans} wagon`,
    show: trainShow(seq.slice(0, shown)),
    choices: shuffle([ans, ...rest]).map((c) => ({ html: wagon(c, rider), label: `${c} wagon`, right: c === ans })),
  };
}
function trainShow(seq) {
  return `<div class="race-train"><div class="race-engine">${engineSVG()}</div>${seq.map(([c, a]) => wagon(c, a)).join('')}<div class="race-wagon race-q">?</div></div>`;
}

const MAKERS = { words: wordsQ, count: countQ, shapes: shapesQ, colors: colorsQ, train: trainQ };

// ---------------------------------------------------------------- the race
export default {
  id: 'race',
  title: 'Race',
  titleId: 'Balapan Lari',
  card: '#FFD9C7',
  art: 'race',

  startRound(ctx) {
    ctx.setPlace('park');
    const others = ['moko', 'gumi', 'tobi'].filter((w) => w !== ctx.who);
    const quick = reducedNow();
    const runners = [...others, ctx.who].map((who, lane) => {
      const el = ctx.makeChar(who, RUN_W, 'runner running');
      el.style.zIndex = String(10 + lane);
      ctx.area.append(el);
      return { who, el, lane, p: 0, want: 0, done: 0 };
    });
    const me = runners[2];
    const board = h('div', { class: 'race-board pop-in' });
    ctx.area.append(board);
    ctx.useChar(me.el);
    ctx.cheer = false;
    const R = {
      runners, me, board, mem: {}, order: shuffle(Object.keys(MAKERS)),
      correct: 0, missQ: 0, finishing: false, finished: [], creep: 0, quick, last: performance.now(), dust: 0,
    };
    ctx.round = R;
    const place = (r) => {
      r.el.style.left = X0 + r.p * (X1 - X0) - RUN_W / 2 + 'px';
      r.el.style.top = LANE_Y[r.lane] - FOOT + 'px';
    };
    runners.forEach(place);
    const lvl = ctx.level;
    const lvlF = 0.8 + 0.1 * lvl;
    const oppSpeed = 0.045 + 0.012 * lvl;
    // The child's runner: a little forward on its own, a dash for each right answer.
    const target = () => (R.finishing ? 1.25 : Math.min(0.9, 0.04 + R.correct * 0.17 + R.creep));
    const gap = (i) => {
      const extra = Math.max(0, R.missQ - 1);
      return i === 0 ? -0.045 + R.missQ * 0.008 + extra * 0.07 * lvlF : -0.085 + R.missQ * 0.006 + extra * 0.05 * lvlF;
    };
    const tick = (now) => {
      if (!ctx.alive()) return;
      const dt = Math.min(0.05, (now - R.last) / 1000);
      R.last = now;
      if (!R.finishing) R.creep = Math.min(0.05, R.creep + dt * 0.004);
      let tMe = target();
      // Without motion everyone jumps at once, so keep the finish order fair by hand:
      // runners ahead cross first, the child next, then the others.
      if (R.finishing && R.ahead.some((i) => !runners[i].done)) tMe = Math.min(tMe, 0.99);
      const dash = tMe - me.p > 0.02;
      me.p = R.quick ? tMe : Math.min(tMe, me.p + dt * (dash ? 0.3 : 0.02));
      if (dash && !R.quick && now - R.dust > 110) { R.dust = now; puff(ctx.area, me); }
      others.forEach((_, i) => {
        const r = runners[i];
        let want = R.finishing ? 1.25 : Math.min(0.97, me.p + gap(i));
        if (R.finishing && !R.ahead.includes(i) && !me.done) want = Math.min(want, 0.99);
        want = Math.max(r.p, want);
        const sp = R.finishing ? (R.ahead.includes(i) ? 0.42 : 0.26) : oppSpeed;
        r.p = R.quick ? want : Math.min(want, r.p + dt * sp);
      });
      for (const r of runners) {
        if (!r.done && r.p >= 1) { r.done = R.finished.length + 1; R.finished.push(r); }
        place(r);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    R.gap = gap;
  },

  question(ctx) {
    const R = ctx.round;
    const n = ctx.level <= 2 ? 3 : 4;
    const game = R.order[ctx.index];
    const q = MAKERS[game](S.level(game), n, R.mem);
    const board = R.board;
    board.innerHTML = '';
    const again = h('button', { class: 'race-say', 'aria-label': 'Say it again', html: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>' });
    again.addEventListener('click', () => ctx.say(q.ask));
    board.append(again);
    if (q.show) board.append(h('div', { class: 'race-show', html: q.show }));
    const row = h('div', { class: `race-choices ${q.show ? 'side' : ''} n${q.choices.length}` });
    board.append(row);
    anim(board, 'pop', 400);
    board.classList.remove('gone');
    // One try per question: a wrong answer just counts as wrong (no dash) and the race goes on.
    return new Promise((resolve) => {
      let done = false;
      const cards = [];
      q.choices.forEach((c, i) => {
        const card = h('button', { class: 'card race-choice pop-in', 'aria-label': c.label, html: c.html, style: { animationDelay: i * 60 + 'ms' } });
        row.append(card);
        cards.push(card);
        card.dbg = c.right; // for testing from the console
        card.addEventListener('click', async () => {
          if (done) return;
          done = true;
          sfx.pop();
          const last = ctx.index === 4;
          if (c.right) {
            card.classList.add('right');
            R.correct++;
            sfx.whoosh();
            if (last) finish(R);
            await ctx.yes(q.praise, { x: R.me.el.offsetLeft + RUN_W / 2, y: R.me.el.offsetTop + 20 });
          } else {
            R.missQ++;
            card.classList.add('wrong');
            cards[q.choices.findIndex((x) => x.right)].classList.add('right');
            if (last) finish(R);
            await ctx.no(card, 'Oops!');
            await sleep(R.quick ? 100 : 700);
          }
          if (!ctx.alive()) return;
          if (last) {
            await endRace(ctx, R);
          } else {
            // A calm stretch of running before the next question.
            board.classList.add('gone');
            await sleep(R.quick ? 150 : 2600);
          }
          resolve();
        });
      });
      ctx.prompt(q.ask);
    });
  },
};

function finish(R) {
  R.finishing = true;
  R.ahead = [0, 1].filter((i) => R.gap(i) > 0);
}

async function endRace(ctx, R) {
  const t0 = Date.now();
  while (ctx.alive() && (!R.me.done || R.finished.length < 3) && Date.now() - t0 < 6000) await sleep(100);
  if (!ctx.alive()) return;
  const place = R.me.done || 1;
  const medal = ['gold', 'silver', 'bronze'][place - 1];
  const n = ctx.name;
  ctx.result = place === 1
    ? { medal, text: `Hooray! You won${n ? ', ' + n : ''}! Great job!` }
    : { medal, text: "Good try! Let's race again!" };
  R.board.classList.add('gone');
  await sleep(R.quick ? 100 : 500);
  // Everyone has run off to the right; the party takes over.
  R.me.el.style.display = 'none';
}

function puff(area, r) {
  const d = h('div', { class: 'dust' });
  area.append(d);
  placeAt(d, r.el.offsetLeft + 14, LANE_Y[r.lane] - 8);
  setTimeout(() => d.remove(), 600);
}



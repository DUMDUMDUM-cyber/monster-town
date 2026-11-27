// What comes next? — finish the pattern (DESAIN.md 8.2).
// Levels: 1 AB with coloured shapes (3 choices), 2 AB / AAB / ABB with pictures (3 choices),
// 3 ABC (4 choices), 4 shape and colour both count, or a gap in the middle, 5 growing
// patterns (1, 2, 3 dots...), AABB, or a gap (4 choices).
import { h, pick, shuffle, sample, anim, placeAt } from '../util.js';
import { picSVG, shapeSVG } from '../art.js';
import { sfx } from '../sound.js';

const COLORS = { red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0', purple: '#9B6BE0' };
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const PICS = ['dog', 'cat', 'fish', 'duck', 'pig', 'frog', 'apple', 'banana', 'carrot', 'ball', 'car', 'flower', 'butterfly', 'balloon', 'cake', 'book'];

const key = (it) => [it.t, it.type || it.word || '', it.color || '', it.n || '', it.size || ''].join('|');
const name = (it) => (it.t === 'dots' ? `${it.n}` : [it.size, it.color, it.type || it.word].filter(Boolean).join(' '));

function art(it) {
  if (it.t === 'shape') return shapeSVG(it.type, COLORS[it.color]);
  if (it.t === 'dots') {
    const r = 9;
    const per = it.n <= 3 ? it.n : Math.ceil(it.n / 2);
    const rows = it.n <= 3 ? 1 : 2;
    let s = '';
    for (let i = 0; i < it.n; i++) {
      const row = Math.floor(i / per);
      const inRow = row === rows - 1 ? it.n - per * (rows - 1) : per;
      const col = i % per;
      const x = 50 + (col - (inRow - 1) / 2) * 26;
      const y = rows === 1 ? 50 : 36 + row * 28;
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FF9542" stroke="#B9661E" stroke-width="2.5"/>`;
    }
    return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${s}</svg>`;
  }
  return picSVG(it.word, it.color ? COLORS[it.color] : undefined);
}

const shapeItem = (type, color) => ({ t: 'shape', type, color });
const picItem = (word) => ({ t: 'pic', word });

// Build { seq: [...items], gap: index of the missing one, answer, options }.
function make(L, ctx) {
  const round = ctx.round;
  let unit;
  let len;
  let gapAtEnd = true;
  let seq = null;
  let distract = [];
  if (L === 1) {
    const [s1, s2] = sample(SHAPES, 2);
    const [c1, c2] = sample(Object.keys(COLORS), 2);
    unit = [shapeItem(s1, c1), shapeItem(s2, c2)];
    len = 6;
    distract = [shapeItem(pick(SHAPES.filter((s) => s !== s1 && s !== s2)), pick(Object.keys(COLORS)))];
  } else if (L === 2 || L === 3) {
    const kinds = L === 2 ? ['AB', 'AAB', 'ABB'] : ['ABC', 'ABC', 'AAB', 'ABB'];
    const kind = pick(kinds.filter((k) => k !== round.last));
    round.last = kind;
    const words = sample(PICS, 4);
    unit = kind.split('').map((ch) => picItem(words[ch.charCodeAt(0) - 65]));
    len = kind.length === 2 ? 6 : kind === 'ABC' ? 8 : 8;
    if (kind.length === 3 && kind !== 'ABC') len = 6 + (Math.random() < 0.5 ? 1 : 2);
    distract = [picItem(words[3])];
    if (L === 3) distract.push(picItem(pick(PICS.filter((w) => !words.includes(w)))));
  } else if (L === 4) {
    // Shape and colour change on their own beats: the right answer needs both.
    const [s1, s2] = sample(SHAPES, 2);
    const [c1, c2, c3] = sample(Object.keys(COLORS), 3);
    const kind = pick(['both', 'both', 'size']);
    if (kind === 'size') {
      const w = pick(PICS);
      unit = [{ t: 'pic', word: w, size: 'big' }, { t: 'pic', word: w, size: 'small' }, { t: 'pic', word: w, size: 'small' }];
      len = 7;
      distract = [{ t: 'pic', word: pick(PICS.filter((x) => x !== w)), size: 'big' }];
    } else {
      unit = [shapeItem(s1, c1), shapeItem(s2, c1), shapeItem(s1, c2), shapeItem(s2, c2)];
      len = 7;
      distract = [shapeItem(s1, c3), shapeItem(s2, c3)];
    }
    gapAtEnd = Math.random() < 0.5;
  } else {
    const kind = pick(['grow', 'AABB', 'gap'].filter((k) => k !== round.last));
    round.last = kind;
    if (kind === 'grow') {
      const start = pick([1, 2]);
      const step = start === 1 && Math.random() < 0.3 ? 2 : 1;
      seq = Array.from({ length: 4 }, (_, i) => ({ t: 'dots', n: start + i * step }));
      const ans = start + 4 * step;
      seq.push({ t: 'dots', n: ans });
      const others = shuffle([ans - step, ans + 1, ans + 2, ans - 1].filter((n) => n > 0 && n !== ans && n <= 10))
        .filter((n, i, a) => a.indexOf(n) === i).slice(0, 3).map((n) => ({ t: 'dots', n }));
      return { seq, gap: 4, options: shuffle([seq[4], ...others]), say: 'Count the dots. What comes next?' };
    }
    const words = sample(PICS, 3);
    unit = kind === 'AABB' ? [picItem(words[0]), picItem(words[0]), picItem(words[1]), picItem(words[1])]
      : [picItem(words[0]), picItem(words[1]), picItem(words[2])];
    len = kind === 'AABB' ? 7 : 8;
    gapAtEnd = kind === 'AABB';
    distract = [picItem(words[2]), picItem(pick(PICS.filter((w) => !words.includes(w))))];
  }
  if (!seq) seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  const gap = gapAtEnd ? seq.length - 1 : 2 + Math.floor(Math.random() * (seq.length - 4));
  const answer = seq[gap];
  const n = L <= 2 ? 3 : 4;
  const pool = [...unit, ...distract].filter((it, i, a) => key(it) !== key(answer) && a.findIndex((x) => key(x) === key(it)) === i);
  const options = shuffle([answer, ...shuffle(pool).slice(0, n - 1)]);
  return { seq, gap, options };
}

export default {
  id: 'pattern',
  title: 'What next?',
  titleId: 'Tebak Pola',
  card: '#FFE3D6',
  art: 'pattern',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('space');
  },

  question(ctx) {
    const L = ctx.level;
    const q = make(L, ctx);
    const answer = q.seq[q.gap];
    ctx.area.innerHTML = '';
    const n = q.seq.length;
    const s = n >= 8 ? 112 : 124;
    const gapPx = 14;
    const x0 = 650 - ((n - 1) * (s + gapPx)) / 2;
    const row = h('div', { class: 'pat-row', style: { width: n * (s + gapPx) + 30 + 'px', height: s + 34 + 'px' } });
    ctx.area.append(row);
    placeAt(row, 650, 300);
    let hole = null;
    q.seq.forEach((it, i) => {
      const cell = h('div', { class: `card pat-cell pop-in ${i === q.gap ? 'pat-hole' : ''}`, style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } });
      if (i === q.gap) {
        cell.textContent = '?';
        hole = cell;
      } else {
        const pic = h('div', { class: 'pic', html: art(it) });
        pic.style.width = pic.style.height = (it.size === 'small' ? 50 : it.size === 'big' ? 92 : 80) + '%';
        cell.append(pic);
      }
      ctx.area.append(cell);
      placeAt(cell, x0 + i * (s + gapPx), 300);
    });
    const os = 160;
    const og = 36;
    const ox0 = 650 - ((q.options.length - 1) * (os + og)) / 2;
    return new Promise((resolve) => {
      let done = false;
      q.options.forEach((it, i) => {
        const pic = h('div', { class: 'pic', html: art(it) });
        pic.style.width = pic.style.height = (it.size === 'small' ? 50 : it.size === 'big' ? 92 : 80) + '%';
        const card = h('button', { class: 'card pic-card pop-in', 'aria-label': name(it), style: { width: os + 'px', height: os + 'px', animationDelay: 500 + i * 80 + 'ms' } }, pic);
        ctx.area.append(card);
        placeAt(card, ox0 + i * (os + og), 575);
        card.addEventListener('click', async () => {
          if (done) return;
          sfx.pop();
          if (key(it) === key(answer)) {
            done = true;
            card.classList.add('right');
            hole.textContent = '';
            hole.classList.remove('pat-hole');
            hole.append(pic.cloneNode(true));
            anim(hole, 'pop', 500);
            card.style.visibility = 'hidden';
            const at = { x: hole.offsetLeft + s / 2, y: hole.offsetTop + s / 2 };
            await ctx.yes(cap(name(answer)), at);
            resolve();
          } else {
            ctx.no(card);
          }
        });
      });
      // Read the pattern aloud on the first levels; later the child must look.
      let text = q.say || (q.gap === n - 1 ? 'What comes next?' : 'What is missing?');
      if (!q.say && L <= 3) {
        const shown = q.seq.slice(0, q.gap).map(name);
        text = `${shown.join(', ')}... ${text}`;
      }
      ctx.prompt(text);
    });
  },
};

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

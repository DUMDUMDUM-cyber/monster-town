// Story order — put the pictures of a little story in the right order (DESAIN.md 8.4).
// Levels: 1 first two pictures shown: what comes next? (2 choices), 2 three shown: what comes
// last? (3 choices), 3 drag 3 pictures into boxes 1-2-3, 4 drag 4 pictures,
// 5 drag 4 pictures, with one extra picture from another story that does not belong.
import { h, pick, shuffle, anim, placeAt, cap, draggable, nearest, centerOf } from '../util.js';
import { picAt, paint, svg100 } from '../art.js';
import { sfx } from '../sound.js';

const PAPER = '#FFFBF2';
const soil = `<path d="M6 80 Q50 68 94 80 V90 Q94 94 90 94 H10 Q6 94 6 90 Z" ${paint('#A8764C', 2.4)}/>`;
const leafAt = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" ${paint('#7CC46A', 2)} transform="rotate(${r} ${x} ${y})"/>`;
const stem = (top) => `<path d="M50 80 V${top}" stroke="#4E8F3E" stroke-width="5" stroke-linecap="round"/>`;
const egg = (crack) => `<ellipse cx="50" cy="56" rx="26" ry="33" ${paint('#FFF4E2', 2.6)}/>${crack ? '<path d="M30 54 L38 48 L44 56 L52 46 L58 56 L66 48 L72 54" fill="none" stroke="#8A6A4A" stroke-width="2.6" stroke-linejoin="round"/>' : ''}`;
const chickHead = (x, y) => `<circle cx="${x}" cy="${y}" r="16" ${paint('#FFD84D', 2.4)}/><circle cx="${x - 5}" cy="${y - 3}" r="2.6" fill="#3A2C3F"/><circle cx="${x + 6}" cy="${y - 3}" r="2.6" fill="#3A2C3F"/><path d="M${x - 4} ${y + 4} L${x + 4} ${y + 4} L${x} ${y + 10} Z" fill="#FF9F45"/>`;
const snow = (n) => {
  const balls = [[50, 74, 20], [50, 44, 15], [50, 20, 11]].slice(0, Math.min(n, 3)).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${paint('#FFFFFF', 2.6)}/>`).join('');
  const ground = '<path d="M4 90 Q50 82 96 90 V96 H4 Z" fill="#E4EEF6"/>';
  const face = n >= 4 ? '<circle cx="46" cy="18" r="1.8" fill="#3A2C3F"/><circle cx="54" cy="18" r="1.8" fill="#3A2C3F"/><path d="M50 22 L60 24 L50 25 Z" fill="#FF9F45"/><rect x="40" y="2" width="20" height="6" rx="1" fill="#3A2C3F"/><rect x="44" y="-8" width="12" height="12" rx="1" fill="#3A2C3F"/><path d="M36 40 L22 30 M64 40 L78 30" stroke="#8A6A4A" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="42" r="1.8" fill="#3A2C3F"/><circle cx="50" cy="50" r="1.8" fill="#3A2C3F"/>' : '';
  return ground + balls + face;
};
const bite = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${PAPER}"/><path d="M${x - r * 0.6} ${y - r * 0.8} A${r} ${r} 0 0 0 ${x - r * 0.6} ${y + r * 0.8}" fill="none" stroke="#F7E6C4" stroke-width="5"/>`;
const sky = (c) => `<rect x="4" y="4" width="92" height="92" rx="14" fill="${c}"/>`;
const hill = (c) => `<path d="M4 76 Q50 56 96 76 V82 Q96 96 82 96 H18 Q4 96 4 82 Z" fill="${c}"/>`;
const sun = (y, c = '#FFD43B') => `<circle cx="50" cy="${y}" r="15" ${paint(c, 2.4)}/>`;
const leaf = '<path d="M10 70 Q40 30 90 46 Q70 86 10 70 Z" fill="#8BD07A" stroke="#4E8F3E" stroke-width="2.4"/><path d="M14 68 Q50 54 86 48" stroke="#4E8F3E" stroke-width="2" fill="none"/>';

// Each story: what each picture is called (for speech), and the drawings.
const STORIES = [
  { id: 'plant', words: ['a seed', 'a little sprout', 'a bud', 'a flower'], art: [
    () => `${soil}<ellipse cx="50" cy="74" rx="7" ry="5" ${paint('#8A5A32', 2)}/>`,
    () => `${stem(60)}${leafAt(42, 62, -30)}${leafAt(58, 62, 30)}${soil}`,
    () => `${stem(30)}${leafAt(40, 62, -30)}${leafAt(60, 52, 30)}<ellipse cx="50" cy="26" rx="8" ry="12" ${paint('#FF8FB1', 2.2)}/>${soil}`,
    () => `${picAt('flower', 10, -4, 80)}${soil}`,
  ] },
  { id: 'chick', words: ['an egg', 'a crack', 'a chick peeking out', 'a little chick'], art: [
    () => egg(false),
    () => egg(true),
    () => `${chickHead(50, 40)}<path d="M24 58 L32 50 L40 58 L48 50 L56 58 L64 50 L72 58 L76 60 Q74 90 50 90 Q26 90 24 60 Z" ${paint('#FFF4E2', 2.4)}/>`,
    () => `<ellipse cx="50" cy="66" rx="24" ry="20" ${paint('#FFD84D', 2.4)}/>${chickHead(50, 36)}<path d="M42 86 V94 M58 86 V94" stroke="#FF9F45" stroke-width="3.4" stroke-linecap="round"/><path d="M8 88 L14 80 L20 88 Z M80 90 L86 82 L92 90 Z" ${paint('#FFF4E2', 2)}/>`,
  ] },
  { id: 'snowman', words: ['one snowball', 'two snowballs', 'three snowballs', 'a snowman'], art: [
    () => snow(1), () => snow(2), () => snow(3), () => snow(4),
  ] },
  { id: 'balloon', words: ['a little balloon', 'a bigger balloon', 'a very big balloon', 'pop!'], art: [
    () => picAt('balloon', 32, 40, 40),
    () => picAt('balloon', 20, 20, 64),
    () => picAt('balloon', 4, 0, 94),
    () => `<path d="M50 12 L58 34 L82 26 L68 46 L90 58 L64 60 L68 86 L50 68 L32 86 L36 60 L10 58 L32 46 L18 26 L42 34 Z" ${paint('#EF476F', 2.4)}/><path d="M50 66 Q46 80 54 92" stroke="#A89A8C" stroke-width="2" fill="none"/>`,
  ] },
  { id: 'apple', words: ['an apple', 'one bite', 'more bites', 'the apple core'], art: [
    () => picAt('apple', 6, 4, 88),
    () => `${picAt('apple', 6, 4, 88)}${bite(88, 54, 14)}`,
    () => `${picAt('apple', 6, 4, 88)}${bite(88, 54, 14)}${bite(12, 58, 14)}${bite(70, 86, 12)}`,
    () => `<path d="M50 22 Q50 14 56 8" stroke="#7A5233" stroke-width="3" stroke-linecap="round"/><path d="M34 22 Q50 30 66 22 Q56 40 56 54 Q56 70 66 86 Q50 80 34 86 Q44 70 44 54 Q44 40 34 22 Z" fill="#FFF1D6" stroke="#E0B87A" stroke-width="2.4"/><path d="M34 22 Q50 30 66 22" stroke="#EC4F61" stroke-width="5" fill="none"/><path d="M34 86 Q50 80 66 86" stroke="#EC4F61" stroke-width="5" fill="none"/><ellipse cx="48" cy="50" rx="2" ry="3.4" fill="#5A3A22"/><ellipse cx="53" cy="58" rx="2" ry="3.4" fill="#5A3A22"/>`,
  ] },
  { id: 'butterfly', words: ['a tiny egg', 'a caterpillar', 'a cocoon', 'a butterfly'], art: [
    () => `${leaf}<circle cx="50" cy="56" r="5" ${paint('#FFF4E2', 2)}/>`,
    () => `${leaf}${[28, 38, 48, 58].map((x) => `<circle cx="${x}" cy="56" r="7" ${paint('#83CF74', 2)}/>`).join('')}<circle cx="70" cy="52" r="9" ${paint('#6CC46A', 2)}/><circle cx="73" cy="50" r="2" fill="#3A2C3F"/><path d="M68 43 L66 36 M74 43 L76 36" stroke="#3A2C3F" stroke-width="2" stroke-linecap="round"/>`,
    () => `<path d="M6 14 H94" stroke="#8A6A4A" stroke-width="6" stroke-linecap="round"/><path d="M50 14 V24" stroke="#8A6A4A" stroke-width="2.4"/><ellipse cx="50" cy="52" rx="14" ry="28" ${paint('#C9A27A', 2.4)}/><path d="M38 44 Q50 48 62 44 M37 56 Q50 60 63 56 M40 68 Q50 72 60 68" stroke="#9C7A55" stroke-width="2" fill="none"/>`,
    () => picAt('butterfly', 4, 4, 92),
  ] },
  { id: 'day', words: ['the morning', 'the middle of the day', 'the evening', 'the night'], art: [
    () => `${sky('#FCE3C4')}${sun(70, '#FFB547')}${hill('#8CCB6E')}`,
    () => `${sky('#BFE6FA')}${sun(28)}${hill('#8CCB6E')}`,
    () => `${sky('#F7B38A')}${sun(64, '#FF7A45')}${hill('#6FA65A')}`,
    () => `${sky('#2E3A6E')}<path d="M58 18 A18 18 0 1 0 64 52 A14 14 0 1 1 58 18 Z" fill="#FFE9A8"/><circle cx="22" cy="24" r="2.4" fill="#fff"/><circle cx="80" cy="30" r="2" fill="#fff"/>${hill('#3E5B4A')}`,
  ] },
];

// The steps used this time: 3-step stories leave out one middle picture.
function steps(story, n) {
  const all = [0, 1, 2, 3];
  if (n === 4) return all;
  const drop = pick([1, 2]);
  return all.filter((i) => i !== drop);
}
const pic = (story, i) => svg100(story.art[i]());
const tell = (story, idx) => {
  const w = idx.map((i) => story.words[i]);
  return `First ${w[0]}, then ${w.slice(1, -1).join(', then ')}${w.length > 2 ? ', and then ' : ''}${w[w.length - 1]}`;
};

function makeCard(ctx, html, s, x, y, i, cls) {
  const el = h('div', { class: `card pic-card sty-card pop-in ${cls}`, style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } },
    h('div', { class: 'pic', html, style: { width: '84%', height: '84%' } }));
  ctx.area.append(el);
  placeAt(el, x, y);
  return el;
}
function slot(ctx, k, s, x, y) {
  const el = h('div', { class: 'sty-slot', style: { width: s + 'px', height: s + 'px' } }, h('span', { class: 'sty-num' }, String(k + 1)));
  ctx.area.append(el);
  placeAt(el, x, y);
  return el;
}

export default {
  id: 'story',
  title: 'Story time',
  titleId: 'Urutan Cerita',
  card: '#E8E4FA',
  art: 'story',

  startRound(ctx) {
    ctx.round = { order: shuffle(STORIES), at: 0 };
    ctx.setPlace('table');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    const story = ctx.round.order[ctx.round.at++ % STORIES.length];
    const idx = steps(story, L === 1 || L === 3 ? 3 : 4);
    if (L <= 2) return whatNext(ctx, story, idx);
    return order(ctx, story, idx, L === 5);
  },
};

function whatNext(ctx, story, idx) {
  const n = idx.length;
  const s = 190;
  const gap = 40;
  const x0 = 660 - ((n - 1) * (s + gap)) / 2;
  idx.slice(0, -1).forEach((i, k) => makeCard(ctx, pic(story, i), s, x0 + k * (s + gap), 250, k, ''));
  const last = slot(ctx, n - 1, s, x0 + (n - 1) * (s + gap), 250);
  const want = idx[n - 1];
  const other = pick(STORIES.filter((x) => x !== story));
  const opts = [{ html: pic(story, want), ok: true }, { html: pic(other, pick([0, 1, 2, 3])) }];
  if (ctx.level >= 2) opts.push({ html: pic(story, idx[0]) });
  return new Promise((resolve) => {
    let done = false;
    const os = 180;
    const ox0 = 660 - ((opts.length - 1) * (os + 50)) / 2;
    shuffle(opts).forEach((o, i) => {
      const el = makeCard(ctx, o.html, os, ox0 + i * (os + 50), 570, n + i, 'sty-choice');
      el.setAttribute('role', 'button');
      el.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (o.ok) {
          done = true;
          el.classList.add('right');
          const c = centerOf(last);
          el.style.transition = 'left .35s, top .35s';
          placeAt(el, c.x, c.y);
          await ctx.yes(tell(story, idx), c);
          resolve();
        } else {
          ctx.no(el);
        }
      });
    });
    ctx.prompt('What happens next?');
  });
}

function order(ctx, story, idx, extra) {
  const n = idx.length;
  const s = n === 3 ? 200 : 180;
  const gap = n === 3 ? 50 : 34;
  const x0 = 660 - ((n - 1) * (s + gap)) / 2;
  const slots = idx.map((i, k) => ({ el: slot(ctx, k, s, x0 + k * (s + gap), 250), i }));
  const pieces = idx.map((i) => ({ i, html: pic(story, i) }));
  if (extra) {
    const other = pick(STORIES.filter((x) => x !== story));
    pieces.push({ i: -1, html: pic(other, pick([0, 1, 2, 3])) });
  }
  const ps = 150;
  const pgap = 34;
  const px0 = 660 - ((pieces.length - 1) * (ps + pgap)) / 2;
  return new Promise((resolve) => {
    let placed = 0;
    let wrong = 0;
    shuffle(pieces).forEach((p, k) => {
      const el = makeCard(ctx, p.html, ps, px0 + k * (ps + pgap), 590, k, 'sty-piece');
      draggable(el, {
        onDrop(c) {
          const t = nearest(c, slots.filter((x) => !x.done), s * 0.7);
          if (!t) return false;
          if (t.i === p.i) {
            t.done = true;
            el.dataset.locked = '1';
            const tc = centerOf(t.el);
            el.style.transition = 'left .25s, top .25s, width .25s, height .25s';
            el.style.width = el.style.height = s + 'px';
            placeAt(el, tc.x, tc.y);
            el.classList.add('right');
            sfx.ting();
            ctx.burst(tc.x, tc.y, 8, 110);
            placed++;
            if (placed >= n) ctx.yes(tell(story, idx), { x: 660, y: 250 }).then(resolve);
            else ctx.say(cap(story.words[p.i]) + '!');
            return true;
          }
          if (++wrong >= 2) ctx.miss();
          sfx.boop();
          anim(t.el, 'wiggle', 500);
          if (p.i === -1) ctx.say('That picture is from another story!');
          return false;
        },
      });
    });
    ctx.prompt(extra ? 'Put the story in order! One picture does not belong.' : `Put the story in order: ${n === 3 ? 'one, two, three' : 'one, two, three, four'}!`);
  });
}

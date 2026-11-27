// Opposites — big / small, hot / cold, up / down ... (DESAIN.md 8.4).
// Always three grey choice cards (owner, 27 Nov 2026). Levels: 1 which one is big?, 2 "this one is
// hot": find the opposite, 3 a picture without its word: find the opposite, 4 drag 3 pictures onto
// their opposites, 5 "What is the opposite of up?" with no picture.
import { h, pick, shuffle, sample, anim, placeAt, cap, draggable, nearest, centerOf } from '../util.js';
import { picAt, paint, svg100, faceInner } from '../art.js';
import { sfx } from '../sound.js';

const arrow = (up) => `<path d="${up ? 'M84 78 V22 M72 34 L84 22 L96 34' : 'M84 22 V78 M72 66 L84 78 L96 66'}" fill="none" stroke="#5A8FD8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
const glass = (full) => `${full ? '<path d="M27 30 L33 88 Q34 92 38 92 H62 Q66 92 67 88 L73 30 Z" fill="#7CC8F2" opacity=".85"/><ellipse cx="50" cy="30" rx="23" ry="4" fill="#B5E2F8"/>' : ''}<path d="M24 12 L32 88 Q33 94 38 94 H62 Q67 94 68 88 L76 12" fill="none" stroke="#7D8AA6" stroke-width="3.4" stroke-linejoin="round"/><path d="M33 22 L38 80" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
const pencil = (x1, x2) => `<rect x="${x1 + 14}" y="40" width="${x2 - x1 - 26}" height="20" rx="3" ${paint('#FFD166', 2.4)}/><path d="M${x1 + 14} 40 L${x1} 50 L${x1 + 14} 60 Z" ${paint('#F5D7B0', 2)}/><path d="M${x1 + 4} 47 L${x1} 50 L${x1 + 4} 53 Z" fill="#3A2C3F"/><rect x="${x2 - 14}" y="40" width="12" height="20" rx="3" ${paint('#F28AA0', 2.4)}/>`;
const box = (open) => open
  ? `${picAt('ball', 30, 14, 40)}<rect x="16" y="46" width="68" height="44" rx="4" ${paint('#D99A5B', 2.6)}/><path d="M16 46 L4 22 L32 14 L40 46 Z" ${paint('#E8B57C', 2.4)}/><path d="M84 46 L96 22 L68 14 L60 46 Z" ${paint('#E8B57C', 2.4)}/>`
  : `<rect x="16" y="40" width="68" height="50" rx="4" ${paint('#D99A5B', 2.6)}/><rect x="12" y="32" width="76" height="14" rx="4" ${paint('#E8B57C', 2.4)}/><path d="M50 32 V90" stroke="#C9483F" stroke-width="7"/>`;
const sky = (c) => `<rect x="4" y="4" width="92" height="92" rx="14" fill="${c}"/>`;
const tower = (n) => Array.from({ length: n }, (_, i) => `<rect x="34" y="${84 - i * 16}" width="32" height="16" rx="3" ${paint(['#EF476F', '#3A86FF', '#FFD166', '#06D6A0', '#A06CF0'][i % 5], 2.2)}/>`).join('');

const ART = {
  big: () => picAt('ball', 4, 4, 92),
  small: () => picAt('ball', 32, 46, 38),
  hot: () => `<circle cx="50" cy="52" r="22" ${paint('#FF9542', 2.6)}/>${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${(50 + Math.cos(a) * 30).toFixed(1)} ${(52 + Math.sin(a) * 30).toFixed(1)} L${(50 + Math.cos(a) * 42).toFixed(1)} ${(52 + Math.sin(a) * 42).toFixed(1)}" stroke="#F2683C" stroke-width="6" stroke-linecap="round"/>`; }).join('')}<circle cx="43" cy="48" r="3" fill="#7A3A1A"/><circle cx="57" cy="48" r="3" fill="#7A3A1A"/><path d="M42 58 Q50 64 58 58" fill="none" stroke="#7A3A1A" stroke-width="2.6" stroke-linecap="round"/>`,
  cold: () => `<rect x="18" y="22" width="64" height="62" rx="12" fill="#CDEEFB" stroke="#5DA9D6" stroke-width="3"/><path d="M28 34 L40 30 M28 44 L34 42" stroke="#fff" stroke-width="5" stroke-linecap="round"/>${[[50, 53]].map(([x, y]) => `<path d="M${x} ${y - 18} V${y + 18} M${x - 16} ${y - 9} L${x + 16} ${y + 9} M${x - 16} ${y + 9} L${x + 16} ${y - 9}" stroke="#3C8FC4" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
  happy: () => faceInner('happy', 'tobi'),
  sad: () => faceInner('sad', 'tobi'),
  up: () => `${picAt('balloon', 4, 8, 72)}${arrow(true)}`,
  down: () => `${picAt('ball', 6, 34, 60)}${arrow(false)}`,
  full: () => glass(true),
  empty: () => glass(false),
  long: () => pencil(4, 96),
  short: () => pencil(32, 68),
  open: () => box(true),
  closed: () => box(false),
  day: () => `${sky('#BFE6FA')}<circle cx="50" cy="44" r="18" ${paint('#FFD43B', 2.4)}/><path d="M4 80 Q50 64 96 80 V82 Q96 96 82 96 H18 Q4 96 4 82 Z" fill="#8CCB6E"/>`,
  night: () => `${sky('#2E3A6E')}<path d="M60 26 A20 20 0 1 0 66 62 A16 16 0 1 1 60 26 Z" fill="#FFE9A8"/><circle cx="24" cy="24" r="2.6" fill="#fff"/><circle cx="78" cy="20" r="2" fill="#fff"/><circle cx="82" cy="50" r="2.4" fill="#fff"/><path d="M4 80 Q50 64 96 80 V82 Q96 96 82 96 H18 Q4 96 4 82 Z" fill="#3E5B4A"/>`,
  tall: () => tower(5),
  'short ': () => tower(2), // short (not tall); a space keeps it apart from short (not long)
};
const PAIRS = [['big', 'small'], ['hot', 'cold'], ['happy', 'sad'], ['up', 'down'], ['full', 'empty'], ['long', 'short'], ['open', 'closed'], ['day', 'night'], ['tall', 'short ']];
const say = (w) => w.trim();
const card = (ctx, w, s, x, y, i, extra = '') => {
  const el = h('button', { class: `card pic-card opp-card pop-in ${extra}`, 'aria-label': say(w), style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } },
    h('div', { class: 'pic', html: svg100(ART[w]()), style: { width: '80%', height: '80%' } }));
  ctx.area.append(el);
  placeAt(el, x, y);
  return el;
};
// Other pictures that are not the answer and do not use the same word.
const others = (pr, n) => sample(PAIRS.filter((p) => p !== pr && !p.some((w) => pr.some((x) => say(x) === say(w)))), n).map((p) => pick(p));

export default {
  id: 'opposites',
  title: 'Opposites',
  titleId: 'Lawan Kata',
  card: '#FFF3D6',
  art: 'opposites',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('candy');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    if (L === 4) return match(ctx);
    const pr = pick(PAIRS.filter((p) => p !== ctx.round.last));
    ctx.round.last = pr;
    const flip = Math.random() < 0.5;
    const [a, b] = flip ? [pr[1], pr[0]] : pr;
    let options;
    let text;
    let want;
    if (L === 1) {
      options = shuffle([a, b, ...others(pr, 1)]);
      want = a;
      text = `Which one is ${say(a)}?`;
    } else {
      // Always three choices (owner, 27 Nov 2026).
      want = b;
      options = shuffle([b, ...others(pr, 2)]);
      if (L <= 3) {
        const show = card(ctx, a, 200, 660, 230, 0, 'opp-show');
        show.disabled = true;
        text = L === 2 ? `This one is ${say(a)}. What is the opposite of ${say(a)}?` : 'Look at this picture. Find its opposite!';
      } else {
        text = `What is the opposite of ${say(a)}?`;
      }
    }
    const n = options.length;
    const s = 210;
    const gap = 60;
    const y = L === 1 || L === 5 ? 430 : 540;
    const x0 = 660 - ((n - 1) * (s + gap)) / 2;
    return new Promise((resolve) => {
      let done = false;
      options.forEach((w, i) => {
        const el = card(ctx, w, s, x0 + i * (s + gap), y, i, 'opp-opt');
        el.addEventListener('click', async () => {
          if (done) return;
          sfx.pop();
          if (w === want) {
            done = true;
            el.classList.add('right');
            await ctx.yes(L === 1 ? cap(say(a)) : `${cap(say(a))} and ${say(b)}`);
            resolve();
          } else {
            ctx.no(el, L === 1 ? 'Try again!' : `That one is ${say(w)}. Try again!`);
          }
        });
      });
      ctx.prompt(text);
    });
  },
};

// Level 4: drag each picture onto its opposite.
function match(ctx) {
  let prs;
  for (;;) {
    prs = sample(PAIRS, 3);
    const words = prs.flat().map(say);
    if (new Set(words).size === words.length) break;
  }
  const flips = prs.map((p) => (Math.random() < 0.5 ? [p[1], p[0]] : p));
  const s = 180;
  const x0 = 660 - 230;
  const targets = flips.map((p, i) => {
    const el = card(ctx, p[0], s, x0 + i * 230, 250, i, 'opp-target');
    el.disabled = true;
    return { el, w: p[1] };
  });
  return new Promise((resolve) => {
    let placed = 0;
    let wrong = 0;
    shuffle(flips.map((p) => p[1])).forEach((w, i) => {
      const el = card(ctx, w, 150, x0 + i * 230, 570, 3 + i, 'opp-piece');
      draggable(el, {
        onTap: () => ctx.say(say(w)),
        onDrop(c) {
          const t = nearest(c, targets.filter((x) => !x.done), s * 0.7);
          if (!t) return false;
          if (t.w === w) {
            t.done = true;
            el.dataset.locked = '1';
            const tc = centerOf(t.el);
            el.style.transition = 'left .25s, top .25s';
            placeAt(el, tc.x, tc.y + 172);
            t.el.classList.add('right');
            el.classList.add('right');
            sfx.ting();
            ctx.burst(tc.x, tc.y, 8, 110);
            placed++;
            const pr = flips.find((p) => p[1] === w);
            if (placed >= 3) ctx.yes('All the opposites match', { x: 660, y: 330 }).then(resolve);
            else ctx.say(`${cap(say(pr[0]))} and ${say(w)}!`);
            return true;
          }
          if (++wrong >= 2) ctx.miss();
          sfx.boop();
          anim(t.el, 'wiggle', 500);
          return false;
        },
      });
    });
    ctx.prompt('Put each picture under its opposite!');
  });
}

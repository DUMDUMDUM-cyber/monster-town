// Shadows — match a picture with its dark shadow (DESAIN.md 8.3).
// Levels: 1 pick the right shadow (3, very different shapes), 2 pick from 4 with one look-alike,
// 3 drag 3 pictures onto their shadows, 4 pick from 4 shadows that all look alike, 5 drag 4
// look-alike pictures onto their shadows; some shadows are turned the other way.
import { h, pick, shuffle, sample, anim, placeAt, draggable, nearest, centerOf } from '../util.js';
import { picSVG } from '../art.js';
import { sfx } from '../sound.js';

// Pictures that have a similar outline.
const GROUPS = [
  ['dog', 'cat', 'cow', 'pig', 'horse', 'sheep', 'lion', 'rabbit'],
  ['apple', 'orange', 'ball', 'balloon', 'egg', 'cake'],
  ['bird', 'duck', 'butterfly', 'plane'],
  ['cup', 'hat', 'shoe', 'sock', 'shirt'],
  ['fish', 'crab', 'frog'],
  ['banana', 'carrot', 'spoon', 'strawberry'],
  ['car', 'bed', 'chair', 'book'],
  ['teddy bear', 'doll', 'flower'],
];
const groupOf = (w) => GROUPS.find((g) => g.includes(w));

const shadowCard = (w, s, flip, i) => h('div', { class: 'card shd-card pop-in', style: { width: s + 'px', height: s + 'px', animationDelay: i * 70 + 'ms' } },
  h('div', { class: 'pic shd-pic', html: picSVG(w), style: { transform: flip ? 'scaleX(-1)' : '' } }));

export default {
  id: 'shadow',
  title: 'Shadows',
  titleId: 'Bayangan',
  card: '#E4E1F2',
  art: 'shadow',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('beach');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    if (L === 3) return dragMatch(ctx, 3, false);
    if (L === 5) return dragMatch(ctx, 4, true);
    return pickShadow(ctx);
  },
};

function pickShadow(ctx) {
  const L = ctx.level;
  const g = pick(L >= 4 ? GROUPS.filter((x) => x.length >= 4) : GROUPS);
  const w = pick(g.filter((x) => x !== ctx.round.last));
  ctx.round.last = w;
  const otherGroups = GROUPS.filter((x) => x !== g);
  let others;
  if (L === 1) others = sample(otherGroups, 2).map((x) => pick(x));
  else if (L === 2) others = [pick(g.filter((x) => x !== w)), ...sample(otherGroups, 2).map((x) => pick(x))];
  else others = sample(g.filter((x) => x !== w), 3);
  const options = shuffle([w, ...others]);
  const show = h('div', { class: 'card shd-show pop-in' }, h('div', { class: 'pic', html: picSVG(w) }));
  ctx.area.append(show);
  placeAt(show, 640, 250);
  const n = options.length;
  const s = n === 3 ? 210 : 180;
  const gap = n === 3 ? 50 : 30;
  const x0 = 640 - ((n - 1) * (s + gap)) / 2;
  return new Promise((resolve) => {
    let done = false;
    options.forEach((o, i) => {
      const c = shadowCard(o, s, false, i);
      c.setAttribute('role', 'button');
      ctx.area.append(c);
      placeAt(c, x0 + i * (s + gap), 560);
      c.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (o === w) {
          done = true;
          c.classList.add('right', 'lit');
          await ctx.yes(`The ${w}'s shadow`);
          resolve();
        } else {
          ctx.no(c);
        }
      });
    });
    ctx.prompt(`Which shadow is the ${w}?`);
  });
}

// Drag each picture onto its shadow.
function dragMatch(ctx, n, hard) {
  let words;
  if (hard) {
    const g = pick(GROUPS.filter((x) => x.length >= 4));
    words = sample(g, 4);
  } else {
    words = sample(GROUPS, n).map((g) => pick(g));
  }
  const s = n === 3 ? 200 : 170;
  const gap = n === 3 ? 60 : 36;
  const x0 = 640 - ((n - 1) * (s + gap)) / 2;
  const shadows = shuffle(words).map((w, i) => {
    const c = shadowCard(w, s, hard && Math.random() < 0.5, i);
    ctx.area.append(c);
    placeAt(c, x0 + i * (s + gap), 520);
    return { el: c, w };
  });
  const ps = n === 3 ? 150 : 132;
  const px0 = 640 - ((n - 1) * (ps + 50)) / 2;
  return new Promise((resolve) => {
    let placed = 0;
    let wrong = 0;
    shuffle(words).forEach((w, i) => {
      const p = h('div', { class: 'card shd-piece pop-in', 'aria-label': w, style: { width: ps + 'px', height: ps + 'px', animationDelay: 300 + i * 70 + 'ms' } }, h('div', { class: 'pic', html: picSVG(w) }));
      ctx.area.append(p);
      placeAt(p, px0 + i * (ps + 50), 230);
      draggable(p, {
        onTap: () => ctx.say(w),
        onDrop(c) {
          const t = nearest(c, shadows.filter((x) => !x.done), s * 0.6);
          if (!t) return false;
          if (t.w === w) {
            t.done = true;
            p.dataset.locked = '1';
            const tc = centerOf(t.el);
            p.style.transition = 'left .25s, top .25s, opacity .3s';
            placeAt(p, tc.x, tc.y);
            p.classList.add('gone');
            t.el.classList.add('lit');
            sfx.ting();
            ctx.burst(tc.x, tc.y, 8, 110);
            placed++;
            if (placed >= n) {
              ctx.yes('All the shadows match', { x: 640, y: 520 }).then(resolve);
            } else {
              ctx.say(`The ${w}!`);
            }
            return true;
          }
          wrong++;
          if (wrong >= 2) ctx.miss();
          sfx.boop();
          anim(t.el, 'wiggle', 500);
          return false;
        },
      });
    });
    ctx.prompt('Put each picture on its shadow!');
  });
}

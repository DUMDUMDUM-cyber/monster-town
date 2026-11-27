// Clock — read and set the time (DESAIN.md 8.3).
// Levels: 1 find the clock that shows "3 o'clock" (3 clocks), 2 turn the long hand to make
// an o'clock time (the short hand moves along, like a real clock), 3 find o'clock or half past
// (4 clocks), 4 turn the hands to o'clock or half past, 5 quarter past / quarter to (4 clocks)
// or "it is 3 o'clock, make it one hour later".
import { h, pick, shuffle, anim, placeAt, toStage } from '../util.js';
import { icon } from '../art.js';
import { sfx } from '../sound.js';

const hourOf = (t) => Math.floor(t / 60) % 12 || 12;
export function timeWords(t) {
  t = ((t % 720) + 720) % 720;
  const m = t % 60;
  const hr = hourOf(t);
  if (m === 0) return `${hr} o'clock`;
  if (m === 30) return `half past ${hr}`;
  if (m === 15) return `quarter past ${hr}`;
  if (m === 45) return `quarter to ${hourOf(t + 60)}`;
  return `${hr}:${String(m).padStart(2, '0')}`;
}

// A clock face; the hands are .hh (hour) and .mh (minute) so they can be turned later.
export function clockSVG(t, { big = false } = {}) {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const r1 = i % 5 ? 88 : 84;
    ticks += `<path d="M${(100 + Math.sin(a) * r1).toFixed(1)} ${(100 - Math.cos(a) * r1).toFixed(1)} L${(100 + Math.sin(a) * 92).toFixed(1)} ${(100 - Math.cos(a) * 92).toFixed(1)}" stroke="#A08062" stroke-width="${i % 5 ? 1.2 : 2.6}" stroke-linecap="round"/>`;
  }
  let nums = '';
  for (let n = 1; n <= 12; n++) {
    const a = (n * 30 * Math.PI) / 180;
    nums += `<text x="${(100 + Math.sin(a) * 70).toFixed(1)}" y="${(100 - Math.cos(a) * 70 + 7).toFixed(1)}" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-size="${big ? 19 : 21}" font-weight="700" fill="${n % 3 ? '#5A4632' : '#E85D6A'}">${n}</text>`;
  }
  return `<svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">`
    + `<circle cx="100" cy="100" r="97" fill="#FFCF4D" stroke="#C9952C" stroke-width="4"/><circle cx="100" cy="100" r="92" fill="#FFFBF2"/>${ticks}${nums}`
    + `<g class="hh" transform="rotate(${hourAngle(t)} 100 100)"><path d="M100 108 L100 52" stroke="#3B6FD6" stroke-width="9" stroke-linecap="round"/></g>`
    + `<g class="mh" transform="rotate(${(t % 60) * 6} 100 100)"><path d="M100 112 L100 22" stroke="#E85D6A" stroke-width="5.5" stroke-linecap="round"/><circle cx="100" cy="24" r="${big ? 7 : 0}" fill="#E85D6A"/></g>`
    + `<circle cx="100" cy="100" r="7" fill="#5A4632"/></svg>`;
}
const hourAngle = (t) => (((t / 60) % 12) * 30);

const TIMES = (step) => { const out = []; for (let t = 60; t <= 720; t += step) out.push(t % 720); return out; };

export default {
  id: 'clock',
  title: 'Clock',
  titleId: 'Jam',
  card: '#FFF3C9',
  art: 'clock',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('orchard');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    const fresh = (list) => { const t = pick(list.filter((x) => x !== ctx.round.last)); ctx.round.last = t; return t; };
    if (L === 1) return pickClock(ctx, fresh(TIMES(60)), 3, 60);
    if (L === 2) return setClock(ctx, fresh(TIMES(60)), 60);
    if (L === 3) return pickClock(ctx, fresh(TIMES(30)), 4, 30);
    if (L === 4) return setClock(ctx, fresh(TIMES(30)), 30);
    if (Math.random() < 0.5) return pickClock(ctx, fresh(TIMES(15).filter((t) => t % 30)), 4, 15);
    return setClock(ctx, fresh(TIMES(60)), 60, true);
  },
};

// Tap the clock that shows the time Moko says.
function pickClock(ctx, target, n, step) {
  // Wrong clocks: easy to mix up (same hour, hands swapped, half an hour off...).
  const near = shuffle([target + 60, target - 60, target + step, target - step, target + 30, target + 120, target - 180, (target % 60 ? 0 : 30) + Math.floor(target / 60) * 60])
    .map((t) => ((t % 720) + 720) % 720)
    .filter((t, i, a) => t !== target && a.indexOf(t) === i && (step === 60 ? t % 60 === 0 : step === 30 ? t % 30 === 0 : true));
  const options = shuffle([target, ...near.slice(0, n - 1)]);
  const s = n === 3 ? 250 : 220;
  const gap = n === 3 ? 60 : 36;
  const x0 = 650 - ((n - 1) * (s + gap)) / 2;
  return new Promise((resolve) => {
    let done = false;
    options.forEach((t, i) => {
      const card = h('button', { class: 'card pic-card pop-in clk-card', 'aria-label': timeWords(t), style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } },
        h('div', { class: 'pic', html: clockSVG(t) }));
      ctx.area.append(card);
      placeAt(card, x0 + i * (s + gap), 420);
      card.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        if (t === target) {
          done = true;
          card.classList.add('right');
          await ctx.yes(cap(timeWords(target)));
          resolve();
        } else {
          ctx.no(card, `That is ${timeWords(t)}. Try again!`);
        }
      });
    });
    ctx.prompt(`Find ${timeWords(target)}!`);
  });
}

// Turn the long hand round; the short hand follows. Press the tick when it is right.
function setClock(ctx, target, step, later = false) {
  const startAt = later ? ((target - 60) % 720 + 720) % 720 : (target + pick([180, 240, 300, 420])) % 720;
  let total = startAt;
  const box = h('div', { class: 'clk-big pop-in', html: clockSVG(total, { big: true }) });
  ctx.area.append(box);
  placeAt(box, 560, 430);
  const hh = box.querySelector('.hh');
  const mh = box.querySelector('.mh');
  const draw = () => {
    hh.setAttribute('transform', `rotate(${hourAngle(((total % 720) + 720) % 720)} 100 100)`);
    mh.setAttribute('transform', `rotate(${(((total % 60) + 60) % 60) * 6} 100 100)`);
  };
  const hint = h('div', { class: 'clk-hint', html: icon('replay', 46, 3) });
  ctx.area.append(hint);
  placeAt(hint, 790, 230);
  let drag = null;
  let lastTick = 0;
  const angleAt = (e) => {
    const p = toStage(e.clientX, e.clientY);
    const c = { x: box.offsetLeft + box.offsetWidth / 2, y: box.offsetTop + box.offsetHeight / 2 };
    let a = Math.atan2(p.x - c.x, -(p.y - c.y));
    if (a < 0) a += Math.PI * 2;
    return (a / (Math.PI * 2)) * 60;
  };
  box.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { box.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    drag = { id: e.pointerId, m: angleAt(e) };
    hint.classList.add('gone');
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const m = angleAt(e);
    let d = m - drag.m;
    if (d < -30) d += 60;
    if (d > 30) d -= 60;
    drag.m = m;
    total += d;
    draw();
    if (Math.abs(total - lastTick) >= 5) { lastTick = total; sfx.click(); }
  });
  const end = () => {
    if (!drag) return;
    drag = null;
    total = Math.round(total / step) * step;
    draw();
  };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);

  const ok = h('button', { class: 'clk-ok pop-in', 'aria-label': 'Check', html: icon('check', 64, 3.4) });
  ctx.area.append(ok);
  placeAt(ok, 930, 520);
  return new Promise((resolve) => {
    let done = false;
    ok.addEventListener('click', async () => {
      if (done || drag) return;
      sfx.pop();
      const now = ((total % 720) + 720) % 720;
      if (now === target) {
        done = true;
        box.classList.add('right');
        anim(box, 'pop', 500);
        await ctx.yes(cap(timeWords(target)), { x: 560, y: 430 });
        resolve();
      } else {
        ctx.no(box, `That is ${timeWords(now)}. Try again!`);
      }
    });
    ctx.prompt(later
      ? `It is ${timeWords(startAt)}. Make it one hour later!`
      : `Turn the long hand. Make it ${timeWords(target)}!`);
  });
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

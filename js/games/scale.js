// Balance scale — how many stones make it level? (DESAIN.md 8.4, changed 27 Nov 2026)
// The child puts stones on the right pan (tap the pile), takes them off (tap the pan), watches the
// scale tip, and presses OK when it is level. Levels: 1 stones on the left (1-3), 2 one thing
// (2-4 stones), 3 one thing (3-6), 4 two things together (4-8), 5 two things (6-10), and the
// right pan already has a few stones on it, so some may have to come off.
import { h, pick, sample, anim, placeAt, NUM } from '../util.js';
import { picSVG, paint, icon } from '../art.js';
import { sfx } from '../sound.js';

// Weight in stones.
const W = {
  sock: 1, egg: 1, strawberry: 1, apple: 2, banana: 2, cup: 2, ball: 2,
  shoe: 3, book: 3, cheese: 3, bread: 3, 'teddy bear': 3, milk: 4, duck: 4, rabbit: 4, cat: 5,
  chair: 6, watermelon: 6, dog: 7,
};
const NAMES = Object.keys(W);
const PIVOT = { x: 640, y: 250 };
const ARM = 250;
const MAX = 12;

const stoneSVG = (k) => {
  const c = ['#B9BFCB', '#C9C1B4', '#AEB8C4'][k % 3];
  return `<svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true"><path d="M10 52 Q6 26 30 16 Q52 6 74 16 Q96 28 90 54 Q84 74 50 74 Q16 74 10 52 Z" ${paint(c, 4)}/><ellipse cx="36" cy="30" rx="12" ry="6" fill="#fff" opacity=".5" transform="rotate(-20 36 30)"/><circle cx="64" cy="54" r="3" fill="#8E96A4" opacity=".6"/><circle cx="48" cy="60" r="2" fill="#8E96A4" opacity=".6"/></svg>`;
};
const STAND = `<svg viewBox="0 0 160 340" width="100%" height="100%" aria-hidden="true"><path d="M70 20 H90 L96 300 H64 Z" ${paint('#B98A5E', 3)}/><rect x="10" y="296" width="140" height="34" rx="14" ${paint('#9C6E45', 3)}/><circle cx="80" cy="20" r="18" ${paint('#FFD166', 3)}/></svg>`;
const BEAM = `<svg viewBox="0 0 540 30" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><rect x="4" y="6" width="532" height="18" rx="9" ${paint('#C9925F', 3)}/></svg>`;
const PAN = `<svg viewBox="0 0 240 220" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><path d="M120 0 L22 186 M120 0 L218 186" stroke="#8A6A4A" stroke-width="3"/><path d="M10 184 H230 Q222 216 120 216 Q18 216 10 184 Z" ${paint('#9FB4C8', 3)}/></svg>`;

// The scale: a stand, a beam that tips, and two pans that hang from the ends.
function makeScale(ctx) {
  const stand = h('div', { class: 'sc-stand', html: STAND });
  const beam = h('div', { class: 'sc-beam', html: BEAM });
  const pans = [0, 1].map(() => h('div', { class: 'sc-pan' }, h('div', { class: 'sc-load' }), h('div', { class: 'sc-dish', html: PAN })));
  ctx.area.append(stand, beam, ...pans);
  placeAt(stand, PIVOT.x, PIVOT.y + 150);
  placeAt(beam, PIVOT.x, PIVOT.y);
  const tilt = (deg) => {
    beam.style.transform = `rotate(${deg}deg)`;
    const a = (deg * Math.PI) / 180;
    [-1, 1].forEach((side, i) => {
      const x = PIVOT.x + side * ARM * Math.cos(a);
      const y = PIVOT.y + side * ARM * Math.sin(a);
      placeAt(pans[i], x, y + 110);
    });
  };
  tilt(0);
  return { pans, loads: pans.map((p) => p.firstChild), tilt };
}
const angle = (l, r) => (l === r ? 0 : Math.max(-14, Math.min(14, (r - l) * 4)) || (r > l ? 6 : -6));
const stone = (k, pop) => h('div', { class: `sc-stone ${pop ? 'pop-in' : ''}`, html: stoneSVG(k) });

function things(L, last) {
  for (;;) {
    let list;
    if (L === 2) list = [pick(NAMES.filter((n) => W[n] >= 2 && W[n] <= 4))];
    else if (L === 3) list = [pick(NAMES.filter((n) => W[n] >= 3 && W[n] <= 6))];
    else list = sample(NAMES, 2);
    const sum = list.reduce((a, n) => a + W[n], 0);
    const [lo, hi] = { 2: [2, 4], 3: [3, 6], 4: [4, 8], 5: [6, 10] }[L];
    if (sum >= lo && sum <= hi && list[0] !== last) return { list, sum };
  }
}

export default {
  id: 'scale',
  title: 'Balance it',
  titleId: 'Timbangan',
  card: '#E3EEF8',
  art: 'scale',

  startRound(ctx) {
    ctx.round = { last: null, told: false };
    ctx.setPlace('space');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    const sc = makeScale(ctx);
    let left;
    let names = [];
    if (L === 1) {
      left = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < left; i++) sc.loads[0].append(stone(i));
    } else {
      const t = things(L, ctx.round.last);
      names = t.list;
      left = t.sum;
      ctx.round.last = names[0];
      for (const n of names) sc.loads[0].append(h('div', { class: `sc-thing ${names.length > 1 ? 'small' : ''}`, html: picSVG(n) }));
    }
    let right = 0;
    const add = (pop) => { sc.loads[1].append(stone(right, pop)); right++; };
    if (L === 5) for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) add(false);
    sc.tilt(angle(left, right));
    const pile = h('button', { class: 'sc-pile pop-in', 'aria-label': 'Add a stone' }, ...[0, 1, 2].map((k) => stone(k)));
    const ok = h('button', { class: 'clk-ok pop-in', 'aria-label': 'Check', html: icon('check', 64, 3.4) });
    ctx.area.append(pile, ok);
    placeAt(pile, 1080, 470);
    placeAt(ok, 1080, 640);
    const what = names.length === 2 ? `the ${names[0]} and the ${names[1]}` : names.length ? `the ${names[0]}` : 'these stones';
    return new Promise((resolve) => {
      let done = false;
      const update = () => sc.tilt(angle(left, right));
      pile.addEventListener('click', () => {
        if (done || right >= MAX) return;
        sfx.click();
        anim(pile, 'press', 300);
        add(true);
        update();
      });
      sc.pans[1].addEventListener('click', () => {
        if (done || !right) return;
        sfx.whoosh();
        right--;
        sc.loads[1].lastChild.remove();
        update();
      });
      ok.addEventListener('click', async () => {
        if (done) return;
        sfx.pop();
        anim(ok, 'press', 300);
        if (right === left) {
          done = true;
          sc.pans.forEach((p) => p.classList.add('right'));
          await ctx.yes(names.length ? `${what.charAt(0).toUpperCase() + what.slice(1)} weigh${names.length > 1 ? '' : 's'} ${NUM[left]} stones` : 'It is level', { x: 640, y: 250 });
          resolve();
        } else if (right > left) {
          ctx.no(sc.pans[1], 'The stones are too heavy! Tap the pan to take one off.');
        } else {
          ctx.no(sc.pans[1], 'Not level yet. The stones are too light! Add more.');
        }
      });
      let text = L === 1 ? 'Make the scale level! Put stones on the other side.' : `How many stones weigh the same as ${what}?`;
      if (!ctx.round.told) {
        ctx.round.told = true;
        text += ' Tap the stones to add one, tap the pan to take one off, then press OK.';
      }
      ctx.prompt(text);
    });
  },
};

// Sort it! — drag things into the right basket.
// Levels (DESAIN.md 7.6): 1 four colours, 2 colour + shape, 3 colour only named (9 colours),
// 4 groups (animals / food / toys / clothes) taking turns with "smallest to biggest",
// 5 two rules at once (big red / small red / big blue / small blue).
import { h, pick, rand, sample, shuffle, sleep, anim, cap, placeAt, moveTo, nearest, draggable } from '../util.js';
import { picSVG, shapeSVG, shade, grad, lineOf } from '../art.js';
import { sfx } from '../sound.js';

const C = {
  red: '#EF476F', blue: '#3A86FF', yellow: '#FFD166', green: '#06D6A0', orange: '#FF9542',
  purple: '#9B5DE5', pink: '#FF8FB1', brown: '#A0673A', black: '#3A3A48',
};
const BASIC = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
const THINGS = ['ball', 'car', 'cup', 'hat', 'shoe', 'balloon', 'fish', 'flower', 'book'];
const TOKENS = ['circle', 'square', 'triangle', 'star'];
const WOOD = '#E8B07A';

// "signs" are the clearest members, shown on the basket.
const GROUPS = [
  { id: 'animals', name: 'animals', signs: ['dog', 'cat', 'cow', 'lion'], words: ['dog', 'cat', 'cow', 'fish', 'bird', 'duck', 'pig', 'rabbit', 'horse', 'sheep', 'frog', 'lion', 'crab', 'butterfly'] },
  { id: 'food', name: 'food', signs: ['apple', 'banana', 'carrot', 'strawberry'], words: ['apple', 'banana', 'orange', 'grapes', 'strawberry', 'watermelon', 'carrot', 'bread', 'egg', 'cake', 'cheese'] },
  { id: 'toys', name: 'toys', signs: ['teddy bear', 'ball', 'doll'], words: ['ball', 'car', 'teddy bear', 'doll', 'balloon'] },
  { id: 'clothes', name: 'clothes', signs: ['shirt', 'sock', 'shoe', 'hat'], words: ['hat', 'shoe', 'shirt', 'sock'] },
];
const ORDER_THINGS = ['ball', 'teddy bear', 'duck', 'apple', 'fish', 'flower', 'balloon', 'car', 'cup', 'hat', 'strawberry', 'cat'];

// A woven basket in one clear colour (storybook style: soft gradient, line in a darker shade).
function basketSVG(fill) {
  const weave = fill === C.black ? '#6B6B7A' : shade(fill, 0.82);
  const ln = lineOf(fill);
  const posts = [52, 76, 100, 124, 148].map((x, i) => `M${x} 64 L${x - (i - 2) * 4} 158`).join(' ');
  return `<svg viewBox="0 0 200 170" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><ellipse cx="100" cy="164" rx="80" ry="8" fill="#5A3E22" opacity=".18"/><path d="M14 50 H186 L166 156 Q164 164 154 164 H46 Q36 164 34 156 Z" fill="${grad(fill)}" stroke="${ln}" stroke-width="3" stroke-linejoin="round"/><path d="${posts}" stroke="${weave}" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M38 86 H162 M42 112 H158 M46 138 H154" stroke="${weave}" stroke-width="5" stroke-linecap="round"/><rect x="6" y="36" width="188" height="26" rx="13" fill="${grad(shade(fill, 0.9))}" stroke="${ln}" stroke-width="3"/><path d="M22 44 H178" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>`;
}

// "small to big" sign under the shelf: a little dot, an arrow, a big dot.
function orderSign() {
  const dot = (cx, r) => `<circle cx="${cx}" cy="22" r="${r}" fill="${grad('#FFD166')}" stroke="${lineOf('#FFD166')}" stroke-width="2.4"/>`;
  return `<svg viewBox="0 0 840 44" width="100%" height="100%" aria-hidden="true">${dot(26, 7)}<path d="M50 22 H780 M762 12 L782 22 L762 32" fill="none" stroke="#B08A62" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12"/>${dot(812, 18)}</svg>`;
}

function dropInto(it, basket, w) {
  it.dataset.locked = '1';
  moveTo(it, basket.el.offsetLeft + w / 2, basket.el.offsetTop + 50, 250);
  it.classList.add('into');
  sfx.click();
  anim(basket.el, 'pop', 500);
}

// One thing, many baskets (levels 1-4).
function singleSort(ctx, baskets, item, prompt, praise, bw = 200) {
  const area = ctx.area;
  const n = baskets.length;
  baskets.forEach((b, i) => {
    const el = h('div', { class: 'basket pop-in', style: { width: bw + 'px', height: '170px', animationDelay: i * 60 + 'ms' } });
    if (b.shape) {
      el.innerHTML = basketSVG(WOOD);
      el.append(h('div', { class: 'basket-icon', html: shapeSVG(b.shape, C[b.color]) }));
    } else if (b.sign) {
      el.innerHTML = basketSVG(WOOD);
      el.append(h('div', { class: 'basket-sign', html: picSVG(b.sign) }));
    } else {
      el.innerHTML = basketSVG(C[b.color]);
    }
    area.append(el);
    placeAt(el, 330 + (i + 0.5) * (820 / n), 650);
    b.el = el;
    b.reach = 150;
  });

  const it = h('div', { class: 'item pop-in', html: item.html, style: { width: item.size + 'px', height: item.size + 'px' } });
  area.append(it);
  placeAt(it, 660, 300);
  const target = item.target;

  return new Promise((resolve) => {
    let done = false;
    draggable(it, {
      onDrop: (p) => {
        if (done) return true;
        const hit = nearest(p, baskets, 150);
        if (!hit) return false;
        if (hit === target) {
          done = true;
          dropInto(it, hit, bw);
          ctx.yes(praise).then(resolve);
          return true;
        }
        ctx.no(hit.el);
        return false;
      },
    });
    ctx.prompt(prompt);
  });
}

// Level 4, odd questions: put 3-5 copies in a row on the shelf, smallest to biggest.
function orderQuestion(ctx) {
  const area = ctx.area;
  const n = ctx.index === 1 ? rand(3, 4) : rand(4, 5);
  const thing = pick(ORDER_THINGS.filter((t) => t !== ctx.round.last));
  ctx.round.last = thing;
  const color = THINGS.includes(thing) ? C[pick(BASIC)] : undefined;
  const sizes = Array.from({ length: n }, (_, i) => Math.round(78 + (i * 112) / (n - 1)));
  const shelfY = 700;
  const x0 = 300;
  const span = 840;
  const cx = (i) => x0 + (i + 0.5) * (span / n);
  area.append(h('div', { class: 'wood-board', style: { left: x0 - 20 + 'px', top: shelfY + 'px', width: span + 40 + 'px', height: '30px', borderRadius: '15px' } }));
  const sign = h('div', { class: 'order-slot', html: orderSign(), style: { left: x0 + 'px', top: shelfY + 40 + 'px', width: span + 'px', height: '44px' } });
  area.append(sign);
  const slots = sizes.map((_, i) => {
    const el = h('div', { class: 'order-slot', html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="12" fill="rgba(255,251,242,.45)" stroke="#A08062" stroke-width="3" stroke-dasharray="9 7" vector-effect="non-scaling-stroke"/></svg>', style: { width: Math.min(172, span / n - 10) + 'px', height: '206px' } });
    area.append(el);
    placeAt(el, cx(i), shelfY - 108);
    return { el, rank: i, filled: false, reach: 130 };
  });
  const spots = shuffle(sizes.map((_, i) => i));
  const items = sizes.map((s, rank) => {
    const el = h('div', { class: 'item pop-in', html: picSVG(thing, color), style: { width: s + 'px', height: s + 'px', animationDelay: rank * 60 + 'ms' } });
    area.append(el);
    placeAt(el, cx(spots[rank]), 390 - s / 2);
    return { el, rank };
  });

  return new Promise((resolve) => {
    let left = n;
    for (const it of items) {
      draggable(it.el, {
        onDrop: (p) => {
          const hit = nearest(p, slots.filter((s) => !s.filled), 130);
          if (!hit) return false;
          if (hit.rank !== it.rank) {
            ctx.no(hit.el);
            return false;
          }
          hit.filled = true;
          it.el.dataset.locked = '1';
          it.el.classList.add('placed');
          moveTo(it.el, cx(hit.rank), shelfY - sizes[it.rank] / 2 - 2, 220);
          sfx.click();
          left--;
          if (left === 0) {
            setTimeout(async () => {
              for (const s of slots) s.el.style.opacity = 0;
              for (const q of items) anim(q.el, 'pop', 600);
              await ctx.yes('Smallest to biggest');
              resolve();
            }, 300);
          }
          return true;
        },
      });
    }
    ctx.prompt('Put them in a row, from smallest to biggest!');
  });
}

// Level 5: four things, two rules at once: big or small, and which colour.
function twoRuleQuestion(ctx) {
  const area = ctx.area;
  const [c1, c2] = sample(BASIC, 2);
  const thing = pick(THINGS.filter((t) => t !== ctx.round.last));
  ctx.round.last = thing;
  const DIM = { big: { w: 204, hh: 174, item: 168 }, small: { w: 136, hh: 116, item: 92 } };
  const combos = [[c1, 'big'], [c1, 'small'], [c2, 'big'], [c2, 'small']];
  const baskets = shuffle(combos).map(([color, size], i) => {
    const d = DIM[size];
    const el = h('div', { class: 'basket pop-in', html: basketSVG(C[color]), style: { width: d.w + 'px', height: d.hh + 'px', animationDelay: i * 60 + 'ms' } });
    area.append(el);
    placeAt(el, 330 + (i + 0.5) * 205, 742 - d.hh / 2);
    return { el, color, size, reach: 150, w: d.w };
  });
  const items = shuffle(combos).map(([color, size], i) => {
    const s = DIM[size].item;
    const el = h('div', { class: 'item pop-in', html: picSVG(thing, C[color]), style: { width: s + 'px', height: s + 'px', animationDelay: i * 70 + 'ms' } });
    area.append(el);
    placeAt(el, 400 + i * 210, 390 - s / 2);
    return { el, color, size };
  });

  return new Promise((resolve) => {
    let left = items.length;
    for (const it of items) {
      draggable(it.el, {
        onDrop: (p) => {
          const hit = nearest(p, baskets, 150);
          if (!hit) return false;
          if (hit.color !== it.color || hit.size !== it.size) {
            ctx.no(hit.el);
            return false;
          }
          dropInto(it.el, hit, hit.w);
          left--;
          if (left === 0) setTimeout(() => ctx.yes('All sorted').then(resolve), 450);
          else ctx.say(`${cap(it.size)} ${it.color}!`);
          return true;
        },
      });
    }
    ctx.prompt(`Big and small, ${c1} and ${c2}! Put each one in its basket.`);
  });
}

export default {
  id: 'colors',
  title: 'Sort it',
  titleId: 'Sortir Warna',
  card: '#E3ECFF',
  art: 'colors',

  startRound(ctx) {
    ctx.setPlace('baskets');
    // The group baskets keep the same sign picture for the whole round.
    ctx.round = { last: null, signs: Object.fromEntries(GROUPS.map((g) => [g.id, pick(g.signs)])) };
  },

  async question(ctx) {
    const L = ctx.level;
    const area = ctx.area;
    area.innerHTML = '';
    await sleep(80);

    if (L === 4 && ctx.index % 2 === 1) return orderQuestion(ctx);
    if (L >= 5) return twoRuleQuestion(ctx);

    if (L === 4) {
      const signs = ctx.round.signs;
      const g = pick(GROUPS.filter((x) => x.id !== ctx.round.group));
      ctx.round.group = g.id;
      const word = pick(g.words.filter((w) => w !== signs[g.id] && w !== ctx.round.last));
      ctx.round.last = word;
      const baskets = shuffle(GROUPS.map((x) => ({ group: x.id, sign: signs[x.id] })));
      const target = baskets.find((b) => b.group === g.id);
      return singleSort(ctx, baskets, { html: picSVG(word), size: 180, target }, `Where does the ${word} go?`, cap(g.name));
    }

    const thing = pick(THINGS.filter((t) => t !== ctx.round.last));
    ctx.round.last = thing;
    if (L === 1) {
      const baskets = shuffle(sample(BASIC, 4)).map((c) => ({ color: c }));
      const target = pick(baskets);
      return singleSort(ctx, baskets, { html: picSVG(thing, C[target.color]), size: 180, target }, `Put the ${target.color} ${thing} in the ${target.color} basket!`, target.color);
    }
    if (L === 2) {
      const [c1, c2] = sample(['red', 'blue', 'yellow', 'green'], 2);
      const [s1, s2] = sample(TOKENS, 2);
      const baskets = shuffle([[c1, s1], [c2, s2], [c1, s2], [c2, s1]].map(([c, s]) => ({ color: c, shape: s })));
      const target = pick(baskets);
      const html = `<div style="width:100%;height:100%;padding:12%;box-sizing:border-box">${shapeSVG(target.shape, C[target.color])}</div>`;
      return singleSort(ctx, baskets, { html, size: 170, target }, `Where does the ${target.color} ${target.shape} go?`, `${target.color} ${target.shape}`);
    }
    const baskets = sample(Object.keys(C), 4).map((c) => ({ color: c }));
    const target = pick(baskets);
    return singleSort(ctx, baskets, { html: picSVG(thing, '#FFFFFF'), size: 180, target }, `Put the ${thing} in the ${target.color} basket!`, target.color);
  },
};

// Monster says — touch the body part only when the monster says "Moko says ..." (DESAIN.md 8.4).
// Levels: 1 one easy part, always "says", 2 one part (all parts), 3 one part and one trick
// (no "says": don't touch!), 4 two parts in a row and two tricks, 5 two or three parts and two tricks.
import { h, pick, sample, shuffle, anim, placeAt, cap, toStage } from '../util.js';
import { bodyPartAt, CHARS } from '../art.js';
import { sfx } from '../sound.js';

const EASY = ['nose', 'eyes', 'ears', 'tummy', 'feet', 'hands'];
const ALL = [...EASY, 'mouth', 'knees', 'hair'];
const WAIT = 3500; // ms to keep still after a trick

function parts(pool, n, last) {
  for (;;) {
    const s = sample(pool, n);
    if (s[0] !== last) return s;
  }
}

function sparkle(area, e) {
  const p = toStage(e.clientX, e.clientY);
  const sp = h('div', { class: 'sparkle', style: { width: '70px', height: '70px' } });
  area.append(sp);
  placeAt(sp, p.x, p.y);
  setTimeout(() => sp.remove(), 650);
}

export default {
  id: 'simon',
  title: 'Monster says',
  titleId: 'Simon Says',
  card: '#DDF1E4',
  art: 'simon',

  startRound(ctx) {
    const L = ctx.level;
    const tricks = L >= 4 ? 2 : L === 3 ? 1 : 0;
    // Never a trick first: the child hears "says" before the first "don't".
    ctx.round = { last: null, tricks: new Set(shuffle([1, 2, 3, 4]).slice(0, tricks)), told: false };
    ctx.setPlace('forest');
    const big = ctx.makeChar(ctx.who, 340, 'big-char');
    ctx.area.append(big);
    placeAt(big, 640, 430);
    ctx.round.big = big;
    ctx.useChar(big);
  },

  question(ctx) {
    const L = ctx.level;
    const big = ctx.round.big;
    const name = CHARS[ctx.who].name;
    const trick = ctx.round.tricks.has(ctx.index);
    const n = L >= 5 ? pick([2, 3]) : L === 4 ? 2 : 1;
    const steps = parts(L <= 1 ? EASY : ALL, n, ctx.round.last);
    ctx.round.last = steps[0];
    const cmd = `touch my ${steps.join(', then my ')}!`;
    let text = trick ? cap(cmd) : `${name} says: ${cmd}`;
    if (L >= 3 && !ctx.round.told) {
      ctx.round.told = true;
      text = `Listen carefully! Only touch when I say "${name} says". ${text}`;
    }
    return new Promise((resolve) => {
      let i = 0;
      let done = false;
      let timer = null;
      const end = () => {
        done = true;
        clearTimeout(timer);
        big.onpointerdown = null;
        ctx.clearPrompt();
      };
      big.onpointerdown = async (e) => {
        if (done) return;
        const r = big.getBoundingClientRect();
        const region = bodyPartAt(ctx.who, ((e.clientX - r.left) / r.width) * 200, ((e.clientY - r.top) / r.height) * 240);
        if (!region) return;
        sparkle(ctx.area, e);
        if (trick) {
          end();
          await ctx.no(big, `Oops! I didn't say "${name} says"!`);
          resolve();
          return;
        }
        if (region.parts.includes(steps[i])) {
          sfx.giggle();
          anim(big, 'giggle', 500);
          i++;
          if (i >= steps.length) {
            end();
            await ctx.yes(steps.length > 1 ? 'You did it all' : cap(steps[0]));
            resolve();
          } else {
            ctx.say(cap(steps[i - 1]) + '!');
          }
        } else {
          ctx.no(null, `That's not my ${steps[i]}. Try again!`);
          i = 0;
        }
      };
      const said = ctx.prompt(text);
      if (trick) {
        // Keeping still wins: start counting once the sentence is finished.
        said.then(() => {
          if (done || !ctx.alive()) return;
          timer = setTimeout(async () => {
            if (done || !ctx.alive()) return;
            end();
            await ctx.yes(`You kept still! I didn't say "${name} says"`, { x: 640, y: 300 });
            resolve();
          }, WAIT);
        });
      }
    });
  },
};

// Monster feelings — name a feeling from a face, and guess how a monster feels (DESAIN.md 8.4).
// Levels: 1 pick the face from 2, 2 pick from 3, 3 find a monster who feels the same (other
// colours), 4 a little story: how does the monster feel? (3 faces), 5 a story with 4 faces,
// some of them look alike (surprised / scared, sad / tired).
import { h, pick, shuffle, sample, placeAt, cap } from '../util.js';
import { faceSVG, FEELINGS, picSVG, CHARS } from '../art.js';
import { sfx } from '../sound.js';

const WHO = ['moko', 'gumi', 'tobi'];
const LIKE = { happy: 'surprised', surprised: 'scared', scared: 'surprised', sad: 'tired', tired: 'sad', angry: 'sad' };
// {n} is a monster's name; pic is a little picture shown with the story.
const STORIES = {
  happy: [
    ['It is {n}\'s birthday, and {n} gets a big present!', 'balloon'],
    ['{n} is eating a yummy cake!', 'cake'],
    ['{n} is playing ball with a friend!', 'ball'],
  ],
  sad: [
    ['Oh no! {n}\'s ice cream fell on the floor.', null],
    ['{n}\'s balloon flew away, up in the sky.', 'balloon'],
    ['{n}\'s teddy bear is lost.', 'teddy bear'],
  ],
  angry: [
    ['Someone took {n}\'s toy car and didn\'t say sorry!', 'car'],
    ['Someone knocked down {n}\'s tower on purpose!', null],
  ],
  scared: [
    ['A big dog barks very loudly at {n}!', 'dog'],
    ['It is dark, and {n} hears a strange noise.', null],
  ],
  surprised: [
    ['{n} opens a box, and a toy jumps out! Boing!', null],
    ['All the friends jump out and shout: Surprise!', 'balloon'],
  ],
  tired: [
    ['{n} played all day long. Now it is bedtime.', 'bed'],
    ['{n} walked up a very big hill.', null],
  ],
};

function faces(ctx, list, y, s) {
  const gap = list.length >= 4 ? 34 : 50;
  const x0 = 660 - ((list.length - 1) * (s + gap)) / 2;
  return list.map((f, i) => {
    const card = h('button', { class: 'card pic-card fl-face pop-in', 'aria-label': `${f.who} ${i + 1}`, style: { width: s + 'px', height: s + 'px', animationDelay: i * 80 + 'ms' } },
      h('div', { class: 'pic', html: faceSVG(f.feel, f.who), style: { width: '86%', height: '86%' } }));
    ctx.area.append(card);
    placeAt(card, x0 + i * (s + gap), y);
    return { ...f, el: card };
  });
}

export default {
  id: 'feelings',
  title: 'Feelings',
  titleId: 'Perasaan Monster',
  card: '#FDE2EA',
  art: 'feelings',

  startRound(ctx) {
    ctx.round = { last: null };
    ctx.setPlace('forest');
  },

  question(ctx) {
    const L = ctx.level;
    ctx.area.innerHTML = '';
    const feel = pick(FEELINGS.filter((f) => f !== ctx.round.last));
    ctx.round.last = feel;
    const n = L >= 5 ? 4 : L >= 2 ? 3 : 2;
    let others;
    if (L >= 5) others = [LIKE[feel], ...sample(FEELINGS.filter((f) => f !== feel && f !== LIKE[feel]), 2)];
    else others = sample(FEELINGS.filter((f) => f !== feel), n - 1);
    let text;
    let praise;
    let shownWho = pick(WHO);
    if (L <= 2) {
      text = `Which monster is ${feel}?`;
      praise = cap(feel);
    } else if (L === 3) {
      // A big face to copy, and monsters of the other colours to choose from.
      const big = h('div', { class: 'card pic-card fl-big pop-in' }, h('div', { class: 'pic', html: faceSVG(feel, shownWho), style: { width: '88%', height: '88%' } }));
      ctx.area.append(big);
      placeAt(big, 660, 230);
      text = 'Look at this monster. Who feels the same?';
      praise = `They both feel ${feel}`;
    } else {
      const [story, picName] = pick(STORIES[feel]);
      const name = CHARS[shownWho].name;
      const ch = ctx.makeChar(shownWho, 170, 'fl-char pop-in');
      ctx.area.append(ch);
      placeAt(ch, picName ? 580 : 660, 225);
      if (picName) {
        const p = h('div', { class: 'fl-thing pop-in', html: picSVG(picName) });
        ctx.area.append(p);
        placeAt(p, 760, 250);
      }
      text = `${story.replaceAll('{n}', name)} How does ${name} feel?`;
      praise = `${name} feels ${feel}`;
    }
    const pickWho = () => (L === 3 ? pick(WHO.filter((w) => w !== shownWho)) : pick(WHO));
    const list = shuffle([{ feel, who: pickWho(), ok: true }, ...others.map((f) => ({ feel: f, who: pickWho() }))]);
    const cards = faces(ctx, list, L >= 3 ? 560 : 430, L >= 5 ? 180 : L >= 3 ? 190 : 230);
    return new Promise((resolve) => {
      let done = false;
      cards.forEach((c) => {
        c.el.addEventListener('click', async () => {
          if (done) return;
          sfx.pop();
          if (c.ok) {
            done = true;
            c.el.classList.add('right');
            await ctx.yes(praise);
            resolve();
          } else {
            ctx.no(c.el, `That monster is ${c.feel}. Try again!`);
          }
        });
      });
      ctx.prompt(text);
    });
  },
};

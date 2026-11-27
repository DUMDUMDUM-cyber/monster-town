// Monster Land — screens and the flow between them.
import { h, sleep, pick, shuffle, anim, placeAt, seeded, todayKey, toStage, STAGE_W, STAGE_H } from './util.js';
import * as S from './store.js';
import { say, sfx, unlockAudio, setMusic, onSpeech, stopSpeech, isSpeaking, voiceName } from './sound.js';
import { CHARS, charSVG, icon, starSVG, placeSVG, placeColor, clockMood, randomMood, CARD_ART } from './art.js';
import { act, stopAct, offLeft, idleAct, cheerAct, tapAct, idleLoop, isIdleAct, actMs, actName, SIGN } from './acts.js';
import words from './games/words.js';
import count from './games/count.js';
import shapes from './games/shapes.js';
import colors from './games/colors.js';
import train from './games/train.js';
import treasure from './games/treasure.js';
import race from './games/race.js';
import memory from './games/memory.js';
import pattern from './games/pattern.js';
import odd from './games/odd.js';
import puzzle from './games/puzzle.js';
import clock from './games/clock.js';
import mix from './games/mix.js';
import letters from './games/letters.js';
import shadow from './games/shadow.js';
import maze from './games/maze.js';
import shop from './games/shop.js';
import scale from './games/scale.js';
import opposites from './games/opposites.js';
import story from './games/story.js';
import feelings from './games/feelings.js';
import simon from './games/simon.js';
import { ACC, SLOTS, dress, accSVG } from './acc.js';

const GAMES = [words, count, shapes, colors, train, treasure, race, memory, pattern, odd, puzzle, clock, mix, letters, shadow, maze, shop, scale, opposites, story, feelings, simon];
const stage = document.getElementById('stage');

// ---------------------------------------------------------------- layout
// The stage fits inside the safe area (no notch, home bar or browser bar over it).
function fit() {
  const vp = document.getElementById('viewport');
  const cs = getComputedStyle(vp);
  const px = (k) => parseFloat(cs[k]) || 0;
  const vv = window.visualViewport;
  const W = Math.min(vp.clientWidth, vv ? vv.width : Infinity) - px('paddingLeft') - px('paddingRight');
  const H = Math.min(vp.clientHeight, vv ? vv.height : Infinity) - px('paddingTop') - px('paddingBottom');
  const s = Math.min(W / STAGE_W, H / STAGE_H);
  stage.style.transform = `scale(${s})`;
  // The backdrop lies exactly under the stage, at the same scale, and runs on to every edge.
  const r = stage.getBoundingClientRect();
  backdrop.style.left = r.left + 'px';
  backdrop.style.top = r.top + 'px';
  backdrop.style.transform = `scale(${s})`;
}

// ---------------------------------------------------------------- backdrop
// The still scenery of the current place, drawn again behind the stage and widened, so wide
// or tall screens show scenery to every edge instead of plain bands. Only the stage area is
// played on; the backdrop is just picture.
const backdrop = document.createElement('div');
backdrop.id = 'backdrop';
backdrop.setAttribute('aria-hidden', 'true');
document.body.prepend(backdrop);
const widen = (markup) => markup
  // big fills (sky, walls, floors) run far to the sides
  .replace(/<rect (x="-10" )?(y="[\d.-]+" )?width="12[02]0"/g, (m, x, y) => `<rect x="-1400" ${y || ''}width="4000"`)
  // hills and ground: carry the first and last heights on to the sides
  .replace(/d="M-20 ([\d.-]+)( C[^"]*?)1220\.0 ([\d.-]+) L1220 820 L-20 820 Z"/g, 'd="M-1400 $1 H-20$2 1220.0 $3 H2600 V1400 H-1400 Z"');
function setBackdrop(place, mood) {
  backdrop.innerHTML = place ? widen(placeSVG(place, mood)) : '';
}
fit();
window.addEventListener('resize', fit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
// iOS reports the new size a little late after turning, so fit again a bit later too.
window.addEventListener('orientationchange', () => { setTimeout(fit, 200); setTimeout(fit, 700); });

// Entrance animations keep their last frame; drop them so later movement works.
document.addEventListener('animationend', (e) => {
  if (e.animationName === 'popIn' || e.animationName === 'slideIn') e.target.classList.remove('pop-in', 'slide-in');
  if (e.animationName === 'scrIn') e.target.classList.remove('scr-in');
});

const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// ---------------------------------------------------------------- screens
let current = { name: '', cleanup: null };
let speaker = null;

// The new screen fades and slides in over the old one, which is removed afterwards.
function setScreen(name, el, place) {
  if (current.cleanup) current.cleanup();
  stopSpeech();
  speaker = null;
  const quick = reduced();
  for (const old of [...stage.children]) {
    if (quick || !old.classList.contains('screen')) { old.remove(); continue; }
    old.classList.remove('scr-in');
    old.classList.add('scr-out');
    setTimeout(() => old.remove(), 600);
  }
  if (!quick) el.classList.add('scr-in');
  stage.append(el);
  current = { name, cleanup: null };
  // Menus follow the real time of day (a night sky in the evening); light text on a dark sky.
  const mood = clockMood();
  el.classList.toggle('mood-night', mood.time === 'night');
  document.body.style.background = placeColor(place || 'sky', mood);
  setBackdrop(name === 'parent' ? null : place || 'sky', mood);
}

// ---------------------------------------------------------------- celebration effects
const FX = ['#FFD166', '#FF8FA3', '#7CC8F0', '#8FD67A', '#FFAA5C', '#B795F0'];
const setVars = (el, vars) => { for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v); return el; };
const later = (el, ms) => setTimeout(() => el.remove(), ms);

// Little stars flying out from (x, y).
function starBurst(parent, x, y, n = 10, spread = 170) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    const d = spread * (0.55 + Math.random() * 0.6);
    const s = h('div', { class: 'fx fx-star', html: starSVG(FX[i % FX.length]), style: { left: x - 19 + 'px', top: y - 19 + 'px', animationDelay: Math.round(Math.random() * 90) + 'ms' } });
    setVars(s, { '--dx': `${(Math.cos(a) * d).toFixed(0)}px`, '--dy': `${(Math.sin(a) * d - 30).toFixed(0)}px`, '--r': `${Math.round(Math.random() * 300 - 150)}deg` });
    parent.append(s);
    later(s, 1400);
  }
}

// A firework: a rocket rises to (x, y), then bursts into sparks.
function firework(parent, x, y) {
  if (reduced()) return;
  const col = pick(FX);
  const rocket = h('div', { class: 'fx fx-rocket', style: { left: x - 4 + 'px', top: y - 13 + 'px', background: col } });
  setVars(rocket, { '--rise': 820 - y + 'px' });
  parent.append(rocket);
  later(rocket, 720);
  setTimeout(() => {
    if (!parent.isConnected) return;
    const ring = h('div', { class: 'fx fx-ring', style: { left: x - 60 + 'px', top: y - 60 + 'px', width: '120px', height: '120px', borderColor: col } });
    parent.append(ring);
    later(ring, 750);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const d = 105 + Math.random() * 45;
      const sp = h('div', { class: 'fx fx-spark', style: { left: x - 6 + 'px', top: y - 6 + 'px', background: i % 2 ? col : '#FFF3C4' } });
      setVars(sp, { '--dx': `${(Math.cos(a) * d).toFixed(0)}px`, '--dy': `${(Math.sin(a) * d).toFixed(0)}px` });
      parent.append(sp);
      later(sp, 1350);
    }
  }, 680);
}

onSpeech((state) => {
  if (!speaker) return;
  speaker.classList.toggle('talk', state === 'start');
});

const childName = () => (S.get('name') || '').trim();
const roundBtn = (name, label, onClick, cls = '') => h('button', { class: `round-btn ${cls}`, 'aria-label': label, html: icon(name, 40), onClick });

// A character, wearing what the child picked in the wardrobe.
function makeChar(who, size, extra = '', opts = {}) {
  return h('div', { class: `char ${extra}`, 'data-who': who, html: charSVG(who, { ...opts, dress: dress(who, S.wornIds(who)) }), style: { width: size + 'px', height: size * 1.2 + 'px' } });
}

function speakAs(el, text, who) {
  speaker = el;
  return say(text, who);
}

// ---------------------------------------------------------------- daily time
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  if (!['menu', 'choose', 'game'].includes(current.name)) return;
  S.addSecond();
  if (S.timeIsUp() && (current.name === 'menu' || current.name === 'choose')) rest();
}, 1000);

// ---------------------------------------------------------------- splash
function splash() {
  const root = h('div', { class: 'screen' }, h('div', { class: 'bg', html: placeSVG('sky') }));
  const title = h('h1', { class: 'logo' }, 'Monster Land');
  const row = h('div', { class: 'splash-row' }, makeChar('gumi', 210, 'bob'), makeChar('moko', 250, 'bob d1'), makeChar('tobi', 210, 'bob d2'));
  const play = h('button', { class: 'play-btn pulse', 'aria-label': 'Play', html: icon('play', 90) });
  root.append(title, row, play);
  setScreen('splash', root, 'sky');
  current.cleanup = idleLoop([...row.children], () => !isSpeaking(), 4000, 8000);
  play.addEventListener('click', () => {
    unlockAudio();
    setMusic(S.get('music') !== false);
    sfx.yay();
    menu(true);
  });
}

// ---------------------------------------------------------------- menu
function picks() {
  const day = todayKey();
  // Games still open today first, then the ones played least.
  return GAMES.slice()
    .sort((a, b) => S.isLocked(a.id) - S.isLocked(b.id) || S.plays(a.id) - S.plays(b.id) || seeded(day + a.id) - seeded(day + b.id))
    .slice(0, 3);
}

function gameCard(game, big) {
  const locked = S.isLocked(game.id);
  const card = h('button', { class: `card game-card ${big ? 'big' : ''} ${locked ? 'locked' : ''}`, style: { background: game.card }, 'aria-label': locked ? `${game.title}, played today` : game.title },
    h('div', { class: 'card-art', html: CARD_ART[game.art]() }),
    h('span', { class: 'card-title' }, game.title),
    locked ? h('span', { class: 'card-lock', html: icon('lock', big ? 40 : 28, 3) }) : null);
  card.addEventListener('click', () => {
    if (S.isLocked(game.id)) {
      // Played today: a friendly no, and a hint to try something else.
      sfx.boop();
      anim(card, 'wiggle', 500);
      const moko = document.querySelector('.menu-moko');
      if (moko) act(moko, 'look');
      speakAs(moko, `We played ${game.title} today! Let's play it again tomorrow. Pick another game!`, 'moko');
      return;
    }
    sfx.pop();
    anim(card, 'press', 300);
    choose(game);
  });
  return card;
}

// After midnight the locks open by themselves: redraw the menu if it is showing.
let shownDay = todayKey();
setInterval(() => {
  if (todayKey() === shownDay) return;
  shownDay = todayKey();
  if (current.name === 'menu') menu();
}, 30000);

function menu(greet = false) {
  if (S.timeIsUp()) return rest();
  if (GAMES.every((g) => S.isLocked(g.id))) return bedtime();
  const root = h('div', { class: 'screen' }, h('div', { class: 'bg', html: placeSVG('sky') }));
  const name = childName();
  const hello = `Hi ${name || 'friend'}! Let's play!`;
  const moko = makeChar('moko', 120, 'menu-moko');
  const bubble = h('div', { class: 'bubble' }, h('span', { html: icon('speaker', 30) }), h('span', null, hello));
  const top = h('div', { class: 'menu-top' }, moko, bubble);
  const lock = roundBtn('lock', 'Parents', () => gate(() => parent()), 'lock-btn');
  const pickRow = h('div', { class: 'pick-row' }, ...picks().map((g) => gameCard(g, true)));
  const allRow = h('div', { class: 'all-row' }, ...GAMES.map((g) => gameCard(g, false)));
  // More games than fit: big arrows page through the row (it can also be swiped).
  const prev = h('button', { class: 'row-arrow prev', 'aria-label': 'More games', html: icon('back', 44, 3.6) });
  const next = h('button', { class: 'row-arrow next', 'aria-label': 'More games', html: icon('next', 44, 3.6) });
  const page = (dir) => { sfx.pop(); allRow.scrollBy({ left: dir * (allRow.clientWidth - 60), behavior: reduced() ? 'auto' : 'smooth' }); };
  prev.addEventListener('click', () => page(-1));
  next.addEventListener('click', () => page(1));
  const arrows = () => {
    const max = allRow.scrollWidth - allRow.clientWidth;
    prev.classList.toggle('off', allRow.scrollLeft <= 4);
    next.classList.toggle('off', allRow.scrollLeft >= max - 4);
  };
  allRow.addEventListener('scroll', arrows, { passive: true });
  root.append(top, lock,
    h('p', { class: 'row-label', style: { top: '186px' } }, "Moko's picks"), pickRow,
    h('p', { class: 'row-label', style: { top: '530px' } }, `All games (${GAMES.length})`), allRow, prev, next);
  requestAnimationFrame(arrows);
  setScreen('menu', root, 'sky');
  current.cleanup = idleLoop([moko], () => !isSpeaking());
  const talk = () => { act(moko, tapAct()); speakAs(moko, hello, 'moko'); };
  moko.addEventListener('click', talk);
  bubble.addEventListener('click', talk);
  if (greet) {
    act(moko, 'runin', { dx: offLeft(moko) });
    setTimeout(() => speakAs(moko, hello, 'moko'), 300);
  }
  else if (GAMES.every((g) => S.isLocked(g.id))) setTimeout(() => speakAs(moko, 'Wow, we played every game today! Great job! See you tomorrow!', 'moko'), 300);
  else setTimeout(() => speakAs(moko, 'Pick a game!', 'moko'), 300);
}

// ---------------------------------------------------------------- choose a monster
function choose(game) {
  if (S.timeIsUp()) return rest();
  if (S.isLocked(game.id)) return menu();
  const root = h('div', { class: 'screen' }, h('div', { class: 'bg', html: placeSVG('choose') }));
  const title = h('h1', { class: 'choose-title' }, 'Who wants to play?');
  const home = roundBtn('home', 'Home', () => { sfx.pop(); menu(); }, 'home-btn');
  let picked = false;
  let busy = false;
  const monsters = [];
  const cells = ['moko', 'gumi', 'tobi'].map((who, i) => {
    let c = makeChar(who, 250, 'bob d' + i);
    monsters.push(c);
    const btn = h('button', { class: 'choose-btn', 'aria-label': `Play as ${CHARS[who].name}` }, c,
      h('span', { class: 'name-pill', style: { background: `linear-gradient(${CHARS[who].tint}, ${CHARS[who].color} 85%)`, borderColor: CHARS[who].dark } }, CHARS[who].name));
    btn.addEventListener('click', async () => {
      if (picked || busy) return;
      picked = true;
      sfx.yay();
      c.classList.remove('bob');
      act(c, Math.random() < 0.5 ? 'flip' : 'hjump');
      await speakAs(c, `${CHARS[who].name}! Let's go!`, who);
      if (current.name === 'choose') runGame(game, who);
    });
    // The little wardrobe: put on what was found in the treasure chests.
    const closet = roundBtn('hanger', `${CHARS[who].name}'s clothes`, () => {
      if (picked || busy) return;
      busy = true;
      sfx.pop();
      wardrobe(who, () => {
        busy = false;
        const fresh = makeChar(who, 250, 'bob d' + i);
        c.replaceWith(fresh);
        monsters[i] = fresh;
        c = fresh;
        act(fresh, 'hjump');
      });
    }, 'closet-btn');
    return h('div', { class: 'choose-cell' }, btn, closet);
  });
  root.append(title, home, h('div', { class: 'choose-row' }, ...cells));
  setScreen('choose', root, 'choose');
  const chars = cells.map((cell) => cell.firstChild);
  monsters.forEach((c) => act(c, 'runin', { dx: offLeft(c) }));
  current.cleanup = idleLoop(monsters, () => !picked && !busy && !isSpeaking(), 4000, 8000);
  setTimeout(() => speakAs(chars[0].firstChild, 'Who wants to play?', 'moko'), 300);
}

// ---------------------------------------------------------------- wardrobe
// Tap an item to put it on or take it off (one per slot: head, eyes, neck, other).
// Items not found yet are grey shapes, so the child knows there is more to find.
function wardrobe(who, onDone) {
  const overlay = h('div', { class: 'overlay' });
  const panel = h('div', { class: 'panel wardrobe' });
  const stageBox = h('div', { class: 'wr-model' });
  let model = null;
  const drawModel = () => {
    const next = makeChar(who, 280, 'wr-char');
    if (model) model.replaceWith(next);
    else stageBox.append(next);
    model = next;
  };
  drawModel();
  const have = S.found();
  const grid = h('div', { class: 'wr-grid' });
  const tiles = {};
  const mark = () => {
    const w = S.wearing(who);
    for (const a of ACC) tiles[a.id].classList.toggle('on', w[a.slot] === a.id);
  };
  for (const slot of SLOTS) {
    const row = h('div', { class: 'wr-row' });
    for (const a of ACC.filter((x) => x.slot === slot)) {
      const got = have.includes(a.id);
      const tile = h('button', { class: `wr-tile ${got ? '' : 'locked'}`, 'aria-label': got ? a.name : 'not found yet', html: accSVG(a.id) });
      tiles[a.id] = tile;
      tile.addEventListener('click', () => {
        if (!got) { sfx.boop(); anim(tile, 'wiggle', 500); return; }
        const on = S.wearing(who)[slot] === a.id;
        S.setWear(who, slot, on ? null : a.id);
        sfx.pop();
        anim(tile, 'pop', 400);
        mark();
        drawModel();
        if (!on) { act(model, pick(['hjump', 'laugh', SIGN[who]])); speakAs(model, `A ${a.name}!`, who); }
      });
      row.append(tile);
    }
    grid.append(row);
  }
  mark();
  const done = h('button', { class: 'wr-done', 'aria-label': 'Done' }, h('span', { html: icon('check', 40, 3.4) }), 'Done');
  // Two ways out: the big Done button and a cross in the corner (always on screen).
  const close = h('button', { class: 'panel-close wr-close', 'aria-label': 'Close', html: icon('close', 30, 3.4) });
  let closed = false;
  const leave = () => {
    if (closed) return;
    closed = true;
    sfx.yay();
    stopSpeech();
    overlay.remove();
    onDone();
  };
  done.addEventListener('click', leave);
  close.addEventListener('click', leave);
  panel.append(stageBox, grid, done, close);
  overlay.append(panel);
  stage.append(overlay);
  stopSpeech();
  setTimeout(() => speakAs(model, have.length ? 'What shall I wear?' : 'Find clothes in the treasure chests!', who), 250);
}

// ---------------------------------------------------------------- one round of a game
async function runGame(game, who) {
  const token = { alive: true };
  const level = S.level(game.id);
  const bg = h('div', { class: 'bg' });
  const area = h('div', { class: 'area' });
  const root = h('div', { class: 'screen' }, bg, area);
  const stars = Array.from({ length: 5 }, () => h('div', { class: 'pstar', html: starSVG('#FFFFFF') }));
  const progress = h('div', { class: 'progress', role: 'img', 'aria-label': 'progress' }, ...stars);
  const corner = makeChar(who, 150, 'corner-char');
  const home = roundBtn('home', 'Home', () => { sfx.pop(); menu(); }, 'home-btn');
  root.append(progress, corner, home);
  setScreen('game', root, 'sky');

  let prompt = null;
  let lastTouch = Date.now();
  let missed = false;
  let talker = corner;
  let lastPt = { x: 600, y: 400 };
  // Living character while waiting: a little activity every 6-12 s (in its own corner, so it
  // never covers the question), stopped as soon as anything is said. After 30 s with no touch
  // at all it yawns and dozes off (and stops repeating the question) until the child touches.
  let lastReal = Date.now();
  let dozing = false;
  let woke = 0;
  let nextAct = Date.now() + 6000 + Math.random() * 6000;
  const wake = () => {
    if (!dozing) return;
    dozing = false;
    woke = Date.now();
    act(corner, 'surprised');
  };
  root.addEventListener('pointerdown', () => { lastTouch = lastReal = Date.now(); wake(); }, true);
  root.addEventListener('pointerup', (e) => {
    const p = toStage(e.clientX, e.clientY);
    lastPt = { x: Math.max(40, Math.min(STAGE_W - 40, p.x)), y: Math.max(60, Math.min(STAGE_H - 40, p.y)) };
  }, true);
  const cornerFree = () => corner.style.display !== 'none' && !actName(corner);
  const idle = setInterval(() => {
    if (!token.alive || !prompt || dozing || isSpeaking()) return;
    const now = Date.now();
    if (now - lastReal > 30000 && corner.style.display !== 'none') {
      dozing = true;
      stopAct(corner);
      act(corner, 'yawn').then(() => { if (dozing && token.alive) act(corner, 'doze'); });
      return;
    }
    if (now - lastTouch > 8000) {
      lastTouch = now;
      ctx.say(prompt);
    } else if (now >= nextAct && cornerFree()) {
      // Only something that ends before the question is asked again.
      const room = 8000 - (now - lastTouch) - 300;
      let n = idleAct(who);
      for (let i = 0; i < 6 && actMs(n) > room; i++) n = idleAct(who);
      if (actMs(n) > room) return;
      act(corner, n, { idle: true });
      nextAct = now + actMs(n) + 6000 + Math.random() * 6000;
    }
  }, 500);
  current.cleanup = () => {
    token.alive = false;
    clearInterval(idle);
  };

  const ctx = {
    who,
    level,
    index: 0,
    area,
    root,
    round: {},
    name: childName(),
    alive: () => token.alive,
    setPlace(p) {
      // A new time of day (and sometimes weather) every round, so places never look the same.
      const mood = randomMood();
      bg.innerHTML = placeSVG(p, mood);
      document.body.style.background = placeColor(p, mood);
      setBackdrop(p, mood);
    },
    useChar(el) {
      talker = el;
      corner.style.display = 'none';
    },
    say(text) {
      if (!token.alive) return Promise.resolve();
      if (dozing) { dozing = false; lastReal = Date.now(); stopAct(corner); }
      if (isIdleAct(corner)) stopAct(corner);
      speaker = talker;
      return say(text, who);
    },
    prompt(text) {
      prompt = text;
      lastTouch = Date.now();
      nextAct = Math.max(nextAct, Date.now() + 6000);
      return ctx.say(text);
    },
    clearPrompt() {
      prompt = null;
    },
    // Set what is repeated later, without saying it now.
    setPrompt(text) {
      prompt = text;
      lastTouch = Date.now();
    },
    // Characters for games, wearing their accessories.
    makeChar: (w, size, extra) => makeChar(w, size, extra),
    burst: (x, y, n, spread) => starBurst(root, x, y, n, spread),
    reduced,
    result: null, // a game may set { medal: 'gold' | 'silver' | 'bronze', text } for the party
    cheer: true,
    miss() { missed = true; }, // counts the question as not right first time, without a sound
    no(el, text = 'Try again!') {
      missed = true;
      sfx.boop();
      if (el) anim(el, 'wiggle', 500);
      anim(talker, 'tilt', 700);
      return ctx.say(text);
    },
    // at: where the stars fly out (default: where the child last tapped).
    // ctx.cheer = false keeps the talking character still (e.g. while it is running).
    yes(word, at) {
      sfx.ting();
      if (ctx.cheer !== false) act(talker, talker === corner ? cheerAct(who) : pick(['hjump', SIGN[who]]));
      const p = at || lastPt;
      starBurst(root, p.x, p.y);
      const n = childName();
      const extra = n && Math.random() < 0.3 ? ` Great job, ${n}!` : '';
      return ctx.say(`Yes! ${word}!${extra}`);
    },
  };
  // Tapping the character: a little reaction, and the question again (as before).
  const talk = () => {
    if (Date.now() - woke > 400) act(corner, tapAct());
    if (prompt) ctx.say(prompt);
  };
  corner.addEventListener('click', talk);

  act(corner, 'runin', { dx: offLeft(corner) });
  if (game.startRound) await game.startRound(ctx);
  let firstTry = 0;
  for (let i = 0; i < 5; i++) {
    if (!token.alive) return;
    ctx.index = i;
    missed = false;
    await game.question(ctx);
    if (!token.alive) return;
    prompt = null;
    if (!missed) firstTry++;
    stars[i].innerHTML = starSVG('#FFD43B');
    anim(stars[i], 'pop', 500);
    await sleep(450);
  }
  if (!token.alive) return;
  // Run off the screen before the party starts.
  stopAct(talker);
  if (talker.style.display !== 'none') await act(talker, 'runout', { dx: offLeft(talker) });
  if (!token.alive) return;
  let next = level;
  if (firstTry >= 4) next = level + 1;
  else if (firstTry <= 2) next = level - 1;
  S.setLevel(game.id, next);
  S.addPlay(game.id);
  S.markDone(game.id);
  // A win earns a new accessory (the treasure game gives its own from the last chest).
  const won = ctx.result && ctx.result.medal ? ctx.result.medal === 'gold' : firstTry >= 4;
  let gift = null;
  if (won && game.id !== 'treasure') {
    const left = ACC.filter((a) => !S.found().includes(a.id));
    gift = left.length ? pick(left) : 'gem';
    if (gift !== 'gem') S.addFound(gift.id);
  }
  celebrate(game, who, root, token, ctx.result, gift);
}

const GEM_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><path d="M22 38 L36 18 H64 L78 38 L50 84 Z" fill="#7FD3F0" stroke="#3E7FA0" stroke-width="4" stroke-linejoin="round"/><path d="M22 38 H78 M36 18 L44 38 L50 84 L56 38 L64 18" fill="none" stroke="#3E7FA0" stroke-width="3" stroke-linejoin="round"/><path d="M38 24 L42 34" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`;
const GIFT_SVG = `<svg viewBox="0 0 160 150" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><g class="gift-body"><rect x="18" y="58" width="124" height="86" rx="12" fill="#EF6F8E" stroke="#A8405A" stroke-width="4"/><rect x="68" y="58" width="24" height="86" fill="#FFD166" stroke="#C9952C" stroke-width="3"/><path d="M30 70 V130" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"/></g><g class="gift-lid"><rect x="8" y="38" width="144" height="28" rx="10" fill="#F58BA4" stroke="#A8405A" stroke-width="4"/><rect x="66" y="38" width="28" height="28" fill="#FFD166" stroke="#C9952C" stroke-width="3"/><path d="M80 38 C60 6 30 14 44 34 C50 40 70 40 80 38 C90 40 110 40 116 34 C130 14 100 6 80 38 Z" fill="#FFD166" stroke="#C9952C" stroke-width="4" stroke-linejoin="round"/></g></svg>`;

// The prize comes in a present: it drops in, wobbles, the lid pops off, the prize rises in a
// burst of light, then flies over to the dancer, who puts it on. Returns the (new) dancer.
async function openGift(layer, gift, who, dancer, token) {
  const X = 880;
  const Y = 500;
  const quick = reduced();
  const wait = (ms) => sleep(quick ? Math.min(ms, 250) : ms);
  const rays = h('div', { class: 'gift-rays' });
  const box = h('div', { class: 'gift-box gift-drop', html: GIFT_SVG });
  layer.append(rays, box);
  placeAt(rays, X, Y - 60);
  placeAt(box, X, Y);
  sfx.pop();
  say('A present for you!', who);
  await wait(900);
  if (!token.alive) return dancer;
  box.classList.remove('gift-drop'); // so the drop does not play again after each wobble
  // Wobble, wobble, wobble...
  for (let i = 0; i < 3; i++) {
    anim(box, 'gift-shake', 420);
    sfx.pop();
    await wait(520);
    if (!token.alive) return dancer;
  }
  // Pop!
  box.classList.add('open');
  rays.classList.add('on');
  sfx.ting();
  sfx.yay();
  starBurst(layer, X, Y - 60, 18, 260);
  firework(layer, X - 120, 220);
  firework(layer, X + 120, 200);
  const prize = h('div', { class: 'gift-prize', html: gift === 'gem' ? GEM_SVG : accSVG(gift.id) });
  layer.append(prize);
  placeAt(prize, X, Y - 20);
  requestAnimationFrame(() => prize.classList.add('up'));
  act(dancer, 'surprised');
  await say(gift === 'gem' ? 'Wow! A shiny gem!' : `Wow! A ${gift.name}!`, who);
  if (!token.alive) return dancer;
  if (gift === 'gem') {
    await say('You found everything!', who);
    return dancer;
  }
  // Fly to the dancer and put it on.
  const d = { x: dancer.offsetLeft + 130, y: dancer.offsetTop + (gift.slot === 'head' ? 40 : gift.slot === 'eyes' ? 110 : 190) };
  prize.classList.add('fly');
  setVars(prize, { '--fx': `${d.x - X}px`, '--fy': `${d.y - (Y - 20)}px` });
  rays.classList.remove('on');
  await wait(750);
  if (!token.alive) return dancer;
  prize.remove();
  S.setWear(who, gift.slot, gift.id);
  const dressed = makeChar(who, 260, `dance-${who}`);
  dressed.style.left = dancer.style.left;
  dressed.style.top = dancer.style.top;
  dancer.replaceWith(dressed);
  sfx.ting();
  starBurst(layer, d.x, d.y, 14, 180);
  act(dressed, pick(['hjump', 'flip', SIGN[who]]));
  box.classList.add('gone');
  await say(`Look at me! I love my new ${gift.name}!`, who);
  return dressed;
}

const MEDAL = { gold: ['#FFD43B', '1'], silver: ['#CBD3DE', '2'], bronze: ['#E0A070', '3'] };
function medalSVG(kind) {
  const [c, n] = MEDAL[kind];
  return `<svg viewBox="0 0 120 150" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><path d="M34 0 L56 60 L64 60 L42 0 Z" fill="#3A86FF"/><path d="M86 0 L64 60 L56 60 L78 0 Z" fill="#EF476F"/><circle cx="60" cy="96" r="46" fill="${c}" stroke="#8A6A4A" stroke-width="4"/><circle cx="60" cy="96" r="34" fill="none" stroke="#FFF6E0" stroke-width="4" opacity=".7"/><text x="60" y="114" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-size="50" font-weight="700" fill="#5A4632">${n}</text></svg>`;
}

// ---------------------------------------------------------------- celebration
function confetti(parent) {
  if (reduced()) return;
  const colors = ['#F5A9BC', '#9FC7F0', '#FFD98A', '#B9E3A0', '#FFC9A0', '#CDB8EC'];
  for (let i = 0; i < 46; i++) {
    const c = h('div', { class: 'confetti', style: {
      left: Math.random() * STAGE_W + 'px',
      background: pick(colors),
      animationDelay: Math.random() * 1.2 + 's',
      animationDuration: 2.2 + Math.random() * 1.6 + 's',
      transform: `rotate(${Math.random() * 360}deg)`,
    } });
    parent.append(c);
  }
}

async function celebrate(game, who, root, token, result, gift) {
  const layer = h('div', { class: 'celebrate' });
  confetti(layer);
  const star = h('div', { class: `big-star spin-in ${result && result.medal ? 'medal' : ''}`, html: result && result.medal ? medalSVG(result.medal) : starSVG('#FFD43B') });
  let dancer = makeChar(who, 260, `dance-${who}`);
  layer.append(star, dancer);
  root.append(layer);
  placeAt(star, 600, 200);
  placeAt(dancer, 600, 470);
  act(dancer, 'runin', { dx: offLeft(dancer) });
  // Between the dancing: a jump, a somersault or the character's own move.
  const party = () => {
    if (!token.alive || !layer.isConnected) return;
    if (!actName(dancer)) act(dancer, pick(['flip', 'hjump', SIGN[who]]));
    setTimeout(party, 3200 + Math.random() * 1800);
  };
  setTimeout(party, 2200);
  sfx.clap();
  sfx.yay();
  // Fireworks and flying stars while everyone cheers.
  let shots = 0;
  const boom = () => {
    if (!token.alive || !layer.isConnected || shots >= 9) return;
    const left = shots % 2 === 0;
    firework(layer, left ? 150 + Math.random() * 300 : 750 + Math.random() * 300, 110 + Math.random() * 200);
    shots++;
    setTimeout(boom, 600 + Math.random() * 450);
  };
  setTimeout(boom, 250);
  setTimeout(() => { if (layer.isConnected) starBurst(layer, 600, 200, 14, 280); }, 650);
  const n = childName();
  speaker = dancer;
  await say(result && result.text ? result.text : `Hooray! Great job${n ? ', ' + n : ''}!`, who);
  if (!token.alive) return;
  if (gift) {
    dancer = await openGift(layer, gift, who, dancer, token);
    if (!token.alive) return;
  }
  if (S.timeIsUp()) {
    await sleep(800);
    if (token.alive) rest();
    return;
  }
  const home = h('button', { class: 'big-btn pop-in', 'aria-label': 'Home', html: icon('home', 64, 3) });
  home.addEventListener('click', () => { sfx.pop(); menu(); });
  // A finished game is locked for today, so only "home" is offered then.
  let again = null;
  if (!S.isLocked(game.id)) {
    again = h('button', { class: 'big-btn pop-in', 'aria-label': 'Play again', html: icon('replay', 64, 3) });
    again.addEventListener('click', () => { sfx.pop(); choose(game); });
  }
  layer.append(h('div', { class: 'celebrate-btns' }, again, home));
}

// ---------------------------------------------------------------- rest time
function rest() {
  setMusic(false);
  const root = h('div', { class: 'screen' }, h('div', { class: 'bg', html: placeSVG('night') }));
  const sleepy = makeChar('moko', 280, 'sleepy', { sleep: true });
  const zzz = h('div', { class: 'zzz' }, 'z z z');
  const lock = roundBtn('lock', 'Parents', () => gate(() => parent()), 'lock-btn');
  root.append(sleepy, zzz, lock);
  setScreen('rest', root, 'night');
  placeAt(sleepy, 600, 470);
  const n = childName();
  setTimeout(() => speakAs(sleepy, `Time to rest${n ? ', ' + n : ''}! Bye-bye!`, 'moko'), 400);
  const day = todayKey();
  const timer = setInterval(() => {
    if (todayKey() !== day && current.name === 'rest') {
      clearInterval(timer);
      setMusic(S.get('music') !== false);
      menu(true);
    }
  }, 30000);
  current.cleanup = () => clearInterval(timer);
}

// ---------------------------------------------------------------- bedtime (DESAIN.md 9)
// Every game was played today: the child picks one monster to put to bed. It sleeps under a
// blanket while a soft lullaby plays, until tomorrow (or until a parent opens the games again).
const BED_SVG = `<svg viewBox="0 0 560 380" width="100%" height="100%" aria-hidden="true" style="overflow:visible">
<ellipse cx="280" cy="372" rx="280" ry="16" fill="#1C2254" opacity=".25"/>
<rect x="40" y="0" width="480" height="250" rx="70" fill="#C98F5E" stroke="#8E5C34" stroke-width="5"/>
<rect x="76" y="34" width="408" height="170" rx="50" fill="#DDA977" stroke="#B57E4A" stroke-width="4"/>
<path d="M280 70 C262 52 232 66 246 92 L280 124 L314 92 C328 66 298 52 280 70 Z" fill="#F7B5C6" stroke="#C9768A" stroke-width="4"/>
<ellipse cx="280" cy="196" rx="168" ry="52" fill="#FFF8EE" stroke="#D9C7AE" stroke-width="4"/>
<path d="M150 190 Q280 214 410 190" stroke="#EADBC4" stroke-width="5" fill="none"/>
<rect x="10" y="250" width="540" height="96" rx="24" fill="#C98F5E" stroke="#8E5C34" stroke-width="5"/>
<rect x="30" y="336" width="34" height="40" rx="8" fill="#A9733F" stroke="#8E5C34" stroke-width="4"/><rect x="496" y="336" width="34" height="40" rx="8" fill="#A9733F" stroke="#8E5C34" stroke-width="4"/>
</svg>`;
const BLANKET_SVG = `<svg viewBox="0 0 560 200" width="100%" height="100%" aria-hidden="true" style="overflow:visible">
<path d="M6 30 Q140 6 280 22 Q420 6 554 30 L560 186 Q280 204 0 186 Z" fill="#8FB8EE" stroke="#5C86C0" stroke-width="5" stroke-linejoin="round"/>
<path d="M6 30 Q140 6 280 22 Q420 6 554 30 L555 62 Q420 40 280 54 Q140 40 5 62 Z" fill="#FFF8EE" stroke="#C9B8A0" stroke-width="4" stroke-linejoin="round"/>
${[[90, 110], [200, 140], [330, 105], [450, 140], [140, 165], [390, 168], [260, 160]].map(([x, y], k) => `<path d="M${x} ${y - 12} L${x + 4} ${y - 4} L${x + 12} ${y} L${x + 4} ${y + 4} L${x} ${y + 12} L${x - 4} ${y + 4} L${x - 12} ${y} L${x - 4} ${y - 4} Z" fill="${k % 2 ? '#FFE9A8' : '#FFFFFF'}" opacity=".85"/>`).join('')}
<path d="M40 96 Q60 120 50 150 M520 96 Q500 120 510 150" stroke="#7CA4DC" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;

function bedtime() {
  const night = { time: 'night', weather: null };
  const root = h('div', { class: 'screen mood-night' }, h('div', { class: 'bg', html: placeSVG('playroom', night) }));
  const lock = roundBtn('lock', 'Parents', () => gate(() => parent()), 'lock-btn');
  root.append(lock);
  setScreen('bed', root, 'playroom');
  root.classList.add('mood-night');
  setBackdrop('playroom', night);
  document.body.style.background = '#3A3F70';
  const music = S.get('music') !== false;
  setMusic(music, 'lullaby');
  const day = todayKey();
  const timer = setInterval(() => {
    if (todayKey() !== day && current.name === 'bed') { clearInterval(timer); menu(true); }
  }, 30000);
  current.cleanup = () => { clearInterval(timer); setMusic(S.get('music') !== false, 'play'); };
  const n = childName();

  const sleep = (who, first) => {
    const bed = h('div', { class: 'bed-frame' + (first ? ' pop-in' : ''), html: BED_SVG });
    const sleeper = makeChar(who, 230, 'bed-sleeper', { sleep: true });
    const blanket = h('div', { class: 'bed-blanket' + (first ? ' tuck' : ''), html: BLANKET_SVG });
    const zzz = h('div', { class: 'zzz bed-zzz' }, 'z z z');
    root.append(bed, sleeper, blanket, zzz);
    placeAt(bed, 640, 500);
    placeAt(sleeper, 640, 420);
    placeAt(blanket, 640, 560);
    placeAt(zzz, 800, 270);
    const hush = () => { sfx.pop(); anim(sleeper, 'giggle', 500); speakAs(sleeper, 'Shh... good night!', who); };
    sleeper.addEventListener('click', hush);
    blanket.addEventListener('click', hush);
    if (first) setTimeout(() => speakAs(sleeper, `Good night${n ? ', ' + n : ''}! Sweet dreams. See you tomorrow!`, who), 900);
  };

  const already = S.bedWho();
  if (already) { sleep(already, false); return; }

  const title = h('h1', { class: 'choose-title' }, 'Bedtime! Who goes to sleep?');
  const cells = ['moko', 'gumi', 'tobi'].map((who, i) => {
    const c = makeChar(who, 220, 'bob d' + i);
    const btn = h('button', { class: 'choose-btn', 'aria-label': `Put ${CHARS[who].name} to bed` }, c,
      h('span', { class: 'name-pill', style: { background: `linear-gradient(${CHARS[who].tint}, ${CHARS[who].color} 85%)`, borderColor: CHARS[who].dark } }, CHARS[who].name));
    return { who, c, btn };
  });
  const row = h('div', { class: 'choose-row bed-choose' }, ...cells.map((x) => x.btn));
  root.append(title, row);
  let picked = false;
  cells.forEach(({ who, c, btn }) => {
    btn.addEventListener('click', async () => {
      if (picked) return;
      picked = true;
      sfx.pop();
      S.setBed(who);
      act(c, 'yawn');
      await speakAs(c, 'Yawn... I am so sleepy!', who);
      if (current.name !== 'bed') return;
      title.classList.add('fade-out');
      row.classList.add('fade-out');
      setTimeout(() => { title.remove(); row.remove(); sleep(who, true); }, 500);
    });
  });
  setTimeout(() => speakAs(cells[0].c, `Wow, we played every game today! Great job${n ? ', ' + n : ''}! Now it's bedtime. Who goes to sleep?`, 'moko'), 400);
}

// ---------------------------------------------------------------- parent gate
const ANGKA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];

function gate(onPass) {
  const overlay = h('div', { class: 'overlay' });
  const panel = h('div', { class: 'panel gate' });
  overlay.append(panel);
  stage.append(overlay);
  stopSpeech();
  let a;
  let b;
  let entry = '';
  const q = h('p', { class: 'gate-q' });
  const shown = h('div', { class: 'gate-entry' });
  const newQ = () => {
    a = 3 + Math.floor(Math.random() * 7);
    b = 3 + Math.floor(Math.random() * 7);
    entry = '';
    q.textContent = `Berapa ${ANGKA[a]} kali ${ANGKA[b]}?`;
    shown.textContent = '—';
  };
  const keys = h('div', { class: 'keypad' });
  const press = (d) => {
    if (entry.length >= 2) return;
    entry += d;
    shown.textContent = entry;
  };
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) keys.append(h('button', { class: 'key', onClick: () => press(d) }, d));
  keys.append(h('button', { class: 'key key-del', onClick: () => { entry = entry.slice(0, -1); shown.textContent = entry || '—'; } }, 'Hapus'));
  const ok = h('button', { class: 'key key-ok', onClick: () => {
    if (Number(entry) === a * b) {
      overlay.remove();
      onPass();
    } else {
      anim(panel, 'wiggle', 500);
      newQ();
    }
  } }, 'OK');
  keys.append(ok);
  const close = h('button', { class: 'panel-close', 'aria-label': 'Tutup', html: icon('close', 32), onClick: () => overlay.remove() });
  panel.append(close, h('h2', null, 'Khusus orang tua'), h('p', { class: 'muted' }, 'Jawab soal ini untuk masuk ke pengaturan.'), q, shown, keys);
  newQ();
}

// ---------------------------------------------------------------- parent settings
function parent() {
  const root = h('div', { class: 'screen parent' });
  const back = h('button', { class: 'p-back', onClick: () => { setMusic(S.get('music') !== false); menu(); } }, h('span', { html: icon('back', 28) }), 'Kembali ke game');

  const nameIn = h('input', { type: 'text', maxlength: '20', value: S.get('name') || '', id: 'p-name', autocomplete: 'off' });
  nameIn.addEventListener('input', () => S.set('name', nameIn.value.trim()));

  const limits = [[0, 'Mati'], [10, '10 menit'], [15, '15 menit'], [20, '20 menit']];
  const limitRow = h('div', { class: 'pills' });
  const drawLimits = () => {
    limitRow.innerHTML = '';
    for (const [v, label] of limits) {
      limitRow.append(h('button', { class: `pill ${S.get('limit') === v ? 'on' : ''}`, 'aria-pressed': String(S.get('limit') === v), onClick: () => { S.set('limit', v); drawLimits(); } }, label));
    }
  };
  drawLimits();

  const musicRow = h('div', { class: 'pills' });
  const drawMusic = () => {
    musicRow.innerHTML = '';
    const on = S.get('music') !== false;
    musicRow.append(
      h('button', { class: `pill ${on ? 'on' : ''}`, 'aria-pressed': String(on), onClick: () => { S.set('music', true); drawMusic(); } }, 'Nyala'),
      h('button', { class: `pill ${!on ? 'on' : ''}`, 'aria-pressed': String(!on), onClick: () => { S.set('music', false); drawMusic(); } }, 'Mati'));
  };
  drawMusic();

  const mins = Math.floor(S.secondsToday() / 60);
  const today = h('p', { class: 'muted' }, `Waktu main hari ini: ${mins} menit`);
  const more = h('button', { class: 'p-btn', onClick: () => { S.resetToday(); today.textContent = 'Waktu main hari ini: 0 menit (dihitung ulang)'; } }, 'Beri waktu main lagi hari ini');

  const vn = voiceName();
  const voiceInfo = h('p', { class: 'muted' }, vn ? `Suara yang dipakai: ${vn}` : 'Belum ada suara Bahasa Inggris di perangkat ini. Pasang lewat pengaturan Bahasa/Ucapan di tablet.');
  const test = h('button', { class: 'p-btn', onClick: () => { unlockAudio(); say(`Hello${childName() ? ' ' + childName() : ''}! I am Moko.`, 'moko'); } }, 'Tes suara');

  // One round per game per day; opens again by itself after midnight.
  const lockInfo = h('p', { class: 'muted' });
  const drawLockInfo = () => {
    lockInfo.textContent = !S.lockOn()
      ? 'Mati: semua permainan bisa dimainkan berulang kali.'
      : `Permainan yang selesai dimainkan dikunci sampai besok (terbuka sendiri jam 00.00). Terkunci hari ini: ${S.doneCount()} dari ${GAMES.length}.`;
  };
  const lockRow = h('div', { class: 'pills' });
  const drawLock = () => {
    lockRow.innerHTML = '';
    const on = S.lockOn();
    lockRow.append(
      h('button', { class: `pill ${on ? 'on' : ''}`, 'aria-pressed': String(on), onClick: () => { S.set('lockDone', true); drawLock(); } }, 'Nyala'),
      h('button', { class: `pill ${!on ? 'on' : ''}`, 'aria-pressed': String(!on), onClick: () => { S.set('lockDone', false); drawLock(); } }, 'Mati'));
    drawLockInfo();
  };
  drawLock();
  const unlock = h('button', { class: 'p-btn', onClick: () => { S.unlockAll(); drawLockInfo(); } }, 'Buka semua permainan hari ini');

  const table = h('table', { class: 'progress-table' },
    h('thead', null, h('tr', null, h('th', null, 'Permainan'), h('th', null, 'Tingkat'), h('th', null, 'Dimainkan'))),
    h('tbody', null, ...GAMES.map((g) => h('tr', null, h('td', null, `${g.titleId} (${g.title})`), h('td', null, `${S.level(g.id)} dari 5`), h('td', null, `${S.plays(g.id)} kali`)))));

  const resetBox = h('div', { class: 'reset-box' });
  const drawReset = (ask) => {
    resetBox.innerHTML = '';
    if (!ask) {
      resetBox.append(h('button', { class: 'p-btn danger', onClick: () => drawReset(true) }, 'Mulai dari awal'));
    } else {
      resetBox.append(h('p', null, 'Yakin? Semua tingkat dan catatan main akan dihapus.'),
        h('button', { class: 'p-btn danger', onClick: () => { S.resetProgress(); parent(); } }, 'Ya, hapus'),
        h('button', { class: 'p-btn', onClick: () => drawReset(false) }, 'Batal'));
    }
  };
  drawReset(false);

  root.append(back, h('h1', null, 'Pengaturan orang tua'),
    h('div', { class: 'p-grid' },
      h('section', null,
        h('label', { for: 'p-name' }, 'Nama anak'), nameIn,
        h('p', { class: 'muted' }, 'Dipakai karakter untuk menyapa dan memuji. Hanya tersimpan di tablet ini.'),
        h('h3', null, 'Batas waktu main per hari'), limitRow,
        today, more,
        h('h3', null, 'Musik'), musicRow,
        h('h3', null, 'Suara'), voiceInfo, test),
      h('section', null,
        h('h3', null, 'Kunci permainan yang sudah dimainkan'), lockRow, lockInfo, unlock,
        h('h3', null, 'Kemajuan anak'), table,
        h('p', { class: 'muted' }, 'Tingkat naik bila 4 dari 5 soal benar pada percobaan pertama, dan turun bila hanya 2 atau kurang.'),
        resetBox)));
  setScreen('parent', root, 'sky');
  document.body.style.background = '#F4F8FF';
}

// ---------------------------------------------------------------- start
if ('serviceWorker' in navigator && location.hostname.endsWith('github.io')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
splash();

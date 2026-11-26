// Monster Land — screens and the flow between them.
import { h, sleep, pick, shuffle, anim, placeAt, seeded, todayKey, toStage, STAGE_W, STAGE_H } from './util.js';
import * as S from './store.js';
import { say, sfx, unlockAudio, setMusic, onSpeech, stopSpeech, isSpeaking, voiceName } from './sound.js';
import { CHARS, charSVG, icon, starSVG, placeSVG, PLACE_COLOR, CARD_ART } from './art.js';
import { act, stopAct, offLeft, idleAct, cheerAct, tapAct, idleLoop, isIdleAct, actMs, actName, SIGN } from './acts.js';
import words from './games/words.js';
import count from './games/count.js';
import shapes from './games/shapes.js';
import colors from './games/colors.js';
import train from './games/train.js';
import treasure from './games/treasure.js';
import race from './games/race.js';
import { ACC, SLOTS, dress, accSVG } from './acc.js';

const GAMES = [words, count, shapes, colors, train, treasure, race];
const stage = document.getElementById('stage');

// ---------------------------------------------------------------- layout
function fit() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));
fit();

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
  document.body.style.background = PLACE_COLOR[place] || PLACE_COLOR.sky;
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
  return GAMES.slice()
    .sort((a, b) => S.plays(a.id) - S.plays(b.id) || seeded(day + a.id) - seeded(day + b.id))
    .slice(0, 3);
}

function gameCard(game, big) {
  const card = h('button', { class: `card game-card ${big ? 'big' : ''}`, style: { background: game.card }, 'aria-label': game.title },
    h('div', { class: 'card-art', html: CARD_ART[game.art]() }),
    h('span', { class: 'card-title' }, game.title));
  card.addEventListener('click', () => {
    sfx.pop();
    anim(card, 'press', 300);
    choose(game);
  });
  return card;
}

function menu(greet = false) {
  if (S.timeIsUp()) return rest();
  const root = h('div', { class: 'screen' }, h('div', { class: 'bg', html: placeSVG('sky') }));
  const name = childName();
  const hello = `Hi ${name || 'friend'}! Let's play!`;
  const moko = makeChar('moko', 120, 'menu-moko');
  const bubble = h('div', { class: 'bubble' }, h('span', { html: icon('speaker', 30) }), h('span', null, hello));
  const top = h('div', { class: 'menu-top' }, moko, bubble);
  const lock = roundBtn('lock', 'Parents', () => gate(() => parent()), 'lock-btn');
  const pickRow = h('div', { class: 'pick-row' }, ...picks().map((g) => gameCard(g, true)));
  const allRow = h('div', { class: 'all-row' }, ...GAMES.map((g) => gameCard(g, false)));
  root.append(top, lock,
    h('p', { class: 'row-label', style: { top: '186px' } }, "Moko's picks"), pickRow,
    h('p', { class: 'row-label', style: { top: '530px' } }, 'All games'), allRow);
  setScreen('menu', root, 'sky');
  current.cleanup = idleLoop([moko], () => !isSpeaking());
  const talk = () => { act(moko, tapAct()); speakAs(moko, hello, 'moko'); };
  moko.addEventListener('click', talk);
  bubble.addEventListener('click', talk);
  if (greet) {
    act(moko, 'runin', { dx: offLeft(moko) });
    setTimeout(() => speakAs(moko, hello, 'moko'), 300);
  }
  else setTimeout(() => speakAs(moko, 'Pick a game!', 'moko'), 300);
}

// ---------------------------------------------------------------- choose a monster
function choose(game) {
  if (S.timeIsUp()) return rest();
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
  done.addEventListener('click', () => { sfx.yay(); stopSpeech(); overlay.remove(); onDone(); });
  panel.append(stageBox, grid, done);
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
      bg.innerHTML = placeSVG(p);
      document.body.style.background = PLACE_COLOR[p];
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
  celebrate(game, who, root, token, ctx.result);
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

async function celebrate(game, who, root, token, result) {
  const layer = h('div', { class: 'celebrate' });
  confetti(layer);
  const star = h('div', { class: `big-star spin-in ${result && result.medal ? 'medal' : ''}`, html: result && result.medal ? medalSVG(result.medal) : starSVG('#FFD43B') });
  const dancer = makeChar(who, 260, `dance-${who}`);
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
  if (S.timeIsUp()) {
    await sleep(800);
    if (token.alive) rest();
    return;
  }
  const again = h('button', { class: 'big-btn pop-in', 'aria-label': 'Play again', html: icon('replay', 64, 3) });
  const home = h('button', { class: 'big-btn pop-in', 'aria-label': 'Home', html: icon('home', 64, 3) });
  again.addEventListener('click', () => { sfx.pop(); choose(game); });
  home.addEventListener('click', () => { sfx.pop(); menu(); });
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

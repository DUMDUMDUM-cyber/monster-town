// Maze — drag the monster along the paths to the treasure (DESAIN.md 8.3).
// Levels: 1 small maze (4×3), 2 bigger (5×4), 3 bigger (6×4) and pick up a star on the way,
// 4 a locked door on the way: find the key first (6×4), 5 key, door and two stars (7×5).
// A maze counts as "right first time" when the child did not wander much (few extra steps).
import { h, sleep, pick, shuffle, anim, placeAt, toStage } from '../util.js';
import { chestSVGInner, starSVG } from '../art.js';
import { sfx } from '../sound.js';

const SIZE = { 1: [4, 3], 2: [5, 4], 3: [6, 4], 4: [6, 4], 5: [7, 5] };
const KEY_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="50" r="18" fill="#FFCF4D" stroke="#C9952C" stroke-width="5"/><circle cx="32" cy="50" r="7" fill="#FFF6D8"/><path d="M50 50 H88 M76 50 V64 M86 50 V60" stroke="#C9952C" stroke-width="9" stroke-linecap="round"/><path d="M50 50 H88" stroke="#FFCF4D" stroke-width="4" stroke-linecap="round"/></svg>`;
const DOOR_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><rect x="14" y="8" width="72" height="88" rx="10" fill="#B57A48" stroke="#7A4E2E" stroke-width="5"/><path d="M38 8 V96 M62 8 V96" stroke="#7A4E2E" stroke-width="3" opacity=".5"/><rect x="36" y="44" width="28" height="24" rx="5" fill="#FFCF4D" stroke="#C9952C" stroke-width="3.5"/><path d="M42 44 V36 A8 8 0 0 1 58 36 V44" fill="none" stroke="#C9952C" stroke-width="4"/></svg>`;

// A "perfect" maze: exactly one path between any two cells.
function makeMaze(C, R) {
  const open = Array.from({ length: C * R }, () => new Set());
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const c = cur % C;
    const r = Math.floor(cur / C);
    const nb = shuffle([[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < C && y < R).map(([x, y]) => y * C + x).filter((n) => !seen.has(n));
    if (!nb.length) { stack.pop(); continue; }
    const n = nb[0];
    open[cur].add(n);
    open[n].add(cur);
    seen.add(n);
    stack.push(n);
  }
  return open;
}

// Shortest paths from one cell (optionally not passing a blocked cell).
function bfs(open, from, blocked = -1) {
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const n of open[cur]) {
      if (n === blocked || dist.has(n)) continue;
      dist.set(n, dist.get(cur) + 1);
      prev.set(n, cur);
      q.push(n);
    }
  }
  return { dist, prev };
}
const pathTo = (prev, from, to) => { const p = [to]; while (p[0] !== from) p.unshift(prev.get(p[0])); return p; };

export default {
  id: 'maze',
  title: 'Maze',
  titleId: 'Labirin',
  card: '#DDF2D2',
  art: 'maze',

  startRound(ctx) {
    ctx.setPlace('country');
  },

  question(ctx) {
    const L = ctx.level;
    const [C, R] = SIZE[L];
    const open = makeMaze(C, R);
    const start = 0;
    const goal = C * R - 1;
    const N = C * R;
    // Door and key (levels 4–5): the door sits on the way to the treasure, the key somewhere
    // that can be reached without going through the door.
    let door = -1;
    let key = -1;
    const used = new Set([start, goal]);
    if (L >= 4) {
      const { prev } = bfs(open, start);
      const route = pathTo(prev, start, goal);
      door = route[Math.max(2, Math.floor(route.length * 0.6))];
      if (door === goal) door = route[route.length - 2];
      const before = bfs(open, start, door).dist;
      key = [...before.entries()].filter(([c]) => c !== start).sort((a, b) => b[1] - a[1])[0][0];
      used.add(door).add(key);
    }
    const stars = [];
    const wantStars = L === 3 ? 1 : L === 5 ? 2 : 0;
    const free = shuffle([...Array(N).keys()].filter((c) => !used.has(c) && c > C));
    for (let i = 0; i < wantStars && i < free.length; i++) { stars.push(free[i]); used.add(free[i]); }

    // A fair number of steps: visit the key and stars (nearest first), then the treasure.
    let best = 0;
    {
      let cur = start;
      let haveKey = door < 0;
      const todo = [...stars, ...(key >= 0 ? [key] : [])];
      while (todo.length) {
        const { dist } = bfs(open, cur, haveKey ? -1 : door);
        todo.sort((a, b) => (dist.get(a) ?? 999) - (dist.get(b) ?? 999));
        const nx = todo.shift();
        best += dist.get(nx) ?? 0;
        if (nx === key) haveKey = true;
        cur = nx;
      }
      best += bfs(open, cur).dist.get(goal);
    }

    ctx.area.innerHTML = '';
    const cs = Math.min(Math.floor(880 / C), Math.floor(520 / R), 150);
    const W = cs * C;
    const H = cs * R;
    const left = 660 - W / 2;
    const top = 455 - H / 2;
    let walls = '';
    const seg = (x1, y1, x2, y2) => { walls += `M${x1} ${y1} L${x2} ${y2} `; };
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const i = r * C + c;
        const x = c * cs;
        const y = r * cs;
        if (r === 0) seg(x, y, x + cs, y);
        if (c === 0) seg(x, y, x, y + cs);
        if (c === C - 1 || !open[i].has(i + 1)) seg(x + cs, y, x + cs, y + cs);
        if (r === R - 1 || !open[i].has(i + C)) seg(x, y + cs, x + cs, y + cs);
      }
    }
    const board = h('div', { class: 'mz-board pop-in', style: { width: W + 'px', height: H + 'px' },
      html: `<svg viewBox="-6 -6 ${W + 12} ${H + 12}" width="${W + 12}" height="${H + 12}" style="position:absolute;left:-6px;top:-6px" aria-hidden="true"><rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#F3E2BE"/><path d="${walls}" stroke="#4E8F3E" stroke-width="${Math.max(10, cs * 0.13)}" stroke-linecap="round" fill="none"/><path d="${walls}" stroke="#7CC46A" stroke-width="${Math.max(5, cs * 0.07)}" stroke-linecap="round" fill="none"/></svg>` });
    ctx.area.append(board);
    placeAt(board, 660, 455);
    const cellXY = (i) => ({ x: left + (i % C) * cs + cs / 2, y: top + Math.floor(i / C) * cs + cs / 2 });
    const thing = (i, html, cls, k = 0.7) => {
      const el = h('div', { class: `mz-thing ${cls}`, html, style: { width: cs * k + 'px', height: cs * k + 'px' } });
      ctx.area.append(el);
      const p = cellXY(i);
      placeAt(el, p.x, p.y);
      return el;
    };
    const goalEl = thing(goal, `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true">${chestSVGInner({ locked: false })}</svg>`, 'mz-goal', 1.05);
    const keyEl = key >= 0 ? thing(key, KEY_SVG, 'mz-key') : null;
    const doorEl = door >= 0 ? thing(door, DOOR_SVG, 'mz-door') : null;
    const starEls = new Map(stars.map((s) => [s, thing(s, starSVG('#FFD43B'), 'mz-star')]));

    const me = ctx.makeChar(ctx.who, Math.round(cs * 0.72), 'mz-me');
    ctx.area.append(me);
    let pos = start;
    const put = () => { const p = cellXY(pos); placeAt(me, p.x, p.y - cs * 0.08); };
    put();

    return new Promise((resolve) => {
      let steps = 0;
      let haveKey = door < 0;
      let done = false;
      let lockedSaid = 0;
      const stepTo = (n) => {
        if (n === door && !haveKey) {
          if (Date.now() - lockedSaid > 2500) { lockedSaid = Date.now(); sfx.boop(); anim(doorEl, 'wiggle', 500); ctx.say('The door is locked. Find the key!'); }
          return false;
        }
        pos = n;
        steps++;
        put();
        sfx.click();
        if (n === key && keyEl && !keyEl.classList.contains('got')) {
          haveKey = true;
          keyEl.classList.add('got');
          sfx.ting();
          ctx.burst(cellXY(n).x, cellXY(n).y, 8, 100);
          ctx.say('The key! Now open the door!');
        }
        if (n === door && doorEl && !doorEl.classList.contains('got')) {
          doorEl.classList.add('got');
          sfx.yay();
        }
        if (starEls.has(n)) {
          const s = starEls.get(n);
          starEls.delete(n);
          s.classList.add('got');
          sfx.ting();
          ctx.burst(cellXY(n).x, cellXY(n).y, 8, 100);
          ctx.say(starEls.size ? 'A star! One more!' : 'A star!');
        }
        if (n === goal) {
          if (starEls.size) {
            sfx.boop();
            ctx.say(`Get the ${starEls.size > 1 ? 'stars' : 'star'} first!`);
            return true;
          }
          done = true;
          if (steps > best * 1.5 + 4) ctx.miss();
          goalEl.innerHTML = `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true">${chestSVGInner({ open: true })}</svg>`;
          anim(goalEl, 'pop', 500);
          (async () => { await sleep(250); await ctx.yes('You found the treasure', cellXY(goal)); resolve(); })();
        }
        return true;
      };
      // Follow the finger: step into the cell under it when there is an open path (up to 3 steps).
      const follow = (e) => {
        if (done) return;
        const p = toStage(e.clientX, e.clientY);
        const c = Math.floor((p.x - left) / cs);
        const r = Math.floor((p.y - top) / cs);
        if (c < 0 || r < 0 || c >= C || r >= R) return;
        const target = r * C + c;
        if (target === pos) return;
        const { dist, prev } = bfs(open, pos);
        const d = dist.get(target);
        if (d == null || d > 3) return;
        for (const n of pathTo(prev, pos, target).slice(1)) if (!stepTo(n) || done) break;
      };
      let dragging = null;
      board.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dragging = e.pointerId;
        try { board.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        follow(e);
      });
      board.addEventListener('pointermove', (e) => { if (dragging === e.pointerId) follow(e); });
      const up = () => { dragging = null; };
      board.addEventListener('pointerup', up);
      board.addEventListener('pointercancel', up);
      ctx.prompt(L >= 5 ? 'Get the key and the stars, then go to the treasure!'
        : L === 4 ? 'Find the key, open the door, and go to the treasure!'
          : L === 3 ? 'Get the star, then go to the treasure!'
            : 'Help me get to the treasure! Move me with your finger.');
    });
  },
};

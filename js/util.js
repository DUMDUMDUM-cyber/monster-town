// Small helpers shared by every screen and game.
export const STAGE_W = 1200;
export const STAGE_H = 800;

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = (arr, n, exclude = []) => shuffle(arr.filter((x) => !exclude.includes(x))).slice(0, n);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Restart a CSS animation class on an element.
export function anim(el, cls, ms = 600) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el['_t_' + cls]);
  el['_t_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
}

// Convert a screen (client) point into stage coordinates (1200 x 800).
export function toStage(clientX, clientY) {
  const r = document.getElementById('stage').getBoundingClientRect();
  const s = r.width / STAGE_W;
  return { x: (clientX - r.left) / s, y: (clientY - r.top) / s };
}

// Absolutely position an element so its centre sits at (x, y) in stage px.
export function placeAt(el, x, y) {
  const w = parseFloat(el.style.width) || el.offsetWidth;
  const hh = parseFloat(el.style.height) || el.offsetHeight;
  el.style.left = x - w / 2 + 'px';
  el.style.top = y - hh / 2 + 'px';
}

export function centerOf(el) {
  const w = parseFloat(el.style.width) || el.offsetWidth;
  const hh = parseFloat(el.style.height) || el.offsetHeight;
  return { x: el.offsetLeft + w / 2, y: el.offsetTop + hh / 2 };
}

export function moveTo(el, x, y, ms = 300) {
  el.style.transition = `left ${ms}ms ease, top ${ms}ms ease, transform ${ms}ms ease`;
  placeAt(el, x, y);
}

// Find the closest target whose centre is within maxDist of point p.
export function nearest(p, targets, maxDist) {
  let best = null;
  let bestD = Infinity;
  for (const t of targets) {
    const c = centerOf(t.el);
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD && d <= (t.reach || maxDist)) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

// Make an element draggable with a finger. onDrop({x,y}) returns true when the
// drop was accepted (the caller then snaps it); otherwise it flies back home.
export function draggable(el, { onDrop, onTap, onLift, onMove, onEnd } = {}) {
  let start = null;
  let moved = false;
  let pid = null;
  el.style.touchAction = 'none';
  const ensureHome = () => {
    if (el.dataset.homeLeft == null) {
      el.dataset.homeLeft = el.offsetLeft;
      el.dataset.homeTop = el.offsetTop;
    }
  };
  const back = () => {
    ensureHome();
    el.style.transition = 'left .38s cubic-bezier(.3,1.5,.5,1), top .38s cubic-bezier(.3,1.5,.5,1), transform .3s';
    el.style.left = el.dataset.homeLeft + 'px';
    el.style.top = el.dataset.homeTop + 'px';
    el.classList.remove('lifted');
  };
  el.addEventListener('pointerdown', (e) => {
    if (el.dataset.locked) return;
    e.preventDefault();
    ensureHome();
    pid = e.pointerId;
    try { el.setPointerCapture(pid); } catch (_) { /* ignore */ }
    const p = toStage(e.clientX, e.clientY);
    start = { x: p.x, y: p.y, left: el.offsetLeft, top: el.offsetTop };
    moved = false;
    el.style.transition = 'transform .2s';
    el.classList.add('dragging');
  });
  el.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== pid) return;
    const p = toStage(e.clientX, e.clientY);
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    if (!moved && Math.hypot(dx, dy) > 12) {
      moved = true;
      el.classList.add('lifted');
      if (onLift) onLift();
    }
    if (moved) {
      el.style.left = start.left + dx + 'px';
      el.style.top = start.top + dy + 'px';
      if (onMove) onMove(centerOf(el));
    }
  });
  const end = (e) => {
    if (!start || e.pointerId !== pid) return;
    start = null;
    el.classList.remove('dragging');
    if (onEnd) onEnd();
    if (!moved) {
      if (onTap) onTap();
      return;
    }
    const c = centerOf(el);
    const ok = onDrop ? onDrop(c) : false;
    if (!ok) back();
    else el.classList.remove('lifted');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  return { back };
}

export const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

// Seeded random so "Moko's picks" stay the same for the whole day.
export function seeded(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return ((x >>> 0) % 10000) / 10000;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

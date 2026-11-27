// Picture puzzle — drag the pieces into the frame (DESAIN.md 8.2).
// Levels: 1 four pieces with a faint picture to help, 2 six pieces with help, 3 six pieces
// without help, 4 nine pieces, 5 twelve pieces and some are turned (tap a piece to turn it).
// A picture counts as "right first time" with fewer than two wrong drops.
import { h, sleep, pick, shuffle, anim, placeAt, draggable } from '../util.js';
import { picSVG, grad } from '../art.js';
import { sfx } from '../sound.js';

const SCENES = [
  { word: 'lion', sky: '#BFE3F5', ground: '#A2CF7C' },
  { word: 'cow', sky: '#CFE9F7', ground: '#9CCB6E' },
  { word: 'car', sky: '#FFE2C4', ground: '#C9B79A' },
  { word: 'teddy bear', sky: '#F6DDF0', ground: '#E9C9A4' },
  { word: 'butterfly', sky: '#D9F0FF', ground: '#B5DC8C' },
  { word: 'duck', sky: '#CDEBF7', ground: '#7CC4E0' },
  { word: 'cake', sky: '#FFF0D2', ground: '#E8B894' },
  { word: 'plane', sky: '#BFE0FA', ground: '#A6D38A' },
  { word: 'frog', sky: '#DDF4E4', ground: '#7CC4E0' },
  { word: 'horse', sky: '#FBE7C8', ground: '#A2CF7C' },
  { word: 'fish', sky: '#BDE6F6', ground: '#6FB9DA' },
  { word: 'rabbit', sky: '#E4F1D6', ground: '#9CCB6E' },
];
const VW = 400;
const VH = 300;
const FW = 420; // frame size on the stage
const FH = 315;
const FX = 430; // frame centre
const FY = 440;
const GRID = { 1: [2, 2], 2: [3, 2], 3: [3, 2], 4: [3, 3], 5: [4, 3] };

const inner = (svg) => svg.replace(/^<svg[^>]*>|<\/svg>$/g, '');
function scene(sc) {
  const flower = (x, c) => `<svg x="${x}" y="226" width="54" height="54" viewBox="0 0 100 100" overflow="visible">${inner(picSVG('flower', c))}</svg>`;
  return `<rect width="${VW}" height="${VH}" fill="${sc.sky}"/>`
    + `<circle cx="345" cy="52" r="30" fill="${grad('#FFD84D')}" stroke="#E0A93A" stroke-width="3"/>`
    + `<g fill="#FFFFFF" opacity=".9"><ellipse cx="70" cy="56" rx="38" ry="16"/><ellipse cx="96" cy="46" rx="26" ry="16"/></g>`
    + `<path d="M0 220 Q100 200 200 214 T400 210 V300 H0 Z" fill="${sc.ground}"/>`
    + flower(18, '#FF8FB1') + flower(330, '#CDB8EC')
    + `<svg x="95" y="40" width="210" height="210" viewBox="0 0 100 100" overflow="visible">${inner(picSVG(sc.word))}</svg>`;
}

export default {
  id: 'puzzle',
  title: 'Puzzle',
  titleId: 'Puzzle Gambar',
  card: '#DDEFFC',
  art: 'puzzle',

  startRound(ctx) {
    ctx.round = { scenes: shuffle(SCENES) };
    ctx.setPlace('table');
  },

  question(ctx) {
    const L = ctx.level;
    const sc = ctx.round.scenes[ctx.index % SCENES.length];
    const [cols, rows] = GRID[L];
    const pw = FW / cols;
    const ph = FH / rows;
    const art = scene(sc);
    ctx.area.innerHTML = '';
    const frame = h('div', { class: 'pz-frame', style: { width: FW + 'px', height: FH + 'px' } });
    if (L <= 2) frame.append(h('div', { class: 'pz-guide', html: `<svg viewBox="0 0 ${VW} ${VH}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${art}</svg>` }));
    let lines = '';
    for (let c = 1; c < cols; c++) lines += `<path d="M${(c * VW) / cols} 0 V${VH}"/>`;
    for (let r = 1; r < rows; r++) lines += `<path d="M0 ${(r * VH) / rows} H${VW}"/>`;
    frame.append(h('div', { class: 'pz-lines', html: `<svg viewBox="0 0 ${VW} ${VH}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#8A6A4A" stroke-width="2" stroke-dasharray="7 6" opacity=".45">${lines}</g></svg>` }));
    ctx.area.append(frame);
    placeAt(frame, FX, FY);
    const left0 = FX - FW / 2;
    const top0 = FY - FH / 2;
    const slotAt = (c, r) => ({ x: left0 + pw * c + pw / 2, y: top0 + ph * r + ph / 2 });

    // Tray spots on the right, in a shuffled order.
    const n = cols * rows;
    const trayGap = 12;
    const tx0 = 915 - ((cols - 1) * (pw + trayGap)) / 2;
    const ty0 = 440 - ((rows - 1) * (ph + trayGap)) / 2;
    const tray = shuffle(Array.from({ length: n }, (_, i) => ({ x: tx0 + (i % cols) * (pw + trayGap), y: ty0 + Math.floor(i / cols) * (ph + trayGap) })));
    const turned = new Set(L === 5 ? shuffle([...Array(n).keys()]).slice(0, 4) : []);

    return new Promise((resolve) => {
      let placed = 0;
      let wrong = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          let rot = turned.has(i) ? pick([90, 180, 270]) : 0;
          const vx = (c * VW) / cols;
          const vy = (r * VH) / rows;
          const face = h('div', { class: 'pz-face', style: { transform: `rotate(${rot}deg)` }, html: `<svg viewBox="${vx} ${vy} ${VW / cols} ${VH / rows}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${art}</svg>` });
          const piece = h('div', { class: 'pz-piece pop-in', style: { width: pw + 'px', height: ph + 'px', animationDelay: i * 50 + 'ms' } }, face);
          ctx.area.append(piece);
          placeAt(piece, tray[i].x, tray[i].y);
          const home = slotAt(c, r);
          draggable(piece, {
            onTap() {
              if (!turned.has(i)) return;
              sfx.pop();
              rot = (rot + 90) % 360;
              face.style.transform = `rotate(${rot}deg)`;
            },
            onDrop(p) {
              const fit = Math.abs(p.x - home.x) < pw * 0.42 && Math.abs(p.y - home.y) < ph * 0.42;
              const inFrame = p.x > left0 && p.x < left0 + FW && p.y > top0 && p.y < top0 + FH;
              if (fit && rot === 0) {
                piece.dataset.locked = '1';
                piece.classList.add('placed');
                placeAt(piece, home.x, home.y);
                // The piece stays where it now sits if it is ever sent "home".
                piece.dataset.homeLeft = piece.offsetLeft;
                piece.dataset.homeTop = piece.offsetTop;
                sfx.ting();
                placed++;
                if (placed >= n) finish();
                return true;
              }
              if (inFrame) {
                sfx.boop();
                anim(piece, 'wiggle', 500);
                wrong++;
                if (wrong >= 2) ctx.miss();
                if (fit) ctx.say('Tap it to turn it around!');
                else if (wrong === 1) ctx.say('Not there. Look at the picture!');
              }
              return false;
            },
          });
        }
      }
      const finish = async () => {
        frame.classList.add('done');
        anim(frame, 'pop', 600);
        await sleep(300);
        await ctx.yes(`The ${sc.word}`, { x: FX, y: FY });
        resolve();
      };
      ctx.prompt(L === 5 ? 'Put the puzzle together! Tap a piece to turn it.' : 'Put the puzzle together!');
    });
  },
};

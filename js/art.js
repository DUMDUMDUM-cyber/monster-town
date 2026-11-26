// All drawings in Monster Land are made here as SVG code (no image files).
// Style: "storybook" (DESAIN.md section 11). Thin coloured lines (a darker shade of each
// fill), soft top-to-bottom gradients, and on still scenery a hand-drawn wobble. Paper grain
// and the warm vignette are in CSS (.bg-paper). Gradients, clips and filters are made once
// in one hidden <svg> and shared by every drawing.
export const INK = '#3B2F4A'; // text colour

// ---------------------------------------------------------------- colour helpers
const toRGB = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
export function shade(hex, f = 0.78) {
  const [r, g, b] = toRGB(hex);
  return toHex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}
export function mix(a, b, t) {
  const A = toRGB(a);
  const B = toRGB(b);
  return toHex(...A.map((v, i) => Math.round(v + (B[i] - v) * t)));
}
const tint = (c, t = 0.3) => mix(c, '#FFFFFF', t);
const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c);
// The thin line round a shape: a darker, slightly warmer shade of its own fill.
export const lineOf = (c) => (isHex(c) ? mix(shade(c, 0.62), '#5A3E22', 0.18) : '#8A6A4A');

// ---------------------------------------------------------------- shared defs
let defsEl = null;
const made = new Set();
function defsRoot() {
  if (!defsEl) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML = '<defs></defs>';
    document.body.prepend(svg);
    defsEl = svg.firstChild;
  }
  return defsEl;
}
function def(id, markup) {
  if (!made.has(id)) {
    made.add(id);
    defsRoot().insertAdjacentHTML('beforeend', markup);
  }
  return `url(#${id})`;
}
const stops = (list) => list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, list, at = 'x1="0" y1="0" x2="0" y2="1"') => def(id, `<linearGradient id="${id}" ${at}>${stops(list)}</linearGradient>`);
const rad = (id, list, at = '') => def(id, `<radialGradient id="${id}" ${at}>${stops(list)}</radialGradient>`);
const softStops = (c) => [[0, tint(c, 0.34)], [0.55, c], [1, shade(c, 0.87)]];
// Soft top-to-bottom gradient for one shape of colour c.
export const grad = (c) => (isHex(c) ? lin(`mlg${c.slice(1)}`, softStops(c)) : c);
// Same, but in picture space (0-100) so a group of circles shares one gradient.
const gradU = (c) => lin(`mlu${c.slice(1)}`, softStops(c), 'gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="94"');
const blush = () => rad('ml-blush', [[0, '#FF8FA3', 0.85], [1, '#FF8FA3', 0]]);
const rough = () => def('ml-rough', '<filter id="ml-rough" x="-2%" y="-4%" width="104%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>');

// fill + thin coloured line, and a plain coloured line
const P = (c, w = 2.2) => `fill="${grad(c)}" stroke="${lineOf(c)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const L = (c, w = 2.2) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// ---------------------------------------------------------------- characters
export const CHARS = {
  moko: { name: 'Moko', color: '#2EC4B6', tint: '#D6F6F2', dark: '#0B7A70' },
  gumi: { name: 'Gumi', color: '#A06CF0', tint: '#EEE4FF', dark: '#6A3FC0' },
  tobi: { name: 'Tobi', color: '#FF9542', tint: '#FFE9D6', dark: '#B34E0C' },
};
const PUPIL = '#2B2240';
const MOUTH = '#6A2645';

function eyes(Le, Ri, r, pd, pr, sleep, ln) {
  if (sleep) {
    return `<path d="M${Le[0] - r + 3} ${Le[1]} Q${Le[0]} ${Le[1] + 11} ${Le[0] + r - 3} ${Le[1]} M${Ri[0] - r + 3} ${Ri[1]} Q${Ri[0]} ${Ri[1] + 11} ${Ri[0] + r - 3} ${Ri[1]}" ${L(ln, 4.5)}/>`;
  }
  const a = [Le[0] + pd[0], Le[1] + pd[1]];
  const b = [Ri[0] - pd[0], Ri[1] + pd[1]];
  const white = `fill="#FFFFFF" stroke="${ln}" stroke-width="2.6"`;
  const dot = (p, dx, dy, k) => `<circle cx="${(p[0] + pr * dx).toFixed(1)}" cy="${(p[1] + pr * dy).toFixed(1)}" r="${(pr * k).toFixed(1)}" fill="#fff"/>`;
  return `<g class="eyes" style="transform-origin:100px ${Le[1]}px">`
    + `<circle cx="${Le[0]}" cy="${Le[1]}" r="${r}" ${white}/><circle cx="${Ri[0]}" cy="${Ri[1]}" r="${r}" ${white}/>`
    + `<circle cx="${a[0]}" cy="${a[1]}" r="${pr}" fill="${PUPIL}"/><circle cx="${b[0]}" cy="${b[1]}" r="${pr}" fill="${PUPIL}"/>`
    + dot(a, 0.4, -0.45, 0.42) + dot(b, 0.4, -0.45, 0.42) + dot(a, -0.35, 0.45, 0.18) + dot(b, -0.35, 0.45, 0.18) + '</g>';
}
const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="10" fill="${blush()}"/>`;

// ---------------------------------------------------------------- the rig
// Each character is built from parts that can move on their own (CSS in style.css,
// activities in acts.js). Every part turns round its own pivot:
//   .c-go     whole character incl. shadow: running in / out, running about
//   .c-move   the idle signature move (hop / jelly / bunny)
//   .c-act    the body during an activity: squash, stretch, jump, flip, roll
//   .leg-l/.leg-r (pivot: hip), .arm-l/.arm-r (pivot: shoulder)
//   .c-head   the round head-body, with .ear-l/.ear-r, .horn (horn or tuft), .look (eyes), .mouth
// Attachment points for clothes and toys (Paket 2): empty groups already moved to the right
// spot, so an item drawn round (0, 0) and put inside rides along with that body part.
//   .att-head (top of head), .att-eyes (between the eyes), .att-neck (under the chin),
//   .att-back (behind the body), .att-hand-l/-r (in the hand), .att-foot-l/-r (on the foot).
export const ANCHOR = {
  moko: {
    head: [100, 50], eyes: [100, 102], nose: [100, 122], neck: [100, 162], back: [100, 130],
    shoulderL: [44, 122], shoulderR: [156, 122], handL: [23, 161], handR: [177, 161],
    hipL: [81, 186], hipR: [119, 186], footL: [78, 224], footR: [122, 224], earL: [62, 78], earR: [138, 78],
  },
  gumi: {
    head: [100, 46], eyes: [100, 106], nose: [100, 128], neck: [100, 164], back: [100, 140],
    shoulderL: [46, 130], shoulderR: [154, 130], handL: [26, 163], handR: [174, 163],
    hipL: [82, 190], hipR: [118, 190], footL: [80, 222], footR: [120, 222], earL: [64, 80], earR: [136, 80],
  },
  tobi: {
    head: [100, 54], eyes: [100, 104], nose: [100, 126], neck: [100, 158], back: [100, 140],
    shoulderL: [49, 126], shoulderR: [151, 126], handL: [31, 164], handR: [169, 164],
    hipL: [82, 188], hipR: [118, 188], footL: [80, 222], footR: [120, 222], earL: [78, 74], earR: [122, 74],
  },
};
const att = (name, [x, y]) => `<g class="att att-${name}" transform="translate(${x} ${y})"></g>`;
const part = (cls, [x, y], inner) => `<g class="${cls}" style="transform-origin:${x}px ${y}px">${inner}</g>`;
const headOpen = '<g class="c-head" style="transform-origin:100px 200px">';
const headClose = (A) => `${att('eyes', A.eyes)}${att('neck', A.neck)}${att('head', A.head)}</g>`;

// Shapes and sizes match BODY below (touch areas), so keep them in step.
const BUILD = {
  moko: (sleep) => {
    const A = ANCHOR.moko;
    const ln = '#137A71';
    const st = `stroke="${ln}" stroke-width="3" stroke-linejoin="round"`;
    const fur = `fill="${grad('#2EC4B6')}" ${st}`;
    const leg = `fill="${grad('#1FA396')}" ${st}`;
    return `${att('back', A.back)}
${part('leg-l', A.hipL, `<rect x="70" y="182" width="22" height="40" rx="11" ${leg}/><ellipse cx="78" cy="224" rx="21" ry="11" ${fur}/>${att('foot-l', A.footL)}`)}
${part('leg-r', A.hipR, `<rect x="108" y="182" width="22" height="40" rx="11" ${leg}/><ellipse cx="122" cy="224" rx="21" ry="11" ${fur}/>${att('foot-r', A.footR)}`)}
${part('arm-l', A.shoulderL, `<ellipse cx="34" cy="140" rx="14" ry="24" ${fur} transform="rotate(28 34 140)"/>${att('hand-l', A.handL)}`)}
${part('arm-r', A.shoulderR, `<ellipse cx="166" cy="140" rx="14" ry="24" ${fur} transform="rotate(-28 166 140)"/>${att('hand-r', A.handR)}`)}
${headOpen}
${part('ear-l', A.earL, `<circle cx="50" cy="66" r="20" ${fur}/><circle cx="47" cy="62" r="9" fill="#FFAFC2"/>`)}
${part('ear-r', A.earR, `<circle cx="150" cy="66" r="20" ${fur}/><circle cx="153" cy="62" r="9" fill="#FFAFC2"/>`)}
${part('horn', [100, 46], `<path d="M90 46 L100 14 L110 46 Z" fill="${grad('#FFD57A')}" stroke="#C99630" stroke-width="3" stroke-linejoin="round"/>`)}
<circle cx="100" cy="124" r="74" ${fur}/>
<ellipse cx="100" cy="160" rx="44" ry="32" fill="${grad('#CFF7F1')}"/>
<path d="M40 118 Q44 88 68 70" ${L('#FFFFFF', 5)} opacity=".45"/>
<circle cx="146" cy="96" r="4" fill="#7FE3D8" opacity=".7"/><circle cx="156" cy="112" r="3" fill="#7FE3D8" opacity=".7"/><circle cx="58" cy="168" r="3.5" fill="#25AFA2" opacity=".6"/>
<path d="M66 60 Q70 44 80 54 M120 54 Q130 44 134 60" ${L(ln, 4)}/>
${part('look', A.eyes, eyes([76, 102], [124, 102], 18, [2, 3], 9, sleep, ln))}
<ellipse cx="100" cy="122" rx="7" ry="5" fill="${PUPIL}"/>
<g class="mouth"><path d="M82 132 Q100 154 118 132 Q100 138 82 132 Z" fill="${MOUTH}" stroke="${MOUTH}" stroke-width="2" stroke-linejoin="round"/><rect x="95" y="134" width="10" height="7" rx="2" fill="#fff"/></g>
${cheek(56, 130)}${cheek(144, 130)}
${headClose(A)}`;
  },
  gumi: (sleep) => {
    const A = ANCHOR.gumi;
    const ln = '#6A44B0';
    const st = `stroke="${ln}" stroke-width="3" stroke-linejoin="round"`;
    const fur = `fill="${grad('#A06CF0')}" ${st}`;
    const leg = `fill="${grad('#7F4FD1')}" ${st}`;
    return `${att('back', A.back)}
${part('leg-l', A.hipL, `<rect x="72" y="186" width="20" height="34" rx="10" ${leg}/><ellipse cx="80" cy="222" rx="20" ry="10" ${fur}/>${att('foot-l', A.footL)}`)}
${part('leg-r', A.hipR, `<rect x="108" y="186" width="20" height="34" rx="10" ${leg}/><ellipse cx="120" cy="222" rx="20" ry="10" ${fur}/>${att('foot-r', A.footR)}`)}
${part('arm-l', A.shoulderL, `<ellipse cx="36" cy="146" rx="12" ry="20" ${fur} transform="rotate(30 36 146)"/>${att('hand-l', A.handL)}`)}
${part('arm-r', A.shoulderR, `<ellipse cx="164" cy="146" rx="12" ry="20" ${fur} transform="rotate(-30 164 146)"/>${att('hand-r', A.handR)}`)}
${headOpen}
${part('ear-l', A.earL, `<circle cx="54" cy="70" r="15" ${fur}/><circle cx="51" cy="66" r="6" fill="#FFAFC2"/>`)}
${part('ear-r', A.earR, `<circle cx="146" cy="70" r="15" ${fur}/><circle cx="149" cy="66" r="6" fill="#FFAFC2"/>`)}
<path d="M100 46 C150 46 172 96 172 150 C172 176 166 196 150 200 C140 203 134 194 124 200 C114 206 108 196 100 200 C92 206 86 196 76 200 C66 206 60 194 50 200 C34 196 28 176 28 150 C28 96 50 46 100 46 Z" ${fur}/>
<ellipse cx="100" cy="162" rx="46" ry="30" fill="${grad('#E6DAFF')}"/>
<ellipse cx="60" cy="98" rx="8" ry="16" fill="#fff" opacity=".4" transform="rotate(25 60 98)"/>
<circle cx="142" cy="90" r="5" fill="#C4A6F7" opacity=".75"/><circle cx="152" cy="106" r="3.5" fill="#C4A6F7" opacity=".75"/><circle cx="48" cy="172" r="4" fill="#8A5ADB" opacity=".5"/>
${part('horn', [100, 46], `<path d="M100 46 C95 30 112 22 116 34" ${L(ln, 4)}/>`)}
${part('look', A.eyes, eyes([78, 106], [122, 106], 20, [2, 4], 10, sleep, ln))}
<ellipse cx="100" cy="128" rx="5" ry="4" fill="${PUPIL}"/>
<g class="mouth"><path d="M86 138 Q100 156 114 138 Z" fill="${MOUTH}" stroke="${MOUTH}" stroke-width="2" stroke-linejoin="round"/><rect x="95" y="139" width="10" height="7" rx="2" fill="#fff"/></g>
${cheek(56, 134)}${cheek(144, 134)}
${headClose(A)}`;
  },
  tobi: (sleep) => {
    const A = ANCHOR.tobi;
    const ln = '#B8601E';
    const st = `stroke="${ln}" stroke-width="3" stroke-linejoin="round"`;
    const fur = `fill="${grad('#FF9542')}" ${st}`;
    const leg = `fill="${grad('#E8742A')}" ${st}`;
    return `${att('back', A.back)}
${part('leg-l', A.hipL, `<rect x="72" y="184" width="20" height="36" rx="10" ${leg}/><ellipse cx="80" cy="222" rx="20" ry="10" ${fur}/>${att('foot-l', A.footL)}`)}
${part('leg-r', A.hipR, `<rect x="108" y="184" width="20" height="36" rx="10" ${leg}/><ellipse cx="120" cy="222" rx="20" ry="10" ${fur}/>${att('foot-r', A.footR)}`)}
${part('arm-l', A.shoulderL, `<ellipse cx="40" cy="144" rx="12" ry="22" ${fur} transform="rotate(25 40 144)"/>${att('hand-l', A.handL)}`)}
${part('arm-r', A.shoulderR, `<ellipse cx="160" cy="144" rx="12" ry="22" ${fur} transform="rotate(-25 160 144)"/>${att('hand-r', A.handR)}`)}
${headOpen}
${part('ear-l', A.earL, `<ellipse cx="66" cy="42" rx="15" ry="40" ${fur} transform="rotate(-20 66 42)"/><ellipse cx="64" cy="36" rx="7" ry="27" fill="${grad('#FFB8C6')}" transform="rotate(-20 64 36)"/>`)}
${part('ear-r', A.earR, `<ellipse cx="134" cy="42" rx="15" ry="40" ${fur} transform="rotate(20 134 42)"/><ellipse cx="136" cy="36" rx="7" ry="27" fill="${grad('#FFB8C6')}" transform="rotate(20 136 36)"/>`)}
<path d="M100 52 C60 52 42 96 44 140 C46 184 68 206 100 206 C132 206 154 184 156 140 C158 96 140 52 100 52 Z" ${fur}/>
<ellipse cx="100" cy="162" rx="40" ry="32" fill="${grad('#FFE8C8')}"/>
<path d="M56 120 Q58 88 80 68" ${L('#FFFFFF', 5)} opacity=".42"/>
<circle cx="140" cy="92" r="4" fill="#FFB877" opacity=".8"/><circle cx="148" cy="106" r="3" fill="#FFB877" opacity=".8"/>
${part('horn', [100, 54], `<path d="M92 54 L95 40 M100 52 L100 36 M108 54 L105 40" ${L(ln, 4)}/>`)}
${part('look', A.eyes, eyes([78, 104], [122, 104], 20, [0, 4], 10, sleep, ln))}
<ellipse cx="100" cy="126" rx="7" ry="5" fill="${PUPIL}"/>
<g class="mouth"><path d="M86 134 Q100 146 114 134" ${L(MOUTH, 4)}/><rect x="93" y="139" width="7" height="8" rx="1.5" fill="#fff" stroke="${ln}" stroke-width="2"/><rect x="100" y="139" width="7" height="8" rx="1.5" fill="#fff" stroke="${ln}" stroke-width="2"/></g>
${cheek(58, 130)}${cheek(142, 130)}
${headClose(A)}`;
  },
};

// Moving parts (CSS in style.css): .c-move (hop / jelly / bunny), .c-breathe, .eyes (blink),
// .arm-r (wave), .arm-l + .arm-r (cheer), .ear-l/.ear-r, .mouth (talk), and the activity parts
// listed under "the rig" above. Props for activities go into .c-prop-b (rides the body) and
// .c-prop-g (on the ground), or into an .att-hand group.
// dress: accessories to put on, as markup per attachment point (see acc.js dress()).
const ATT_OF = { head: 'head', eyes: 'eyes', neck: 'neck', back: 'back', footL: 'foot-l', footR: 'foot-r', handL: 'hand-l', handR: 'hand-r' };
export function charSVG(who, { sleep = false, dress = null } = {}) {
  let body = BUILD[who](sleep);
  if (dress) {
    for (const [at, markup] of Object.entries(dress)) {
      body = body.replace(new RegExp(`(<g class="att att-${ATT_OF[at]}"[^>]*>)`), `$1${markup}`);
    }
  }
  return `<svg class="char-svg cs-${who}${sleep ? ' sleeping' : ''}" viewBox="0 0 200 240" width="100%" height="100%" role="img" aria-label="${CHARS[who].name}">`
    + '<g class="c-go" style="transform-origin:100px 232px"><ellipse class="c-shadow" cx="100" cy="233" rx="62" ry="7" fill="#3B2A1A" opacity=".16" style="transform-origin:100px 233px"/>'
    + `<g class="c-move"><g class="c-act"><g class="c-breathe">${body}</g><g class="c-prop-b"></g></g></g><g class="c-prop-g"></g></g></svg>`;
}

// ---------------------------------------------------------------- activity props
// Small toys drawn in the same style, for acts.js. Returns markup per slot:
// hand (inside .att-hand-r, drawn round the hand), body (.c-prop-b), ground (.c-prop-g).
const rot = ([x, y], [cx, cy], deg) => {
  const a = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)].map((v) => +v.toFixed(1));
};
const o = (x, y) => `style="transform-origin:${x}px ${y}px"`;
export function propParts(name, who) {
  const A = ANCHOR[who];
  const H = A.handR;
  if (name === 'kick') {
    const x = A.footR[0] + 44;
    const y = 216;
    return { ground: `<g class="p-ball"><g class="p-spin" ${o(x, y)}><circle cx="${x}" cy="${y}" r="15" ${P('#EF476F', 2.4)}/><path d="M${x - 14} ${y - 4} Q${x} ${y + 4} ${x + 14} ${y - 4} L${x + 14} ${y + 3} Q${x} ${y + 11} ${x - 14} ${y + 3} Z" fill="#FFF8EE" stroke="${lineOf('#EF476F')}" stroke-width="1.6"/>${shine(x - 6, y - 7, 4, 2.4, -30, 0.6)}</g></g>` };
  }
  if (name === 'yoyo') {
    return { hand: `<line class="p-str" x1="0" y1="0" x2="0" y2="62" stroke="#8A6A4A" stroke-width="1.8" stroke-linecap="round" style="transform-origin:0 0"/><g class="p-yo"><circle r="10" ${P('#3A86FF', 2.4)}/><circle r="3.5" fill="#FFF8EE" stroke="${lineOf('#3A86FF')}" stroke-width="1.4"/></g>` };
  }
  if (name === 'bubbles') {
    const [x, y] = rot([H[0] + 11, H[1] - 47], A.shoulderR, -20);
    const bub = [[7, '-30px', 0], [5, '18px', 0.35], [9, '-8px', 0.7], [6, '26px', 1.05], [8, '-22px', 1.4]]
      .map(([r, bx, d]) => `<circle class="p-bub" cx="${x}" cy="${y}" r="${r}" fill="#EAF6FF" fill-opacity=".45" stroke="#8EC3EE" stroke-width="1.6" style="transform-origin:${x}px ${y}px; --bx:${bx}; animation-delay:${d}s"/>`).join('');
    return {
      hand: `<path d="M0 0 L10 -40" ${L('#B07445', 3.4)}/><circle cx="11" cy="-47" r="7" fill="none" stroke="#FF8FB1" stroke-width="2.8"/>`,
      body: bub,
    };
  }
  if (name === 'water') {
    const [x, y] = rot([H[0] + 35, H[1] + 26], A.shoulderR, -25);
    const fx = x + 4;
    const fall = 200 - y;
    const drops = [0, 0.2, 0.4].map((d, i) => `<ellipse class="p-drop" cx="${x + i * 2 - 2}" cy="${y}" rx="2.2" ry="3.4" fill="#7CC8F0" style="--fall:${fall}px; animation-delay:${d}s"/>`).join('');
    const petals = [0, 72, 144, 216, 288].map((a) => { const r = ((a - 90) * Math.PI) / 180; return `<circle cx="${(fx + Math.cos(r) * 7).toFixed(1)}" cy="${(202 + Math.sin(r) * 7).toFixed(1)}" r="6" ${P('#FF8FB1', 1.6)}/>`; }).join('');
    return {
      hand: `<path d="M-4 8 Q5 -6 14 8" ${L('#3D86B8', 3)}/><path d="M18 12 L34 24" ${L('#3D86B8', 6)}/><path d="M18 12 L34 24" ${L('#5BB6E8', 3)}/><rect x="-8" y="6" width="26" height="20" rx="5" ${P('#5BB6E8', 2.2)}/><circle cx="35" cy="25" r="3.5" ${P('#5BB6E8', 1.6)}/>`,
      body: drops,
      ground: `<g class="p-flw" ${o(fx, 230)}><path d="M${fx} 230 V204" ${L('#4E8F3E', 3)}/><ellipse cx="${fx + 6}" cy="220" rx="6" ry="3" ${P('#7CC46A', 1.4)} transform="rotate(-25 ${fx + 6} 220)"/>${petals}<circle cx="${fx}" cy="202" r="4.5" ${P('#FFCF4D', 1.4)}/></g>`,
    };
  }
  if (name === 'surprised') {
    return { body: `<g class="p-bang" ${o(162, 44)}><rect x="156" y="8" width="12" height="26" rx="6" ${P('#FFD166', 2)}/><circle cx="162" cy="43" r="6" ${P('#FFD166', 2)}/></g>` };
  }
  if (name === 'sneeze') {
    const [x, y] = A.nose;
    return { body: [[-30, -8, 7], [0, -26, 6], [30, -8, 8], [-18, 14, 5], [22, 14, 5]].map(([px, py, r]) => `<circle class="p-puff" cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" fill-opacity=".85" stroke="#CFC6BB" stroke-width="1.4" style="transform-origin:${x}px ${y}px; --px:${px}px; --py:${py}px"/>`).join('') };
  }
  if (name === 'doze') {
    return { body: [0, 0.8, 1.6].map((d, i) => `<text class="p-z" x="${146 + i * 6}" y="${46 - i * 4}" font-size="${22 + i * 4}" font-weight="700" fill="#7A6A9A" style="animation-delay:${d}s">z</text>`).join('') };
  }
  return {};
}

// Touch areas on each character (in the 200 x 240 drawing), for "Touch my nose!".
// Each entry: parts it answers to, and ellipses [cx, cy, rx, ry].
export const BODY = {
  moko: [
    { parts: ['hair'], at: [[100, 44, 42, 20]] },
    { parts: ['ears'], at: [[50, 66, 24, 24], [150, 66, 24, 24]] },
    { parts: ['eyes'], at: [[76, 102, 21, 21], [124, 102, 21, 21]] },
    { parts: ['nose'], at: [[100, 122, 13, 10]] },
    { parts: ['mouth', 'teeth'], at: [[100, 140, 22, 13]] },
    { parts: ['tummy'], at: [[100, 170, 42, 20]] },
    { parts: ['hands'], at: [[28, 148, 24, 26], [172, 148, 24, 26]] },
    { parts: ['knees'], at: [[81, 199, 15, 12], [119, 199, 15, 12]] },
    { parts: ['feet'], at: [[78, 226, 24, 13], [122, 226, 24, 13]] },
  ],
  gumi: [
    { parts: ['hair'], at: [[108, 34, 24, 18]] },
    { parts: ['ears'], at: [[54, 70, 19, 19], [146, 70, 19, 19]] },
    { parts: ['eyes'], at: [[78, 106, 22, 22], [122, 106, 22, 22]] },
    { parts: ['nose'], at: [[100, 128, 12, 9]] },
    { parts: ['mouth', 'teeth'], at: [[100, 146, 20, 12]] },
    { parts: ['tummy'], at: [[100, 174, 42, 18]] },
    { parts: ['hands'], at: [[32, 150, 22, 24], [168, 150, 22, 24]] },
    { parts: ['knees'], at: [[82, 206, 14, 9], [118, 206, 14, 9]] },
    { parts: ['feet'], at: [[80, 224, 24, 12], [120, 224, 24, 12]] },
  ],
  tobi: [
    { parts: ['hair'], at: [[100, 44, 22, 14]] },
    { parts: ['ears'], at: [[58, 26, 17, 30], [142, 26, 17, 30]] },
    { parts: ['eyes'], at: [[78, 104, 22, 22], [122, 104, 22, 22]] },
    { parts: ['nose'], at: [[100, 126, 12, 9]] },
    { parts: ['mouth', 'teeth'], at: [[100, 141, 19, 11]] },
    { parts: ['tummy'], at: [[100, 172, 40, 20]] },
    { parts: ['hands'], at: [[36, 148, 22, 26], [164, 148, 22, 26]] },
    { parts: ['knees'], at: [[82, 200, 14, 11], [118, 200, 14, 11]] },
    { parts: ['feet'], at: [[80, 224, 24, 12], [120, 224, 24, 12]] },
  ],
};

// Which body part (if any) is at point (x, y) in drawing coordinates.
export function bodyPartAt(who, x, y) {
  let best = null;
  let bestD = 1.35;
  for (const region of BODY[who]) {
    for (const [cx, cy, rx, ry] of region.at) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d < bestD) {
        bestD = d;
        best = region;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------- pictures (100 x 100)
const DK = '#3A2C3F';
const eye = (x, y, r = 4.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${DK}"/><circle cx="${(x + r * 0.35).toFixed(1)}" cy="${(y - r * 0.38).toFixed(1)}" r="${(r * 0.36).toFixed(1)}" fill="#fff"/>`;
const shine = (x, y, rx, ry, rot = 20, o = 0.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;
const leaf = (x, y, rot = -25) => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="9" ry="5" ${P('#7CC46A', 1.8)}/><path d="M${x - 6} ${y} H${x + 6}" ${L('#4E8F3E', 1.2)}/></g>`;
const cheeks = (y, l = 32, r = 68) => `<ellipse cx="${l}" cy="${y}" rx="7" ry="5" fill="${blush()}"/><ellipse cx="${r}" cy="${y}" rx="7" ry="5" fill="${blush()}"/>`;
const wheel = (x, y, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${grad('#4A4458')}" stroke="#2E2A38" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#D5D8E2"/>`;

// A group of circles drawn as one soft shape: outline underneath, fills on top.
function fluffy(circles, c, w = 2.2) {
  const f = gradU(c);
  const s = lineOf(c);
  return circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${s}" stroke="${s}" stroke-width="${w * 2}"/>`).join('')
    + circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`).join('');
}

const PIC = {
  dog: () => `<ellipse cx="22" cy="48" rx="11" ry="20" ${P('#9A6233')} transform="rotate(18 22 48)"/><ellipse cx="78" cy="48" rx="11" ry="20" ${P('#9A6233')} transform="rotate(-18 78 48)"/><circle cx="50" cy="52" r="30" ${P('#E0A96D')}/><ellipse cx="61" cy="45" rx="10" ry="9" fill="#C98A50" opacity=".55"/><ellipse cx="50" cy="66" rx="16" ry="12" fill="${grad('#F8E4C4')}"/>${shine(33, 38, 4, 7, 30, 0.4)}${eye(39, 47)}${eye(61, 47)}<ellipse cx="50" cy="60" rx="6.5" ry="4.5" fill="${DK}"/><path d="M50 64 V69 M43 70 Q50 76 57 70" ${L(DK, 2.4)}/>${cheeks(64, 30, 70)}`,
  cat: () => `<path d="M24 46 L26 14 L48 30 Z" ${P('#F4A259')}/><path d="M76 46 L74 14 L52 30 Z" ${P('#F4A259')}/><path d="M30 36 L31 22 L41 30 Z" fill="#FFB8C6"/><path d="M70 36 L69 22 L59 30 Z" fill="#FFB8C6"/><circle cx="50" cy="56" r="29" ${P('#F4A259')}/><path d="M50 29 V37 M43 31 L45 37 M57 31 L55 37" ${L('#C9772F', 2.6)}/><ellipse cx="50" cy="69" rx="13" ry="8" fill="#FFE3C4" opacity=".8"/>${shine(33, 45, 4, 7, 30, 0.35)}<ellipse cx="39" cy="52" rx="4" ry="5.5" fill="${DK}"/><ellipse cx="61" cy="52" rx="4" ry="5.5" fill="${DK}"/><circle cx="40.3" cy="50" r="1.5" fill="#fff"/><circle cx="62.3" cy="50" r="1.5" fill="#fff"/><path d="M45.5 62 H54.5 L50 66.5 Z" fill="#FF8FA3" stroke="#C9606F" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 66.5 Q46 72 42 69 M50 66.5 Q54 72 58 69" ${L(DK, 2)}/><path d="M28 62 H15 M28 67 L16 71 M72 62 H85 M72 67 L84 71" ${L('#A86A3A', 1.6)}/>`,
  cow: () => `<path d="M32 28 Q22 18 28 10 Q32 20 40 24 Z" ${P('#FFF0CF', 2)}/><path d="M68 28 Q78 18 72 10 Q68 20 60 24 Z" ${P('#FFF0CF', 2)}/><ellipse cx="17" cy="42" rx="12" ry="7" ${P('#FFFFFF')} transform="rotate(-20 17 42)"/><ellipse cx="83" cy="42" rx="12" ry="7" ${P('#FFFFFF')} transform="rotate(20 83 42)"/><ellipse cx="18" cy="42" rx="6" ry="3" fill="#FFC2CE" transform="rotate(-20 18 42)"/><ellipse cx="82" cy="42" rx="6" ry="3" fill="#FFC2CE" transform="rotate(20 82 42)"/><rect x="22" y="22" width="56" height="64" rx="26" ${P('#FFFFFF')}/><path d="M27 40 Q30 28 42 31 Q45 43 33 48 Q27 48 27 40 Z" fill="#4A3B47"/><path d="M64 26 Q74 26 75 36 Q68 38 63 32 Z" fill="#4A3B47"/><ellipse cx="50" cy="72" rx="22" ry="14" ${P('#FFB3C1')}/>${eye(40, 52)}${eye(60, 52)}<ellipse cx="42" cy="72" rx="3" ry="4" fill="#8C3F5A"/><ellipse cx="58" cy="72" rx="3" ry="4" fill="#8C3F5A"/>`,
  fish: (c = '#FF9542') => `<path d="M32 32 Q46 6 64 30 Z" ${P(shade(c, 0.86))}/><path d="M70 50 L94 30 Q88 50 94 70 Z" ${P(shade(c, 0.86))}/><ellipse cx="46" cy="50" rx="34" ry="24" ${P(c)}/><path d="M48 36 Q56 50 48 64 M60 38 Q67 50 60 62" ${L(lineOf(c), 2.4)} opacity=".6"/>${shine(32, 38, 9, 4, -18, 0.45)}<circle cx="27" cy="45" r="6.5" fill="#fff" stroke="${lineOf(c)}" stroke-width="1.8"/><circle cx="26" cy="45.5" r="3.4" fill="${DK}"/><circle cx="27.2" cy="44" r="1.2" fill="#fff"/><path d="M15 57 Q21 61 27 58" ${L(DK, 2.2)}/><ellipse cx="34" cy="58" rx="5" ry="3.5" fill="${blush()}"/>`,
  bird: (c = '#3A86FF') => `<path d="M74 52 L94 40 L92 64 Z" ${P(shade(c, 0.86))}/><path d="M42 80 V92 M56 80 V92 M37 92 H47 M51 92 H61" ${L('#D9822B', 3)}/><circle cx="50" cy="54" r="28" ${P(c)}/><ellipse cx="44" cy="66" rx="14" ry="10" fill="#fff" opacity=".3"/><path d="M48 58 Q62 50 74 60 Q62 74 48 64 Z" ${P(shade(c, 0.86))}/><path d="M24 48 L8 54 L24 60 Z" ${P('#FFA94D', 1.8)}/>${shine(42, 36, 6, 3.5, -25, 0.45)}${eye(37, 46)}<ellipse cx="34" cy="62" rx="6" ry="4" fill="${blush()}"/>`,
  duck: () => `<path d="M80 56 L95 46 L91 64 Z" ${P('#FFD166')}/><ellipse cx="56" cy="66" rx="32" ry="22" ${P('#FFD166')}/><circle cx="34" cy="40" r="18" ${P('#FFD166')}/><path d="M18 40 Q3 42 8 49 Q14 53 22 48 Z" ${P('#FF9F45', 1.8)}/><path d="M50 60 Q64 50 78 62 Q64 76 50 66 Z" ${P('#F5BC3A', 1.8)}/>${shine(28, 30, 5, 3, -30, 0.5)}${eye(32, 36)}<ellipse cx="28" cy="47" rx="5" ry="3.5" fill="${blush()}"/>`,
  pig: () => `<path d="M24 36 L26 14 L44 26 Z" ${P('#F48FB1')}/><path d="M76 36 L74 14 L56 26 Z" ${P('#F48FB1')}/><circle cx="50" cy="54" r="30" ${P('#FFB8C6')}/><ellipse cx="50" cy="64" rx="14" ry="10" ${P('#F48FB1', 1.8)}/>${shine(34, 40, 4, 7, 30, 0.4)}<ellipse cx="45" cy="64" rx="2.6" ry="3.6" fill="#8C3F5A"/><ellipse cx="55" cy="64" rx="2.6" ry="3.6" fill="#8C3F5A"/>${eye(38, 46)}${eye(62, 46)}<path d="M42 78 Q50 82 58 78" ${L(DK, 2.4)}/>${cheeks(58, 28, 72)}`,
  rabbit: () => `<ellipse cx="38" cy="26" rx="9" ry="22" ${P('#F6F2FA')} transform="rotate(-8 38 26)"/><ellipse cx="62" cy="26" rx="9" ry="22" ${P('#F6F2FA')} transform="rotate(8 62 26)"/><ellipse cx="38" cy="26" rx="4" ry="14" fill="#FFB8C6" transform="rotate(-8 38 26)"/><ellipse cx="62" cy="26" rx="4" ry="14" fill="#FFB8C6" transform="rotate(8 62 26)"/><circle cx="50" cy="62" r="26" ${P('#F6F2FA')}/>${eye(40, 56)}${eye(60, 56)}<path d="M46 66 H54 L50 70 Z" fill="#FF8FA3" stroke="#C9606F" stroke-width="1.5" stroke-linejoin="round"/><rect x="46" y="72" width="8" height="8" rx="1.5" fill="#fff" stroke="#B9AFC4" stroke-width="1.5"/>${cheeks(68, 34, 66)}`,
  horse: () => `<path d="M32 30 L33 8 L46 22 Z" ${P('#B07445')}/><path d="M68 30 L67 8 L54 22 Z" ${P('#B07445')}/><ellipse cx="50" cy="52" rx="23" ry="34" ${P('#B07445')}/><path d="M50 36 Q45 52 50 66 Q55 52 50 36 Z" fill="#F3E2CF" opacity=".9"/><ellipse cx="50" cy="78" rx="18" ry="13" ${P('#E3B48A', 1.8)}/><path d="M40 22 Q50 6 60 22 Q56 34 50 30 Q44 34 40 22 Z" ${P('#5A3A22', 1.8)}/>${shine(35, 44, 3.5, 8, 15, 0.3)}${eye(39, 48)}${eye(61, 48)}<ellipse cx="44" cy="79" rx="2.6" ry="3.6" fill="#6B3E22"/><ellipse cx="56" cy="79" rx="2.6" ry="3.6" fill="#6B3E22"/>`,
  sheep: () => `${fluffy([[30, 40, 14], [50, 30, 16], [70, 40, 14], [24, 60, 13], [76, 60, 13], [36, 78, 13], [64, 78, 13], [50, 60, 24]], '#FFF8EC')}<ellipse cx="31" cy="52" rx="9" ry="5" ${P('#54486A', 1.6)} transform="rotate(-20 31 52)"/><ellipse cx="69" cy="52" rx="9" ry="5" ${P('#54486A', 1.6)} transform="rotate(20 69 52)"/><ellipse cx="50" cy="58" rx="15" ry="19" ${P('#54486A', 1.6)}/>${fluffy([[42, 41, 6], [50, 38, 7], [58, 41, 6]], '#FFF8EC', 1.6)}<circle cx="44" cy="56" r="4" fill="#fff"/><circle cx="56" cy="56" r="4" fill="#fff"/><circle cx="44.5" cy="57" r="2" fill="${DK}"/><circle cx="55.5" cy="57" r="2" fill="${DK}"/><path d="M46 68 Q50 71 54 68" ${L('#FFFFFF', 2)}/>`,
  frog: () => `<circle cx="30" cy="36" r="14" ${P('#4FCB8D')}/><circle cx="70" cy="36" r="14" ${P('#4FCB8D')}/><ellipse cx="50" cy="62" rx="38" ry="26" ${P('#4FCB8D')}/><ellipse cx="50" cy="74" rx="22" ry="10" fill="#C8F0CF" opacity=".55"/><circle cx="30" cy="36" r="8.5" fill="#fff" stroke="${lineOf('#4FCB8D')}" stroke-width="1.8"/><circle cx="70" cy="36" r="8.5" fill="#fff" stroke="${lineOf('#4FCB8D')}" stroke-width="1.8"/><circle cx="31" cy="37" r="4" fill="${DK}"/><circle cx="69" cy="37" r="4" fill="${DK}"/><circle cx="32.4" cy="35.5" r="1.4" fill="#fff"/><circle cx="70.4" cy="35.5" r="1.4" fill="#fff"/><path d="M28 66 Q50 82 72 66" ${L('#2E7A52', 2.8)}/>${cheeks(62, 25, 75)}<circle cx="45" cy="54" r="1.8" fill="#2E7A52"/><circle cx="55" cy="54" r="1.8" fill="#2E7A52"/>`,
  lion: () => {
    const mane = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mane.push([+(50 + Math.cos(a) * 30).toFixed(1), +(54 + Math.sin(a) * 30).toFixed(1), 13]);
    }
    mane.push([50, 54, 32]);
    return `${fluffy(mane, '#F0913F')}<circle cx="33" cy="35" r="7" ${P('#FFD166', 1.8)}/><circle cx="67" cy="35" r="7" ${P('#FFD166', 1.8)}/><circle cx="50" cy="56" r="25" ${P('#FFD166')}/><ellipse cx="50" cy="66" rx="12" ry="9" fill="#FFF1C9"/>${eye(41, 51)}${eye(59, 51)}<path d="M45 60 H55 L50 65 Z" fill="${DK}" stroke="${DK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 65 V68 M44 70 Q50 74 56 70" ${L(DK, 2.2)}/>${cheeks(62, 34, 66)}`;
  },
  // food
  apple: (c = '#EC4F61') => `<path d="M50 30 C30 18 12 34 16 56 C20 80 38 92 50 86 C62 92 80 80 84 56 C88 34 70 18 50 30 Z" ${P(c)}/><path d="M50 30 Q50 18 56 12" ${L('#7A5233', 3)}/>${leaf(64, 20)}${shine(32, 46, 5, 9, 20, 0.5)}`,
  banana: () => `<path d="M18 28 Q24 78 78 76 Q88 74 86 66 Q46 64 32 26 Q28 20 18 28 Z" ${P('#FFD166')}/><path d="M30 36 Q40 62 76 69" ${L('#E3AE3A', 2.4)}/><path d="M20 27 L15 19" ${L('#7A5233', 3.2)}/>${shine(25, 42, 3, 9, -18, 0.45)}`,
  orange: () => `<circle cx="50" cy="56" r="30" ${P('#FF9F45')}/><path d="M50 26 Q50 18 54 14" ${L('#7A5233', 3)}/>${leaf(63, 19)}${[[40, 50], [60, 62], [55, 44], [44, 68], [64, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#E07A2C" opacity=".8"/>`).join('')}${shine(36, 46, 4, 8, 25, 0.45)}`,
  grapes: () => `<path d="M52 30 V14" ${L('#7A5233', 3)}/>${leaf(63, 18)}${[[36, 40], [52, 38], [68, 40], [44, 55], [60, 55], [52, 71]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10.5" ${P('#9B6BE0')}/><circle cx="${x - 3}" cy="${y - 3}" r="2.5" fill="#fff" opacity=".55"/>`).join('')}`,
  strawberry: () => `<path d="M50 90 C30 80 18 56 22 40 C26 28 40 30 50 34 C60 30 74 28 78 40 C82 56 70 80 50 90 Z" ${P('#EE4E64')}/>${[[38, 50], [50, 46], [62, 50], [44, 62], [56, 62], [50, 75], [34, 62], [66, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="2.7" fill="#FFE7A0"/>`).join('')}<path d="M30 34 L38 22 L50 30 L62 22 L70 34 Q50 42 30 34 Z" ${P('#6CC46A', 1.8)}/><path d="M50 30 V20" ${L('#4E8F3E', 3)}/>${shine(31, 50, 3.5, 7, 20, 0.4)}`,
  watermelon: () => `<g transform="translate(0 8)"><path d="M6 34 A44 44 0 0 0 94 34 Z" ${P('#4FBF7A')}/><path d="M12 36 A38 38 0 0 0 88 36 Z" fill="#FFF4E0"/><path d="M16 36 A34 34 0 0 0 84 36 Z" fill="${grad('#F2606E')}"/><path d="M6 34 H94" ${L(lineOf('#F2606E'), 2.2)}/>${[[34, 46], [50, 52], [66, 46], [42, 60], [58, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3.6" fill="${DK}"/>`).join('')}</g>`,
  carrot: () => `<path d="M44 32 Q38 20 28 14 M50 32 V8 M56 32 Q62 20 72 14" ${L(lineOf('#6CC46A'), 10)}/><path d="M44 32 Q38 20 28 14 M50 32 V8 M56 32 Q62 20 72 14" ${L('#83CF74', 5.6)}/><path d="M34 30 Q50 25 66 30 Q63 52 53 88 Q50 94 47 88 Q37 52 34 30 Z" ${P('#FF9F45')}/><path d="M42 44 H50 M49 58 H57 M45 72 H51" ${L('#D9772F', 2.4)}/>${shine(41, 42, 2.5, 8, 0, 0.45)}`,
  milk: () => `<rect x="40" y="9" width="20" height="9" rx="2" ${P('#4C8DF0', 1.8)}/><path d="M30 36 L38 16 H62 L70 36 Z" ${P('#4C8DF0')}/><rect x="30" y="36" width="40" height="54" rx="3" ${P('#FFFFFF')}/><rect x="60" y="38" width="8" height="50" fill="#5A3E22" opacity=".06"/><path d="M50 50 Q41 62 41 69 A9 9 0 0 0 59 69 Q59 62 50 50 Z" fill="${grad('#4C8DF0')}"/>`,
  bread: () => `<path d="M20 50 Q14 20 50 20 Q86 20 80 50 L80 86 Q80 90 76 90 H24 Q20 90 20 86 Z" ${P('#D4945F')}/><path d="M29 52 Q25 30 50 30 Q75 30 71 52 L71 82 H29 Z" fill="${grad('#FBE6C6')}"/>${[[40, 48], [56, 44], [48, 62], [62, 66], [38, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#E3BE8C"/>`).join('')}${shine(30, 30, 4, 7, -40, 0.35)}`,
  egg: () => `<ellipse cx="50" cy="54" rx="27" ry="35" ${P('#FFF4E2')}/>${shine(40, 40, 6, 10, 20, 0.85)}`,
  cake: () => `<path d="M10 88 H90" ${L('#B98A66', 3)}/><rect x="18" y="48" width="64" height="38" rx="6" ${P('#FF9BB5')}/><path d="M18 56 Q18 44 30 44 H70 Q82 44 82 56 Q74 63 66 56 Q58 65 50 56 Q42 65 34 56 Q26 63 18 56 Z" ${P('#FFFAF2', 1.8)}/><rect x="46" y="22" width="8" height="22" rx="2" ${P('#6FA8F5', 1.8)}/><path d="M50 6 Q56 13 54 18 Q50 23 46 18 Q44 13 50 6 Z" ${P('#FFCF4D', 1.6)}/><circle cx="34" cy="72" r="3" fill="#fff"/><circle cx="50" cy="74" r="3" fill="#fff"/><circle cx="66" cy="72" r="3" fill="#fff"/>`,
  cheese: () => `<path d="M12 50 L70 26 L90 50 Z" ${P('#FFE58A')}/><rect x="12" y="50" width="78" height="32" rx="2" ${P('#FFD35C')}/><circle cx="30" cy="64" r="5.5" fill="#E9B23E"/><circle cx="56" cy="70" r="4" fill="#E9B23E"/><circle cx="74" cy="60" r="6" fill="#E9B23E"/><ellipse cx="54" cy="40" rx="5" ry="3" fill="#E9B23E"/>`,
  // toys and things at home
  ball: (c = '#EF476F') => `<circle cx="50" cy="52" r="34" ${P(c)}/><path d="M18 42 Q50 58 82 42 L84 56 Q50 74 16 56 Z" fill="${grad('#FFFFFF')}"/><path d="M18 42 Q50 58 82 42 M84 56 Q50 74 16 56" ${L(lineOf(c), 1.8)}/><circle cx="50" cy="52" r="34" fill="none" stroke="${lineOf(c)}" stroke-width="2.2"/>${shine(36, 32, 7, 4, -30, 0.55)}`,
  car: (c = '#3A86FF') => `<path d="M10 66 Q10 52 24 50 L32 34 Q34 30 40 30 H62 Q68 30 72 36 L80 50 Q92 52 92 64 V70 Q92 74 88 74 H14 Q10 74 10 70 Z" ${P(c)}/><path d="M37 48 L43 36 H52 V48 Z M58 48 V36 H64 L70 48 Z" fill="${grad('#DDF3FF')}" stroke="${lineOf(c)}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="87" cy="60" r="3" fill="#FFE7A0"/>${wheel(30, 74)}${wheel(72, 74)}`,
  'teddy bear': () => `<ellipse cx="50" cy="80" rx="23" ry="16" ${P('#B9804F')}/><circle cx="30" cy="24" r="10" ${P('#B9804F')}/><circle cx="70" cy="24" r="10" ${P('#B9804F')}/><circle cx="50" cy="44" r="24" ${P('#B9804F')}/><ellipse cx="50" cy="54" rx="12" ry="9" fill="${grad('#EBC39A')}"/><ellipse cx="50" cy="84" rx="11" ry="7" fill="#EBC39A" opacity=".7"/><path d="M38 66 L50 71 L62 66 L62 76 L50 71 L38 76 Z" ${P('#E85D6A', 1.6)}/><circle cx="30" cy="24" r="5" fill="#EBC39A"/><circle cx="70" cy="24" r="5" fill="#EBC39A"/><ellipse cx="50" cy="51" rx="4.5" ry="3.2" fill="${DK}"/><path d="M50 54 V57 M45 58 Q50 61 55 58" ${L(DK, 2)}/>${eye(41, 40, 3.6)}${eye(59, 40, 3.6)}`,
  doll: () => `<circle cx="50" cy="38" r="24" ${P('#FFD166')}/><path d="M28 92 L50 56 L72 92 Z" ${P('#FF9BB5')}/><circle cx="50" cy="40" r="17" ${P('#FFE3CC', 1.6)}/><path d="M33 36 Q38 20 50 24 Q62 20 67 36 Q60 30 50 32 Q40 30 33 36 Z" fill="${grad('#FFD166')}"/><path d="M34 68 L24 78 M66 68 L76 78" ${L('#E9B48F', 4)}/>${eye(44, 40, 3)}${eye(56, 40, 3)}<path d="M45 48 Q50 52 55 48" ${L('#C9606F', 2)}/>${cheeks(46, 40, 60)}<path d="M62 18 L70 12 L72 22 Z" ${P('#EF476F', 1.6)}/>`,
  book: (c = '#EF476F') => `<path d="M8 28 V84 Q30 80 50 88 Q70 80 92 84 V28 Q70 24 50 32 Q30 24 8 28 Z" ${P(c)}/><path d="M50 32 Q34 20 14 24 V78 Q34 74 50 84 Q66 74 86 78 V24 Q66 20 50 32 Z" ${P('#FFFBF2', 1.8)}/><path d="M50 32 V84" ${L('#C9B8A0', 1.8)}/><path d="M22 38 Q32 36 42 40 M22 50 Q32 48 42 52 M58 40 Q68 36 78 38 M58 52 Q68 48 78 50" ${L('#D4C8B8', 2.4)}/>`,
  cup: (c = '#06D6A0') => `<path d="M70 40 Q88 40 88 56 Q88 70 70 70" ${L(lineOf(c), 10)}/><path d="M70 40 Q88 40 88 56 Q88 70 70 70" ${L(c, 5.6)}/><path d="M22 30 H72 V74 Q72 88 58 88 H36 Q22 88 22 74 Z" ${P(c)}/><ellipse cx="47" cy="30" rx="25" ry="4" fill="${shade(c, 0.8)}" stroke="${lineOf(c)}" stroke-width="2"/><path d="M38 22 Q34 16 38 10 M54 22 Q50 16 54 10" ${L('#CFC6BB', 2.4)}/>${shine(32, 54, 3.5, 11, 0, 0.45)}`,
  chair: (c = '#FF9542') => `<rect x="26" y="62" width="9" height="30" rx="3" ${P(shade(c))}/><rect x="65" y="62" width="9" height="30" rx="3" ${P(shade(c))}/><rect x="28" y="10" width="44" height="46" rx="8" ${P(c)}/><rect x="20" y="52" width="60" height="14" rx="5" ${P(shade(c, 0.92))}/><path d="M40 22 V44 M50 22 V44 M60 22 V44" ${L(shade(c, 0.8), 3.4)}/>`,
  bed: (c = '#3A86FF') => `<rect x="14" y="80" width="8" height="12" rx="2" ${P('#A87850', 1.8)}/><rect x="80" y="80" width="8" height="12" rx="2" ${P('#A87850', 1.8)}/><rect x="10" y="28" width="16" height="58" rx="5" ${P('#A87850')}/><rect x="18" y="56" width="74" height="26" rx="7" ${P('#FFFBF2', 1.8)}/><ellipse cx="36" cy="54" rx="13" ry="8" ${P('#FFFBF2', 1.8)}/><rect x="44" y="52" width="48" height="30" rx="7" ${P(c)}/><path d="M52 64 H86 M52 72 H86" ${L(shade(c, 0.82), 2.4)}/>`,
  shoe: (c = '#EF476F') => `<path d="M14 70 Q14 50 26 46 L40 42 Q48 52 60 54 L78 58 Q90 60 90 72 V76 H14 Z" ${P(c)}/><path d="M12 74 H92 V82 Q92 86 88 86 H16 Q12 86 12 82 Z" ${P('#FFFBF2', 1.8)}/><path d="M38 48 L46 56 M46 46 L54 56" ${L('#FFFFFF', 3)}/>${shine(24, 56, 3, 6, 10, 0.4)}`,
  hat: (c = '#FFD166') => `<ellipse cx="50" cy="64" rx="42" ry="13" ${P(shade(c, 0.9))}/><path d="M28 62 Q28 28 50 28 Q72 28 72 62 Z" ${P(c)}/><path d="M28.6 52 H71.4 V60 H28.6 Z" ${P('#E85D6A', 1.8)}/>${shine(38, 40, 3, 8, 10, 0.45)}`,
  spoon: () => `<rect x="45" y="40" width="10" height="52" rx="5" ${P('#CDD2DE')}/><ellipse cx="50" cy="28" rx="15" ry="20" ${P('#CDD2DE')}/><ellipse cx="45" cy="22" rx="4" ry="8" fill="#fff" opacity=".75"/>`,
  clock: () => `<path d="M30 84 L24 92 M70 84 L76 92" ${L(lineOf('#E85D6A'), 4)}/><circle cx="27" cy="22" r="10" ${P('#E85D6A')}/><circle cx="73" cy="22" r="10" ${P('#E85D6A')}/><circle cx="50" cy="54" r="32" ${P('#E85D6A')}/><circle cx="50" cy="54" r="24" ${P('#FFFBF2', 1.8)}/><path d="M50 54 V38 M50 54 H62" ${L(DK, 3.4)}/><circle cx="50" cy="54" r="3" fill="${DK}"/><circle cx="50" cy="34" r="2" fill="${DK}"/><circle cx="70" cy="54" r="2" fill="${DK}"/><circle cx="50" cy="74" r="2" fill="${DK}"/><circle cx="30" cy="54" r="2" fill="${DK}"/>`,
  // extra things for the colour game
  balloon: (c = '#EF476F') => `<path d="M50 74 Q46 86 54 96" ${L('#A89A8C', 2)}/><ellipse cx="50" cy="40" rx="26" ry="32" ${P(c)}/><path d="M45 74 L55 74 L50 68 Z" ${P(c, 1.8)}/>${shine(40, 28, 5, 9, 20, 0.5)}`,
  flower: (c = '#FF8FB1') => `<path d="M50 56 V94" ${L(lineOf('#7CC46A'), 8)}/><path d="M50 56 V94" ${L('#8BD07A', 4.4)}/>${leaf(62, 80, -30)}${[0, 72, 144, 216, 288].map((a) => { const r = ((a - 90) * Math.PI) / 180; return `<circle cx="${(50 + Math.cos(r) * 18).toFixed(1)}" cy="${(38 + Math.sin(r) * 18).toFixed(1)}" r="13" ${P(c)}/>`; }).join('')}<circle cx="50" cy="38" r="10" ${P('#FFCF4D', 1.8)}/>`,
  // extra things for the harder levels (groups and first letters)
  shirt: (c = '#4C8DF0') => `<path d="M32 16 L16 24 L6 44 L20 52 L28 44 V86 Q28 90 32 90 H68 Q72 90 72 86 V44 L80 52 L94 44 L84 24 L68 16 Q60 28 50 28 Q40 28 32 16 Z" ${P(c)}/><path d="M36 18 Q50 34 64 18" ${L(lineOf(c), 2.2)}/><path d="M28 44 L22 37 M72 44 L78 37" ${L(shade(c, 0.85), 2)}/><rect x="55" y="48" width="12" height="12" rx="2" fill="none" stroke="${shade(c, 0.8)}" stroke-width="2"/>${shine(38, 52, 3.5, 12, 0, 0.4)}`,
  sock: (c = '#EF476F') => `<path d="M34 14 H64 V56 L80 63 Q94 70 89 83 Q84 93 70 91 L44 87 Q30 84 32 70 Z" ${P(c)}/><path d="M76 68 Q90 72 88 84 Q84 92 72 90 Q79 80 76 68 Z" fill="${shade(c, 0.86)}"/><path d="M34 38 H64 M34 46 H64" ${L('#FFFFFF', 3.4)} opacity=".75"/><rect x="31" y="9" width="36" height="14" rx="5" ${P('#FFFBF2', 1.8)}/>${shine(40, 60, 3, 8, 0, 0.4)}`,
  butterfly: (c = '#FF9542') => `<path d="M48 32 Q44 20 38 14 M52 32 Q56 20 62 14" ${L('#5A4A5E', 2)}/><circle cx="38" cy="14" r="3" fill="#5A4A5E"/><circle cx="62" cy="14" r="3" fill="#5A4A5E"/><ellipse cx="29" cy="38" rx="21" ry="17" transform="rotate(-18 29 38)" ${P(c)}/><ellipse cx="71" cy="38" rx="21" ry="17" transform="rotate(18 71 38)" ${P(c)}/><ellipse cx="33" cy="66" rx="15" ry="13" transform="rotate(20 33 66)" ${P(shade(c, 0.9))}/><ellipse cx="67" cy="66" rx="15" ry="13" transform="rotate(-20 67 66)" ${P(shade(c, 0.9))}/><circle cx="27" cy="36" r="6" fill="#FFF3C4" opacity=".85"/><circle cx="73" cy="36" r="6" fill="#FFF3C4" opacity=".85"/><circle cx="33" cy="67" r="4" fill="#FFF3C4" opacity=".7"/><circle cx="67" cy="67" r="4" fill="#FFF3C4" opacity=".7"/><ellipse cx="50" cy="52" rx="6" ry="24" ${P('#6A5670')}/>`,
  plane: (c = '#EF476F') => `<path d="M16 48 L10 24 H20 L34 48 Z" ${P(shade(c, 0.88))}/><path d="M44 50 L58 26 H68 L62 50 Z" ${P(shade(c, 0.8))}/><path d="M12 46 Q6 56 14 64 H76 Q94 62 94 55 Q94 47 76 46 Z" ${P('#F4F7FC')}/><path d="M13 57 H91" ${L(c, 4)}/><path d="M40 58 L28 86 H42 L62 58 Z" ${P(c)}/>${[52, 64, 76].map((x) => `<circle cx="${x}" cy="52" r="3.6" fill="${grad('#A9D6EC')}" stroke="${lineOf('#A9D6EC')}" stroke-width="1.4"/>`).join('')}${shine(30, 50, 10, 2.5, 0, 0.5)}`,
  crab: () => {
    const c = '#FF7B5C';
    return `<path d="M26 64 L10 72 M28 70 L14 82 M74 64 L90 72 M72 70 L86 82" ${L(lineOf(c), 4)}/><path d="M30 54 Q20 50 18 42 M70 54 Q80 50 82 42" ${L(lineOf(c), 5)}/><path d="M42 46 L40 30 M58 46 L60 30" ${L(lineOf(c), 3)}/><path d="M8 38 Q10 24 22 26 Q28 30 24 36 L16 36 Q22 42 18 48 Q8 48 8 38 Z" ${P(c)}/><path d="M92 38 Q90 24 78 26 Q72 30 76 36 L84 36 Q78 42 82 48 Q92 48 92 38 Z" ${P(c)}/><ellipse cx="50" cy="62" rx="30" ry="19" ${P(c)}/>${shine(40, 54, 7, 3.5, -10, 0.45)}<circle cx="40" cy="28" r="6" fill="#fff" stroke="${lineOf(c)}" stroke-width="1.6"/><circle cx="60" cy="28" r="6" fill="#fff" stroke="${lineOf(c)}" stroke-width="1.6"/>${eye(40, 29, 3)}${eye(60, 29, 3)}<path d="M43 69 Q50 74 57 69" ${L(DK, 2.2)}/>${cheeks(66, 34, 66)}`;
  },
};

export const PICS = Object.keys(PIC);

export function picSVG(name, color) {
  const fn = PIC[name];
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${color ? fn(color) : fn()}</svg>`;
}

// ---------------------------------------------------------------- shapes
function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
  }
  return d + 'Z';
}
const VE = 'vector-effect="non-scaling-stroke"';
const SHAPES = {
  circle: (a) => `<ellipse cx="50" cy="50" rx="46" ry="46" ${a}/>`,
  oval: (a) => `<ellipse cx="50" cy="50" rx="46" ry="46" ${a}/>`,
  square: (a) => `<rect x="4" y="4" width="92" height="92" rx="9" ${a}/>`,
  rectangle: (a) => `<rect x="4" y="4" width="92" height="92" rx="9" ${a}/>`,
  triangle: (a) => `<path d="M50 5 L96 95 L4 95 Z" ${a}/>`,
  diamond: (a) => `<path d="M50 4 L96 50 L50 96 L4 50 Z" ${a}/>`,
  star: (a) => `<path d="${starPath(50, 53, 48, 20)}" ${a}/>`,
  heart: (a) => `<path d="M50 93 C20 72 4 54 4 31 C4 15 16 5 30 5 C40 5 47 11 50 19 C53 11 60 5 70 5 C84 5 96 15 96 31 C96 54 80 72 50 93 Z" ${a}/>`,
};
// Natural on-screen size of each shape (w x h in stage px).
export const SHAPE_SIZE = {
  circle: [140, 140], square: [130, 130], triangle: [150, 132], star: [150, 145],
  heart: [150, 136], rectangle: [190, 110], oval: [190, 120], diamond: [116, 156],
};
// Solid colours get the soft gradient and a line in a darker shade of the same colour.
export function shapeSVG(type, fill, { stroke, sw = 3.5, dash = '' } = {}) {
  const a = `fill="${grad(fill)}" stroke="${stroke || lineOf(fill)}" stroke-width="${sw}" stroke-linejoin="round" ${VE}${dash ? ` stroke-dasharray="${dash}"` : ''}`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${SHAPES[type](a)}</svg>`;
}

// ---------------------------------------------------------------- icons
const IC = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
  replay: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  hanger: '<path d="M10 6a2 2 0 1 1 2 2v2"/><path d="M12 10 3 17.5h18z"/>',
  go: '<path d="M5 12h12"/><path d="M12 6l6 6-6 6"/>',
};
export const icon = (name, size = 36, sw = 2.6) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name]}</svg>`;
export const starSVG = (fill) => `<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${grad(fill)}" stroke="${lineOf(fill)}" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="9.6" cy="9.6" rx="1.4" ry="2.4" fill="#fff" opacity=".55" transform="rotate(30 9.6 9.6)"/></svg>`;

// ---------------------------------------------------------------- places
// Every place has three layers: still scenery (with the hand-drawn wobble filter), a live
// layer that holds only the moving things (never filtered, so it stays cheap), and the
// paper layer (grain + warm vignette, drawn by CSS).
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const range = (n) => Array.from({ length: n }, (_, i) => i);
const timing = (i, base, spread) => `animation-duration:${(base + ((i * 0.37) % 1) * spread).toFixed(2)}s;animation-delay:${(-((i * 0.61) % 1) * base).toFixed(2)}s`;

const G = {
  sky: () => lin('ml-sky', [[0, '#9CCFE8'], [0.5, '#CFE6EE'], [0.78, '#F7EBD3']]),
  far: () => lin('ml-far', [[0, '#C9DFBD'], [0.45, '#AFCCA2']]),
  mid: () => lin('ml-mid', [[0, '#B2D693'], [0.4, '#8CBE72']]),
  ground: () => lin('ml-ground', [[0, '#A2CF7C'], [0.7, '#76AC5C']]),
  cloud: () => lin('ml-cloud', [[0, '#FFFFFF'], [1, '#E4ECF1']], 'gradientUnits="userSpaceOnUse" x1="0" y1="-62" x2="0" y2="34"'),
  canopy: () => rad('ml-canopy', [[0, '#A9D886'], [1, '#5C9A4A']], 'gradientUnits="userSpaceOnUse" cx="-24" cy="-80" r="150"'),
  trunk: () => lin('ml-trunk', [[0, '#A57651'], [1, '#76492E']], 'x1="0" y1="0" x2="1" y2="0"'),
  sunglow: () => rad('ml-sunglow', [[0, '#FFF4CF', 0.95], [0.45, '#FFF0C2', 0.5], [1, '#FFF0C2', 0]]),
  glass: () => lin('ml-glass', [[0, '#A9D6EC'], [1, '#E6F3F4']]),
  wood: () => lin('ml-wood', [[0, '#EFC994'], [1, '#D6A26A']]),
};

// Rolling hill from x=-20 to 1220 around height y; at(x) gives the hill top near x.
function hill(y, amp, seed, n = 6) {
  const r = rng(seed);
  const pts = range(n + 1).map((i) => [-20 + (i * 1240) / n, Math.round(y + (r() - 0.5) * 2 * amp)]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = ((x0 + x1) / 2).toFixed(1);
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1.toFixed(1)} ${y1}`;
  }
  d += ' L1220 820 L-20 820 Z';
  const at = (x) => {
    const i = Math.min(n - 1, Math.max(0, Math.floor(((x + 20) * n) / 1240)));
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const u = (x - x0) / (x1 - x0);
    return y0 + (y1 - y0) * u * u * (3 - 2 * u);
  };
  return { d, at };
}

function strokes(seed, n, x0, x1, y0, y1, color, o = 0.55, d = 'q4 -9 9 -12') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<path d="M${(x0 + r() * (x1 - x0)).toFixed(0)} ${(y0 + r() * (y1 - y0)).toFixed(0)} ${d}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="${o}"/>`;
  return s;
}

const CLOUD = [[0, 4, 30], [40, -18, 44], [86, -10, 38], [120, 10, 24]];
const cloudShape = (f, extra = '') => CLOUD.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`).join('') + `<rect x="0" y="4" width="120" height="30" fill="${f}" ${extra}/>`;
const cloud = (x, y, s, i) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="drift" style="${timing(i, 24, 14)}">${cloudShape(G.cloud(), 'stroke="#B7C8D5" stroke-width="6"')}${cloudShape(G.cloud())}</g></g>`;
const CLOUDS = [[150, 112, 1.05], [520, 72, 0.7], [760, 196, 0.6], [330, 228, 0.5]];

const sun = (x, y) => `<circle class="glow" cx="${x}" cy="${y}" r="170" fill="${G.sunglow()}"/><circle cx="${x}" cy="${y}" r="62" fill="#FFDB80" stroke="#E8B04F" stroke-width="3"/><circle cx="${x - 10}" cy="${y - 10}" r="40" fill="#FFE7A6"/>`;

const CANOPY = [[0, -64, 52], [-46, -30, 42], [46, -32, 44], [0, -14, 48]];
const canopyShape = (f, extra = '') => CANOPY.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`).join('');
const LEAFLIGHT = [[-40, -70, 9], [-10, -96, 7], [30, -60, 8], [-60, -28, 6], [10, -30, 9], [52, -20, 6]];
const APPLES = [[-24, -22], [28, -52], [44, -14], [-8, -66], [-50, -40]];
function tree(x, y, s, i, { apples = false, night = false } = {}) {
  const trunk = night ? 'fill="#3A3558" stroke="#2A2645"' : `fill="${G.trunk()}" stroke="#5E3B24"`;
  const crown = night
    ? canopyShape('#38466F', 'stroke="#28345A" stroke-width="6"') + canopyShape('#38466F')
    : canopyShape(G.canopy(), 'stroke="#4C7F3E" stroke-width="6"') + canopyShape(G.canopy())
      + LEAFLIGHT.map(([a, b, r]) => `<ellipse cx="${a}" cy="${b}" rx="${r}" ry="${r * 0.6}" fill="#C4E6A6" opacity=".6"/>`).join('');
  const fruit = apples ? APPLES.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="8.5" fill="${grad('#E46A6A')}" stroke="#A94545" stroke-width="2"/><circle cx="${a - 2.5}" cy="${b - 3}" r="2.2" fill="#fff" opacity=".6"/>`).join('') : '';
  return `<ellipse cx="${x}" cy="${y + 2}" rx="${70 * s}" ry="${11 * s}" fill="#3F6B30" opacity="${night ? 0.25 : 0.22}"/>`
    + `<g transform="translate(${x} ${y}) scale(${s})"><g class="tree" style="${timing(i, 4.8, 1.4)}">`
    + `<path d="M-13 2 C-11 -40 -10 -70 -9 -96 L9 -96 C10 -70 11 -40 13 2 Z" ${trunk} stroke-width="3" stroke-linejoin="round"/>`
    + `<g transform="translate(0 -92)">${crown}${fruit}</g></g></g>`;
}
const farTree = (x, y, s, c = '#A7C79A', ln = '#8CAD80', tr = '#A9927A') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-10" y="-70" width="20" height="72" rx="4" fill="${tr}" stroke="${shade(tr, 0.82)}" stroke-width="5"/><g transform="translate(0 -60)">${canopyShape(c, `stroke="${ln}" stroke-width="10"`)}${canopyShape(c)}</g></g>`;

const FLOWER_C = { pink: ['#F5A9BC', '#C9768A'], yellow: ['#FFE7A0', '#C9A24E'], white: ['#FFF8EA', '#BFAE8E'], lilac: ['#CDB8EC', '#9479BE'] };
const petalRing = (n, h, make) => range(n).map((i) => make((i * 360) / n)).join('');
function flowerArt(h, col) {
  const C = FLOWER_C[col];
  return `<path d="M0 0 Q5 ${-h / 2} 0 ${-h}" stroke="#5C8F49" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M1 ${-h * 0.38} q13 -12 22 -2 q-11 10 -22 2z" fill="#8CBE72" stroke="#5C8F49" stroke-width="2"/>`
    + petalRing(6, h, (a) => `<ellipse cx="0" cy="${-h - 9}" rx="6" ry="10" transform="rotate(${a} 0 ${-h})" fill="${C[0]}" stroke="${C[1]}" stroke-width="2"/>`)
    + `<circle cx="0" cy="${-h}" r="5.5" fill="#F6C453" stroke="#C9952C" stroke-width="2"/>`;
}
const TUFT = '<path d="M-8 0 Q-12 -18 -18 -28 M-2 0 Q-2 -26 2 -40 M4 0 Q10 -18 18 -26" stroke="#5E9A4B" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 0 Q14 -10 22 -12 M-4 0 Q-10 -10 -22 -12" stroke="#7DB565" stroke-width="3" fill="none" stroke-linecap="round"/>';
const swayAt = (x, y, s, inner, i, cls = 'sway') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}" style="${timing(i, 3.2, 1.8)}">${inner}</g></g>`;
const FLOWERS = [[70, 742, 46, 'pink'], [150, 768, 38, 'yellow'], [505, 724, 40, 'white'], [585, 760, 50, 'pink'], [770, 736, 44, 'lilac'], [905, 772, 40, 'yellow'], [1030, 738, 48, 'white'], [1130, 766, 42, 'pink']];
const TUFTS = [[30, 708, 1], [255, 702, 0.9], [455, 704, 1], [660, 708, 0.9], [850, 704, 1.1], [990, 708, 0.9], [1170, 710, 1], [112, 788, 1.2], [300, 776, 1], [392, 782, 1.1], [690, 792, 1.2], [960, 794, 1.1], [1090, 796, 1.2]];
const flowers = (list, k = 0) => list.map(([x, y, h, c], i) => swayAt(x, y, 1, flowerArt(h, c), i + k)).join('');
const tufts = (list, k = 0) => list.map(([x, y, s], i) => swayAt(x, y, s, TUFT, i + k)).join('');

const butterfly = (y, i = 0, w1 = '#FFE59A', w2 = '#FFD0A6', ln = '#C9A24E') => `<g class="bfly-x" style="animation-delay:${-i * 15 - 6}s"><g transform="translate(0 ${y})"><g class="bfly-y">`
  + `<g class="wingL"><ellipse cx="-10" cy="-6" rx="11" ry="13" fill="${w1}" stroke="${ln}" stroke-width="1.5"/><ellipse cx="-8" cy="8" rx="7" ry="8" fill="${w2}" stroke="${ln}" stroke-width="1.5"/></g>`
  + `<g class="wingR"><ellipse cx="10" cy="-6" rx="11" ry="13" fill="${w1}" stroke="${ln}" stroke-width="1.5"/><ellipse cx="8" cy="8" rx="7" ry="8" fill="${w2}" stroke="${ln}" stroke-width="1.5"/></g>`
  + '<rect x="-2.5" y="-11" width="5" height="24" rx="2.5" fill="#5A4632"/><path d="M-1 -10 q-4 -10 -9 -12 M1 -10 q4 -10 9 -12" stroke="#5A4632" stroke-width="2" fill="none" stroke-linecap="round"/></g></g></g>';

function motes(seed, n, x0, x1, y0, y1, fill = '#FFF8DC', cls = 'mote') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle class="${cls}" cx="${(x0 + r() * (x1 - x0)).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(2 + r() * 2.5).toFixed(1)}" fill="${fill}" style="animation-duration:${(10 + r() * 8).toFixed(1)}s;animation-delay:${(-r() * 16).toFixed(1)}s"/>`;
  return s;
}

function barn(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-58 0 V-70 L0 -112 L58 -70 V0 Z" fill="${grad('#D9735F')}" stroke="#9E4A3D" stroke-width="3" stroke-linejoin="round"/>`
    + '<path d="M-68 -64 L0 -120 L68 -64" fill="none" stroke="#8A4038" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<rect x="-22" y="-48" width="44" height="48" rx="3" fill="#F7E7CB" stroke="#9E4A3D" stroke-width="2.5"/><path d="M-18 -44 L18 -4 M18 -44 L-18 -4" stroke="#C7665A" stroke-width="4" stroke-linecap="round"/>'
    + '<circle cx="0" cy="-78" r="9" fill="#F7E7CB" stroke="#9E4A3D" stroke-width="2.5"/></g>';
}
function fence(x0, x1, y) {
  let f = '';
  for (let x = x0; x <= x1; x += 64) f += `<path d="M${x - 9} ${y} V${y - 66} L${x} ${y - 80} L${x + 9} ${y - 66} V${y} Z" fill="#EFDDB5" stroke="#A88458" stroke-width="2.5" stroke-linejoin="round"/>`;
  return f + [y - 58, y - 32].map((yy) => `<rect x="${x0 - 12}" y="${yy}" width="${x1 - x0 + 40}" height="11" rx="2" fill="#EFDDB5" stroke="#A88458" stroke-width="2.5"/>`).join('');
}

// Indoor pieces: a window (live: drifting clouds and swaying curtains), plants, motes.
function windowLive(id, x, y, w, h, curtain = '#F5A9BC') {
  const clip = def(`ml-clip-${id}`, `<clipPath id="ml-clip-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>`);
  const cw = 64;
  const hang = (side) => {
    const inner = `<path d="M0 0 H${cw} Q${cw - 6} ${h * 0.42} ${cw * 0.5} ${h * 0.56} Q${cw * 0.8} ${h * 0.8} ${cw * 0.9} ${h + 34} H0 Z" ${P(curtain, 2.5)}/>`
      + `<path d="M16 6 Q14 ${h * 0.45} 12 ${h + 30} M34 6 Q32 ${h * 0.3} 28 ${h * 0.54}" ${L(shade(curtain, 0.85), 2.5)}/>`
      + `<rect x="${cw * 0.5 - 12}" y="${h * 0.56 - 5}" width="24" height="10" rx="5" fill="${grad('#F6C453')}" stroke="#C9952C" stroke-width="2"/>`;
    const tx = side < 0 ? x - 26 : x + w + 26;
    return `<g transform="translate(${tx} ${y - 12}) scale(${side < 0 ? 1 : -1} 1)"><g class="curtain" style="${timing(side < 0 ? 1 : 2, 6, 2)}">${inner}</g></g>`;
  };
  return `<rect x="${x - 18}" y="${y + h - 2}" width="${w + 36}" height="16" rx="5" ${P('#D9A066', 2.5)}/>`
    + `<g clip-path="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${G.glass()}"/>${cloud(x + w * 0.12, y + h * 0.36, 0.42, 3)}${cloud(x + w * 0.55, y + h * 0.7, 0.32, 5)}</g>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${grad('#C8925E')}" stroke-width="12"/>`
    + `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#B88352" stroke-width="8"/>`
    + `<rect x="${x - 50}" y="${y - 22}" width="${w + 100}" height="9" rx="4.5" fill="#9A6B45"/>${hang(-1)}${hang(1)}`;
}
function plant(x, y, s, i, pot = '#D9825B') {
  const leaves = [[-46, -64], [-20, -92], [8, -100], [34, -84], [52, -54]];
  const leafD = (tx, ty) => {
    const dx = tx;
    const dy = ty + 20;
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * 13;
    const ny = (dx / len) * 13;
    const mx = tx / 2;
    const my = (ty - 20) / 2;
    return `M0 -20 Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${tx} ${ty} Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} 0 -20 Z`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + leaves.map(([lx, ly], k) => `<g class="sway" style="${timing(i + k, 3.6, 1.6)}"><path d="${leafD(lx, ly)}" fill="${grad('#7DBB63')}" stroke="#4E8A3E" stroke-width="2.5"/><path d="M0 -20 L${lx * 0.8} ${(ly + 20) * 0.8 - 20}" ${L('#4E8A3E', 1.6)}/></g>`).join('')
    + `<path d="M-30 -22 H30 L24 18 Q23 24 17 24 H-17 Q-23 24 -24 18 Z" ${P(pot, 2.5)}/><rect x="-34" y="-28" width="68" height="12" rx="5" ${P(shade(pot, 0.92), 2.5)}/></g>`;
}
const SHADES = ['#F5A9BC', '#FFE7A0', '#A9D6EC', '#B9E3A0', '#CDB8EC', '#FFC9A0'];

const VB = 'viewBox="0 0 1200 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"';
const scene = (still, live, paper = '') => `<svg class="bg-static" ${VB}>${still}</svg><svg class="bg-live" ${VB}>${live}</svg><div class="bg-paper ${paper}"></div>`;

// Outdoor meadow shared by several places.
function meadow(o = {}) {
  const seed = o.seed || 11;
  const far = hill(o.far || 470, 30, seed);
  const mid = hill(o.mid || 560, 26, seed + 2);
  const gy = o.ground || 652;
  const ground = hill(gy, 12, seed + 4);
  const still = `<rect width="1200" height="800" fill="${G.sky()}"/><g filter="${rough()}">`
    + `<path d="${far.d}" fill="${G.far()}" stroke="#97B58A" stroke-width="3"/>`
    + (o.farTrees || [[300, 0.42], [770, 0.5]]).map(([x, s]) => farTree(x, far.at(x) + 10, s)).join('')
    + `<path d="${mid.d}" fill="${G.mid()}" stroke="#6E9E58" stroke-width="3"/>`
    + strokes(seed + 6, 18, 0, 1200, (o.mid || 560) + 24, (o.mid || 560) + 70, '#6E9E58', 0.45, 'q6 -6 12 -6')
    + (o.midExtra ? o.midExtra(mid.at) : '')
    + `<path d="${ground.d}" fill="${G.ground()}" stroke="#5E9147" stroke-width="3"/>`
    + strokes(seed + 8, 46, 0, 1200, gy + 18, 798, '#5E9147')
    + (o.groundExtra || '') + `</g>${o.stillTop || ''}`;
  const live = (o.sun === false ? '' : sun(...(o.sun || [1010, 140])))
    + (o.clouds || CLOUDS).map(([x, y, s], i) => cloud(x, y, s, i)).join('')
    + (o.trees || []).map(([x, y, s, apples], i) => tree(x, y, s, i, { apples })).join('')
    + tufts(o.tufts || TUFTS) + flowers(o.flowers || FLOWERS, 3) + (o.live || '')
    + butterfly(o.bfly || 600) + motes(seed, 14, 10, 1190, 560, 780);
  return scene(still, live);
}

const PLACE = {
  sky: () => meadow({ seed: 11, trees: [[110, 610, 1.05, true], [1110, 620, 0.78, false]] }),
  choose: () => meadow({
    seed: 23,
    sun: [1080, 120],
    clouds: [[110, 140, 1], [620, 90, 0.7], [860, 210, 0.5]],
    trees: [[70, 640, 0.95, false], [1140, 650, 0.85, true]],
    stillTop: [300, 600, 900].map((x) => `<ellipse cx="${x}" cy="698" rx="150" ry="34" fill="#4F7F3C" opacity=".18"/><ellipse cx="${x}" cy="692" rx="140" ry="28" fill="${grad('#E8F2C8')}" stroke="#A9C27E" stroke-width="3"/>`).join(''),
    flowers: [[60, 742, 44, 'pink'], [180, 772, 38, 'yellow'], [450, 760, 40, 'white'], [750, 768, 46, 'lilac'], [1040, 748, 42, 'pink'], [1150, 772, 40, 'yellow']],
    tufts: [[30, 708, 1], [455, 712, 0.9], [750, 712, 0.9], [1170, 710, 1], [112, 790, 1.2], [600, 794, 1.1], [1000, 794, 1.2]],
  }),
  farm: () => meadow({
    seed: 37,
    sun: [930, 110],
    clouds: [[80, 80, 0.8], [600, 50, 0.6], [380, 180, 0.45]],
    trees: [[100, 630, 1, false]],
    farTrees: [[420, 0.4], [640, 0.45]],
    midExtra: (at) => barn(1050, at(1050) + 14, 1.35),
    groundExtra: fence(720, 1200, 668),
    live: `<g transform="translate(860 660)"><ellipse cx="0" cy="6" rx="48" ry="9" fill="#4F7F3C" opacity=".22"/><rect x="-44" y="-50" width="88" height="56" rx="16" ${P('#E8C66A', 2.5)}/><path d="M-30 -40 V-6 M-10 -44 V-4 M10 -44 V-4 M30 -40 V-6" ${L('#C9A24E', 2.5)}/></g>`,
  }),
  orchard: () => meadow({
    seed: 53,
    sun: [1000, 90],
    clouds: [[420, 60, 0.7], [700, 150, 0.5]],
    trees: [[92, 650, 1.45, true], [1112, 660, 1.35, true]],
    farTrees: [[360, 0.45], [600, 0.4], [840, 0.48]],
    live: [[230, 770], [980, 776], [1010, 790]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${grad('#E46A6A')}" stroke="#A94545" stroke-width="2"/><circle cx="${x - 3}" cy="${y - 3}" r="2.6" fill="#fff" opacity=".6"/>`).join(''),
  }),
  kitchen: () => {
    const wall = lin('ml-wall-k', [[0, '#FFF6E4'], [1, '#F6E0BC']]);
    let tiles = '';
    for (let x = 80; x < 1200; x += 80) tiles += `<path d="M${x} 0 V600" stroke="#EFD8B0" stroke-width="2.5"/>`;
    for (let y = 80; y < 600; y += 80) tiles += `<path d="M0 ${y} H1200" stroke="#EFD8B0" stroke-width="2.5"/>`;
    const jar = (x, c, hh) => `<rect x="${x}" y="${210 - hh}" width="44" height="${hh}" rx="9" ${P(c, 2.5)}/><rect x="${x - 3}" y="${204 - hh}" width="50" height="12" rx="4" ${P('#C8925E', 2.5)}/><rect x="${x + 8}" y="${222 - hh}" width="8" height="${hh - 26}" rx="4" fill="#fff" opacity=".4"/>`;
    const still = `<rect width="1200" height="800" fill="${wall}"/><g filter="${rough()}">${tiles}`
      + `<path d="M880 260 L760 610 H1060 L1120 260 Z" fill="#FFF8E8" opacity=".5"/>`
      + jar(84, '#F2B5A0', 62) + jar(140, '#B9E3A0', 78) + jar(196, '#FFE7A0', 54)
      + `<path d="M262 210 Q262 168 300 168 Q338 168 338 210 Z" ${P('#7CC8F0', 2.5)}/><path d="M336 186 Q362 178 360 160" ${L(lineOf('#7CC8F0'), 5)}/><circle cx="300" cy="164" r="6" ${P('#7CC8F0', 2)}/>`
      + `<rect x="60" y="210" width="310" height="16" rx="6" ${P('#C8925E', 2.5)}/><path d="M90 226 L100 250 M340 226 L330 250" ${L('#A0673A', 6)}/>`
      + `<rect x="-10" y="630" width="1220" height="190" fill="${grad('#D49A60')}" stroke="#9A6B45" stroke-width="3"/>`
      + [40, 330, 620, 910].map((x) => `<rect x="${x}" y="660" width="250" height="150" rx="10" fill="none" stroke="#B07E4E" stroke-width="3"/><circle cx="${x + 125}" cy="690" r="7" ${P('#E8C66A', 2)}/>`).join('')
      + `<rect x="-10" y="598" width="1220" height="34" rx="6" ${P('#F0C996', 3)}/></g>`;
    const live = windowLive('kitchen', 880, 60, 240, 190, '#9FD3A8')
      + '<g transform="translate(362 158)">' + [0, 1].map((k) => `<path class="steam" style="${timing(k, 4.2, 1.4)}" d="M${k * 10} 0 q-8 -12 0 -24 q8 -12 0 -24" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('') + '</g>'
      + plant(1140, 602, 0.9, 2) + motes(5, 12, 760, 1100, 300, 600, '#FFF6D6');
    return scene(still, live);
  },
  playroom: () => {
    const wall = lin('ml-wall-p', [[0, '#EDF1FF'], [1, '#D8E1FA']]);
    let paper = '';
    for (let y = 70; y < 600; y += 96) for (let x = (y / 96) % 2 ? 48 : 96; x < 1200; x += 96) paper += `<path d="${starPath(x, y, 9, 4)}" fill="#CBD6F6"/>`;
    let planks = '';
    for (let y = 650; y < 800; y += 44) planks += `<path d="M0 ${y} H1200" stroke="#C99258" stroke-width="2.5"/>`;
    const still = `<rect width="1200" height="800" fill="${wall}"/><g filter="${rough()}">${paper}`
      + `<rect x="-10" y="600" width="1220" height="220" fill="${G.wood()}" stroke="#B57E4A" stroke-width="3"/>${planks}`
      + `<rect x="-10" y="590" width="1220" height="16" rx="4" fill="#F7F2FF" stroke="#B9B2D6" stroke-width="2.5"/>`
      + `<ellipse cx="600" cy="722" rx="430" ry="62" fill="${grad('#F7B5C6')}" stroke="#C9768A" stroke-width="3"/><ellipse cx="600" cy="722" rx="360" ry="46" fill="none" stroke="#FFE3EA" stroke-width="6"/><ellipse cx="600" cy="722" rx="290" ry="34" fill="none" stroke="#E995AA" stroke-width="5"/>`
      + `<g transform="translate(1110 600)"><rect x="-60" y="-96" width="120" height="96" rx="10" ${P('#9FC7F0', 3)}/><path d="M-60 -64 H60" ${L(lineOf('#9FC7F0'), 3)}/><circle cx="-30" cy="-110" r="18" ${P('#FFCF4D', 2.5)}/><rect x="0" y="-130" width="40" height="36" rx="6" ${P('#F48FB1', 2.5)}/></g></g>`;
    const string = 'M-20 30 Q600 120 1220 30';
    const flags = range(11).map((k) => {
      const t = (k + 0.5) / 11;
      const fx = -20 + 1240 * t;
      const fy = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 120 + t * t * 30;
      const c = SHADES[k % SHADES.length];
      return `<g transform="translate(${fx.toFixed(0)} ${fy.toFixed(0)})"><g class="flag" style="${timing(k, 3.4, 1.6)}"><path d="M-24 0 H24 L0 44 Z" ${P(c, 2.5)}/></g></g>`;
    }).join('');
    const mobile = `<g transform="translate(980 120)"><g class="swing" style="animation-duration:7s"><path d="M0 -120 V0 M-70 0 H70 M-70 0 V40 M0 0 V70 M70 0 V34" ${L('#9A8CB8', 2.5)}/><path d="${starPath(-70, 56, 20, 9)}" ${P('#FFD166', 2.5)}/><circle cx="0" cy="86" r="16" ${P('#F5A9BC', 2.5)}/><path d="M60 34 Q70 60 80 34 Q86 50 70 66 Q54 50 60 34 Z" ${P('#9FD3A8', 2.5)}/></g></g>`;
    return scene(still, `<path d="${string}" ${L('#9A8CB8', 3)}/>${flags}${mobile}${motes(9, 12, 40, 1160, 260, 600, '#FFFFFF')}`);
  },
  mirror: () => {
    const wall = lin('ml-wall-m', [[0, '#E6F6FB'], [1, '#CBE8F3']]);
    let tiles = '';
    for (let x = 100; x < 1200; x += 100) tiles += `<path d="M${x} 0 V690" stroke="#BCDFEC" stroke-width="2.5"/>`;
    for (let y = 100; y < 690; y += 100) tiles += `<path d="M0 ${y} H1200" stroke="#BCDFEC" stroke-width="2.5"/>`;
    const glass = lin('ml-mirror', [[0, '#F7FCFF'], [1, '#D3EBF5']]);
    const still = `<rect width="1200" height="800" fill="${wall}"/><g filter="${rough()}">${tiles}`
      + `<ellipse cx="600" cy="400" rx="300" ry="362" fill="${grad('#C8925E')}" stroke="#8A5A33" stroke-width="3"/><ellipse cx="600" cy="400" rx="276" ry="338" fill="${glass}" stroke="#9FC7D9" stroke-width="3"/>`
      + '<path d="M410 250 L480 170 L500 186 L430 266 Z M440 300 L520 210 L530 220 L450 310 Z" fill="#FFFFFF" opacity=".7"/>'
      + `<rect x="-10" y="690" width="1220" height="130" fill="${grad('#AED9EA')}" stroke="#86BCD3" stroke-width="3"/>`
      + `<rect x="420" y="712" width="360" height="60" rx="26" fill="${grad('#F7B5C6')}" stroke="#C9768A" stroke-width="3"/><path d="M450 730 H750 M450 752 H750" ${L('#FFE3EA', 4)}/></g>`;
    const r = rng(17);
    let bubbles = '';
    for (let k = 0; k < 12; k++) {
      const x = k % 2 ? 60 + r() * 240 : 900 + r() * 250;
      const y = 520 + r() * 220;
      const s = 8 + r() * 14;
      bubbles += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><g class="bub" style="animation-duration:${(9 + r() * 7).toFixed(1)}s;animation-delay:${(-r() * 14).toFixed(1)}s"><circle r="${s.toFixed(1)}" fill="#FFFFFF" fill-opacity=".28" stroke="#8CC6E0" stroke-width="2"/><ellipse cx="${(-s * 0.35).toFixed(1)}" cy="${(-s * 0.4).toFixed(1)}" rx="${(s * 0.28).toFixed(1)}" ry="${(s * 0.16).toFixed(1)}" fill="#fff" transform="rotate(-35)"/></g></g>`;
    }
    return scene(still, plant(120, 692, 1.1, 4, '#7CC8F0') + bubbles);
  },
  table: () => {
    const wood = lin('ml-table', [[0, '#F3D6A8'], [1, '#E2B47C']]);
    const r = rng(29);
    let grain = '';
    for (let y = 0; y < 800; y += 100) {
      grain += `<path d="M-10 ${y} H1210" stroke="#C9965E" stroke-width="3"/>`;
      for (let k = 0; k < 3; k++) {
        const yy = y + 22 + k * 26 + r() * 8;
        const x0 = r() * 600;
        grain += `<path d="M${x0.toFixed(0)} ${yy.toFixed(0)} q120 -8 240 0 t240 0" stroke="#D9A86E" stroke-width="2.5" fill="none" opacity=".6"/>`;
      }
      grain += `<ellipse cx="${(80 + r() * 1040).toFixed(0)}" cy="${y + 50}" rx="14" ry="7" fill="none" stroke="#C9965E" stroke-width="2.5" opacity=".7"/>`;
    }
    const still = `<rect width="1200" height="800" fill="${wood}"/><g filter="${rough()}">${grain}</g><path d="M760 -10 L1210 -10 L1210 420 Z" fill="#FFF8E8" opacity=".22"/>`;
    return scene(still, motes(31, 14, 600, 1180, 40, 600, '#FFF6D6'));
  },
  baskets: () => {
    const wall = lin('ml-wall-b', [[0, '#FFEFE8'], [1, '#F9D8CD']]);
    let stripes = '';
    for (let x = 30; x < 1200; x += 60) stripes += `<path d="M${x} 0 V560" stroke="#F6CFC2" stroke-width="14" opacity=".6"/>`;
    let planks = '';
    for (let y = 600; y < 800; y += 46) planks += `<path d="M0 ${y} H1200" stroke="#C99258" stroke-width="2.5"/>`;
    const still = `<rect width="1200" height="800" fill="${wall}"/><g filter="${rough()}">${stripes}`
      + `<rect x="-10" y="556" width="1220" height="264" fill="${G.wood()}" stroke="#B57E4A" stroke-width="3"/>${planks}`
      + `<rect x="-10" y="548" width="1220" height="16" rx="4" fill="#FFF7F2" stroke="#D9B3A6" stroke-width="2.5"/></g>`;
    return scene(still, windowLive('baskets', 900, 70, 220, 170, '#CDB8EC') + plant(80, 556, 1.05, 6) + motes(13, 12, 600, 1180, 260, 540, '#FFF6D6'));
  },
  country: () => {
    const lawn = lin('ml-lawn', [[0, '#B5DB8E'], [1, '#8EC46C']]);
    const r = rng(41);
    let patches = '';
    for (let k = 0; k < 16; k++) patches += `<ellipse cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 800).toFixed(0)}" rx="${(60 + r() * 90).toFixed(0)}" ry="${(30 + r() * 40).toFixed(0)}" fill="${k % 2 ? '#C6E5A2' : '#86BA65'}" opacity=".45"/>`;
    const bush = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="8" rx="70" ry="16" fill="#3F6B30" opacity=".22"/><g transform="translate(0 40)">${canopyShape(G.canopy(), 'stroke="#4C7F3E" stroke-width="6"')}${canopyShape(G.canopy())}</g></g>`;
    const still = `<rect width="1200" height="800" fill="${lawn}"/><g filter="${rough()}">${patches}`
      + strokes(43, 90, 0, 1200, 10, 795, '#5E9147', 0.5)
      + `<ellipse cx="1130" cy="770" rx="150" ry="70" fill="${grad('#8FCDE8')}" stroke="#5E9FBF" stroke-width="3"/><path d="M1060 760 q14 -6 28 0 M1110 790 q14 -6 28 0" ${L('#FFFFFF', 3)} opacity=".7"/>`
      + bush(60, 40, 0.75) + bush(1150, 60, 0.6) + '</g>';
    const fl = [[40, 220, 34, 'pink'], [110, 330, 30, 'yellow'], [50, 470, 36, 'white'], [140, 560, 30, 'lilac'], [1120, 300, 34, 'yellow'], [1170, 430, 30, 'pink'], [1110, 560, 36, 'white'], [1040, 760, 32, 'lilac'], [430, 790, 34, 'pink'], [250, 780, 30, 'yellow']];
    const tf = [[90, 260, 0.9], [30, 380, 0.8], [120, 640, 1], [1160, 250, 0.9], [1080, 470, 0.8], [1170, 640, 1], [560, 100, 0.8], [700, 96, 0.8], [880, 790, 1]];
    return scene(still, tufts(tf) + flowers(fl, 2) + butterfly(70, 1, '#CDB8EC', '#F5C8E0', '#9479BE') + motes(47, 12, 10, 1190, 100, 790));
  },
  night: () => {
    const sky = lin('ml-night', [[0, '#1E2350'], [0.6, '#363C74'], [1, '#56578C']]);
    const far = hill(520, 28, 61);
    const mid = hill(600, 22, 63);
    const ground = hill(668, 10, 65);
    const house = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-34 0 V-40 L0 -66 L34 -40 V0 Z" fill="#4A4A7E" stroke="#34346A" stroke-width="3" stroke-linejoin="round"/><path d="M-42 -36 L0 -72 L42 -36" fill="none" stroke="#34346A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><rect x="-11" y="-34" width="22" height="20" rx="3" fill="#FFD98A"/><path d="M0 -34 V-14 M-11 -24 H11" stroke="#C9A24E" stroke-width="2"/></g>`;
    const still = `<rect width="1200" height="800" fill="${sky}"/><g filter="${rough()}">`
      + `<path d="${far.d}" fill="${lin('ml-nfar', [[0, '#4B5089'], [0.5, '#40457B']])}" stroke="#34386B" stroke-width="3"/>`
      + house(830, far.at(830) + 8) + farTree(380, far.at(380) + 10, 0.45, '#3D4A78', '#30396A', '#3A3558')
      + `<path d="${mid.d}" fill="${lin('ml-nmid', [[0, '#3A4677'], [0.5, '#323D6A']])}" stroke="#2A3360" stroke-width="3"/>`
      + `<path d="${ground.d}" fill="${lin('ml-nground', [[0, '#2F3B66'], [0.7, '#263156']])}" stroke="#222B4E" stroke-width="3"/>`
      + strokes(67, 40, 0, 1200, 690, 798, '#41507E', 0.6) + '</g>';
    const stars = [[120, 90], [300, 180], [480, 70], [640, 140], [860, 60], [1040, 250], [200, 330], [980, 400], [700, 280], [1120, 120], [80, 470], [560, 380], [420, 260]]
      .map(([x, y], k) => { const s = 7 + (k % 3) * 3; return `<path class="twinkle" style="${timing(k, 2.6, 1.6)}" d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z" fill="#FFE9A8"/>`; }).join('');
    const moon = `<circle class="glow" cx="960" cy="150" r="150" fill="${rad('ml-moonglow', [[0, '#FFF4CF', 0.55], [0.5, '#FFF0C2', 0.18], [1, '#FFF0C2', 0]])}"/><circle cx="960" cy="150" r="58" fill="${grad('#FFE9A8')}" stroke="#E0C177" stroke-width="3"/><circle cx="940" cy="135" r="11" fill="#F1D58C" opacity=".7"/><circle cx="978" cy="170" r="8" fill="#F1D58C" opacity=".7"/><circle cx="975" cy="125" r="5" fill="#F1D58C" opacity=".7"/>`;
    const glow = rad('ml-firefly', [[0, '#FFF6A8', 0.9], [0.4, '#FFE97A', 0.35], [1, '#FFE97A', 0]]);
    const rr = rng(71);
    let flies = '';
    for (let k = 0; k < 14; k++) flies += `<g transform="translate(${(40 + rr() * 1120).toFixed(0)} ${(420 + rr() * 360).toFixed(0)})"><g class="firefly" style="animation-duration:${(7 + rr() * 6).toFixed(1)}s;animation-delay:${(-rr() * 12).toFixed(1)}s"><circle r="14" fill="${glow}"/><circle r="3" fill="#FFF8C8"/></g></g>`;
    return scene(still, stars + moon + tree(130, 690, 1.1, 1, { night: true }) + flies, 'night');
  },
  // Treasure hunt: sky and open sea (the game draws its own sandy path on top, so the sea
  // shows through every gap).
  beach: () => {
    const sea = lin('ml-sea', [[0, '#8FD0E6'], [0.35, '#5DB3D6'], [1, '#2F86B8']]);
    const far = `<path d="M60 336 Q140 286 230 300 Q300 290 360 336 Z" fill="${lin('ml-isle', [[0, '#B9D9A0'], [1, '#93BE7C']])}" stroke="#7FA86A" stroke-width="3"/>`
      + `<path d="M190 300 Q186 262 196 238" ${L('#9A7652', 5)}/><path d="M196 238 q-26 -6 -40 8 M196 238 q-18 -20 -40 -18 M196 238 q16 -22 40 -16 M196 238 q26 0 36 16" ${L('#6E9E58', 5)}/>`;
    const still = `<rect width="1200" height="800" fill="${G.sky()}"/><g filter="${rough()}">${far}`
      + `<path d="M900 336 Q960 318 1030 324 Q1090 318 1140 336 Z" fill="#B9D9A0" stroke="#7FA86A" stroke-width="3" opacity=".8"/>`
      + `<rect x="-10" y="332" width="1220" height="480" fill="${sea}"/>`
      + strokes(83, 26, 0, 1200, 360, 780, '#BFE6F5', 0.55, 'q10 -6 20 0 t20 0') + '</g>';
    const waves = range(6).map((k) => `<g transform="translate(${(k * 211) % 1200} ${380 + k * 64})"><g class="wave" style="${timing(k, 5, 2)}"><path d="M0 0 q14 -9 28 0 t28 0 t28 0" ${L('#FFFFFF', 3.4)} opacity=".6"/></g></g>`).join('');
    const gull = (x, y, k) => `<g transform="translate(${x} ${y})"><g class="bfly-y" style="${timing(k, 5, 2)}"><path d="M-16 0 q8 -10 16 0 q8 -10 16 0" ${L('#5A5468', 3)}/></g></g>`;
    const live = sun(1040, 120) + CLOUDS.slice(0, 3).map(([x, y, s], i) => cloud(x, y - 20, s * 0.8, i)).join('') + waves + gull(640, 150, 1) + gull(700, 190, 2) + gull(420, 110, 3);
    return scene(still, live);
  },
  // Race: a park with a three-lane running track.
  park: () => meadow({
    seed: 77,
    far: 330,
    mid: 380,
    ground: 420,
    sun: [1060, 100],
    clouds: [[140, 70, 0.7], [520, 50, 0.5], [820, 120, 0.45]],
    farTrees: [[260, 0.4], [700, 0.36], [980, 0.42]],
    trees: [],
    flowers: [],
    tufts: [[40, 446, 0.8], [400, 444, 0.7], [760, 446, 0.8], [1160, 446, 0.7]],
    bfly: 260,
    stillTop: `<rect x="-10" y="452" width="1220" height="360" fill="${lin('ml-track', [[0, '#E39A6E'], [1, '#C9764E']])}" stroke="#A85E3A" stroke-width="3"/>`
      + `<path d="M-10 452 H1210" stroke="#F4E6C8" stroke-width="8"/><path d="M-10 568 H1210 M-10 684 H1210" stroke="#FFF6E4" stroke-width="5" stroke-dasharray="30 16" opacity=".9"/>`
      + `<path d="M150 456 V800" stroke="#FFF6E4" stroke-width="6"/>`
      + range(12).map((r) => range(2).map((c) => `<rect x="${1066 + c * 14}" y="${456 + r * 29}" width="14" height="29" fill="${(r + c) % 2 ? '#3A3A48' : '#FFFFFF'}"/>`).join('')).join(''),
  }),
};
export const PLACE_COLOR = {
  sky: '#AED6E8', choose: '#AED6E8', farm: '#AED6E8', orchard: '#AED6E8', kitchen: '#F6E0BC', playroom: '#DCE4FB',
  mirror: '#D3EDF6', table: '#EBC591', baskets: '#FADCD2', country: '#A3D07F', night: '#232850',
  beach: '#5DB3D6', park: '#D58A60',
};
export const placeSVG = (name) => PLACE[name]();

// ---------------------------------------------------------------- treasure chest
// Drawn in a 200 x 120 box. open: lid up with gold inside; locked: a padlock on the front.
export function chestSVGInner({ open = false, locked = false } = {}) {
  const wood = '#B8743F';
  const band = '#F2C14E';
  const lid = open
    ? `<path d="M44 52 L52 14 Q100 2 148 14 L156 52 Z" ${P(shade(wood, 0.9), 2.6)}/><path d="M60 20 Q100 10 140 20" ${L(band, 6)}/>`
      + `<ellipse cx="100" cy="56" rx="54" ry="12" fill="${grad('#FFD95A')}" stroke="#C99630" stroke-width="2.4"/>${[[76, 50], [96, 46], [118, 50], [86, 56], [108, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" ${P('#FFCF4D', 1.8)}/>`).join('')}<path d="M126 38 l8 -10 8 10 -8 12 z" ${P('#5BC0EB', 1.8)}/><path d="M64 42 l6 -8 6 8 -6 9 z" ${P('#EF476F', 1.8)}/>`
    : `<path d="M40 58 Q40 22 100 20 Q160 22 160 58 Z" ${P(shade(wood, 0.95), 2.6)}/><path d="M72 22 V58 M128 22 V58" ${L(band, 7)}/>`;
  const lock = locked ? `<rect x="88" y="68" width="24" height="22" rx="4" ${P('#9AA0B4', 2.2)}/><path d="M93 68 V62 a7 7 0 0 1 14 0 V68" ${L('#7A8096', 3.4)}/><circle cx="100" cy="78" r="3" fill="#4A4E60"/>` : `<rect x="92" y="62" width="16" height="16" rx="3" ${P(band, 2)}/>`;
  return `<rect x="40" y="56" width="120" height="54" rx="6" ${P(wood, 2.6)}/><path d="M72 56 V110 M128 56 V110" ${L(band, 7)}/><path d="M44 72 H156 M44 92 H156" ${L(shade(wood, 0.8), 2)} opacity=".5"/>${lid}${lock}`;
}
export const chestSVG = (o) => `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${chestSVGInner(o)}</svg>`;

// ---------------------------------------------------------------- menu cards
const numTxt = (x, y, t) => `<text x="${x}" y="${y}" font-family="Fredoka, system-ui, sans-serif" font-size="26" font-weight="700" fill="#5A4632" text-anchor="middle">${t}</text>`;
export const CARD_ART = {
  words: () => `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${PIC.dog()}</svg>`,
  count: () => `<svg viewBox="0 0 220 120" width="100%" height="100%" aria-hidden="true">${[40, 110, 180].map((x, i) => `<g transform="translate(${x - 40} -4) scale(.8)">${PIC.apple()}</g>${numTxt(x, 114, i + 1)}`).join('')}</svg>`,
  shapes: () => `<svg viewBox="0 0 120 100" width="100%" height="100%" aria-hidden="true"><circle cx="30" cy="64" r="20" ${P('#4C8DF0', 2.6)}/><path d="M60 24 L84 64 H36 Z" ${P('#FFD166', 2.6)}/><rect x="72" y="46" width="38" height="38" rx="5" ${P('#EF476F', 2.6)}/></svg>`,
  colors: () => `<svg viewBox="0 0 220 120" width="100%" height="100%" aria-hidden="true">${[['#EF476F', 40], ['#4C8DF0', 110], ['#FFD166', 180]].map(([c, x]) => `<circle cx="${x}" cy="38" r="17" ${P(c, 2.6)}/><circle cx="${x - 6}" cy="32" r="4" fill="#fff" opacity=".5"/><path d="M${x - 30} 62 H${x + 30} L${x + 22} 110 Q${x + 21} 114 ${x + 17} 114 H${x - 17} Q${x - 21} 114 ${x - 22} 110 Z" ${P(c, 2.6)}/><path d="M${x - 25} 78 H${x + 25} M${x - 23} 94 H${x + 23}" ${L(shade(c, 0.85), 3)}/>`).join('')}</svg>`,
  treasure: () => `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true"><ellipse cx="100" cy="112" rx="84" ry="8" fill="#5A3E22" opacity=".18"/>${chestSVGInner({ open: true })}</svg>`,
  race: () => `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true"><rect x="4" y="40" width="192" height="76" rx="10" ${P('#E39A6E', 2.6)}/><path d="M8 66 H192 M8 92 H192" ${L('#FFF6E4', 3)} stroke-dasharray="12 8"/>${[0, 1, 2, 3, 4, 5].map((r) => `<rect x="${158 + (r % 2) * 9}" y="${42 + r * 12.3}" width="9" height="12.3" fill="#3A3A48"/>`).join('')}<path d="M150 40 V6" ${L('#8A6A4A', 3.4)}/><path d="M150 8 L182 16 L150 26 Z" ${P('#EF476F', 2.2)}/>${[['#2EC4B6', 60, 58], ['#A06CF0', 96, 84], ['#FF9542', 40, 108]].map(([c, x, y]) => `<circle cx="${x}" cy="${y - 10}" r="11" ${P(c, 2.2)}/><circle cx="${x - 4}" cy="${y - 12}" r="2.4" fill="#2B2240"/><circle cx="${x + 4}" cy="${y - 12}" r="2.4" fill="#2B2240"/><path d="M${x - 28} ${y - 14} h12 M${x - 30} ${y - 6} h14" ${L('#FFF6E4', 3)}/>`).join('')}</svg>`,
  train: () => `<svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true"><path d="M6 108 H194" ${L('#A87850', 4)}/><path d="M14 112 V104 M44 112 V104 M74 112 V104 M104 112 V104 M134 112 V104 M164 112 V104" ${L('#A87850', 3)}/><rect x="36" y="44" width="70" height="46" rx="10" ${P('#E85D6A', 2.6)}/><rect x="96" y="24" width="56" height="66" rx="10" ${P('#4C8DF0', 2.6)}/><rect x="108" y="34" width="32" height="24" rx="6" fill="${grad('#DDF3FF')}" stroke="${lineOf('#4C8DF0')}" stroke-width="2.4"/><rect x="48" y="22" width="18" height="24" rx="4" ${P('#5A5468', 2.6)}/><circle cx="57" cy="12" r="7" fill="#fff" opacity=".8"/><circle cx="68" cy="4" r="5" fill="#fff" opacity=".6"/>${[60, 96, 134].map((x) => `<circle cx="${x}" cy="96" r="13" ${P('#FFD166', 2.6)}/><circle cx="${x}" cy="96" r="4" fill="${lineOf('#FFD166')}"/>`).join('')}</svg>`,
};

// ---------------------------------------------------------------- train parts
export function engineSVG() {
  return `<svg viewBox="0 0 70 44" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><rect x="3" y="5" width="56" height="34" rx="9" ${P('#E85D6A', 2)}/><rect x="50" y="8" width="16" height="28" rx="7" ${P('#5A5468', 2)}/><rect x="6" y="9" width="20" height="26" rx="5" ${P('#4C8DF0', 2)}/><circle cx="42" cy="22" r="7" ${P('#5A5468', 2)}/><circle cx="42" cy="22" r="2.6" fill="#9A94A8"/><circle cx="63" cy="22" r="3.5" fill="#FFE27A" stroke="#C9A24E" stroke-width="1"/><rect x="30" y="8" width="14" height="4" rx="2" fill="#fff" opacity=".4"/></svg>`;
}
export function wagonSVG(color, animal) {
  return `<svg viewBox="0 0 64 44" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><rect x="3" y="5" width="58" height="34" rx="8" ${P(color, 2)}/><rect x="8" y="9" width="48" height="26" rx="5" fill="#FFFBF2" opacity=".55"/><svg x="14" y="4" width="36" height="36" viewBox="0 0 100 100">${PIC[animal]()}</svg></svg>`;
}
// A station. Options: roof colour (wall gets a pale tint of it) and a round sign with a picture.
// (The option is "pale", not "tint": a "tint" option would hide the tint() helper below.)
export function stationSVG({ roof = '#E85D6A', sign = null, pale = false } = {}) {
  const wall = roof === '#E85D6A' && !pale ? '#FFD98A' : mix(roof, '#FFFFFF', 0.58);
  const front = sign
    ? `<circle cx="80" cy="50" r="34" ${P('#FFFBF2', 2.5)}/><svg x="51" y="21" width="58" height="58" viewBox="0 0 100 100" style="overflow:visible">${PIC[sign]()}</svg>`
    : `<circle cx="80" cy="56" r="13" ${P('#FFFBF2', 2.5)}/><path d="M80 48 V56 H86" ${L(DK, 2.6)}/>`;
  return `<svg viewBox="0 0 160 190" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><ellipse cx="80" cy="182" rx="74" ry="9" fill="#3F6B30" opacity=".22"/><rect x="12" y="70" width="136" height="110" rx="6" ${P(wall, 3)}/><path d="M2 76 L80 16 L158 76 Z" ${P(roof, 3)}/><path d="M24 70 L80 28 L136 70" ${L(tint(roof, 0.3), 3)} opacity=".7"/><rect x="58" y="112" width="44" height="68" rx="4" ${P('#B07E4E', 3)}/><circle cx="92" cy="148" r="3" fill="#F6C453"/><rect x="24" y="96" width="26" height="26" rx="4" fill="${grad('#DDF3FF')}" stroke="${lineOf(wall)}" stroke-width="3"/><rect x="110" y="96" width="26" height="26" rx="4" fill="${grad('#DDF3FF')}" stroke="${lineOf(wall)}" stroke-width="3"/>${front}</svg>`;
}
export function tunnelSVG() {
  return `<svg viewBox="0 0 120 130" width="100%" height="100%" aria-hidden="true" style="overflow:visible"><path d="M4 126 Q4 8 60 6 Q116 8 116 126 Z" ${P('#AEB4C8', 3)}/><path d="M28 126 V70 Q28 40 60 40 Q92 40 92 70 V126 Z" fill="${lin('ml-tunnel', [[0, '#2E2A42'], [1, '#4A4560']])}" stroke="#6E7390" stroke-width="3"/><path d="M14 44 h14 M76 22 h16 M94 70 h14 M8 90 h14 M98 100 h12" ${L('#8C92AA', 4)}/><path d="M30 14 q30 -10 60 0" ${L('#9BD07A', 6)}/></svg>`;
}

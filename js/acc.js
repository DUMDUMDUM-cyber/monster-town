// Accessories (Paket 2, DESAIN.md 8.1): clothes and toys found in the treasure chests.
// Each item is drawn round the rig's attachment points (art.js ANCHOR / .att-* groups), so it
// rides along with that body part during every activity. One item per slot.
import { grad, lineOf, ANCHOR } from './art.js';

const P = (c, w = 2.2) => `fill="${grad(c)}" stroke="${lineOf(c)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const L = (c, w = 2.2) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// How each character is built near the attachment points.
// k: head size, eye: half the distance between the eyes, er: eye radius,
// neck: half the body width under the chin, side: half the body width at the back point.
const FIT = {
  moko: { k: 1, eye: 24, er: 21, neck: 58, side: 72 },
  gumi: { k: 1, eye: 22, er: 23, neck: 62, side: 70 },
  tobi: { k: 0.86, eye: 22, er: 23, neck: 48, side: 54 },
};

export const SLOTS = ['head', 'eyes', 'neck', 'other'];

const flower = (x, y, r, c) => [0, 72, 144, 216, 288].map((a) => {
  const t = ((a - 90) * Math.PI) / 180;
  return `<circle cx="${(x + Math.cos(t) * r).toFixed(1)}" cy="${(y + Math.sin(t) * r).toFixed(1)}" r="${(r * 0.85).toFixed(1)}" ${P(c, 1.4)}/>`;
}).join('') + `<circle cx="${x}" cy="${y}" r="${(r * 0.7).toFixed(1)}" ${P('#FFCF4D', 1.2)}/>`;

const starD = (x, y, R, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + 'Z';
};

const hat = (f, inner) => `<g transform="scale(${f.k})">${inner}</g>`;
const lens = (f, draw) => draw(-f.eye) + draw(f.eye);

// parts(f) returns markup per attachment point: head, eyes, neck, back, footL, footR.
export const ACC = [
  // ---- head
  { id: 'party', slot: 'head', name: 'party hat', vb: '50 -30 100 90', parts: (f) => ({ head: hat(f, `<g transform="rotate(-8)"><path d="M-28 12 L0 -62 L28 12 Q0 20 -28 12 Z" ${P('#FF8FB1', 2.4)}/><path d="M-19 -10 L13 -4 M-12 -32 L9 -28 M-24 6 L20 12" ${L('#FFE7A0', 4)}/><circle cx="0" cy="-64" r="9" ${P('#FFD166', 2)}/></g>`) }) },
  { id: 'crown', slot: 'head', name: 'crown', vb: '50 -10 100 80', parts: (f) => ({ head: hat(f, `<path d="M-38 12 L-40 -22 L-20 -2 L0 -34 L20 -2 L40 -22 L38 12 Q0 20 -38 12 Z" ${P('#FFCF4D', 2.4)}/><circle cx="0" cy="2" r="6" ${P('#EF476F', 1.6)}/><circle cx="-22" cy="6" r="4.5" ${P('#3A86FF', 1.4)}/><circle cx="22" cy="6" r="4.5" ${P('#06D6A0', 1.4)}/><circle cx="0" cy="-36" r="4" ${P('#FFF3C4', 1.2)}/><circle cx="-40" cy="-24" r="3.5" ${P('#FFF3C4', 1.2)}/><circle cx="40" cy="-24" r="3.5" ${P('#FFF3C4', 1.2)}/>`) }) },
  { id: 'pirate', slot: 'head', name: 'pirate hat', vb: '36 -10 128 80', parts: (f) => ({ head: hat(f, `<path d="M-60 12 Q-56 -36 0 -42 Q56 -36 60 12 Q0 -4 -60 12 Z" ${P('#3A3A48', 2.4)}/><path d="M-58 8 Q0 -8 58 8" ${L('#FFCF4D', 4)}/><circle cx="0" cy="-20" r="9" fill="#FFF8EE"/><circle cx="-3" cy="-21" r="2" fill="#3A3A48"/><circle cx="3" cy="-21" r="2" fill="#3A3A48"/><path d="M-12 -6 L12 4 M12 -6 L-12 4" ${L('#FFF8EE', 3.4)}/>`) }) },
  { id: 'cowboy', slot: 'head', name: 'cowboy hat', vb: '30 -10 140 80', parts: (f) => ({ head: hat(f, `<ellipse cx="0" cy="8" rx="66" ry="13" ${P('#C08048', 2.4)}/><path d="M-32 6 Q-36 -42 -12 -40 Q0 -30 12 -40 Q36 -42 32 6 Q0 12 -32 6 Z" ${P('#C08048', 2.4)}/><path d="M-32 -2 Q0 6 32 -2" ${L('#7A4A2A', 6)}/>`) }) },
  { id: 'flowers', slot: 'head', name: 'flower crown', vb: '40 0 120 60', parts: (f) => ({ head: hat(f, `<path d="M-54 18 Q0 -6 54 18" ${L('#4E8F3E', 4)}/>${[[-50, 14, '#FF8FB1'], [-28, 4, '#FFF8EA'], [0, 0, '#CDB8EC'], [28, 4, '#FFE7A0'], [50, 14, '#FF8FB1']].map(([x, y, c]) => `<ellipse cx="${x + 10}" cy="${y + 6}" rx="8" ry="4" ${P('#7CC46A', 1.2)} transform="rotate(-20 ${x + 10} ${y + 6})"/>${flower(x, y, 7, c)}`).join('')}`) }) },
  { id: 'astro', slot: 'head', name: 'space helmet', vb: '40 -30 120 100', parts: (f) => ({ head: hat(f, `<path d="M-50 16 Q-52 -40 0 -42 Q52 -40 50 16 Q0 26 -50 16 Z" ${P('#F2F4FA', 2.4)}/><path d="M-48 4 Q0 14 48 4" ${L('#3A86FF', 7)}/><path d="M-30 -24 Q-20 -34 -6 -36" ${L('#FFFFFF', 5)} opacity=".8"/><path d="M0 -42 V-62" ${L('#8C92AA', 3)}/><circle cx="0" cy="-66" r="7" ${P('#EF476F', 1.8)}/>`) }) },
  { id: 'bow', slot: 'head', name: 'hair bow', vb: '56 0 88 60', parts: (f) => ({ head: hat(f, `<path d="M0 0 L-32 -20 Q-40 0 -32 18 Z M0 0 L32 -20 Q40 0 32 18 Z" ${P('#FF6FA0', 2.4)}/><path d="M-24 -10 Q-28 0 -24 9 M24 -10 Q28 0 24 9" ${L('#FFC2D8', 2.6)}/><circle cx="0" cy="0" r="9" ${P('#E2457E', 2)}/>`) }) },
  { id: 'beanie', slot: 'head', name: 'warm hat', vb: '40 -30 120 90', parts: (f) => ({ head: hat(f, `<path d="M-48 14 Q-50 -40 0 -42 Q50 -40 48 14 Z" ${P('#7BC4E8', 2.4)}/><rect x="-52" y="2" width="104" height="18" rx="9" ${P('#4E9CC8', 2.2)}/><path d="M-30 -24 V0 M-10 -32 V0 M10 -32 V0 M30 -24 V0" ${L('#A8DCF4', 3)}/><circle cx="0" cy="-48" r="12" ${P('#FFF8EE', 2)}/>`) }) },
  { id: 'chef', slot: 'head', name: 'chef hat', vb: '44 -50 112 110', parts: (f) => ({ head: hat(f, `<rect x="-30" y="-16" width="60" height="30" rx="6" ${P('#FFFFFF', 2.4)}/><path d="M-30 -14 Q-56 -30 -38 -54 Q-26 -72 -6 -60 Q4 -80 24 -64 Q48 -66 44 -40 Q56 -24 30 -14 Z" ${P('#FFFFFF', 2.4)}/><path d="M-14 -14 V4 M0 -14 V6 M14 -14 V4" ${L('#D8D8E4', 2.4)}/>`) }) },
  { id: 'bunny', slot: 'head', name: 'bunny ears', vb: '50 -60 100 120', parts: (f) => ({ head: hat(f, `<path d="M-40 14 Q-40 -6 40 14" ${L('#FF8FB1', 6)}/>${[-1, 1].map((s) => `<g transform="rotate(${s * 12})"><ellipse cx="${s * 16}" cy="-30" rx="13" ry="38" ${P('#FFFFFF', 2.4)}/><ellipse cx="${s * 16}" cy="-28" rx="6" ry="28" fill="#FFC2D8"/></g>`).join('')}`) }) },
  { id: 'phones', slot: 'head', name: 'headphones', vb: '20 0 160 110', parts: (f) => ({ head: hat(f, `<path d="M-62 46 Q-66 -26 0 -28 Q66 -26 62 46" ${L('#5A4F7A', 9)}/>${[-1, 1].map((s) => `<rect x="${s * 66 - 13}" y="34" width="26" height="40" rx="12" ${P('#9B7BE0', 2.4)}/>`).join('')}`) }) },
  // ---- eyes
  { id: 'hearts', slot: 'eyes', name: 'heart glasses', vb: '66 78 68 48', parts: (f) => ({ eyes: `<path d="M${-f.eye + f.er - 2} -4 Q0 -10 ${f.eye - f.er + 2} -4" ${L('#E2457E', 4)}/>${lens(f, (x) => { const r = f.er; return `<path d="M${x} ${r * 0.9} C${x - r * 1.6} ${-r * 0.1} ${x - r * 0.9} ${-r * 1.2} ${x} ${-r * 0.45} C${x + r * 0.9} ${-r * 1.2} ${x + r * 1.6} ${-r * 0.1} ${x} ${r * 0.9} Z" fill="#FF8FB1" fill-opacity=".55" stroke="#E2457E" stroke-width="4" stroke-linejoin="round"/>`; })}` }) },
  { id: 'mask', slot: 'eyes', name: 'hero mask', vb: '40 70 120 64', parts: (f) => {
    const W = f.eye + f.er + 14;
    const T = f.er + 12;
    const hole = (x) => { const r = f.er * 0.92; return `M${x - r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`; };
    return { eyes: `<path fill-rule="evenodd" d="M${-W} -6 Q${-f.eye} ${-T - 6} 0 -10 Q${f.eye} ${-T - 6} ${W} -6 Q${W - 2} ${T} ${f.eye} ${T - 2} Q0 ${T - 10} ${-f.eye} ${T - 2} Q${-W + 2} ${T} ${-W} -6 Z ${hole(-f.eye)} ${hole(f.eye)}" fill="#3A86FF" stroke="#2E5FC0" stroke-width="3" stroke-linejoin="round"/><path d="M${W - 2} -6 l16 -10 M${W - 2} -2 l18 2" ${L('#2E5FC0', 4)}/>` };
  } },
  // ---- neck
  { id: 'medal', slot: 'neck', name: 'gold medal', vb: '50 130 100 90', parts: (f) => ({ neck: `<path d="M${-f.neck * 0.6} -14 L-6 26 M${f.neck * 0.6} -14 L6 26" ${L('#3A86FF', 7)}/><circle cx="0" cy="36" r="15" ${P('#FFCF4D', 2.4)}/><path d="${starD(0, 37, 8, 3.6)}" fill="#FFF3C4"/>` }) },
  { id: 'tie', slot: 'neck', name: 'necktie', vb: '70 140 60 80', parts: () => ({ neck: `<path d="M-9 -8 H9 L5 4 H-5 Z" ${P('#06A06A', 2.2)}/><path d="M-5 4 H5 L12 40 L0 52 L-12 40 Z" ${P('#06C47E', 2.4)}/><path d="M-7 18 L8 12 M-9 32 L10 24" ${L('#B8F2D6', 3)}/>` }) },
  { id: 'pearls', slot: 'neck', name: 'pearl necklace', vb: '36 140 128 60', parts: (f) => ({ neck: Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    return `<circle cx="${(-f.neck + t * f.neck * 2).toFixed(1)}" cy="${(-8 + Math.sin(t * Math.PI) * 18).toFixed(1)}" r="5.5" ${P('#FFF8F0', 1.6)}/>`;
  }).join('') }) },
  // ---- other
  { id: 'skates', slot: 'other', name: 'roller skates', vb: '50 190 100 60', parts: () => {
    const sk = `<path d="M-12 -24 H12 V-6 Q22 -6 24 2 V8 H-22 V-4 Z" ${P('#9B7BE0', 2.4)}/><path d="M-22 8 H24" ${L('#5A4F7A', 4)}/><circle cx="-14" cy="16" r="6" ${P('#FFCF4D', 2)}/><circle cx="14" cy="16" r="6" ${P('#FFCF4D', 2)}/>`;
    return { footL: sk, footR: sk };
  } },
  { id: 'guitar', slot: 'other', name: 'little guitar', vb: '110 50 120 150', parts: (f) => ({
    back: `<g transform="translate(${f.side - 10} 0) rotate(28)"><rect x="-5" y="-78" width="10" height="56" rx="3" ${P('#A0663A', 2)}/><rect x="-9" y="-90" width="18" height="16" rx="4" ${P('#7A4A2A', 2)}/><path d="M-26 -14 Q-34 -30 -16 -32 Q0 -28 16 -32 Q34 -30 26 -14 Q38 14 0 26 Q-38 14 -26 -14 Z" ${P('#FF9542', 2.4)}/><circle cx="0" cy="-6" r="7" fill="#7A4A2A"/></g>`,
  }) },
  // ---- eyes
  { id: 'shades', slot: 'eyes', name: 'sunglasses', vb: '68 82 64 40', parts: (f) => ({ eyes: `<path d="M${-f.eye + f.er - 4} -4 Q0 -10 ${f.eye - f.er + 4} -4" ${L('#2B2240', 4)}/>${lens(f, (x) => `<rect x="${x - f.er}" y="${-f.er * 0.75}" width="${f.er * 2}" height="${f.er * 1.5}" rx="${f.er * 0.6}" fill="#2B2240" fill-opacity=".9" stroke="#1A1428" stroke-width="2.4"/><path d="M${x - f.er * 0.55} ${-f.er * 0.3} L${x - f.er * 0.15} ${-f.er * 0.55}" ${L('#FFFFFF', 3)} opacity=".6"/>`)}` }) },
  { id: 'stars', slot: 'eyes', name: 'star glasses', vb: '66 78 68 48', parts: (f) => ({ eyes: `<path d="M${-f.eye + f.er - 2} -4 Q0 -10 ${f.eye - f.er + 2} -4" ${L('#E85DA0', 4)}/>${lens(f, (x) => `<path d="${starD(x, 1, f.er * 1.25, f.er * 0.72)}" fill="#FFD6EC" fill-opacity=".45" stroke="#E85DA0" stroke-width="4" stroke-linejoin="round"/>`)}` }) },
  { id: 'goggles', slot: 'eyes', name: 'swim goggles', vb: '30 82 140 40', parts: (f) => ({ eyes: `<path d="M${-f.side - 6} 0 H${f.side + 6}" ${L('#3A86FF', 7)}/>${lens(f, (x) => `<circle cx="${x}" cy="0" r="${f.er + 2}" fill="#BFE6FF" fill-opacity=".45" stroke="#2E6FD6" stroke-width="5"/><path d="M${x - f.er * 0.5} ${-f.er * 0.45} q6 -5 12 -4" ${L('#FFFFFF', 3)}/>`)}` }) },
  { id: 'round', slot: 'eyes', name: 'round glasses', vb: '68 80 64 44', parts: (f) => ({ eyes: `<path d="M${-f.eye + f.er} -2 Q0 -9 ${f.eye - f.er} -2" ${L('#8A5A33', 3.4)}/>${lens(f, (x) => `<circle cx="${x}" cy="0" r="${f.er + 1}" fill="#FFFFFF" fill-opacity=".15" stroke="#8A5A33" stroke-width="3.4"/>`)}` }) },
  // ---- neck
  { id: 'scarf', slot: 'neck', name: 'scarf', vb: '36 140 128 80', parts: (f) => ({ neck: `<path d="M${f.neck * 0.35} 0 Q${f.neck * 0.5} 26 ${f.neck * 0.4} 42 L${f.neck * 0.62} 44 Q${f.neck * 0.74} 22 ${f.neck * 0.62} 0 Z" ${P('#EF476F', 2.2)}/><path d="M${-f.neck} -10 Q0 8 ${f.neck} -10 L${f.neck} 4 Q0 22 ${-f.neck} 4 Z" ${P('#EF476F', 2.4)}/><path d="M${-f.neck * 0.6} -2 Q0 12 ${f.neck * 0.6} -2" ${L('#FFE7A0', 3.4)} stroke-dasharray="6 8"/><path d="M${f.neck * 0.42} 32 L${f.neck * 0.66} 33" ${L('#FFE7A0', 3)}/>` }) },
  { id: 'bowtie', slot: 'neck', name: 'bow tie', vb: '66 140 68 44', parts: () => ({ neck: `<path d="M0 -2 L-26 -16 Q-30 -2 -26 12 Z M0 -2 L26 -16 Q30 -2 26 12 Z" ${P('#3A86FF', 2.4)}/><path d="M-20 -8 L-20 6 M20 -8 L20 6" ${L('#9FD0FF', 2.4)}/><rect x="-7" y="-9" width="14" height="14" rx="5" ${P('#2E6FD6', 2)}/>` }) },
  { id: 'lei', slot: 'neck', name: 'flower necklace', vb: '36 140 128 70', parts: (f) => ({ neck: Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const x = -f.neck + t * f.neck * 2;
    const y = -8 + Math.sin(t * Math.PI) * 22;
    return flower(+x.toFixed(1), +y.toFixed(1), 7, ['#FF8FB1', '#FFE7A0', '#FFF8EA', '#CDB8EC'][i % 4]);
  }).join('') }) },
  { id: 'bandana', slot: 'neck', name: 'bandana', vb: '40 140 120 80', parts: (f) => ({ neck: `<path d="M${-f.neck * 0.85} -8 Q0 4 ${f.neck * 0.85} -8 L${f.neck * 0.3} 26 Q0 44 ${-f.neck * 0.3} 26 Z" ${P('#06A6D6', 2.4)}/>${[[-16, 4], [10, 8], [-4, 22], [22, -2], [-30, -4]].map(([x, y]) => `<circle cx="${x * f.neck / 58}" cy="${y}" r="3" fill="#FFFFFF" opacity=".85"/>`).join('')}` }) },
  // ---- other
  { id: 'backpack', slot: 'other', name: 'backpack', vb: '120 80 100 120', parts: (f) => ({
    back: `<g transform="translate(${f.side - 4} -4) rotate(10)"><rect x="-26" y="-34" width="52" height="68" rx="14" ${P('#FF9542', 2.4)}/><rect x="-18" y="2" width="36" height="24" rx="8" ${P('#FFB877', 2)}/><path d="M-10 -34 Q0 -48 10 -34" ${L(lineOf('#FF9542'), 4)}/></g>`,
    neck: `<path d="M${f.neck * 0.7} -40 Q${f.neck * 0.86} -10 ${f.neck * 0.92} 14" ${L('#C76A1E', 7)}/>`,
  }) },
  { id: 'cape', slot: 'other', name: 'cape', vb: '0 80 200 160', parts: (f) => ({
    back: `<path d="M${-f.side * 0.6} -44 Q${-f.side - 18} 30 ${-f.side - 26} 92 Q0 108 ${f.side + 26} 92 Q${f.side + 18} 30 ${f.side * 0.6} -44 Z" ${P('#E04A5F', 2.6)}/><path d="M${-f.side - 14} 80 Q0 96 ${f.side + 14} 80" ${L('#FFCF4D', 4)}/>`,
    neck: `<circle cx="${-f.neck * 0.78}" cy="-8" r="6" ${P('#FFCF4D', 1.8)}/><circle cx="${f.neck * 0.78}" cy="-8" r="6" ${P('#FFCF4D', 1.8)}/>`,
  }) },
  { id: 'boots', slot: 'other', name: 'boots', vb: '50 190 100 50', parts: () => {
    const boot = `<path d="M-12 -30 H12 V-6 Q22 -6 24 2 Q24 12 14 12 H-22 Q-25 12 -24 2 L-12 -4 Z" ${P('#FFCF4D', 2.4)}/><path d="M-12 -24 H12" ${L('#E0A93A', 4)}/><path d="M-22 8 H20" ${L('#B9812A', 3)}/>`;
    return { footL: boot, footR: boot };
  } },
  { id: 'wings', slot: 'other', name: 'little wings', vb: '0 60 200 120', parts: (f) => {
    const wing = (s) => `<g class="acc-wing" style="transform-origin:${s * f.side * 0.5}px -10px"><path d="M${s * f.side * 0.5} -10 Q${s * (f.side + 40)} -78 ${s * (f.side + 52)} -28 Q${s * (f.side + 48)} 0 ${s * (f.side + 18)} 6 Q${s * (f.side + 36)} 30 ${s * (f.side + 8)} 36 Q${s * f.side * 0.7} 30 ${s * f.side * 0.5} -10 Z" fill="#EAF6FF" fill-opacity=".9" stroke="#8EC3EE" stroke-width="2.6" stroke-linejoin="round"/><path d="M${s * (f.side + 6)} -14 Q${s * (f.side + 26)} -40 ${s * (f.side + 40)} -30 M${s * (f.side + 4)} 8 Q${s * (f.side + 20)} 14 ${s * (f.side + 22)} 24" ${L('#BFDDF5', 2.4)}/></g>`;
    return { back: wing(-1) + wing(1) };
  } },
];
export const ACC_BY = Object.fromEntries(ACC.map((a) => [a.id, a]));

// Markup per attachment group for what this character wears: { head: '...', back: '...' }.
export function dress(who, ids) {
  const f = FIT[who];
  const out = {};
  for (const id of ids || []) {
    const a = ACC_BY[id];
    if (!a) continue;
    for (const [at, markup] of Object.entries(a.parts(f))) out[at] = (out[at] || '') + `<g class="acc acc-${id}">${markup}</g>`;
  }
  return out;
}

// A picture of one item on its own (drawn as Moko would wear it), for the wardrobe and chest.
export function accSVG(id) {
  const a = ACC_BY[id];
  const A = ANCHOR.moko;
  const inner = Object.entries(a.parts(FIT.moko)).map(([at, m]) => `<g transform="translate(${A[at][0]} ${A[at][1]})">${m}</g>`).join('');
  return `<svg viewBox="${a.vb}" width="100%" height="100%" aria-hidden="true" style="overflow:visible">${inner}</svg>`;
}

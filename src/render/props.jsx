// Kleine objecten in de buurt. Elk object staat op wereldcoördinaten (x, y).

import { iso, poly, Prism, topPts } from './iso.jsx';
import { shade, desaturate, hash01 } from '../game/util.js';

const at = (x, y, z = 0) => {
  const [px, py] = iso(x, y, z);
  return `translate(${px.toFixed(1)},${py.toFixed(1)})`;
};

const CROWN = {
  LEAF: { SPRING: '#a8d672', SUMMER: '#6eae57', AUTUMN: '#e39a42' },
  BLOSSOM: { SPRING: '#f7b6d0', SUMMER: '#7cb960', AUTUMN: '#e9a64e' }
};

export function Tree({ x, y, kind = 'LEAF', season, snow, scale = 1, dull = 0 }) {
  const s = scale;
  if (kind === 'PINE') {
    const g = desaturate('#4f8a58', dull * 0.6);
    const tip = snow ? '#f2f6fc' : shade(g, 0.15);
    const line = shade(g, -0.45);
    return (
      <g transform={at(x, y)} pointerEvents="none">
        <ellipse cx="2" cy="1" rx={13 * s} ry={6 * s} fill="#1d1838" opacity="0.18" />
        <rect x={-2.2 * s} y={-7 * s} width={4.4 * s} height={8 * s} fill="#6b4a33" />
        <path d={`M${-15 * s} ${-6 * s} L0 ${-26 * s} L${15 * s} ${-6 * s} Z`} fill={g} stroke={line} strokeWidth="0.7" />
        <path d={`M${-12 * s} ${-17 * s} L0 ${-36 * s} L${12 * s} ${-17 * s} Z`} fill={shade(g, 0.08)} stroke={line} strokeWidth="0.7" />
        <path d={`M${-8 * s} ${-28 * s} L0 ${-45 * s} L${8 * s} ${-28 * s} Z`} fill={tip} stroke={line} strokeWidth="0.7" />
        {snow && <path d={`M${-12 * s} ${-17 * s} L0 ${-26 * s} L${12 * s} ${-17 * s} L${7 * s} ${-19 * s} L0 ${-23 * s} L${-7 * s} ${-19 * s}Z`} fill="#f2f6fc" />}
      </g>
    );
  }
  if (season === 'WINTER') {
    // Kale takken met wat sneeuw
    return (
      <g transform={at(x, y)} pointerEvents="none">
        <ellipse cx="2" cy="1" rx={11 * s} ry={5 * s} fill="#1d1838" opacity="0.15" />
        <path
          d={`M0 0 L0 ${-20 * s} M0 ${-12 * s} L${-9 * s} ${-24 * s} M0 ${-15 * s} L${8 * s} ${-27 * s} M0 ${-20 * s} L${-3 * s} ${-31 * s} M${-5 * s} ${-19 * s} L${-12 * s} ${-20 * s}`}
          stroke="#5e4636"
          strokeWidth={2 * s}
          strokeLinecap="round"
          fill="none"
        />
        {snow && <circle cx={-8 * s} cy={-24 * s} r={2.2 * s} fill="#f2f6fc" />}
        {snow && <circle cx={7 * s} cy={-27 * s} r={2.2 * s} fill="#f2f6fc" />}
      </g>
    );
  }
  const base = desaturate(CROWN[kind]?.[season] || CROWN.LEAF.SUMMER, dull * 0.55);
  const dark = shade(base, -0.22);
  const light = shade(base, 0.22);
  const line = shade(base, -0.5);
  return (
    <g transform={at(x, y)} pointerEvents="none">
      <ellipse cx="3" cy="1" rx={13 * s} ry={6 * s} fill="#1d1838" opacity="0.18" />
      <path d={`M${-2 * s} 0 L${-1.6 * s} ${-15 * s} L${1.6 * s} ${-15 * s} L${2 * s} 0Z`} fill="#6b4a33" />
      <circle cx={-7 * s} cy={-19 * s} r={8.5 * s} fill={dark} stroke={line} strokeWidth="0.7" />
      <circle cx={7 * s} cy={-19 * s} r={8.5 * s} fill={base} stroke={line} strokeWidth="0.7" />
      <circle cx="0" cy={-27 * s} r={10 * s} fill={light} stroke={line} strokeWidth="0.7" />
      {kind === 'BLOSSOM' && season === 'SPRING' && (
        <g fill="#fff3f8">
          <circle cx={-4 * s} cy={-29 * s} r={1.4 * s} />
          <circle cx={4 * s} cy={-24 * s} r={1.2 * s} />
          <circle cx={-8 * s} cy={-20 * s} r={1.2 * s} />
          <circle cx={6 * s} cy={-32 * s} r={1.1 * s} />
        </g>
      )}
    </g>
  );
}

export function Bench({ x, y, axis = 'x', color = '#b77b45', snow }) {
  const b = axis === 'x' ? { x: x - 0.32, y: y - 0.09, w: 0.64, d: 0.18 } : { x: x - 0.09, y: y - 0.32, w: 0.18, d: 0.64 };
  const back = axis === 'x' ? { x: x - 0.32, y: y - 0.12, w: 0.64, d: 0.05 } : { x: x - 0.12, y: y - 0.32, w: 0.05, d: 0.64 };
  return (
    <g pointerEvents="none">
      <Prism box={b} z0={4} z1={6} color={color} top={snow ? '#f2f6fc' : undefined} />
      <Prism box={back} z0={6} z1={12} color={shade(color, -0.1)} />
      <Prism box={{ x: b.x + 0.04, y: b.y + 0.04, w: 0.06, d: 0.06 }} z0={0} z1={4} color="#4b4458" />
      <Prism box={{ x: b.x + b.w - 0.1, y: b.y + b.d - 0.1, w: 0.06, d: 0.06 }} z0={0} z1={4} color="#4b4458" />
    </g>
  );
}

export function LampPost({ x, y, warm = true }) {
  const [px, py] = iso(x, y);
  return (
    <g pointerEvents="none">
      <path d={`M${px} ${py} L${px} ${py - 30} Q${px} ${py - 35} ${px + 7} ${py - 33}`} fill="none" stroke="#3b3550" strokeWidth="2" strokeLinecap="round" />
      <circle cx={px + 7} cy={py - 32} r="3" fill={warm ? '#ffe2a3' : '#e6e3ef'} stroke="#3b3550" strokeWidth="0.8" />
    </g>
  );
}

export function Planter({ x, y, season, snow }) {
  const flowers = season === 'WINTER' ? ['#c9cfdc'] : season === 'AUTUMN' ? ['#e39a42', '#c9643b'] : ['#ef6f8e', '#f7c948', '#9b7fe0'];
  const [px, py] = iso(x, y, 7);
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.25, y: y - 0.25, w: 0.5, d: 0.5 }} z0={0} z1={7} color="#c9744e" top={snow ? '#f2f6fc' : '#6c9b4f'} />
      {!snow &&
        [-6, 0, 6].map((dx, i) => <circle key={i} cx={px + dx} cy={py - 2 + (i % 2) * 2} r="2.4" fill={flowers[i % flowers.length]} />)}
    </g>
  );
}

export function Picnic({ x, y, snow }) {
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.3, y: y - 0.12, w: 0.6, d: 0.08 }} z0={0} z1={4} color="#a2683c" />
      <Prism box={{ x: x - 0.3, y: y + 0.12, w: 0.6, d: 0.08 }} z0={0} z1={4} color="#a2683c" />
      <Prism box={{ x: x - 0.32, y: y - 0.06, w: 0.64, d: 0.16 }} z0={7} z1={9} color="#c48a52" top={snow ? '#f2f6fc' : undefined} />
      <Prism box={{ x: x - 0.04, y: y - 0.02, w: 0.08, d: 0.08 }} z0={0} z1={7} color="#7b4f2e" />
    </g>
  );
}

export function FirePit({ x, y, t }) {
  const [px, py] = iso(x, y, 6);
  const f = 1 + Math.sin(t * 9 + x) * 0.15;
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.2, y: y - 0.2, w: 0.4, d: 0.4 }} z0={0} z1={6} color="#5d5568" top="#2c2638" />
      <path d={`M${px - 4} ${py} Q${px} ${py - 12 * f} ${px + 4} ${py} Z`} fill="#ff9a3c" />
      <path d={`M${px - 2} ${py} Q${px} ${py - 7 * f} ${px + 2} ${py} Z`} fill="#ffe08a" />
    </g>
  );
}

export function Hopscotch({ x, y }) {
  const cells = [0, 1, 2, 3];
  const colors = ['#f7c948', '#ef6f8e', '#7fc4e8', '#8bd17c'];
  return (
    <g pointerEvents="none" opacity="0.85">
      {cells.map((i) => (
        <polygon key={i} points={topPts(x + 0.2, y + 0.12 + i * 0.18, 0.5, 0.15, 0.3)} fill={colors[i]} stroke="#ffffff" strokeWidth="0.8" />
      ))}
    </g>
  );
}

export function Car({ x, y, axis, color, snowRoof }) {
  const body = axis === 'x' ? { x: x - 0.4, y: y - 0.19, w: 0.8, d: 0.38 } : { x: x - 0.19, y: y - 0.4, w: 0.38, d: 0.8 };
  const cabin = axis === 'x' ? { x: x - 0.22, y: y - 0.16, w: 0.4, d: 0.32 } : { x: x - 0.16, y: y - 0.22, w: 0.32, d: 0.4 };
  const [sx, sy] = iso(x, y);
  return (
    <g pointerEvents="none">
      <ellipse cx={sx + 2} cy={sy + 1} rx="17" ry="8" fill="#1d1838" opacity="0.22" />
      <Prism box={body} z0={2.5} z1={9} color={color} sw={0.6} />
      <Prism box={cabin} z0={9} z1={15} color="#a9c7de" top={snowRoof ? '#f2f6fc' : shade(color, 0.1)} sw={0.6} />
    </g>
  );
}

export function Person({ x, y, r, stage, alpha = 1, bike, hop = 0, selected, icon, name }) {
  const [px, py0] = iso(x, y);
  const py = py0 - hop;
  const h = stage === 'CHILD' ? 9 : stage === 'SENIOR' ? 13 : stage === 'YOUTH' ? 14 : 15;
  const w = stage === 'CHILD' ? 5 : 6.5;
  const line = shade(r.color, -0.5);
  const lift = bike ? 6 : 0;
  return (
    <g opacity={alpha} pointerEvents="none">
      <ellipse cx={px} cy={py0 + 1} rx={bike ? 9 : 5} ry="2.4" fill="#1d1838" opacity="0.28" />
      {selected && <ellipse cx={px} cy={py0 + 1} rx="10" ry="5" fill="none" stroke="#ffc857" strokeWidth="2" />}
      {bike && (
        <g stroke="#2f2a44" strokeWidth="1.2" fill="none">
          <ellipse cx={px - 6} cy={py - 3} rx="3.5" ry="3.5" />
          <ellipse cx={px + 6} cy={py - 3} rx="3.5" ry="3.5" />
          <path d={`M${px - 6} ${py - 3} L${px} ${py - 7} L${px + 6} ${py - 3}`} />
        </g>
      )}
      <rect x={px - w / 2} y={py - h - lift} width={w} height={h} rx={w / 2} fill={r.color} stroke={line} strokeWidth="0.8" />
      <circle cx={px} cy={py - h - lift - 3.5} r={stage === 'CHILD' ? 3.3 : 3.8} fill={r.skin} stroke={line} strokeWidth="0.7" />
      {stage === 'SENIOR' && <path d={`M${px - 3.6} ${py - h - lift - 4} Q${px} ${py - h - lift - 9} ${px + 3.6} ${py - h - lift - 4}`} fill="#e9e7f0" />}
      {icon && (
        <g transform={`translate(${px + 7},${py - h - lift - 12})`}>
          <circle r="7" fill="#fffaf0" stroke="#3b3550" strokeWidth="0.6" />
          <text y="3.2" textAnchor="middle" fontSize="8.5">{icon}</text>
        </g>
      )}
      {selected && name && (
        <g transform={`translate(${px},${py - h - lift - 18})`}>
          <rect x={-name.length * 3.1 - 6} y="-9" width={name.length * 6.2 + 12} height="14" rx="7" fill="#262449" stroke="#ffc857" strokeWidth="1" />
          <text y="1.5" textAnchor="middle" fill="#fff6e0" fontSize="8.5" fontWeight="700">{name}</text>
        </g>
      )}
    </g>
  );
}

export function Tyres({ x, y }) {
  const [px, py] = iso(x, y);
  return (
    <g pointerEvents="none">
      <ellipse cx={px - 5} cy={py} rx="5.5" ry="2.8" fill="#2c2a35" />
      <ellipse cx={px - 5} cy={py - 2.5} rx="5" ry="2.5" fill="#3d3a48" stroke="#22202b" strokeWidth="0.6" />
      <ellipse cx={px + 4} cy={py + 3} rx="5" ry="2.5" fill="#34313e" />
    </g>
  );
}

export function Bin({ x, y, color = '#4c7a54', snow }) {
  return <Prism box={{ x: x - 0.11, y: y - 0.11, w: 0.22, d: 0.22 }} z0={0} z1={11} color={color} top={snow ? '#f2f6fc' : undefined} sw={0.6} />;
}

export function ClimbFrame({ x, y }) {
  const pts = [iso(x - 0.35, y - 0.25), iso(x + 0.35, y - 0.25), iso(x + 0.35, y + 0.25), iso(x - 0.35, y + 0.25)];
  return (
    <g pointerEvents="none" stroke="#d9643f" strokeWidth="2" strokeLinecap="round" fill="none">
      {pts.map(([px, py], i) => (
        <line key={i} x1={px} y1={py} x2={px} y2={py - 20} />
      ))}
      <polyline points={poly(...[iso(x - 0.35, y - 0.25, 20), iso(x + 0.35, y - 0.25, 20), iso(x + 0.35, y + 0.25, 20), iso(x - 0.35, y + 0.25, 20), iso(x - 0.35, y - 0.25, 20)])} stroke="#3d7fc4" />
      <line x1={iso(x - 0.35, y + 0.25, 10)[0]} y1={iso(x - 0.35, y + 0.25, 10)[1]} x2={iso(x + 0.35, y + 0.25, 10)[0]} y2={iso(x + 0.35, y + 0.25, 10)[1]} stroke="#f2c14e" />
    </g>
  );
}

export function Sandbox({ x, y, snow }) {
  return <Prism box={{ x: x - 0.35, y: y - 0.3, w: 0.7, d: 0.6 }} z0={0} z1={3} color="#b98a55" top={snow ? '#eef2f8' : '#f1d9a0'} sw={0.6} />;
}

export function RaisedBed({ x, y, season, snow }) {
  const crop = { SPRING: '#8fd16a', SUMMER: '#5fae4f', AUTUMN: '#c98a3c', WINTER: '#c9b892' }[season];
  const dots = { SPRING: '#f6e27a', SUMMER: '#e2463c', AUTUMN: '#e88a2c', WINTER: null }[season];
  const [px, py] = iso(x, y, 7);
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.38, y: y - 0.16, w: 0.76, d: 0.32 }} z0={0} z1={6} color="#9a6a42" top={snow ? '#f2f6fc' : crop} sw={0.6} />
      {!snow && dots && [-8, -2, 5, 10].map((dx, i) => <circle key={i} cx={px + dx} cy={py + (i % 2) * 2} r="1.8" fill={dots} />)}
    </g>
  );
}

export function MarketStall({ x, y, snow }) {
  const [px, py] = iso(x, y, 9);
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.32, y: y - 0.14, w: 0.64, d: 0.28 }} z0={0} z1={8} color="#a8743f" top="#d9b27a" sw={0.6} />
      {!snow && [-9, -3, 3, 9].map((dx, i) => <circle key={i} cx={px + dx} cy={py + (i % 2)} r="2.4" fill={['#e2463c', '#8bd17c', '#f7c948', '#e88a2c'][i]} />)}
    </g>
  );
}

export function BikeRack({ x, y }) {
  const [px, py] = iso(x, y);
  return (
    <g pointerEvents="none" stroke="#596080" strokeWidth="1.3" fill="none">
      {[-8, 0, 8].map((dx, i) => (
        <path key={i} d={`M${px + dx - 3} ${py + i * 2} Q${px + dx} ${py - 9 + i * 2} ${px + dx + 3} ${py + i * 2}`} />
      ))}
      <ellipse cx={px - 4} cy={py - 3} rx="3.5" ry="3.5" stroke="#2f2a44" />
      <ellipse cx={px + 4} cy={py - 1} rx="3.5" ry="3.5" stroke="#2f2a44" />
    </g>
  );
}

export function EvPost({ x, y }) {
  return <Prism box={{ x: x - 0.06, y: y - 0.06, w: 0.12, d: 0.12 }} z0={0} z1={13} color="#4caf72" sw={0.6} />;
}

export function Barrier({ x, y, upgraded }) {
  const [a1, a2] = iso(x, y, 8);
  const [b1, b2] = iso(x - 1.3, y, 8);
  return (
    <g pointerEvents="none">
      <Prism box={{ x: x - 0.07, y: y - 0.07, w: 0.14, d: 0.14 }} z0={0} z1={11} color={upgraded ? '#5b8f6a' : '#e0703a'} sw={0.6} />
      <line x1={a1} y1={a2} x2={b1} y2={b2} stroke="#e94e45" strokeWidth="2.6" strokeLinecap="round" />
      <line x1={a1} y1={a2} x2={b1} y2={b2} stroke="#ffffff" strokeWidth="2.6" strokeDasharray="4 4" />
    </g>
  );
}

export function Hoop({ x, y, old }) {
  const [px, py] = iso(x, y);
  return (
    <g pointerEvents="none">
      <line x1={px} y1={py} x2={px + (old ? 3 : 0)} y2={py - 30} stroke="#5d5a6b" strokeWidth="2" />
      <rect x={px - 7 + (old ? 3 : 0)} y={py - 38} width="14" height="9" fill={old ? '#c9c5bd' : '#ffffff'} stroke="#5d5a6b" strokeWidth="0.8" />
      {!old && <ellipse cx={px} cy={py - 28} rx="4" ry="1.6" fill="none" stroke="#e0703a" strokeWidth="1.2" />}
    </g>
  );
}

// Krabbels op een gevel (alleen bij verwaarloosde panden)
export function Graffiti({ points, seed = 'g' }) {
  const c = hash01(seed) > 0.5 ? '#c2667e' : '#6d7fcc';
  return <polyline points={points} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />;
}

export function Ladder({ x, y, h = 26 }) {
  const [x1, y1] = iso(x, y, 0);
  const [x2, y2] = iso(x - 0.12, y - 0.12, h);
  return (
    <g pointerEvents="none" stroke="#c48a52" strokeWidth="1.6" strokeLinecap="round">
      <line x1={x1 - 3} y1={y1} x2={x2 - 3} y2={y2} />
      <line x1={x1 + 3} y1={y1} x2={x2 + 3} y2={y2} />
      {[0.2, 0.4, 0.6, 0.8].map((k, i) => (
        <line key={i} x1={x1 - 3 + (x2 - x1) * k} y1={y1 + (y2 - y1) * k} x2={x1 + 3 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} strokeWidth="1.1" />
      ))}
    </g>
  );
}

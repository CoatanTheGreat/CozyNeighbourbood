// Gebouwen en plekken. Elke tekenfunctie geeft { el, lights, chimneys, items }
// terug. "lights" gaat naar de lichtlaag, "items" zijn losse objecten die
// mee worden gesorteerd op diepte.

import { iso, poly, Prism, topPts, onLeft, onRight, matLeft, matRight } from './iso.jsx';
import { Tree, Bench, Tyres, Bin, ClimbFrame, Sandbox, RaisedBed, MarketStall, BikeRack, EvPost, Barrier, Hoop, Graffiti, Planter } from './props.jsx';
import { BUILDING_LAYOUT, PLACE_LAYOUT, PLAYGROUND_AREA } from '../game/layout.js';
import { buildingProgress } from '../game/simulation.js';
import { mix, shade, desaturate, hash01, clamp } from '../game/util.js';

const thr = (key) => 0.28 + hash01(key) * 0.55;

function Win({ c, lights, pts, canLight = true, t = 0.5, boarded = false, frame = '#f4ecdf' }) {
  const lit = canLight && !boarded && c.dark > t;
  const night = c.dark > 0.5;
  const fill = boarded ? '#7d6248' : lit ? '#ffd27f' : night ? '#454c7e' : c.snow ? '#a3b8d1' : '#a9d0ea';
  if (lit) lights.push({ kind: 'pane', pts });
  return <polygon points={pts} fill={fill} stroke={boarded ? '#4f3b2a' : frame} strokeWidth="1.1" strokeLinejoin="round" />;
}

const has = (b, upId) => Boolean(b.upgrades.find((u) => u.id === upId)?.installed);

function fresh(c, id) {
  return clamp(0.2 + buildingProgress(c.s, id) * 0.8, 0, 1);
}

function paint(base, f) {
  return mix(desaturate(shade(base, -0.12), 0.72), base, f);
}

// --------------------------------------------------------------------------
// Arbeidershuisjes
// --------------------------------------------------------------------------

const HOUSE_STYLE = {
  b_hw1: { wall: '#e6b97c', roof: '#a8553f', door: '#3f6b5a' },
  b_hw2: { wall: '#eaa898', roof: '#8f4b3f', door: '#5b5f9c' },
  b_hw3: { wall: '#f0ddb7', roof: '#9e5c3f', door: '#a64b3c' },
  b_hw4: { wall: '#bcd3a6', roof: '#7e5b4a', door: '#d99a32' },
  b_hw6: { wall: '#d7987a', roof: '#71534a', door: '#3f6b8a' }
};

export function drawHouse(id, c) {
  const L = BUILDING_LAYOUT[id];
  const b = c.s.buildings[id];
  const unit = c.s.units[b.unitIds[0]];
  const st = HOUSE_STYLE[id];
  const f = fresh(c, id);
  const p = buildingProgress(c.s, id);
  const box = { x: L.x + 0.16, y: L.y + 0.1, w: L.w - 0.32, d: L.d - 0.5 };
  const wall = paint(st.wall, f);
  const roof = c.snow ? '#eef3fb' : paint(st.roof, f);
  const lights = [];
  const occupied = Boolean(unit.householdId);
  const boarded = id === 'b_hw6' && !unit.ready;
  const zw = 28;
  const zr = 47;
  const ov = 0.12;
  const X0 = box.x - ov;
  const X1 = box.x + box.w + ov;
  const Yb = box.y - ov;
  const Yf = box.y + box.d + ov;
  const Ym = box.y + box.d / 2;
  const sp = (u, t) => iso(X0 + (X1 - X0) * u, Yf - (Yf - Ym) * t, zw + (zr - zw) * t);
  const doorU = L.door[0] + 0.5 - box.x - 0.14;
  const gx = box.x + box.w;
  const frontY = box.y + box.d;
  const stripD = L.y + L.d - frontY - 0.02;
  const lineCol = shade(wall, -0.45);
  const solar = has(b, 'up_hw1_insul') || has(b, 'up_hw4_solar');
  const chimney = { x: box.x + box.w * 0.68, y: box.y + 0.16 };

  if (occupied && c.dark > 0.45) lights.push({ kind: 'bulb', x: L.door[0] + 0.5 + 0.2, y: frontY + 0.02, z: 20, r: 0.6 });

  const el = (
    <g>
      {/* Voortuintje */}
      <polygon
        points={topPts(L.x + 0.06, frontY, L.w - 0.12, stripD, 0.6)}
        fill={c.snow ? '#eef2f8' : has(b, 'up_hw1_garden') || p > 0 ? '#7fae5a' : '#a49a88'}
        stroke={c.snow ? '#d9e1ee' : '#6d6455'}
        strokeWidth="0.5"
      />
      <polygon points={topPts(L.door[0] + 0.36, frontY, 0.28, stripD, 0.8)} fill={c.snow ? '#f6f8fc' : '#d8cdbb'} />
      <Prism box={box} z1={zw} color={wall} line={lineCol} />
      {/* Ramen en deur op de voorgevel */}
      <Win c={c} lights={lights} pts={onLeft(box, 0.12, 0.36, 6, 17)} canLight={occupied} t={thr(id + 'a')} boarded={boarded} />
      <Win c={c} lights={lights} pts={onLeft(box, 0.62, 0.36, 6, 17)} canLight={occupied} t={thr(id + 'b')} boarded={boarded} />
      <polygon points={onLeft(box, doorU, 0.28, 0, 18)} fill={paint(st.door, f)} stroke={lineCol} strokeWidth="0.8" />
      <Win c={c} lights={lights} pts={onRight(box, 0.3, 0.42, 6, 17)} canLight={occupied} t={thr(id + 'c')} boarded={boarded} />
      {/* Dak */}
      <polygon points={poly(iso(X0, Ym, zr), iso(X1, Ym, zr), iso(X1, Yb, zw), iso(X0, Yb, zw))} fill={shade(roof, -0.25)} stroke={shade(roof, -0.5)} strokeWidth="0.7" />
      <Prism box={{ x: chimney.x, y: chimney.y, w: 0.2, d: 0.2 }} z0={36} z1={54} color={c.snow ? '#e8edf5' : paint('#a2685a', f)} top={c.snow ? '#ffffff' : undefined} />
      <polygon points={poly(iso(gx, frontY, zw), iso(gx, box.y, zw), iso(gx, Ym, zr))} fill={shade(wall, -0.2)} stroke={lineCol} strokeWidth="0.7" strokeLinejoin="round" />
      <Win c={c} lights={lights} pts={onRight(box, box.d / 2 - 0.13, 0.26, 31, 38)} canLight={occupied} t={thr(id + 'd')} boarded={boarded} />
      <polygon points={poly(iso(X0, Yf, zw), iso(X1, Yf, zw), iso(X1, Ym, zr), iso(X0, Ym, zr))} fill={roof} stroke={shade(roof, -0.45)} strokeWidth="0.8" strokeLinejoin="round" />
      {!c.snow && (
        <g stroke={shade(roof, -0.2)} strokeWidth="0.6" opacity="0.6">
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={sp(0, t)[0]} y1={sp(0, t)[1]} x2={sp(1, t)[0]} y2={sp(1, t)[1]} />
          ))}
        </g>
      )}
      {solar && !c.snow && (
        <g>
          {[[0.1, 0.46], [0.54, 0.9]].map(([u0, u1], i) => (
            <polygon key={i} points={poly(sp(u0, 0.18), sp(u1, 0.18), sp(u1, 0.82), sp(u0, 0.82))} fill="#30477f" stroke="#c9d6f0" strokeWidth="0.8" />
          ))}
        </g>
      )}
      {id === 'b_hw4' && !has(b, 'up_hw4_klus') && !c.snow && (
        <polygon points={poly(sp(0.55, 0.25), sp(0.85, 0.25), sp(0.85, 0.7), sp(0.55, 0.7))} fill="#4f7fc4" stroke="#2f4f86" strokeWidth="0.7" opacity="0.9" />
      )}
      {id === 'b_hw3' && has(b, 'up_hw3_dormer') && (
        <g>
          <Prism box={{ x: box.x + box.w * 0.34, y: Yf - 0.46, w: 0.46, d: 0.26 }} z0={31} z1={41} color={wall} top={roof} />
          <Win c={c} lights={lights} pts={onLeft({ x: box.x + box.w * 0.34, y: Yf - 0.46, w: 0.46, d: 0.26 }, 0.1, 0.26, 32, 39)} canLight={occupied} t={thr(id + 'e')} />
        </g>
      )}
      {/* Verwaarloosd: krabbels op de gevel */}
      {p === 0 && (id === 'b_hw6' || id === 'b_hw4') && (
        <Graffiti seed={id} points={poly(iso(box.x + 0.08, frontY, 4), iso(box.x + 0.2, frontY, 9), iso(box.x + 0.3, frontY, 3), iso(box.x + 0.42, frontY, 8))} />
      )}
    </g>
  );

  const items = [];
  if (p === 0) {
    items.push({ key: id + '_tyres', box: { x: L.x + L.w - 0.4, y: L.y + L.d - 0.3, w: 0.2, d: 0.2 }, el: <Tyres x={L.x + L.w - 0.3} y={L.y + L.d - 0.2} /> });
    items.push({ key: id + '_bin', box: { x: L.x + 0.14, y: L.y + L.d - 0.3, w: 0.2, d: 0.2 }, el: <Bin x={L.x + 0.24} y={L.y + L.d - 0.2} snow={c.snow} /> });
  }
  if (id === 'b_hw1' && has(b, 'up_hw1_garden')) {
    items.push({ key: id + '_pl1', box: { x: L.x + 0.15, y: L.y + L.d - 0.3, w: 0.2, d: 0.2 }, el: <Planter x={L.x + 0.3} y={L.y + L.d - 0.2} season={c.season} snow={c.snow} /> });
    items.push({ key: id + '_pl2', box: { x: L.x + 1.65, y: L.y + L.d - 0.3, w: 0.2, d: 0.2 }, el: <Planter x={L.x + 1.72} y={L.y + L.d - 0.2} season={c.season} snow={c.snow} /> });
  }
  if (id === 'b_hw2' && has(b, 'up_hw2_bench')) {
    items.push({ key: id + '_bench', box: { x: L.x + 0.2, y: L.y + L.d - 0.3, w: 0.5, d: 0.2 }, el: <Bench x={L.x + 0.55} y={L.y + L.d - 0.18} snow={c.snow} color="#5d8fb0" /> });
  }
  const chimneys = [{ x: chimney.x + 0.1, y: chimney.y + 0.1, z: 56 }];
  return { el, lights, chimneys, items, height: zr };
}

// --------------------------------------------------------------------------
// Wijkgebouw
// --------------------------------------------------------------------------

export function drawHub(c) {
  const id = 'b_hub';
  const b = c.s.buildings[id];
  const up = has(b, 'up_hub_center');
  const box = { x: 8.06, y: 1.06, w: 2.88, d: 2.88 };
  const wall = up ? '#e6dccb' : paint('#a7a9b2', 0.4);
  const lights = [];
  const floors = [8, 30, 52];
  const el = (
    <g>
      <Prism box={box} z1={68} color={wall} top={c.snow ? '#eef3fb' : '#8f939e'} />
      {up && <polygon points={onLeft(box, 0, box.w, 0, 22)} fill="#b9875a" stroke={shade('#b9875a', -0.4)} strokeWidth="0.7" />}
      {floors.map((z, fi) => (
        <g key={z}>
          {[0.18, 0.66, 1.66, 2.2].map((u, i) => (
            <Win key={i} c={c} lights={lights} pts={onLeft(box, u, 0.36, z, z + 13)} t={fi === 0 && up ? 0.1 : thr(id + z + u)} />
          ))}
          {fi > 0 && <Win c={c} lights={lights} pts={onLeft(box, 1.16, 0.36, z, z + 13)} t={thr(id + 'm' + z)} />}
          {[0.25, 0.85, 1.45, 2.05].map((u, i) => (
            <Win key={'r' + i} c={c} lights={lights} pts={onRight(box, u, 0.36, z, z + 13)} t={thr(id + 'r' + z + u)} />
          ))}
        </g>
      ))}
      <polygon points={onLeft(box, 1.12, 0.42, 0, 19)} fill={up ? '#4f7a63' : '#6e7381'} stroke="#3b3550" strokeWidth="0.8" />
      {up && (
        <g>
          <polygon points={onLeft(box, 0.9, 0.9, 21.5, 28)} fill="#fff4dc" stroke="#7a5a3a" strokeWidth="0.6" />
          <text transform={matLeft(box.x + 0.97, box.y + box.d, 22.6)} fontSize="5.4" fontWeight="800" fill="#7a4b2a">BUURTKAMER</text>
        </g>
      )}
      <Prism box={{ x: 8.4, y: 1.4, w: 0.55, d: 0.45 }} z0={68} z1={75} color="#b9bcc6" top={c.snow ? '#ffffff' : undefined} />
      <Prism box={{ x: 9.5, y: 1.3, w: 0.4, d: 0.4 }} z0={68} z1={73} color="#c8cad2" top={c.snow ? '#ffffff' : undefined} />
      {!up && <Graffiti seed="hub" points={poly(iso(10.95, 2.4, 6), iso(10.95, 2.1, 12), iso(10.95, 1.8, 5), iso(10.95, 1.5, 11))} />}
    </g>
  );
  const items = [{ key: 'hub_barrier', box: { x: 10.75, y: 4.1, w: 0.15, d: 0.15 }, el: <Barrier x={10.82} y={4.15} upgraded={up} /> }];
  if (up) {
    items.push({ key: 'hub_ev1', box: { x: 8.1, y: 4.1, w: 0.12, d: 0.12 }, el: <EvPost x={8.15} y={4.15} /> });
    items.push({ key: 'hub_ev2', box: { x: 8.1, y: 5.1, w: 0.12, d: 0.12 }, el: <EvPost x={8.15} y={5.15} /> });
    items.push({ key: 'hub_pl1', box: { x: 10.5, y: 5.55, w: 0.3, d: 0.3 }, el: <Planter x={10.65} y={5.7} season={c.season} snow={c.snow} /> });
    items.push({ key: 'hub_pl2', box: { x: 9.15, y: 5.55, w: 0.3, d: 0.3 }, el: <Planter x={9.3} y={5.7} season={c.season} snow={c.snow} /> });
  }
  return { el, lights, chimneys: [], items, height: 75 };
}

// --------------------------------------------------------------------------
// School met speelplaats
// --------------------------------------------------------------------------

export function drawSchool(c) {
  const id = 'b_school';
  const b = c.s.buildings[id];
  const painted = has(b, 'up_school_paint');
  const field = has(b, 'up_school_field');
  const box = { x: 11.06, y: 0.06, w: 2.88, d: 1.88 };
  const wall = painted ? '#f3e3b6' : paint('#aab0bc', 0.35);
  const lights = [];
  const el = (
    <g>
      <Prism box={box} z1={42} color={wall} top={c.snow ? '#eef3fb' : '#8e939e'} />
      {painted && (
        <g>
          <polygon points={onLeft(box, 0.05, 0.42, 0, 42)} fill="#d9574a" />
          <polygon points={onLeft(box, 2.4, 0.42, 0, 42)} fill="#4f7fc4" />
          <polygon points={onRight(box, 0.1, 0.4, 0, 42)} fill="#f2c14e" />
        </g>
      )}
      {[8, 26].map((z) => (
        <g key={z}>
          {[0.6, 1.5, 1.95].map((u, i) => (
            <Win key={i} c={c} lights={lights} pts={onLeft(box, u, 0.36, z, z + 11)} t={thr(id + z + u)} />
          ))}
          <Win c={c} lights={lights} pts={onRight(box, 0.75, 0.5, z, z + 11)} t={thr(id + 'r' + z)} />
        </g>
      ))}
      <polygon points={onLeft(box, 1.0, 0.42, 0, 19)} fill={painted ? '#3d7fc4' : '#6e7381'} stroke="#3b3550" strokeWidth="0.8" />
      <polygon points={onLeft(box, 0.85, 0.75, 20, 25)} fill="#ffffff" stroke="#3b3550" strokeWidth="0.6" />
      <text transform={matLeft(box.x + 0.97, box.y + box.d, 20.9)} fontSize="5" fontWeight="800" fill="#2f2a44">SCHOOL</text>
      {painted && !c.snow && (
        <g>
          {[[11.3, 0.25], [12.4, 0.25]].map(([x, y], i) => (
            <polygon key={i} points={poly(iso(x, y, 46), iso(x + 0.9, y, 46), iso(x + 0.9, y + 1.2, 42.5), iso(x, y + 1.2, 42.5))} fill="#30477f" stroke="#c9d6f0" strokeWidth="0.8" />
          ))}
        </g>
      )}
      {!painted && <Graffiti seed="school" points={poly(iso(13.94, 1.6, 5), iso(13.94, 1.3, 11), iso(13.94, 1.0, 4), iso(13.94, 0.7, 10))} />}
    </g>
  );
  const items = [
    { key: 'sch_hoop', box: { x: 13.4, y: 4.6, w: 0.15, d: 0.15 }, el: <Hoop x={13.5} y={4.7} old={!field} /> }
  ];
  if (field) {
    items.push({ key: 'sch_frame', box: { x: 11.3, y: 2.7, w: 0.7, d: 0.5 }, el: <ClimbFrame x={11.65} y={2.95} /> });
    items.push({ key: 'sch_bikes', box: { x: 13.3, y: 2.3, w: 0.4, d: 0.2 }, el: <BikeRack x={13.5} y={2.4} /> });
  }
  return { el, lights, chimneys: [], items, height: 46 };
}

export function playgroundGround(c) {
  const b = c.s.buildings.b_school;
  const field = has(b, 'up_school_field');
  const A = PLAYGROUND_AREA;
  const base = c.snow ? '#e6ecf5' : field ? '#5fae6a' : '#a2a6ad';
  return (
    <g pointerEvents="none">
      <polygon points={topPts(A.x, A.y, A.w, A.d, 0.4)} fill={base} stroke={c.snow ? '#d3dbe8' : shade(base, -0.2)} strokeWidth="0.8" />
      {field && !c.snow && (
        <g fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.85">
          <polygon points={topPts(A.x + 0.9, A.y + 1.2, 1.9, 2.5, 0.5)} />
          <line x1={iso(A.x + 0.9, A.y + 2.45, 0.5)[0]} y1={iso(A.x + 0.9, A.y + 2.45, 0.5)[1]} x2={iso(A.x + 2.8, A.y + 2.45, 0.5)[0]} y2={iso(A.x + 2.8, A.y + 2.45, 0.5)[1]} />
        </g>
      )}
      {!field && !c.snow && (
        <polyline points={poly(iso(11.6, 3.4, 0.5), iso(12.2, 3.9, 0.5), iso(12.1, 4.6, 0.5), iso(12.7, 5.2, 0.5))} fill="none" stroke="#7d828b" strokeWidth="0.9" />
      )}
    </g>
  );
}

// --------------------------------------------------------------------------
// Supermarkt op de hoek
// --------------------------------------------------------------------------

export function drawShop(c) {
  const id = 'b_shop';
  const b = c.s.buildings[id];
  const up = has(b, 'up_shop_market');
  const box = { x: 4.06, y: 7.06, w: 2.88, d: 1.88 };
  const wall = up ? '#e9c9a4' : paint('#b9a291', 0.35);
  const lights = [];
  const signPts = onRight(box, 0.08, 1.72, 20, 28);
  lights.push({ kind: 'sign', pts: signPts, color: up ? '#ffb347' : '#ff8a5c', strength: up ? 1 : 0.55 });
  const el = (
    <g>
      <Prism box={box} z1={46} color={wall} top={c.snow ? '#eef3fb' : '#9a9aa4'} />
      <Win c={c} lights={lights} pts={onRight(box, 0.1, 1.05, 3, 17)} t={0.05} frame="#3b3550" />
      <polygon points={onRight(box, 1.25, 0.32, 0, 17)} fill="#4f5873" stroke="#3b3550" strokeWidth="0.8" />
      <Win c={c} lights={lights} pts={onRight(box, 1.62, 0.22, 3, 17)} t={0.05} frame="#3b3550" />
      <polygon points={signPts} fill={up ? '#3f7a58' : '#c4532f'} stroke="#fff1c9" strokeWidth="1" />
      <text transform={matRight(box.x + box.w, box.y + box.d - 0.2, 21.4)} fontSize="5.6" fontWeight="800" fill="#fff8e6">SUPERMARKT</text>
      {up && (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <polygon key={i} points={poly(iso(7.0, 8.94 - i * 0.3, 19), iso(7.0, 8.94 - (i + 1) * 0.3, 19), iso(7.25, 8.94 - (i + 1) * 0.3, 15), iso(7.25, 8.94 - i * 0.3, 15))} fill={i % 2 ? '#ffffff' : '#3f7a58'} stroke="#2f5a42" strokeWidth="0.4" />
          ))}
        </g>
      )}
      {[0.3, 1.2, 2.1].map((u, i) => (
        <Win key={i} c={c} lights={lights} pts={onLeft(box, u, 0.42, 28, 39)} t={thr(id + u)} />
      ))}
      <Win c={c} lights={lights} pts={onLeft(box, 0.3, 0.6, 5, 15)} t={thr(id + 'g')} />
      {!up && <polyline points={poly(iso(5.3, 8.94, 18), iso(5.45, 8.94, 13), iso(5.38, 8.94, 9), iso(5.55, 8.94, 4))} fill="none" stroke={shade(wall, -0.45)} strokeWidth="0.9" />}
    </g>
  );
  const items = [];
  if (up) {
    items.push({ key: 'shop_st1', box: { x: 4.8, y: 9.05, w: 0.64, d: 0.25 }, el: <MarketStall x={5.12} y={9.2} snow={c.snow} /> });
    items.push({ key: 'shop_st2', box: { x: 5.8, y: 9.05, w: 0.64, d: 0.25 }, el: <MarketStall x={6.12} y={9.2} snow={c.snow} /> });
  } else {
    items.push({ key: 'shop_bin', box: { x: 4.2, y: 9.05, w: 0.2, d: 0.2 }, el: <Bin x={4.3} y={9.15} snow={c.snow} color="#5a6b8c" /> });
  }
  return { el, lights, chimneys: [], items, height: 50 };
}

// --------------------------------------------------------------------------
// Portiekflat De Zwaluw, met opengewerkte gevel
// --------------------------------------------------------------------------

const ROOM_COLORS = {
  occupied: '#fff2d9',
  vacant: '#dff3df',
  closed: '#8b8fa3'
};

export function drawFlat(c) {
  const id = 'b_flat';
  const b = c.s.buildings[id];
  const balcony = has(b, 'up_flat_balcony');
  const roofUp = has(b, 'up_flat_roof');
  const lift = has(b, 'up_flat_lift');
  const f = fresh(c, id);
  const box = { x: 9.06, y: 8.06, w: 3.88, d: 2.88 };
  const wall = paint('#d9b08a', f);
  const lineCol = shade(wall, -0.45);
  const lights = [];
  const Y = box.y + box.d;
  const unitAt = (floor, side) => Object.values(c.s.units).find((u) => u.buildingId === id && u.floor === floor && u.side === side);
  const FLOOR_Z = [0, 24, 48];
  const roofTop = c.snow ? '#eef3fb' : roofUp ? '#7fae5a' : '#9a9aa6';

  const facade = FLOOR_Z.map((z, fi) => {
    const L = unitAt(fi, 'L');
    const R = unitAt(fi, 'R');
    const litL = Boolean(L?.householdId);
    const litR = Boolean(R?.householdId);
    return (
      <g key={z}>
        <Win c={c} lights={lights} pts={onLeft(box, 0.22, 0.42, z + 7, z + 18)} canLight={litL} t={thr('fl' + z + 'a')} boarded={!L?.ready} />
        <Win c={c} lights={lights} pts={onLeft(box, 0.86, 0.42, z + 7, z + 18)} canLight={litL} t={thr('fl' + z + 'b')} boarded={!L?.ready} />
        <Win c={c} lights={lights} pts={onLeft(box, 2.6, 0.42, z + 7, z + 18)} canLight={litR} t={thr('fl' + z + 'c')} boarded={!R?.ready} />
        <Win c={c} lights={lights} pts={onLeft(box, 3.24, 0.42, z + 7, z + 18)} canLight={litR} t={thr('fl' + z + 'd')} boarded={!R?.ready} />
        {fi > 0 && <Win c={c} lights={lights} pts={onLeft(box, 1.7, 0.48, z + 6, z + 18)} t={0.3} />}
        {[0.35, 1.25, 2.15].map((u) => (
          <Win key={u} c={c} lights={lights} pts={onRight(box, u, 0.4, z + 7, z + 18)} canLight={u < 1.5 ? litR : litL} t={thr('flr' + z + u)} />
        ))}
        {fi > 0 &&
          [0.12, 2.5].map((u) => (
            <g key={'bal' + u}>
              <Prism box={{ x: box.x + u, y: Y, w: 1.25, d: 0.3 }} z0={z} z1={z + 2} color="#c9c4c0" sw={0.6} />
              <polygon points={poly(iso(box.x + u + 1.25, Y + 0.3, z + 9), iso(box.x + u + 1.25, Y, z + 9), iso(box.x + u + 1.25, Y, z + 2), iso(box.x + u + 1.25, Y + 0.3, z + 2))} fill="#4a4562" stroke="#2f2a44" strokeWidth="0.6" />
              <polygon points={poly(iso(box.x + u, Y + 0.3, z + 9), iso(box.x + u + 1.25, Y + 0.3, z + 9), iso(box.x + u + 1.25, Y + 0.3, z + 2), iso(box.x + u, Y + 0.3, z + 2))} fill="#5a5578" fillOpacity="0.92" stroke="#2f2a44" strokeWidth="0.8" />
              <polyline points={poly(iso(box.x + u, Y + 0.3, z + 9.5), iso(box.x + u + 1.25, Y + 0.3, z + 9.5))} stroke="#c9c4c0" strokeWidth="1.2" />
              {balcony && !c.snow && (
                <g>
                  <polygon points={poly(iso(box.x + u + 0.1, Y + 0.3, z + 11), iso(box.x + u + 1.15, Y + 0.3, z + 11), iso(box.x + u + 1.15, Y + 0.3, z + 8), iso(box.x + u + 0.1, Y + 0.3, z + 8))} fill="#4f8a4f" />
                  {[0.2, 0.45, 0.7, 0.95].map((k, i) => {
                    const [px, py] = iso(box.x + u + k, Y + 0.3, z + 12);
                    return <circle key={k} cx={px} cy={py} r="2.1" fill={['#ef6f8e', '#f7c948', '#ffffff', '#9b7fe0'][i]} />;
                  })}
                </g>
              )}
            </g>
          ))}
      </g>
    );
  });

  const cutaway = (
    <g>
      <polygon points={onLeft(box, 0, box.w, 0, 72)} fill="#3a3456" stroke={lineCol} strokeWidth="0.8" />
      <polygon points={onLeft(box, 1.62, 0.64, 1, 71)} fill={balcony ? '#efe2c8' : '#9a97a8'} />
      {FLOOR_Z.map((z) => (
        <polyline key={'st' + z} points={poly(iso(box.x + 1.68, Y, z + 3), iso(box.x + 2.2, Y, z + 21))} stroke="#5d5872" strokeWidth="1.6" fill="none" />
      ))}
      {FLOOR_Z.flatMap((z, fi) =>
        ['L', 'R'].map((side) => {
          const u = unitAt(fi, side);
          if (!u) return null;
          const u0 = side === 'L' ? 0.08 : 2.34;
          const hh = u.householdId ? c.s.households[u.householdId] : null;
          const members = hh ? hh.memberIds.map((m) => c.s.residents[m]).filter(Boolean) : [];
          const bg = !u.ready ? ROOM_COLORS.closed : hh ? ROOM_COLORS.occupied : ROOM_COLORS.vacant;
          const sel = c.selectedUnit === u.id;
          return (
            <g
              key={u.id}
              data-hit="unit"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                c.onUnit?.(u.id);
              }}
            >
              <polygon points={onLeft(box, u0, 1.46, z + 1.5, z + 22.5)} fill={bg} stroke={sel ? '#ffc857' : '#5d5872'} strokeWidth={sel ? 2.4 : 1} />
              <polygon points={onLeft(box, u0, 1.46, z + 1.5, z + 4)} fill={u.ready ? '#c48a52' : '#6b6f82'} />
              {hh && <polygon points={onLeft(box, u0 + 0.15, 0.45, z + 4, z + 9)} fill="#7f9cc4" />}
              {!u.ready && <polygon points={onLeft(box, u0 + 0.9, 0.3, z + 4, z + 10)} fill="#b98a55" stroke="#6b4a33" strokeWidth="0.6" />}
              <text transform={matLeft(box.x + u0 + 0.06, Y, z + 15.5)} fontSize="5.2" fontWeight="800" fill={u.ready ? '#3b3550' : '#f0eef6'}>
                {u.code}
              </text>
              {members.map((m, i) => {
                const [px, py] = iso(box.x + u0 + 0.6 + i * 0.28, Y, z + 11);
                return (
                  <g key={m.id}>
                    <circle cx={px} cy={py} r="4.6" fill={m.color} stroke="#2f2a44" strokeWidth="0.7" />
                    <text x={px} y={py + 2} textAnchor="middle" fontSize="5.4" fontWeight="800" fill="#ffffff">
                      {m.firstName.charAt(0)}
                    </text>
                  </g>
                );
              })}
              {!hh && u.ready && (
                <text transform={matLeft(box.x + u0 + 0.6, Y, z + 8)} fontSize="5" fontWeight="700" fill="#2f6a3f">
                  vrij
                </text>
              )}
            </g>
          );
        })
      )}
    </g>
  );

  const el = (
    <g>
      <Prism box={box} z1={72} color={wall} top={roofTop} line={lineCol} />
      <Prism box={{ x: box.x - 0.05, y: box.y - 0.05, w: box.w + 0.1, d: box.d + 0.1 }} z0={72} z1={76} color={c.snow ? '#e3e9f2' : '#d5d1cc'} top={roofTop} />
      {roofUp ? (
        <g>
          <Prism box={{ x: 9.3, y: 8.3, w: 1.6, d: 1.3 }} z0={76} z1={79} color="#c48a52" top={c.snow ? '#f2f6fc' : '#d9a066'} />
          <Prism box={{ x: 9.4, y: 8.35, w: 0.08, d: 0.08 }} z0={79} z1={92} color="#9a6a42" />
          <Prism box={{ x: 10.8, y: 8.35, w: 0.08, d: 0.08 }} z0={79} z1={92} color="#9a6a42" />
          <Prism box={{ x: 9.35, y: 8.3, w: 1.6, d: 0.12 }} z0={92} z1={94} color="#b07a46" />
          {!c.snow &&
            [[11.2, 8.3], [11.2, 9.5], [9.4, 9.9]].map(([x, y], i) => (
              <polygon key={i} points={poly(iso(x, y, 81), iso(x + 1.4, y, 81), iso(x + 1.4, y + 0.9, 77), iso(x, y + 0.9, 77))} fill="#30477f" stroke="#c9d6f0" strokeWidth="0.8" />
            ))}
        </g>
      ) : (
        <g>
          <Prism box={{ x: 9.6, y: 8.6, w: 0.7, d: 0.7 }} z0={76} z1={83} color="#8e8f9c" top={c.snow ? '#ffffff' : undefined} />
          <Prism box={{ x: 11.5, y: 9.6, w: 0.7, d: 0.7 }} z0={76} z1={83} color="#8e8f9c" top={c.snow ? '#ffffff' : undefined} />
        </g>
      )}
      {c.cutaway ? cutaway : facade}
      {!c.cutaway && (
        <g>
          <polygon points={onLeft(box, 1.7, 0.5, 0, 19)} fill="#4f5873" stroke={lineCol} strokeWidth="0.8" />
          <Prism box={{ x: box.x + 1.6, y: Y, w: 0.7, d: 0.35 }} z0={20} z1={22} color="#8e8f9c" top={c.snow ? '#ffffff' : undefined} />
        </g>
      )}
    </g>
  );

  if (c.dark > 0.4) lights.push({ kind: 'bulb', x: box.x + 1.95, y: Y + 0.2, z: 19, r: 0.7 });
  const items = [];
  if (balcony) items.push({ key: 'flat_tree', box: { x: 8.35, y: 10.25, w: 0.3, d: 0.3 }, el: <Tree x={8.5} y={10.4} kind="BLOSSOM" season={c.season} snow={c.snow} scale={1.05} /> });
  if (lift) items.push({ key: 'flat_bikes', box: { x: 9.25, y: 11.25, w: 0.4, d: 0.2 }, el: <BikeRack x={9.45} y={11.35} /> });
  if (!balcony) items.push({ key: 'flat_tyres', box: { x: 12.6, y: 11.2, w: 0.2, d: 0.2 }, el: <Tyres x={12.7} y={11.3} /> });
  return { el, lights, chimneys: [], items, height: 82 };
}

// --------------------------------------------------------------------------
// Het plein en het veldje (moestuin)
// --------------------------------------------------------------------------

export function pleinGround(c) {
  const b = c.s.buildings.p_plein;
  const green = has(b, 'up_plein_klus');
  const P = PLACE_LAYOUT.p_plein;
  const base = c.snow ? '#e9eef6' : green ? '#c99c74' : '#a9a6a0';
  const tiles = [];
  for (let x = P.x; x < P.x + P.w; x++) {
    for (let y = P.y; y < P.y + P.d; y++) {
      const corner = (x === P.x || x === P.x + P.w - 1) && (y === P.y || y === P.y + P.d - 1);
      const fill = green && corner && !c.snow ? '#86bb5f' : mix(base, '#ffffff', hash01('pl' + x + y) * 0.08);
      tiles.push(<polygon key={x + ',' + y} points={topPts(x, y, 1, 1, 0.3)} fill={fill} stroke={c.snow ? '#d5dce8' : shade(base, -0.18)} strokeWidth="0.5" />);
    }
  }
  return (
    <g pointerEvents="none">
      {tiles}
      {!green && !c.snow && (
        <g stroke="#7f7c76" strokeWidth="0.8" fill="none">
          <polyline points={poly(iso(2.2, 3.6, 0.4), iso(2.6, 4.1, 0.4), iso(2.5, 4.7, 0.4))} />
          <polyline points={poly(iso(4.3, 4.2, 0.4), iso(4.7, 4.5, 0.4), iso(4.6, 5.2, 0.4))} />
        </g>
      )}
    </g>
  );
}

export function pleinItems(c) {
  const b = c.s.buildings.p_plein;
  const green = has(b, 'up_plein_klus');
  const play = has(b, 'up_plein_play');
  const items = [];
  if (green) {
    items.push({ key: 'pl_t1', box: { x: 1.35, y: 3.35, w: 0.3, d: 0.3 }, el: <Tree x={1.5} y={3.5} kind="BLOSSOM" season={c.season} snow={c.snow} /> });
    items.push({ key: 'pl_t2', box: { x: 5.35, y: 3.35, w: 0.3, d: 0.3 }, el: <Tree x={5.5} y={3.5} kind="LEAF" season={c.season} snow={c.snow} /> });
    items.push({ key: 'pl_t3', box: { x: 1.35, y: 5.35, w: 0.3, d: 0.3 }, el: <Tree x={1.5} y={5.5} kind="LEAF" season={c.season} snow={c.snow} scale={0.85} /> });
    items.push({ key: 'pl_b1', box: { x: 2.2, y: 3.2, w: 0.64, d: 0.2 }, el: <Bench x={2.5} y={3.3} snow={c.snow} /> });
    items.push({ key: 'pl_b2', box: { x: 4.2, y: 5.6, w: 0.64, d: 0.2 }, el: <Bench x={4.5} y={5.7} snow={c.snow} color="#5d8fb0" /> });
  } else {
    items.push({ key: 'pl_tyres', box: { x: 4.5, y: 3.4, w: 0.2, d: 0.2 }, el: <Tyres x={4.6} y={3.5} /> });
  }
  if (play) {
    items.push({ key: 'pl_frame', box: { x: 3.15, y: 4.25, w: 0.7, d: 0.5 }, el: <ClimbFrame x={3.5} y={4.5} /> });
    items.push({ key: 'pl_sand', box: { x: 3.15, y: 5.2, w: 0.7, d: 0.6 }, el: <Sandbox x={3.5} y={5.5} snow={c.snow} /> });
  }
  return items;
}

export function gardenGround(c) {
  const b = c.s.buildings.p_garden;
  const done = has(b, 'up_garden');
  const P = PLACE_LAYOUT.p_garden;
  const base = c.snow ? '#e9eef6' : done ? '#8a6b4a' : '#8f8a62';
  return (
    <g pointerEvents="none">
      <polygon points={topPts(P.x, P.y, P.w, P.d, 0.3)} fill={base} stroke={shade(base, -0.25)} strokeWidth="0.6" />
      {!done && !c.snow && (
        <g stroke="#6f7a3f" strokeWidth="1.2" strokeLinecap="round">
          {[[0.5, 10.4], [1.4, 10.9], [2.3, 10.5], [0.8, 11.5], [2.0, 11.6], [1.6, 10.3]].map(([x, y], i) => {
            const [px, py] = iso(x, y, 0.3);
            return <path key={i} d={`M${px - 3} ${py} L${px - 1} ${py - 5} M${px} ${py} L${px} ${py - 6} M${px + 3} ${py} L${px + 1} ${py - 4}`} />;
          })}
        </g>
      )}
    </g>
  );
}

export function gardenItems(c) {
  const done = has(c.s.buildings.p_garden, 'up_garden');
  if (!done) return [];
  return [
    { key: 'gd_1', box: { x: 0.2, y: 10.25, w: 0.76, d: 0.32 }, el: <RaisedBed x={0.6} y={10.4} season={c.season} snow={c.snow} /> },
    { key: 'gd_2', box: { x: 1.9, y: 10.25, w: 0.76, d: 0.32 }, el: <RaisedBed x={2.3} y={10.4} season={c.season} snow={c.snow} /> },
    { key: 'gd_3', box: { x: 0.2, y: 11.25, w: 0.76, d: 0.32 }, el: <RaisedBed x={0.6} y={11.4} season={c.season} snow={c.snow} /> },
    { key: 'gd_4', box: { x: 1.9, y: 11.25, w: 0.76, d: 0.32 }, el: <RaisedBed x={2.3} y={11.4} season={c.season} snow={c.snow} /> },
    { key: 'gd_barrel', box: { x: 2.65, y: 11.7, w: 0.2, d: 0.2 }, el: <Bin x={2.75} y={11.8} color="#4f7fc4" snow={c.snow} /> }
  ];
}

export const BUILDING_DRAWERS = {
  b_hw1: (c) => drawHouse('b_hw1', c),
  b_hw2: (c) => drawHouse('b_hw2', c),
  b_hw3: (c) => drawHouse('b_hw3', c),
  b_hw4: (c) => drawHouse('b_hw4', c),
  b_hw6: (c) => drawHouse('b_hw6', c),
  b_hub: drawHub,
  b_school: drawSchool,
  b_shop: drawShop,
  b_flat: drawFlat
};

export const AREA_HEIGHT = {
  b_hw1: 50, b_hw2: 50, b_hw3: 50, b_hw4: 50, b_hw6: 50,
  b_hub: 78, b_school: 48, b_shop: 52, b_flat: 86, p_plein: 14, p_garden: 12
};

export { matRight };

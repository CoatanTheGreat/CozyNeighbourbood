// De plattegrond van de buurt. Alles (tekening, looproutes, waardes en
// decoraties) leest uit deze ene bron, zodat beeld en spel altijd kloppen.
//
// Raster 14 x 14. x loopt naar rechtsonder, y naar linksonder op het scherm.
// Gevels aan de +y-kant (links-voor) en +x-kant (rechts-voor) zijn zichtbaar.

export const GRID = 14;

// Voetafdruk per gebouw (in tegels) en de tegel voor de voordeur
export const BUILDING_LAYOUT = {
  b_hw1: { x: 0, y: 0, w: 2, d: 2, door: [1, 2] },
  b_hw2: { x: 2, y: 0, w: 2, d: 2, door: [3, 2] },
  b_hw3: { x: 4, y: 0, w: 2, d: 2, door: [5, 2] },
  b_hub: { x: 8, y: 1, w: 3, d: 3, door: [9, 4] },
  b_school: { x: 11, y: 0, w: 3, d: 2, door: [12, 2] },
  b_hw4: { x: 0, y: 7, w: 2, d: 2, door: [1, 9] },
  b_hw6: { x: 2, y: 7, w: 2, d: 2, door: [3, 9] },
  b_shop: { x: 4, y: 7, w: 3, d: 2, door: [7, 7] },
  b_flat: { x: 9, y: 8, w: 4, d: 3, door: [10, 11], doorAt: [11.0, 11.08] }
};

// Open plekken die je ook kunt verbeteren
export const PLACE_LAYOUT = {
  p_plein: { x: 1, y: 3, w: 5, d: 3 },
  p_garden: { x: 0, y: 10, w: 3, d: 2 }
};

export const PLAYGROUND_AREA = { x: 11, y: 2, w: 3, d: 4 };

function baseType(x, y) {
  if (y === 13) return x === 7 ? 'BRIDGE' : 'WATER';
  if (y === 6 || x === 7) return 'ROAD';
  if (x >= 1 && x <= 5 && y >= 3 && y <= 5) return 'PLEIN';
  if (y === 2 && (x === 1 || x === 3 || x === 5)) return 'PATH';
  if (x >= 11 && y >= 2 && y <= 5) return 'PLAYGROUND';
  if ((x === 9 || x === 10) && (y === 4 || y === 5)) return 'FORECOURT';
  if (x === 8 && (y === 4 || y === 5)) return 'PARKING';
  if (y === 9 && x <= 6) return 'PATH';
  if (x <= 2 && (y === 10 || y === 11)) return 'GARDEN';
  if ((y === 7 || y === 11) && x >= 8) return 'PATH';
  return 'GRASS';
}

const inBox = (x, y, b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.d;

export const TILES = [];
for (let y = 0; y < GRID; y++) {
  for (let x = 0; x < GRID; x++) {
    let type = baseType(x, y);
    let buildingId = null;
    for (const [id, b] of Object.entries(BUILDING_LAYOUT)) {
      if (inBox(x, y, b)) {
        type = 'BUILDING';
        buildingId = id;
      }
    }
    let placeId = null;
    for (const [id, p] of Object.entries(PLACE_LAYOUT)) {
      if (inBox(x, y, p)) placeId = id;
    }
    TILES.push({ x, y, type, buildingId, placeId });
  }
}

export const tileAt = (x, y) =>
  x >= 0 && y >= 0 && x < GRID && y < GRID ? TILES[y * GRID + x] : null;

const WALKABLE = new Set(['ROAD', 'PLEIN', 'PATH', 'PLAYGROUND', 'FORECOURT', 'GARDEN', 'BRIDGE']);
export const isWalkable = (x, y) => {
  const t = tileAt(x, y);
  return Boolean(t && WALKABLE.has(t.type));
};

// Tegels waar je zelf iets mag neerzetten
const DECORATABLE = new Set(['GRASS', 'PLEIN']);
export const canDecorateTile = (x, y) => {
  const t = tileAt(x, y);
  return Boolean(t && DECORATABLE.has(t.type));
};

export const centerOf = (box) => ({ x: box.x + box.w / 2, y: box.y + box.d / 2 });

export function areaBox(id) {
  return BUILDING_LAYOUT[id] || PLACE_LAYOUT[id] || null;
}

// Punt waar iemand naar binnen of buiten stapt: tegen de gevel aan
export function doorPoint(buildingId) {
  const b = BUILDING_LAYOUT[buildingId];
  if (b.doorAt) return { x: b.doorAt[0], y: b.doorAt[1] };
  const [tx, ty] = b.door;
  let px = tx + 0.5;
  let py = ty + 0.5;
  if (ty === b.y + b.d) py = ty + 0.08;
  else if (tx === b.x + b.w) px = tx + 0.08;
  return { x: px, y: py };
}

// Tegels op het plein waar straks bomen, bankjes en het klimrek komen
export const RESERVED_TILES = new Set(['1,3', '5,3', '1,5', '5,5', '3,4', '2,3', '4,5', '3,5']);

// Bestemmingen voor wandelingen
export const SPOTS = {
  plein: { tile: [2, 4], at: [2.6, 4.6], icon: '☕' },
  pleinbank: { tile: [2, 3], at: [2.5, 3.62], icon: '💬' },
  speelplein: { tile: [12, 4], at: [12.4, 4.3], icon: '⚽' },
  moestuin: { tile: [1, 10], at: [1.3, 10.8], icon: '🌱' },
  oever: { tile: [7, 13], at: [7.5, 13.3], icon: '🐦' },
  winkel: { door: 'b_shop', icon: '🛒' },
  buurthuis: { door: 'b_hub', icon: '☕' },
  school: { door: 'b_school', icon: '🎒' },
  flat: { door: 'b_flat', icon: '🏢' },
  annie: { door: 'b_hw2', icon: '🫖' },
  werk_n: { tile: [7, 0], at: [7.3, -0.6], away: true },
  werk_w: { tile: [0, 6], at: [-0.6, 6.7], away: true },
  werk_o: { tile: [13, 6], at: [14.6, 6.3], away: true }
};

// Kortste route over begaanbare tegels (breadth-first)
const pathCache = new Map();
export function findPath(from, to) {
  const key = from.join(',') + '>' + to.join(',');
  if (pathCache.has(key)) return pathCache.get(key);
  const start = from[0] + from[1] * GRID;
  const goal = to[0] + to[1] * GRID;
  const prev = new Map([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === goal) break;
    const cx = cur % GRID;
    const cy = Math.floor(cur / GRID);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      const id = nx + ny * GRID;
      if (!prev.has(id) && isWalkable(nx, ny)) {
        prev.set(id, cur);
        queue.push(id);
      }
    }
  }
  const path = [];
  if (prev.has(goal)) {
    let c = goal;
    while (c !== -1) {
      path.unshift([c % GRID, Math.floor(c / GRID)]);
      c = prev.get(c);
    }
  }
  pathCache.set(key, path);
  return path;
}

function spotTarget(key) {
  const s = SPOTS[key];
  if (!s) return null;
  if (s.door) {
    const b = BUILDING_LAYOUT[s.door];
    const p = doorPoint(s.door);
    return { tile: b.door, at: [p.x, p.y], icon: s.icon, door: true };
  }
  return { tile: s.tile, at: s.at, icon: s.icon, away: Boolean(s.away) };
}

// Route als lijst punten, met een eigen "loopstrook" per bewoner op straat
const routeCache = new Map();
export function buildRoute(homeBuildingId, spotKey, side) {
  const key = `${homeBuildingId}|${spotKey}|${side}`;
  if (routeCache.has(key)) return routeCache.get(key);
  const target = spotTarget(spotKey);
  const home = BUILDING_LAYOUT[homeBuildingId];
  if (!target || !home) return null;
  const tiles = findPath(home.door, target.tile);
  if (!tiles.length) return null;
  const pts = [doorPoint(homeBuildingId)];
  for (const [tx, ty] of tiles) {
    let cx = tx + 0.5;
    let cy = ty + 0.5;
    const t = tileAt(tx, ty);
    if (t.type === 'ROAD') {
      if (ty === 6 && tx !== 7) cy += side * 0.36;
      else if (tx === 7 && ty !== 6) cx += side * 0.36;
    } else if (t.type === 'PLEIN' || t.type === 'PLAYGROUND') {
      cx += side * 0.12;
      cy -= side * 0.1;
    }
    pts.push({ x: cx, y: cy });
  }
  pts.push({ x: target.at[0], y: target.at[1] });
  let length = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(l);
    length += l;
  }
  const route = { pts, seg, length, icon: target.icon, away: target.away };
  routeCache.set(key, route);
  return route;
}

export function pointOnRoute(route, dist) {
  let d = Math.max(0, Math.min(route.length, dist));
  for (let i = 0; i < route.seg.length; i++) {
    if (d <= route.seg[i] || i === route.seg.length - 1) {
      const a = route.pts[i];
      const b = route.pts[i + 1];
      const k = route.seg[i] > 0 ? d / route.seg[i] : 0;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: b.x - a.x, dy: b.y - a.y };
    }
    d -= route.seg[i];
  }
  const last = route.pts[route.pts.length - 1];
  return { x: last.x, y: last.y, dx: 0, dy: 0 };
}

// Vaste aankleding van de buurt
export const STREET_LAMPS = [
  { x: 6.15, y: 5.82 },
  { x: 0.4, y: 5.82 },
  { x: 8.18, y: 7.18 },
  { x: 12.6, y: 7.2 },
  { x: 6.82, y: 9.25 },
  { x: 9.6, y: 11.82 },
  { x: 10.9, y: 5.82 },
  { x: 6.82, y: 12.3 }
];

export const SCENERY_TREES = [
  { x: 6.5, y: 0.6, kind: 'LEAF', s: 1 },
  { x: 6.5, y: 2.4, kind: 'LEAF', s: 0.85 },
  { x: 9.2, y: 0.45, kind: 'LEAF', s: 0.9 },
  { x: 0.5, y: 4.6, kind: 'PINE', s: 0.9 },
  { x: 13.4, y: 9.4, kind: 'PINE', s: 1.05 },
  { x: 13.3, y: 8.4, kind: 'PINE', s: 0.85 },
  { x: 12.5, y: 12.5, kind: 'PINE', s: 1 },
  { x: 5.5, y: 12.4, kind: 'PINE', s: 1.05 },
  { x: 4.4, y: 10.8, kind: 'LEAF', s: 0.95 },
  { x: 0.6, y: 12.5, kind: 'LEAF', s: 0.9 },
  { x: 9.6, y: 12.5, kind: 'LEAF', s: 0.85 }
];

export const PARKED_CARS = [
  { x: 8.5, y: 4.5, axis: 'y', color: '#5b7c99' },
  { x: 8.5, y: 5.5, axis: 'y', color: '#b98b4e' },
  { x: 13.5, y: 11.5, axis: 'x', color: '#7a6a9c' }
];

// Doorgaand verkeer: richting, rijstrook en hoe vaak er een auto langskomt
export const TRAFFIC = [
  { id: 'c1', axis: 'y', lane: 7.72, from: -1.5, to: 15, period: 38, offset: 0, color: '#c8483e' },
  { id: 'c2', axis: 'x', lane: 6.28, from: -1.5, to: 15.5, period: 46, offset: 17, color: '#e0b04a' },
  { id: 'c3', axis: 'x', lane: 6.72, from: 15.5, to: -1.5, period: 53, offset: 31, color: '#4f8a8b' }
];

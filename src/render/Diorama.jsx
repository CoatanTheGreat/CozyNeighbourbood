// Het diorama. Statische delen worden alleen opnieuw opgebouwd als de buurt
// verandert; bewoners, auto's, rook en weer bewegen elk frame.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { iso, poly, topPts } from './iso.jsx';
import { Tree, Bench, LampPost, Planter, Picnic, FirePit, Hopscotch, Car, Person, Ladder } from './props.jsx';
import { BUILDING_DRAWERS, AREA_HEIGHT, pleinGround, pleinItems, gardenGround, gardenItems, playgroundGround } from './buildings.jsx';
import {
  GRID, TILES, BUILDING_LAYOUT, PLACE_LAYOUT, PLAYGROUND_AREA, STREET_LAMPS, SCENERY_TREES, PARKED_CARS, TRAFFIC,
  buildRoute, pointOnRoute, doorPoint, areaBox, centerOf
} from '../game/layout.js';
import { qualityMap, neighbourhoodBloom, bikesEnabled, canPlaceAt, displayName } from '../game/simulation.js';
import { lifeStageOf } from '../game/content.js';
import { lightAt, calendar } from '../game/time.js';
import { mix, shade, desaturate, hash01, clamp, smooth } from '../game/util.js';
import { sound } from '../audio/soundscape.js';

const VB = { x: -520, y: -200, w: 1040, h: 720 };
const C = { x: 0, y: 150 };

// --------------------------------------------------------------------------
// Dieptesortering: wat verder weg staat, wordt eerst getekend
// --------------------------------------------------------------------------

function depthSort(items) {
  const n = items.length;
  const eps = 0.001;
  const behind = (a, b) => a.x + a.w <= b.x + eps || a.y + a.d <= b.y + eps;
  const sx = items.map((it) => [(it.box.x - it.box.y - it.box.d) * 32, (it.box.x + it.box.w - it.box.y) * 32]);
  const indeg = new Array(n).fill(0);
  const edges = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (sx[i][1] < sx[j][0] || sx[j][1] < sx[i][0]) continue;
      const A = items[i].box;
      const B = items[j].box;
      const ab = behind(A, B);
      const ba = behind(B, A);
      if (ab && !ba) {
        edges[i].push(j);
        indeg[j]++;
      } else if (ba && !ab) {
        edges[j].push(i);
        indeg[i]++;
      } else if (!ab && !ba) {
        const ka = A.x + A.w / 2 + A.y + A.d / 2;
        const kb = B.x + B.w / 2 + B.y + B.d / 2;
        if (ka <= kb) {
          edges[i].push(j);
          indeg[j]++;
        } else {
          edges[j].push(i);
          indeg[i]++;
        }
      }
    }
  }
  const key = items.map((it) => it.box.x + it.box.y + it.box.w + it.box.d);
  const done = new Array(n).fill(false);
  const out = [];
  for (let k = 0; k < n; k++) {
    let best = -1;
    for (let i = 0; i < n; i++) {
      if (!done[i] && indeg[i] === 0 && (best < 0 || key[i] < key[best])) best = i;
    }
    if (best < 0) {
      for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || key[i] < key[best])) best = i;
    }
    done[best] = true;
    out.push(items[best]);
    for (const j of edges[best]) indeg[j]--;
  }
  return out;
}

// --------------------------------------------------------------------------
// Silhouetten van gebouwen, om licht erachter af te dekken
// --------------------------------------------------------------------------

const SILHOUETTE_RAW = Object.entries(BUILDING_LAYOUT).map(([id, b]) => {
  const H = (AREA_HEIGHT[id] || 40) - 4;
  return [iso(b.x, b.y + b.d, 0), iso(b.x + b.w, b.y + b.d, 0), iso(b.x + b.w, b.y, 0), iso(b.x + b.w, b.y, H), iso(b.x, b.y, H), iso(b.x, b.y + b.d, H)];
});
const SILHOUETTES = SILHOUETTE_RAW.map((pts) => poly(...pts));

function insidePoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Een lamp achter een gebouw is niet te zien
function bulbHidden(l) {
  const [px, py] = iso(l.x, l.y, l.z);
  return Object.values(BUILDING_LAYOUT).some((b, i) => (l.x <= b.x || l.y <= b.y) && insidePoly(px, py, SILHOUETTE_RAW[i]));
}

// --------------------------------------------------------------------------
// Grond
// --------------------------------------------------------------------------

function tileFill(t, c, q) {
  const h = hash01(`t${t.x},${t.y}`);
  switch (t.type) {
    case 'GRASS': {
      if (c.snow) return mix('#e6edf7', '#ffffff', h * 0.5);
      const k = clamp(0.2 + c.bloom * 0.45 + q * 1.5, 0, 1);
      return mix(mix('#979c7f', '#8dc566', k), '#ffffff', h * 0.06);
    }
    case 'ROAD':
      return c.snow ? '#c8cfdc' : '#878a95';
    case 'PATH':
      return c.snow ? '#e6ebf3' : mix('#cdc4b3', '#ffffff', h * 0.08);
    case 'FORECOURT':
      return c.snow ? '#e6ebf3' : '#bfb9ae';
    case 'PARKING':
      return c.snow ? '#d9dfea' : '#9c9fa7';
    case 'WATER':
      return c.season === 'WINTER' ? '#b3cbe0' : mix('#6b8ea6', '#4f9cc6', c.bloom);
    case 'BRIDGE':
      return c.snow ? '#e9edf4' : '#a77b52';
    default:
      return c.snow ? '#e6ebf3' : '#a39b8e';
  }
}

function Ground({ c, q, onArea, decorate, onTile }) {
  const roadEdges = [];
  const isRoadish = (x, y) => {
    const t = TILES[y * GRID + x];
    return t && (t.type === 'ROAD' || t.type === 'BRIDGE');
  };
  for (const t of TILES) {
    if (t.type !== 'ROAD') continue;
    const { x, y } = t;
    if (y - 1 >= 0 && !isRoadish(x, y - 1)) roadEdges.push([iso(x, y, 0.5), iso(x + 1, y, 0.5)]);
    if (y + 1 < GRID && !isRoadish(x, y + 1)) roadEdges.push([iso(x, y + 1, 0.5), iso(x + 1, y + 1, 0.5)]);
    if (x - 1 >= 0 && !isRoadish(x - 1, y)) roadEdges.push([iso(x, y, 0.5), iso(x, y + 1, 0.5)]);
    if (x + 1 < GRID && !isRoadish(x + 1, y)) roadEdges.push([iso(x + 1, y, 0.5), iso(x + 1, y + 1, 0.5)]);
  }
  const dash = (a, b) => {
    const p1 = iso(a[0], a[1], 0.6);
    const p2 = iso(b[0], b[1], 0.6);
    return <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#f4f1ea" strokeWidth="1.6" strokeDasharray="8 8" opacity={c.snow ? 0.35 : 0.8} />;
  };
  return (
    <g>
      {/* Sokkel van het eiland */}
      <polygon points={poly(iso(0, GRID, 0), iso(GRID, GRID, 0), iso(GRID, GRID, -30), iso(0, GRID, -30))} fill={c.snow ? '#8c90a8' : '#7a6450'} />
      <polygon points={poly(iso(GRID, GRID, 0), iso(GRID, 0, 0), iso(GRID, 0, -30), iso(GRID, GRID, -30))} fill={c.snow ? '#6f7390' : '#634f40'} />
      <polygon points={poly(iso(0, GRID, -4), iso(GRID, GRID, -4), iso(GRID, 0, -4))} fill="none" stroke={c.snow ? '#b7bccd' : '#5e7a45'} strokeWidth="5" opacity="0.6" />
      {TILES.map((t, i) => (
        <polygon key={i} points={topPts(t.x, t.y, 1, 1, 0)} fill={tileFill(t, c, q[i])} stroke={shade(tileFill(t, c, q[i]), -0.07)} strokeWidth="0.5" />
      ))}
      {roadEdges.map(([a, b], i) => (
        <line key={'e' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c.snow ? '#f6f8fc' : '#d6d0c4'} strokeWidth="2.2" strokeLinecap="round" />
      ))}
      {dash([0, 6.5], [6.9, 6.5])}
      {dash([8.1, 6.5], [14, 6.5])}
      {dash([7.5, 0], [7.5, 5.9])}
      {dash([7.5, 7.1], [7.5, 13])}
      {[5, 7].map((yy) =>
        [0.12, 0.32, 0.52, 0.72].map((o) => (
          <polygon key={yy + '-' + o} points={topPts(7 + o, yy + 0.18, 0.12, 0.64, 0.7)} fill="#f4f1ea" opacity={c.snow ? 0.4 : 0.85} />
        ))
      )}
      {c.snow && (
        <g fill="none" stroke="#8d95ab" strokeWidth="3" opacity="0.45">
          <path d={`M${iso(0, 6.3)[0]} ${iso(0, 6.3)[1]} Q${iso(7.3, 6.4)[0]} ${iso(7.3, 6.4)[1]} ${iso(7.35, 13)[0]} ${iso(7.35, 13)[1]}`} />
          <path d={`M${iso(7.7, 0)[0]} ${iso(7.7, 0)[1]} Q${iso(7.7, 6.7)[0]} ${iso(7.7, 6.7)[1]} ${iso(14, 6.7)[0]} ${iso(14, 6.7)[1]}`} />
        </g>
      )}
      {/* Parkeervakken */}
      <polyline points={poly(iso(8, 5, 0.6), iso(9, 5, 0.6))} stroke="#f4f1ea" strokeWidth="1.2" opacity={c.snow ? 0.3 : 0.8} />
      {/* Golfjes in de gracht */}
      {c.season !== 'WINTER' &&
        [1.5, 4.2, 9.4, 11.8].map((x, i) => (
          <line key={'w' + i} x1={iso(x, 13.45)[0]} y1={iso(x, 13.45)[1]} x2={iso(x + 0.5, 13.45)[0]} y2={iso(x + 0.5, 13.45)[1]} stroke="#cfe6f5" strokeWidth="1.2" opacity="0.6" />
        ))}
      {pleinGround(c)}
      {gardenGround(c)}
      {playgroundGround(c)}
      {/* Schaduwen van gebouwen */}
      <g filter="url(#shadowBlur)" opacity="0.28">
        {Object.entries(BUILDING_LAYOUT).map(([id, b]) => (
          <polygon key={id} points={topPts(b.x + 0.25, b.y - 0.1, b.w + 0.35, b.d + 0.05, 0.2)} fill="#2a2140" />
        ))}
      </g>
      {/* Platte decoraties */}
      {Object.entries(c.s.decorations).map(([k, type]) => {
        if (type !== 'HOPSCOTCH') return null;
        const [x, y] = k.split(',').map(Number);
        return <Hopscotch key={k} x={x} y={y} />;
      })}
      {/* Geselecteerde plek */}
      {c.selectedArea && areaBox(c.selectedArea) && (
        <polygon
          points={(() => {
            const b = areaBox(c.selectedArea);
            return topPts(b.x - 0.05, b.y - 0.05, b.w + 0.1, b.d + 0.1, 0.8);
          })()}
          fill="#ffc857"
          fillOpacity="0.22"
          stroke="#ffc857"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
      )}
      {/* Inrichten: geldige tegels oplichten en klikbaar maken */}
      {decorate &&
        TILES.map((t) => {
          const k = `${t.x},${t.y}`;
          const can = decorate === 'REMOVE' ? Boolean(c.s.decorations[k]) : canPlaceAt(c.s, t.x, t.y);
          if (!can) return null;
          return (
            <polygon
              key={'d' + k}
              data-hit="tile"
              points={topPts(t.x + 0.04, t.y + 0.04, 0.92, 0.92, 1)}
              fill={decorate === 'REMOVE' ? '#ff8fa3' : '#ffffff'}
              fillOpacity="0.28"
              stroke={decorate === 'REMOVE' ? '#ff8fa3' : '#ffc857'}
              strokeWidth="1.4"
              strokeDasharray="4 3"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onTile(t.x, t.y);
              }}
            />
          );
        })}
      {/* Klikvlakken voor plein, veldje en speelplaats */}
      {!decorate &&
        [
          ['p_plein', PLACE_LAYOUT.p_plein],
          ['p_garden', PLACE_LAYOUT.p_garden],
          ['b_school', PLAYGROUND_AREA]
        ].map(([id, b]) => (
          <polygon
            key={'hit' + id}
            data-hit="area"
            points={topPts(b.x, b.y, b.w, b.d, 0.5)}
            fill="transparent"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onArea(id);
            }}
          />
        ))}
    </g>
  );
}

// --------------------------------------------------------------------------
// Statische objecten (gebouwen, bomen, lampen, decoraties)
// --------------------------------------------------------------------------

function buildStatic(c, onArea, decorate) {
  const items = [];
  const lights = [];
  const chimneys = [];
  for (const [id, draw] of Object.entries(BUILDING_DRAWERS)) {
    const r = draw(c);
    const b = BUILDING_LAYOUT[id];
    items.push({
      key: id,
      box: { x: b.x, y: b.y, w: b.w, d: b.d },
      el: (
        <g
          data-hit="area"
          className={decorate ? undefined : 'cursor-pointer'}
          onClick={(e) => {
            e.stopPropagation();
            if (!decorate) onArea(id);
          }}
        >
          {r.el}
        </g>
      )
    });
    items.push(...r.items);
    lights.push(...r.lights);
    chimneys.push(...r.chimneys);
  }
  items.push(...pleinItems(c), ...gardenItems(c));

  const dull = 1 - clamp(c.bloom * 1.4, 0, 1);
  for (const t of SCENERY_TREES) {
    items.push({ key: `tree${t.x},${t.y}`, box: { x: t.x - 0.15, y: t.y - 0.15, w: 0.3, d: 0.3 }, el: <Tree x={t.x} y={t.y} kind={t.kind} season={c.season} snow={c.snow} scale={t.s} dull={dull} /> });
  }
  for (const l of STREET_LAMPS) {
    items.push({ key: `lamp${l.x},${l.y}`, box: { x: l.x - 0.05, y: l.y - 0.05, w: 0.1, d: 0.1 }, el: <LampPost x={l.x} y={l.y} warm={c.dark > 0.3} /> });
    lights.push({ kind: 'pool', x: l.x + 0.11, y: l.y - 0.11, r: 1 }, { kind: 'bulb', x: l.x + 0.11, y: l.y - 0.11, z: 32, r: 1 });
  }
  for (const p of PARKED_CARS) {
    items.push({ key: `park${p.x},${p.y}`, box: { x: p.x - 0.4, y: p.y - 0.4, w: 0.8, d: 0.8 }, el: <Car x={p.x} y={p.y} axis={p.axis} color={desaturate(p.color, dull * 0.4)} snowRoof={c.snow} /> });
  }
  for (const [k, type] of Object.entries(c.s.decorations)) {
    const [x, y] = k.split(',').map(Number);
    const cx = x + 0.5;
    const cy = y + 0.5;
    const box = { x: cx - 0.25, y: cy - 0.25, w: 0.5, d: 0.5 };
    let el = null;
    if (type === 'TREE') el = <Tree x={cx} y={cy} kind="BLOSSOM" season={c.season} snow={c.snow} scale={0.9} />;
    else if (type === 'BENCH') el = <Bench x={cx} y={cy} snow={c.snow} />;
    else if (type === 'LAMP') {
      el = <LampPost x={cx} y={cy} warm={c.dark > 0.3} />;
      lights.push({ kind: 'pool', x: cx + 0.11, y: cy - 0.11, r: 0.8 }, { kind: 'bulb', x: cx + 0.11, y: cy - 0.11, z: 32, r: 1 });
    } else if (type === 'PLANTER') el = <Planter x={cx} y={cy} season={c.season} snow={c.snow} />;
    else if (type === 'PICNIC') el = <Picnic x={cx} y={cy} snow={c.snow} />;
    else if (type === 'FIREPIT') {
      el = null; // vlammen bewegen, daarom in de dynamische laag
      lights.push({ kind: 'pool', x: cx, y: cy, r: 0.7, color: '#ff8a3c' });
    }
    if (el) items.push({ key: 'deco' + k, box, el });
  }
  return { items, lights, chimneys };
}

// --------------------------------------------------------------------------
// Bewoners op straat
// --------------------------------------------------------------------------

function computeWalkers(s, t, dark, bikes, busy) {
  const out = [];
  for (const r of Object.values(s.residents)) {
    if (busy.has(r.id)) continue;
    const stage = lifeStageOf(r.age);
    if (stage === 'BABY') continue;
    const unit = s.units[r.unitId];
    if (!unit) continue;
    const home = unit.buildingId;
    const h = hash01(r.id);
    const side = h < 0.5 ? -1 : 1;
    const routine = r.routine.filter((k) => !(k === 'flat' && home === 'b_flat') && !(k === 'annie' && home === 'b_hw2'));
    const routes = routine.map((k) => buildRoute(home, k, side)).filter(Boolean);
    if (!routes.length) continue;
    const bike = bikes && (stage === 'ADULT' || stage === 'YOUTH') && h > 0.55;
    const v = (stage === 'SENIOR' ? 0.42 : stage === 'CHILD' ? 0.72 : 0.58) * (bike ? 2.2 : 1);
    const maxWalk = Math.max(...routes.map((r2) => r2.length)) / v;
    const dwell = 7 + h * 7;
    const rest = 5 + hash01(r.id + 'rust') * 12;
    const slot = 2 * maxWalk + dwell + rest;
    const tt = t + h * slot * 3.7;
    const k = Math.floor(tt / slot);
    const local = tt - k * slot;
    const route = routes[(k + Math.floor(h * 7)) % routes.length];
    const w = route.length / v;
    let pos = null;
    let moving = true;
    if (local < w) pos = pointOnRoute(route, local * v);
    else if (local < w + dwell) {
      if (route.away) continue;
      pos = pointOnRoute(route, route.length);
      moving = false;
    } else if (local < 2 * w + dwell) pos = pointOnRoute(route, route.length - (local - w - dwell) * v);
    else continue;
    const nightThr = stage === 'CHILD' ? 0.35 : 0.55 + h * 0.4;
    let alpha = clamp((nightThr - dark) / 0.12, 0, 1);
    if (route.away) {
      const toEnd = route.length - (local < w ? local * v : route.length - (local - w - dwell) * v);
      alpha *= clamp(toEnd / 0.8, 0, 1);
    }
    const fromHome = local < w ? local * v : route.length - (local - w - dwell) * v;
    alpha *= clamp(fromHome / 0.25, 0, 1);
    if (alpha <= 0.02) continue;
    out.push({ r, stage, x: pos.x, y: pos.y, alpha, moving, bike, icon: moving ? null : route.icon });
  }
  return out;
}

// --------------------------------------------------------------------------
// De component
// --------------------------------------------------------------------------

export default function Diorama({
  game, clockRef, speed, weather, selectedArea, selectedResident, selectedUnit, cutaway, decorate,
  onArea, onResident, onUnit, onTile, onBackground, overlay, reducedMotion, onDragStart
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [frame, setFrame] = useState({ t: 0, now: 0 });
  const [cam, setCam] = useState({ x: 0, y: 0, z: 1 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const anim = useRef({ t: 0, last: 0, lastSet: 0, knock: 0 });

  useEffect(() => {
    let raf;
    const loop = (now) => {
      const a = anim.current;
      const dt = a.last ? Math.min(0.1, (now - a.last) / 1000) : 0;
      a.last = now;
      a.t += dt * Math.max(1, speedRef.current);
      if (now - a.lastSet > 33) {
        a.lastSet = now;
        setFrame({ t: a.t, now });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fraction = clockRef.current.fraction;
  const light = lightAt(fraction);
  const dark = light.darkness;
  const darkBucket = Math.round(dark * 10) / 10;
  const { season } = calendar(game.day);
  const snow = season === 'WINTER';
  const bloom = useMemo(() => neighbourhoodBloom(game), [game]);
  const q = useMemo(() => qualityMap(game), [game]);
  const bikes = useMemo(() => bikesEnabled(game), [game]);

  const c = useMemo(
    () => ({ s: game, season, snow, dark: darkBucket, bloom, cutaway, selectedArea, selectedUnit, onUnit }),
    [game, season, snow, darkBucket, bloom, cutaway, selectedArea, selectedUnit, onUnit]
  );
  const stat = useMemo(() => buildStatic(c, onArea, decorate), [c, onArea, decorate]);
  const ground = useMemo(() => <Ground c={c} q={q} onArea={onArea} decorate={decorate} onTile={onTile} />, [c, q, onArea, decorate, onTile]);

  // Klusdagen: helpers bij de deur, ladder tegen de gevel
  const busy = new Set();
  const dyn = [];
  const dynLights = [];
  const overlays = [];
  for (const w of game.pendingWork) {
    const L = BUILDING_LAYOUT[w.buildingId] || PLACE_LAYOUT[w.buildingId];
    const progress = clamp((frame.now - w.start) / w.duration, 0, 1);
    let base;
    let along;
    if (BUILDING_LAYOUT[w.buildingId]) {
      base = doorPoint(w.buildingId);
      along = L.door[0] === L.x + L.w ? [0, -1] : [1, 0];
      base = { x: base.x + (along[0] === 0 ? 0.25 : 0), y: base.y + (along[0] === 0 ? 0 : 0.25) };
    } else {
      const ctr = centerOf(L);
      base = { x: ctr.x - 0.6, y: ctr.y };
      along = [1, 0];
    }
    w.helpers.forEach((id, i) => {
      const r = game.residents[id];
      if (!r) return;
      busy.add(id);
      const off = (i - (w.helpers.length - 1) / 2) * 0.38;
      const x = base.x + along[0] * off;
      const y = base.y + along[1] * off;
      const hop = Math.abs(Math.sin(frame.t * 7 + i * 1.7)) * 3;
      dyn.push({ key: 'help' + id, box: { x: x - 0.1, y: y - 0.1, w: 0.2, d: 0.2 }, el: <Person x={x} y={y} r={r} stage={lifeStageOf(r.age)} hop={hop} icon={i === 0 ? '🔨' : null} /> });
    });
    if (BUILDING_LAYOUT[w.buildingId]) {
      const dp = doorPoint(w.buildingId);
      const lx = along[0] === 0 ? dp.x - 0.02 : dp.x + 0.45;
      const ly = along[0] === 0 ? dp.y - 0.45 : dp.y - 0.02;
      dyn.push({ key: 'ladder' + w.id, box: { x: lx - 0.1, y: ly - 0.1, w: 0.12, d: 0.12 }, el: <Ladder x={lx} y={ly} h={Math.min(30, (AREA_HEIGHT[w.buildingId] || 30) - 8)} /> });
    }
    const ctr = centerOf(L);
    const [ax, ay] = iso(ctr.x, ctr.y, (AREA_HEIGHT[w.buildingId] || 30) + 18);
    const R = 9;
    const ang = progress * Math.PI * 2;
    overlays.push(
      <g key={'prog' + w.id} transform={`translate(${ax},${ay})`} pointerEvents="none">
        <circle r={R + 4} fill="#262449" opacity="0.85" />
        <circle r={R} fill="none" stroke="#4a4670" strokeWidth="3" />
        <path d={`M0 ${-R} A${R} ${R} 0 ${ang > Math.PI ? 1 : 0} 1 ${Math.sin(ang) * R} ${-Math.cos(ang) * R}`} fill="none" stroke="#ffc857" strokeWidth="3" strokeLinecap="round" />
        <text y="3.5" textAnchor="middle" fontSize="9">{w.klus ? '🤝' : '🔧'}</text>
      </g>
    );
  }
  // Klopgeluid tijdens een klus
  if (game.pendingWork.length && frame.now - anim.current.knock > 650) {
    anim.current.knock = frame.now;
    sound.knock();
  }

  const walkers = computeWalkers(game, frame.t, dark, bikes, busy);
  for (const wk of walkers) {
    const sel = selectedResident === wk.r.id;
    const hop = wk.moving && !wk.bike && !reducedMotion ? Math.abs(Math.sin(frame.t * 9 + hash01(wk.r.id) * 6)) * 1.6 : 0;
    dyn.push({
      key: 'walk' + wk.r.id,
      box: { x: wk.x - 0.1, y: wk.y - 0.1, w: 0.2, d: 0.2 },
      el: (
        <g
          data-hit="person"
          className={decorate ? undefined : 'cursor-pointer'}
          pointerEvents={decorate ? 'none' : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onResident(wk.r.id);
          }}
        >
          <circle cx={iso(wk.x, wk.y)[0]} cy={iso(wk.x, wk.y)[1] - 8} r="11" fill="transparent" />
          <Person x={wk.x} y={wk.y} r={wk.r} stage={wk.stage} alpha={wk.alpha} bike={wk.bike} hop={hop} selected={sel} icon={wk.icon} name={sel ? displayName(wk.r) : null} />
        </g>
      )
    });
  }

  // Doorgaand verkeer
  for (const car of TRAFFIC) {
    const span = Math.abs(car.to - car.from);
    const drive = span / 1.4;
    const ph = (frame.t + car.offset) % car.period;
    if (ph > drive) continue;
    const pos = car.from + Math.sign(car.to - car.from) * ph * 1.4;
    const x = car.axis === 'x' ? pos : car.lane;
    const y = car.axis === 'x' ? car.lane : pos;
    dyn.push({ key: car.id, box: { x: x - 0.4, y: y - 0.4, w: 0.8, d: 0.8 }, el: <Car x={x} y={y} axis={car.axis} color={car.color} snowRoof={false} /> });
    const dir = Math.sign(car.to - car.from);
    dynLights.push({ kind: 'beam', x, y, axis: car.axis, dir });
  }

  // Vuurkorven flakkeren
  for (const [k, type] of Object.entries(game.decorations)) {
    if (type !== 'FIREPIT') continue;
    const [x, y] = k.split(',').map(Number);
    dyn.push({ key: 'fire' + k, box: { x: x + 0.3, y: y + 0.3, w: 0.4, d: 0.4 }, el: <FirePit x={x + 0.5} y={y + 0.5} t={frame.t} /> });
  }

  const sorted = depthSort([...stat.items, ...dyn]);

  // Rook uit de schoorstenen bij koud weer of 's avonds
  const smoky = season === 'AUTUMN' || season === 'WINTER' || dark > 0.4;
  const smoke = smoky && !reducedMotion
    ? stat.chimneys.flatMap((ch, ci) =>
        [0, 1, 2].map((i) => {
          const ph = (frame.t * 0.22 + i / 3 + hash01('ch' + ci)) % 1;
          const [px, py] = iso(ch.x, ch.y, ch.z + ph * 26);
          return <circle key={ci + '-' + i} cx={px + ph * 10} cy={py} r={3 + ph * 5} fill="#eef0f7" opacity={0.45 * (1 - ph)} />;
        })
      )
    : null;

  // Lichtlaag
  const lightOpacity = smooth((dark - 0.12) / 0.6);
  const allLights = [...stat.lights, ...dynLights];
  const groundLights = allLights.filter((l) => l.kind === 'pool' || l.kind === 'beam');
  const airLights = allLights.filter((l) => (l.kind === 'pane' || l.kind === 'sign' || l.kind === 'bulb') && !(l.kind === 'bulb' && bulbHidden(l)));

  // Weer
  const particles = [];
  if (weather !== 'CLEAR') {
    const n = reducedMotion ? 16 : weather === 'RAIN' ? 60 : 44;
    for (let i = 0; i < n; i++) {
      const sp = weather === 'RAIN' ? 260 : weather === 'SNOW' ? 34 : 46;
      const px = VB.x + ((i * 97.3 + frame.t * (weather === 'RAIN' ? 60 : 22)) % VB.w);
      const py = VB.y + ((i * 61.7 + frame.t * sp) % VB.h);
      if (weather === 'RAIN') particles.push(<line key={i} x1={px} y1={py} x2={px - 4} y2={py + 12} stroke="#d6e8f7" strokeWidth="1.1" opacity="0.55" />);
      else if (weather === 'SNOW') particles.push(<circle key={i} cx={px + Math.sin(frame.t * 1.5 + i) * 8} cy={py} r={1.6 + (i % 3) * 0.6} fill="#ffffff" opacity="0.9" />);
      else particles.push(<ellipse key={i} cx={px + Math.cos(frame.t * 1.2 + i) * 12} cy={py} rx="3.2" ry="1.8" fill={weather === 'BLOSSOM' ? '#ffd1e3' : '#e8893a'} opacity="0.85" transform={`rotate(${(frame.t * 40 + i * 30) % 360} ${px} ${py})`} />);
    }
  }

  // ------------------------------------------------------------------------
  // Camera en aanraking
  // ------------------------------------------------------------------------

  const unitsPerPx = () => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return 1;
    return Math.max(VB.w / r.width, VB.h / r.height);
  };
  const toView = (sx, sy) => {
    const svg = svgRef.current;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(sx, sy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const zoomAt = useCallback((sx, sy, nz) => {
    const v = toView(sx, sy);
    const cm = camRef.current;
    const z2 = clamp(nz, 0.75, 2.6);
    const px = C.x + (v.x - C.x - cm.x) / cm.z;
    const py = C.y + (v.y - C.y - cm.y) / cm.z;
    setCam({ z: z2, x: clamp(v.x - C.x - z2 * (px - C.x), -700, 700), y: clamp(v.y - C.y - z2 * (py - C.y), -500, 500) });
  }, []);

  const pointers = useRef(new Map());
  const drag = useRef(null);
  const pinch = useRef(null);
  const moved = useRef(false);

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      moved.current = false;
      drag.current = { sx: e.clientX, sy: e.clientY, cx: camRef.current.x, cy: camRef.current.y, k: unitsPerPx() };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: camRef.current.z };
      drag.current = null;
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      moved.current = true;
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.current.z0 * d) / Math.max(1, pinch.current.d0));
    } else if (drag.current) {
      const dx = e.clientX - drag.current.sx;
      const dy = e.clientY - drag.current.sy;
      if (!moved.current && Math.hypot(dx, dy) > 7) {
        moved.current = true;
        onDragStart?.();
      }
      if (moved.current) {
        const k = drag.current.k;
        setCam((cm) => ({ ...cm, x: clamp(drag.current.cx + dx * k, -700, 700), y: clamp(drag.current.cy + dy * k, -500, 500) }));
      }
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  };
  const onClickCapture = (e) => {
    if (moved.current) {
      e.stopPropagation();
      e.preventDefault();
      moved.current = false;
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, camRef.current.z * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Wereldpunt naar positie in de container (voor het menu bij een gebouw)
  const toContainer = (x, y, z = 0) => {
    const svg = svgRef.current;
    const box = containerRef.current?.getBoundingClientRect();
    const m = svg?.getScreenCTM();
    if (!m || !box) return null;
    const [ix, iy] = iso(x, y, z);
    const vx = C.x + cam.z * (ix - C.x) + cam.x;
    const vy = C.y + cam.z * (iy - C.y) + cam.y;
    const p = new DOMPoint(vx, vy).matrixTransform(m);
    return { x: p.x - box.left, y: p.y - box.top, w: box.width, h: box.height };
  };

  const zoomBy = (f) => {
    const r = containerRef.current.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, cam.z * f);
  };
  // Staand scherm (iPad rechtop): iets verder inzoomen zodat de buurt het beeld vult
  const fitZoom = () => {
    const r = containerRef.current?.getBoundingClientRect();
    return r && r.width / r.height < 0.95 ? 1.55 : 1;
  };
  const resetCam = () => setCam({ x: 0, y: 0, z: fitZoom() });
  useEffect(() => {
    let lastPortrait = null;
    const check = () => {
      const portrait = fitZoom() > 1;
      if (portrait !== lastPortrait) {
        lastPortrait = portrait;
        setCam({ x: 0, y: 0, z: fitZoom() });
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const focusOn = (x, y, z, zoom = 1.8) => {
    const [ix, iy] = iso(x, y, z);
    const target = { x: VB.x + VB.w * 0.38, y: VB.y + VB.h * 0.55 };
    setCam({ z: zoom, x: clamp(target.x - C.x - zoom * (ix - C.x), -700, 700), y: clamp(target.y - C.y - zoom * (iy - C.y), -500, 500) });
  };

  const skyTop = desaturate(light.skyTop, (1 - bloom) * 0.2);
  const skyBot = desaturate(light.skyBot, (1 - bloom) * 0.2);
  const camT = `translate(${C.x + cam.x} ${C.y + cam.y}) scale(${cam.z}) translate(${-C.x} ${-C.y})`;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
      onClick={() => onBackground?.()}
    >
      <svg ref={svgRef} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="w-full h-full block" role="img" aria-label="De buurt van bovenaf">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="shadowBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <rect x={VB.x - 400} y={VB.y - 400} width={VB.w + 800} height={VB.h + 800} fill="url(#sky)" />

        <g transform={camT}>
          {ground}
          {sorted.map((it) => (
            <g key={it.key}>{it.el}</g>
          ))}
          <g pointerEvents="none">{smoke}</g>
        </g>

        {/* Avondfilter: alles wordt donkerder en paarser */}
        <rect x={VB.x - 400} y={VB.y - 400} width={VB.w + 800} height={VB.h + 800} fill={light.tint} style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />

        {/* Sterren */}
        {dark > 0.5 && (
          <g opacity={(dark - 0.5) * 2} pointerEvents="none">
            {Array.from({ length: 36 }, (_, i) => (
              <circle key={i} cx={VB.x + hash01('sx' + i) * VB.w} cy={VB.y + hash01('sy' + i) * 160} r={0.6 + hash01('sr' + i) * 1.1} fill="#fff8e1" opacity={0.5 + 0.5 * Math.sin(frame.t * 1.3 + i)} />
            ))}
          </g>
        )}

        {/* Licht dat door de avond heen schijnt */}
        {lightOpacity > 0.01 && (
          <g transform={camT} style={{ mixBlendMode: 'screen' }} opacity={lightOpacity} pointerEvents="none">
            <LightHalos lights={groundLights} />
            {/* Gebouwen dekken het grondlicht af dat erachter valt */}
            {SILHOUETTES.map((pts, i) => (
              <polygon key={'sil' + i} points={pts} fill="#000000" />
            ))}
            <LightHalos lights={airLights} />
            <LightCores lights={airLights} />
          </g>
        )}

        <g transform={camT}>{overlays}</g>
        <g pointerEvents="none">{particles}</g>
      </svg>

      {overlay?.({ toContainer, zoomBy, resetCam, focusOn })}
    </div>
  );
}

function LightHalos({ lights }) {
  return (
    <g filter="url(#glowBlur)">
      {lights.map((l, i) => {
        if (l.kind === 'pane') return <polygon key={i} points={l.pts} fill="#ffb347" stroke="#ff9a3c" strokeWidth="8" opacity="0.75" />;
        if (l.kind === 'sign') return <polygon key={i} points={l.pts} fill={l.color} stroke={l.color} strokeWidth="9" opacity={0.8 * (l.strength ?? 1)} />;
        if (l.kind === 'pool') {
          const [px, py] = iso(l.x, l.y, 0);
          return <ellipse key={i} cx={px} cy={py} rx={36 * l.r} ry={18 * l.r} fill={l.color || '#ffb14d'} opacity="0.7" />;
        }
        if (l.kind === 'bulb') {
          const [px, py] = iso(l.x, l.y, l.z);
          return <circle key={i} cx={px} cy={py} r={10 * (l.r || 1)} fill="#ffcf73" opacity="0.9" />;
        }
        if (l.kind === 'beam') {
          const [x0, y0] = iso(l.x, l.y, 4);
          const fx = l.axis === 'x' ? l.dir * 2.4 : 0;
          const fy = l.axis === 'y' ? l.dir * 2.4 : 0;
          const sx = l.axis === 'x' ? 0 : 0.5;
          const sy = l.axis === 'x' ? 0.5 : 0;
          const [a1, a2] = iso(l.x + fx - sx, l.y + fy - sy, 0);
          const [b1, b2] = iso(l.x + fx + sx, l.y + fy + sy, 0);
          return <polygon key={i} points={`${x0},${y0} ${a1},${a2} ${b1},${b2}`} fill="#fff1b8" opacity="0.8" />;
        }
        return null;
      })}
    </g>
  );
}

function LightCores({ lights }) {
  return (
    <g>
      {lights.map((l, i) => {
        if (l.kind === 'pane') return <polygon key={i} points={l.pts} fill="#ffd27f" opacity="0.85" />;
        if (l.kind === 'bulb') {
          const [px, py] = iso(l.x, l.y, l.z);
          return <circle key={i} cx={px} cy={py} r="2.6" fill="#fff4cf" />;
        }
        if (l.kind === 'sign') return <polygon key={i} points={l.pts} fill={l.color} opacity={0.5 * (l.strength ?? 1)} />;
        return null;
      })}
    </g>
  );
}

// De simulatie. Alle functies zijn "puur": ze krijgen een staat en geven
// een nieuwe staat terug. Zo is opslaan en testen eenvoudig.

import { clamp, round1, hash01, pick } from './util.js';
import { calendar, DAYS_PER_SEASON, DAYS_PER_YEAR } from './time.js';
import {
  TILES, BUILDING_LAYOUT, PLACE_LAYOUT, PLAYGROUND_AREA, SCENERY_TREES, RESERVED_TILES,
  canDecorateTile, centerOf, areaBox
} from './layout.js';
import {
  ARCHETYPES, DECORATIONS, DEFAULT_ROUTINES, LIFE_STAGE, AVATAR_COLORS, SKIN_TONES,
  lifeStageOf
} from './content.js';

export const clone = (s) => structuredClone(s);

export const displayName = (r) => (r ? r.title || r.firstName : '');
export const fullName = (r) => (r ? `${r.title || r.firstName} ${r.lastName}` : '');

export function addLog(s, text, toast = false) {
  s.log.unshift({ id: 'l' + s.nextId++, day: s.day, text, toast });
  s.log = s.log.slice(0, 40);
}

// --------------------------------------------------------------------------
// Verbeteringen
// --------------------------------------------------------------------------

export function upgradesOf(s, buildingId) {
  const b = s.buildings[buildingId];
  if (!b) return [];
  const list = b.upgrades.map((u) => ({ up: u, buildingId, unitId: null }));
  for (const uid of b.unitIds) {
    for (const u of s.units[uid].upgrades) list.push({ up: u, buildingId, unitId: uid });
  }
  return list;
}

export function isInstalled(s, upId) {
  for (const b of Object.values(s.buildings)) {
    if (b.upgrades.some((u) => u.id === upId && u.installed)) return true;
  }
  for (const u of Object.values(s.units)) {
    if (u.upgrades.some((x) => x.id === upId && x.installed)) return true;
  }
  return false;
}

export const isPending = (s, upId) => s.pendingWork.some((w) => w.upgradeId === upId);

export function buildingProgress(s, buildingId) {
  const list = upgradesOf(s, buildingId);
  if (!list.length) return 0;
  return list.filter((x) => x.up.installed).length / list.length;
}

export function bikesEnabled(s) {
  return Object.values(s.buildings).some((b) => b.upgrades.some((u) => u.installed && u.bikes));
}

// --------------------------------------------------------------------------
// Voorzieningen en omgevingskwaliteit
// --------------------------------------------------------------------------

export const AMENITY = {
  BENCH: { base: 4, seasonal: { SPRING: 1.2, SUMMER: 1.3, AUTUMN: 0.9, WINTER: 0.6 }, aff: { SENIOR: 1.7 } },
  PLAYGROUND: { base: 5, seasonal: { WINTER: 0.6 }, aff: { CHILD: 1.8, BABY: 1.2, SENIOR: 0.8 } },
  PLAY_SMALL: { base: 2, aff: { CHILD: 1.8 } },
  GARDEN: { base: 4.5, seasonal: { SUMMER: 1.4, WINTER: 0.5 }, aff: { ADULT: 1.2, SENIOR: 1.3 } },
  COFFEE: { base: 5.5, seasonal: { AUTUMN: 1.4, WINTER: 1.6 }, aff: { YOUTH: 1.2, ADULT: 1.1, SENIOR: 1.3 } },
  MARKET: { base: 4.5, aff: { ADULT: 1.2, SENIOR: 1.2 } },
  TREES: { base: 2.2, seasonal: { SPRING: 1.3, SUMMER: 1.2, WINTER: 0.6 } },
  LAMP: { base: 2, seasonal: { AUTUMN: 1.3, WINTER: 1.6 }, aff: { SENIOR: 1.3 } },
  FLOWERS: { base: 1.8, seasonal: { SPRING: 1.3, WINTER: 0.5 } },
  MEET: { base: 2.6, seasonal: { SUMMER: 1.3, WINTER: 0.6 } },
  FIRE: { base: 2.6, seasonal: { SUMMER: 0.6, AUTUMN: 1.5, WINTER: 1.6 } }
};

export function deriveAmenities(s) {
  const list = [];
  for (const b of Object.values(s.buildings)) {
    const box = areaBox(b.id);
    const c = centerOf(box);
    for (const u of b.upgrades) {
      if (u.installed && u.amenity) list.push({ type: u.amenity, x: c.x, y: c.y, value: AMENITY[u.amenity].base });
    }
  }
  for (const [key, type] of Object.entries(s.decorations)) {
    const [x, y] = key.split(',').map(Number);
    const a = DECORATIONS[type].amenity;
    list.push({ type: a, x: x + 0.5, y: y + 0.5, value: AMENITY[a].base * 0.6 });
  }
  return list;
}

const BASE_Q = {
  GRASS: 0.08, PLEIN: -0.15, ROAD: 0, WATER: 0.15, BRIDGE: 0.2, PATH: 0.02,
  PLAYGROUND: -0.05, GARDEN: -0.08, FORECOURT: -0.05, PARKING: -0.06, BUILDING: 0
};

const inBox = (t, b) => t.x >= b.x && t.x < b.x + b.w && t.y >= b.y && t.y < b.y + b.d;

export function qualityMap(s) {
  const q = TILES.map((t) => BASE_Q[t.type] ?? 0);
  for (const b of Object.values(s.buildings)) {
    for (const u of b.upgrades) {
      if (!u.installed || !u.tileBonus) continue;
      const { area, amount } = u.tileBonus;
      TILES.forEach((t, i) => {
        let hit = false;
        if (area === 'playground') hit = inBox(t, PLAYGROUND_AREA);
        else if (area === 'forecourt') hit = t.type === 'FORECOURT' || t.type === 'PARKING';
        else if (area === 'self') {
          const bx = BUILDING_LAYOUT[b.id];
          hit = t.x >= bx.x - 1 && t.x <= bx.x + bx.w && t.y >= bx.y - 1 && t.y <= bx.y + bx.d && t.type !== 'BUILDING';
        } else if (PLACE_LAYOUT[area]) hit = inBox(t, PLACE_LAYOUT[area]);
        if (hit) q[i] += amount;
      });
    }
  }
  for (const [key, type] of Object.entries(s.decorations)) {
    const [x, y] = key.split(',').map(Number);
    const bonus = DECORATIONS[type].quality;
    TILES.forEach((t, i) => {
      const d = Math.abs(t.x - x) + Math.abs(t.y - y);
      if (d === 0) q[i] += bonus;
      else if (d === 1) q[i] += bonus * 0.4;
    });
  }
  return q;
}

// --------------------------------------------------------------------------
// Woningwaarde en verkoopkans (overwaarde)
// --------------------------------------------------------------------------

export const ownerMonthlyCost = (value) => Math.round(value * 0.0038);

export function unitValuation(s, unit, q, avgPos) {
  const b = s.buildings[unit.buildingId];
  const box = BUILDING_LAYOUT[unit.buildingId];
  const c = centerOf(box);
  const upgradeSum = upgradesOf(s, unit.buildingId)
    .filter((x) => x.up.installed && (!x.unitId || x.unitId === unit.id))
    .reduce((sum, x) => sum + (x.up.value || 0), 0);
  let raw = 0;
  TILES.forEach((t, i) => {
    if (t.buildingId === unit.buildingId) return;
    const dist = Math.abs(c.x - (t.x + 0.5)) + Math.abs(c.y - (t.y + 0.5));
    if (dist <= 6) raw += q[i] / Math.pow(1 + dist, 1.35);
  });
  const env = Math.tanh(raw);
  const mult = 1 + upgradeSum + 0.5 * env + 0.2 * (avgPos / 100);
  const value = Math.round((unit.baseValue * b.condition * Math.max(0.5, mult)) / 1000) * 1000;
  const hh = unit.householdId ? s.households[unit.householdId] : null;
  if (!hh || unit.tenure !== 'OWNER' || unit.coop) {
    return { value, env, equity: 0, sellChance: 0 };
  }
  const purchase = hh.purchasePrice || unit.baseValue;
  const equity = (value - purchase) / purchase;
  if (equity < 0.12) return { value, env, equity, sellChance: 0 };
  const threshold = 0.35 + 0.4 * hh.attachment;
  const sigmoid = 1 / (1 + Math.exp(-8 * (equity - threshold)));
  const sellChance = 0.45 * (1 - 0.75 * hh.attachment) * (1 - hh.avgPositivity / 150) * sigmoid;
  return { value, env, equity, sellChance };
}

// --------------------------------------------------------------------------
// Positiviteit per bewoner
// --------------------------------------------------------------------------

export function residentPositivity(s, r, amenities, season, rels) {
  const hh = s.households[r.householdId];
  const unit = s.units[r.unitId];
  const b = s.buildings[unit.buildingId];
  const stage = lifeStageOf(r.age);

  // Thuis: comfort en betaalbaarheid (0 tot 35)
  const winter = season === 'WINTER' ? (b.insulated ? 6 : -2) : 0;
  const ratio = unit.monthlyCost / Math.max(1, hh.monthlyIncome);
  const afford = Math.max(0, 1 - Math.max(0, ratio - 0.3) * 2.2);
  const crowd = Math.max(0, hh.memberIds.length - unit.maxOccupants);
  const home = clamp(20 * unit.comfort + 15 * afford + winter - crowd * 8, 0, 35);

  // Omgeving en seizoen (3 tot 25)
  const base = { SUMMER: 11, SPRING: 10, AUTUMN: 7.5, WINTER: 5.5 }[season];
  const c = centerOf(BUILDING_LAYOUT[unit.buildingId]);
  let pts = 0;
  for (const a of amenities) {
    const meta = AMENITY[a.type];
    const w = meta.seasonal?.[season] ?? 1;
    const aff = meta.aff?.[stage] ?? 1;
    const dist = Math.hypot(a.x - c.x, a.y - c.y);
    pts += (a.value * w * aff) / (1 + dist / 4);
  }
  const surroundings = clamp(base + pts * 0.55, 3, 25);

  // Buren (2 tot 25)
  let sum = 0;
  let penalty = 0;
  for (const rel of rels) {
    if (rel.a !== r.id && rel.b !== r.id) continue;
    if (rel.type === 'FRICTION') penalty += 3.5;
    else if (rel.strength > 10) sum += (rel.strength / 100) * (rel.near ? 1.5 : 1);
  }
  const neighbours = clamp(11 * Math.sqrt(sum + 0.35) - penalty, 2, 25);

  // Wat iemand in deze levensfase nodig heeft (-10 tot 15)
  const has = (...types) => amenities.some((a) => types.includes(a.type));
  let needs = 8;
  if (stage === 'SENIOR') {
    const stairs = b.hasElevator ? 0 : unit.floor >= 2 ? 10 : unit.floor === 1 ? 4 : 0;
    needs = (has('BENCH', 'MEET') ? 13 : 4) - stairs;
  } else if (stage === 'YOUTH') {
    if (r.isDependent && r.age >= 18) needs = Math.max(-10, 10 - Math.max(0, r.searchingDays - 12) * 0.35);
    else needs = r.isDependent ? 10 : 11 + (has('COFFEE', 'MARKET') ? 3 : 0);
  } else if (stage === 'CHILD') {
    needs = has('PLAYGROUND') ? 14 : has('PLAY_SMALL') ? 6 : -3;
  } else if (stage === 'BABY') {
    needs = 10;
  } else {
    needs = Math.min(15, 9 + (has('GARDEN') ? 3 : 0) + (has('BENCH', 'MEET') ? 2 : 0) + (has('COFFEE') ? 1 : 0));
  }

  const target = clamp(home + surroundings + neighbours + needs, 0, 100);
  const positivity = round1(r.positivity + 0.18 * (target - r.positivity));
  let sk = 0;
  if (positivity > 45) {
    const excess = (positivity - 45) / 55;
    sk = Math.pow(excess, 1.3) * LIFE_STAGE[stage].roleWeight * 0.85 * 1.4;
  }
  return {
    positivity,
    sk: Math.round(sk * 100) / 100,
    breakdown: {
      home: round1(home),
      surroundings: round1(surroundings),
      neighbours: round1(neighbours),
      needs: round1(needs),
      target: round1(target)
    }
  };
}

// --------------------------------------------------------------------------
// Wie zou hier willen en kunnen wonen?
// --------------------------------------------------------------------------

export function unitPrice(unit) {
  if (unit.coop || unit.tenure !== 'OWNER') return unit.monthlyCost;
  return ownerMonthlyCost(unit.value);
}

export function inflowCandidates(s, unit) {
  const am = deriveAmenities(s);
  const count = (...types) => am.filter((a) => types.includes(a.type)).length;
  const score = {
    green: Math.min(100, 35 + count('GARDEN', 'BENCH', 'TREES', 'FLOWERS') * 10),
    kids: Math.min(100, 25 + count('PLAYGROUND') * 40 + count('PLAY_SMALL') * 10),
    social: Math.min(100, s.avgPositivity * 1.15),
    culture: Math.min(100, 30 + count('COFFEE', 'MARKET') * 30 + count('MEET') * 8)
  };
  const b = s.buildings[unit.buildingId];
  const price = unitPrice(unit);
  const counts = {};
  const hhs = Object.values(s.households);
  for (const h of hhs) counts[h.archetypeId] = (counts[h.archetypeId] || 0) + 1;
  const out = [];
  for (const [id, a] of Object.entries(ARCHETYPES)) {
    if (price > a.budget) {
      out.push({ id, arch: a, fits: false, reason: 'Te duur voor hen' });
      continue;
    }
    if (unit.rooms < a.minRooms) {
      out.push({ id, arch: a, fits: false, reason: 'Te weinig kamers' });
      continue;
    }
    let phys = 1;
    if (a.groundFloor) phys = unit.floor === 0 || b.hasElevator ? 1.35 : 0.2;
    const w = a.weights;
    const appeal = w.green * score.green / 100 + w.kids * score.kids / 100 + w.social * score.social / 100 + w.culture * score.culture / 100;
    const share = (counts[id] || 0) / Math.max(1, hhs.length);
    out.push({ id, arch: a, fits: true, utility: phys * (appeal * 50 + 15 * (1 - share)) });
  }
  const fit = out.filter((o) => o.fits);
  if (fit.length) {
    const max = Math.max(...fit.map((o) => o.utility));
    const exps = fit.map((o) => Math.exp((o.utility - max) / 8));
    const total = exps.reduce((a, b) => a + b, 0);
    fit.forEach((o, i) => (o.chance = exps[i] / total));
  }
  return [...fit.sort((a, b) => b.chance - a.chance), ...out.filter((o) => !o.fits)];
}

export function diversityOf(s) {
  const incomes = new Set(Object.values(s.households).map((h) => h.income));
  const stages = new Set(Object.values(s.residents).map((r) => lifeStageOf(r.age)));
  return round1(1 + Math.min(3, incomes.size) * 0.08 + Math.min(4, stages.size) * 0.06) || 1;
}

export function neighbourhoodBloom(s) {
  let total = 0;
  let done = 0;
  for (const b of Object.values(s.buildings)) {
    for (const x of upgradesOf(s, b.id)) {
      total++;
      if (x.up.installed) done++;
    }
  }
  const deco = Math.min(0.3, Object.keys(s.decorations).length * 0.03);
  const pos = Math.max(0, (s.avgPositivity - 46) / 38);
  return clamp((total ? done / total : 0) * 0.55 + pos * 0.2 + deco, 0, 1);
}

// --------------------------------------------------------------------------
// Mensen erbij en eraf
// --------------------------------------------------------------------------

function removeResidentRefs(s, ids) {
  for (const [rid, rel] of Object.entries(s.relationships)) {
    if (ids.includes(rel.a) || ids.includes(rel.b)) delete s.relationships[rid];
  }
}

function removeHousehold(s, hhId, text) {
  const h = s.households[hhId];
  if (!h) return;
  for (const id of h.memberIds) {
    const r = s.residents[id];
    if (r) s.formerNeighbours.unshift({ name: fullName(r), day: s.day });
    delete s.residents[id];
  }
  s.formerNeighbours = s.formerNeighbours.slice(0, 20);
  removeResidentRefs(s, h.memberIds);
  const u = s.units[h.unitId];
  if (u) {
    u.householdId = null;
    s.vacantSince[u.id] = s.day;
  }
  delete s.households[hhId];
  addLog(s, text, true);
}

function newResident(s, { firstName, lastName, age, traits, bio, householdId, unitId, isDependent }) {
  const id = 'res_n' + s.nextId++;
  const stage = lifeStageOf(age);
  s.residents[id] = {
    id, firstName, lastName, age, traits, bio,
    color: pick(AVATAR_COLORS),
    skin: pick(SKIN_TONES),
    householdId, unitId, isDependent,
    searchingDays: 0,
    thought: 'Wat een warme ontvangst in deze buurt.',
    positivity: 66,
    breakdown: { home: 24, surroundings: 13, neighbours: 17, needs: 12, target: 66 },
    skPerDay: 0.3,
    routine: [...DEFAULT_ROUTINES[stage]]
  };
  return id;
}

function moveInSetup(u) {
  if (u.coop) return;
  if (u.tenure === 'OWNER') u.monthlyCost = ownerMonthlyCost(u.value);
  u.baseCost = u.monthlyCost;
  u.rentRefValue = u.value;
}

export function welcomeHousehold(prev, unitId, archetypeId) {
  const s = clone(prev);
  const u = s.units[unitId];
  const a = ARCHETYPES[archetypeId];
  if (!u || !a || u.householdId || !u.ready) return prev;
  const usedLast = new Set(Object.values(s.residents).map((r) => r.lastName));
  const family = a.families.find((f) => !usedLast.has(f)) || a.families[0];
  const usedFirst = new Set(Object.values(s.residents).map((r) => r.firstName));
  const hhId = 'hh_n' + s.nextId++;
  moveInSetup(u);
  const memberIds = [];
  for (const m of a.members.slice(0, u.maxOccupants)) {
    const first = m.names.find((n) => !usedFirst.has(n)) || m.names[0];
    usedFirst.add(first);
    const age = m.age + Math.floor(Math.random() * 6) - 2;
    memberIds.push(newResident(s, {
      firstName: first, lastName: family, age, traits: m.traits,
      bio: `Kwam in jaar ${calendar(s.day).year} in de buurt wonen.`,
      householdId: hhId, unitId, isDependent: lifeStageOf(age) === 'CHILD' || lifeStageOf(age) === 'BABY'
    }));
  }
  s.households[hhId] = {
    id: hhId, familyName: family, archetypeId, unitId, memberIds,
    income: a.income, monthlyIncome: a.monthlyIncome,
    purchasePrice: u.tenure === 'OWNER' && !u.coop ? u.value : null,
    daysLived: 0, attachment: 0.4, avgPositivity: 66, wantsGroundFloor: false
  };
  u.householdId = hhId;
  delete s.vacantSince[unitId];
  addLog(s, `Familie ${family} komt wonen in ${u.label.toLowerCase()}. Welkom!`, true);
  return settleWishes(s);
}

// Verhuizen binnen de buurt: een thuiswonende jongere gaat op zichzelf,
// of een heel huishouden verhuist (bijvoorbeeld naar de begane grond).
export function internalMove(prev, residentId, targetUnitId) {
  const s = clone(prev);
  const r = s.residents[residentId];
  const target = s.units[targetUnitId];
  if (!r || !target || target.householdId || !target.ready) return prev;
  moveInSetup(target);
  if (r.isDependent) {
    const old = s.households[r.householdId];
    old.memberIds = old.memberIds.filter((id) => id !== residentId);
    const hhId = 'hh_n' + s.nextId++;
    s.households[hhId] = {
      id: hhId, familyName: r.lastName, archetypeId: 'STARTER', unitId: targetUnitId, memberIds: [residentId],
      income: 'LOW', monthlyIncome: 1950, purchasePrice: null,
      daysLived: old.daysLived, attachment: 0.85, avgPositivity: r.positivity, wantsGroundFloor: false
    };
    r.isDependent = false;
    r.searchingDays = 0;
    r.householdId = hhId;
    r.unitId = targetUnitId;
    r.positivity = Math.min(100, r.positivity + 20);
    r.thought = 'Mijn eigen plek, in mijn eigen buurt.';
    target.householdId = hhId;
    addLog(s, `${displayName(r)} woont nu op zichzelf in ${target.label.toLowerCase()}.`, true);
  } else {
    const h = s.households[r.householdId];
    const old = s.units[h.unitId];
    old.householdId = null;
    s.vacantSince[old.id] = s.day;
    h.unitId = targetUnitId;
    h.wantsGroundFloor = false;
    for (const id of h.memberIds) {
      s.residents[id].unitId = targetUnitId;
      s.residents[id].positivity = Math.min(100, s.residents[id].positivity + 20);
    }
    r.thought = 'Gelijkvloers, en al mijn buren nog om me heen.';
    target.householdId = h.id;
    addLog(s, `Familie ${h.familyName} verhuist binnen de buurt naar ${target.label.toLowerCase()}.`, true);
  }
  delete s.vacantSince[targetUnitId];
  return settleWishes(s);
}

// --------------------------------------------------------------------------
// Acties van de speler
// --------------------------------------------------------------------------

export function findUpgrade(s, buildingId, unitId, upgradeId) {
  const list = unitId ? s.units[unitId]?.upgrades : s.buildings[buildingId]?.upgrades;
  return list?.find((u) => u.id === upgradeId) || null;
}

export function canAfford(s, up) {
  if (s.money < up.money) return 'Er zit nog niet genoeg in de buurtpot.';
  if (s.sk < up.sk) return 'Er is nog niet genoeg buurtgevoel. Laat de tijd even lopen.';
  return null;
}

export function startWork(prev, { buildingId, unitId = null, upgradeId }, now) {
  const up = findUpgrade(prev, buildingId, unitId, upgradeId);
  if (!up || up.installed || isPending(prev, upgradeId)) return { state: prev };
  const problem = canAfford(prev, up);
  if (problem) return { state: prev, error: problem };
  const s = clone(prev);
  s.money -= up.money;
  s.sk = round1(s.sk - up.sk);
  const klus = up.money === 0;
  // Helpers: eerst de bewoners zelf, dan de meest betrokken buren
  const occupants = s.buildings[buildingId].unitIds
    .map((id) => s.units[id].householdId)
    .filter(Boolean)
    .flatMap((h) => s.households[h].memberIds);
  const adults = Object.values(s.residents).filter((r) => r.age >= 13);
  const ranked = adults
    .map((r) => ({ id: r.id, score: (occupants.includes(r.id) ? 100 : 0) + r.positivity + hash01(r.id + upgradeId) * 30 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, klus ? 4 : 2)
    .map((x) => x.id);
  s.pendingWork.push({
    id: 'w' + s.nextId++, buildingId, unitId, upgradeId,
    start: now, duration: klus ? 9000 : 6500, klus, helpers: ranked
  });
  addLog(s, klus ? `Klusdag gestart: ${up.name.toLowerCase()}.` : `Er wordt gewerkt aan: ${up.name.toLowerCase()}.`);
  return { state: s };
}

function applyUpgrade(s, buildingId, unitId, upgradeId) {
  const b = s.buildings[buildingId];
  const up = findUpgrade(s, buildingId, unitId, upgradeId);
  if (!up || up.installed) return null;
  up.installed = true;
  if (unitId) {
    const u = s.units[unitId];
    u.comfort = Math.min(1, u.comfort + (up.comfort || 0.1));
    if (up.resolvesNoise) {
      const inside = Object.values(s.residents).filter((r) => s.units[r.unitId]?.buildingId === buildingId).map((r) => r.id);
      for (const rel of Object.values(s.relationships)) {
        if (rel.type === 'FRICTION' && inside.includes(rel.a) && inside.includes(rel.b)) {
          rel.type = 'ACQUAINTANCE';
          rel.strength = 40;
          rel.memory = 'Sinds de nieuwe vloer groeten ze elkaar weer.';
        }
      }
    }
  } else {
    b.condition = Math.min(1.3, b.condition + 0.12);
    if (up.insul) b.insulated = true;
    if (up.elevator) b.hasElevator = true;
    for (const uid of b.unitIds) {
      const u = s.units[uid];
      u.comfort = Math.min(1, u.comfort + (up.comfort || 0.08));
      if (up.lowersCost && u.householdId) u.monthlyCost = Math.max(350, u.monthlyCost - up.lowersCost);
    }
  }
  if (up.unlocks) {
    s.units[up.unlocks].ready = true;
    s.vacantSince[up.unlocks] = s.day;
  }
  return up;
}

export function completeWork(prev, workId) {
  const w = prev.pendingWork.find((x) => x.id === workId);
  if (!w) return prev;
  const s = clone(prev);
  s.pendingWork = s.pendingWork.filter((x) => x.id !== workId);
  const up = applyUpgrade(s, w.buildingId, w.unitId, w.upgradeId);
  if (up) {
    addLog(s, w.klus ? `Klaar! ${up.name} is samen met de buren gelukt.` : `Klaar: ${up.name.toLowerCase()}.`, true);
    // Samen klussen versterkt de band tussen de helpers
    if (w.klus && w.helpers.length > 1) {
      for (let i = 0; i < w.helpers.length - 1; i++) strengthen(s, w.helpers[i], w.helpers[i + 1], 6, 'Samen geklust op een klusdag.');
    }
  }
  return settleWishes(s);
}

function strengthen(s, a, b, amount, memory) {
  if (!s.residents[a] || !s.residents[b] || a === b) return;
  const rel = Object.values(s.relationships).find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  if (rel) {
    if (rel.type !== 'FRICTION') rel.strength = Math.min(100, rel.strength + amount);
  } else {
    const id = 'rel_n' + s.nextId++;
    s.relationships[id] = { id, a, b, type: 'ACQUAINTANCE', strength: 28 + amount, memory, near: sameBuilding(s, a, b) };
  }
}

const sameBuilding = (s, a, b) => s.units[s.residents[a].unitId]?.buildingId === s.units[s.residents[b].unitId]?.buildingId;

export function makeCooperative(prev, unitId) {
  if (prev.sk < 20) return { state: prev, error: 'Je hebt 20 buurtgevoel nodig.' };
  const s = clone(prev);
  const u = s.units[unitId];
  u.coop = true;
  u.monthlyCost = Math.min(u.monthlyCost, 610);
  s.sk = round1(s.sk - 20);
  addLog(s, `${u.label} hoort nu bij de buurtcoöperatie. De woonlasten blijven betaalbaar.`, true);
  return { state: settleWishes(s) };
}

export function boostRelationship(prev, relId) {
  if (prev.sk < 8) return { state: prev, error: 'Je hebt 8 buurtgevoel nodig.' };
  const s = clone(prev);
  const rel = s.relationships[relId];
  if (!rel) return { state: prev };
  const friction = rel.type === 'FRICTION';
  rel.type = friction ? 'NEIGHBOUR' : rel.strength + 25 >= 80 ? 'FRIEND' : 'NEIGHBOUR';
  rel.strength = Math.min(100, (friction ? 30 : rel.strength) + 25);
  rel.memory = friction ? 'Een goed gesprek bij de koffie. Het gedoe is de wereld uit.' : 'Samen koffie gedronken op het plein.';
  s.sk = round1(s.sk - 8);
  const A = s.residents[rel.a];
  const B = s.residents[rel.b];
  addLog(s, friction ? `${displayName(A)} en ${displayName(B)} hebben het uitgepraat.` : `${displayName(A)} en ${displayName(B)} dronken samen koffie.`, friction);
  return { state: settleWishes(s) };
}

const treeTiles = new Set(SCENERY_TREES.map((t) => `${Math.floor(t.x)},${Math.floor(t.y)}`));

export function canPlaceAt(s, x, y) {
  const k = `${x},${y}`;
  return canDecorateTile(x, y) && !treeTiles.has(k) && !RESERVED_TILES.has(k) && !s.decorations[k];
}

export function placeDecoration(prev, x, y, type, payWithSK) {
  const item = DECORATIONS[type];
  if (!canPlaceAt(prev, x, y)) return { state: prev, error: 'Hier kan niets staan.' };
  if (payWithSK ? prev.sk < item.sk : prev.money < item.money) {
    return { state: prev, error: payWithSK ? 'Niet genoeg buurtgevoel.' : 'Niet genoeg in de buurtpot. Betaal eventueel met buurtgevoel.' };
  }
  const s = clone(prev);
  s.decorations[`${x},${y}`] = type;
  if (payWithSK) s.sk = round1(s.sk - item.sk);
  else s.money -= item.money;
  return { state: s };
}

export function removeDecoration(prev, x, y) {
  if (!prev.decorations[`${x},${y}`]) return prev;
  const s = clone(prev);
  delete s.decorations[`${x},${y}`];
  return s;
}

// --------------------------------------------------------------------------
// Wensen (optioneel): verhalen die de speler op weg helpen
// --------------------------------------------------------------------------

export function computeWishes(s) {
  const R = s.residents;
  const am = deriveAmenities(s);
  const list = [];
  const add = (w) => list.push(w);

  if (R.res_annie) add({
    id: 'plein', giver: 'res_annie', title: 'Een groen plein',
    text: 'Tante Annie kijkt uit op kale, scheve tegels. Met een klusdag kunnen de buren tegels wippen, bomen planten en bankjes neerzetten.',
    target: { buildingId: 'p_plein' }, money: 300, sk: 18, done: isInstalled(s, 'up_plein_klus')
  });
  if (R.res_koos) {
    const h = s.households[R.res_koos.householdId];
    add({
      id: 'koos', giver: 'res_koos', title: 'Gelijkvloers wonen voor Koos',
      text: 'Meneer Koos woont twee hoog en de trap wordt te zwaar. Maak beneden in de flat een studio vrij en laat hem verhuizen, of zorg voor een lift.',
      target: { buildingId: 'b_flat', unitId: 'u_f0r' }, money: 350, sk: 25,
      done: s.units[h.unitId].floor === 0 || s.buildings.b_flat.hasElevator
    });
  }
  if (R.res_emre) add({
    id: 'emre', giver: 'res_emre', title: 'Een eigen plek voor Emre',
    text: 'Emre wil op zichzelf wonen, maar wel in zijn eigen buurt. De lege zolder in de flat kan een startersstudio worden.',
    target: { buildingId: 'b_flat', unitId: 'u_f2r' }, money: 250, sk: 22, done: !R.res_emre.isDependent
  });
  if (s.relationships.rel_5) add({
    id: 'portiek', giver: 'res_tijn', title: 'Rust in het portiek',
    text: 'Naomi en Tijn ergeren zich aan elkaar door de gehorige vloer. Een kop koffie samen of een betere vloer kan helpen.',
    target: { residentId: 'res_tijn' }, money: 200, sk: 20, done: s.relationships.rel_5.type !== 'FRICTION'
  });
  if (R.res_elif) add({
    id: 'moestuin', giver: 'res_elif', title: 'Een moestuin',
    text: 'Elif droomt van verse kruiden en tomaten op het verwilderde veldje.',
    target: { buildingId: 'p_garden' }, money: 200, sk: 15, done: isInstalled(s, 'up_garden')
  });
  const kids = Object.values(R).filter((r) => lifeStageOf(r.age) === 'CHILD');
  if (kids.length) add({
    id: 'speelplek', giver: kids[0].id, title: 'Een plek om te spelen',
    text: `${kids.map(displayName).slice(0, 2).join(' en ')} spelen nu tussen de auto's. Een klimrek op het plein of een sportveld bij school maakt ze blij.`,
    target: { buildingId: 'p_plein' }, money: 250, sk: 15, done: am.some((a) => a.type === 'PLAYGROUND')
  });
  for (const r of Object.values(R)) {
    if (r.id !== 'res_emre' && r.isDependent && r.age >= 18) add({
      id: 'eigenplek:' + r.id, giver: r.id, title: `Een eigen plek voor ${displayName(r)}`,
      text: `${displayName(r)} is volwassen en zoekt een betaalbare plek in de buurt. Knap een leeg huis op of laat een vrije woning aan ${displayName(r)}.`,
      target: { residentId: r.id }, money: 200, sk: 15, done: false
    });
  }
  for (const rel of Object.values(s.relationships)) {
    if (rel.id !== 'rel_5' && rel.type === 'FRICTION') add({
      id: 'verzoening:' + rel.id, giver: rel.a, title: `${displayName(R[rel.a])} en ${displayName(R[rel.b])}`,
      text: 'Er is wat gedoe tussen deze buren. Een kop koffie samen kan wonderen doen.',
      target: { residentId: rel.a }, money: 120, sk: 12, done: false
    });
  }
  // Dynamische wensen die verdwenen zijn, zijn vervuld
  for (const id of Object.keys(s.wishes.opened)) {
    if ((id.startsWith('eigenplek:') || id.startsWith('verzoening:')) && !list.some((w) => w.id === id)) {
      const resId = id.split(':')[1];
      const stillThere = id.startsWith('eigenplek:') ? Boolean(R[resId]) : Boolean(s.relationships[resId]);
      if (stillThere && !s.wishes.rewarded[id]) list.push({ id, title: 'Wens', money: 0, sk: 0, done: true, hidden: true, reward: id.startsWith('eigenplek:') ? [200, 15] : [120, 12] });
    }
  }
  return list;
}

export function settleWishes(s) {
  const wishes = computeWishes(s);
  for (const w of wishes) {
    if (!w.done && !s.wishes.opened[w.id]) s.wishes.opened[w.id] = s.day + 1;
    if (w.done && s.wishes.opened[w.id] && !s.wishes.rewarded[w.id]) {
      const [money, sk] = w.reward || [w.money, w.sk];
      s.wishes.rewarded[w.id] = s.day + 1;
      s.money += money;
      s.sk = round1(s.sk + sk);
      if (!w.hidden) addLog(s, `Wens vervuld: ${w.title.toLowerCase()}. +€ ${money} en +${sk} buurtgevoel.`, true);
    }
  }
  return s;
}

// --------------------------------------------------------------------------
// Een dag verder
// --------------------------------------------------------------------------

const MEET_MEMORIES = [
  'Raakten aan de praat op het plein.',
  'Hielpen elkaar met de boodschappen.',
  'Maakten een praatje bij de voordeur.',
  'Kwamen elkaar tegen bij de supermarkt.',
  'Keken samen naar de vogels bij de gracht.'
];

function autoFill(s, unitId) {
  const u = s.units[unitId];
  const seniors = Object.values(s.households).find((h) => h.wantsGroundFloor);
  if (u.floor === 0 && seniors) return internalMove(s, seniors.memberIds[0], unitId);
  const youth = Object.values(s.residents).find((r) => r.isDependent && r.age >= 18);
  if (youth && u.rooms <= 2) return internalMove(s, youth.id, unitId);
  const options = inflowCandidates(s, u).filter((o) => o.fits);
  if (!options.length) {
    // Vangnet: na lange leegstand koopt de woningcorporatie het huis
    if (s.day - s.vacantSince[unitId] >= 24) {
      u.coop = true;
      u.tenure = 'SOCIAL';
      u.monthlyCost = 610;
      addLog(s, `De woningcorporatie koopt ${u.label.toLowerCase()} en maakt er een betaalbare huurwoning van.`, true);
      return s;
    }
    if (!s.vacantSince['note_' + unitId]) {
      s.vacantSince['note_' + unitId] = s.day;
      addLog(s, `Niemand uit de wachtrij kan ${u.label.toLowerCase()} betalen. Een coöperatie houdt het betaalbaar.`, true);
    }
    return s;
  }
  return welcomeHousehold(s, unitId, options[0].id);
}

export function stepDay(prev) {
  let s = clone(prev);
  s.day += 1;
  const { season, year } = calendar(s.day);
  const newSeason = s.day % DAYS_PER_SEASON === 0;
  const newYear = s.day % DAYS_PER_YEAR === 0;

  // Thuiswonende volwassen jongeren zoeken een plek
  for (const r of Object.values(s.residents)) {
    if (r.isDependent && r.age >= 18) r.searchingDays += 1;
  }

  // Positiviteit en buurtgevoel
  const amenities = deriveAmenities(s);
  const rels = Object.values(s.relationships);
  let skSum = 0;
  let posSum = 0;
  let n = 0;
  for (const r of Object.values(s.residents)) {
    const p = residentPositivity(s, r, amenities, season, rels);
    r.positivity = p.positivity;
    r.breakdown = p.breakdown;
    r.skPerDay = p.sk;
    skSum += p.sk;
    posSum += p.positivity;
    n++;
  }
  s.avgPositivity = n ? round1(posSum / n) : 50;
  s.diversity = diversityOf(s);
  s.sk = round1(s.sk + skSum * s.diversity);

  for (const h of Object.values(s.households)) {
    h.daysLived += 1;
    h.attachment = Math.min(0.98, h.attachment + 0.002);
    const ms = h.memberIds.map((id) => s.residents[id]).filter(Boolean);
    if (ms.length) h.avgPositivity = round1(ms.reduce((a, m) => a + m.positivity, 0) / ms.length);
  }

  // Woningwaarde, en huur die meestijgt bij particuliere huur
  const q = qualityMap(s);
  for (const u of Object.values(s.units)) {
    u.value = unitValuation(s, u, q, s.avgPositivity).value;
    if (u.rentRefValue == null) u.rentRefValue = u.value;
    if (u.tenure === 'PRIVATE' && !u.coop && u.householdId) {
      u.monthlyCost = Math.round(u.baseCost * Math.pow(u.value / u.rentRefValue, 0.8));
    }
  }

  // Relaties groeien vanzelf
  for (const rel of Object.values(s.relationships)) {
    const A = s.residents[rel.a];
    const B = s.residents[rel.b];
    if (!A || !B) continue;
    if (rel.type === 'FRICTION') {
      if (A.positivity > 62 && B.positivity > 62 && Math.random() < 0.015) {
        rel.type = 'ACQUAINTANCE';
        rel.strength = 35;
        rel.memory = 'Ze groeten elkaar weer in het portiek.';
        addLog(s, `${displayName(A)} en ${displayName(B)} groeten elkaar weer.`);
      }
      continue;
    }
    rel.strength = clamp(rel.strength + 0.15 + ((A.positivity + B.positivity) / 2 - 55) / 150, 0, 100);
    if (rel.strength >= 80) rel.type = 'FRIEND';
    else if (rel.strength >= 55 && rel.type === 'ACQUAINTANCE') rel.type = 'NEIGHBOUR';
  }
  const people = Object.values(s.residents).filter((r) => r.age >= 4);
  const meetBonus = amenities.filter((a) => ['BENCH', 'MEET', 'COFFEE', 'MARKET', 'FIRE'].includes(a.type)).length * 0.012;
  for (let i = 0; i < 2 && people.length > 1; i++) {
    const A = pick(people);
    const B = pick(people);
    if (A.id === B.id || A.householdId === B.householdId) continue;
    const exists = Object.values(s.relationships).some((r) => (r.a === A.id && r.b === B.id) || (r.a === B.id && r.b === A.id));
    if (exists) continue;
    const shared = A.routine.some((x) => B.routine.includes(x)) ? 0.08 : 0;
    const chance = 0.05 + (sameBuilding(s, A.id, B.id) ? 0.1 : 0) + shared + meetBonus;
    if (Math.random() < chance) {
      const id = 'rel_n' + s.nextId++;
      s.relationships[id] = { id, a: A.id, b: B.id, type: 'ACQUAINTANCE', strength: 30, memory: pick(MEET_MEMORIES), near: sameBuilding(s, A.id, B.id) };
      addLog(s, `${displayName(A)} en ${displayName(B)} leren elkaar kennen.`);
    }
  }

  // Elk nieuw seizoen: bijdrage van de gemeente en verhuisplannen
  if (newSeason) {
    const occupied = Object.values(s.units).filter((u) => u.householdId).length;
    const income = 260 + occupied * 30;
    s.money += income;
    addLog(s, `Het is ${{ SPRING: 'lente', SUMMER: 'zomer', AUTUMN: 'herfst', WINTER: 'winter' }[season]} (jaar ${year}). De gemeente stort € ${income} in de buurtpot.`, true);

    for (const h of Object.values(clone(s.households))) {
      const u = s.units[h.unitId];
      if (!u || !s.households[h.id]) continue;
      if (u.tenure === 'OWNER' && !u.coop) {
        const v = unitValuation(s, u, q, s.avgPositivity);
        if (Math.random() < v.sellChance) {
          removeHousehold(s, h.id, `Familie ${h.familyName} verkoopt het huis met flinke winst en verhuist. ${u.label} staat te koop.`);
          continue;
        }
      }
      if (u.tenure === 'PRIVATE' && !u.coop) {
        const ratio = u.monthlyCost / h.monthlyIncome;
        const p = clamp((ratio - 0.42) * 2.5, 0, 0.5) * (1 - h.attachment * 0.6);
        if (Math.random() < p) {
          removeHousehold(s, h.id, `De huur werd te hoog. Familie ${h.familyName} verhuist naar een goedkopere plek buiten de buurt.`);
          continue;
        }
      }
      const members = h.memberIds.map((id) => s.residents[id]);
      if (members.length === 1 && members[0].age >= 90 && Math.random() < 0.15) {
        removeHousehold(s, h.id, `${displayName(members[0])} gaat dichter bij familie wonen. De buren zwaaien haar of hem uit.`);
        continue;
      }
      const adults = members.filter((m) => m.age >= 24 && m.age <= 42);
      const baby = members.some((m) => m.age < 2);
      if (adults.length >= 2 && !baby && h.memberIds.length < u.maxOccupants && Math.random() < 0.15) {
        const name = pick(['Lou', 'Noah', 'Mees', 'Lina', 'Ilyas', 'Saar', 'Ties', 'Nova']);
        const id = newResident(s, { firstName: name, lastName: adults[0].lastName, age: 0, traits: ['Pasgeboren'], bio: 'De jongste bewoner van de buurt.', householdId: h.id, unitId: u.id, isDependent: true });
        s.households[h.id].memberIds.push(id);
        addLog(s, `Familie ${h.familyName} heeft een baby gekregen: ${name}!`, true);
      }
    }
  }

  // Elk nieuw jaar wordt iedereen een jaar ouder
  if (newYear) {
    for (const r of Object.values(s.residents)) {
      const before = lifeStageOf(r.age);
      r.age += 1;
      const after = lifeStageOf(r.age);
      if (after !== before) r.routine = [...DEFAULT_ROUTINES[after]];
      if (r.isDependent && r.age === 18) addLog(s, `${displayName(r)} is 18 en zoekt een eigen plek in de buurt.`, true);
    }
  }

  // Lege woningen worden na een tijdje vanzelf weer bewoond
  for (const id of Object.keys(s.units)) {
    const u = s.units[id];
    if (!u.ready || u.householdId) continue;
    if (s.vacantSince[id] == null) s.vacantSince[id] = s.day;
    if (s.day - s.vacantSince[id] >= 8) s = autoFill(s, id);
  }

  return settleWishes(s);
}

export function residentThought(s, r) {
  const unit = s.units[r.unitId];
  const b = s.buildings[unit.buildingId];
  const stage = lifeStageOf(r.age);
  if (r.isDependent && r.age >= 18) return `Al ${r.searchingDays} dagen op zoek naar een eigen plek in de buurt.`;
  if (stage === 'SENIOR' && unit.floor >= 1 && !b.hasElevator) return 'De trap wordt elke dag een beetje zwaarder.';
  if (stage === 'CHILD' && deriveAmenities(s).some((a) => a.type === 'PLAYGROUND')) return 'Het klimrek is het allerleukst!';
  const ratio = unit.monthlyCost / Math.max(1, s.households[r.householdId].monthlyIncome);
  if (stage !== 'CHILD' && stage !== 'BABY' && ratio > 0.36) return 'De vaste lasten zijn hoog. Er blijft weinig over.';
  if (r.positivity > 75) return 'Wat woon ik hier fijn.';
  return r.thought;
}

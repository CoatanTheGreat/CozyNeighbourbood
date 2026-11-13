// Tijd: één dag duurt 50 seconden op 1x, een seizoen 12 dagen (10 minuten).

import { mix, clamp, hash01 } from './util.js';

export const DAY_MS = 50000;
export const DAYS_PER_SEASON = 12;
export const DAYS_PER_YEAR = 48;
export const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
export const START_FRACTION = 0.66; // eerste indruk: vroege avond

export function calendar(day) {
  const s = Math.floor(day / DAYS_PER_SEASON) % 4;
  return {
    season: SEASONS[s],
    dayOfSeason: (day % DAYS_PER_SEASON) + 1,
    year: Math.floor(day / DAYS_PER_YEAR) + 1
  };
}

// Lichtverloop over één dag (0 = middernacht). De luchtkleuren zijn gekozen
// vóór de avondfilter; die filter maakt alles daarna donkerder.
const KEYS = [
  { t: 0.0, top: '#5463b4', bot: '#8a8fd2', tint: '#4f5899', dark: 1 },
  { t: 0.19, top: '#5463b4', bot: '#8a8fd2', tint: '#4f5899', dark: 1 },
  { t: 0.25, top: '#8fb6e6', bot: '#ffc9a3', tint: '#c9b3d6', dark: 0.5 },
  { t: 0.31, top: '#9fd0f5', bot: '#ffe6c4', tint: '#fff0dc', dark: 0.05 },
  { t: 0.4, top: '#a6d6f8', bot: '#eef7ff', tint: '#ffffff', dark: 0 },
  { t: 0.62, top: '#a0d0f4', bot: '#fff1d9', tint: '#fff8ec', dark: 0 },
  { t: 0.69, top: '#8a78cc', bot: '#ffb07c', tint: '#e8bccb', dark: 0.35 },
  { t: 0.75, top: '#6a5fb8', bot: '#e8919e', tint: '#a993c8', dark: 0.72 },
  { t: 0.82, top: '#5463b4', bot: '#8a8fd2', tint: '#4f5899', dark: 1 },
  { t: 1.0, top: '#5463b4', bot: '#8a8fd2', tint: '#4f5899', dark: 1 }
];

export function lightAt(f) {
  const x = ((f % 1) + 1) % 1;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].t <= x) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const k = clamp((x - a.t) / Math.max(0.0001, b.t - a.t), 0, 1);
  return {
    skyTop: mix(a.top, b.top, k),
    skyBot: mix(a.bot, b.bot, k),
    tint: mix(a.tint, b.tint, k),
    darkness: a.dark + (b.dark - a.dark) * k
  };
}

export function phaseOf(f) {
  if (f < 0.21 || f >= 0.82) return 'NIGHT';
  if (f < 0.34) return 'MORNING';
  if (f < 0.66) return 'DAY';
  return 'EVENING';
}

export const PHASE_LABEL = {
  MORNING: 'Ochtend',
  DAY: 'Middag',
  EVENING: 'Avond',
  NIGHT: 'Nacht'
};

export const SEASON_LABEL = {
  SPRING: 'Lente',
  SUMMER: 'Zomer',
  AUTUMN: 'Herfst',
  WINTER: 'Winter'
};

export const WEATHER_LABEL = {
  CLEAR: 'Helder',
  BLOSSOM: 'Bloesem in de wind',
  RAIN: 'Zachte regen',
  LEAVES: 'Vallende bladeren',
  SNOW: 'Sneeuw'
};

// Weer per dag, vast bepaald zodat het na opslaan hetzelfde blijft
export function weatherFor(day) {
  const { season } = calendar(day);
  const r = hash01('weer' + day);
  if (season === 'SPRING') return r < 0.5 ? 'BLOSSOM' : r < 0.82 ? 'CLEAR' : 'RAIN';
  if (season === 'SUMMER') return r < 0.82 ? 'CLEAR' : 'RAIN';
  if (season === 'AUTUMN') return r < 0.45 ? 'LEAVES' : r < 0.78 ? 'RAIN' : 'CLEAR';
  return r < 0.65 ? 'SNOW' : 'CLEAR';
}

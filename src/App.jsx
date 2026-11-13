import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home,
  Users,
  Heart,
  Coins,
  Sparkles,
  Sun,
  CloudRain,
  Snowflake,
  Flower2,
  Eye,
  EyeOff,
  Play,
  Pause,
  FastForward,
  Wrench,
  HandHeart,
  ArrowUpRight,
  ShieldCheck,
  Footprints,
  MessageCircleHeart,
  CheckCircle2,
  AlertCircle,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  TreePine,
  Coffee,
  Baby,
  UserCheck,
  Award,
  Info,
  ChevronRight,
  Layers,
  Shuffle,
  Briefcase,
  ShoppingBag,
  Sprout
} from 'lucide-react';

// ============================================================================
// 0. KLEUR-INTERPOLATIE & WEBAUDIO SFEER-SYNTHESIZER
// ============================================================================

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function lerpColor(hexBleak, hexCozy, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const c1 = hexToRgb(hexBleak);
  const c2 = hexToRgb(hexCozy);
  const r = Math.round(c1.r + (c2.r - c1.r) * clamped);
  const g = Math.round(c1.g + (c2.g - c1.g) * clamped);
  const b = Math.round(c1.b + (c2.b - c1.b) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

// Procedurele WebAudio Synthesizer (100% statisch voor GitHub Pages, geen externe MP3's nodig)
class CozySoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.windGain = null;
    this.loopTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Zachte wind-ruis generator (gefilterde ruis voor Oostblok-wind / zachte bries)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.15;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    whiteNoise.start(0);
  }

  setMuted(muted, bloom = 0.2, timeOfDay = 'DAY') {
    this.isMuted = muted;
    if (!muted && !this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    if (this.windGain) {
      // Meer gure wind als de buurt nog grauw (Oostblok) is, zachter als de buurt bloeit
      const targetWind = muted ? 0.0 : Math.max(0.02, 0.11 * (1 - bloom * 0.65));
      this.windGain.gain.setTargetAtTime(targetWind, now, 0.4);
    }
  }

  // Speel een warme Monument Valley-achtige pentatonische klank of vogel-tsjilp
  playAmbientStep(bloom = 0.3, timeOfDay = 'DAY', weather = 'CLEAR') {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Pentatonische akkoordtonen (C4, D4, E4, G4, A4, C5, E5, G5)
    const bleakNotes = [196.0, 220.0, 246.94, 293.66]; // A mineur / sober Oostblok
    const cozyNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25];
    const pool = bloom < 0.3 ? bleakNotes : cozyNotes;
    const freq = pool[Math.floor(Math.random() * pool.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = timeOfDay === 'NIGHT' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const vol = 0.025 + bloom * 0.03;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.9);

    // Als de buurt opbloeit én het is overdag/ochtend: kans op een vrolijk vogeltje
    if (bloom > 0.25 && (timeOfDay === 'MORNING' || timeOfDay === 'DAY') && weather !== 'RAIN' && Math.random() < 0.65) {
      this.playBirdChirp(now + 0.5);
    }
  }

  playBirdChirp(startTime) {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 1650 + Math.random() * 500;
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.28, startTime + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, startTime + 0.18);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.018, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.22);
  }

  playInteractionChime(kind = 'place') {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes =
      kind === 'upgrade'
        ? [392.0, 493.88, 587.33, 783.99]
        : kind === 'remove'
        ? [329.63, 261.63]
        : [523.25, 659.25, 783.99];

    notes.forEach((n, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, now + idx * 0.07);
      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.48);
    });
  }
}

const soundEngine = new CozySoundscapeEngine();

// ============================================================================
// 0B. DAG/NACHT-FASEN, WEERTYPEN & VRIJE DECORATIE-CATALOGUS
// ============================================================================

const TIME_OF_DAY_META = {
  MORNING: {
    id: 'MORNING',
    label: 'Ochtendgloren',
    shortLabel: '🌅 Ochtend',
    windowLit: false,
    lampsLit: false,
    skyCozyTop: '#fde68a',
    skyCozyMid: '#fed7aa',
    skyCozyBot: '#bae6fd',
    skyBleakTop: '#475569',
    skyBleakMid: '#64748b',
    skyBleakBot: '#334155',
    ambientOverlay: 'rgba(254, 240, 138, 0.06)'
  },
  DAY: {
    id: 'DAY',
    label: 'Middagzon',
    shortLabel: '☀️ Middag',
    windowLit: false,
    lampsLit: false,
    skyCozyTop: '#bae6fd',
    skyCozyMid: '#fef3c7',
    skyCozyBot: '#e0f2fe',
    skyBleakTop: '#64748b',
    skyBleakMid: '#94a3b8',
    skyBleakBot: '#475569',
    ambientOverlay: 'rgba(255, 255, 255, 0.0)'
  },
  DUSK: {
    id: 'DUSK',
    label: 'Avondschemering',
    shortLabel: '🌇 Schemer',
    windowLit: true,
    lampsLit: true,
    skyCozyTop: '#4c1d95',
    skyCozyMid: '#ea580c',
    skyCozyBot: '#fde047',
    skyBleakTop: '#1e293b',
    skyBleakMid: '#475569',
    skyBleakBot: '#64748b',
    ambientOverlay: 'rgba(234, 88, 12, 0.14)'
  },
  NIGHT: {
    id: 'NIGHT',
    label: 'Sterrennacht',
    shortLabel: '🌙 Nacht',
    windowLit: true,
    lampsLit: true,
    skyCozyTop: '#0f172a',
    skyCozyMid: '#1e1b4b',
    skyCozyBot: '#312e81',
    skyBleakTop: '#090d16',
    skyBleakMid: '#111827',
    skyBleakBot: '#1f2937',
    ambientOverlay: 'rgba(15, 23, 42, 0.36)'
  }
};

const WEATHER_META = {
  CLEAR: { id: 'CLEAR', label: 'Helder Weer', badge: '☀️ Helder' },
  BLOSSOM: { id: 'BLOSSOM', label: 'Bloesembries', badge: '🌸 Bloesem' },
  RAIN: { id: 'RAIN', label: 'Zachte Regenbui', badge: '🌧️ Regen' },
  LEAVES: { id: 'LEAVES', label: 'Herfstbladeren', badge: '🍂 Herfstwind' },
  SNOW: { id: 'SNOW', label: 'Sneeuwdwarreling', badge: '❄️ Sneeuw' }
};

// Vrije keuze decoraties die de speler overal op vrije tegels kan plaatsen
const FREE_DECORATION_CATALOG = [
  {
    id: 'TREE_BLOSSOM',
    name: 'Monument Bloesemboom',
    emoji: '🌸',
    costMoney: 55,
    costSK: 4,
    qualityBonus: 0.18,
    amenityType: 'TREE_CLUSTER',
    description: 'Brengt direct kleur, schaduw en vogels naar een grauwe straathoek.'
  },
  {
    id: 'COZY_BENCH',
    name: 'Gezellig Buurtbankje',
    emoji: '🪑',
    costMoney: 45,
    costSK: 3,
    qualityBonus: 0.16,
    amenityType: 'BENCH_SQUARE',
    description: 'Senioren zoals Meneer Koos en Tante Annie rusten hier uit (+Positiviteit).'
  },
  {
    id: 'STREET_LAMP',
    name: 'Warme Sfeerlantaarn',
    emoji: '🏮',
    costMoney: 40,
    costSK: 3,
    qualityBonus: 0.15,
    amenityType: 'STREET_LAMP',
    description: 'Geeft in de schemering en nacht een gouden lichtcirkel op straat.'
  },
  {
    id: 'FLOWER_PLANTER',
    name: 'Terracotta Bloembak',
    emoji: '🌷',
    costMoney: 30,
    costSK: 2,
    qualityBonus: 0.13,
    amenityType: 'FLOWER_PLANTER',
    description: 'Vervangt grauw Oostblok-beton door geurige bloemen.'
  },
  {
    id: 'PICNIC_TABLE',
    name: 'Buurt-Picknicktafel',
    emoji: '🧺',
    costMoney: 65,
    costSK: 5,
    qualityBonus: 0.20,
    amenityType: 'COFFEE_KIOSK',
    description: 'Plek waar buren samen koffie drinken en lunchen.'
  },
  {
    id: 'PLAY_HOPSCOTCH',
    name: 'Hinkelbaan & Speelplek',
    emoji: '🎨',
    costMoney: 35,
    costSK: 3,
    qualityBonus: 0.17,
    amenityType: 'PLAYGROUND',
    description: 'Maakt kinderen in de straat direct gelukkiger!'
  },
  {
    id: 'FIRE_PIT',
    name: 'Warme Buurt-Vuurkorf',
    emoji: '🔥',
    costMoney: 60,
    costSK: 5,
    qualityBonus: 0.21,
    amenityType: 'FIRE_PIT',
    description: 'Knusse warmtebron tijdens koude herfst- en winteravonden.'
  }
];

// ============================================================================
// 1. CONSTANTEN, SEIZOENEN & ARCHETYPEN (GDD SECTIE 2 & 3)
// ============================================================================

const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];

const SEASON_META = {
  SPRING: {
    label: 'Lente',
    icon: Flower2,
    accent: 'text-emerald-700',
    bgBadge: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    skyBg: 'from-amber-50 via-emerald-50/40 to-sky-100',
    groundTint: '#dce7d0',
    grassColor: '#8cb369',
    treeColor: '#6a994e',
    blossomColor: '#f4a261',
    description: 'Bloesem in de straat; buitenplekken krijgen +20% positiviteit.'
  },
  SUMMER: {
    label: 'Zomer',
    icon: Sun,
    accent: 'text-amber-700',
    bgBadge: 'bg-amber-100 border-amber-300 text-amber-900',
    skyBg: 'from-amber-100/70 via-orange-50/40 to-sky-100',
    groundTint: '#e6e2cc',
    grassColor: '#7ca95c',
    treeColor: '#588157',
    blossomColor: '#e9c46a',
    description: 'Lange zomeravonden op het plein; park & moestuin floreren (+40%).'
  },
  AUTUMN: {
    label: 'Herfst',
    icon: CloudRain,
    accent: 'text-orange-800',
    bgBadge: 'bg-orange-100 border-orange-300 text-orange-900',
    skyBg: 'from-orange-100/60 via-stone-200/60 to-slate-200',
    groundTint: '#d8cfc2',
    grassColor: '#9c956b',
    treeColor: '#bc6c25',
    blossomColor: '#dda15e',
    description: 'Vallende bladeren & wind; overdekte ontmoetingsplekken worden belangrijker.'
  },
  WINTER: {
    label: 'Winter',
    icon: Snowflake,
    accent: 'text-sky-800',
    bgBadge: 'bg-sky-100 border-sky-300 text-sky-900',
    skyBg: 'from-slate-200 via-sky-100/50 to-stone-200',
    groundTint: '#e2e8f0',
    grassColor: '#cbd5e1',
    treeColor: '#64748b',
    blossomColor: '#f8fafc',
    description: 'Koude dagen: woningisolatie en het overdekte buurthuis beschermen het welzijn.'
  }
};

const LIFE_STAGE_META = {
  BABY: { label: 'Baby', roleWeight: 0.2, badge: 'bg-pink-100 text-pink-800' },
  CHILD: { label: 'Kind', roleWeight: 0.6, badge: 'bg-sky-100 text-sky-800' },
  YOUTH: { label: 'Jongere (Starter)', roleWeight: 1.0, badge: 'bg-violet-100 text-violet-800' },
  ADULT: { label: 'Volwassene', roleWeight: 1.2, badge: 'bg-amber-100 text-amber-900' },
  SENIOR: { label: 'Senior', roleWeight: 1.6, badge: 'bg-emerald-100 text-emerald-900' }
};

const INCOME_META = {
  LOW: { label: 'Bescheiden Inkomen', badge: 'bg-stone-200 text-stone-800' },
  MIDDLE: { label: 'Middeninkomen', badge: 'bg-teal-100 text-teal-900' },
  HIGH: { label: 'Ruim Inkomen', badge: 'bg-amber-200 text-amber-950' }
};

const ARCHETYPE_CONFIGS = [
  {
    id: 'STARTER_SOLO_OR_COUPLE',
    name: 'Jonge Starters',
    incomeBracket: 'LOW',
    monthlyIncome: 2100,
    maxMonthlyHousingBudget: 760,
    minComfortRequired: 0.45,
    minRoomsRequired: 1,
    prefersGroundFloor: false,
    weights: { greenery: 0.25, childAmenities: 0.05, socialCohesion: 0.35, culturalSpots: 0.35 },
    sampleFamily: {
      familyName: 'Groeneveld',
      members: [
        { firstName: 'Lieke', lifeStage: 'YOUTH', traits: ['Starters-pionier', 'Muziekliefhebber'], bioText: 'Zoekt een betaalbare eerste plek met gezellige buren.' }
      ]
    }
  },
  {
    id: 'WORKING_CLASS_FAMILY',
    name: 'Arbeidersgezin',
    incomeBracket: 'LOW',
    monthlyIncome: 2550,
    maxMonthlyHousingBudget: 860,
    minComfortRequired: 0.5,
    minRoomsRequired: 3,
    prefersGroundFloor: false,
    weights: { greenery: 0.25, childAmenities: 0.40, socialCohesion: 0.30, culturalSpots: 0.05 },
    sampleFamily: {
      familyName: 'De Groot',
      members: [
        { firstName: 'kevin', lifeStage: 'ADULT', traits: ['Handige Klusser', 'Voetbalcoach'], bioText: 'Steekt graag de handen uit de mouwen tijdens buurtklusdagen.' },
        { firstName: 'Chantal', lifeStage: 'ADULT', traits: ['Buurtverbinder', 'Hartelijk'], bioText: 'Zorgt dat iedereen in de straat zich gezien voelt.' },
        { firstName: 'Finn', lifeStage: 'CHILD', traits: ['Buitenspeler'], bioText: 'Droomt van een echt speeltoestel op het Zwaluwplein.' }
      ]
    }
  },
  {
    id: 'CREATIVE_FREELANCER',
    name: 'Creatieve Maker',
    incomeBracket: 'MIDDLE',
    monthlyIncome: 3100,
    maxMonthlyHousingBudget: 1050,
    minComfortRequired: 0.55,
    minRoomsRequired: 2,
    prefersGroundFloor: false,
    weights: { greenery: 0.30, childAmenities: 0.05, socialCohesion: 0.25, culturalSpots: 0.40 },
    sampleFamily: {
      familyName: 'Van Dongen',
      members: [
        { firstName: 'Mirthe', lifeStage: 'ADULT', traits: ['Keramist', 'Moestuinier'], bioText: 'Geeft graag creatieve workshops in het buurthuis.' }
      ]
    }
  },
  {
    id: 'SOCIAL_CONNECTOR',
    name: 'Buurtverbinder (Zorg/Onderwijs)',
    incomeBracket: 'MIDDLE',
    monthlyIncome: 3250,
    maxMonthlyHousingBudget: 1100,
    minComfortRequired: 0.55,
    minRoomsRequired: 2,
    prefersGroundFloor: false,
    weights: { greenery: 0.25, childAmenities: 0.20, socialCohesion: 0.45, culturalSpots: 0.10 },
    sampleFamily: {
      familyName: 'Tahiri',
      members: [
        { firstName: 'Karim', lifeStage: 'ADULT', traits: ['Buurtwerker', 'Kookliefhebber'], bioText: 'Organiseert soep-avonden voor eenzame ouderen in de straat.' },
        { firstName: 'Amina', lifeStage: 'ADULT', traits: ['Basisschool-juf', 'Plantenliefhebber'], bioText: 'Kent alle kinderen uit de buurt bij naam.' }
      ]
    }
  },
  {
    id: 'VITAL_SENIOR_COUPLE',
    name: 'Vitale Senioren',
    incomeBracket: 'MIDDLE',
    monthlyIncome: 2650,
    maxMonthlyHousingBudget: 950,
    minComfortRequired: 0.60,
    minRoomsRequired: 2,
    prefersGroundFloor: true,
    weights: { greenery: 0.40, childAmenities: 0.05, socialCohesion: 0.40, culturalSpots: 0.15 },
    sampleFamily: {
      familyName: 'Verhagen',
      members: [
        { firstName: 'Gerard', lifeStage: 'SENIOR', traits: ['Oud-Hovenier', 'Rustzoeker'], bioText: 'Zoekt een gelijkvloerse woning met uitzicht op het groen.' },
        { firstName: 'Ria', lifeStage: 'SENIOR', traits: ['Breiclub-oprichter', 'Gastvrij'], bioText: 'Deelt verse appeltaart uit aan de buren.' }
      ]
    }
  },
  {
    id: 'AFFLUENT_UPGRADER',
    name: 'Welvarende Doorstromer',
    incomeBracket: 'HIGH',
    monthlyIncome: 4900,
    maxMonthlyHousingBudget: 1750,
    minComfortRequired: 0.72,
    minRoomsRequired: 3,
    prefersGroundFloor: false,
    weights: { greenery: 0.45, childAmenities: 0.15, socialCohesion: 0.10, culturalSpots: 0.30 },
    sampleFamily: {
      familyName: 'Bentvelsen',
      members: [
        { firstName: 'Olivier', lifeStage: 'ADULT', traits: ['Architect', 'Designliefhebber'], bioText: 'Werkt veel in de stad, waardeert een verzorgde groene straat.' },
        { firstName: 'Claire', lifeStage: 'ADULT', traits: ['Consultant', 'Hardloper'], bioText: 'Investeert graag in verduurzaming, maar heeft minder vrije tijd.' }
      ]
    }
  }
];

// ============================================================================
// 2. START-SCENARIO DATA: LEVEL 1 "DE GRAUWE ARBEIDERSHOEK" (GDD SECTIE 4)
// ============================================================================

function createInitialNeighborhoodState() {
  // Genereer het 12x12 grid volgens de blauwdruk uit Sectie 4.2
  const tiles = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      let terrainType = 'PAVEMENT';
      let qualityScore = 0.0;
      let label = 'Stoep';

      // Straten op y=2, y=6, x=2 (noord), x=6 (noord), x=7 (midden)
      if (y === 2 || y === 6 || (x === 2 && y <= 8) || (x === 6 && y <= 8) || (x === 3 && y >= 9)) {
        terrainType = 'COBBLE_STREET';
        qualityScore = 0.02;
        label = 'Klinkerstraat';
      }
      // Gracht / Water rechtsonder & onderaan (y=9, en x>=9 bij y=7..8)
      if (y === 9 || (y >= 7 && y <= 8 && x >= 9)) {
        terrainType = 'WATER_CANAL';
        qualityScore = 0.15;
        label = 'Buurtgracht';
      }
      // Bruggetjes over de gracht
      if ((x === 3 && y === 9) || (x === 10 && y === 8) || (x === 10 && y === 9)) {
        terrainType = 'BRIDGE';
        qualityScore = 0.20;
        label = 'Bruggetje';
      }
      // Het Zwaluwplein (x=3..5, y=3..5)
      if (x >= 3 && x <= 5 && y >= 3 && y <= 5) {
        terrainType = 'SQUARE_TILES';
        qualityScore = -0.15; // Start vervallen!
        label = 'Het Zwaluwplein';
      }
      // Moestuin / Brak Veldje (x=0..1, y=7..8)
      if (x >= 0 && x <= 1 && y >= 7 && y <= 8) {
        terrainType = 'GRASS';
        qualityScore = -0.05;
        label = 'Verwilderd Veldje';
      }
      // Groenstroken aan de randen
      if (
        (x <= 1 && y <= 1) ||
        (x >= 10 && y <= 1) ||
        (x >= 10 && y >= 3 && y <= 5) ||
        (y >= 10 && x !== 3)
      ) {
        terrainType = 'GRASS';
        qualityScore = 0.12;
        label = 'Groenstrook';
      }

      tiles.push({
        pos: { x, y },
        terrainType,
        buildingId: null,
        amenityId: null,
        decorationType: null,
        qualityScore,
        label
      });
    }
  }

  // Gebouwen & Woonunits (Arbeidershuisjes HW1-HW6, Portiekflat De Zwaluw, Plein, Moestuin, Buurtloods)
  const buildings = {
    b_hw1: {
      id: 'b_hw1',
      name: 'Arbeidershuisje Nr. 1',
      shortCode: 'HW1',
      category: 'WORKER_HOUSE',
      gridPos: { x: 3, y: 0 },
      footprint: { width: 1, depth: 2 },
      conditionMultiplier: 0.92,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#b5533c',
      wallColor: '#d9be9b',
      unitIds: ['u_hw1'],
      upgrades: [
        {
          id: 'up_hw1_insul',
          name: 'Spouwmuur- & Dakisolatie',
          description: 'Houdt de warmte vast in de winter (+6 winter-positiviteit & hoger wooncomfort).',
          isInstalled: false,
          costMoney: 420,
          costSocialCapital: 12,
          valueModifier: 0.10,
          comfortBonus: 0.16,
          seasonalInsulationBonus: true
        },
        {
          id: 'up_hw1_garden',
          name: 'Bloemrijke Geveltuin (Klusdag)',
          description: 'Samen met de buren tegels wippen en stokrozen planten.',
          isInstalled: false,
          costMoney: 0,
          costSocialCapital: 18,
          valueModifier: 0.05,
          comfortBonus: 0.08
        }
      ]
    },
    b_hw2: {
      id: 'b_hw2',
      name: 'Arbeidershuisje Nr. 2 (Tante Annie)',
      shortCode: 'HW2',
      category: 'WORKER_HOUSE',
      gridPos: { x: 4, y: 0 },
      footprint: { width: 1, depth: 2 },
      conditionMultiplier: 0.85,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#9e4733',
      wallColor: '#e0c9a6',
      unitIds: ['u_hw2'],
      upgrades: [
        {
          id: 'up_hw2_bench',
          name: 'Gevelbankje &Theetuin (Klusdag)',
          description: 'Een zonnig bankje voor Tante Annie waar buren dagelijks een praatje maken.',
          isInstalled: false,
          costMoney: 0,
          costSocialCapital: 15,
          valueModifier: 0.06,
          comfortBonus: 0.14
        },
        {
          id: 'up_hw2_insul',
          name: 'Tochtstrips & HR++ Glas',
          description: 'Verwarmt het oude arbeidershuisje van Tante Annie.',
          isInstalled: false,
          costMoney: 360,
          costSocialCapital: 10,
          valueModifier: 0.09,
          comfortBonus: 0.15,
          seasonalInsulationBonus: true
        }
      ]
    },
    b_hw3: {
      id: 'b_hw3',
      name: 'Arbeidershuisje Nr. 3 (Gezin Yilmaz)',
      shortCode: 'HW3',
      category: 'WORKER_HOUSE',
      gridPos: { x: 5, y: 0 },
      footprint: { width: 1, depth: 2 },
      conditionMultiplier: 0.90,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#b5533c',
      wallColor: '#d4b48c',
      unitIds: ['u_hw3'],
      upgrades: [
        {
          id: 'up_hw3_insul',
          name: 'Dakkapel & Isolatiepakket',
          description: 'Extra ruimte en warmte voor het gezin Yilmaz.',
          isInstalled: false,
          costMoney: 450,
          costSocialCapital: 12,
          valueModifier: 0.12,
          comfortBonus: 0.16,
          seasonalInsulationBonus: true
        }
      ]
    },
    b_hw4: {
      id: 'b_hw4',
      name: 'Klushuisje Westzijde Nr. 4',
      shortCode: 'HW4',
      category: 'WORKER_HOUSE',
      gridPos: { x: 0, y: 3 },
      footprint: { width: 2, depth: 1 },
      conditionMultiplier: 0.75,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#7f5539',
      wallColor: '#cbb292',
      unitIds: ['u_hw4'],
      upgrades: [
        {
          id: 'up_hw4_klusdag',
          name: 'Buurt-Klusdag: Dak & Gevel Schilderen',
          description: 'Buren helpen starters Bram & Lotte met hun lekkende dak zonder dat het hun spaargeld kost!',
          isInstalled: false,
          costMoney: 0,
          costSocialCapital: 22,
          valueModifier: 0.09,
          comfortBonus: 0.22,
          seasonalInsulationBonus: true
        },
        {
          id: 'up_hw4_solar',
          name: 'Collectieve Zonnepanelen (Verlaagt Woonlast)',
          description: 'Verlaagt de maandelijkse energierekening van Bram & Lotte met € 140/mnd!',
          isInstalled: false,
          costMoney: 480,
          costSocialCapital: 10,
          valueModifier: 0.11,
          comfortBonus: 0.12,
          lowersMonthlyCostBy: 140
        }
      ]
    },
    b_hw6: {
      id: 'b_hw6',
      name: 'Dichtgetimmerd Huisje Nr. 6',
      shortCode: 'HW6',
      category: 'WORKER_HOUSE',
      gridPos: { x: 0, y: 5 },
      footprint: { width: 2, depth: 1 },
      conditionMultiplier: 0.65,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#6c584c',
      wallColor: '#b7a99a',
      unitIds: ['u_hw6'],
      upgrades: [
        {
          id: 'up_hw6_restore',
          name: 'Woning Herstellen & Openstellen',
          description: 'Maak dit leegstaande arbeidershuisje weer bewoonbaar voor een nieuw gezin of starter.',
          isInstalled: false,
          costMoney: 550,
          costSocialCapital: 20,
          valueModifier: 0.20,
          comfortBonus: 0.30,
          unlocksVacantUnitId: 'u_hw6'
        }
      ]
    },
    b_flat: {
      id: 'b_flat',
      name: 'Portiekflat "De Zwaluw"',
      shortCode: 'PFL',
      category: 'WALKUP_FLAT',
      gridPos: { x: 7, y: 6 },
      footprint: { width: 4, depth: 3 },
      conditionMultiplier: 0.80,
      hasElevator: false,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#5c677d',
      wallColor: '#c9ada7',
      unitIds: ['u_f0l', 'u_f0r', 'u_f1l', 'u_f1r', 'u_f2l', 'u_f2r'],
      upgrades: [
        {
          id: 'up_flat_stairwell',
          name: 'Balkonbakken & Bloesemtuin (Klusdag)',
          description: 'Hangt fleurige plantenbakken aan alle smeedijzeren balkons en plant roze bloesembomen voor het portiek.',
          isInstalled: false,
          costMoney: 0,
          costSocialCapital: 20,
          valueModifier: 0.06,
          comfortBonus: 0.10
        },
        {
          id: 'up_flat_insulation',
          name: 'Groen Sedumdak, Zonnepanelen & Dakterras',
          description: 'Transformeert het kale betondak tot een groen sedumdak met zonnepanelen en een houten buurt-dakterras!',
          isInstalled: false,
          costMoney: 750,
          costSocialCapital: 25,
          valueModifier: 0.14,
          comfortBonus: 0.14,
          seasonalInsulationBonus: true
        },
        {
          id: 'up_flat_elevator',
          name: 'Inpandige Lift & Fietsenstalling',
          description: 'Maakt de bovenste woonlagen toegankelijk voor senioren zoals Meneer Koos en voegt fietsenrekken toe.',
          isInstalled: false,
          costMoney: 950,
          costSocialCapital: 30,
          valueModifier: 0.15,
          comfortBonus: 0.12,
          enablesElevator: true
        }
      ]
    },
    b_square: {
      id: 'b_square',
      name: 'Buurtschool & Speelplein',
      shortCode: 'SCH',
      category: 'PUBLIC_SQUARE',
      gridPos: { x: 7, y: 0 },
      footprint: { width: 4, depth: 3 },
      conditionMultiplier: 0.70,
      hasElevator: true,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#94a3b8',
      wallColor: '#cbd5e1',
      unitIds: [],
      upgrades: [
        {
          id: 'up_sq_cleanup',
          name: 'Buurt-Klusdag: Kleurrijke Schoolgevel & Zonnepanelen',
          description: 'Kost € 0! Verwijder graffiti, schilder de school in vrolijk geel/rood/blauw en leg zonnepanelen op het dak.',
          isInstalled: false,
          costMoney: 0,
          costSocialCapital: 20,
          valueModifier: 0.12,
          comfortBonus: 0.15,
          tileQualityDelta: 0.25,
          addsAmenityType: 'BENCH_SQUARE'
        },
        {
          id: 'up_sq_playground',
          name: 'Groen Basketbalveld, Klimrek & Fietsenrekken',
          description: 'Geeft kinderen (zoals Daan en Mila) een groen gecoat sportveldje, zandbak en veilige speelplek.',
          isInstalled: false,
          costMoney: 450,
          costSocialCapital: 15,
          valueModifier: 0.10,
          comfortBonus: 0.12,
          tileQualityDelta: 0.18,
          addsAmenityType: 'PLAYGROUND'
        }
      ]
    },
    b_garden: {
      id: 'b_garden',
      name: 'Hoekpand "SUPERMARKT" & Stoeptuin',
      shortCode: 'SUP',
      category: 'GREEN_PLOT',
      gridPos: { x: 1, y: 5 },
      footprint: { width: 3, depth: 2 },
      conditionMultiplier: 0.75,
      hasElevator: true,
      hasThermalInsulation: false,
      isCutawayOpen: false,
      roofColor: '#6a994e',
      wallColor: '#a3b18a',
      unitIds: [],
      upgrades: [
        {
          id: 'up_gar_moestuin',
          name: 'Verse Groentekramen, Bloemen & Gevelherstel',
          description: 'Knapt de gescheurde bakstenen gevel van de Supermarkt op en plaatst gezellige bloemen- en fruitkramen op de stoep!',
          isInstalled: false,
          costMoney: 280,
          costSocialCapital: 25,
          valueModifier: 0.14,
          comfortBonus: 0.15,
          tileQualityDelta: 0.30,
          addsAmenityType: 'COMMUNITY_GARDEN'
        }
      ]
    },
    b_hub: {
      id: 'b_hub',
      name: 'Centraal Wijkgebouw (Met Slagboom)',
      shortCode: 'WKZ',
      category: 'COMMUNITY_HUB',
      gridPos: { x: 4, y: 1 },
      footprint: { width: 3, depth: 3 },
      conditionMultiplier: 0.72,
      hasElevator: true,
      hasThermalInsulation: true,
      isCutawayOpen: false,
      roofColor: '#8d5b4c',
      wallColor: '#d5bdaf',
      unitIds: [],
      upgrades: [
        {
          id: 'up_hub_center',
          name: 'EV-Laadplein, Gevelrenovatie & Buurtloket',
          description: 'Verfrist het grauwe kantoorpand met groene EV-laadpalen bij de slagboom, struiken en een warm buurtcentrum.',
          isInstalled: false,
          costMoney: 620,
          costSocialCapital: 25,
          valueModifier: 0.15,
          comfortBonus: 0.20,
          tileQualityDelta: 0.25,
          addsAmenityType: 'COFFEE_KIOSK'
        }
      ]
    }
  };

  // Alle Woonunits (inclusief de 6 cutaway-units in Portiekflat "De Zwaluw")
  const units = {
    u_hw1: {
      id: 'u_hw1',
      buildingId: 'b_hw1',
      unitLabel: 'Arbeidershuisje Nr. 1',
      floorLevel: 0,
      rooms: 4,
      maxOccupants: 4,
      isStarterFriendly: false,
      isReadyForOccupation: true,
      tenure: 'OWNER_OCCUPIED',
      isSocialCooperative: false,
      cappedSocialRent: null,
      baseValue: 215000,
      currentMarketValue: 215000,
      currentMonthlyCost: 780,
      comfortScore: 0.68,
      occupiedByHouseholdId: 'hh_1',
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'FULL_WIDTH', interiorTheme: 'FAMILY_TOYS' }
    },
    u_hw2: {
      id: 'u_hw2',
      buildingId: 'b_hw2',
      unitLabel: 'Arbeidershuisje Nr. 2',
      floorLevel: 0,
      rooms: 3,
      maxOccupants: 2,
      isStarterFriendly: false,
      isReadyForOccupation: true,
      tenure: 'SOCIAL_RENT',
      isSocialCooperative: true,
      cappedSocialRent: 560,
      baseValue: 185000,
      currentMarketValue: 185000,
      currentMonthlyCost: 560,
      comfortScore: 0.62,
      occupiedByHouseholdId: 'hh_2',
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'FULL_WIDTH', interiorTheme: 'VINTAGE_SENIOR' }
    },
    u_hw3: {
      id: 'u_hw3',
      buildingId: 'b_hw3',
      unitLabel: 'Arbeidershuisje Nr. 3',
      floorLevel: 0,
      rooms: 3,
      maxOccupants: 3, // Gezin van 3 waarvan zoon Emre (19) een eigen plek zoekt!
      isStarterFriendly: false,
      isReadyForOccupation: true,
      tenure: 'OWNER_OCCUPIED',
      isSocialCooperative: false,
      cappedSocialRent: null,
      baseValue: 210000,
      currentMarketValue: 210000,
      currentMonthlyCost: 740,
      comfortScore: 0.65,
      occupiedByHouseholdId: 'hh_3',
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'FULL_WIDTH', interiorTheme: 'WARM_BAKERY' }
    },
    u_hw4: {
      id: 'u_hw4',
      buildingId: 'b_hw4',
      unitLabel: 'Klushuisje Westzijde Nr. 4',
      floorLevel: 0,
      rooms: 3,
      maxOccupants: 3,
      isStarterFriendly: true,
      isReadyForOccupation: true,
      tenure: 'OWNER_OCCUPIED',
      isSocialCooperative: false,
      cappedSocialRent: null,
      baseValue: 195000,
      currentMarketValue: 195000,
      currentMonthlyCost: 920, // Hoge hypotheeklast bij start!
      comfortScore: 0.48,
      occupiedByHouseholdId: 'hh_4',
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'FULL_WIDTH', interiorTheme: 'DIY_TOOLS' }
    },
    u_hw6: {
      id: 'u_hw6',
      buildingId: 'b_hw6',
      unitLabel: 'Arbeidershuisje Westzijde Nr. 6',
      floorLevel: 0,
      rooms: 3,
      maxOccupants: 4,
      isStarterFriendly: true,
      isReadyForOccupation: false, // Moet eerst opgeknapt worden via up_hw6_restore
      tenure: 'PRIVATE_RENT',
      isSocialCooperative: false,
      cappedSocialRent: 680,
      baseValue: 180000,
      currentMarketValue: 180000,
      currentMonthlyCost: 790,
      comfortScore: 0.42,
      occupiedByHouseholdId: null,
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'FULL_WIDTH', interiorTheme: 'BOARDED_UP' }
    },

    // --- 6 CUTAWAY UNITS VAN PORTIEKFLAT "DE ZWALUW" ---
    u_f0l: {
      id: 'u_f0l',
      buildingId: 'b_flat',
      unitLabel: 'Flat 0-Links (Begane Grond)',
      shortRoomCode: 'F-0L',
      floorLevel: 0,
      rooms: 2,
      maxOccupants: 2,
      isStarterFriendly: true,
      isReadyForOccupation: true,
      tenure: 'SOCIAL_RENT',
      isSocialCooperative: true,
      cappedSocialRent: 590,
      baseValue: 165000,
      currentMarketValue: 165000,
      currentMonthlyCost: 590,
      comfortScore: 0.64,
      occupiedByHouseholdId: 'hh_5',
      upgrades: [],
      cutawayConfig: { floorIndex: 0, slotPosition: 'LEFT', interiorTheme: 'COZY_PLANTS' }
    },
    u_f0r: {
      id: 'u_f0r',
      buildingId: 'b_flat',
      unitLabel: 'Flat 0-Rechts (Oude Berging -> Studio)',
      shortRoomCode: 'F-0R',
      floorLevel: 0,
      rooms: 2,
      maxOccupants: 2,
      isStarterFriendly: true,
      isReadyForOccupation: false, // Kan verbouwd worden tot Gelijkvloerse Senioren-Studio!
      tenure: 'SOCIAL_RENT',
      isSocialCooperative: true,
      cappedSocialRent: 550,
      baseValue: 160000,
      currentMarketValue: 160000,
      currentMonthlyCost: 550,
      comfortScore: 0.78,
      occupiedByHouseholdId: null,
      upgrades: [
        {
          id: 'up_f0r_senior_studio',
          name: 'Verbouw Berging tot Gelijkvloerse Senioren-Studio',
          description: 'Maakt op de begane grond een drempelvrije woning vrij zodat Meneer Koos (78) van 2-hoog naar beneden kan doorstromen!',
          isInstalled: false,
          costMoney: 420,
          costSocialCapital: 18,
          valueModifier: 0.12,
          comfortBonus: 0.20,
          unlocksVacantUnitId: 'u_f0r'
        }
      ],
      cutawayConfig: { floorIndex: 0, slotPosition: 'RIGHT', interiorTheme: 'STORAGE_BOXES' }
    },
    u_f1l: {
      id: 'u_f1l',
      buildingId: 'b_flat',
      unitLabel: 'Flat 1-Links (1e Verdieping)',
      shortRoomCode: 'F-1L',
      floorLevel: 1,
      rooms: 3,
      maxOccupants: 3,
      isStarterFriendly: false,
      isReadyForOccupation: true,
      tenure: 'PRIVATE_RENT',
      isSocialCooperative: false,
      cappedSocialRent: 680,
      baseValue: 175000,
      currentMarketValue: 175000,
      currentMonthlyCost: 820,
      comfortScore: 0.58,
      occupiedByHouseholdId: 'hh_6',
      upgrades: [
        {
          id: 'up_f1l_floor',
          name: 'Zwevende Deens-Design Vloerisolatie',
          description: 'Dempt loopgeluiden voor de buren en verhoogt het wooncomfort van Naomi & Mila.',
          isInstalled: false,
          costMoney: 260,
          costSocialCapital: 10,
          valueModifier: 0.06,
          comfortBonus: 0.16
        }
      ],
      cutawayConfig: { floorIndex: 1, slotPosition: 'LEFT', interiorTheme: 'FAMILY_TOYS' }
    },
    u_f1r: {
      id: 'u_f1r',
      buildingId: 'b_flat',
      unitLabel: 'Flat 1-Rechts (1e Verdieping)',
      shortRoomCode: 'F-1R',
      floorLevel: 1,
      rooms: 2,
      maxOccupants: 2,
      isStarterFriendly: true,
      isReadyForOccupation: true,
      tenure: 'OWNER_OCCUPIED',
      isSocialCooperative: false,
      cappedSocialRent: null,
      baseValue: 180000,
      currentMarketValue: 180000,
      currentMonthlyCost: 710,
      comfortScore: 0.66,
      occupiedByHouseholdId: 'hh_7',
      upgrades: [],
      cutawayConfig: { floorIndex: 1, slotPosition: 'RIGHT', interiorTheme: 'ART_STUDIO' }
    },
    u_f2l: {
      id: 'u_f2l',
      buildingId: 'b_flat',
      unitLabel: 'Flat 2-Links (2e Hoog - Meneer Koos)',
      shortRoomCode: 'F-2L',
      floorLevel: 2,
      rooms: 2,
      maxOccupants: 2,
      isStarterFriendly: true,
      isReadyForOccupation: true,
      tenure: 'SOCIAL_RENT',
      isSocialCooperative: true,
      cappedSocialRent: 540,
      baseValue: 165000,
      currentMarketValue: 165000,
      currentMonthlyCost: 540,
      comfortScore: 0.56,
      occupiedByHouseholdId: 'hh_8',
      upgrades: [],
      cutawayConfig: { floorIndex: 2, slotPosition: 'LEFT', interiorTheme: 'VINTAGE_SENIOR' }
    },
    u_f2r: {
      id: 'u_f2r',
      buildingId: 'b_flat',
      unitLabel: 'Flat 2-Rechts (Lege Zolder-Etage)',
      shortRoomCode: 'F-2R',
      floorLevel: 2,
      rooms: 2,
      maxOccupants: 2,
      isStarterFriendly: true,
      isReadyForOccupation: false, // Kan opgeknapt worden voor starter Emre Yilmaz!
      tenure: 'SOCIAL_RENT',
      isSocialCooperative: true,
      cappedSocialRent: 520,
      baseValue: 155000,
      currentMarketValue: 155000,
      currentMonthlyCost: 520,
      comfortScore: 0.72,
      occupiedByHouseholdId: null,
      upgrades: [
        {
          id: 'up_f2r_starter',
          name: 'Zolder-Etage Renoveren tot Startersstudio',
          description: 'Maak deze leegstaande verdieping direct klaar voor een wachtende jongere uit de buurt (zoals Emre Yilmaz)!',
          isInstalled: false,
          costMoney: 380,
          costSocialCapital: 20,
          valueModifier: 0.12,
          comfortBonus: 0.22,
          unlocksVacantUnitId: 'u_f2r'
        }
      ],
      cutawayConfig: { floorIndex: 2, slotPosition: 'RIGHT', interiorTheme: 'NEEDS_PAINT' }
    }
  };

  // De 8 Start-Huishoudens (Sectie 4.3)
  const households = {
    hh_1: {
      id: 'hh_1',
      familyName: 'Van der Vliet',
      archetypeId: 'WORKING_CLASS_FAMILY',
      unitId: 'u_hw1',
      buildingId: 'b_hw1',
      memberIds: ['res_joris', 'res_sanne', 'res_daan'],
      incomeBracket: 'MIDDLE',
      monthlyIncome: 3200,
      monthlyHousingCost: 780,
      purchasePrice: 205000,
      ticksLivedInNeighborhood: 190,
      neighborhoodAttachment: 0.65,
      averagePositivity: 62,
      wantsInternalMoveToGroundFloor: false
    },
    hh_2: {
      id: 'hh_2',
      familyName: 'Bakker (Tante Annie)',
      archetypeId: 'VITAL_SENIOR_COUPLE',
      unitId: 'u_hw2',
      buildingId: 'b_hw2',
      memberIds: ['res_annie'],
      incomeBracket: 'LOW',
      monthlyIncome: 1750,
      monthlyHousingCost: 560,
      purchasePrice: null,
      ticksLivedInNeighborhood: 640,
      neighborhoodAttachment: 0.95,
      averagePositivity: 58,
      wantsInternalMoveToGroundFloor: false
    },
    hh_3: {
      id: 'hh_3',
      familyName: 'Yilmaz',
      archetypeId: 'WORKING_CLASS_FAMILY',
      unitId: 'u_hw3',
      buildingId: 'b_hw3',
      memberIds: ['res_murat', 'res_elif', 'res_emre'],
      incomeBracket: 'MIDDLE',
      monthlyIncome: 3100,
      monthlyHousingCost: 740,
      purchasePrice: 198000,
      ticksLivedInNeighborhood: 280,
      neighborhoodAttachment: 0.78,
      averagePositivity: 55,
      wantsInternalMoveToGroundFloor: false
    },
    hh_4: {
      id: 'hh_4',
      familyName: 'De Vries & Meijer',
      archetypeId: 'STARTER_SOLO_OR_COUPLE',
      unitId: 'u_hw4',
      buildingId: 'b_hw4',
      memberIds: ['res_bram', 'res_lotte'],
      incomeBracket: 'MIDDLE',
      monthlyIncome: 2650,
      monthlyHousingCost: 920, // Woonquote > 30% drukt positiviteit totdat zonnepanelen/klusdag helpen!
      purchasePrice: 195000,
      ticksLivedInNeighborhood: 18,
      neighborhoodAttachment: 0.30,
      averagePositivity: 48,
      wantsInternalMoveToGroundFloor: false
    },
    hh_5: {
      id: 'hh_5',
      familyName: 'El Amrani',
      archetypeId: 'STARTER_SOLO_OR_COUPLE',
      unitId: 'u_f0l',
      buildingId: 'b_flat',
      memberIds: ['res_samir', 'res_noor'],
      incomeBracket: 'LOW',
      monthlyIncome: 2350,
      monthlyHousingCost: 590,
      purchasePrice: null,
      ticksLivedInNeighborhood: 64,
      neighborhoodAttachment: 0.58,
      averagePositivity: 64,
      wantsInternalMoveToGroundFloor: false
    },
    hh_6: {
      id: 'hh_6',
      familyName: 'Koster',
      archetypeId: 'WORKING_CLASS_FAMILY',
      unitId: 'u_f1l',
      buildingId: 'b_flat',
      memberIds: ['res_naomi', 'res_mila'],
      incomeBracket: 'LOW',
      monthlyIncome: 2200,
      monthlyHousingCost: 820,
      purchasePrice: null,
      ticksLivedInNeighborhood: 45,
      neighborhoodAttachment: 0.42,
      averagePositivity: 46,
      wantsInternalMoveToGroundFloor: false
    },
    hh_7: {
      id: 'hh_7',
      familyName: 'Vermeer',
      archetypeId: 'CREATIVE_FREELANCER',
      unitId: 'u_f1r',
      buildingId: 'b_flat',
      memberIds: ['res_tijn'],
      incomeBracket: 'MIDDLE',
      monthlyIncome: 2950,
      monthlyHousingCost: 710,
      purchasePrice: 175000,
      ticksLivedInNeighborhood: 40,
      neighborhoodAttachment: 0.38,
      averagePositivity: 56,
      wantsInternalMoveToGroundFloor: false
    },
    hh_8: {
      id: 'hh_8',
      familyName: 'Hendriks (Meneer Koos)',
      archetypeId: 'VITAL_SENIOR_COUPLE',
      unitId: 'u_f2l',
      buildingId: 'b_flat',
      memberIds: ['res_koos'],
      incomeBracket: 'LOW',
      monthlyIncome: 1680,
      monthlyHousingCost: 540,
      purchasePrice: null,
      ticksLivedInNeighborhood: 520,
      neighborhoodAttachment: 0.92,
      averagePositivity: 44, // Laag vanwege de 2 trappen zonder lift!
      wantsInternalMoveToGroundFloor: true
    }
  };

  // De 14 Start-Bewoners
  const residents = {
    res_joris: {
      id: 'res_joris',
      firstName: 'Joris',
      lastName: 'van der Vliet',
      avatarColor: '#e07a5f',
      householdId: 'hh_1',
      unitId: 'u_hw1',
      lifeStage: 'ADULT',
      totalAgeTicks: 260,
      ticksInCurrentStage: 90,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Gouden Handen', 'Behulpzame Buur'],
      bioText: 'Timmerman die altijd klaarstaat met zijn gereedschapskist tijdens buurt-klusdagen.',
      currentThoughtBubble: 'Met wat hout kunnen we een prachtig speeltoestel op het plein bouwen!',
      positivity: 63,
      positivityBreakdown: { housingAndAffordability: 24, environmentAndSeason: 10, socialRelationships: 19, lifeStageNeeds: 10, totalTarget: 63 },
      dailySocialCapitalOutput: 0.35
    },
    res_sanne: {
      id: 'res_sanne',
      firstName: 'Sanne',
      lastName: 'van der Vliet',
      avatarColor: '#f2cc8f',
      householdId: 'hh_1',
      unitId: 'u_hw1',
      lifeStage: 'ADULT',
      totalAgeTicks: 250,
      ticksInCurrentStage: 80,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Wijkverpleegkundige', 'Zorgzaam'],
      bioText: 'Houdt een oogje in het zeil bij oudere buren zoals Tante Annie en Meneer Koos.',
      currentThoughtBubble: 'Ik maak me zorgen om de steile trappen voor Meneer Koos op 2-hoog.',
      positivity: 64,
      positivityBreakdown: { housingAndAffordability: 24, environmentAndSeason: 10, socialRelationships: 20, lifeStageNeeds: 10, totalTarget: 64 },
      dailySocialCapitalOutput: 0.38
    },
    res_daan: {
      id: 'res_daan',
      firstName: 'Daan',
      lastName: 'van der Vliet',
      avatarColor: '#81b29a',
      householdId: 'hh_1',
      unitId: 'u_hw1',
      lifeStage: 'CHILD',
      totalAgeTicks: 90,
      ticksInCurrentStage: 42,
      isDependent: true,
      ticksSearchingHome: 0,
      traits: ['Stoepkrijt-kunstenaar', 'Energiek'],
      bioText: 'Speelt graag buiten met Mila uit de portiekflat, maar het plein is nu nog erg kaal en grijs.',
      currentThoughtBubble: 'Was er maar een klimrek of zandbak op het Zwaluwplein...',
      positivity: 52,
      positivityBreakdown: { housingAndAffordability: 24, environmentAndSeason: 9, socialRelationships: 22, lifeStageNeeds: -3, totalTarget: 52 },
      dailySocialCapitalOutput: 0.08
    },
    res_annie: {
      id: 'res_annie',
      firstName: 'Tante Annie',
      lastName: 'Bakker',
      avatarColor: '#f4a261',
      householdId: 'hh_2',
      unitId: 'u_hw2',
      lifeStage: 'SENIOR',
      totalAgeTicks: 620,
      ticksInCurrentStage: 140,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Geheugen van de Wijk', 'Rozenliefhebber'],
      bioText: 'Woont al 45 jaar op nummer 2. Kent elk verhaal van de straat en schenkt graag thee.',
      currentThoughtBubble: 'Een bankje op het plein of een geveltuin zou de straat zo opvrolijken!',
      positivity: 58,
      positivityBreakdown: { housingAndAffordability: 26, environmentAndSeason: 8, socialRelationships: 22, lifeStageNeeds: 2, totalTarget: 58 },
      dailySocialCapitalOutput: 0.42
    },
    res_murat: {
      id: 'res_murat',
      firstName: 'Murat',
      lastName: 'Yilmaz',
      avatarColor: '#457b9d',
      householdId: 'hh_3',
      unitId: 'u_hw3',
      lifeStage: 'ADULT',
      totalAgeTicks: 310,
      ticksInCurrentStage: 140,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Vroege Vogel', 'Gastvrije Bakker'],
      bioText: 'Brengt op zaterdagochtend versgebakken broodjes langs bij Tante Annie.',
      currentThoughtBubble: 'Onze zoon Emre (19) heeft echt een eigen startersplek in de buurt nodig.',
      positivity: 59,
      positivityBreakdown: { housingAndAffordability: 23, environmentAndSeason: 9, socialRelationships: 19, lifeStageNeeds: 8, totalTarget: 59 },
      dailySocialCapitalOutput: 0.28
    },
    res_elif: {
      id: 'res_elif',
      firstName: 'Elif',
      lastName: 'Yilmaz',
      avatarColor: '#a8dadc',
      householdId: 'hh_3',
      unitId: 'u_hw3',
      lifeStage: 'ADULT',
      totalAgeTicks: 295,
      ticksInCurrentStage: 125,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Penningmeester', 'Moestuin-dromer'],
      bioText: 'Zou dolgraag verse kruiden en tomaten kweken op het verwilderde veldje in het zuidwesten.',
      currentThoughtBubble: 'Als we die lege zolder in De Zwaluw opknappen, kan Emre in de straat blijven wonen!',
      positivity: 58,
      positivityBreakdown: { housingAndAffordability: 23, environmentAndSeason: 9, socialRelationships: 18, lifeStageNeeds: 8, totalTarget: 58 },
      dailySocialCapitalOutput: 0.26
    },
    res_emre: {
      id: 'res_emre',
      firstName: 'Emre',
      lastName: 'Yilmaz',
      avatarColor: '#6d597a',
      householdId: 'hh_3',
      unitId: 'u_hw3',
      lifeStage: 'YOUTH',
      totalAgeTicks: 165,
      ticksInCurrentStage: 38,
      isDependent: true,
      ticksSearchingHome: 26, // Zit in Fase 2 (Kriebels): zoekt een startersstudio!
      traits: ['Starters-Woningzoekende', 'Geluidstechnicus'],
      bioText: '19 jaar oud. Wil dolgraag op eigen benen staan in zijn eigen vertrouwde buurt.',
      currentThoughtBubble: 'Ik zoek een eigen studio in de buurt! (Wacht al 26 dagen...)',
      positivity: 46,
      positivityBreakdown: { housingAndAffordability: 20, environmentAndSeason: 8, socialRelationships: 13, lifeStageNeeds: 5, totalTarget: 46 },
      dailySocialCapitalOutput: 0.05
    },
    res_bram: {
      id: 'res_bram',
      firstName: 'Bram',
      lastName: 'de Vries',
      avatarColor: '#bc6c25',
      householdId: 'hh_4',
      unitId: 'u_hw4',
      lifeStage: 'ADULT',
      totalAgeTicks: 205,
      ticksInCurrentStage: 25,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Doorzetter', 'Nieuw in de Straat'],
      bioText: 'Heeft samen met Lotte net klushuisje Nr. 4 gekocht, maar het budget is op en het dak tocht.',
      currentThoughtBubble: 'De hypotheek en energierekening zijn pittig... een Buurt-Klusdag zou ons redden!',
      positivity: 47,
      positivityBreakdown: { housingAndAffordability: 14, environmentAndSeason: 9, socialRelationships: 14, lifeStageNeeds: 10, totalTarget: 47 },
      dailySocialCapitalOutput: 0.06
    },
    res_lotte: {
      id: 'res_lotte',
      firstName: 'Lotte',
      lastName: 'Meijer',
      avatarColor: '#dda15e',
      householdId: 'hh_4',
      unitId: 'u_hw4',
      lifeStage: 'ADULT',
      totalAgeTicks: 200,
      ticksInCurrentStage: 20,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Illustratrice', 'Leergierig'],
      bioText: 'Wil graag de buren beter leren kennen terwijl ze hun huisje stap voor stap opknappen.',
      currentThoughtBubble: 'Joris van Nr. 1 weet vast hoe we dit dakraam tochtvrij krijgen!',
      positivity: 49,
      positivityBreakdown: { housingAndAffordability: 14, environmentAndSeason: 9, socialRelationships: 16, lifeStageNeeds: 10, totalTarget: 49 },
      dailySocialCapitalOutput: 0.08
    },
    res_samir: {
      id: 'res_samir',
      firstName: 'Samir',
      lastName: 'El Amrani',
      avatarColor: '#2a9d8f',
      householdId: 'hh_5',
      unitId: 'u_f0l',
      lifeStage: 'ADULT',
      totalAgeTicks: 215,
      ticksInCurrentStage: 35,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Barista', 'Gitaarspeler'],
      bioText: 'Woont met Noor op de begane grond van De Zwaluw. Droomt van een echte buurt-koffiehoek.',
      currentThoughtBubble: 'In de oude timmerwerkplaats zouden we heerlijke buurtkoffie kunnen schenken!',
      positivity: 64,
      positivityBreakdown: { housingAndAffordability: 25, environmentAndSeason: 10, socialRelationships: 19, lifeStageNeeds: 10, totalTarget: 64 },
      dailySocialCapitalOutput: 0.36
    },
    res_noor: {
      id: 'res_noor',
      firstName: 'Noor',
      lastName: 'El Amrani',
      avatarColor: '#e9c46a',
      householdId: 'hh_5',
      unitId: 'u_f0l',
      lifeStage: 'ADULT',
      totalAgeTicks: 212,
      ticksInCurrentStage: 32,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Ontwerpster', 'Plantenstekjes-deler'],
      bioText: 'Zet regelmatig gratis plantenstekjes in de vensterbank van het portiek.',
      currentThoughtBubble: 'Het trappenhuis van onze flat kan wel een lik verf en wat groen gebruiken.',
      positivity: 65,
      positivityBreakdown: { housingAndAffordability: 25, environmentAndSeason: 10, socialRelationships: 20, lifeStageNeeds: 10, totalTarget: 65 },
      dailySocialCapitalOutput: 0.39
    },
    res_naomi: {
      id: 'res_naomi',
      firstName: 'Naomi',
      lastName: 'Koster',
      avatarColor: '#e76f51',
      householdId: 'hh_6',
      unitId: 'u_f1l',
      lifeStage: 'ADULT',
      totalAgeTicks: 240,
      ticksInCurrentStage: 60,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Alleenstaande Moeder', 'Doorzetter'],
      bioText: 'Woont op 1-hoog met dochtertje Mila. De particuliere huur is hoog en de houten vloer kraakt.',
      currentThoughtBubble: 'Als deze woning een Buurtcoöperatie wordt, daalt onze huur naar een eerlijk bedrag!',
      positivity: 47,
      positivityBreakdown: { housingAndAffordability: 14, environmentAndSeason: 9, socialRelationships: 14, lifeStageNeeds: 10, totalTarget: 47 },
      dailySocialCapitalOutput: 0.06
    },
    res_mila: {
      id: 'res_mila',
      firstName: 'Mila',
      lastName: 'Koster',
      avatarColor: '#f4a261',
      householdId: 'hh_6',
      unitId: 'u_f1l',
      lifeStage: 'CHILD',
      totalAgeTicks: 82,
      ticksInCurrentStage: 34,
      isDependent: true,
      ticksSearchingHome: 0,
      traits: ['Tekenaar', 'Beste maatje van Daan'],
      bioText: 'Rent graag de trappen van het portiek op en neer, wat buurman Tijn soms uit zijn concentratie haalt.',
      currentThoughtBubble: 'Zullen we vandaag buiten spelen met Daan op het plein?',
      positivity: 48,
      positivityBreakdown: { housingAndAffordability: 18, environmentAndSeason: 9, socialRelationships: 24, lifeStageNeeds: -3, totalTarget: 48 },
      dailySocialCapitalOutput: 0.04
    },
    res_tijn: {
      id: 'res_tijn',
      firstName: 'Tijn',
      lastName: 'Vermeer',
      avatarColor: '#588157',
      householdId: 'hh_7',
      unitId: 'u_f1r',
      lifeStage: 'ADULT',
      totalAgeTicks: 230,
      ticksInCurrentStage: 50,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Striptekenaar', 'Thuiswerker'],
      bioText: 'Werkt vanuit zijn studio op 1-hoog rechts. Heeft lichte gehorigheids-frictie met buurvrouw Naomi, maar een goed gesprek doet wonderen.',
      currentThoughtBubble: 'Een kop koffie met buurvrouw Naomi lost die gehorigheid vast vriendelijk op.',
      positivity: 56,
      positivityBreakdown: { housingAndAffordability: 23, environmentAndSeason: 10, socialRelationships: 13, lifeStageNeeds: 10, totalTarget: 56 },
      dailySocialCapitalOutput: 0.24
    },
    res_koos: {
      id: 'res_koos',
      firstName: 'Meneer Koos',
      lastName: 'Hendriks',
      avatarColor: '#3d5a80',
      householdId: 'hh_8',
      unitId: 'u_f2l',
      lifeStage: 'SENIOR',
      totalAgeTicks: 660,
      ticksInCurrentStage: 180,
      isDependent: false,
      ticksSearchingHome: 0,
      traits: ['Oud-Postbode', 'Vogelspotter'],
      bioText: '78 jaar. Kent elke brievenbus in de wijk, maar de twee steile trappen naar 2-hoog worden echt te zwaar voor zijn knieën.',
      currentThoughtBubble: 'Kon ik maar naar de begane grond (F-0R) verhuizen zonder mijn lieve buren te verliezen...',
      positivity: 44,
      positivityBreakdown: { housingAndAffordability: 25, environmentAndSeason: 8, socialRelationships: 17, lifeStageNeeds: -6, totalTarget: 44 },
      dailySocialCapitalOutput: 0.0
    }
  };

  // Start-Relaties (Sociale Graaf)
  const relationships = {
    rel_1: {
      id: 'rel_1',
      residentAId: 'res_sanne',
      residentBId: 'res_annie',
      type: 'CLOSE_FRIEND',
      strength: 82,
      isSameBuildingOrAdjacent: true,
      sharedMemories: ['Elke dinsdag samen verse muntthee bij Nr. 2']
    },
    rel_2: {
      id: 'rel_2',
      residentAId: 'res_murat',
      residentBId: 'res_annie',
      type: 'GOOD_NEIGHBOR',
      strength: 74,
      isSameBuildingOrAdjacent: true,
      sharedMemories: ['Zaterdagse warme broodjes over de heg']
    },
    rel_3: {
      id: 'rel_3',
      residentAId: 'res_daan',
      residentBId: 'res_mila',
      type: 'CLOSE_FRIEND',
      strength: 86,
      isSameBuildingOrAdjacent: false,
      sharedMemories: ['Samen stoepkrijten op het Zwaluwplein']
    },
    rel_4: {
      id: 'rel_4',
      residentAId: 'res_samir',
      residentBId: 'res_koos',
      type: 'GOOD_NEIGHBOR',
      strength: 70,
      isSameBuildingOrAdjacent: true,
      sharedMemories: ['Samir tilt elke donderdag de boodschappentas van Meneer Koos naar 2-hoog']
    },
    rel_5: {
      id: 'rel_5',
      residentAId: 'res_naomi',
      residentBId: 'res_tijn',
      type: 'FRICTION',
      strength: 22,
      isSameBuildingOrAdjacent: true,
      sharedMemories: ['Lichte irritatie over gehorigheid in het portiek — klaar om bij te leggen!']
    },
    rel_6: {
      id: 'rel_6',
      residentAId: 'res_joris',
      residentBId: 'res_bram',
      type: 'ACQUAINTANCE',
      strength: 45,
      isSameBuildingOrAdjacent: false,
      sharedMemories: ['Ladder geleend bij de verhuizing']
    },
    rel_7: {
      id: 'rel_7',
      residentAId: 'res_noor',
      residentBId: 'res_naomi',
      type: 'GOOD_NEIGHBOR',
      strength: 65,
      isSameBuildingOrAdjacent: true,
      sharedMemories: ['Pannenkoekenplaat gedeeld in het weekend']
    }
  };

  // De 4 Verhalende Start-Missies van Level 1
  const activeMissions = [
    {
      id: 'mis_plein',
      title: '1. Groen Hart voor het Zwaluwplein',
      narrativeText:
        'Tante Annie en de kinderen kijken nu uit op scheve grijze betontegels. Organiseer een gratis Buurt-Klusdag (met Sociaal Kapitaal) om tegels te wippen en een gezellig bankje te plaatsen!',
      giverResidentId: 'res_annie',
      status: 'ACTIVE',
      targetUpgradeId: 'up_sq_cleanup',
      targetBuildingId: 'b_square',
      rewardMoney: 300,
      rewardSK: 18,
      completed: false
    },
    {
      id: 'mis_koos',
      title: '2. De Gouden Wissel voor Meneer Koos (78)',
      narrativeText:
        'Oud-postbode Koos woont op 2-hoog zonder lift (Flat 2-Links). Verbouw de oude fietsenberging op de begane grond (Flat 0-Rechts) tot Senioren-Studio en laat Koos intern doorstromen met behoud van al zijn buren!',
      giverResidentId: 'res_koos',
      status: 'ACTIVE',
      targetInternalMoveResidentId: 'res_koos',
      targetBuildingId: 'b_flat',
      rewardMoney: 350,
      rewardSK: 25,
      completed: false
    },
    {
      id: 'mis_emre',
      title: '3. Een Eigen Stekje voor Starter Emre (19)',
      narrativeText:
        'Emre Yilmaz (uit Huisje Nr. 3) zoekt al 26 dagen een betaalbare starterswoning in zijn eigen wijk. Knap de lege zolder-etage (Flat 2-Rechts) op óf laat hem doorstromen naar een vrije studio in De Zwaluw.',
      giverResidentId: 'res_emre',
      status: 'ACTIVE',
      targetStarterResidentId: 'res_emre',
      targetBuildingId: 'b_flat',
      rewardMoney: 250,
      rewardSK: 22,
      completed: false
    },
    {
      id: 'mis_buren',
      title: '4. Koffie in het Portiek (Verbind Naomi & Tijn)',
      narrativeText:
        'Op de 1e verdieping van De Zwaluw is wat wrijving tussen Naomi en thuiswerker Tijn door de gehorige houten vloer. Koppel hen voor een goed gesprek of verfraai het portiek!',
      giverResidentId: 'res_tijn',
      status: 'ACTIVE',
      targetRelationshipId: 'rel_5',
      targetBuildingId: 'b_flat',
      rewardMoney: 200,
      rewardSK: 20,
      completed: false
    }
  ];

  return {
    scenarioId: 'level1_arbeidershoek',
    neighborhoodName: 'De Grauwe Arbeidershoek',
    currentTick: 1,
    currentSeason: 'SPRING',
    currentYear: 1,
    simulationSpeed: 1,
    budgetMoney: 1850,
    socialCapital: 45,
    averagePositivity: 55.4,
    diversityMultiplier: 1.25,
    tiles,
    buildings,
    units,
    amenities: [],
    households,
    residents,
    relationships,
    alumniPool: [],
    activeMissions,
    eventLog: [
      {
        id: 'ev_init',
        tick: 1,
        type: 'WELCOME',
        text: 'Welkom in De Grauwe Arbeidershoek! Klik op een kamer in Portiekflat "De Zwaluw" of op het Zwaluwplein om de buurt tot bloei te brengen.'
      }
    ]
  };
}

// ============================================================================
// 3. WISKUNDIGE SIMULATIE-FORMULES (EXACTE IMPLEMENTATIE UIT GDD SECTIE 2)
// ============================================================================

// Loop 1: Woningwaarde & Overwaarde-verhuiskans (Sigmoid met Sociale Demping)
function computeUnitValuation(unit, building, household, tiles, avgPositivity) {
  const R_MAX = 6;
  const LAMBDA = 1.35;

  const buildingUpgradeSum = (building.upgrades || [])
    .filter((u) => u.isInstalled)
    .reduce((sum, u) => sum + (u.valueModifier || 0), 0);
  const unitUpgradeSum = (unit.upgrades || [])
    .filter((u) => u.isInstalled)
    .reduce((sum, u) => sum + (u.valueModifier || 0), 0);
  const totalUpgradeSum = buildingUpgradeSum + unitUpgradeSum;

  let rawEnvScore = 0;
  for (const tile of tiles) {
    const dist =
      Math.abs(building.gridPos.x - tile.pos.x) +
      Math.abs(building.gridPos.y - tile.pos.y);
    if (dist > 0 && dist <= R_MAX) {
      rawEnvScore += tile.qualityScore / Math.pow(1 + dist, LAMBDA);
    }
  }
  const envIndex = Math.tanh(rawEnvScore);
  const normalizedPositivity = avgPositivity / 100;

  const multiplier =
    1 + 1.0 * totalUpgradeSum + 0.5 * envIndex + 0.2 * normalizedPositivity;
  const actualValue = Math.round(
    unit.baseValue * building.conditionMultiplier * Math.max(0.5, multiplier)
  );

  if (!household || unit.tenure !== 'OWNER_OCCUPIED' || unit.isSocialCooperative) {
    return {
      actualValue,
      envIndex: Number(envIndex.toFixed(2)),
      equityRatio: 0,
      seasonalSellProbability: 0,
      effectiveThreshold: 1.0
    };
  }

  const purchasePrice = household.purchasePrice || unit.baseValue;
  const equityRatio = (actualValue - purchasePrice) / purchasePrice;
  const BASE_THRESHOLD = 0.35;
  const P_MAX = 0.45;
  const STEEPNESS_K = 8.0;

  const attachment = household.neighborhoodAttachment || 0.5;
  const effectiveThreshold = BASE_THRESHOLD + 0.4 * attachment;

  if (equityRatio < 0.12) {
    return {
      actualValue,
      envIndex: Number(envIndex.toFixed(2)),
      equityRatio: Number(equityRatio.toFixed(3)),
      seasonalSellProbability: 0,
      effectiveThreshold: Number(effectiveThreshold.toFixed(2))
    };
  }

  const sigmoid = 1 / (1 + Math.exp(-STEEPNESS_K * (equityRatio - effectiveThreshold)));
  const attachmentDampener = 1 - 0.75 * attachment;
  const positivityDampener = 1 - (household.averagePositivity || 55) / 150;

  const seasonalSellProbability = Number(
    (P_MAX * attachmentDampener * positivityDampener * sigmoid).toFixed(4)
  );

  return {
    actualValue,
    envIndex: Number(envIndex.toFixed(2)),
    equityRatio: Number(equityRatio.toFixed(3)),
    seasonalSellProbability,
    effectiveThreshold: Number(effectiveThreshold.toFixed(2))
  };
}

// Loop 2: Individuele Positiviteit & Sociaal Kapitaal-generatie
function computeResidentPositivity(
  resident,
  household,
  unit,
  building,
  relationshipsList,
  amenitiesList,
  season
) {
  const SMOOTHING_ETA = 0.18;

  // 1. Wooncomfort & Betaalbaarheid (0 - 35)
  const unitComfort = unit.comfortScore || 0.6;
  const winterInsulationBonus =
    season === 'WINTER' && building.hasThermalInsulation ? 6 : 0;
  const effectiveHousingCost = unit.isSocialCooperative
    ? unit.cappedSocialRent || unit.currentMonthlyCost
    : household.monthlyHousingCost;
  const rentToIncomeRatio =
    effectiveHousingCost / Math.max(1, household.monthlyIncome);
  const affordabilityFactor = Math.max(
    0,
    1 - Math.max(0, rentToIncomeRatio - 0.3) * 2.2
  );
  const overcrowdingCount = Math.max(
    0,
    household.memberIds.length - unit.maxOccupants
  );
  const sHousing = Math.min(
    35,
    Math.max(
      0,
      20 * unitComfort +
        15 * affordabilityFactor +
        winterInsulationBonus -
        overcrowdingCount * 8
    )
  );

  // 2. Omgeving & Seizoen (0 - 25)
  const baseSeasonEnv =
    season === 'SUMMER' ? 11 : season === 'SPRING' ? 10 : season === 'AUTUMN' ? 7.5 : 5.5;
  let amenityPoints = 0;
  for (const am of amenitiesList) {
    const seasonalWeight = am.seasonalWeights?.[season] ?? 1.0;
    const stageAffinity = am.lifeStageAffinity?.[resident.lifeStage] ?? 1.0;
    amenityPoints += am.basePositivityValue * seasonalWeight * stageAffinity;
  }
  const sEnvironment = Math.min(25, Math.max(3, baseSeasonEnv + amenityPoints));

  // 3. Sociale Relaties (0 - 25)
  const myRels = relationshipsList.filter(
    (r) => r.residentAId === resident.id || r.residentBId === resident.id
  );
  let weightedRelSum = 0;
  let frictionPenalty = 0;
  for (const rel of myRels) {
    if (rel.type === 'FRICTION') {
      frictionPenalty += 3.5;
    } else if (rel.strength > 10) {
      const proximityWeight = rel.isSameBuildingOrAdjacent ? 1.5 : 1.0;
      weightedRelSum += (rel.strength / 100) * proximityWeight;
    }
  }
  const sRelationships = Math.max(
    2,
    Math.min(25, 11 * Math.sqrt(weightedRelSum + 0.35) - frictionPenalty)
  );

  // 4. Levensfase-Specifieke Behoefte (-10 tot +15)
  let sLifeStage = 8;
  const hasBench = amenitiesList.some((a) => a.type === 'BENCH_SQUARE');
  const hasPlay = amenitiesList.some((a) => a.type === 'PLAYGROUND');
  const hasGarden = amenitiesList.some((a) => a.type === 'COMMUNITY_GARDEN');

  if (resident.lifeStage === 'SENIOR') {
    const hasStairsPenalty = unit.floorLevel >= 2 && !building.hasElevator;
    sLifeStage = (hasBench ? 13 : 4) - (hasStairsPenalty ? 10 : 0);
  } else if (resident.lifeStage === 'YOUTH') {
    if (resident.isDependent) {
      const waitingPenalty = Math.max(
        0,
        (resident.ticksSearchingHome - 12) * 0.35
      );
      sLifeStage = Math.max(-10, 10 - waitingPenalty);
    } else {
      // Zelfstandig wonende starter in eigen buurt!
      sLifeStage = 14;
    }
  } else if (resident.lifeStage === 'CHILD') {
    sLifeStage = hasPlay ? 14 : -3;
  } else if (resident.lifeStage === 'ADULT') {
    sLifeStage = 9 + (hasGarden ? 3 : 0) + (hasBench ? 2 : 0);
  }

  const totalTarget = Math.min(
    100,
    Math.max(0, sHousing + sEnvironment + sRelationships + sLifeStage)
  );
  const newPositivity = Number(
    (
      resident.positivity +
      SMOOTHING_ETA * (totalTarget - resident.positivity)
    ).toFixed(1)
  );

  let socialCapitalContribution = 0;
  if (newPositivity > 45) {
    const roleWeight = LIFE_STAGE_META[resident.lifeStage]?.roleWeight || 1.0;
    const normalizedExcess = (newPositivity - 45) / 55;
    socialCapitalContribution = Number(
      (Math.pow(normalizedExcess, 1.3) * roleWeight * 0.85).toFixed(2)
    );
  }

  return {
    newPositivity,
    socialCapitalContribution,
    breakdown: {
      housingAndAffordability: Number(sHousing.toFixed(1)),
      environmentAndSeason: Number(sEnvironment.toFixed(1)),
      socialRelationships: Number(sRelationships.toFixed(1)),
      lifeStageNeeds: Number(sLifeStage.toFixed(1)),
      totalTarget: Number(totalTarget.toFixed(1))
    }
  };
}

// Loop 4: Softmax Instroom-algoritme voor een vrije woning
function computeInflowCandidates(unit, building, neighborhoodState) {
  const TEMPERATURE = 8.0;
  const amenities = neighborhoodState.amenities || [];
  const greeneryScore = Math.min(
    100,
    35 + amenities.filter((a) => a.type === 'COMMUNITY_GARDEN' || a.type === 'BENCH_SQUARE').length * 28
  );
  const childAmenityScore = Math.min(
    100,
    25 + amenities.filter((a) => a.type === 'PLAYGROUND').length * 55
  );
  const socialCohesionScore = Math.min(100, neighborhoodState.averagePositivity * 1.15);
  const culturalScore = Math.min(
    100,
    30 + amenities.filter((a) => a.type === 'COFFEE_KIOSK').length * 50
  );

  const householdsArr = Object.values(neighborhoodState.households);
  const archetypeCounts = {};
  for (const h of householdsArr) {
    archetypeCounts[h.archetypeId] = (archetypeCounts[h.archetypeId] || 0) + 1;
  }

  const utilities = [];
  const effectiveCost = unit.isSocialCooperative
    ? unit.cappedSocialRent || unit.currentMonthlyCost
    : unit.currentMonthlyCost;

  for (const arch of ARCHETYPE_CONFIGS) {
    if (effectiveCost > arch.maxMonthlyHousingBudget) {
      utilities.push({ arch, utility: -999, reason: 'Te hoge maandlast' });
      continue;
    }
    if (unit.rooms < arch.minRoomsRequired) {
      utilities.push({ arch, utility: -999, reason: 'Te weinig kamers' });
      continue;
    }

    let physicalMultiplier = 1.0;
    if (arch.prefersGroundFloor) {
      physicalMultiplier = unit.floorLevel === 0 || building.hasElevator ? 1.35 : 0.20;
    }

    const w = arch.weights;
    const rawAppeal =
      w.greenery * (greeneryScore / 100) +
      w.childAmenities * (childAmenityScore / 100) +
      w.socialCohesion * (socialCohesionScore / 100) +
      w.culturalSpots * (culturalScore / 100);

    const currentShare =
      (archetypeCounts[arch.id] || 0) / Math.max(1, householdsArr.length);
    const diversityBonus = 15 * (1 - currentShare);

    const totalUtility = physicalMultiplier * (rawAppeal * 50 + diversityBonus);
    utilities.push({ arch, utility: totalUtility, reason: 'Passend profiel' });
  }

  const valid = utilities.filter((u) => u.utility > -100);
  if (valid.length === 0) {
    return [
      {
        archetype: ARCHETYPE_CONFIGS[0],
        probability: 1.0,
        utility: 10
      }
    ];
  }

  const maxUtil = Math.max(...valid.map((c) => c.utility));
  const expScores = valid.map((c) => ({
    ...c,
    exp: Math.exp((c.utility - maxUtil) / TEMPERATURE)
  }));
  const sumExp = expScores.reduce((acc, c) => acc + c.exp, 0);

  return expScores
    .map((c) => ({
      archetype: c.arch,
      utility: Number(c.utility.toFixed(1)),
      probability: Number((c.exp / sumExp).toFixed(2))
    }))
    .sort((a, b) => b.probability - a.probability);
}

// Bereken de Mozaïek-Diversiteitsmultiplier (Sectie 1.3 & 2.2)
function computeDiversityMultiplier(householdsMap, residentsMap) {
  const incomes = new Set(Object.values(householdsMap).map((h) => h.incomeBracket));
  const stages = new Set(Object.values(residentsMap).map((r) => r.lifeStage));
  const incomeBonus = Math.min(3, incomes.size) * 0.08;
  const stageBonus = Math.min(4, stages.size) * 0.06;
  return Number((1.0 + incomeBonus + stageBonus).toFixed(2));
}

// ============================================================================
// 3B. LEVENDE DAGELIJKSE ROUTINES & WANDELPADEN VOOR BEWONERS OP STRAAT
// ============================================================================

const RESIDENT_ROUTINES = {
  res_joris: {
    roleLabel: 'Naar werk (Timmerman)',
    badge: '🔨',
    waypoints: [
      { x: 3.5, y: 1.8, act: 'Vertrekt naar klus' },
      { x: 2.3, y: 2.3, act: 'Onderweg naar werk' },
      { x: 0.4, y: 2.3, act: 'Op de bouwplaats' },
      { x: 2.3, y: 3.5, act: 'Terug uit werk' },
      { x: 3.8, y: 3.8, act: 'Buurtpraatje op plein' }
    ]
  },
  res_sanne: {
    roleLabel: 'Wijkverpleegkundige ronde',
    badge: '🩺',
    waypoints: [
      { x: 3.5, y: 2.2, act: 'Wijkronde start' },
      { x: 4.5, y: 2.1, act: 'Thee bij Tante Annie' },
      { x: 6.5, y: 2.1, act: 'Onderweg naar De Zwaluw' },
      { x: 7.5, y: 2.1, act: 'Zorgronde bij Koos' },
      { x: 5.2, y: 3.6, act: 'Even op het plein' }
    ]
  },
  res_daan: {
    roleLabel: 'Buitenspelen met Mila',
    badge: '⚽',
    waypoints: [
      { x: 3.6, y: 2.5, act: 'Rent naar het plein' },
      { x: 4.2, y: 4.1, act: 'Stoepkrijten & voetbal' },
      { x: 5.1, y: 4.8, act: 'Tikkertje op het plein' },
      { x: 3.9, y: 5.1, act: 'Spelen met Mila' }
    ]
  },
  res_annie: {
    roleLabel: 'Ommetje & Buurtpraatje',
    badge: '☕',
    waypoints: [
      { x: 4.5, y: 2.1, act: 'Voor haar geveltuin' },
      { x: 4.4, y: 3.8, act: 'Zit op het pleinbankje' },
      { x: 5.2, y: 4.2, act: 'Voert de vogels' },
      { x: 4.5, y: 2.4, act: 'Wandelt rustig terug' }
    ]
  },
  res_murat: {
    roleLabel: 'Vers brood & Boodschappen',
    badge: '🥖',
    waypoints: [
      { x: 5.5, y: 2.2, act: 'Met verse broodjes' },
      { x: 4.5, y: 2.2, act: 'Broodje voor Annie' },
      { x: 6.4, y: 4.5, act: 'Naar de bakkerij' },
      { x: 6.4, y: 6.3, act: 'Onderweg naar werk' }
    ]
  },
  res_elif: {
    roleLabel: 'Moestuin & Boodschappen',
    badge: '🌱',
    waypoints: [
      { x: 5.4, y: 2.4, act: 'Met boodschappentas' },
      { x: 2.4, y: 6.2, act: 'Wandelt naar moestuin' },
      { x: 1.2, y: 7.8, act: 'Werkt in de moestuin' },
      { x: 1.6, y: 7.4, act: 'Oogst verse kruiden' },
      { x: 3.8, y: 6.2, act: 'Terug met groenten' }
    ]
  },
  res_emre: {
    roleLabel: 'Zoekt Startersstudio',
    badge: '🎧',
    waypoints: [
      { x: 5.6, y: 2.3, act: 'Kijkt naar vrije kamers' },
      { x: 6.6, y: 2.2, act: 'Kijkt bij De Zwaluw' },
      { x: 5.2, y: 4.4, act: 'Luistert muziek op plein' }
    ]
  },
  res_bram: {
    roleLabel: 'Klussen & Bouwmarkt',
    badge: '🧰',
    waypoints: [
      { x: 2.1, y: 3.4, act: 'Timmeren aan gevel' },
      { x: 2.2, y: 6.2, act: 'Hout halen' },
      { x: 4.2, y: 6.2, act: 'Met klusmateriaal' },
      { x: 2.1, y: 3.6, act: 'Dak repareren' }
    ]
  },
  res_lotte: {
    roleLabel: 'Schetsen & Boodschappen',
    badge: '🛒',
    waypoints: [
      { x: 2.2, y: 3.8, act: 'Schetsboek mee' },
      { x: 3.4, y: 8.8, act: 'Kijkt bij de brug' },
      { x: 1.4, y: 7.6, act: 'Helpt in de tuin' },
      { x: 3.8, y: 4.6, act: 'Boodschappen doen' }
    ]
  },
  res_samir: {
    roleLabel: 'Koffie & Gitaar bij Loods',
    badge: '☕',
    waypoints: [
      { x: 7.2, y: 2.2, act: 'Uit de portiekflat' },
      { x: 7.6, y: 4.8, act: 'Koffie zetten in buurthuis' },
      { x: 5.5, y: 4.5, act: 'Praatje op het plein' }
    ]
  },
  res_noor: {
    roleLabel: 'Plantenstekjes & Tuin',
    badge: '🪴',
    waypoints: [
      { x: 7.4, y: 2.3, act: 'Deelt plantenstekjes' },
      { x: 4.8, y: 4.2, act: 'Verzorgt bloemperk' },
      { x: 1.5, y: 7.9, act: 'Water geven in tuin' }
    ]
  },
  res_naomi: {
    roleLabel: 'Werk & Boodschappen',
    badge: '🛍️',
    waypoints: [
      { x: 6.8, y: 2.2, act: 'Boodschappen halen' },
      { x: 10.5, y: 2.2, act: 'Onderweg naar werk' },
      { x: 5.0, y: 4.8, act: 'Haalt Mila op van plein' }
    ]
  },
  res_mila: {
    roleLabel: 'Buitenspelen op Plein',
    badge: '🎈',
    waypoints: [
      { x: 6.5, y: 2.5, act: 'Huppelt naar buiten' },
      { x: 4.6, y: 4.3, act: 'Speelt met Daan' },
      { x: 4.1, y: 4.9, act: 'Springtouwen op plein' },
      { x: 5.2, y: 3.9, act: 'Tekent met stoepkrijt' }
    ]
  },
  res_tijn: {
    roleLabel: 'Schetswandeling langs Gracht',
    badge: '✏️',
    waypoints: [
      { x: 7.8, y: 2.3, act: 'Frisse neus halen' },
      { x: 8.2, y: 6.3, act: 'Wandelt langs de gracht' },
      { x: 9.8, y: 8.2, act: 'Op het bruggetje' },
      { x: 5.6, y: 4.2, act: 'Koffie op het plein' }
    ]
  },
  res_koos: {
    roleLabel: 'Vogels spotten & Wandeling',
    badge: '🐦',
    waypoints: [
      { x: 7.1, y: 2.2, act: 'Voorzichtig de trap af' },
      { x: 5.8, y: 3.8, act: 'Schuifelt naar bankje' },
      { x: 4.6, y: 4.0, act: 'Praatje met Tante Annie' }
    ]
  }
};

// ============================================================================
// 4. HOOFDCOMPONENT: DE FLORERENDE BUURT (2.5D MONUMENT VALLEY EDITION)
// ============================================================================

export default function App() {
  const [gameState, setGameState] = useState(() => createInitialNeighborhoodState());

  // Selectie & Dossier-states
  const [selectedBuildingId, setSelectedBuildingId] = useState('b_flat');
  const [selectedUnitId, setSelectedUnitId] = useState('u_f2l');
  const [selectedResidentId, setSelectedResidentId] = useState('res_koos');
  const [activeRightTab, setActiveRightTab] = useState('BUILDING');
  const [globalCutaway, setGlobalCutaway] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 1) Dag/Nacht-Cyclus & Weer states (Start in de sfeervolle Winter-Schemering of Lente-Dag)
  const [timeOfDay, setTimeOfDay] = useState('DUSK'); // 'MORNING' | 'DAY' | 'DUSK' | 'NIGHT'
  const [autoDayCycle, setAutoDayCycle] = useState(false);
  const [weatherOverride, setWeatherOverride] = useState('AUTO'); // 'AUTO' | 'CLEAR' | 'BLOSSOM' | 'RAIN' | 'LEAVES' | 'SNOW'
  const [visualPreset, setVisualPreset] = useState('SIMULATION'); // 'SIMULATION' | 'WINTER_BLEAK' | 'SPRING_BLOOM'

  // 2) Vrije Keuze Aankleding / Decoratie-modus states
  const [selectedBrushId, setSelectedBrushId] = useState(null); // null of item.id of 'REMOVE'
  const [payWithSK, setPayWithSK] = useState(false); // Betaal vrije decoraties met SK of €

  // 3) Sfeergeluid (WebAudio) state
  const [soundMuted, setSoundMuted] = useState(true);

  // Real-time animatieklok voor wandelende bewoners, rookpluimpjes en rijdende auto's
  const [animPhase, setAnimPhase] = useState(0);

  // Camera Pan & Zoom voor het 2.5D Isometrische Canvas
  const [camera, setCamera] = useState({ x: 0, y: 6, zoom: 1.02 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const showToast = useCallback((title, subtitle, tone = 'warm') => {
    setToastMessage({ title, subtitle, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Continue vloeiende animatie-tick (25 FPS) voor levende bewoners & weereffecten
  useEffect(() => {
    if (gameState.simulationSpeed === 0) return;
    const speedMult = gameState.simulationSpeed === 2 ? 1.8 : 1.0;
    const interval = setInterval(() => {
      setAnimPhase((p) => (p + 0.018 * speedMult) % 1000);
    }, 45);
    return () => clearInterval(interval);
  }, [gameState.simulationSpeed]);

  // Automatische Dag/Nacht-Cyclus: doorloopt Ochtend -> Middag -> Schemer -> Nacht
  useEffect(() => {
    if (!autoDayCycle || gameState.simulationSpeed === 0) return;
    const order = ['MORNING', 'DAY', 'DUSK', 'NIGHT'];
    const cycleTimer = setInterval(() => {
      setTimeOfDay((prev) => {
        const nextIdx = (order.indexOf(prev) + 1) % order.length;
        return order[nextIdx];
      });
    }, 9500);
    return () => clearInterval(cycleTimer);
  }, [autoDayCycle, gameState.simulationSpeed]);

  // Bereken het actuele weertype op basis van seizoen + speler-keuze + buurtbloei
  const currentWeather = useMemo(() => {
    if (visualPreset === 'WINTER_BLEAK') return 'SNOW';
    if (visualPreset === 'SPRING_BLOOM') return 'BLOSSOM';
    if (weatherOverride !== 'AUTO') return weatherOverride;
    if (gameState.currentSeason === 'WINTER') return 'SNOW';
    if (gameState.currentSeason === 'AUTUMN') {
      return gameState.currentTick % 2 === 0 ? 'RAIN' : 'LEAVES';
    }
    if (gameState.currentSeason === 'SPRING') {
      return 'BLOSSOM';
    }
    return 'CLEAR';
  }, [visualPreset, weatherOverride, gameState.currentSeason, gameState.currentTick]);

  // Bereken de "Bloei-Index" (0.0 = Onontwikkeld Winter/Grauw -> 1.0 = Ontwikkeld Lente/Zonnepanelen)
  const neighborhoodBloom = useMemo(() => {
    if (visualPreset === 'WINTER_BLEAK') return 0.0;
    if (visualPreset === 'SPRING_BLOOM') return 1.0;
    let installedCount = 0;
    let totalCount = 0;
    Object.values(gameState.buildings).forEach((b) => {
      b.upgrades.forEach((u) => {
        totalCount++;
        if (u.isInstalled) installedCount++;
      });
    });
    Object.values(gameState.units).forEach((u) => {
      u.upgrades.forEach((up) => {
        totalCount++;
        if (up.isInstalled) installedCount++;
      });
    });
    const placedDecorations = gameState.tiles.filter((t) => t.decorationType).length;
    const upgradeRatio = totalCount > 0 ? installedCount / totalCount : 0;
    const decoBonus = Math.min(0.35, placedDecorations * 0.035);
    const posRatio = Math.max(0, (gameState.averagePositivity - 46) / 38);
    return Math.max(
      0,
      Math.min(1, Number((upgradeRatio * 0.55 + posRatio * 0.30 + decoBonus).toFixed(2)))
    );
  }, [visualPreset, gameState.buildings, gameState.units, gameState.tiles, gameState.averagePositivity]);

  // Snel-schakelaar tussen de 2 referentie-afbeeldingen of live simulatie
  const applyReferencePreset = (preset) => {
    setVisualPreset(preset);
    if (preset === 'WINTER_BLEAK') {
      setAutoDayCycle(false);
      setTimeOfDay('DUSK');
      setGameState((p) => ({ ...p, currentSeason: 'WINTER' }));
      showToast(
        'Sfeerbeeld 1: Winter & Schemering (Onontwikkeld)',
        'Sneeuw op de daken, graffiti, oude autobanden, warme raamverlichting en koplampen in de sneeuw.'
      );
    } else if (preset === 'SPRING_BLOOM') {
      setAutoDayCycle(false);
      setTimeOfDay('DAY');
      setGameState((p) => ({ ...p, currentSeason: 'SPRING' }));
      showToast(
        'Sfeerbeeld 2: Lente & Overdag (Volledig Ontwikkeld)',
        'Zonnepanelen, sedumdak met dakterras, kleurrijke school, groen sportveld, EV-laadpalen en bloesembomen!'
      );
    } else {
      showToast(
        'Live Simulatie-Modus',
        'Elke upgrade die je koopt of klusdag die je uitvoert verandert de buurt stap voor stap.'
      );
    }
  };

  // Synchroniseer WebAudio met mute-status, buurtbloei en dagdeel
  useEffect(() => {
    soundEngine.setMuted(soundMuted, neighborhoodBloom, timeOfDay);
  }, [soundMuted, neighborhoodBloom, timeOfDay]);

  useEffect(() => {
    if (soundMuted) return;
    const t = setInterval(() => {
      soundEngine.playAmbientStep(neighborhoodBloom, timeOfDay, currentWeather);
    }, 3200);
    return () => clearInterval(t);
  }, [soundMuted, neighborhoodBloom, timeOfDay, currentWeather]);

  // Bereken de wandelende bewoners op straat op basis van animPhase, tijdstip en weer
  const activeWalkers = useMemo(() => {
    const walkers = [];
    const resList = Object.values(gameState.residents);

    resList.forEach((res, idx) => {
      const routine = RESIDENT_ROUTINES[res.id] || {
        roleLabel: 'Wandeling door de buurt',
        badge: '🚶',
        waypoints: [
          { x: 3.5, y: 3.5, act: 'Maakt een praatje' },
          { x: 6.5, y: 3.5, act: 'Wandelt over de stoep' },
          { x: 6.5, y: 6.5, act: 'Kijkt rond in de straat' }
        ]
      };

      const pts = routine.waypoints;
      const homeRestWindow = timeOfDay === 'NIGHT' ? 2.6 : timeOfDay === 'DUSK' ? 1.8 : 1.2;
      const offsetPhase = animPhase * 0.7 + idx * 1.37;
      const cyclePos = offsetPhase % (pts.length + homeRestWindow);

      if (cyclePos >= pts.length) {
        return;
      }

      const segIndex = Math.floor(cyclePos);
      const nextIndex = (segIndex + 1) % pts.length;
      const frac = cyclePos - segIndex;

      const pA = pts[segIndex];
      const pB = pts[nextIndex];
      const gx = pA.x + (pB.x - pA.x) * frac;
      const gy = pA.y + (pB.y - pA.y) * frac;
      const hop = Math.abs(Math.sin(animPhase * 6 + idx * 2)) * 3.2;

      const weatherAct =
        currentWeather === 'RAIN'
          ? `☂️ ${pA.act}`
          : timeOfDay === 'DUSK' || timeOfDay === 'NIGHT'
          ? `🌙 Avondronde: ${pA.act}`
          : pA.act;

      walkers.push({
        resident: res,
        gx,
        gy,
        hop,
        badge: currentWeather === 'RAIN' ? '☂️' : routine.badge,
        activityText: weatherAct,
        roleLabel: routine.roleLabel
      });
    });

    return walkers.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  }, [gameState.residents, animPhase, timeOfDay, currentWeather]);

  // ==========================================================================
  // AFGELEIDE SELECTIES & ACTIE-HANDLERS VOOR DOSSIERS, UPGRADES & DECORATIES
  // ==========================================================================
  const selectedBuilding =
    gameState.buildings[selectedBuildingId] || gameState.buildings.b_flat;
  const selectedUnit = selectedUnitId ? gameState.units[selectedUnitId] : null;
  const selectedHousehold =
    selectedUnit && selectedUnit.occupiedByHouseholdId
      ? gameState.households[selectedUnit.occupiedByHouseholdId]
      : null;
  const selectedResident =
    gameState.residents[selectedResidentId] || Object.values(gameState.residents)[0];

  const selectedUnitValuation = useMemo(() => {
    if (!selectedUnit) return null;
    const bld = gameState.buildings[selectedUnit.buildingId];
    return computeUnitValuation(
      selectedUnit,
      bld,
      selectedHousehold,
      gameState.tiles,
      gameState.averagePositivity
    );
  }, [selectedUnit, selectedHousehold, gameState.buildings, gameState.tiles, gameState.averagePositivity]);

  const inflowCandidates = useMemo(() => {
    if (!selectedUnit || selectedUnit.occupiedByHouseholdId || !selectedUnit.isReadyForOccupation) {
      return [];
    }
    const bld = gameState.buildings[selectedUnit.buildingId];
    return computeInflowCandidates(selectedUnit, bld, gameState);
  }, [selectedUnit, gameState]);

  const readyVacantUnits = useMemo(() => {
    return Object.values(gameState.units).filter(
      (u) => u.isReadyForOccupation && !u.occupiedByHouseholdId
    );
  }, [gameState.units]);

  // Vrije Decoratie plaatsen of verwijderen op tegel (x, y)
  const handleTileDecorationClick = (tile) => {
    if (!selectedBrushId) return;
    const { x, y } = tile.pos;

    if (selectedBrushId === 'REMOVE') {
      if (!tile.decorationType) return;
      soundEngine.playInteractionChime('remove');
      setGameState((prev) => {
        const nextTiles = prev.tiles.map((t) =>
          t.pos.x === x && t.pos.y === y
            ? { ...t, decorationType: null, qualityScore: Math.max(-0.15, t.qualityScore - 0.16) }
            : t
        );
        const nextAmenities = prev.amenities.filter((a) => a.id !== `deco_${x}_${y}`);
        return { ...prev, tiles: nextTiles, amenities: nextAmenities };
      });
      showToast('Decoratie verwijderd', `Tegel (${x}, ${y}) is weer vrijgemaakt.`);
      return;
    }

    const decoItem = FREE_DECORATION_CATALOG.find((d) => d.id === selectedBrushId);
    if (!decoItem) return;

    if (tile.terrainType === 'WATER_CANAL') {
      showToast('Hier stroomt de gracht!', 'Kies een stoep-, straat-, plein- of grastegel.', 'warn');
      return;
    }

    if (payWithSK) {
      if (gameState.socialCapital < decoItem.costSK) {
        showToast('Te weinig Sociaal Kapitaal', `Je hebt ${decoItem.costSK} SK nodig.`, 'warn');
        return;
      }
    } else {
      if (gameState.budgetMoney < decoItem.costMoney) {
        showToast('Wijkbudget te laag', `Schakel over op betalen met Sociaal Kapitaal (SK)!`, 'warn');
        return;
      }
    }

    soundEngine.playInteractionChime('place');

    setGameState((prev) => {
      const nextTiles = prev.tiles.map((t) =>
        t.pos.x === x && t.pos.y === y
          ? {
              ...t,
              decorationType: decoItem.id,
              qualityScore: Number((t.qualityScore + decoItem.qualityBonus).toFixed(2))
            }
          : t
      );

      const newAmenity = {
        id: `deco_${x}_${y}`,
        name: decoItem.name,
        type: decoItem.amenityType,
        gridPos: { x, y },
        basePositivityValue: 2.2,
        seasonalWeights: {
          SPRING: 1.2,
          SUMMER: 1.3,
          AUTUMN: decoItem.id === 'FIRE_PIT' ? 1.5 : 0.9,
          WINTER: decoItem.id === 'FIRE_PIT' || decoItem.id === 'STREET_LAMP' ? 1.6 : 0.6
        },
        lifeStageAffinity: {
          BABY: 1.0,
          CHILD: decoItem.id === 'PLAY_HOPSCOTCH' ? 1.8 : 1.0,
          YOUTH: 1.1,
          ADULT: 1.1,
          SENIOR: decoItem.id === 'COZY_BENCH' ? 1.7 : 1.1
        }
      };

      const filteredAmenities = prev.amenities.filter((a) => a.id !== `deco_${x}_${y}`);

      return {
        ...prev,
        budgetMoney: payWithSK ? prev.budgetMoney : prev.budgetMoney - decoItem.costMoney,
        socialCapital: payWithSK
          ? Number((prev.socialCapital - decoItem.costSK).toFixed(1))
          : prev.socialCapital,
        tiles: nextTiles,
        amenities: [...filteredAmenities, newAmenity],
        eventLog: [
          {
            id: `ev_deco_${Date.now()}`,
            tick: prev.currentTick,
            type: 'DECO',
            text: `${decoItem.emoji} ${decoItem.name} geplaatst op (${x},${y})! De straat fleurt direct op.`
          },
          ...prev.eventLog
        ].slice(0, 12)
      };
    });

    showToast(
      `${decoItem.emoji} ${decoItem.name} geplaatst!`,
      `Lokale omgevingskwaliteit +${Math.round(decoItem.qualityBonus * 100)}% op tegel (${x}, ${y}).`
    );
  };

  // Installeer een Gebouw- of Kamer-Upgrade
  const handleInstallUpgrade = (buildingId, upgrade, unitId = null) => {
    if (gameState.budgetMoney < upgrade.costMoney) {
      showToast('Onvoldoende Wijkbudget (€)', 'Kies eerst een gratis Buurt-Klusdag op Sociaal Kapitaal!', 'warn');
      return;
    }
    if (gameState.socialCapital < upgrade.costSocialCapital) {
      showToast('Onvoldoende Sociaal Kapitaal (SK)', 'Laat de buurt een paar dagen draaien of koppel buren.', 'warn');
      return;
    }

    soundEngine.playInteractionChime('upgrade');

    setGameState((prev) => {
      const nextBuildings = { ...prev.buildings };
      const nextUnits = { ...prev.units };
      const nextHouseholds = { ...prev.households };
      let nextTiles = [...prev.tiles];
      const nextAmenities = [...prev.amenities];
      const nextMissions = prev.activeMissions.map((m) => ({ ...m }));

      const bld = { ...nextBuildings[buildingId] };

      if (unitId) {
        const u = { ...nextUnits[unitId] };
        u.upgrades = u.upgrades.map((up) =>
          up.id === upgrade.id ? { ...up, isInstalled: true } : up
        );
        u.comfortScore = Math.min(1, Number((u.comfortScore + (upgrade.comfortBonus || 0.12)).toFixed(2)));
        if (upgrade.unlocksVacantUnitId) {
          u.isReadyForOccupation = true;
        }
        nextUnits[unitId] = u;
      } else {
        bld.upgrades = bld.upgrades.map((up) =>
          up.id === upgrade.id ? { ...up, isInstalled: true } : up
        );
        bld.conditionMultiplier = Math.min(
          1.3,
          Number((bld.conditionMultiplier + 0.12).toFixed(2))
        );
        if (upgrade.seasonalInsulationBonus) bld.hasThermalInsulation = true;
        if (upgrade.enablesElevator) bld.hasElevator = true;

        bld.unitIds.forEach((uId) => {
          const u = { ...nextUnits[uId] };
          u.comfortScore = Math.min(1, Number((u.comfortScore + (upgrade.comfortBonus || 0.08)).toFixed(2)));
          if (upgrade.unlocksVacantUnitId === uId) {
            u.isReadyForOccupation = true;
          }
          if (upgrade.lowersMonthlyCostBy && u.occupiedByHouseholdId) {
            const hh = { ...nextHouseholds[u.occupiedByHouseholdId] };
            hh.monthlyHousingCost = Math.max(350, hh.monthlyHousingCost - upgrade.lowersMonthlyCostBy);
            u.currentMonthlyCost = hh.monthlyHousingCost;
            nextHouseholds[hh.id] = hh;
          }
          nextUnits[uId] = u;
        });

        if (upgrade.tileQualityDelta) {
          nextTiles = nextTiles.map((t) => {
            const inFootprint =
              t.pos.x >= bld.gridPos.x &&
              t.pos.x < bld.gridPos.x + bld.footprint.width &&
              t.pos.y >= bld.gridPos.y &&
              t.pos.y < bld.gridPos.y + bld.footprint.depth;
            return inFootprint
              ? { ...t, qualityScore: Number((t.qualityScore + upgrade.tileQualityDelta).toFixed(2)) }
              : t;
          });
        }

        if (upgrade.addsAmenityType) {
          nextAmenities.push({
            id: `am_${upgrade.id}`,
            name: upgrade.name,
            type: upgrade.addsAmenityType,
            gridPos: bld.gridPos,
            basePositivityValue: 5.5,
            seasonalWeights: {
              SPRING: 1.2,
              SUMMER: 1.4,
              AUTUMN: upgrade.addsAmenityType === 'COFFEE_KIOSK' ? 1.4 : 0.9,
              WINTER: upgrade.addsAmenityType === 'COFFEE_KIOSK' ? 1.6 : 0.5
            },
            lifeStageAffinity: { BABY: 1, CHILD: 1.3, YOUTH: 1.1, ADULT: 1.1, SENIOR: 1.4 }
          });
        }

        nextBuildings[buildingId] = bld;
      }

      // Check of hiermee Missie 1 (Zwaluwplein) is voltooid
      let bonusMoney = 0;
      let bonusSK = 0;
      nextMissions.forEach((m) => {
        if (!m.completed && m.targetUpgradeId === upgrade.id) {
          m.completed = true;
          m.status = 'COMPLETED';
          bonusMoney += m.rewardMoney;
          bonusSK += m.rewardSK;
        }
      });

      return {
        ...prev,
        budgetMoney: prev.budgetMoney - upgrade.costMoney + bonusMoney,
        socialCapital: Number((prev.socialCapital - upgrade.costSocialCapital + bonusSK).toFixed(1)),
        buildings: nextBuildings,
        units: nextUnits,
        households: nextHouseholds,
        tiles: nextTiles,
        amenities: nextAmenities,
        activeMissions: nextMissions,
        eventLog: [
          {
            id: `ev_up_${Date.now()}`,
            tick: prev.currentTick,
            type: 'UPGRADE',
            text: `Upgrade voltooid: ${upgrade.name}! ${bonusMoney > 0 ? `(Missie-beloning +€${bonusMoney} & +${bonusSK} SK!)` : ''}`
          },
          ...prev.eventLog
        ].slice(0, 12)
      };
    });

    showToast('Buurt-Upgrade Voltooid!', `${upgrade.name} zorgt voor meer kleur en woonplezier.`);
  };

  // Zet een woning om in een Buurtcoöperatie (beschermt tegen gentrificatie)
  const handleToggleCooperative = (unitId) => {
    if (gameState.socialCapital < 20) {
      showToast('20 SK nodig', 'Spaar nog even Sociaal Kapitaal voor deze Wooncoöperatie.', 'warn');
      return;
    }
    soundEngine.playInteractionChime('upgrade');
    setGameState((prev) => {
      const u = { ...prev.units[unitId] };
      u.isSocialCooperative = true;
      u.cappedSocialRent = Math.min(u.currentMonthlyCost, 610);
      u.currentMonthlyCost = u.cappedSocialRent;
      const nextHouseholds = { ...prev.households };
      if (u.occupiedByHouseholdId) {
        const hh = { ...nextHouseholds[u.occupiedByHouseholdId] };
        hh.monthlyHousingCost = u.cappedSocialRent;
        nextHouseholds[hh.id] = hh;
      }
      return {
        ...prev,
        socialCapital: Number((prev.socialCapital - 20).toFixed(1)),
        units: { ...prev.units, [unitId]: u },
        households: nextHouseholds
      };
    });
    showToast('Verankerd als Buurtcoöperatie!', 'De woonlasten zijn permanent betaalbaar gemaakt.');
  };

  // Interne Woningruil / Starters-Doorstroom met 100% behoud van buren
  const handleInternalMove = (residentId, targetUnitId) => {
    soundEngine.playInteractionChime('upgrade');
    setGameState((prev) => {
      const res = { ...prev.residents[residentId] };
      const targetUnit = { ...prev.units[targetUnitId] };
      const nextUnits = { ...prev.units };
      const nextHouseholds = { ...prev.households };
      const nextResidents = { ...prev.residents };
      const nextMissions = prev.activeMissions.map((m) => ({ ...m }));

      let bonusMoney = 0;
      let bonusSK = 0;

      if (res.isDependent) {
        // Starter (zoals Emre Yilmaz) splitst zich af uit ouderlijk huis naar eigen startersstudio!
        const oldHh = { ...nextHouseholds[res.householdId] };
        oldHh.memberIds = oldHh.memberIds.filter((id) => id !== residentId);
        nextHouseholds[oldHh.id] = oldHh;

        const newHhId = `hh_starter_${Date.now()}`;
        res.isDependent = false;
        res.ticksSearchingHome = 0;
        res.householdId = newHhId;
        res.unitId = targetUnitId;
        res.positivity = Math.min(100, res.positivity + 24);
        res.currentThoughtBubble = 'Geweldig! Mijn eigen startersstudio in mijn vertrouwde buurt!';

        nextHouseholds[newHhId] = {
          id: newHhId,
          familyName: `${res.firstName} ${res.lastName} (Starter)`,
          archetypeId: 'STARTER_SOLO_OR_COUPLE',
          unitId: targetUnitId,
          buildingId: targetUnit.buildingId,
          memberIds: [residentId],
          incomeBracket: 'LOW',
          monthlyIncome: 1950,
          monthlyHousingCost: targetUnit.currentMonthlyCost,
          purchasePrice: null,
          ticksLivedInNeighborhood: oldHh.ticksLivedInNeighborhood,
          neighborhoodAttachment: 0.85,
          averagePositivity: res.positivity,
          wantsInternalMoveToGroundFloor: false
        };

        targetUnit.occupiedByHouseholdId = newHhId;
        nextUnits[targetUnitId] = targetUnit;
        nextResidents[residentId] = res;

        nextMissions.forEach((m) => {
          if (!m.completed && m.targetStarterResidentId === residentId) {
            m.completed = true;
            m.status = 'COMPLETED';
            bonusMoney += m.rewardMoney;
            bonusSK += m.rewardSK;
          }
        });
      } else {
        // Senior (zoals Meneer Koos) verhuist intern van 2-hoog naar de begane grond!
        const hh = { ...nextHouseholds[res.householdId] };
        const oldUnit = { ...nextUnits[hh.unitId] };
        oldUnit.occupiedByHouseholdId = null;
        nextUnits[oldUnit.id] = oldUnit;

        hh.unitId = targetUnitId;
        hh.buildingId = targetUnit.buildingId;
        hh.wantsInternalMoveToGroundFloor = false;
        hh.averagePositivity = Math.min(100, hh.averagePositivity + 26);
        nextHouseholds[hh.id] = hh;

        res.unitId = targetUnitId;
        res.positivity = Math.min(100, res.positivity + 26);
        res.currentThoughtBubble = 'Wat een zegen! Gelijkvloers wonen én al mijn lieve buren om me heen!';
        nextResidents[residentId] = res;

        targetUnit.occupiedByHouseholdId = hh.id;
        nextUnits[targetUnitId] = targetUnit;

        nextMissions.forEach((m) => {
          if (!m.completed && m.targetInternalMoveResidentId === residentId) {
            m.completed = true;
            m.status = 'COMPLETED';
            bonusMoney += m.rewardMoney;
            bonusSK += m.rewardSK;
          }
        });
      }

      return {
        ...prev,
        budgetMoney: prev.budgetMoney + bonusMoney,
        socialCapital: Number((prev.socialCapital + bonusSK).toFixed(1)),
        units: nextUnits,
        households: nextHouseholds,
        residents: nextResidents,
        activeMissions: nextMissions
      };
    });

    setSelectedUnitId(targetUnitId);
    showToast('Gouden Doorstroom Voltooid!', '100% van het burennetwerk in de straat is behouden!');
  };

  // Verwelkom een nieuw huishouden via het Softmax Instroom-algoritme
  const handleWelcomeNewHousehold = (unitId, archetype) => {
    soundEngine.playInteractionChime('upgrade');
    setGameState((prev) => {
      const unit = { ...prev.units[unitId] };
      const newHhId = `hh_new_${Date.now()}`;
      const newMemberIds = [];
      const nextResidents = { ...prev.residents };
      const colors = ['#e07a5f', '#2a9d8f', '#e9c46a', '#f4a261', '#81b29a'];

      archetype.sampleFamily.members.forEach((m, idx) => {
        const rId = `res_new_${Date.now()}_${idx}`;
        newMemberIds.push(rId);
        nextResidents[rId] = {
          id: rId,
          firstName: m.firstName,
          lastName: archetype.sampleFamily.familyName,
          avatarColor: colors[idx % colors.length],
          householdId: newHhId,
          unitId,
          lifeStage: m.lifeStage,
          totalAgeTicks: 220,
          ticksInCurrentStage: 30,
          isDependent: m.lifeStage === 'CHILD' || m.lifeStage === 'BABY',
          ticksSearchingHome: 0,
          traits: m.traits,
          bioText: m.bioText,
          currentThoughtBubble: 'Wat een warme ontvangst in onze nieuwe buurt!',
          positivity: 68,
          positivityBreakdown: {
            housingAndAffordability: 25,
            environmentAndSeason: 14,
            socialRelationships: 17,
            lifeStageNeeds: 12,
            totalTarget: 68
          },
          dailySocialCapitalOutput: 0.35
        };
      });

      const newHh = {
        id: newHhId,
        familyName: archetype.sampleFamily.familyName,
        archetypeId: archetype.id,
        unitId,
        buildingId: unit.buildingId,
        memberIds: newMemberIds,
        incomeBracket: archetype.incomeBracket,
        monthlyIncome: archetype.monthlyIncome,
        monthlyHousingCost: unit.currentMonthlyCost,
        purchasePrice: unit.tenure === 'OWNER_OCCUPIED' ? unit.currentMarketValue : null,
        ticksLivedInNeighborhood: 1,
        neighborhoodAttachment: 0.45,
        averagePositivity: 68,
        wantsInternalMoveToGroundFloor: false
      };

      unit.occupiedByHouseholdId = newHhId;

      return {
        ...prev,
        units: { ...prev.units, [unitId]: unit },
        households: { ...prev.households, [newHhId]: newHh },
        residents: nextResidents
      };
    });

    showToast(
      `Welkom familie ${archetype.sampleFamily.familyName}!`,
      'Er zijn nieuwe buren in de straat komen wonen.'
    );
  };

  // Koppel buren voor een koffiemoment of los portiek-frictie op
  const handleBoostRelationship = (relId) => {
    if (gameState.socialCapital < 8) {
      showToast('8 SK nodig', 'Even wachten tot er genoeg Sociaal Kapitaal is.', 'warn');
      return;
    }
    soundEngine.playInteractionChime('place');
    setGameState((prev) => {
      const rel = { ...prev.relationships[relId] };
      const wasFriction = rel.type === 'FRICTION';
      rel.type = wasFriction ? 'GOOD_NEIGHBOR' : 'CLOSE_FRIEND';
      rel.strength = Math.min(100, rel.strength + 32);
      rel.sharedMemories = [
        wasFriction
          ? 'Goed gesprek met verse koffie in het portiek: alle irritatie uit de lucht!'
          : 'Gezellig bijgepraat op het buurtbankje',
        ...rel.sharedMemories
      ];

      const nextMissions = prev.activeMissions.map((m) => ({ ...m }));
      let bonusMoney = 0;
      let bonusSK = 0;
      nextMissions.forEach((m) => {
        if (!m.completed && m.targetRelationshipId === relId) {
          m.completed = true;
          m.status = 'COMPLETED';
          bonusMoney += m.rewardMoney;
          bonusSK += m.rewardSK;
        }
      });

      return {
        ...prev,
        budgetMoney: prev.budgetMoney + bonusMoney,
        socialCapital: Number((prev.socialCapital - 8 + bonusSK).toFixed(1)),
        relationships: { ...prev.relationships, [relId]: rel },
        activeMissions: nextMissions
      };
    });
    showToast('Buren Verbonden! ☕', 'Een goed gesprek bij de koffie versterkt het buurtnetwerk.');
  };

  // ==========================================================================
  // SIMULATIE TICK-ENGINE (1 Tick = 1 Dag, 12 Dagen = 1 Seizoen)
  // ==========================================================================
  const stepSimulationDay = useCallback(() => {
    setGameState((prev) => {
      const nextTick = prev.currentTick + 1;
      const seasonIndex = Math.floor(((nextTick - 1) / 12) % 4);
      const nextSeason = SEASONS[seasonIndex];
      const isNewSeason = nextTick > 1 && (nextTick - 1) % 12 === 0;
      const nextYear = 1 + Math.floor((nextTick - 1) / 48);

      // kopieer collecties
      const updatedResidents = { ...prev.residents };
      const updatedHouseholds = { ...prev.households };
      const updatedUnits = { ...prev.units };
      const relationshipsList = Object.values(prev.relationships);
      const amenitiesList = prev.amenities;

      let totalDailySK = 0;
      let positivitySum = 0;
      let residentCount = 0;

      // 1. Update elke bewoner (Loop 2 & Loop 3)
      for (const resId of Object.keys(updatedResidents)) {
        const res = { ...updatedResidents[resId] };
        const hh = updatedHouseholds[res.householdId];
        const unit = updatedUnits[res.unitId];
        const bld = prev.buildings[unit.buildingId];

        res.totalAgeTicks += 1;
        res.ticksInCurrentStage += 1;

        // Starter zoek-teller voor thuiswonende jongeren
        if (res.lifeStage === 'YOUTH' && res.isDependent) {
          res.ticksSearchingHome += 1;
          res.currentThoughtBubble = `Zoekt een eigen startersplek in de buurt (${res.ticksSearchingHome} dgn)...`;
        }

        const posResult = computeResidentPositivity(
          res,
          hh,
          unit,
          bld,
          relationshipsList,
          amenitiesList,
          nextSeason
        );

        res.positivity = posResult.newPositivity;
        res.positivityBreakdown = posResult.breakdown;
        res.dailySocialCapitalOutput = posResult.socialCapitalContribution;

        totalDailySK += posResult.socialCapitalContribution;
        positivitySum += res.positivity;
        residentCount += 1;
        updatedResidents[resId] = res;
      }

      const nextAvgPositivity =
        residentCount > 0 ? Number((positivitySum / residentCount).toFixed(1)) : 50;
      const divMultiplier = computeDiversityMultiplier(updatedHouseholds, updatedResidents);
      const addedSK = Number((totalDailySK * divMultiplier).toFixed(1));

      // 2. Update Huishoudens & Woningwaarden (Loop 1)
      for (const hhId of Object.keys(updatedHouseholds)) {
        const hh = { ...updatedHouseholds[hhId] };
        hh.ticksLivedInNeighborhood += 1;
        // Wijkbinding groeit zachtjes mee met woonduur en positiviteit
        hh.neighborhoodAttachment = Math.min(
          0.98,
          Number((hh.neighborhoodAttachment + 0.002).toFixed(3))
        );
        const members = hh.memberIds
          .map((id) => updatedResidents[id])
          .filter(Boolean);
        if (members.length > 0) {
          hh.averagePositivity = Number(
            (
              members.reduce((s, m) => s + m.positivity, 0) / members.length
            ).toFixed(1)
          );
        }
        updatedHouseholds[hhId] = hh;
      }

      for (const uId of Object.keys(updatedUnits)) {
        const u = { ...updatedUnits[uId] };
        const bld = prev.buildings[u.buildingId];
        const hh = u.occupiedByHouseholdId
          ? updatedHouseholds[u.occupiedByHouseholdId]
          : null;
        const valResult = computeUnitValuation(
          u,
          bld,
          hh,
          prev.tiles,
          nextAvgPositivity
        );
        u.currentMarketValue = valResult.actualValue;
        updatedUnits[uId] = u;
      }

      // 3. Seizoens-basisbudget (Edge-case vangnet uit Sectie 1.1)
      let seasonalIncome = 0;
      const newLogs = [...prev.eventLog];
      if (isNewSeason) {
        // Basisbijdrage + bescheiden buurtbijdrage uit bewoonde eenheden
        const occupiedCount = Object.values(updatedUnits).filter(
          (u) => u.occupiedByHouseholdId
        ).length;
        seasonalIncome = 220 + occupiedCount * 25;
        newLogs.unshift({
          id: `ev_${nextTick}`,
          tick: nextTick,
          type: 'SEASON',
          text: `Nieuw seizoen: ${SEASON_META[nextSeason].label} (Jaar ${nextYear})! Gemeentelijke wijkbijdrage ontvangen: +€ ${seasonalIncome}.`
        });
      }

      return {
        ...prev,
        currentTick: nextTick,
        currentSeason: nextSeason,
        currentYear: nextYear,
        budgetMoney: prev.budgetMoney + seasonalIncome,
        socialCapital: Number((prev.socialCapital + addedSK).toFixed(1)),
        averagePositivity: nextAvgPositivity,
        diversityMultiplier: divMultiplier,
        residents: updatedResidents,
        households: updatedHouseholds,
        units: updatedUnits,
        eventLog: newLogs.slice(0, 12)
      };
    });
  }, []);

  useEffect(() => {
    if (gameState.simulationSpeed === 0) return;
    const intervalMs =
      gameState.simulationSpeed === 1
        ? 3800
        : gameState.simulationSpeed === 2
        ? 1800
        : 900;
    const timer = setInterval(stepSimulationDay, intervalMs);
    return () => clearInterval(timer);
  }, [gameState.simulationSpeed, stepSimulationDay]);

  // ==========================================================================
  // ISOMETRISCHE 3D ARCHITECTUUR HULPFUNCTIES (MONUMENT VALLEY EXTRUSIE)
  // ==========================================================================
  const TILE_W = 66;
  const TILE_H = 34;
  const ORIGIN_X = 450;
  const ORIGIN_Y = 148;

  const isoToScreen = (gx, gy, gz = 0) => {
    const sx = ORIGIN_X + (gx - gy) * (TILE_W / 2);
    const sy = ORIGIN_Y + (gx + gy) * (TILE_H / 2) - gz;
    return { x: sx, y: sy };
  };

  const getTilePolygonPoints = (gx, gy, w = 1, d = 1, elevation = 0) => {
    const p1 = isoToScreen(gx, gy, elevation);
    const p2 = isoToScreen(gx + w, gy, elevation);
    const p3 = isoToScreen(gx + w, gy + d, elevation);
    const p4 = isoToScreen(gx, gy + d, elevation);
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  };

  // Tekent een 3D Monument-Valley-stijl Isometrisch Blok (Boven-, Linker- en Rechtervlak met belichting)
  const renderIsoPrism = (gx, gy, w, d, zBottom, zTop, topColor, leftColor, rightColor, strokeColor = 'rgba(28,25,23,0.35)', strokeWidth = 0.9) => {
    const tNW = isoToScreen(gx, gy, zTop);
    const tNE = isoToScreen(gx + w, gy, zTop);
    const tSE = isoToScreen(gx + w, gy + d, zTop);
    const tSW = isoToScreen(gx, gy + d, zTop);

    const bNE = isoToScreen(gx + w, gy, zBottom);
    const bSE = isoToScreen(gx + w, gy + d, zBottom);
    const bSW = isoToScreen(gx, gy + d, zBottom);

    return (
      <g>
        {/* Linker voorvlak (Zuidwest-zijde: vangt warm zijlicht) */}
        <polygon
          points={`${tSW.x},${tSW.y} ${tSE.x},${tSE.y} ${bSE.x},${bSE.y} ${bSW.x},${bSW.y}`}
          fill={leftColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Rechter voorvlak (Zuidoost-zijde: diepe architecturale schaduw) */}
        <polygon
          points={`${tSE.x},${tSE.y} ${tNE.x},${tNE.y} ${bNE.x},${bNE.y} ${bSE.x},${bSE.y}`}
          fill={rightColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Bovenvlak (Zonbeschenen dak/terras) */}
        <polygon
          points={`${tNW.x},${tNW.y} ${tNE.x},${tNE.y} ${tSE.x},${tSE.y} ${tSW.x},${tSW.y}`}
          fill={topColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Tekent een schuin zadeldak in 3D isometrisch perspectief
  const renderPitchedRoof = (gx, gy, w, d, zBase, zPeak, roofFrontColor, roofSideColor, gableColor) => {
    const bNW = isoToScreen(gx - 0.05, gy - 0.05, zBase);
    const bNE = isoToScreen(gx + w + 0.05, gy - 0.05, zBase);
    const bSE = isoToScreen(gx + w + 0.05, gy + d + 0.05, zBase);
    const bSW = isoToScreen(gx - 0.05, gy + d + 0.05, zBase);

    // Nok loopt van Noord naar Zuid midden over het huisje
    const rN = isoToScreen(gx + w / 2, gy - 0.02, zPeak);
    const rS = isoToScreen(gx + w / 2, gy + d + 0.02, zPeak);

    return (
      <g>
        {/* Linker dakvlak */}
        <polygon
          points={`${bNW.x},${bNW.y} ${rN.x},${rN.y} ${rS.x},${rS.y} ${bSW.x},${bSW.y}`}
          fill={roofFrontColor}
          stroke="rgba(28,25,23,0.4)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Rechter dakvlak (in schaduw) */}
        <polygon
          points={`${rN.x},${rN.y} ${bNE.x},${bNE.y} ${bSE.x},${bSE.y} ${rS.x},${rS.y}`}
          fill={roofSideColor}
          stroke="rgba(28,25,23,0.4)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Zuidwest-geveltop driehoek */}
        <polygon
          points={`${bSW.x},${bSW.y} ${rS.x},${rS.y} ${bSE.x},${bSE.y}`}
          fill={gableColor}
          stroke="rgba(28,25,23,0.4)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Pan & Zoom handlers (werkt met zowel Muis als Touch)
  const handlePointerDown = (e) => {
    if (e.target.closest('[data-interactive="true"]')) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - camera.x, y: e.clientY - camera.y };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    setCamera((prev) => ({
      ...prev,
      x: Math.max(-280, Math.min(280, e.clientX - dragStartRef.current.x)),
      y: Math.max(-200, Math.min(200, e.clientY - dragStartRef.current.y))
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const seasonInfo = SEASON_META[gameState.currentSeason];
  const SeasonIcon = seasonInfo.icon;
  const completedMissionsCount = gameState.activeMissions.filter((m) => m.completed).length;
  const todMeta = TIME_OF_DAY_META[timeOfDay];

  // Dynamische achtergrond-gradient: combineert Oostblok->Bloei met Ochtend/Middag/Schemer/Nacht!
  const dynamicSkyStyle = {
    background: `linear-gradient(165deg, ${lerpColor(
      todMeta.skyBleakTop,
      todMeta.skyCozyTop,
      neighborhoodBloom
    )} 0%, ${lerpColor(
      todMeta.skyBleakMid,
      todMeta.skyCozyMid,
      neighborhoodBloom
    )} 52%, ${lerpColor(
      todMeta.skyBleakBot,
      todMeta.skyCozyBot,
      neighborhoodBloom
    )} 100%)`
  };

  return (
    <div className="flex flex-col h-screen w-full bg-stone-900 text-stone-800 font-sans overflow-hidden select-none">
      {/* ====================================================================
          TOP HUD BAR: RESOURCES, BLOEI-METER, SEIZOEN, DAG/NACHT & AUDIO
      ==================================================================== */}
      <header className="z-20 bg-amber-50/95 backdrop-blur border-b-2 border-amber-900/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        {/* Titel & Sfeer-transformatie balk */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-amber-50 shadow-inner">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight">
                De Florerende Buurt
              </h1>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  backgroundColor: lerpColor('#cbd5e1', '#fde68a', neighborhoodBloom),
                  color: '#1c1917',
                  borderColor: lerpColor('#64748b', '#f59e0b', neighborhoodBloom)
                }}
              >
                {neighborhoodBloom < 0.25
                  ? 'Grauw Oostblok-Blok'
                  : neighborhoodBloom < 0.6
                  ? 'Ontwakende Buurt'
                  : 'Florerend Monument'}{' '}
                ({Math.round(neighborhoodBloom * 100)}% Bloei)
              </span>
            </div>
            <p className="text-[11px] text-stone-600 hidden sm:block">
              Monument Valley 2.5D Diorama • Dag/Nacht, Seizoensweer & Vrije Inrichting
            </p>
          </div>
        </div>

        {/* Kern-Resources: Wijkbudget (€), Sociaal Kapitaal (SK), Positiviteit, Dag/Nacht & Geluid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wijkbudget */}
          <div
            className="flex items-center gap-1.5 bg-white border border-stone-300/90 px-2.5 py-1 rounded-xl shadow-2xs"
            title="Wijkbudget in Euro's (groeit elk seizoen en via buurt-missies)"
          >
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold leading-none">
                Wijkbudget
              </div>
              <div className="text-xs sm:text-sm font-bold text-stone-900">
                € {gameState.budgetMoney.toLocaleString('nl-NL')}
              </div>
            </div>
          </div>

          {/* Sociaal Kapitaal (SK) */}
          <div
            className="flex items-center gap-1.5 bg-white border border-stone-300/90 px-2.5 py-1 rounded-xl shadow-2xs"
            title="Sociaal Kapitaal (SK): betaalmiddel voor gratis Buurt-Klusdagen, decoraties en coöperaties!"
          >
            <HandHeart className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold leading-none">
                Sociaal Kapitaal
              </div>
              <div className="text-xs sm:text-sm font-bold text-rose-800">
                {gameState.socialCapital} <span className="text-[11px] font-normal">SK</span>
              </div>
            </div>
          </div>

          {/* Gemiddelde Buurt-Positiviteit */}
          <div
            className="flex items-center gap-1.5 bg-white border border-stone-300/90 px-2.5 py-1 rounded-xl shadow-2xs"
            title="Gemiddelde Positiviteit (boven 45% genereren bewoners dagelijks Sociaal Kapitaal)"
          >
            <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold leading-none">
                Positiviteit
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-1">
                {gameState.averagePositivity}%
                <span className="text-[10px] px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded font-semibold">
                  ×{gameState.diversityMultiplier}
                </span>
              </div>
            </div>
          </div>

          {/* Snelkoppeling-balk linksboven op het canvas + Referentie-Sfeer Switcher */}
          <div
            data-interactive="true"
            className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[92%]"
          >
            {/* Snel-vergelijker voor de 2 referentie-afbeeldingen */}
            <div className="flex items-center bg-stone-900/95 p-0.5 rounded-xl border border-stone-700 shadow-md">
              <button
                onClick={() => applyReferencePreset('WINTER_BLEAK')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  visualPreset === 'WINTER_BLEAK'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Bekijk exact de onontwikkelde Winter-Schemering staat (Referentie-afbeelding 1)"
              >
                ❄️ Winter Schemer (0%)
              </button>
              <button
                onClick={() => applyReferencePreset('SIMULATION')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  visualPreset === 'SIMULATION'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Speel de normale simulatie waarin jouw upgrades het beeld stap voor stap opbouwen"
              >
                🎮 Live Spel ({Math.round(neighborhoodBloom * 100)}%)
              </button>
              <button
                onClick={() => applyReferencePreset('SPRING_BLOOM')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  visualPreset === 'SPRING_BLOOM'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Bekijk exact de volledig ontwikkelde Lente-Overdag staat (Referentie-afbeelding 2)"
              >
                🌸 Lente Bloei (100%)
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedBrushId(null);
                setSelectedBuildingId('b_flat');
                setSelectedUnitId('u_f2l');
                setSelectedResidentId('res_koos');
                setActiveRightTab('BUILDING');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition flex items-center gap-1 ${
                selectedBuildingId === 'b_flat' && !selectedBrushId
                  ? 'bg-amber-700 text-white border-amber-800'
                  : 'bg-white/90 text-stone-800 border-stone-300 hover:bg-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Portiekflat "De Zwaluw"
            </button>
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setSelectedBuildingId('b_square');
                setSelectedUnitId(null);
                setActiveRightTab('BUILDING');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition flex items-center gap-1 ${
                selectedBuildingId === 'b_square' && !selectedBrushId
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white/90 text-stone-800 border-stone-300 hover:bg-white'
              }`}
            >
              <TreePine className="w-3.5 h-3.5" />
              School & Speelplein
            </button>
            <button
              onClick={() => {
                setActiveRightTab('DECORATE');
                if (!selectedBrushId) setSelectedBrushId('TREE_BLOSSOM');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition flex items-center gap-1 ${
                activeRightTab === 'DECORATE' || selectedBrushId
                  ? 'bg-fuchsia-700 text-white border-fuchsia-900 ring-2 ring-fuchsia-300'
                  : 'bg-white/90 text-fuchsia-900 border-fuchsia-300 hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              🎨 Vrije Inrichting
            </button>
          </div>

          {/* WebAudio Sfeergeluid Knop */}
          <button
            onClick={() => setSoundMuted((m) => !m)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
              !soundMuted
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
            title="Schakel sfeergeluid (Oostblok-wind -> Vogels & Akkoorden) in of uit"
          >
            <span>{!soundMuted ? '🔊 Geluid AAN' : '🔇 Geluid UIT'}</span>
          </button>

          {/* Opengewerkte Gevel (Cutaway) Toggle */}
          <button
            onClick={() => setGlobalCutaway((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition shadow-2xs ${
              globalCutaway
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
            }`}
            title="Klap de voorgevel van Portiekflat De Zwaluw open of dicht"
          >
            {globalCutaway ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden xl:inline">
              {globalCutaway ? 'Cutaway: OPEN' : 'Cutaway: DICHT'}
            </span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          HOOFDSCHERM: LINKS MONUMENT VALLEY DIORAMA, RECHTS DATA-DOSSIERS
      ==================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ------------------------------------------------------------------
            LINKERPANEEL: MONUMENT VALLEY 2.5D ISOMETRISCH BUURT-CANVAS
        ------------------------------------------------------------------ */}
        <div
          style={dynamicSkyStyle}
          className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing transition-colors duration-700"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Toast Notificatie */}
          {toastMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-stone-900/95 text-amber-50 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-400/40 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-200">{toastMessage.title}</div>
                <div className="text-stone-300 mt-0.5">{toastMessage.subtitle}</div>
              </div>
            </div>
          )}

          {/* Snelkoppeling-balk linksboven op het canvas + Vrije Aankleding & Weer */}
          <div
            data-interactive="true"
            className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[88%]"
          >
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setSelectedBuildingId('b_flat');
                setSelectedUnitId('u_f2l');
                setSelectedResidentId('res_koos');
                setActiveRightTab('BUILDING');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition flex items-center gap-1 ${
                selectedBuildingId === 'b_flat' && !selectedBrushId
                  ? 'bg-amber-700 text-white border-amber-800'
                  : 'bg-white/90 text-stone-800 border-stone-300 hover:bg-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Portiekflat "De Zwaluw"
            </button>
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setSelectedBuildingId('b_square');
                setSelectedUnitId(null);
                setActiveRightTab('BUILDING');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition flex items-center gap-1 ${
                selectedBuildingId === 'b_square' && !selectedBrushId
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white/90 text-stone-800 border-stone-300 hover:bg-white'
              }`}
            >
              <TreePine className="w-3.5 h-3.5" />
              Het Zwaluwplein
            </button>
            <button
              onClick={() => {
                setActiveRightTab('DECORATE');
                if (!selectedBrushId) setSelectedBrushId('TREE_BLOSSOM');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition flex items-center gap-1 ${
                activeRightTab === 'DECORATE' || selectedBrushId
                  ? 'bg-fuchsia-700 text-white border-fuchsia-900 ring-2 ring-fuchsia-300'
                  : 'bg-white/90 text-fuchsia-900 border-fuchsia-300 hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              🎨 Vrije Buurt-Inrichting {selectedBrushId ? '(ACTIEF)' : ''}
            </button>
            <button
              onClick={() => {
                const order = ['AUTO', 'CLEAR', 'BLOSSOM', 'RAIN', 'LEAVES', 'SNOW'];
                setWeatherOverride((w) => order[(order.indexOf(w) + 1) % order.length]);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/90 text-stone-800 border border-stone-300 hover:bg-white shadow-2xs"
              title="Klik om het weertype te wisselen (of op Automatisch per seizoen te zetten)"
            >
              {WEATHER_META[currentWeather]?.badge}{' '}
              {weatherOverride === 'AUTO' ? '(Seizoensweer)' : '(Handmatig)'}
            </button>
          </div>

          {/* Zwevende Vrije-Keuze Kwast-balk als de speler aan het decoreren is */}
          {selectedBrushId && (
            <div
              data-interactive="true"
              className="absolute top-14 left-3 z-20 bg-stone-900/95 text-amber-50 px-3 py-2 rounded-2xl border border-fuchsia-400/50 shadow-lg flex flex-wrap items-center gap-1.5 max-w-[92%]"
            >
              <span className="text-[11px] font-bold text-fuchsia-300 mr-1">
                Klik op een tegel om te plaatsen:
              </span>
              {FREE_DECORATION_CATALOG.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBrushId(item.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                    selectedBrushId === item.id
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {item.emoji} {item.name.split(' ')[1] || item.name} (
                  {payWithSK ? `${item.costSK} SK` : `€${item.costMoney}`})
                </button>
              ))}
              <button
                onClick={() => setSelectedBrushId('REMOVE')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  selectedBrushId === 'REMOVE'
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                🗑️ Gum
              </button>
              <button
                onClick={() => setSelectedBrushId(null)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-stone-700 hover:bg-stone-600 text-amber-200 ml-1"
              >
                ✕ Klaar
              </button>
            </div>
          )}

          {/* Camera Zoom & Reset Controls rechtsonder op het canvas */}
          <div
            data-interactive="true"
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-xl border border-stone-300 shadow-sm"
          >
            <button
              onClick={() =>
                setCamera((c) => ({ ...c, zoom: Math.min(1.5, Number((c.zoom + 0.12).toFixed(2))) }))
              }
              className="p-1 hover:bg-stone-200 rounded text-stone-700"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold px-1 text-stone-600">
              {Math.round(camera.zoom * 100)}%
            </span>
            <button
              onClick={() =>
                setCamera((c) => ({ ...c, zoom: Math.max(0.7, Number((c.zoom - 0.12).toFixed(2))) }))
              }
              className="p-1 hover:bg-stone-200 rounded text-stone-700"
              title="Zoom uit"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCamera({ x: 0, y: 18, zoom: 1.04 })}
              className="p-1 hover:bg-stone-200 rounded text-stone-700"
              title="Centreer camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* ================================================================
              HET 2.5D LIGNE-CLAIRE BUURT-DIORAMA (EXACT NAAR DE 2 REFERENTIEBEELDEN)
          ================================================================ */}
          <svg
            viewBox="0 0 960 620"
            className="w-full h-full"
            style={{
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              transformOrigin: 'center center',
              transition: isDraggingRef.current ? 'none' : 'transform 160ms ease-out'
            }}
          >
            <defs>
              <filter id="mvShadow" x="-20%" y="-20%" width="140%" height="145%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.38" />
              </filter>
              <filter id="buildingShadow" x="-15%" y="-15%" width="135%" height="140%">
                <feDropShadow
                  dx="-5"
                  dy="6"
                  stdDeviation="2.5"
                  floodColor={timeOfDay === 'DUSK' || timeOfDay === 'NIGHT' ? '#090d16' : '#1e293b'}
                  floodOpacity="0.32"
                />
              </filter>
              <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.40" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="headlightGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#fde047" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="taillightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#dc2626" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="solarPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {(() => {
              // Globale visuele vlaggen op basis van de simulatie óf de referentie-preset
              const isSnow =
                visualPreset === 'WINTER_BLEAK' ||
                (visualPreset === 'SIMULATION' &&
                  (gameState.currentSeason === 'WINTER' || currentWeather === 'SNOW'));
              const isNightOrDusk =
                visualPreset === 'WINTER_BLEAK' ||
                (visualPreset !== 'SPRING_BLOOM' &&
                  (timeOfDay === 'DUSK' || timeOfDay === 'NIGHT'));
              const forceFullBloom = visualPreset === 'SPRING_BLOOM';
              const forceZeroBloom = visualPreset === 'WINTER_BLEAK';

              const hasUpgradeOrBloom = (bldId, upId) => {
                if (forceFullBloom) return true;
                if (forceZeroBloom) return false;
                return Boolean(
                  gameState.buildings[bldId]?.upgrades.find((u) => u.id === upId)?.isInstalled
                );
              };

              // Hulpfuncties voor Ligne-Claire 2.5D tekenstijl (zwarte outlines, ramen, zonnepanelen, bomen)
              const INK = '#18181b';

              // Teken een isometrisch raam op het linker voorvlak (SW) of rechter zijvlak (SE)
              const renderIsoWindow = (gx, gy, zBase, wSpan, hSpan, plane = 'SW', isLit = false, hasFlowerBox = false) => {
                const p1 =
                  plane === 'SW'
                    ? isoToScreen(gx, gy, zBase + hSpan)
                    : isoToScreen(gx, gy, zBase + hSpan);
                const p2 =
                  plane === 'SW'
                    ? isoToScreen(gx + wSpan, gy, zBase + hSpan)
                    : isoToScreen(gx, gy - wSpan, zBase + hSpan);
                const p3 =
                  plane === 'SW'
                    ? isoToScreen(gx + wSpan, gy, zBase)
                    : isoToScreen(gx, gy - wSpan, zBase);
                const p4 = isoToScreen(gx, gy, zBase);

                const winFill = isLit
                  ? '#fde047'
                  : isSnow
                  ? '#475569'
                  : '#7dd3fc';

                return (
                  <g>
                    {isLit && (
                      <polygon
                        points={`${p1.x - 2},${p1.y - 2} ${p2.x + 2},${p2.y - 2} ${p3.x + 4},${p3.y + 5} ${p4.x - 4},${p4.y + 5}`}
                        fill="url(#windowGlow)"
                        opacity="0.55"
                      />
                    )}
                    <polygon
                      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                      fill={winFill}
                      stroke={INK}
                      strokeWidth="1.1"
                      strokeLinejoin="round"
                    />
                    {/* Raamkozijn-kruis */}
                    <line
                      x1={(p1.x + p2.x) / 2}
                      y1={(p1.y + p2.y) / 2}
                      x2={(p4.x + p3.x) / 2}
                      y2={(p4.y + p3.y) / 2}
                      stroke={INK}
                      strokeWidth="0.8"
                    />
                    {/* Optionele fleurige balkon-/bloembak onder het raam */}
                    {hasFlowerBox && !isSnow && (
                      <g>
                        <polygon
                          points={`${p4.x - 1},${p4.y - 2} ${p3.x + 1},${p3.y - 2} ${p3.x + 1},${p3.y + 3} ${p4.x - 1},${p4.y + 3}`}
                          fill="#15803d"
                          stroke={INK}
                          strokeWidth="0.9"
                        />
                        <circle cx={(p4.x + p3.x) / 2 - 3} cy={(p4.y + p3.y) / 2 - 2} r="2.2" fill="#f43f5e" />
                        <circle cx={(p4.x + p3.x) / 2 + 3} cy={(p4.y + p3.y) / 2 - 1} r="2.2" fill="#facc15" />
                      </g>
                    )}
                  </g>
                );
              };

              // Teken een zonnepaneel op een plat dak of schuin dak
              const renderSolarPanelOnRoof = (gx, gy, w, d, zElev) => {
                const p1 = isoToScreen(gx, gy, zElev);
                const p2 = isoToScreen(gx + w, gy, zElev);
                const p3 = isoToScreen(gx + w, gy + d, zElev - 2);
                const p4 = isoToScreen(gx, gy + d, zElev - 2);
                return (
                  <g>
                    <polygon
                      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                      fill="url(#solarPanelGrad)"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <line
                      x1={(p1.x + p4.x) / 2}
                      y1={(p1.y + p4.y) / 2}
                      x2={(p2.x + p3.x) / 2}
                      y2={(p2.y + p3.y) / 2}
                      stroke="#93c5fd"
                      strokeWidth="0.6"
                    />
                    <line
                      x1={(p1.x + p2.x) / 2}
                      y1={(p1.y + p2.y) / 2}
                      x2={(p4.x + p3.x) / 2}
                      y2={(p4.y + p3.y) / 2}
                      stroke="#93c5fd"
                      strokeWidth="0.6"
                    />
                  </g>
                );
              };

              // Teken een Ligne-Claire Boom (Loofboom, Bloesemboom of Besneeuwde Spar)
              const renderIllustratedTree = (gx, gy, kind = 'GREEN', scale = 1) => {
                const pt = isoToScreen(gx, gy, 0);
                if (kind === 'PINE') {
                  const topFill = isSnow ? '#e2e8f0' : '#65a30d';
                  const shadeFill = isSnow ? '#94a3b8' : '#3f6212';
                  return (
                    <g transform={`translate(${pt.x}, ${pt.y}) scale(${scale})`}>
                      <ellipse cx="0" cy="2" rx="14" ry="7" fill="#0f172a" opacity="0.28" />
                      <rect x="-3" y="-8" width="6" height="9" fill="#5c4033" stroke={INK} strokeWidth="1.2" />
                      <path
                        d="M -16 -6 Q 0 -2 16 -6 L 10 -20 Q 0 -17 -10 -20 Z"
                        fill={shadeFill}
                        stroke={INK}
                        strokeWidth="1.3"
                      />
                      <path
                        d="M -13 -16 Q 0 -12 13 -16 L 8 -30 Q 0 -27 -8 -30 Z"
                        fill={topFill}
                        stroke={INK}
                        strokeWidth="1.3"
                      />
                      <path
                        d="M -9 -26 Q 0 -23 9 -26 L 0 -40 Z"
                        fill={topFill}
                        stroke={INK}
                        strokeWidth="1.3"
                      />
                    </g>
                  );
                }

                // Bloesemboom of Loofboom
                const crownMain = isSnow
                  ? '#cbd5e1'
                  : kind === 'BLOSSOM'
                  ? '#f9a8d4'
                  : '#84cc16';
                const crownHighlight = isSnow
                  ? '#f8fafc'
                  : kind === 'BLOSSOM'
                  ? '#fbcfe8'
                  : '#a3e635';
                const crownShadow = isSnow
                  ? '#64748b'
                  : kind === 'BLOSSOM'
                  ? '#ec4899'
                  : '#4d7c0f';

                return (
                  <g transform={`translate(${pt.x}, ${pt.y}) scale(${scale})`}>
                    <ellipse cx="0" cy="2" rx="13" ry="6.5" fill="#0f172a" opacity="0.25" />
                    <path
                      d="M -2.5 0 L -2 -16 L 2 -16 L 2.5 0 Z"
                      fill="#78350f"
                      stroke={INK}
                      strokeWidth="1.2"
                    />
                    <circle cx="-8" cy="-21" r="9.5" fill={crownShadow} stroke={INK} strokeWidth="1.3" />
                    <circle cx="8" cy="-21" r="9.5" fill={crownMain} stroke={INK} strokeWidth="1.3" />
                    <circle cx="0" cy="-28" r="11" fill={crownHighlight} stroke={INK} strokeWidth="1.3" />
                    <circle cx="-3" cy="-24" r="7" fill={crownHighlight} />
                  </g>
                );
              };

              // Teken een Isometrische Auto (Rode rijdende auto of geparkeerde buurtauto's)
              const renderIsoCar = (gx, gy, colorHex, roofHex, dir = 'NE', isRedMoving = false) => {
                const pt = isoToScreen(gx, gy, 0);
                return (
                  <g transform={`translate(${pt.x}, ${pt.y})`} pointerEvents="none">
                    {/* Koplamp-lichtkegels en achterlichtgloed bij schemering/nacht voor de rode auto */}
                    {isRedMoving && isNightOrDusk && (
                      <g>
                        {/* Twee felle koplampbundels naar rechtsboven (NO) */}
                        <polygon
                          points="14,-10 95,-52 115,-32 22,-4"
                          fill="url(#headlightGrad)"
                        />
                        <polygon
                          points="8,-14 85,-60 102,-44 16,-8"
                          fill="url(#headlightGrad)"
                        />
                        {/* Rode remlicht-gloed op de sneeuw achter de auto */}
                        <polygon
                          points="-16,6 -62,32 -42,44 -8,12"
                          fill="url(#taillightGrad)"
                        />
                      </g>
                    )}

                    {/* Autoschaduw */}
                    <ellipse cx="0" cy="3" rx="18" ry="9" fill="#0f172a" opacity="0.38" />

                    {/* Carrosserie onderstel */}
                    <polygon
                      points="-18,0 -4,-8 18,-2 4,7"
                      fill={colorHex}
                      stroke={INK}
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points="-18,0 -18,-7 -4,-15 -4,-8"
                      fill={colorHex}
                      stroke={INK}
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points="-4,-8 18,-2 18,-9 -4,-15"
                      fill={colorHex}
                      stroke={INK}
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />

                    {/* Kajuit / Dak (met sneeuwlaagje in de winter voor geparkeerde auto's!) */}
                    <polygon
                      points="-11,-11 -2,-16 11,-12 2,-7"
                      fill={isSnow && !isRedMoving ? '#f1f5f9' : roofHex}
                      stroke={INK}
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    {/* Voorruit & Zijruiten */}
                    <polygon
                      points="2,-7 11,-12 14,-8 5,-3"
                      fill={isSnow && !isRedMoving ? '#e2e8f0' : '#93c5fd'}
                      stroke={INK}
                      strokeWidth="1"
                    />

                    {/* Wielen */}
                    <circle cx="-10" cy="3" r="3.6" fill="#18181b" stroke="#94a3b8" strokeWidth="1" />
                    <circle cx="8" cy="4" r="3.6" fill="#18181b" stroke="#94a3b8" strokeWidth="1" />

                    {/* Koplampjes & Achterlichtjes */}
                    <circle cx="16" cy="-5" r="1.8" fill="#fef08a" />
                    <circle cx="-16" cy="-2" r="1.8" fill="#ef4444" />
                  </g>
                );
              };

              // Teken oude autobanden, kliko's en graffiti (alleen zichtbaar als pand nog NIET ontwikkeld is!)
              const renderUncaredProps = (gx, gy) => {
                const pt = isoToScreen(gx, gy, 0);
                return (
                  <g transform={`translate(${pt.x}, ${pt.y})`} pointerEvents="none">
                    {/* Stapel oude autobanden */}
                    <ellipse cx="-6" cy="2" rx="6" ry="3.2" fill="#1e293b" stroke={INK} strokeWidth="1.1" />
                    <ellipse cx="-6" cy="0" rx="5.5" ry="2.8" fill="#334155" stroke={INK} strokeWidth="1.1" />
                    <ellipse cx="4" cy="4" rx="5.5" ry="2.8" fill="#1e293b" stroke={INK} strokeWidth="1.1" />
                    {/* Groene Kliko / Afvalcontainer */}
                    <rect x="10" y="-12" width="10" height="13" rx="1" fill="#15803d" stroke={INK} strokeWidth="1.1" />
                    <polygon points="9,-12 21,-12 19,-15 11,-15" fill="#166534" stroke={INK} strokeWidth="1.1" />
                  </g>
                );
              };

              return (
                <g>
                  {/* ==========================================================
                      1. ONDERGROND SOKKEL, GRASVELDEN, STOEPEN & ASFALT-KRUISING
                  ========================================================== */}
                  <g filter="url(#mvShadow)">
                    {renderIsoPrism(
                      -0.3,
                      -0.3,
                      12.6,
                      12.6,
                      -22,
                      0,
                      isSnow ? '#cbd5e1' : lerpColor('#84a98c', '#84cc16', neighborhoodBloom),
                      isSnow ? '#64748b' : '#4d7c0f',
                      isSnow ? '#334155' : '#3f6212',
                      INK,
                      1.4
                    )}
                  </g>

                  {/* Basis Gras/Sneeuw-kavels + Klikbare tegels voor Vrije Inrichting */}
                  {gameState.tiles.map((tile) => {
                    const { x, y } = tile.pos;
                    const isMainRoadEW = y >= 4 && y <= 5;
                    const isMainRoadNS = x >= 4 && x <= 6 && y >= 3;
                    const isSidewalk =
                      y === 3 ||
                      y === 6 ||
                      ((x === 3 || x === 7) && y >= 3);

                    let fill = isSnow
                      ? '#dbeafe'
                      : lerpColor('#65a30d', '#84cc16', neighborhoodBloom);
                    let stroke = isSnow ? '#93c5fd' : '#65a30d';

                    if (isMainRoadEW || isMainRoadNS) {
                      fill = isSnow
                        ? '#64748b'
                        : '#6b7280';
                      stroke = isSnow ? '#475569' : '#4b5563';
                    } else if (isSidewalk) {
                      fill = isSnow ? '#cbd5e1' : '#d6d3d1';
                      stroke = isSnow ? '#94a3b8' : '#a8a29e';
                    }

                    return (
                      <g
                        key={`tile_${x}_${y}`}
                        data-interactive={selectedBrushId ? 'true' : undefined}
                        className={selectedBrushId ? 'cursor-cell hover:opacity-80' : undefined}
                        onClick={() => {
                          if (selectedBrushId) handleTileDecorationClick(tile);
                        }}
                      >
                        <polygon
                          points={getTilePolygonPoints(x, y, 1, 1, 0)}
                          fill={fill}
                          stroke={selectedBrushId ? '#f0abfc' : stroke}
                          strokeWidth={selectedBrushId ? '1.1' : '0.45'}
                        />
                      </g>
                    );
                  })}

                  {/* Witte Asfalt-belijning, Zebrapad & Winter-Bandensporen op de Kruising */}
                  {(() => {
                    const rW1 = isoToScreen(0, 5, 0.5);
                    const rW2 = isoToScreen(4, 5, 0.5);
                    const rE1 = isoToScreen(6.5, 5, 0.5);
                    const rE2 = isoToScreen(12, 5, 0.5);
                    const rS1 = isoToScreen(5.2, 5.5, 0.5);
                    const rS2 = isoToScreen(5.2, 12, 0.5);

                    return (
                      <g pointerEvents="none">
                        {/* Gestippelde middenstrepen op het asfalt */}
                        <line
                          x1={rW1.x}
                          y1={rW1.y}
                          x2={rW2.x}
                          y2={rW2.y}
                          stroke="#f8fafc"
                          strokeWidth="2"
                          strokeDasharray="8 7"
                          opacity={isSnow ? 0.45 : 0.85}
                        />
                        <line
                          x1={rE1.x}
                          y1={rE1.y}
                          x2={rE2.x}
                          y2={rE2.y}
                          stroke="#f8fafc"
                          strokeWidth="2"
                          strokeDasharray="8 7"
                          opacity={isSnow ? 0.45 : 0.85}
                        />
                        <line
                          x1={rS1.x}
                          y1={rS1.y}
                          x2={rS2.x}
                          y2={rS2.y}
                          stroke="#f8fafc"
                          strokeWidth="2"
                          strokeDasharray="8 7"
                          opacity={isSnow ? 0.45 : 0.85}
                        />

                        {/* Zebrapad bij de Supermarkt & het Wijkgebouw (x=3.5, y=4..5.8) */}
                        {[0, 0.3, 0.6, 0.9, 1.2].map((off, idx) => (
                          <polygon
                            key={`zebra_${idx}`}
                            points={getTilePolygonPoints(3.35, 4.15 + off, 0.45, 0.16, 0.6)}
                            fill="#f8fafc"
                            opacity={isSnow ? 0.55 : 0.92}
                          />
                        ))}

                        {/* Gebogen Bandensporen in de sneeuw tijdens de Winter (zoals op afbeelding 1!) */}
                        {isSnow && (
                          <g opacity="0.55">
                            <path
                              d={`M ${rW1.x + 20} ${rW1.y - 10} Q ${isoToScreen(5, 5, 0).x} ${isoToScreen(5, 5, 0).y} ${rE2.x - 30} ${rE2.y - 10}`}
                              fill="none"
                              stroke="#334155"
                              strokeWidth="3.5"
                            />
                            <path
                              d={`M ${rS2.x - 10} ${rS2.y} Q ${isoToScreen(5.2, 5.2, 0).x} ${isoToScreen(5.2, 5.2, 0).y} ${rE2.x - 20} ${rE2.y}`}
                              fill="none"
                              stroke="#334155"
                              strokeWidth="3"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      2. NOORD-WEST RIJ ARBEIDERSHUISJES (b_hw1, b_hw2, b_hw3)
                         Met zadeldaken, dakkapel, zonnepanelen (na upgrade) & bloesembomen
                  ========================================================== */}
                  {[
                    { id: 'b_hw1', gx: 0.4, gy: 0.3, w: 1.5, d: 1.6 },
                    { id: 'b_hw2', gx: 2.1, gy: 0.3, w: 1.5, d: 1.6 },
                    { id: 'b_hw3', gx: 0.4, gy: 2.3, w: 1.5, d: 1.5 }
                  ].map((cfg, idx) => {
                    const bld = gameState.buildings[cfg.id];
                    const unit = gameState.units[bld.unitIds[0]];
                    const hh = unit.occupiedByHouseholdId
                      ? gameState.households[unit.occupiedByHouseholdId]
                      : null;
                    const isSelected = selectedBuildingId === cfg.id;
                    const isUpgraded =
                      forceFullBloom ||
                      (!forceZeroBloom && bld.upgrades.some((u) => u.isInstalled));

                    const wallSW = isSnow
                      ? '#94a3b8'
                      : isUpgraded
                      ? '#fde68a'
                      : '#d6c7b2';
                    const wallSE = isSnow
                      ? '#64748b'
                      : isUpgraded
                      ? '#eab308'
                      : '#a89984';
                    const roofFront = isSnow
                      ? '#e2e8f0'
                      : '#78716c';
                    const roofSide = isSnow
                      ? '#cbd5e1'
                      : '#57534e';

                    return (
                      <g
                        key={cfg.id}
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId(cfg.id);
                          setSelectedUnitId(unit.id);
                          if (hh?.memberIds[0]) setSelectedResidentId(hh.memberIds[0]);
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {/* 3D Huis-lichaam */}
                        {renderIsoPrism(
                          cfg.gx,
                          cfg.gy,
                          cfg.w,
                          cfg.d,
                          0,
                          28,
                          wallSW,
                          wallSW,
                          wallSE,
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.4 : 1.3
                        )}

                        {/* Zadeldak */}
                        {renderPitchedRoof(
                          cfg.gx,
                          cfg.gy,
                          cfg.w,
                          cfg.d,
                          28,
                          45,
                          roofFront,
                          roofSide,
                          wallSW
                        )}

                        {/* Zonnepanelen op het schuine dak als de buurt/woning ontwikkeld is! */}
                        {isUpgraded && !isSnow && (
                          <g>
                            {renderSolarPanelOnRoof(cfg.gx + 0.2, cfg.gy + 0.25, 0.5, 0.9, 39)}
                            {renderSolarPanelOnRoof(cfg.gx + 0.8, cfg.gy + 0.25, 0.5, 0.9, 35)}
                          </g>
                        )}

                        {/* Schoorsteen met rookpluimpje */}
                        {renderIsoPrism(
                          cfg.gx + 0.25,
                          cfg.gy + 0.25,
                          0.26,
                          0.26,
                          36,
                          49,
                          isSnow ? '#f8fafc' : '#a8a29e',
                          '#78716c',
                          '#57534e',
                          INK,
                          1.1
                        )}
                        {(() => {
                          const chPos = isoToScreen(cfg.gx + 0.35, cfg.gy + 0.35, 52);
                          return (
                            <g opacity="0.55">
                              <circle
                                cx={chPos.x + Math.sin(animPhase * 2 + idx) * 4}
                                cy={chPos.y - 6}
                                r="4.5"
                                fill="#e2e8f0"
                              />
                              <circle
                                cx={chPos.x + 4 + Math.cos(animPhase * 2 + idx) * 5}
                                cy={chPos.y - 15}
                                r="6.5"
                                fill="#f1f5f9"
                              />
                            </g>
                          );
                        })()}

                        {/* Verlichte Ramen op SW & SE gevels */}
                        {renderIsoWindow(
                          cfg.gx + 0.25,
                          cfg.gy + cfg.d,
                          6,
                          0.38,
                          9,
                          'SW',
                          isNightOrDusk,
                          isUpgraded
                        )}
                        {renderIsoWindow(
                          cfg.gx + 0.85,
                          cfg.gy + cfg.d,
                          16,
                          0.38,
                          8,
                          'SW',
                          isNightOrDusk && idx % 2 === 0,
                          false
                        )}

                        {/* Onontwikkeld: Graffiti & Oude Autobanden bij Huisje 2 | Ontwikkeld: Bloesemboom & Tuinhekje */}
                        {!isUpgraded ? (
                          renderUncaredProps(cfg.gx + cfg.w + 0.25, cfg.gy + 0.9)
                        ) : (
                          renderIllustratedTree(cfg.gx - 0.2, cfg.gy + cfg.d + 0.2, 'BLOSSOM', 0.82)
                        )}
                      </g>
                    );
                  })}

                  {/* ==========================================================
                      3. RECHTSBOVEN: DE "SCHOOL" & HET SPEELPLEIN (b_square)
                         Onontwikkeld: Grauwe gevel + koud plein
                         Ontwikkeld: Geel/Rood/Blauw gevel + Zonnepanelen + Groen Sportveld!
                  ========================================================== */}
                  {(() => {
                    const sqBld = gameState.buildings.b_square;
                    const isSelected = selectedBuildingId === 'b_square';
                    const hasSchoolUpgrade = hasUpgradeOrBloom('b_square', 'up_sq_cleanup');
                    const hasPlaygroundUpgrade = hasUpgradeOrBloom('b_square', 'up_sq_playground');

                    const schoolRoof = isSnow
                      ? '#dbeafe'
                      : '#64748b';
                    const schoolWallSW = isSnow
                      ? '#64748b'
                      : hasSchoolUpgrade
                      ? '#fde047'
                      : '#94a3b8';
                    const schoolWallSE = isSnow
                      ? '#475569'
                      : hasSchoolUpgrade
                      ? '#f59e0b'
                      : '#64748b';

                    const signPos = isoToScreen(9.6, 2.8, 0);

                    return (
                      <g
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId('b_square');
                          setSelectedUnitId(null);
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {/* Schoolgebouw (x=7.2..9.6, y=0..1.5) */}
                        {renderIsoPrism(
                          7.2,
                          0.0,
                          2.3,
                          1.5,
                          0,
                          36,
                          schoolRoof,
                          schoolWallSW,
                          schoolWallSE,
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.5 : 1.4
                        )}

                        {/* Kleurrijke Mondriaan-panelen (Rood/Blauw/Geel) op de schoolgevel na upgrade! */}
                        {hasSchoolUpgrade && !isSnow && (
                          <g>
                            {renderIsoPrism(7.8, 1.48, 0.65, 0.04, 0, 34, '#f87171', '#ef4444', '#dc2626', INK, 1)}
                            {renderIsoPrism(8.55, 1.48, 0.65, 0.04, 0, 34, '#60a5fa', '#3b82f6', '#2563eb', INK, 1)}
                            {/* Rij Zonnepanelen op het schooldak */}
                            {renderSolarPanelOnRoof(7.45, 0.25, 0.7, 0.9, 37)}
                            {renderSolarPanelOnRoof(8.35, 0.25, 0.7, 0.9, 37)}
                          </g>
                        )}

                        {/* Schoolramen */}
                        {renderIsoWindow(7.4, 1.5, 6, 0.4, 10, 'SW', isNightOrDusk)}
                        {renderIsoWindow(8.0, 1.5, 6, 0.4, 10, 'SW', isNightOrDusk)}
                        {renderIsoWindow(8.7, 1.5, 20, 0.4, 10, 'SW', isNightOrDusk)}

                        {/* Schoolplein met Klimrek (Monkey bars) & Groen Basketbalveld (x=7.3..10.5, y=1.6..3.2) */}
                        <polygon
                          points={getTilePolygonPoints(7.3, 1.65, 1.6, 1.4, 0.6)}
                          fill={isSnow ? '#cbd5e1' : hasPlaygroundUpgrade ? '#fde68a' : '#d6d3d1'}
                          stroke={INK}
                          strokeWidth="1"
                        />
                        {/* Klimrek op de zandbak */}
                        {(() => {
                          const mb = isoToScreen(8.0, 2.35, 2);
                          return (
                            <g transform={`translate(${mb.x}, ${mb.y})`}>
                              <line x1="-12" y1="4" x2="-12" y2="-12" stroke="#b45309" strokeWidth="2.2" />
                              <line x1="12" y1="-4" x2="12" y2="-20" stroke="#b45309" strokeWidth="2.2" />
                              <line x1="-12" y1="-12" x2="12" y2="-20" stroke="#d97706" strokeWidth="2.5" />
                            </g>
                          );
                        })()}

                        {/* Basketbalveldje rechts van de zandbak */}
                        <polygon
                          points={getTilePolygonPoints(9.0, 1.65, 1.5, 1.4, 0.6)}
                          fill={
                            isSnow
                              ? '#dbeafe'
                              : hasPlaygroundUpgrade
                              ? '#4ade80'
                              : '#94a3b8'
                          }
                          stroke="#f8fafc"
                          strokeWidth="1.2"
                        />

                        {/* Portaal-bord "SCHOOL" aan de straatzijde */}
                        <g transform={`translate(${signPos.x}, ${signPos.y})`}>
                          <line x1="-16" y1="6" x2="-16" y2="-18" stroke={INK} strokeWidth="2" />
                          <line x1="16" y1="-6" x2="16" y2="-30" stroke={INK} strokeWidth="2" />
                          <polygon
                            points="-18,-14 18,-26 18,-18 -18,-6"
                            fill="#f8fafc"
                            stroke={INK}
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="-13"
                            textAnchor="middle"
                            fill={INK}
                            fontSize="6.5"
                            fontWeight="bold"
                            transform="rotate(-19)"
                          >
                            SCHOOL
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      4. MIDDEN: HET CENTRALE WIJKGEBOUW MET SLAGBOOM & EV-LAADPLEIN (b_hub)
                  ========================================================== */}
                  {(() => {
                    const hubBld = gameState.buildings.b_hub;
                    const isSelected = selectedBuildingId === 'b_hub';
                    const isHubUpgraded = hasUpgradeOrBloom('b_hub', 'up_hub_center');

                    const hubRoof = isSnow ? '#cbd5e1' : '#64748b';
                    const hubSW = isSnow
                      ? '#64748b'
                      : isHubUpgraded
                      ? '#e7e5e4'
                      : '#94a3b8';
                    const hubSE = isSnow
                      ? '#475569'
                      : isHubUpgraded
                      ? '#d6d3d1'
                      : '#64748b';

                    const barrierPos = isoToScreen(5.7, 3.65, 0);

                    return (
                      <g
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId('b_hub');
                          setSelectedUnitId(null);
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {/* 3-Laags Vierkant Kantoor/Wijkgebouw (x=4.1..6.1, y=1.1..2.9) */}
                        {renderIsoPrism(
                          4.1,
                          1.1,
                          1.95,
                          1.85,
                          0,
                          54,
                          hubRoof,
                          hubSW,
                          hubSE,
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.5 : 1.4
                        )}

                        {/* Dak-opbouw (Airco-unit & Dakluik zoals op de referentie-afbeelding!) */}
                        {renderIsoPrism(4.4, 1.4, 0.5, 0.5, 54, 61, hubRoof, '#94a3b8', '#475569', INK, 1.1)}
                        {renderIsoPrism(5.3, 1.3, 0.45, 0.45, 54, 60, '#cbd5e1', '#94a3b8', '#64748b', INK, 1.1)}

                        {/* Horizontale raamstroken op 3 woonlagen */}
                        {[10, 24, 38].map((zLev, rIdx) => (
                          <g key={`hub_win_${rIdx}`}>
                            {renderIsoWindow(
                              4.25,
                              2.95,
                              zLev,
                              1.6,
                              8,
                              'SW',
                              isNightOrDusk && rIdx === 2
                            )}
                          </g>
                        ))}

                        {/* Parkeerhaven met rood-witte Slagboom én EV-Laadpalen (na upgrade) */}
                        <g transform={`translate(${barrierPos.x}, ${barrierPos.y})`}>
                          {/* Gele EV-parkeervak belijning als ontwikkeld */}
                          {isHubUpgraded && !isSnow && (
                            <g>
                              <line x1="-22" y1="10" x2="8" y2="24" stroke="#facc15" strokeWidth="1.8" />
                              <rect x="-18" y="-12" width="5" height="12" rx="1" fill="#22c55e" stroke={INK} strokeWidth="1" />
                              <rect x="6" y="-22" width="5" height="12" rx="1" fill="#22c55e" stroke={INK} strokeWidth="1" />
                            </g>
                          )}
                          {/* Slagboom-paaltje + rood-wit gestreepte boom */}
                          <rect x="-3" y="-10" width="6" height="12" fill="#f97316" stroke={INK} strokeWidth="1.1" />
                          <line x1="0" y1="-7" x2="26" y2="6" stroke="#ef4444" strokeWidth="3" />
                          <line
                            x1="0"
                            y1="-7"
                            x2="26"
                            y2="6"
                            stroke="#ffffff"
                            strokeWidth="3"
                            strokeDasharray="4 4"
                          />
                        </g>
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      5. LINKSONDER: DE HOEK-"SUPERMARKT" & ARBEIDERSHUISJES (b_garden & b_hw4)
                  ========================================================== */}
                  {(() => {
                    const supBld = gameState.buildings.b_garden;
                    const isSelected = selectedBuildingId === 'b_garden';
                    const isSupUpgraded = hasUpgradeOrBloom('b_garden', 'up_gar_moestuin');

                    const supRoof = isSnow ? '#dbeafe' : '#94a3b8';
                    const supSW = isSnow
                      ? '#64748b'
                      : isSupUpgraded
                      ? '#fed7aa'
                      : '#a8a29e';
                    const supSE = isSnow
                      ? '#475569'
                      : isSupUpgraded
                      ? '#fdba74'
                      : '#78716c';

                    const signCenter = isoToScreen(2.65, 5.1, 24);

                    return (
                      <g
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId('b_garden');
                          setSelectedUnitId(null);
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {/* Supermarkt Hoekpand (x=1.4..3.1, y=4.2..5.6) */}
                        {renderIsoPrism(
                          1.4,
                          4.1,
                          1.75,
                          1.5,
                          0,
                          40,
                          supRoof,
                          supSW,
                          supSE,
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.5 : 1.4
                        )}

                        {/* Verlicht "SUPERMARKT" gevelbord boven de etalage */}
                        <g transform={`translate(${signCenter.x}, ${signCenter.y})`}>
                          <polygon
                            points="-26,10 26,-14 26,-4 -26,20"
                            fill="#ea580c"
                            stroke="#fef08a"
                            strokeWidth="1.3"
                          />
                          <text
                            x="0"
                            y="6"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="7.2"
                            fontWeight="bold"
                            transform="rotate(-25)"
                          >
                            SUPERMARKT
                          </text>
                        </g>

                        {/* Etalageramen & Groentekratjes voor de winkel */}
                        {renderIsoWindow(1.65, 5.6, 2, 0.55, 11, 'SW', true)}
                        {renderIsoWindow(2.4, 5.6, 2, 0.5, 11, 'SW', true)}

                        {/* Houten fruit-/groentekratjes op de stoep */}
                        {renderIsoPrism(
                          3.2,
                          5.1,
                          0.35,
                          0.45,
                          0,
                          5,
                          isSupUpgraded ? '#4ade80' : '#ea580c',
                          '#9a3412',
                          '#7c2d12',
                          INK,
                          1
                        )}
                      </g>
                    );
                  })()}

                  {/* Arbeidershuisje linksonder naast de Supermarkt (b_hw4: Bram & Lotte) */}
                  {(() => {
                    const bld = gameState.buildings.b_hw4;
                    const unit = gameState.units.u_hw4;
                    const hh = gameState.households[unit.occupiedByHouseholdId];
                    const isSelected = selectedBuildingId === 'b_hw4';
                    const isUpgraded =
                      forceFullBloom ||
                      (!forceZeroBloom && bld.upgrades.some((u) => u.isInstalled));

                    return (
                      <g
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId('b_hw4');
                          setSelectedUnitId('u_hw4');
                          if (hh?.memberIds[0]) setSelectedResidentId(hh.memberIds[0]);
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {renderIsoPrism(
                          0.2,
                          5.7,
                          1.6,
                          1.7,
                          0,
                          28,
                          isSnow ? '#94a3b8' : '#fde68a',
                          isSnow ? '#94a3b8' : '#fde68a',
                          isSnow ? '#64748b' : '#eab308',
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.4 : 1.3
                        )}
                        {renderPitchedRoof(
                          0.2,
                          5.7,
                          1.6,
                          1.7,
                          28,
                          44,
                          isSnow ? '#e2e8f0' : '#78716c',
                          isSnow ? '#cbd5e1' : '#57534e',
                          isSnow ? '#94a3b8' : '#fde68a'
                        )}
                        {isUpgraded && !isSnow && renderSolarPanelOnRoof(0.45, 5.95, 0.9, 1.1, 38)}
                        {renderIsoWindow(0.5, 7.4, 6, 0.45, 9, 'SW', isNightOrDusk, isUpgraded)}
                        {isUpgraded && renderIllustratedTree(0.2, 7.9, 'BLOSSOM', 0.9)}
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      6. ONDERAAN MIDDEN: HET L-VORMIGE ARBEIDERSHUIS (b_hw6)
                         Met verweerde graffiti & autobanden (onontwikkeld) -> zonnepanelen & bloementuin
                  ========================================================== */}
                  {(() => {
                    const bld = gameState.buildings.b_hw6;
                    const unit = gameState.units.u_hw6;
                    const isSelected = selectedBuildingId === 'b_hw6';
                    const isUpgraded =
                      forceFullBloom ||
                      (!forceZeroBloom && bld.upgrades.some((u) => u.isInstalled));

                    const wallSW = isSnow ? '#94a3b8' : isUpgraded ? '#fef08a' : '#d6c7b2';
                    const wallSE = isSnow ? '#64748b' : isUpgraded ? '#eab308' : '#bfa888';

                    return (
                      <g
                        data-interactive="true"
                        className="cursor-pointer"
                        filter="url(#buildingShadow)"
                        onClick={() => {
                          setSelectedBuildingId('b_hw6');
                          setSelectedUnitId('u_hw6');
                          setActiveRightTab('BUILDING');
                        }}
                      >
                        {renderIsoPrism(
                          3.8,
                          8.2,
                          2.6,
                          1.9,
                          0,
                          26,
                          wallSW,
                          wallSW,
                          wallSE,
                          isSelected ? '#f59e0b' : INK,
                          isSelected ? 2.4 : 1.4
                        )}
                        {renderPitchedRoof(
                          3.8,
                          8.2,
                          2.6,
                          1.9,
                          26,
                          43,
                          isSnow ? '#e2e8f0' : '#78716c',
                          isSnow ? '#cbd5e1' : '#57534e',
                          wallSW
                        )}
                        {isUpgraded && !isSnow && renderSolarPanelOnRoof(4.1, 8.4, 1.1, 1.2, 37)}
                        {renderIsoWindow(4.2, 10.1, 6, 0.45, 9, 'SW', isNightOrDusk, isUpgraded)}
                        {renderIsoWindow(5.2, 10.1, 6, 0.45, 9, 'SW', isNightOrDusk, isUpgraded)}

                        {/* In onontwikkelde staat: oude autobanden & kliko's voor het huis */}
                        {!isUpgraded && renderUncaredProps(5.4, 10.6)}

                        {/* Sparrenbomen rechtsonder bij het huis (besneeuwd in de winter, frisgroen in de lente!) */}
                        {renderIllustratedTree(6.8, 10.6, 'PINE', 1.05)}
                        {renderIllustratedTree(7.5, 11.1, 'PINE', 0.92)}
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      7. RECHTSONDER: PORTIEKFLAT "DE ZWALUW" (b_flat)
                         Exact zoals rechts op beide referentie-afbeeldingen:
                         - Onontwikkeld (Winter): 4 woonlagen, kale smeedijzeren balkons, sneeuwdak, gloeiende ramen
                         - Ontwikkeld (Lente): Groen sedumdak met zonnepanelen + houten dakterras met pergola,
                           bloeiende balkonbakken, roze bloesemboom & fietsenrekken!
                         - Klik op "Cutaway: OPEN" om het volledige 6-kamer interieur te openen!
                  ========================================================== */}
                  {(() => {
                    const flatBld = gameState.buildings.b_flat;
                    const isSelected = selectedBuildingId === 'b_flat';
                    const hasBalconyGarden = hasUpgradeOrBloom('b_flat', 'up_flat_stairwell');
                    const hasGreenRoof = hasUpgradeOrBloom('b_flat', 'up_flat_insulation');
                    const hasElevatorAndBikes = hasUpgradeOrBloom('b_flat', 'up_flat_elevator');

                    const flatRoofColor = isSnow
                      ? '#dbeafe'
                      : hasGreenRoof
                      ? '#84cc16'
                      : '#94a3b8';
                    const flatWallSW = isSnow
                      ? '#64748b'
                      : '#d6b899';
                    const flatWallSE = isSnow
                      ? '#475569'
                      : '#b09171';

                    const anchor = isoToScreen(9.2, 7.2, 0);
                    const flatUnitOrder = [
                      { id: 'u_f2l', floor: 2, col: 0 },
                      { id: 'u_f2r', floor: 2, col: 1 },
                      { id: 'u_f1l', floor: 1, col: 0 },
                      { id: 'u_f1r', floor: 1, col: 1 },
                      { id: 'u_f0l', floor: 0, col: 0 },
                      { id: 'u_f0r', floor: 0, col: 1 }
                    ];

                    return (
                      <g filter="url(#mvShadow)">
                        {/* Roze Bloesemboom links voor de Portiekflat (of besneeuwde boom in de winter) */}
                        {renderIllustratedTree(
                          7.35,
                          6.6,
                          hasBalconyGarden ? 'BLOSSOM' : 'GREEN',
                          1.05
                        )}

                        {/* HET 4-LAAGS PORTIEKFLAT GEBOUW (x=7.8..11.5, y=4.6..8.5) */}
                        <g
                          data-interactive="true"
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedBuildingId('b_flat');
                            if (!selectedUnitId) setSelectedUnitId('u_f2l');
                            setActiveRightTab('BUILDING');
                          }}
                        >
                          {renderIsoPrism(
                            7.8,
                            4.8,
                            3.6,
                            3.6,
                            0,
                            86,
                            flatRoofColor,
                            flatWallSW,
                            flatWallSE,
                            isSelected ? '#f59e0b' : INK,
                            isSelected ? 2.6 : 1.5
                          )}

                          {/* Kroonlijst / Dakrand van de Portiekflat */}
                          {renderIsoPrism(
                            7.72,
                            4.72,
                            3.76,
                            3.76,
                            84,
                            89,
                            flatRoofColor,
                            isSnow ? '#cbd5e1' : '#e5e7eb',
                            isSnow ? '#94a3b8' : '#9ca3af',
                            INK,
                            1.2
                          )}

                          {/* DAK-DETAILS: In onontwikkelde staat 2 betonnen dakluiken; in ontwikkelde staat Sedumdak + Zonnepanelen + Houten Dakterras! */}
                          {!hasGreenRoof ? (
                            <g>
                              {renderIsoPrism(8.4, 5.5, 0.9, 0.9, 89, 96, flatRoofColor, '#64748b', '#475569', INK, 1.1)}
                              {renderIsoPrism(9.9, 6.7, 0.9, 0.9, 89, 96, flatRoofColor, '#64748b', '#475569', INK, 1.1)}
                            </g>
                          ) : (
                            <g>
                              {/* Houten Dakterras met plantenbakken en zitbankjes */}
                              {renderIsoPrism(
                                8.2,
                                5.1,
                                1.6,
                                1.4,
                                89,
                                94,
                                '#d97706',
                                '#b45309',
                                '#78350f',
                                INK,
                                1.1
                              )}
                              {renderIsoPrism(
                                8.4,
                                5.3,
                                0.5,
                                0.5,
                                94,
                                100,
                                '#fde68a',
                                '#d97706',
                                '#92400e',
                                INK,
                                0.9
                              )}
                              {/* Zonnepanelen op het groene sedumdak */}
                              {renderSolarPanelOnRoof(8.2, 6.8, 0.9, 1.2, 91)}
                              {renderSolarPanelOnRoof(9.4, 6.8, 0.9, 1.2, 91)}
                              {renderSolarPanelOnRoof(10.2, 5.4, 0.8, 1.1, 91)}
                            </g>
                          )}

                          {/* VOORGEVEL DETAILS (Als Cutaway NIET open staat: Balkons, Ramen & Portiek-entree zoals op de afbeelding!) */}
                          {!globalCutaway && (
                            <g>
                              {/* 4 Woonlagen met Ramen én Smeedijzeren Balkons + Balkontuintjes */}
                              {[8, 28, 48, 66].map((zFl, fIdx) => (
                                <g key={`flat_fl_${fIdx}`}>
                                  {/* Linker Balkon + Raam */}
                                  {renderIsoWindow(
                                    8.05,
                                    8.4,
                                    zFl + 2,
                                    0.65,
                                    12,
                                    'SW',
                                    isNightOrDusk && (fIdx === 1 || fIdx === 2),
                                    hasBalconyGarden
                                  )}
                                  {fIdx > 0 &&
                                    renderIsoPrism(
                                      7.95,
                                      8.4,
                                      0.85,
                                      0.28,
                                      zFl,
                                      zFl + 6,
                                      hasBalconyGarden && !isSnow ? '#4ade80' : '#475569',
                                      '#334155',
                                      '#1e293b',
                                      INK,
                                      1
                                    )}

                                  {/* Middelste Ramen */}
                                  {renderIsoWindow(
                                    9.15,
                                    8.4,
                                    zFl + 3,
                                    0.55,
                                    10,
                                    'SW',
                                    isNightOrDusk && fIdx !== 2,
                                    false
                                  )}

                                  {/* Rechter Balkon + Raam */}
                                  {renderIsoWindow(
                                    10.15,
                                    8.4,
                                    zFl + 2,
                                    0.65,
                                    12,
                                    'SW',
                                    isNightOrDusk && (fIdx === 0 || fIdx === 3),
                                    hasBalconyGarden
                                  )}
                                  {fIdx > 0 &&
                                    renderIsoPrism(
                                      10.05,
                                      8.4,
                                      0.85,
                                      0.28,
                                      zFl,
                                      zFl + 6,
                                      hasBalconyGarden && !isSnow ? '#4ade80' : '#475569',
                                      '#334155',
                                      '#1e293b',
                                      INK,
                                      1
                                    )}
                                </g>
                              ))}

                              {/* Portiek-ingang met luifel en trapje aan de straatzijde */}
                              {renderIsoPrism(
                                9.0,
                                8.4,
                                0.85,
                                0.45,
                                0,
                                4,
                                '#cbd5e1',
                                '#94a3b8',
                                '#64748b',
                                INK,
                                1
                              )}
                              {renderIsoPrism(
                                8.95,
                                8.4,
                                0.95,
                                0.48,
                                15,
                                18,
                                isSnow ? '#f1f5f9' : '#64748b',
                                '#475569',
                                '#334155',
                                INK,
                                1
                              )}

                              {/* Zwevende knop op de gevel om de Cutaway-kamers te openen */}
                              {(() => {
                                const btnPt = isoToScreen(9.5, 8.4, 48);
                                return (
                                  <g
                                    transform={`translate(${btnPt.x}, ${btnPt.y})`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGlobalCutaway(true);
                                    }}
                                  >
                                    <rect
                                      x="-66"
                                      y="-11"
                                      width="132"
                                      height="20"
                                      rx="10"
                                      fill="#18181b"
                                      stroke="#fbbf24"
                                      strokeWidth="1.4"
                                      opacity="0.92"
                                    />
                                    <text
                                      x="0"
                                      y="2.5"
                                      textAnchor="middle"
                                      fill="#fef3c7"
                                      fontSize="8.5"
                                      fontWeight="bold"
                                    >
                                      👁️ Klik voor Cutaway-Kamers (6)
                                    </text>
                                  </g>
                                );
                              })()}
                            </g>
                          )}
                        </g>

                        {/* OPENGEKLAPTE CUTAWAY-WEERGAVE VAN DE 6 APPARTEMENTEN */}
                        {globalCutaway && (
                          <g transform={`translate(${anchor.x - 115}, ${anchor.y - 102})`}>
                            <rect
                              x="-4"
                              y="-20"
                              width="234"
                              height="20"
                              rx="4"
                              fill="#18181b"
                              stroke="#fbbf24"
                              strokeWidth="1.2"
                            />
                            <text
                              x="95"
                              y="-7"
                              textAnchor="middle"
                              fill="#fef3c7"
                              fontSize="9"
                              fontWeight="bold"
                            >
                              PORTIEKFLAT "DE ZWALUW" (INTERIEUR)
                            </text>
                            <g
                              data-interactive="true"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGlobalCutaway(false);
                              }}
                            >
                              <rect x="182" y="-17" width="44" height="14" rx="4" fill="#dc2626" />
                              <text x="204" y="-7.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="bold">
                                Sluit ✕
                              </text>
                            </g>

                            <rect
                              x="0"
                              y="0"
                              width="226"
                              height="146"
                              rx="4"
                              fill="#78350f"
                              stroke="#fbbf24"
                              strokeWidth="2.4"
                            />

                            {/* Trappenhuis */}
                            <rect
                              x="98"
                              y="5"
                              width="30"
                              height="136"
                              fill={hasBalconyGarden ? '#fef3c7' : '#94a3b8'}
                              stroke="#475569"
                              strokeWidth="1"
                            />
                            {[28, 72, 116].map((sy, idx) => (
                              <g key={idx}>
                                <line x1="101" y1={sy} x2="125" y2={sy + 14} stroke="#334155" strokeWidth="2" />
                                <line x1="101" y1={sy + 14} x2="125" y2={sy + 14} stroke="#475569" strokeWidth="1.5" />
                              </g>
                            ))}

                            {/* De 6 klikbare kamers */}
                            {flatUnitOrder.map(({ id, floor, col }) => {
                              const unit = gameState.units[id];
                              const hh = unit.occupiedByHouseholdId
                                ? gameState.households[unit.occupiedByHouseholdId]
                                : null;
                              const isUnitSelected = selectedUnitId === id;

                              const rx = col === 0 ? 5 : 132;
                              const ry = (2 - floor) * 45 + 5;
                              const rw = 89;
                              const rh = 41;

                              let wallBg = '#fffbeb';
                              let floorStripe = '#d97706';
                              if (!unit.isReadyForOccupation) {
                                wallBg = '#64748b';
                                floorStripe = '#334155';
                              } else if (!hh) {
                                wallBg = '#dcfce7';
                              }

                              const members = hh
                                ? hh.memberIds.map((mId) => gameState.residents[mId]).filter(Boolean)
                                : [];

                              return (
                                <g
                                  key={id}
                                  data-interactive="true"
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBuildingId('b_flat');
                                    setSelectedUnitId(id);
                                    if (members[0]) setSelectedResidentId(members[0].id);
                                    setActiveRightTab('BUILDING');
                                  }}
                                >
                                  <rect
                                    x={rx}
                                    y={ry}
                                    width={rw}
                                    height={rh}
                                    rx="2"
                                    fill={wallBg}
                                    stroke={isUnitSelected ? '#f59e0b' : '#334155'}
                                    strokeWidth={isUnitSelected ? '2.6' : '1.1'}
                                  />
                                  <rect x={rx + 1} y={ry + rh - 6} width={rw - 2} height="5" fill={floorStripe} />
                                  <rect
                                    x={rx + 3}
                                    y={ry + 3}
                                    width="25"
                                    height="11"
                                    rx="2"
                                    fill={isUnitSelected ? '#d97706' : '#1e293b'}
                                  />
                                  <text
                                    x={rx + 15.5}
                                    y={ry + 10.5}
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize="7.2"
                                    fontWeight="bold"
                                  >
                                    {unit.shortRoomCode}
                                  </text>

                                  {hh ? (
                                    <g>
                                      {members.map((m, mIdx) => (
                                        <g
                                          key={m.id}
                                          transform={`translate(${rx + 14 + mIdx * 18}, ${ry + 26})`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBuildingId('b_flat');
                                            setSelectedUnitId(id);
                                            setSelectedResidentId(m.id);
                                            setActiveRightTab('RESIDENT');
                                          }}
                                        >
                                          <circle
                                            cx="0"
                                            cy="0"
                                            r="6.8"
                                            fill={m.avatarColor}
                                            stroke="#1c1917"
                                            strokeWidth="1.1"
                                          />
                                          <text
                                            x="0"
                                            y="2.5"
                                            textAnchor="middle"
                                            fill="#fff"
                                            fontSize="6.5"
                                            fontWeight="bold"
                                          >
                                            {m.firstName.charAt(0)}
                                          </text>
                                        </g>
                                      ))}
                                      <text
                                        x={rx + rw - 4}
                                        y={ry + rh - 8}
                                        textAnchor="end"
                                        fill={hh.averagePositivity < 50 ? '#b91c1c' : '#15803d'}
                                        fontSize="8.5"
                                        fontWeight="bold"
                                      >
                                        {Math.round(hh.averagePositivity)}%
                                      </text>
                                    </g>
                                  ) : (
                                    <text
                                      x={rx + rw / 2}
                                      y={ry + 28}
                                      textAnchor="middle"
                                      fill={unit.isReadyForOccupation ? '#15803d' : '#f8fafc'}
                                      fontSize="7.8"
                                      fontWeight="bold"
                                    >
                                      {unit.isReadyForOccupation ? '✓ VRIJ' : '⚙ Klus-Unit'}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        )}
                      </g>
                    );
                  })()}

                  {/* ==========================================================
                      8. AUTO'S OP DE KRUISING, GEPARKEERDE AUTO'S & STRAATLANTAARNS
                         (Exact zoals op de referentie-afbeeldingen!)
                  ========================================================== */}
                  {/* Geparkeerde auto's langs de straat */}
                  {renderIsoCar(2.1, 6.2, '#15803d', '#22c55e', 'NE', false)}
                  {renderIsoCar(3.3, 5.7, '#a855f7', '#c084fc', 'NE', false)}
                  {renderIsoCar(6.3, 3.8, '#5eead4', '#99f6e4', 'NE', false)}
                  {renderIsoCar(6.8, 5.6, '#b45309', '#d97706', 'NE', false)}
                  {renderIsoCar(8.3, 9.6, '#d97706', '#fbbf24', 'NE', false)}

                  {/* De iconische RODE HATCHBACK midden op de kruising (met koplampbundels in de winter!) */}
                  {(() => {
                    const redOffset = Math.sin(animPhase * 0.8) * 0.18;
                    return renderIsoCar(
                      4.85 + redOffset,
                      5.35 - redOffset * 0.5,
                      '#dc2626',
                      '#ef4444',
                      'NE',
                      true
                    );
                  })()}

                  {/* Gebogen Straatlantaarns met warme oranje lichtkegels in de schemering/nacht */}
                  {[
                    { gx: 3.1, gy: 5.1 },
                    { gx: 4.3, gy: 3.8 },
                    { gx: 6.7, gy: 2.9 },
                    { gx: 8.6, gy: 8.9 },
                    { gx: 0.9, gy: 7.4 }
                  ].map((lp, idx) => {
                    const p = isoToScreen(lp.gx, lp.gy, 0);
                    return (
                      <g key={`street_lamp_${idx}`} pointerEvents="none">
                        {isNightOrDusk && (
                          <g>
                            {/* Lichtkegel op de sneeuw/straat */}
                            <polygon
                              points={`${p.x + 8},${p.y - 26} ${p.x - 24},${p.y + 8} ${p.x + 32},${p.y + 8}`}
                              fill="url(#lampGlow)"
                              opacity="0.55"
                            />
                            <ellipse cx={p.x + 6} cy={p.y + 4} rx="28" ry="15" fill="url(#lampGlow)" />
                          </g>
                        )}
                        <path
                          d={`M ${p.x} ${p.y} L ${p.x} ${p.y - 25} Q ${p.x} ${p.y - 30} ${p.x + 8} ${p.y - 28}`}
                          fill="none"
                          stroke="#334155"
                          strokeWidth="2.2"
                        />
                        <circle
                          cx={p.x + 8}
                          cy={p.y - 27}
                          r="3.2"
                          fill={isNightOrDusk ? '#fde047' : '#e2e8f0'}
                          stroke={INK}
                          strokeWidth="0.9"
                        />
                      </g>
                    );
                  })}

                  {/* Vrij geplaatste speler-decoraties op het grid */}
                  {gameState.tiles
                    .filter((t) => t.decorationType)
                    .map((tile) => {
                      const { x, y } = tile.pos;
                      const dType = tile.decorationType;
                      const pt = isoToScreen(x + 0.5, y + 0.5, 2);
                      return (
                        <g
                          key={`custom_deco_${x}_${y}`}
                          data-interactive="true"
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedBrushId === 'REMOVE') handleTileDecorationClick(tile);
                          }}
                        >
                          {dType === 'TREE_BLOSSOM' &&
                            renderIllustratedTree(x + 0.5, y + 0.5, 'BLOSSOM', 0.9)}
                          {dType === 'COZY_BENCH' &&
                            renderIsoPrism(x + 0.2, y + 0.3, 0.6, 0.32, 0, 6, '#fbbf24', '#d97706', '#92400e', INK, 1)}
                          {dType === 'FLOWER_PLANTER' &&
                            renderIsoPrism(x + 0.22, y + 0.22, 0.55, 0.55, 0, 6, '#4ade80', '#ea580c', '#9a3412', INK, 1)}
                          {dType === 'STREET_LAMP' && (
                            <g>
                              {isNightOrDusk && (
                                <ellipse cx={pt.x} cy={pt.y + 2} rx="24" ry="12" fill="url(#lampGlow)" />
                              )}
                              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y - 22} stroke={INK} strokeWidth="2.2" />
                              <circle cx={pt.x} cy={pt.y - 23} r="4" fill="#fde047" stroke={INK} strokeWidth="1" />
                            </g>
                          )}
                          {dType === 'PICNIC_TABLE' &&
                            renderIsoPrism(x + 0.18, y + 0.18, 0.64, 0.64, 0, 8, '#fcd34d', '#b45309', '#78350f', INK, 1)}
                          {dType === 'PLAY_HOPSCOTCH' && (
                            <polygon
                              points={getTilePolygonPoints(x + 0.15, y + 0.15, 0.7, 0.7, 1)}
                              fill="#4ade80"
                              stroke="#fef08a"
                              strokeWidth="1.2"
                            />
                          )}
                          {dType === 'FIRE_PIT' && (
                            <g>
                              {renderIsoPrism(x + 0.28, y + 0.28, 0.44, 0.44, 0, 6, '#44403c', '#292524', '#1c1917', INK, 1)}
                              <circle cx={pt.x} cy={pt.y - 6} r="4.5" fill="#f97316" />
                            </g>
                          )}
                        </g>
                      );
                    })}
                </g>
              );
            })()}

            {/* ================================================================
                9. LEVENDE BEWONERS OP STRAAT (WERK, BOODSCHAPPEN, TUIN, SPELEN)
                Monument Valley-stijl pionnetjes met schaduw & activiteit-badge!
            ================================================================ */}
            {activeWalkers.map((w) => {
              const pos = isoToScreen(w.gx, w.gy, 3);
              const isSelected = selectedResidentId === w.resident.id;
              const isChild = w.resident.lifeStage === 'CHILD';
              const bodyHeight = isChild ? 10 : 14;

              return (
                <g
                  key={`walker_${w.resident.id}`}
                  data-interactive="true"
                  className="cursor-pointer"
                  transform={`translate(${pos.x}, ${pos.y - w.hop})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResidentId(w.resident.id);
                    setSelectedUnitId(w.resident.unitId);
                    setSelectedBuildingId(
                      gameState.units[w.resident.unitId]?.buildingId || 'b_flat'
                    );
                    setActiveRightTab('RESIDENT');
                  }}
                >
                  {/* Grondschaduw */}
                  <ellipse
                    cx="0"
                    cy={w.hop + 2}
                    rx={isChild ? 5 : 6.5}
                    ry="3"
                    fill="#0f172a"
                    opacity="0.35"
                  />

                  {/* Monument Valley Pion-Lichaam (Kegel/Cilinder met Mantel) */}
                  <path
                    d={`M ${-5} 0 L ${-3} ${-bodyHeight} L ${3} ${-bodyHeight} L ${5} 0 Z`}
                    fill={w.resident.avatarColor}
                    stroke={isSelected ? '#fbbf24' : '#1c1917'}
                    strokeWidth={isSelected ? '2' : '1'}
                  />

                  {/* Hoofdje */}
                  <circle
                    cx="0"
                    cy={-bodyHeight - 4}
                    r={isChild ? 3.8 : 4.5}
                    fill="#fde68a"
                    stroke="#1c1917"
                    strokeWidth="1"
                  />

                  {/* Activiteit-Icoon & Naamplaatje bij selectie of actie */}
                  <g transform={`translate(0, ${-bodyHeight - 15})`}>
                    <rect
                      x={isSelected ? -46 : -10}
                      y="-9"
                      width={isSelected ? 92 : 20}
                      height="13"
                      rx="6"
                      fill={isSelected ? '#1c1917' : 'rgba(28,25,23,0.78)'}
                      stroke={isSelected ? '#fbbf24' : 'none'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="0.5"
                      textAnchor="middle"
                      fill="#fef3c7"
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      {isSelected ? `${w.badge} ${w.resident.firstName}: ${w.activityText}` : w.badge}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* ================================================================
                9. DYNAMISCHE WEEREFFECTEN (REGEN, SNEEUW, LENTEBLOESEM, HERFSTBLADEREN)
                + DAG/NACHT SFEER-OVERLAY
            ================================================================ */}
            <rect
              x="0"
              y="0"
              width="900"
              height="600"
              fill={todMeta.ambientOverlay}
              pointerEvents="none"
            />

            {currentWeather !== 'CLEAR' && (
              <g pointerEvents="none">
                {Array.from({ length: 28 }).map((_, i) => {
                  const px = ((i * 97 + animPhase * (currentWeather === 'RAIN' ? 90 : 35)) % 860) + 20;
                  const py = ((i * 67 + animPhase * (currentWeather === 'RAIN' ? 240 : 75)) % 540) + 20;

                  if (currentWeather === 'RAIN') {
                    return (
                      <line
                        key={`wx_${i}`}
                        x1={px}
                        y1={py}
                        x2={px - 5}
                        y2={py + 13}
                        stroke="#bae6fd"
                        strokeWidth="1.3"
                        opacity="0.65"
                      />
                    );
                  }
                  if (currentWeather === 'SNOW') {
                    return (
                      <circle
                        key={`wx_${i}`}
                        cx={px + Math.sin(animPhase * 3 + i) * 8}
                        cy={py}
                        r={2 + (i % 2)}
                        fill="#ffffff"
                        opacity="0.85"
                      />
                    );
                  }
                  // BLOSSOM of LEAVES
                  return (
                    <ellipse
                      key={`wx_${i}`}
                      cx={px + Math.cos(animPhase * 2 + i) * 10}
                      cy={py}
                      rx="3.5"
                      ry="2"
                      fill={currentWeather === 'BLOSSOM' ? '#fbcfe8' : '#ea580c'}
                      opacity="0.8"
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {/* Onderste Event-Ticker balk op het Canvas */}
          <div className="absolute bottom-3 left-3 right-36 z-20 hidden sm:flex items-center gap-2 bg-stone-900/90 backdrop-blur text-amber-50 px-3 py-1.5 rounded-xl border border-stone-700 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300 shrink-0">Leven op Straat:</span>
            <span className="truncate text-stone-200">
              {activeWalkers[0]
                ? `${activeWalkers[0].badge} ${activeWalkers[0].resident.firstName} (${activeWalkers[0].activityText}) • ${gameState.eventLog[0]?.text}`
                : gameState.eventLog[0]?.text}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            RECHTERPANEEL: INTERACTIEVE DATA-DOSSIERS (WONING, BEWONER, VRIJE INRICHTING, MISSIES)
        ------------------------------------------------------------------ */}
        <aside className="w-full lg:w-[450px] xl:w-[490px] h-[52vh] lg:h-full bg-amber-50 border-t-2 lg:border-t-0 lg:border-l-2 border-amber-900/15 flex flex-col z-20 shadow-xl">
          {/* Dossier Tabbladen (Nu 5 Tabbladen inclusief Vrije Inrichting!) */}
          <div className="grid grid-cols-5 gap-1 p-2 bg-amber-100/80 border-b border-amber-900/10 text-[11px] font-bold">
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setActiveRightTab('BUILDING');
              }}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition ${
                activeRightTab === 'BUILDING'
                  ? 'bg-stone-900 text-amber-50 shadow-xs'
                  : 'text-stone-700 hover:bg-amber-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pand</span>
            </button>
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setActiveRightTab('RESIDENT');
              }}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition ${
                activeRightTab === 'RESIDENT'
                  ? 'bg-stone-900 text-amber-50 shadow-xs'
                  : 'text-stone-700 hover:bg-amber-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Bewoner</span>
            </button>
            <button
              onClick={() => {
                setActiveRightTab('DECORATE');
                if (!selectedBrushId) setSelectedBrushId('TREE_BLOSSOM');
              }}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition ${
                activeRightTab === 'DECORATE'
                  ? 'bg-fuchsia-800 text-white shadow-xs'
                  : 'text-fuchsia-900 hover:bg-fuchsia-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Inrichten</span>
            </button>
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setActiveRightTab('MISSIONS');
              }}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition ${
                activeRightTab === 'MISSIONS'
                  ? 'bg-stone-900 text-amber-50 shadow-xs'
                  : 'text-stone-700 hover:bg-amber-200/60'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Missies ({completedMissionsCount}/4)</span>
            </button>
            <button
              onClick={() => {
                setSelectedBrushId(null);
                setActiveRightTab('MATH');
              }}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1 transition ${
                activeRightTab === 'MATH'
                  ? 'bg-stone-900 text-amber-50 shadow-xs'
                  : 'text-stone-700 hover:bg-amber-200/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Wiskunde</span>
            </button>
          </div>

          {/* Scrollbare Dossier-Inhoud */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* ==============================================================
                NIEUW TABBLAD: VRIJE BUURT-INRICHTING, DAG/NACHT & WEER-STUDIO
            ============================================================== */}
            {activeRightTab === 'DECORATE' && (
              <div className="space-y-3">
                <div className="bg-fuchsia-950 text-fuchsia-50 rounded-2xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-fuchsia-300" />
                      Vrije Buurt-Aankleding (Klik op een Tegel)
                    </h2>
                    <button
                      onClick={() => setPayWithSK((v) => !v)}
                      className="px-2.5 py-1 rounded-xl bg-fuchsia-800 hover:bg-fuchsia-700 text-[11px] font-bold border border-fuchsia-400/40"
                    >
                      Betaal met: {payWithSK ? '💖 Sociaal Kapitaal (SK)' : '🪙 Wijkbudget (€)'}
                    </button>
                  </div>
                  <p className="text-xs text-fuchsia-200 leading-relaxed">
                    Kies hieronder een Monument Valley-decoratie en klik daarna op **elke gewenste
                    straat-, stoep-, gras- of pleintegel** op het 12×12 eiland. Elke geplaatste
                    decoratie verhoogt direct de omgevingskwaliteit $Q(g)$ en laat de grauwe
                    Oostblok-buurt verder opbloeien!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {FREE_DECORATION_CATALOG.map((item) => {
                    const isSelected = selectedBrushId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedBrushId(item.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-fuchsia-50 border-fuchsia-600 ring-2 ring-fuchsia-500/25'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                            {item.emoji}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-stone-900">{item.name}</div>
                            <div className="text-[11px] text-stone-600">{item.description}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-amber-50 text-[11px] font-bold">
                            {payWithSK ? `${item.costSK} SK` : `€ ${item.costMoney}`}
                          </span>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            +{Math.round(item.qualityBonus * 100)}% Tegelbloei
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setSelectedBrushId('REMOVE')}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      selectedBrushId === 'REMOVE'
                        ? 'bg-red-600 text-white border-red-700'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    🗑️ Gum-modus: Verwijder een geplaatste decoratie van een tegel
                  </button>
                </div>

                {/* Dag/Nacht & Weer Regisseur */}
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Dagritme & Seizoensweer Regisseur
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {Object.values(TIME_OF_DAY_META).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setAutoDayCycle(false);
                          setTimeOfDay(t.id);
                        }}
                        className={`py-1.5 px-2 rounded-xl font-bold border ${
                          timeOfDay === t.id
                            ? 'bg-stone-900 text-amber-50 border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {t.shortLabel}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['AUTO', 'CLEAR', 'BLOSSOM', 'RAIN', 'LEAVES', 'SNOW'].map((wKey) => (
                      <button
                        key={wKey}
                        onClick={() => setWeatherOverride(wKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          weatherOverride === wKey
                            ? 'bg-sky-700 text-white border-sky-800'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {wKey === 'AUTO' ? '🔄 Auto Seizoensweer' : WEATHER_META[wKey].badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB 1: GEBOUW- & WONING-DOSSIER (CUTAWAY ROOMS, UPGRADES, INSTROOM)
            ============================================================== */}
            {activeRightTab === 'BUILDING' && (
              <>
                {/* Gebouw Header */}
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {selectedBuilding.category === 'WALKUP_FLAT'
                          ? 'Portiekflat (Cutaway)'
                          : selectedBuilding.category === 'WORKER_HOUSE'
                          ? 'Arbeiderswoning'
                          : 'Buurtvoorziening'}
                      </span>
                      <h2 className="text-base font-bold text-stone-900 mt-1">
                        {selectedBuilding.name}
                      </h2>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-stone-500">Onderhoudsstaat</div>
                      <div className="font-bold text-stone-800">
                        {Math.round(selectedBuilding.conditionMultiplier * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Snelkiezer voor alle Gebouwen op het Grid */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap gap-1">
                    {Object.values(gameState.buildings).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBuildingId(b.id);
                          const firstUnitId = b.unitIds[0] || null;
                          setSelectedUnitId(firstUnitId);
                          if (firstUnitId && gameState.units[firstUnitId]?.occupiedByHouseholdId) {
                            const hh =
                              gameState.households[gameState.units[firstUnitId].occupiedByHouseholdId];
                            if (hh?.memberIds[0]) setSelectedResidentId(hh.memberIds[0]);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          selectedBuildingId === b.id
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {b.shortCode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Als het de Portiekflat is: Kamer-Kiezer (6 Cutaway Units) */}
                {selectedBuilding.unitIds.length > 1 && (
                  <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-700" />
                        Kies Woonlaag / Appartement in De Zwaluw
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['u_f2l', 'u_f2r', 'u_f1l', 'u_f1r', 'u_f0l', 'u_f0r'].map((uId) => {
                        const u = gameState.units[uId];
                        const hh = u.occupiedByHouseholdId
                          ? gameState.households[u.occupiedByHouseholdId]
                          : null;
                        const active = selectedUnitId === uId;
                        return (
                          <button
                            key={uId}
                            onClick={() => {
                              setSelectedUnitId(uId);
                              if (hh?.memberIds[0]) setSelectedResidentId(hh.memberIds[0]);
                            }}
                            className={`p-2 rounded-xl border text-left transition ${
                              active
                                ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20'
                                : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                              <span>{u.shortRoomCode} (Laag {u.floorLevel})</span>
                              {u.isSocialCooperative && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded">
                                  Coöp
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-600 truncate mt-0.5">
                              {hh
                                ? `${hh.familyName} (${Math.round(hh.averagePositivity)}%)`
                                : u.isReadyForOccupation
                                ? '✓ Vrij voor doorstroom!'
                                : '⚙ Moet verbouwd worden'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Details van de Geselecteerde Woonunit (Woningwaarde, Coöperatie, Bewoners) */}
                {selectedUnit && (
                  <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">
                          {selectedUnit.unitLabel}
                        </h3>
                        <p className="text-xs text-stone-600">
                          {selectedUnit.rooms} kamers • Woonlaag {selectedUnit.floorLevel} • Comfort{' '}
                          {Math.round(selectedUnit.comfortScore * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-stone-500">Woningwaarde</div>
                        <div className="text-sm font-bold text-stone-900">
                          € {selectedUnit.currentMarketValue.toLocaleString('nl-NL')}
                        </div>
                      </div>
                    </div>

                    {/* Coöperatie & Betaalbaarheid Status (Edge-case 3: Gentrificatie-bescherming) */}
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <div className="font-semibold text-stone-800 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-teal-700" />
                          {selectedUnit.isSocialCooperative
                            ? 'Verankerd als Buurtcoöperatie'
                            : 'Reguliere Marktprijs'}
                        </div>
                        <div className="text-[11px] text-stone-600">
                          Maandlast: <strong>€ {selectedUnit.currentMonthlyCost}/mnd</strong>
                          {selectedUnitValuation && selectedUnit.tenure === 'OWNER_OCCUPIED' && (
                            <span>
                              {' '}
                              • Overwaarde-verkoopkans:{' '}
                              <strong>
                                {Math.round(selectedUnitValuation.seasonalSellProbability * 100)}%
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                      {!selectedUnit.isSocialCooperative && (
                        <button
                          onClick={() => handleToggleCooperative(selectedUnit.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold shrink-0 transition"
                        >
                          Maak Coöperatie (20 SK)
                        </button>
                      )}
                    </div>

                    {/* Huidige Bewoners van deze Unit óf Doorstroom / Instroom Opties */}
                    {selectedHousehold ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-700">
                            Huishouden {selectedHousehold.familyName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              INCOME_META[selectedHousehold.incomeBracket]?.badge
                            }`}
                          >
                            {INCOME_META[selectedHousehold.incomeBracket]?.label} (€{' '}
                            {selectedHousehold.monthlyIncome}/mnd)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5">
                          {selectedHousehold.memberIds.map((mId) => {
                            const m = gameState.residents[mId];
                            if (!m) return null;
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setSelectedResidentId(m.id);
                                  setActiveRightTab('RESIDENT');
                                }}
                                className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-900/15 flex items-center justify-between cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ backgroundColor: m.avatarColor }}
                                  >
                                    {m.firstName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                      {m.firstName} {m.lastName}
                                      <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded ${
                                          LIFE_STAGE_META[m.lifeStage]?.badge
                                        }`}
                                      >
                                        {LIFE_STAGE_META[m.lifeStage]?.label}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-stone-600 italic truncate max-w-[230px]">
                                      "{m.currentThoughtBubble}"
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-emerald-800">
                                    {Math.round(m.positivity)}%
                                  </div>
                                  <div className="text-[10px] text-rose-700">
                                    +{m.dailySocialCapitalOutput} SK/d
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Speciale knop als Meneer Koos of Starter Emre kan doorstromen naar een vrije unit! */}
                        {selectedHousehold.wantsInternalMoveToGroundFloor && (
                          <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-400 text-xs space-y-1.5">
                            <div className="font-bold text-amber-950 flex items-center gap-1.5">
                              <Shuffle className="w-4 h-4 text-amber-700" />
                              Wens tot Interne Woningruil (Gelijkvloers)
                            </div>
                            <p className="text-[11px] text-amber-900">
                              Meneer Koos (78) heeft moeite met de 2 trappen. Verbouw eerst{' '}
                              <strong>Flat 0-Rechts (Begane Grond)</strong> tot Senioren-Studio om hem met
                              behoud van zijn buren te laten verhuizen!
                            </p>
                            {readyVacantUnits
                              .filter((u) => u.floorLevel === 0)
                              .map((vacantUnit) => (
                                <button
                                  key={vacantUnit.id}
                                  onClick={() =>
                                    handleInternalMove(selectedHousehold.memberIds[0], vacantUnit.id)
                                  }
                                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
                                >
                                  Verhuis Koos naar {vacantUnit.unitLabel} (Behoud 100% Buren!)
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* VRIJE OF TE VERBOUWEN UNIT: TOON INTERNE DOORSTROOM ÓF SOFTMAX INSTROOM */
                      <div className="space-y-3 pt-1">
                        {!selectedUnit.isReadyForOccupation ? (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
                            <strong>Nog niet bewoonbaar:</strong> Voer hieronder eerst de renovatie-upgrade
                            uit om deze ruimte open te stellen voor doorstroom of nieuwe buren!
                          </div>
                        ) : (
                          <>
                            {/* Optie A: Laat wachtende buurtgenoten (Emre of Meneer Koos) intern doorstromen! */}
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <Shuffle className="w-4 h-4 text-emerald-700" />
                                Interne Wijk-Doorstroom (Voorrang voor eigen buurt!)
                              </div>
                              {gameState.residents.res_emre?.isDependent && (
                                <button
                                  onClick={() => handleInternalMove('res_emre', selectedUnit.id)}
                                  className="w-full py-1.5 px-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold flex items-center justify-between transition"
                                >
                                  <span>Laat Starter Emre Yilmaz (19) hier intrekken</span>
                                  <span>+22 SK Missie!</span>
                                </button>
                              )}
                              {gameState.households.hh_8?.wantsInternalMoveToGroundFloor &&
                                selectedUnit.floorLevel === 0 && (
                                  <button
                                    onClick={() => handleInternalMove('res_koos', selectedUnit.id)}
                                    className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-between transition"
                                  >
                                    <span>Verhuis Senior Meneer Koos (78) naar Begane Grond</span>
                                    <span>+25 SK Missie!</span>
                                  </button>
                                )}
                            </div>

                            {/* Optie B: Softmax Instroom-Algoritme (Loop 4) */}
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-stone-700">
                                Of verwelkom nieuw huishouden (Softmax Instroom-kans):
                              </div>
                              {inflowCandidates.slice(0, 3).map((cand) => (
                                <div
                                  key={cand.archetype.id}
                                  className="p-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-stone-900">
                                      {cand.archetype.sampleFamily.familyName} ({cand.archetype.name})
                                    </div>
                                    <div className="text-[11px] text-stone-600">
                                      Aantrekkings-kans: <strong>{Math.round(cand.probability * 100)}%</strong> •{' '}
                                      {INCOME_META[cand.archetype.incomeBracket]?.label}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleWelcomeNewHousehold(selectedUnit.id, cand.archetype)
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-700 text-amber-50 font-bold text-[11px] shrink-0"
                                  >
                                    Verwelkom
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* UPGRADE-SLOTS & BUURT-KLUSDAGEN (Gebouw + Specifieke Unit) */}
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    Beschikbare Upgrades & Gratis Buurt-Klusdagen
                  </h3>

                  {/* Unit-specifieke upgrades (bijv. Berging -> Seniorenstudio of Zolder -> Startersstudio) */}
                  {selectedUnit &&
                    selectedUnit.upgrades.map((up) => (
                      <div
                        key={up.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          up.isInstalled
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-amber-50/50 border-amber-300/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-stone-900">{up.name}</div>
                          {up.isInstalled ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                              Geïnstalleerd
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-900 shrink-0">
                              {up.costMoney > 0 ? `€ ${up.costMoney} + ` : 'Gratis Klusdag • '}
                              {up.costSocialCapital} SK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600">{up.description}</p>
                        {!up.isInstalled && (
                          <button
                            onClick={() =>
                              handleInstallUpgrade(selectedBuilding.id, up, selectedUnit.id)
                            }
                            className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-2xs"
                          >
                            Voer Kamer-Upgrade Uit ({up.costMoney > 0 ? `€ ${up.costMoney} & ` : ''}
                            {up.costSocialCapital} SK)
                          </button>
                        )}
                      </div>
                    ))}

                  {/* Gebouw-brede upgrades */}
                  {selectedBuilding.upgrades.map((up) => (
                    <div
                      key={up.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        up.isInstalled
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-stone-900">{up.name}</div>
                        {up.isInstalled ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                            Voltooid
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-900 shrink-0">
                            {up.costMoney === 0
                              ? `100% Klusdag (${up.costSocialCapital} SK)`
                              : `€ ${up.costMoney} + ${up.costSocialCapital} SK`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600">{up.description}</p>
                      {!up.isInstalled && (
                        <button
                          onClick={() => handleInstallUpgrade(selectedBuilding.id, up, null)}
                          className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs transition shadow-2xs ${
                            up.costMoney === 0
                              ? 'bg-rose-700 hover:bg-rose-800 text-white'
                              : 'bg-stone-900 hover:bg-stone-700 text-amber-50'
                          }`}
                        >
                          {up.costMoney === 0
                            ? `Organiseer Buurt-Klusdag (Kost € 0, alleen ${up.costSocialCapital} SK)`
                            : `Bouw Upgrade (€ ${up.costMoney} & ${up.costSocialCapital} SK)`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ==============================================================
                TAB 2: PERSOONS-DOSSIER (POSITIVITEIT-PIJLERS, LEVENSLOOP & RELATIES)
            ============================================================== */}
            {activeRightTab === 'RESIDENT' && selectedResident && (
              <>
                {/* Snelkiezer alle bewoners */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {Object.values(gameState.residents).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedResidentId(r.id);
                        setSelectedUnitId(r.unitId);
                        setSelectedBuildingId(gameState.units[r.unitId]?.buildingId || 'b_flat');
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 border transition ${
                        selectedResident.id === r.id
                          ? 'bg-stone-900 text-amber-50 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {r.firstName} ({Math.round(r.positivity)}%)
                    </button>
                  ))}
                </div>

                {/* Profielkaart */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0"
                      style={{ backgroundColor: selectedResident.avatarColor }}
                    >
                      {selectedResident.firstName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-stone-900">
                          {selectedResident.firstName} {selectedResident.lastName}
                        </h2>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            LIFE_STAGE_META[selectedResident.lifeStage]?.badge
                          }`}
                        >
                          {LIFE_STAGE_META[selectedResident.lifeStage]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{selectedResident.bioText}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedResident.traits.map((tr) => (
                          <span
                            key={tr}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700"
                          >
                            #{tr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gedachtewolkje */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 italic flex items-center gap-2">
                    <MessageCircleHeart className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>"{selectedResident.currentThoughtBubble}"</span>
                  </div>

                  {/* Uitsplitsing van de 4 Positiviteits-Pijlers (Formule Loop 2) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Opbouw Positiviteit (Loop 2 Formule)</span>
                      <span className="text-emerald-800">
                        Actueel: {selectedResident.positivity}% (Doel:{' '}
                        {selectedResident.positivityBreakdown.totalTarget}%)
                      </span>
                    </div>

                    {[
                      {
                        label: '1. Wooncomfort & Betaalbaarheid',
                        val: selectedResident.positivityBreakdown.housingAndAffordability,
                        max: 35,
                        color: 'bg-amber-500'
                      },
                      {
                        label: `2. Omgeving & Seizoen (${seasonInfo.label})`,
                        val: selectedResident.positivityBreakdown.environmentAndSeason,
                        max: 25,
                        color: 'bg-emerald-500'
                      },
                      {
                        label: '3. Sociale Relaties in de Buurt',
                        val: selectedResident.positivityBreakdown.socialRelationships,
                        max: 25,
                        color: 'bg-rose-500'
                      },
                      {
                        label: '4. Levensfase-Behoefte (Speelplek/Trap/Starter)',
                        val: selectedResident.positivityBreakdown.lifeStageNeeds,
                        max: 15,
                        color:
                          selectedResident.positivityBreakdown.lifeStageNeeds < 0
                            ? 'bg-red-500'
                            : 'bg-indigo-500'
                      }
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] text-stone-600">
                          <span>{bar.label}</span>
                          <span className="font-bold text-stone-800">
                            {bar.val} / {bar.max} pt
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} transition-all duration-300`}
                            style={{
                              width: `${Math.max(8, Math.min(100, (Math.abs(bar.val) / bar.max) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sociale Relaties & "Koppel Buren" Actie */}
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <HandHeart className="w-3.5 h-3.5 text-rose-600" />
                    Burennetwerk & Koffiemomenten
                  </h3>

                  {Object.values(gameState.relationships)
                    .filter(
                      (r) =>
                        r.residentAId === selectedResident.id ||
                        r.residentBId === selectedResident.id
                    )
                    .map((rel) => {
                      const otherId =
                        rel.residentAId === selectedResident.id
                          ? rel.residentBId
                          : rel.residentAId;
                      const other = gameState.residents[otherId];
                      if (!other) return null;
                      const isFriction = rel.type === 'FRICTION';

                      return (
                        <div
                          key={rel.id}
                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                            isFriction
                              ? 'bg-red-50 border-red-300'
                              : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-stone-900">
                              Met {other.firstName} {other.lastName}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isFriction
                                  ? 'bg-red-200 text-red-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {isFriction
                                ? 'Lichte Buren-Frictie'
                                : `Band: ${rel.strength}%`}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 italic">
                            "{rel.sharedMemories[0]}"
                          </p>
                          <button
                            onClick={() => handleBoostRelationship(rel.id)}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] transition"
                          >
                            {isFriction
                              ? 'Organiseer Verzoenings-Koffie in Portiek (Kost 8 SK • +20 SK Missie!)'
                              : 'Samen Koffiedrinken op het Plein (Kost 8 SK • +32% Band)'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {/* ==============================================================
                TAB 3: VERHALENDE BUURT-MISSIES (LEVEL 1 DOELEN)
            ============================================================== */}
            {activeRightTab === 'MISSIONS' && (
              <div className="space-y-3">
                <div className="bg-amber-100/80 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950">
                  <strong>Level 1 Doel ("De Grauwe Arbeidershoek"):</strong> Los de 4 menselijke
                  buurtvraagstukken op zonder dat oorspronkelijke bewoners weggedrukt worden!
                </div>

                {gameState.activeMissions.map((m) => {
                  const giver = gameState.residents[m.giverResidentId];
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border shadow-2xs space-y-2 ${
                        m.completed
                          ? 'bg-emerald-50/90 border-emerald-400'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          {m.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                          +€ {m.rewardMoney} & +{m.rewardSK} SK
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{m.narrativeText}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-stone-500">
                          Van: <strong>{giver?.firstName} {giver?.lastName}</strong>
                        </span>
                        {!m.completed && (
                          <button
                            onClick={() => {
                              setSelectedBuildingId(m.targetBuildingId);
                              if (m.targetBuildingId === 'b_flat') {
                                setSelectedUnitId(
                                  m.targetInternalMoveResidentId
                                    ? 'u_f0r'
                                    : m.targetStarterResidentId
                                    ? 'u_f2r'
                                    : 'u_f1l'
                                );
                              } else {
                                setSelectedUnitId(null);
                              }
                              if (m.targetRelationshipId) {
                                setSelectedResidentId('res_tijn');
                                setActiveRightTab('RESIDENT');
                              } else {
                                setActiveRightTab('BUILDING');
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-700 text-amber-50 text-xs font-bold flex items-center gap-1"
                          >
                            <span>Ga naar locatie</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ==============================================================
                TAB 4: LIVE WISKUNDIGE SIMULATIE-TELEMETRIE (GDD SECTIE 2)
            ============================================================== */}
            {activeRightTab === 'MATH' && (
              <div className="space-y-3 text-xs">
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm">
                    1. Woningwaarde & Sigmoid Verkoopkans (Loop 1)
                  </h3>
                  <p className="text-stone-600 text-[11px]">
                    Wijkbinding ($B_&#123;\text&#123;binding&#125;&#125;$) verschuift het omslagpunt naar rechts zodat
                    gewortelde buren hun huis niet verkopen bij stijgende prijzen:
                  </p>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1">
                    {['u_hw1', 'u_hw3', 'u_hw4', 'u_f1r'].map((uId) => {
                      const u = gameState.units[uId];
                      const hh = gameState.households[u.occupiedByHouseholdId];
                      const bld = gameState.buildings[u.buildingId];
                      const val = computeUnitValuation(
                        u,
                        bld,
                        hh,
                        gameState.tiles,
                        gameState.averagePositivity
                      );
                      return (
                        <div key={uId} className="flex justify-between text-[11px] py-1 border-b border-stone-200/60 last:border-0">
                          <span className="font-semibold">{u.unitLabel} ({hh?.familyName})</span>
                          <span>
                            € {val.actualValue.toLocaleString('nl-NL')} • Binding{' '}
                            {Math.round((hh?.neighborhoodAttachment || 0) * 100)}% • Kans:{' '}
                            <strong>{Math.round(val.seasonalSellProbability * 100)}%/seizoen</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm">
                    2. Mozaïek-Diversiteitsmultiplier (Sectie 1.3 & 2.2)
                  </h3>
                  <p className="text-stone-600 text-[11px]">
                    Actuele vermenigvuldiger op Sociaal Kapitaal:{' '}
                    <strong className="text-teal-800">×{gameState.diversityMultiplier}</strong> (Mix van
                    Lage, Midden & Hoge inkomens én alle levensfasen van Kind tot Senior).
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
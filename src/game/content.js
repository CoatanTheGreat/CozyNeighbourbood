// Alle inhoud van de buurt: mensen, huizen, verbeteringen en de beginsituatie.

export const LIFE_STAGE = {
  BABY: { label: 'Baby', roleWeight: 0.2 },
  CHILD: { label: 'Kind', roleWeight: 0.6 },
  YOUTH: { label: 'Jongere', roleWeight: 1.0 },
  ADULT: { label: 'Volwassene', roleWeight: 1.2 },
  SENIOR: { label: 'Senior', roleWeight: 1.6 }
};

export function lifeStageOf(age) {
  if (age < 4) return 'BABY';
  if (age < 13) return 'CHILD';
  if (age < 24) return 'YOUTH';
  if (age < 66) return 'ADULT';
  return 'SENIOR';
}

export const INCOME_LABEL = {
  LOW: 'Klein inkomen',
  MIDDLE: 'Middeninkomen',
  HIGH: 'Ruim inkomen'
};

export const TENURE_LABEL = {
  OWNER: 'Koophuis',
  SOCIAL: 'Sociale huur',
  PRIVATE: 'Particuliere huur'
};

export const AVATAR_COLORS = ['#e07a5f', '#3d9a8b', '#e9c46a', '#f4a261', '#81b29a', '#6d7fcc', '#c2667e', '#8e7cc3'];
export const SKIN_TONES = ['#f6d7b8', '#e9b98f', '#c98d63', '#a0663f', '#7a4b2a'];

// Huishoudtypes die kunnen komen wonen
export const ARCHETYPES = {
  STARTER: {
    name: 'Jonge starters',
    income: 'LOW',
    monthlyIncome: 2100,
    budget: 760,
    minRooms: 1,
    groundFloor: false,
    weights: { green: 0.25, kids: 0.05, social: 0.35, culture: 0.35 },
    families: ['Groeneveld', 'Bos', 'Kaya', 'Visser'],
    members: [{ stage: 'YOUTH', age: 23, names: ['Lieke', 'Sem', 'Yara', 'Jesse'], traits: ['Nieuw in de buurt', 'Muziekliefhebber'] }]
  },
  FAMILY: {
    name: 'Gezin',
    income: 'LOW',
    monthlyIncome: 2550,
    budget: 860,
    minRooms: 3,
    groundFloor: false,
    weights: { green: 0.25, kids: 0.4, social: 0.3, culture: 0.05 },
    families: ['De Groot', 'Jansen', 'Pinas', 'Bakir'],
    members: [
      { stage: 'ADULT', age: 36, names: ['Kevin', 'Ruben', 'Hamza'], traits: ['Handige klusser'] },
      { stage: 'ADULT', age: 34, names: ['Chantal', 'Fleur', 'Aylin'], traits: ['Buurtverbinder'] },
      { stage: 'CHILD', age: 6, names: ['Finn', 'Noa', 'Zara'], traits: ['Buitenspeler'] }
    ]
  },
  MAKER: {
    name: 'Creatieve maker',
    income: 'MIDDLE',
    monthlyIncome: 3100,
    budget: 1050,
    minRooms: 2,
    groundFloor: false,
    weights: { green: 0.3, kids: 0.05, social: 0.25, culture: 0.4 },
    families: ['Van Dongen', 'Mertens', 'Okafor'],
    members: [{ stage: 'ADULT', age: 32, names: ['Mirthe', 'Jip', 'Ada'], traits: ['Keramist', 'Moestuinier'] }]
  },
  CONNECTOR: {
    name: 'Zorg en onderwijs',
    income: 'MIDDLE',
    monthlyIncome: 3250,
    budget: 1100,
    minRooms: 2,
    groundFloor: false,
    weights: { green: 0.25, kids: 0.2, social: 0.45, culture: 0.1 },
    families: ['Tahiri', 'Van Leeuwen', 'Mensah'],
    members: [
      { stage: 'ADULT', age: 38, names: ['Karim', 'Thijs', 'Kofi'], traits: ['Buurtwerker', 'Kookt graag'] },
      { stage: 'ADULT', age: 36, names: ['Amina', 'Sara', 'Iris'], traits: ['Juf', 'Plantenliefhebber'] }
    ]
  },
  SENIORS: {
    name: 'Vitale senioren',
    income: 'MIDDLE',
    monthlyIncome: 2650,
    budget: 950,
    minRooms: 2,
    groundFloor: true,
    weights: { green: 0.4, kids: 0.05, social: 0.4, culture: 0.15 },
    families: ['Verhagen', 'Smit', 'De Wit'],
    members: [
      { stage: 'SENIOR', age: 71, names: ['Gerard', 'Henk', 'Wim'], traits: ['Oud-hovenier'] },
      { stage: 'SENIOR', age: 69, names: ['Ria', 'Thea', 'Joke'], traits: ['Bakt appeltaart'] }
    ]
  },
  AFFLUENT: {
    name: 'Welvarende nieuwkomers',
    income: 'HIGH',
    monthlyIncome: 4900,
    budget: 1750,
    minRooms: 3,
    groundFloor: false,
    weights: { green: 0.45, kids: 0.15, social: 0.1, culture: 0.3 },
    families: ['Bentvelsen', 'Van Rijn', 'De Kort'],
    members: [
      { stage: 'ADULT', age: 40, names: ['Olivier', 'Maarten', 'Floris'], traits: ['Architect'] },
      { stage: 'ADULT', age: 38, names: ['Claire', 'Sophie', 'Merel'], traits: ['Werkt veel in de stad'] }
    ]
  }
};

// Wandelingen per levensfase voor nieuwe bewoners
export const DEFAULT_ROUTINES = {
  BABY: [],
  CHILD: ['plein', 'speelplein', 'school'],
  YOUTH: ['plein', 'winkel', 'werk_o', 'oever'],
  ADULT: ['werk_w', 'winkel', 'plein', 'buurthuis'],
  SENIOR: ['pleinbank', 'winkel', 'oever']
};

// Wat je zelf mag neerzetten. Prijzen in euro óf in buurtgevoel.
export const DECORATIONS = {
  TREE: { name: 'Bloesemboom', emoji: '🌸', money: 55, sk: 4, quality: 0.18, amenity: 'TREES', desc: 'Kleur, schaduw en vogels.' },
  BENCH: { name: 'Bankje', emoji: '🪑', money: 45, sk: 3, quality: 0.16, amenity: 'BENCH', desc: 'Een plek voor een praatje.' },
  LAMP: { name: 'Lantaarn', emoji: '🏮', money: 40, sk: 3, quality: 0.15, amenity: 'LAMP', desc: 'Warm licht op donkere avonden.' },
  PLANTER: { name: 'Bloembak', emoji: '🌷', money: 30, sk: 2, quality: 0.13, amenity: 'FLOWERS', desc: 'Bloemen in plaats van beton.' },
  PICNIC: { name: 'Picknicktafel', emoji: '🧺', money: 65, sk: 5, quality: 0.2, amenity: 'MEET', desc: 'Samen eten en koffie drinken.' },
  HOPSCOTCH: { name: 'Hinkelbaan', emoji: '🎨', money: 35, sk: 3, quality: 0.17, amenity: 'PLAY_SMALL', desc: 'Stoepkrijt en spelletjes.' },
  FIREPIT: { name: 'Vuurkorf', emoji: '🔥', money: 60, sk: 5, quality: 0.21, amenity: 'FIRE', desc: 'Warm samenzijn in de kou.' }
};

const up = (id, name, desc, money, sk, fx = {}) => ({ id, name, desc, money, sk, installed: false, ...fx });

function makeBuildings() {
  return {
    b_hw1: {
      id: 'b_hw1',
      name: 'Huisje nr. 1',
      kind: 'HOUSE',
      condition: 0.92,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_hw1'],
      upgrades: [
        up('up_hw1_garden', 'Geveltuin met stokrozen', 'Samen met de buren tegels wippen en bloemen planten.', 0, 18, { comfort: 0.08, value: 0.05 }),
        up('up_hw1_insul', 'Spouwmuur- en dakisolatie', 'Warmer in de winter, lagere energierekening.', 420, 12, { comfort: 0.16, value: 0.1, insul: true })
      ]
    },
    b_hw2: {
      id: 'b_hw2',
      name: 'Huisje nr. 2',
      kind: 'HOUSE',
      condition: 0.85,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_hw2'],
      upgrades: [
        up('up_hw2_bench', 'Bankje bij de voordeur', 'Een zonnig bankje waar Tante Annie buren ontmoet.', 0, 15, { comfort: 0.14, value: 0.06, amenity: 'BENCH' }),
        up('up_hw2_insul', 'Tochtstrips en dubbel glas', 'Het oude huisje houdt de warmte vast.', 360, 10, { comfort: 0.15, value: 0.09, insul: true })
      ]
    },
    b_hw3: {
      id: 'b_hw3',
      name: 'Huisje nr. 3',
      kind: 'HOUSE',
      condition: 0.9,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_hw3'],
      upgrades: [
        up('up_hw3_dormer', 'Dakkapel en isolatie', 'Meer ruimte en warmte voor de familie Yilmaz.', 450, 12, { comfort: 0.16, value: 0.12, insul: true })
      ]
    },
    b_hw4: {
      id: 'b_hw4',
      name: 'Klushuisje nr. 4',
      kind: 'HOUSE',
      condition: 0.75,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_hw4'],
      upgrades: [
        up('up_hw4_klus', 'Dak en gevel opknappen', 'De buren helpen Bram en Lotte met het lekkende dak.', 0, 22, { comfort: 0.22, value: 0.09, insul: true }),
        up('up_hw4_solar', 'Zonnepanelen', 'Scheelt Bram en Lotte € 140 per maand.', 480, 10, { comfort: 0.12, value: 0.11, lowersCost: 140 })
      ]
    },
    b_hw6: {
      id: 'b_hw6',
      name: 'Leeg huisje nr. 6',
      kind: 'HOUSE',
      condition: 0.65,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_hw6'],
      upgrades: [
        up('up_hw6_restore', 'Huisje opknappen', 'Dichtgetimmerde ramen eruit, weer bewoonbaar maken.', 550, 20, { comfort: 0.3, value: 0.2, unlocks: 'u_hw6' })
      ]
    },
    b_flat: {
      id: 'b_flat',
      name: 'Portiekflat De Zwaluw',
      kind: 'FLAT',
      condition: 0.8,
      hasElevator: false,
      insulated: false,
      unitIds: ['u_f0l', 'u_f0r', 'u_f1l', 'u_f1r', 'u_f2l', 'u_f2r'],
      upgrades: [
        up('up_flat_balcony', 'Plantenbakken en bloesemboom', 'Bloemen aan alle balkons en een bloesemboom bij de ingang.', 0, 20, { comfort: 0.1, value: 0.06 }),
        up('up_flat_roof', 'Groen dak met dakterras', 'Sedumdak, zonnepanelen en een houten dakterras voor iedereen.', 750, 25, { comfort: 0.14, value: 0.14, insul: true }),
        up('up_flat_lift', 'Lift en fietsenstalling', 'De bovenste verdiepingen worden bereikbaar zonder trap.', 950, 30, { comfort: 0.12, value: 0.15, elevator: true, bikes: true })
      ]
    },
    b_school: {
      id: 'b_school',
      name: 'Basisschool en speelplaats',
      kind: 'SCHOOL',
      condition: 0.7,
      hasElevator: true,
      insulated: false,
      unitIds: [],
      upgrades: [
        up('up_school_paint', 'Vrolijke schoolgevel', 'Graffiti weg, gevel in kleur en zonnepanelen op het dak.', 0, 20, { comfort: 0.15, value: 0.12, tileBonus: { area: 'playground', amount: 0.2 } }),
        up('up_school_field', 'Groen sportveld en fietsenrekken', 'Een veilig sportveld en klimrek voor de kinderen.', 450, 15, { comfort: 0.12, value: 0.1, amenity: 'PLAYGROUND', bikes: true, tileBonus: { area: 'playground', amount: 0.2 } })
      ]
    },
    b_hub: {
      id: 'b_hub',
      name: 'Wijkgebouw',
      kind: 'HUB',
      condition: 0.72,
      hasElevator: true,
      insulated: true,
      unitIds: [],
      upgrades: [
        up('up_hub_center', 'Buurtkamer met koffiehoek', 'Een warme buurtkamer, struiken en laadpalen bij de slagboom.', 620, 25, { comfort: 0.2, value: 0.15, amenity: 'COFFEE', tileBonus: { area: 'forecourt', amount: 0.25 } })
      ]
    },
    b_shop: {
      id: 'b_shop',
      name: 'Supermarkt op de hoek',
      kind: 'SHOP',
      condition: 0.75,
      hasElevator: true,
      insulated: false,
      unitIds: [],
      upgrades: [
        up('up_shop_market', 'Gevelherstel en groentekramen', 'Scheuren uit de gevel en verse groente en bloemen op de stoep.', 280, 25, { comfort: 0.15, value: 0.14, amenity: 'MARKET', tileBonus: { area: 'self', amount: 0.3 } })
      ]
    },
    p_plein: {
      id: 'p_plein',
      name: 'Het Zwaluwplein',
      kind: 'PLACE',
      condition: 0.6,
      hasElevator: true,
      insulated: false,
      unitIds: [],
      upgrades: [
        up('up_plein_klus', 'Tegels eruit, groen erin', 'Met een klusdag: bomen planten, bankjes neerzetten, gras zaaien.', 0, 20, { comfort: 0.12, value: 0.08, amenity: 'BENCH', tileBonus: { area: 'p_plein', amount: 0.35 } }),
        up('up_plein_play', 'Klimrek en zandbak', 'Eindelijk een echte speelplek midden in de buurt.', 380, 12, { comfort: 0.1, value: 0.06, amenity: 'PLAYGROUND', tileBonus: { area: 'p_plein', amount: 0.15 } })
      ]
    },
    p_garden: {
      id: 'p_garden',
      name: 'Het verwilderde veldje',
      kind: 'PLACE',
      condition: 0.6,
      hasElevator: true,
      insulated: false,
      unitIds: [],
      upgrades: [
        up('up_garden', 'Buurtmoestuin aanleggen', 'Bakken met kruiden, tomaten en bloemen. Iedereen mag oogsten.', 0, 16, { comfort: 0.1, value: 0.06, amenity: 'GARDEN', tileBonus: { area: 'p_garden', amount: 0.35 } })
      ]
    }
  };
}

const unit = (o) => ({
  upgrades: [],
  coop: false,
  ...o,
  value: o.baseValue,
  baseCost: o.monthlyCost
});

function makeUnits() {
  return {
    u_hw1: unit({ id: 'u_hw1', buildingId: 'b_hw1', label: 'Huisje nr. 1', floor: 0, rooms: 4, maxOccupants: 4, ready: true, tenure: 'OWNER', baseValue: 215000, monthlyCost: 780, comfort: 0.68, householdId: 'hh_1' }),
    u_hw2: unit({ id: 'u_hw2', buildingId: 'b_hw2', label: 'Huisje nr. 2', floor: 0, rooms: 3, maxOccupants: 2, ready: true, tenure: 'SOCIAL', coop: true, baseValue: 185000, monthlyCost: 560, comfort: 0.62, householdId: 'hh_2' }),
    u_hw3: unit({ id: 'u_hw3', buildingId: 'b_hw3', label: 'Huisje nr. 3', floor: 0, rooms: 3, maxOccupants: 3, ready: true, tenure: 'OWNER', baseValue: 210000, monthlyCost: 740, comfort: 0.65, householdId: 'hh_3' }),
    u_hw4: unit({ id: 'u_hw4', buildingId: 'b_hw4', label: 'Klushuisje nr. 4', floor: 0, rooms: 3, maxOccupants: 3, ready: true, tenure: 'OWNER', baseValue: 195000, monthlyCost: 920, comfort: 0.48, householdId: 'hh_4' }),
    u_hw6: unit({ id: 'u_hw6', buildingId: 'b_hw6', label: 'Huisje nr. 6', floor: 0, rooms: 3, maxOccupants: 4, ready: false, tenure: 'PRIVATE', baseValue: 180000, monthlyCost: 790, comfort: 0.42, householdId: null }),
    u_f0l: unit({ id: 'u_f0l', buildingId: 'b_flat', label: 'Begane grond links', code: '0L', floor: 0, side: 'L', rooms: 2, maxOccupants: 2, ready: true, tenure: 'SOCIAL', coop: true, baseValue: 165000, monthlyCost: 590, comfort: 0.64, householdId: 'hh_5' }),
    u_f0r: unit({
      id: 'u_f0r', buildingId: 'b_flat', label: 'Begane grond rechts', code: '0R', floor: 0, side: 'R', rooms: 2, maxOccupants: 2, ready: false, tenure: 'SOCIAL', coop: true, baseValue: 160000, monthlyCost: 550, comfort: 0.6, householdId: null,
      upgrades: [up('up_f0r_studio', 'Berging wordt seniorenstudio', 'Een drempelvrije studio op de begane grond.', 420, 18, { comfort: 0.2, value: 0.12, unlocks: 'u_f0r' })]
    }),
    u_f1l: unit({
      id: 'u_f1l', buildingId: 'b_flat', label: 'Eerste verdieping links', code: '1L', floor: 1, side: 'L', rooms: 3, maxOccupants: 3, ready: true, tenure: 'PRIVATE', baseValue: 175000, monthlyCost: 820, comfort: 0.58, householdId: 'hh_6',
      upgrades: [up('up_f1l_floor', 'Geluiddempende vloer', 'Minder loopgeluid voor de buren beneden en ernaast.', 260, 10, { comfort: 0.16, value: 0.06, resolvesNoise: true })]
    }),
    u_f1r: unit({ id: 'u_f1r', buildingId: 'b_flat', label: 'Eerste verdieping rechts', code: '1R', floor: 1, side: 'R', rooms: 2, maxOccupants: 2, ready: true, tenure: 'OWNER', baseValue: 180000, monthlyCost: 710, comfort: 0.66, householdId: 'hh_7' }),
    u_f2l: unit({ id: 'u_f2l', buildingId: 'b_flat', label: 'Tweede verdieping links', code: '2L', floor: 2, side: 'L', rooms: 2, maxOccupants: 2, ready: true, tenure: 'SOCIAL', coop: true, baseValue: 165000, monthlyCost: 540, comfort: 0.56, householdId: 'hh_8' }),
    u_f2r: unit({
      id: 'u_f2r', buildingId: 'b_flat', label: 'Tweede verdieping rechts', code: '2R', floor: 2, side: 'R', rooms: 2, maxOccupants: 2, ready: false, tenure: 'SOCIAL', coop: true, baseValue: 155000, monthlyCost: 520, comfort: 0.62, householdId: null,
      upgrades: [up('up_f2r_starter', 'Zolder wordt startersstudio', 'Een eigen plek voor een jongere uit de buurt.', 380, 20, { comfort: 0.22, value: 0.12, unlocks: 'u_f2r' })]
    })
  };
}

const hh = (o) => ({ daysLived: 100, attachment: 0.5, avgPositivity: 55, wantsGroundFloor: false, purchasePrice: null, ...o });

function makeHouseholds() {
  return {
    hh_1: hh({ id: 'hh_1', familyName: 'Van der Vliet', archetypeId: 'FAMILY', unitId: 'u_hw1', memberIds: ['res_joris', 'res_sanne', 'res_daan'], income: 'MIDDLE', monthlyIncome: 3200, purchasePrice: 205000, daysLived: 190, attachment: 0.65 }),
    hh_2: hh({ id: 'hh_2', familyName: 'Bakker', archetypeId: 'SENIORS', unitId: 'u_hw2', memberIds: ['res_annie'], income: 'LOW', monthlyIncome: 1750, daysLived: 640, attachment: 0.95 }),
    hh_3: hh({ id: 'hh_3', familyName: 'Yilmaz', archetypeId: 'FAMILY', unitId: 'u_hw3', memberIds: ['res_murat', 'res_elif', 'res_emre'], income: 'MIDDLE', monthlyIncome: 3100, purchasePrice: 198000, daysLived: 280, attachment: 0.78 }),
    hh_4: hh({ id: 'hh_4', familyName: 'De Vries en Meijer', archetypeId: 'STARTER', unitId: 'u_hw4', memberIds: ['res_bram', 'res_lotte'], income: 'MIDDLE', monthlyIncome: 2650, purchasePrice: 195000, daysLived: 18, attachment: 0.3 }),
    hh_5: hh({ id: 'hh_5', familyName: 'El Amrani', archetypeId: 'STARTER', unitId: 'u_f0l', memberIds: ['res_samir', 'res_noor'], income: 'LOW', monthlyIncome: 2350, daysLived: 64, attachment: 0.58 }),
    hh_6: hh({ id: 'hh_6', familyName: 'Koster', archetypeId: 'FAMILY', unitId: 'u_f1l', memberIds: ['res_naomi', 'res_mila'], income: 'LOW', monthlyIncome: 2200, daysLived: 45, attachment: 0.42 }),
    hh_7: hh({ id: 'hh_7', familyName: 'Vermeer', archetypeId: 'MAKER', unitId: 'u_f1r', memberIds: ['res_tijn'], income: 'MIDDLE', monthlyIncome: 2950, purchasePrice: 175000, daysLived: 40, attachment: 0.38 }),
    hh_8: hh({ id: 'hh_8', familyName: 'Hendriks', archetypeId: 'SENIORS', unitId: 'u_f2l', memberIds: ['res_koos'], income: 'LOW', monthlyIncome: 1680, daysLived: 520, attachment: 0.92, wantsGroundFloor: true })
  };
}

const res = (o) => ({
  isDependent: false,
  searchingDays: 0,
  positivity: 55,
  breakdown: { home: 20, surroundings: 10, neighbours: 15, needs: 8, target: 55 },
  skPerDay: 0.2,
  ...o
});

function makeResidents() {
  return {
    res_joris: res({ id: 'res_joris', firstName: 'Joris', lastName: 'van der Vliet', color: '#e07a5f', skin: '#f6d7b8', householdId: 'hh_1', unitId: 'u_hw1', age: 41, traits: ['Timmerman', 'Behulpzaam'], bio: 'Staat altijd klaar met zijn gereedschapskist.', thought: 'Met wat hout bouwen we zo een speeltoestel op het plein.', positivity: 63, routine: ['werk_w', 'plein', 'buurthuis'] }),
    res_sanne: res({ id: 'res_sanne', firstName: 'Sanne', lastName: 'van der Vliet', color: '#e9c46a', skin: '#f6d7b8', householdId: 'hh_1', unitId: 'u_hw1', age: 39, traits: ['Wijkverpleegkundige', 'Zorgzaam'], bio: 'Houdt een oogje in het zeil bij Tante Annie en Meneer Koos.', thought: 'Die trappen in de flat worden te zwaar voor Koos.', positivity: 64, routine: ['annie', 'flat', 'plein'] }),
    res_daan: res({ id: 'res_daan', firstName: 'Daan', lastName: 'van der Vliet', color: '#81b29a', skin: '#f6d7b8', householdId: 'hh_1', unitId: 'u_hw1', age: 8, isDependent: true, traits: ['Stoepkrijter', 'Energiek'], bio: 'Speelt graag buiten met Mila uit de flat.', thought: 'Was er maar een klimrek op het plein.', positivity: 52, routine: ['plein', 'school', 'speelplein'] }),
    res_annie: res({ id: 'res_annie', firstName: 'Annie', title: 'Tante Annie', lastName: 'Bakker', color: '#f4a261', skin: '#f6d7b8', householdId: 'hh_2', unitId: 'u_hw2', age: 81, traits: ['Kent iedereen', 'Rozen'], bio: 'Woont al 45 jaar op nummer 2 en schenkt graag thee.', thought: 'Een bankje en wat groen zou de straat zo opvrolijken.', positivity: 58, routine: ['pleinbank', 'winkel'] }),
    res_murat: res({ id: 'res_murat', firstName: 'Murat', lastName: 'Yilmaz', color: '#457b9d', skin: '#c98d63', householdId: 'hh_3', unitId: 'u_hw3', age: 47, traits: ['Bakker', 'Vroege vogel'], bio: 'Brengt op zaterdag verse broodjes naar Tante Annie.', thought: 'Emre verdient een eigen plekje hier in de buurt.', positivity: 59, routine: ['werk_n', 'annie', 'winkel'] }),
    res_elif: res({ id: 'res_elif', firstName: 'Elif', lastName: 'Yilmaz', color: '#a8dadc', skin: '#c98d63', householdId: 'hh_3', unitId: 'u_hw3', age: 45, traits: ['Penningmeester', 'Groene vingers'], bio: 'Wil verse kruiden kweken op het verwilderde veldje.', thought: 'Op dat veldje zou een prachtige moestuin passen.', positivity: 58, routine: ['moestuin', 'winkel', 'plein'] }),
    res_emre: res({ id: 'res_emre', firstName: 'Emre', lastName: 'Yilmaz', color: '#6d597a', skin: '#c98d63', householdId: 'hh_3', unitId: 'u_hw3', age: 19, isDependent: true, searchingDays: 26, traits: ['Geluidstechnicus'], bio: 'Wil op zichzelf wonen, maar wel in zijn eigen buurt.', thought: 'Een eigen studio hier in de buurt, dat zou mooi zijn.', positivity: 46, routine: ['plein', 'flat', 'werk_o'] }),
    res_bram: res({ id: 'res_bram', firstName: 'Bram', lastName: 'de Vries', color: '#bc6c25', skin: '#f6d7b8', householdId: 'hh_4', unitId: 'u_hw4', age: 29, traits: ['Doorzetter', 'Nieuw in de straat'], bio: 'Kocht met Lotte het klushuisje. Het geld is op en het dak lekt.', thought: 'Met hulp van de buren krijgen we dat dak wel dicht.', positivity: 47, routine: ['werk_w', 'winkel', 'moestuin'] }),
    res_lotte: res({ id: 'res_lotte', firstName: 'Lotte', lastName: 'Meijer', color: '#dda15e', skin: '#e9b98f', householdId: 'hh_4', unitId: 'u_hw4', age: 28, traits: ['Illustrator'], bio: 'Wil de buren beter leren kennen.', thought: 'Joris weet vast hoe we dat dakraam dicht krijgen.', positivity: 49, routine: ['oever', 'moestuin', 'plein'] }),
    res_samir: res({ id: 'res_samir', firstName: 'Samir', lastName: 'El Amrani', color: '#2a9d8f', skin: '#c98d63', householdId: 'hh_5', unitId: 'u_f0l', age: 31, traits: ['Barista', 'Gitaar'], bio: 'Droomt van een koffiehoek voor de hele buurt.', thought: 'In het wijkgebouw past een mooie koffiehoek.', positivity: 64, routine: ['buurthuis', 'plein', 'werk_o'] }),
    res_noor: res({ id: 'res_noor', firstName: 'Noor', lastName: 'El Amrani', color: '#e9c46a', skin: '#a0663f', householdId: 'hh_5', unitId: 'u_f0l', age: 30, traits: ['Ontwerper', 'Deelt stekjes'], bio: 'Zet plantenstekjes in de vensterbank van het portiek.', thought: 'Het portiek kan wel wat groen gebruiken.', positivity: 65, routine: ['moestuin', 'plein', 'winkel'] }),
    res_naomi: res({ id: 'res_naomi', firstName: 'Naomi', lastName: 'Koster', color: '#e76f51', skin: '#7a4b2a', householdId: 'hh_6', unitId: 'u_f1l', age: 34, traits: ['Alleenstaande moeder'], bio: 'Woont met Mila op de eerste verdieping. De huur is hoog.', thought: 'Als de huur wat lager was, kon ik eens ademhalen.', positivity: 47, routine: ['werk_o', 'winkel', 'school'] }),
    res_mila: res({ id: 'res_mila', firstName: 'Mila', lastName: 'Koster', color: '#f4a261', skin: '#7a4b2a', householdId: 'hh_6', unitId: 'u_f1l', age: 7, isDependent: true, traits: ['Tekenaar', 'Beste vriendin van Daan'], bio: 'Rent graag de trappen van het portiek op en neer.', thought: 'Gaan we vandaag buiten spelen met Daan?', positivity: 48, routine: ['plein', 'speelplein', 'school'] }),
    res_tijn: res({ id: 'res_tijn', firstName: 'Tijn', lastName: 'Vermeer', color: '#588157', skin: '#f6d7b8', householdId: 'hh_7', unitId: 'u_f1r', age: 33, traits: ['Striptekenaar', 'Thuiswerker'], bio: 'Werkt thuis en hoort alles door de dunne vloer.', thought: 'Misschien moet ik Naomi eens op koffie vragen.', positivity: 56, routine: ['oever', 'plein', 'winkel'] }),
    res_koos: res({ id: 'res_koos', firstName: 'Koos', title: 'Meneer Koos', lastName: 'Hendriks', color: '#3d5a80', skin: '#e9b98f', householdId: 'hh_8', unitId: 'u_f2l', age: 78, traits: ['Oud-postbode', 'Vogelaar'], bio: 'Kent elke brievenbus in de wijk. De trap naar twee hoog wordt zwaar.', thought: 'Beneden wonen, zonder mijn buren kwijt te raken.', positivity: 44, routine: ['pleinbank', 'oever'] })
  };
}

function makeRelationships() {
  const r = (id, a, b, type, strength, memory, near = true) => ({ id, a, b, type, strength, memory, near });
  return {
    rel_1: r('rel_1', 'res_sanne', 'res_annie', 'FRIEND', 82, 'Elke dinsdag samen muntthee bij nummer 2.'),
    rel_2: r('rel_2', 'res_murat', 'res_annie', 'NEIGHBOUR', 74, 'Zaterdagse broodjes over de heg.'),
    rel_3: r('rel_3', 'res_daan', 'res_mila', 'FRIEND', 86, 'Samen stoepkrijten op het plein.', false),
    rel_4: r('rel_4', 'res_samir', 'res_koos', 'NEIGHBOUR', 70, 'Samir draagt op donderdag de boodschappen van Koos naar boven.'),
    rel_5: r('rel_5', 'res_naomi', 'res_tijn', 'FRICTION', 22, 'Gedoe over loopgeluid in het portiek.'),
    rel_6: r('rel_6', 'res_joris', 'res_bram', 'ACQUAINTANCE', 45, 'Joris leende zijn ladder uit bij de verhuizing.', false),
    rel_7: r('rel_7', 'res_noor', 'res_naomi', 'NEIGHBOUR', 65, 'Pannenkoeken delen in het weekend.')
  };
}

export const RELATION_LABEL = {
  FRIEND: 'Goede vrienden',
  NEIGHBOUR: 'Fijne buren',
  ACQUAINTANCE: 'Kennen elkaar',
  FRICTION: 'Wat gedoe'
};

export function createInitialState() {
  return {
    version: 2,
    day: 0,
    money: 1850,
    sk: 45,
    avgPositivity: 55.4,
    diversity: 1.25,
    buildings: makeBuildings(),
    units: makeUnits(),
    households: makeHouseholds(),
    residents: makeResidents(),
    relationships: makeRelationships(),
    decorations: {},
    wishes: { opened: {}, rewarded: {} },
    pendingWork: [],
    vacantSince: {},
    formerNeighbours: [],
    nextId: 1,
    log: [
      { id: 'l0', day: 0, text: 'Welkom in de Zwaluwbuurt. Tik op een huis om te zien wie er woont.' }
    ]
  };
}

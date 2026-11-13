// De Florerende Buurt: hoofdcomponent.
// Houdt de spelstaat bij, laat de tijd lopen, slaat automatisch op en
// verbindt het diorama met de interface.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Bug } from 'lucide-react';
import Diorama from './render/Diorama.jsx';
import TopBar from './ui/TopBar.jsx';
import { AreaMenu, Dock, ZoomControls, DecorateBar, Toasts, Welcome, KijkExit } from './ui/Overlays.jsx';
import { AreaPanel, PersonPanel, WishesPanel, NeighbourhoodPanel, DebugPanel } from './ui/panels.jsx';
import { createInitialState } from './game/content.js';
import {
  stepDay, startWork, completeWork, makeCooperative, boostRelationship, welcomeHousehold, internalMove,
  placeDecoration, removeDecoration, computeWishes, neighbourhoodBloom, clone
} from './game/simulation.js';
import { DAY_MS, DAYS_PER_SEASON, START_FRACTION, calendar, phaseOf, weatherFor } from './game/time.js';
import { loadGame, saveGame, clearSave } from './game/save.js';
import { sound } from './audio/soundscape.js';

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
const WEATHER_CYCLE = ['AUTO', 'CLEAR', 'BLOSSOM', 'RAIN', 'LEAVES', 'SNOW'];

function boot() {
  const saved = loadGame();
  if (!saved) {
    return { game: createInitialState(), fraction: START_FRACTION, settings: { speed: 1, muted: true, weather: 'AUTO' }, fresh: true };
  }
  let game = saved.game;
  // Klussen die bezig waren toen het spel werd gesloten, zijn nu klaar
  for (const w of [...game.pendingWork]) game = completeWork(game, w.id);
  return {
    game,
    fraction: saved.clock?.fraction ?? START_FRACTION,
    settings: { speed: 1, muted: true, weather: 'AUTO', ...saved.settings },
    fresh: false
  };
}

export default function App() {
  const initial = useMemo(boot, []);
  const [game, setGame] = useState(initial.game);
  const [settings, setSettings] = useState({ ...initial.settings, muted: true });
  const [welcome, setWelcome] = useState(initial.fresh);
  const [, setUiTick] = useState(0);
  const clockRef = useRef({ fraction: initial.fraction });
  const gameRef = useRef(game);
  gameRef.current = game;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const welcomeRef = useRef(welcome);
  welcomeRef.current = welcome;
  const finishing = useRef(new Set());

  // Selectie en panelen
  const [area, setArea] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unitId, setUnitId] = useState(null);
  const [residentId, setResidentId] = useState(null);
  const [drawer, setDrawer] = useState(null); // 'area' | 'person' | 'wishes' | 'buurt' | 'debug'
  const [cutaway, setCutaway] = useState(false);
  const [brush, setBrush] = useState(null);
  const [decorating, setDecorating] = useState(false);
  const [payWithSK, setPayWithSK] = useState(false);
  const [kijk, setKijk] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [preview, setPreview] = useState(null);
  if (DEBUG) window.__buurt = { clockRef, setGame, getGame: () => gameRef.current };
  const reducedMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);

  const toast = useCallback((text, warn = false) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text, warn }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // ------------------------------------------------------------------------
  // De klok: tijd laten lopen, dagen afronden en klussen afmaken
  // ------------------------------------------------------------------------
  useEffect(() => {
    let raf;
    let last = performance.now();
    let lastUi = 0;
    const loop = (now) => {
      const dt = Math.min(250, now - last);
      last = now;
      const sp = welcomeRef.current ? 0 : settingsRef.current.speed;
      if (sp > 0) {
        const c = clockRef.current;
        c.fraction += (dt * sp) / DAY_MS;
        if (c.fraction >= 1) {
          c.fraction -= 1;
          setGame((g) => stepDay(g));
        }
      }
      for (const w of gameRef.current.pendingWork) {
        if (now >= w.start + w.duration && !finishing.current.has(w.id)) {
          finishing.current.add(w.id);
          setGame((g) => completeWork(g, w.id));
          sound.chime('done');
        }
      }
      if (now - lastUi > 250) {
        lastUi = now;
        setUiTick((t) => (t + 1) % 1000000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ------------------------------------------------------------------------
  // Automatisch opslaan
  // ------------------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => saveGame(game, { fraction: clockRef.current.fraction }, { speed: settings.speed, weather: settings.weather }), 800);
    return () => clearTimeout(t);
  }, [game, settings.speed, settings.weather]);

  useEffect(() => {
    const flush = () => saveGame(gameRef.current, { fraction: clockRef.current.fraction }, { speed: settingsRef.current.speed, weather: settingsRef.current.weather });
    const onVis = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  // ------------------------------------------------------------------------
  // Meldingen uit het buurtnieuws
  // ------------------------------------------------------------------------
  const lastLog = useRef(game.log[0]?.id);
  useEffect(() => {
    const fresh = [];
    for (const l of game.log) {
      if (l.id === lastLog.current) break;
      if (l.toast) fresh.push(l.text);
    }
    lastLog.current = game.log[0]?.id;
    fresh.reverse().slice(-3).forEach((text) => toast(text));
  }, [game.log, toast]);

  // ------------------------------------------------------------------------
  // Weer en geluid
  // ------------------------------------------------------------------------
  const { season } = calendar(game.day);
  const weather = preview?.weather || (settings.weather === 'AUTO' ? weatherFor(game.day) : settings.weather);
  const bloom = useMemo(() => neighbourhoodBloom(game), [game]);
  const skPerDay = useMemo(() => Object.values(game.residents).reduce((a, r) => a + r.skPerDay, 0) * game.diversity, [game]);

  useEffect(() => {
    sound.setMood(bloom, season === 'WINTER');
  }, [bloom, season, settings.muted]);

  useEffect(() => {
    if (settings.muted) return undefined;
    let timer;
    const next = () => {
      timer = setTimeout(() => {
        const ph = phaseOf(clockRef.current.fraction);
        sound.ambient(bloom, ph === 'NIGHT', weather === 'RAIN');
        next();
      }, 5000 + Math.random() * 4000);
    };
    next();
    return () => clearTimeout(timer);
  }, [settings.muted, bloom, weather]);

  const setMuted = (muted) => {
    sound.setMuted(muted);
    if (!muted) sound.setMood(bloom, season === 'WINTER');
    setSettings((s) => ({ ...s, muted }));
  };

  // ------------------------------------------------------------------------
  // Acties
  // ------------------------------------------------------------------------
  const apply = (result, okSound = 'place') => {
    if (result.error) {
      toast(result.error, true);
      return false;
    }
    setGame(result.state);
    sound.chime(okSound);
    return true;
  };

  const actions = {
    start: (buildingId, uid, upgradeId) => apply(startWork(game, { buildingId, unitId: uid, upgradeId }, performance.now())),
    coop: (uid) => apply(makeCooperative(game, uid), 'done'),
    boost: (relId) => apply(boostRelationship(game, relId)),
    welcome: (uid, archId) => {
      setGame(welcomeHousehold(game, uid, archId));
      sound.chime('done');
    },
    move: (resId, uid) => {
      setGame(internalMove(game, resId, uid));
      sound.chime('done');
    }
  };

  const onArea = useCallback((id) => {
    setArea(id);
    setMenuOpen(true);
    setResidentId(null);
    if (id !== 'b_flat') setCutaway(false);
    setUnitId((u) => {
      const b = gameRef.current.buildings[id];
      if (!b) return null;
      if (b.unitIds.length === 1) return b.unitIds[0];
      return b.unitIds.includes(u) ? u : null;
    });
    setDrawer((d) => (d === 'person' ? 'area' : d));
  }, []);

  const onUnit = useCallback((uid) => {
    setArea('b_flat');
    setUnitId(uid);
    setMenuOpen(false);
    setDrawer('area');
  }, []);

  const onResident = useCallback((id) => {
    setResidentId(id);
    setMenuOpen(false);
    setDrawer('person');
  }, []);

  const onBackground = useCallback(() => {
    setMenuOpen(false);
    setResidentId(null);
  }, []);

  const onTile = useCallback(
    (x, y) => {
      if (!brush) return;
      if (brush === 'REMOVE') {
        setGame((g) => removeDecoration(g, x, y));
        sound.chime('remove');
        return;
      }
      const r = placeDecoration(gameRef.current, x, y, brush, payWithSK);
      if (r.error) toast(r.error, true);
      else {
        setGame(r.state);
        sound.chime('place');
      }
    },
    [brush, payWithSK, toast]
  );

  const goTo = (target) => {
    if (target.residentId) onResident(target.residentId);
    else if (target.buildingId) {
      onArea(target.buildingId);
      if (target.unitId) {
        setUnitId(target.unitId);
        if (target.buildingId === 'b_flat') setCutaway(true);
      }
      setDrawer('area');
    }
  };

  const toggleDecorate = () => {
    setDecorating((d) => {
      const next = !d;
      setBrush(next ? 'TREE' : null);
      if (next) {
        setMenuOpen(false);
        setDrawer(null);
      }
      return next;
    });
  };

  const newGame = () => {
    clearSave();
    setGame(createInitialState());
    clockRef.current.fraction = START_FRACTION;
    setArea(null);
    setResidentId(null);
    setDrawer(null);
    setWelcome(true);
  };

  const debug = {
    day: () => setGame((g) => stepDay(g)),
    season: () => setGame((g) => {
      let s = g;
      for (let i = 0; i < DAYS_PER_SEASON; i++) s = stepDay(s);
      return s;
    }),
    money: () => setGame((g) => ({ ...clone(g), money: g.money + 500 })),
    sk: () => setGame((g) => ({ ...clone(g), sk: g.sk + 50 })),
    preview: () => setPreview((p) => (p ? null : { weather: 'SNOW' })),
    previewLabel: preview ? 'uit' : 'sneeuw'
  };

  const wishCount = useMemo(() => computeWishes(game).filter((w) => !w.done && !w.hidden).length, [game]);
  const dockActive = decorating ? 'decorate' : drawer === 'wishes' ? 'wishes' : drawer === 'buurt' ? 'buurt' : null;
  const tabs = [
    ['area', 'Huis'],
    ['person', 'Bewoner'],
    ['wishes', 'Wensen'],
    ['buurt', 'Buurt'],
    ...(DEBUG ? [['debug', 'Debug']] : [])
  ];

  const overlay = ({ toContainer, zoomBy, resetCam, focusOn }) => (
    <>
      {!kijk && menuOpen && area && !decorating && (
        <AreaMenu
          s={game}
          areaId={area}
          toContainer={toContainer}
          onClose={() => setMenuOpen(false)}
          onMore={() => {
            setMenuOpen(false);
            setDrawer('area');
          }}
          onPerson={onResident}
          onStart={actions.start}
          cutaway={cutaway}
          onCutaway={() => {
            if (!cutaway) focusOn(11, 9.5, 36);
            setCutaway((v) => !v);
          }}
        />
      )}
      {!kijk && <ZoomControls zoomBy={zoomBy} resetCam={resetCam} shifted={Boolean(drawer)} />}
    </>
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#262250' }}>
      <Diorama
        game={game}
        clockRef={clockRef}
        speed={welcome ? 0 : settings.speed}
        weather={weather}
        selectedArea={kijk ? null : menuOpen || drawer === 'area' ? area : null}
        selectedResident={kijk ? null : residentId}
        selectedUnit={unitId}
        cutaway={cutaway}
        decorate={decorating ? brush || 'NONE' : null}
        onArea={onArea}
        onResident={onResident}
        onUnit={onUnit}
        onTile={onTile}
        onBackground={onBackground}
        overlay={overlay}
        reducedMotion={reducedMotion}
      />

      {!kijk && (
        <>
          <TopBar
            s={game}
            fraction={clockRef.current.fraction}
            speed={settings.speed}
            setSpeed={(v) => setSettings((s) => ({ ...s, speed: v }))}
            muted={settings.muted}
            toggleSound={() => setMuted(!settings.muted)}
            onKijk={() => {
              setKijk(true);
              setMenuOpen(false);
              setDecorating(false);
              setBrush(null);
            }}
            bloom={bloom}
            skPerDay={skPerDay}
            weather={weather}
            weatherSetting={settings.weather}
            cycleWeather={() => setSettings((s) => ({ ...s, weather: WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(s.weather) + 1) % WEATHER_CYCLE.length] }))}
            onNewGame={newGame}
          />
          <Dock
            wishCount={wishCount}
            active={dockActive}
            onDecorate={toggleDecorate}
            onWishes={() => {
              setDecorating(false);
              setBrush(null);
              setDrawer((d) => (d === 'wishes' ? null : 'wishes'));
            }}
            onBuurt={() => {
              setDecorating(false);
              setBrush(null);
              setDrawer((d) => (d === 'buurt' ? null : 'buurt'));
            }}
          />
          {decorating && (
            <DecorateBar
              s={game}
              brush={brush}
              setBrush={setBrush}
              payWithSK={payWithSK}
              setPayWithSK={setPayWithSK}
              onDone={() => {
                setDecorating(false);
                setBrush(null);
              }}
            />
          )}
          {drawer && (
            <aside
              className="panel absolute z-30 rounded-2xl flex flex-col right-2 top-[78px] bottom-2 w-[400px] max-md:left-2 max-md:w-auto max-md:top-auto max-md:h-[62vh]"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: 'var(--line)' }}>
                <div className="flex gap-1 flex-1 overflow-x-auto" role="tablist">
                  {tabs.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={drawer === key}
                      onClick={() => setDrawer(key)}
                      className="h-10 px-3 rounded-xl font-extrabold text-[14px] shrink-0 flex items-center gap-1"
                      style={drawer === key ? { background: 'var(--lantern)', color: 'var(--ink)' } : undefined}
                    >
                      {key === 'debug' && <Bug size={14} />}
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" className="icon-btn" onClick={() => setDrawer(null)} aria-label="Paneel sluiten">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scroll-soft p-4">
                {drawer === 'area' && <AreaPanel s={game} areaId={area} unitId={unitId} onUnit={onUnit} onPerson={onResident} actions={actions} />}
                {drawer === 'person' && <PersonPanel s={game} residentId={residentId} onPerson={onResident} onArea={(id, uid) => { onArea(id); setUnitId(uid); setDrawer('area'); }} actions={actions} />}
                {drawer === 'wishes' && <WishesPanel s={game} onGo={goTo} />}
                {drawer === 'buurt' && <NeighbourhoodPanel s={game} onPerson={onResident} />}
                {drawer === 'debug' && <DebugPanel s={game} debug={debug} />}
              </div>
            </aside>
          )}
          <Toasts toasts={toasts} />
        </>
      )}

      {kijk && <KijkExit onExit={() => setKijk(false)} />}
      {welcome && (
        <Welcome
          onStart={(withSound) => {
            setWelcome(false);
            setMuted(!withSound);
          }}
        />
      )}
    </div>
  );
}

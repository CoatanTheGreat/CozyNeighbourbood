// Bovenbalk: buurtpot, buurtgevoel, stemming, klok en snelheid.

import { useState } from 'react';
import { Coins, HeartHandshake, Smile, Pause, Eye, Settings, Volume2, VolumeX, Sun, Moon, Sunrise, Sunset, Flower2, Leaf, Snowflake, CloudRain } from 'lucide-react';
import { moodWord } from './bits.jsx';
import { calendar, phaseOf, PHASE_LABEL, SEASON_LABEL, WEATHER_LABEL } from '../game/time.js';

const SEASON_ICON = { SPRING: Flower2, SUMMER: Sun, AUTUMN: Leaf, WINTER: Snowflake };
const PHASE_ICON = { MORNING: Sunrise, DAY: Sun, EVENING: Sunset, NIGHT: Moon };

export default function TopBar({ s, fraction, speed, setSpeed, muted, toggleSound, onKijk, bloom, skPerDay, weather, weatherSetting, cycleWeather, onNewGame }) {
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { season, dayOfSeason, year } = calendar(s.day);
  const phase = phaseOf(fraction);
  const SeasonIcon = SEASON_ICON[season];
  const PhaseIcon = PHASE_ICON[phase];
  const mood = moodWord(s.avgPositivity);
  const status = bloom < 0.25 ? 'Grauw' : bloom < 0.6 ? 'Ontwakend' : 'Bloeiend';

  return (
    <header className="panel absolute top-2 left-2 right-2 z-30 rounded-2xl px-3 py-1.5 flex items-center gap-x-4 gap-y-1 flex-wrap" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-col min-w-[150px]">
        <h1 className="text-[17px] font-extrabold leading-tight tracking-tight">De Florerende Buurt</h1>
        <div className="flex items-center gap-2 text-[13px] muted">
          <span>{status}</span>
          <span className="bar w-16" aria-label={`Buurt ${Math.round(bloom * 100)} procent opgebloeid`}>
            <span style={{ width: `${Math.max(4, bloom * 100)}%`, background: 'linear-gradient(90deg, #9aa0b5, #8bd17c)' }} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Stat icon={<Coins size={18} />} color="var(--lantern)" value={`€ ${s.money.toLocaleString('nl-NL')}`} label="buurtpot" />
        <Stat icon={<HeartHandshake size={18} />} color="var(--heart)" value={Math.floor(s.sk)} label={`buurtgevoel, +${skPerDay.toFixed(1).replace('.', ',')} per dag`} />
        <Stat icon={<Smile size={18} />} color={mood.color} value={mood.word} label="stemming" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-2 pr-1">
          <SeasonIcon size={20} aria-hidden />
          <div className="leading-tight">
            <div className="font-extrabold text-[14px]">
              {SEASON_LABEL[season]}, dag {dayOfSeason}
            </div>
            <div className="muted text-[12px] flex items-center gap-1">
              <PhaseIcon size={12} /> {PHASE_LABEL[phase]}, jaar {year}
              {weather === 'RAIN' && <CloudRain size={12} />}
            </div>
          </div>
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }} role="group" aria-label="Snelheid">
          {[0, 1, 2, 3].map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={speed === v}
              aria-label={v === 0 ? 'Pauze' : `Snelheid ${v}x`}
              onClick={() => setSpeed(v)}
              className="w-10 h-10 font-extrabold text-[14px] flex items-center justify-center"
              style={speed === v ? { background: 'var(--lantern)', color: 'var(--ink)' } : undefined}
            >
              {v === 0 ? <Pause size={16} /> : `${v}×`}
            </button>
          ))}
        </div>
        <button type="button" className="icon-btn" onClick={toggleSound} aria-label={muted ? 'Geluid aan' : 'Geluid uit'}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button type="button" className="icon-btn" onClick={onKijk} aria-label="Kijkmodus: alleen de buurt">
          <Eye size={20} />
        </button>
        <div className="relative">
          <button type="button" className="icon-btn" aria-label="Instellingen" aria-expanded={menu} onClick={() => { setMenu((m) => !m); setConfirm(false); }}>
            <Settings size={20} />
          </button>
          {menu && (
            <div className="panel-solid absolute right-0 top-12 w-64 rounded-2xl p-2 flex flex-col gap-1 shadow-xl">
              <button type="button" className="btn btn-quiet justify-between" onClick={cycleWeather}>
                <span>Weer</span>
                <span className="muted">{weatherSetting === 'AUTO' ? 'Wisselt vanzelf' : WEATHER_LABEL[weatherSetting]}</span>
              </button>
              {!confirm ? (
                <button type="button" className="btn btn-quiet justify-start" onClick={() => setConfirm(true)}>
                  Nieuwe buurt beginnen
                </button>
              ) : (
                <div className="p-2 flex flex-col gap-2">
                  <p className="text-[13px]">Je huidige buurt wordt gewist. Zeker weten?</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-primary" onClick={() => { setMenu(false); setConfirm(false); onNewGame(); }}>
                      Ja, opnieuw
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirm(false)}>
                      Nee
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span style={{ color }}>{icon}</span>
      <div className="leading-tight">
        <div className="font-extrabold text-[15px]">{value}</div>
        <div className="muted text-[11.5px] hidden lg:block">{label}</div>
      </div>
    </div>
  );
}

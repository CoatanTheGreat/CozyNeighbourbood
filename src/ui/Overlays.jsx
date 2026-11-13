// Zwevende onderdelen boven het diorama.

import { useEffect, useState } from 'react';
import { X, Paintbrush, Gift, Users, ZoomIn, ZoomOut, LocateFixed, Eraser, Check, Eye, Coins, HeartHandshake, ChevronRight, DoorOpen } from 'lucide-react';
import { Avatar, moodWord } from './bits.jsx';
import { UpgradeList, areaDescription, occupantsOf } from './panels.jsx';
import { AREA_HEIGHT } from '../render/buildings.jsx';
import { areaBox, centerOf } from '../game/layout.js';
import { DECORATIONS } from '../game/content.js';
import { displayName } from '../game/simulation.js';

const stop = {
  onClick: (e) => e.stopPropagation(),
  onPointerDown: (e) => e.stopPropagation()
};

// --------------------------------------------------------------------------
// Menu dat naast een gebouw verschijnt
// --------------------------------------------------------------------------

export function AreaMenu({ s, areaId, toContainer, onClose, onMore, onPerson, onStart, cutaway, onCutaway }) {
  const box = areaBox(areaId);
  const b = s.buildings[areaId];
  if (!box || !b) return null;
  const c = centerOf(box);
  const pt = toContainer(c.x, c.y, (AREA_HEIGHT[areaId] || 30) + 6);
  if (!pt) return null;
  // Naast het gebouw, aan de kant met de meeste ruimte, zodat het gebouw zichtbaar blijft
  const width = Math.min(320, pt.w - 16);
  const narrow = pt.w < 700;
  const west = toContainer(box.x, box.y + box.d, 0);
  const east = toContainer(box.x + box.w, box.y, 0);
  const roomLeft = west.x - 12;
  const roomRight = pt.w - east.x - 12;
  let left = roomRight >= width || roomRight >= roomLeft ? east.x + 12 : west.x - 12 - width;
  left = Math.max(8, Math.min(pt.w - width - 8, left));
  const top = narrow ? 78 : Math.max(78, Math.min(pt.h - 96 - 280, pt.y - 60));
  const style = { left, width, top, maxHeight: Math.max(200, pt.h - top - 92) };
  const people = occupantsOf(s, areaId);
  const avg = people.length ? people.reduce((a, r) => a + r.positivity, 0) / people.length : null;
  const mood = avg != null ? moodWord(avg) : null;

  return (
    <div {...stop} className="panel absolute z-20 rounded-2xl p-3 flex flex-col gap-3 overflow-y-auto scroll-soft" style={style} role="dialog" aria-label={b.name}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="font-extrabold text-[17px] leading-tight">{b.name}</div>
          <div className="muted text-[13px] mt-0.5">{areaDescription(s, areaId)}</div>
        </div>
        <button type="button" className="icon-btn -mr-1 -mt-1" onClick={onClose} aria-label="Sluiten">
          <X size={18} />
        </button>
      </div>
      {people.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {people.slice(0, 8).map((r) => (
            <Avatar key={r.id} r={r} size={30} onClick={() => onPerson(r.id)} />
          ))}
          {mood && <span className="chip ml-1" style={{ color: mood.color }}>{mood.word}</span>}
        </div>
      )}
      {areaId === 'b_flat' && (
        <button type="button" className="btn" onClick={onCutaway}>
          <DoorOpen size={16} /> {cutaway ? 'Gevel weer dicht' : 'Kijk naar binnen'}
        </button>
      )}
      <UpgradeList s={s} areaId={areaId} onStart={onStart} compact />
      <button type="button" className="btn btn-quiet justify-between" onClick={onMore}>
        Meer over {b.kind === 'PLACE' ? 'deze plek' : b.kind === 'HOUSE' ? 'dit huis' : 'dit gebouw'}
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Knoppen onderaan
// --------------------------------------------------------------------------

export function Dock({ wishCount, active, onDecorate, onWishes, onBuurt }) {
  const item = (key, Icon, label, onClick, badge) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active === key}
      className="relative flex flex-col items-center justify-center w-[76px] h-[62px] rounded-2xl font-extrabold text-[13px]"
      style={active === key ? { background: 'var(--lantern)', color: 'var(--ink)' } : undefined}
    >
      <Icon size={22} />
      {label}
      {badge > 0 && (
        <span className="absolute top-1 right-3 min-w-5 h-5 px-1 rounded-full text-[12px] flex items-center justify-center" style={{ background: 'var(--heart)', color: 'var(--ink)' }}>
          {badge}
        </span>
      )}
    </button>
  );
  return (
    <nav {...stop} className="panel absolute left-2 bottom-2 z-20 rounded-2xl p-1 flex gap-1" aria-label="Menu">
      {item('decorate', Paintbrush, 'Inrichten', onDecorate)}
      {item('wishes', Gift, 'Wensen', onWishes, wishCount)}
      {item('buurt', Users, 'Buurt', onBuurt)}
    </nav>
  );
}

export function ZoomControls({ zoomBy, resetCam, shifted }) {
  return (
    <div {...stop} className={`panel absolute bottom-2 z-20 rounded-2xl p-1 flex flex-col gap-1 ${shifted ? 'right-[416px] max-md:hidden' : 'right-2'}`}>
      <button type="button" className="icon-btn" onClick={() => zoomBy(1.2)} aria-label="Inzoomen">
        <ZoomIn size={20} />
      </button>
      <button type="button" className="icon-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="Uitzoomen">
        <ZoomOut size={20} />
      </button>
      <button type="button" className="icon-btn" onClick={resetCam} aria-label="Hele buurt in beeld">
        <LocateFixed size={20} />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Inrichten: kies iets en tik op een tegel
// --------------------------------------------------------------------------

export function DecorateBar({ brush, setBrush, payWithSK, setPayWithSK, onDone, s }) {
  return (
    <div {...stop} className="panel absolute left-1/2 -translate-x-1/2 bottom-[84px] z-20 rounded-2xl p-2 w-[min(760px,calc(100%-16px))]">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <span className="font-extrabold">
          {brush === 'REMOVE' ? 'Tik op iets om het weg te halen' : brush ? `Tik op een lichte tegel voor: ${DECORATIONS[brush].name.toLowerCase()}` : 'Kies wat je wilt neerzetten'}
        </span>
        <div className="flex items-center gap-1">
          <span className="muted text-[13px] hidden sm:inline">Betalen met</span>
          <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <button type="button" aria-pressed={!payWithSK} onClick={() => setPayWithSK(false)} className="h-9 px-2.5 flex items-center gap-1 font-bold text-[13px]" style={!payWithSK ? { background: 'var(--lantern)', color: 'var(--ink)' } : undefined}>
              <Coins size={14} /> euro
            </button>
            <button type="button" aria-pressed={payWithSK} onClick={() => setPayWithSK(true)} className="h-9 px-2.5 flex items-center gap-1 font-bold text-[13px]" style={payWithSK ? { background: 'var(--heart)', color: 'var(--ink)' } : undefined}>
              <HeartHandshake size={14} /> buurtgevoel
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scroll-soft pb-1">
        {Object.entries(DECORATIONS).map(([id, d]) => {
          const cost = payWithSK ? d.sk : d.money;
          const afford = payWithSK ? s.sk >= d.sk : s.money >= d.money;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setBrush(id)}
              aria-pressed={brush === id}
              className="shrink-0 w-[92px] rounded-xl p-2 flex flex-col items-center gap-0.5 raised"
              style={{ outline: brush === id ? '2px solid var(--lantern)' : undefined, opacity: afford ? 1 : 0.5 }}
              title={d.desc}
            >
              <span className="text-[22px]" aria-hidden>{d.emoji}</span>
              <span className="text-[13px] font-bold leading-tight text-center">{d.name}</span>
              <span className="text-[12px] muted">{payWithSK ? `${cost} ♥` : `€ ${cost}`}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => setBrush('REMOVE')} aria-pressed={brush === 'REMOVE'} className="btn flex-1" style={brush === 'REMOVE' ? { background: 'var(--heart)', color: 'var(--ink)' } : undefined}>
          <Eraser size={18} /> Weghalen
        </button>
        <button type="button" onClick={onDone} className="btn btn-primary flex-1">
          <Check size={18} /> Klaar
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Meldingen
// --------------------------------------------------------------------------

export function Toasts({ toasts }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-[84px] z-40 flex flex-col gap-2 w-[min(480px,calc(100%-16px))] pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="panel rounded-2xl px-4 py-2.5 text-[14px] font-bold" style={t.warn ? { borderColor: 'var(--heart)' } : undefined}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Welkom bij de eerste keer
// --------------------------------------------------------------------------

export function Welcome({ onStart }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,16,44,0.55)' }}>
      <div className="panel rounded-3xl p-6 max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold leading-tight">Welkom in de Zwaluwbuurt</h2>
        <p>
          Een grijze buurt met kale tegels, lekke daken en buren die elkaar nauwelijks kennen. Jij helpt de bewoners om er samen weer een fijne plek van te maken.
        </p>
        <p className="muted">
          Tik op een huis om te zien wie er woont. Klusdagen kosten geen geld maar buurtgevoel, en dat groeit vanzelf als mensen zich thuis voelen. Neem de tijd: hier hoeft niets snel.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <button type="button" className="btn btn-primary flex-1" onClick={() => onStart(true)}>
            Begin met geluid
          </button>
          <button type="button" className="btn flex-1" onClick={() => onStart(false)}>
            Begin zonder geluid
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Kijkmodus: alleen de buurt, met één knop die vanzelf vervaagt
// --------------------------------------------------------------------------

export function KijkExit({ onExit }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let timer = setTimeout(() => setVisible(false), 2500);
    const wake = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener('pointerdown', wake);
    window.addEventListener('pointermove', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('pointermove', wake);
    };
  }, []);
  return (
    <button
      {...stop}
      type="button"
      onClick={onExit}
      className="panel fade-away absolute right-3 top-3 z-40 rounded-2xl h-11 px-4 flex items-center gap-2 font-extrabold"
      style={{ opacity: visible ? 1 : 0 }}
      aria-label="Kijkmodus verlaten"
    >
      <Eye size={18} /> Terug
    </button>
  );
}

export { displayName };

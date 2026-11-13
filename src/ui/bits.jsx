// Kleine bouwstenen voor de interface.

import { Coins, HeartHandshake } from 'lucide-react';

export function moodWord(p) {
  if (p < 40) return { word: 'Somber', color: '#ff8fa3' };
  if (p < 52) return { word: 'Gaat wel', color: '#ffb877' };
  if (p < 65) return { word: 'Tevreden', color: '#ffd66b' };
  if (p < 78) return { word: 'Blij', color: '#a6e08f' };
  return { word: 'Stralend', color: '#7fe0c0' };
}

export function Avatar({ r, size = 34, onClick, ring }) {
  const style = {
    width: size,
    height: size,
    background: r.color,
    fontSize: size * 0.42,
    boxShadow: ring ? '0 0 0 3px var(--lantern)' : undefined
  };
  const content = r.firstName.charAt(0);
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="rounded-full flex items-center justify-center font-extrabold text-white shrink-0" style={style} aria-label={r.firstName}>
        {content}
      </button>
    );
  }
  return (
    <span className="rounded-full flex items-center justify-center font-extrabold text-white shrink-0" style={style}>
      {content}
    </span>
  );
}

export function Cost({ money, sk }) {
  return (
    <span className="inline-flex gap-1.5">
      {money > 0 && (
        <span className="chip" style={{ color: 'var(--lantern)' }}>
          <Coins size={14} /> € {money}
        </span>
      )}
      {sk > 0 && (
        <span className="chip" style={{ color: 'var(--heart)' }}>
          <HeartHandshake size={14} /> {sk}
        </span>
      )}
    </span>
  );
}

export function MoodBar({ label, value, max, hint }) {
  const pct = Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));
  const color = value < 0 ? '#ff8fa3' : value / max > 0.66 ? '#8bd17c' : value / max > 0.4 ? '#ffd66b' : '#ffb877';
  return (
    <div>
      <div className="flex justify-between text-[13px]">
        <span className="font-bold">{label}</span>
        <span className="muted">{hint}</span>
      </div>
      <div className="bar mt-1">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h3 className="text-[15px] font-extrabold mt-1 mb-2">{children}</h3>;
}

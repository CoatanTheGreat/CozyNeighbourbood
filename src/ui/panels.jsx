// De inhoud van het zijpaneel en het menu bij een gebouw.

import { Check, Hammer, Users, MapPin } from 'lucide-react';
import { Avatar, Cost, MoodBar, SectionTitle, moodWord } from './bits.jsx';
import {
  upgradesOf, isPending, canAfford, unitValuation, qualityMap, unitPrice, inflowCandidates,
  computeWishes, residentThought, displayName, fullName, neighbourhoodBloom, diversityOf, buildingProgress
} from '../game/simulation.js';
import { LIFE_STAGE, INCOME_LABEL, TENURE_LABEL, RELATION_LABEL, lifeStageOf } from '../game/content.js';
import { calendar, SEASON_LABEL } from '../game/time.js';

const euro = (n) => '€ ' + Math.round(n).toLocaleString('nl-NL');
const floorLabel = (f) => (f === 0 ? 'begane grond' : f === 1 ? 'eerste verdieping' : 'tweede verdieping');

export function areaDescription(s, id) {
  const b = s.buildings[id];
  const p = buildingProgress(s, id);
  if (p === 1) return 'Helemaal opgeknapt. Kijk maar eens hoe het hier nu leeft.';
  if (b.kind === 'HOUSE') {
    const u = s.units[b.unitIds[0]];
    if (!u.ready) return 'Dichtgetimmerd en leeg. Met wat werk kan hier weer iemand wonen.';
    if (!u.householdId) return 'Dit huisje staat leeg en wacht op nieuwe bewoners.';
    return `Hier woont familie ${s.households[u.householdId].familyName}.`;
  }
  return {
    FLAT: 'Zes woningen rond één trappenhuis. Tik op een woning om binnen te kijken.',
    SCHOOL: 'De school van de buurt. Na schooltijd is de speelplaats van iedereen.',
    HUB: 'Een grijs kantoorgebouw met een slagboom. Binnen is plek voor een buurtkamer.',
    SHOP: 'De supermarkt op de hoek. Iedereen komt hier wel eens.',
    PLACE: id === 'p_plein' ? 'Het hart van de buurt, maar nu nog vooral kale tegels.' : 'Een verwilderd stukje grond vol onkruid.'
  }[b.kind];
}

export function occupantsOf(s, areaId) {
  const b = s.buildings[areaId];
  if (!b) return [];
  return b.unitIds
    .map((u) => s.units[u].householdId)
    .filter(Boolean)
    .flatMap((h) => s.households[h].memberIds.map((m) => s.residents[m]).filter(Boolean));
}

// --------------------------------------------------------------------------
// Verbeteringen
// --------------------------------------------------------------------------

export function UpgradeList({ s, areaId, unitId, onStart, compact }) {
  const list = upgradesOf(s, areaId).filter((x) => !x.unitId || !unitId || x.unitId === unitId);
  const open = list.filter((x) => !x.up.installed);
  const done = list.filter((x) => x.up.installed);
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {open.map(({ up, unitId: uid }) => {
        const pending = isPending(s, up.id);
        const problem = canAfford(s, up);
        const klus = up.money === 0;
        return (
          <div key={up.id} className="raised rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-extrabold leading-tight">{up.name}</div>
              <Cost money={up.money} sk={up.sk} />
            </div>
            {!compact && <p className="muted text-[13px] mt-1">{up.desc}</p>}
            {pending ? (
              <div className="mt-2 text-[13px] font-bold" style={{ color: 'var(--lantern)' }}>
                {klus ? 'De buren zijn aan het klussen...' : 'Er wordt aan gewerkt...'}
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button type="button" className={klus ? 'btn btn-heart' : 'btn btn-primary'} disabled={Boolean(problem)} onClick={() => onStart(areaId, uid, up.id)}>
                  {klus ? <Users size={16} /> : <Hammer size={16} />}
                  {klus ? 'Klusdag houden' : 'Laten doen'}
                </button>
                {problem && <span className="muted text-[13px]">{problem}</span>}
              </div>
            )}
          </div>
        );
      })}
      {done.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {done.map(({ up }) => (
            <span key={up.id} className="chip" style={{ color: 'var(--leaf)' }}>
              <Check size={13} /> {up.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Huis of plek
// --------------------------------------------------------------------------

export function AreaPanel({ s, areaId, unitId, onUnit, onPerson, actions }) {
  const b = s.buildings[areaId];
  if (!b) return <Empty text="Tik op een huis of plek in de buurt om hier meer te zien." />;
  const multi = b.unitIds.length > 1;
  const unit = multi ? (unitId && b.unitIds.includes(unitId) ? s.units[unitId] : null) : b.unitIds[0] ? s.units[b.unitIds[0]] : null;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-extrabold leading-tight">{b.name}</h2>
        <p className="muted mt-1">{areaDescription(s, areaId)}</p>
      </div>
      {multi && (
        <div className="grid grid-cols-2 gap-2">
          {[2, 1, 0].flatMap((f) =>
            ['L', 'R'].map((side) => {
              const u = Object.values(s.units).find((x) => x.buildingId === areaId && x.floor === f && x.side === side);
              const hh = u.householdId ? s.households[u.householdId] : null;
              const active = unit?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onUnit(u.id)}
                  className="rounded-xl p-2 text-left raised"
                  style={{ outline: active ? '2px solid var(--lantern)' : undefined }}
                >
                  <div className="font-extrabold text-[14px]">{u.label}</div>
                  <div className="muted text-[13px] truncate">{hh ? `Familie ${hh.familyName}` : u.ready ? 'Vrij' : 'Nog op te knappen'}</div>
                </button>
              );
            })
          )}
        </div>
      )}
      {unit && <UnitDetails s={s} unit={unit} onPerson={onPerson} actions={actions} />}
      <div>
        <SectionTitle>Verbeteren</SectionTitle>
        <UpgradeList s={s} areaId={areaId} unitId={unit?.id} onStart={actions.start} />
      </div>
    </div>
  );
}

function UnitDetails({ s, unit, onPerson, actions }) {
  const hh = unit.householdId ? s.households[unit.householdId] : null;
  const price = unitPrice(unit);
  const val = unitValuation(s, unit, qualityMap(s), s.avgPositivity);
  const members = hh ? hh.memberIds.map((m) => s.residents[m]).filter(Boolean) : [];
  const ratio = hh ? unit.monthlyCost / hh.monthlyIncome : 0;

  let stayText = null;
  if (hh && unit.tenure === 'OWNER' && !unit.coop) {
    stayText = val.sellChance < 0.02 ? 'Ze willen hier graag blijven.' : val.sellChance < 0.08 ? 'Soms denken ze aan verkopen. Het huis is flink meer waard geworden.' : 'Het huis is veel meer waard geworden. Ze overwegen te verkopen.';
  } else if (hh && !unit.coop && ratio > 0.4) {
    stayText = 'De huur is bijna te hoog voor ze. Misschien moeten ze straks verhuizen.';
  }

  const waiting = [];
  if (!hh && unit.ready) {
    for (const h of Object.values(s.households)) {
      if (h.wantsGroundFloor && unit.floor === 0) waiting.push({ id: h.memberIds[0], label: `Laat familie ${h.familyName} hierheen verhuizen` });
    }
    for (const r of Object.values(s.residents)) {
      if (r.isDependent && r.age >= 18) waiting.push({ id: r.id, label: `Laat ${displayName(r)} hier op zichzelf wonen` });
    }
  }
  const options = !hh && unit.ready ? inflowCandidates(s, unit) : [];
  const since = s.vacantSince[unit.id];
  const daysLeft = since != null ? Math.max(1, 8 - (s.day - since)) : null;

  return (
    <div className="raised rounded-2xl p-3 flex flex-col gap-3">
      <div className="flex justify-between gap-2 flex-wrap">
        <div>
          <div className="font-extrabold">{unit.label}</div>
          <div className="muted text-[13px]">
            {unit.coop ? 'Buurtcoöperatie' : TENURE_LABEL[unit.tenure]}, {unit.rooms} kamers, {floorLabel(unit.floor)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold">{euro(price)} p/m</div>
          {unit.tenure === 'OWNER' && !unit.coop && <div className="muted text-[13px]">Waarde {euro(val.value)}</div>}
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {members.map((m) => {
            const mood = moodWord(m.positivity);
            return (
              <button key={m.id} type="button" onClick={() => onPerson(m.id)} className="flex items-center gap-2 text-left rounded-xl p-1.5 hover:bg-white/5">
                <Avatar r={m} size={32} />
                <span className="flex-1">
                  <span className="font-bold">{displayName(m)}</span> <span className="muted text-[13px]">{m.age} jaar</span>
                </span>
                <span className="chip" style={{ color: mood.color }}>{mood.word}</span>
              </button>
            );
          })}
          {hh && <div className="muted text-[13px]">{INCOME_LABEL[hh.income]}</div>}
        </div>
      )}

      {stayText && <p className="text-[13px]" style={{ color: '#ffd66b' }}>{stayText}</p>}

      {!unit.coop && unit.ready && (
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="btn btn-heart" onClick={() => actions.coop(unit.id)}>
            Naar de buurtcoöperatie
          </button>
          <Cost money={0} sk={20} />
          <span className="muted text-[13px] w-full">De woonlasten blijven laag en het huis wordt niet verkocht.</span>
        </div>
      )}

      {!unit.ready && <p className="muted text-[13px]">Deze ruimte moet eerst worden opgeknapt. Kijk hieronder bij verbeteren.</p>}

      {!hh && unit.ready && (
        <div className="flex flex-col gap-2">
          <div className="font-extrabold">Deze woning is vrij</div>
          {waiting.map((w) => (
            <button key={w.id} type="button" className="btn btn-primary justify-start" onClick={() => actions.move(w.id, unit.id)}>
              {w.label}
            </button>
          ))}
          {options.slice(0, 4).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2">
              <span className={o.fits ? '' : 'muted'}>
                <span className="font-bold">{o.arch.name}</span>
                <span className="muted text-[13px]"> {o.fits ? (o.chance > 0.35 ? 'voelen zich hier thuis' : 'willen wel komen kijken') : o.reason.toLowerCase()}</span>
              </span>
              {o.fits && (
                <button type="button" className="btn" onClick={() => actions.welcome(unit.id, o.id)}>
                  Verwelkom
                </button>
              )}
            </div>
          ))}
          {daysLeft && <p className="muted text-[13px]">Kies je niemand? Over ongeveer {daysLeft} {daysLeft === 1 ? 'dag' : 'dagen'} komt er vanzelf iemand wonen.</p>}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Bewoner
// --------------------------------------------------------------------------

function needsHint(r, s) {
  const stage = lifeStageOf(r.age);
  if (stage === 'CHILD') return 'Een echte speelplek';
  if (stage === 'SENIOR') return 'Rustig zitten en geen trappen';
  if (r.isDependent && r.age >= 18) return 'Een eigen plek';
  return 'Groen en ontmoeten';
}

export function PersonPanel({ s, residentId, onArea, onPerson, actions }) {
  const r = s.residents[residentId];
  if (!r) return <Empty text="Tik op iemand op straat of in een huis om kennis te maken." />;
  const hh = s.households[r.householdId];
  const unit = s.units[r.unitId];
  const stage = lifeStageOf(r.age);
  const mood = moodWord(r.positivity);
  const rels = Object.values(s.relationships).filter((x) => x.a === r.id || x.b === r.id);
  const bd = r.breakdown;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <Avatar r={r} size={54} />
        <div className="flex-1">
          <h2 className="text-xl font-extrabold leading-tight">{fullName(r)}</h2>
          <div className="muted text-[13px]">
            {r.age} jaar, {LIFE_STAGE[stage].label.toLowerCase()}, {unit.label.toLowerCase()}
          </div>
        </div>
        <span className="chip" style={{ color: mood.color }}>{mood.word}</span>
      </div>
      <p className="muted">{r.bio}</p>
      <div className="raised rounded-2xl p-3 italic">“{residentThought(s, r)}”</div>
      <div className="flex flex-wrap gap-1.5">
        {r.traits.map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <SectionTitle>Hoe gaat het?</SectionTitle>
        <MoodBar label="Thuis" value={bd.home} max={35} hint="comfort en woonlasten" />
        <MoodBar label="Omgeving" value={bd.surroundings} max={25} hint="groen, bankjes, seizoen" />
        <MoodBar label="Buren" value={bd.neighbours} max={25} hint="vrienden in de buurt" />
        <MoodBar label="Wat ik nodig heb" value={bd.needs} max={15} hint={needsHint(r, s)} />
      </div>
      <div>
        <SectionTitle>Buren en vrienden</SectionTitle>
        {rels.length === 0 && <p className="muted text-[13px]">Nog niemand echt leren kennen.</p>}
        <div className="flex flex-col gap-2">
          {rels.map((rel) => {
            const other = s.residents[rel.a === r.id ? rel.b : rel.a];
            if (!other) return null;
            const friction = rel.type === 'FRICTION';
            return (
              <div key={rel.id} className="raised rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <Avatar r={other} size={30} onClick={() => onPerson(other.id)} />
                  <div className="flex-1 font-bold">{displayName(other)}</div>
                  <span className="chip" style={{ color: friction ? 'var(--heart)' : 'var(--leaf)' }}>{RELATION_LABEL[rel.type]}</span>
                </div>
                <p className="muted text-[13px] mt-1">{rel.memory}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="btn" onClick={() => actions.boost(rel.id)}>
                    {friction ? 'Samen koffie, het uitpraten' : 'Samen koffie drinken'}
                  </button>
                  <Cost money={0} sk={8} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button type="button" className="btn" onClick={() => onArea(unit.buildingId, unit.id)}>
        <MapPin size={16} /> Bekijk {hh ? `het huis van familie ${hh.familyName}` : 'het huis'}
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Wensen
// --------------------------------------------------------------------------

export function WishesPanel({ s, onGo }) {
  const wishes = computeWishes(s).filter((w) => !w.hidden);
  const open = wishes.filter((w) => !w.done);
  const done = wishes.filter((w) => w.done && s.wishes.rewarded[w.id]);
  return (
    <div className="flex flex-col gap-3">
      <p className="muted">Wensen van bewoners. Je hoeft ze niet te doen, maar ze helpen als je niet weet waar je moet beginnen.</p>
      {open.length === 0 && <p>Er zijn nu geen open wensen. Geniet van de buurt.</p>}
      {open.map((w) => {
        const giver = s.residents[w.giver];
        return (
          <div key={w.id} className="raised rounded-2xl p-3">
            <div className="flex items-center gap-2">
              {giver && <Avatar r={giver} size={30} />}
              <div className="flex-1 font-extrabold leading-tight">{w.title}</div>
            </div>
            <p className="muted text-[13px] mt-2">{w.text}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button type="button" className="btn btn-primary" onClick={() => onGo(w.target)}>
                <MapPin size={16} /> Ga erheen
              </button>
              <span className="muted text-[13px]">Beloning</span>
              <Cost money={w.money} sk={w.sk} />
            </div>
          </div>
        );
      })}
      {done.length > 0 && (
        <div>
          <SectionTitle>Vervuld</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {done.map((w) => (
              <span key={w.id} className="chip" style={{ color: 'var(--leaf)' }}>
                <Check size={13} /> {w.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// De hele buurt
// --------------------------------------------------------------------------

export function NeighbourhoodPanel({ s, onPerson }) {
  const residents = Object.values(s.residents);
  const mood = moodWord(s.avgPositivity);
  const bloom = neighbourhoodBloom(s);
  const { season, year } = calendar(s.day);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="raised rounded-2xl p-2">
          <div className="text-xl font-extrabold">{residents.length}</div>
          <div className="label">bewoners</div>
        </div>
        <div className="raised rounded-2xl p-2">
          <div className="text-xl font-extrabold" style={{ color: mood.color }}>{mood.word}</div>
          <div className="label">stemming</div>
        </div>
        <div className="raised rounded-2xl p-2">
          <div className="text-xl font-extrabold">{Math.round(bloom * 100)}%</div>
          <div className="label">opgebloeid</div>
        </div>
      </div>
      <p className="muted text-[13px]">
        Een mix van jong en oud en van verschillende inkomens geeft extra buurtgevoel (nu keer {diversityOf(s).toLocaleString('nl-NL')}).
      </p>
      <div>
        <SectionTitle>Wie woont hier?</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {residents.map((r) => (
            <button key={r.id} type="button" onClick={() => onPerson(r.id)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white/5 text-left">
              <Avatar r={r} size={28} />
              <span className="truncate font-bold text-[14px]">{displayName(r)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>Buurtnieuws</SectionTitle>
        <ul className="flex flex-col gap-1.5">
          {s.log.slice(0, 16).map((l) => (
            <li key={l.id} className="text-[14px]">
              <span className="muted text-[13px]">Dag {l.day + 1}. </span>
              {l.text}
            </li>
          ))}
        </ul>
      </div>
      {s.formerNeighbours.length > 0 && (
        <div>
          <SectionTitle>Oud-buren</SectionTitle>
          <p className="muted text-[14px]">{s.formerNeighbours.map((f) => f.name).join(', ')}</p>
        </div>
      )}
      <p className="muted text-[13px]">
        {SEASON_LABEL[season]}, jaar {year}. Elk seizoen duurt twaalf dagen.
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------
// Alleen zichtbaar met ?debug=1 in de adresbalk
// --------------------------------------------------------------------------

export function DebugPanel({ s, debug }) {
  const q = qualityMap(s);
  const owners = Object.values(s.units).filter((u) => u.householdId);
  const skDay = Object.values(s.residents).reduce((a, r) => a + r.skPerDay, 0) * s.diversity;
  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={debug.day}>+1 dag</button>
        <button type="button" className="btn" onClick={debug.season}>+1 seizoen</button>
        <button type="button" className="btn" onClick={debug.money}>+€ 500</button>
        <button type="button" className="btn" onClick={debug.sk}>+50 buurtgevoel</button>
        <button type="button" className="btn" onClick={debug.preview}>Voorbeeld: {debug.previewLabel}</button>
      </div>
      <div>Dag {s.day}, bloei {neighbourhoodBloom(s).toFixed(2)}, gem. positiviteit {s.avgPositivity}, diversiteit ×{s.diversity}, buurtgevoel per dag {skDay.toFixed(2)}</div>
      <table className="w-full">
        <thead>
          <tr className="muted text-left">
            <th>Woning</th>
            <th>Waarde</th>
            <th>Last</th>
            <th>Overwaarde</th>
            <th>Verkoop/seizoen</th>
          </tr>
        </thead>
        <tbody>
          {owners.map((u) => {
            const v = unitValuation(s, u, q, s.avgPositivity);
            return (
              <tr key={u.id}>
                <td>{u.label}</td>
                <td>{euro(v.value)}</td>
                <td>{euro(u.monthlyCost)}</td>
                <td>{(v.equity * 100).toFixed(0)}%</td>
                <td>{(v.sellChance * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="muted">Positiviteit per bewoner (thuis / omgeving / buren / behoefte → doel)</div>
      {Object.values(s.residents).map((r) => (
        <div key={r.id}>
          {displayName(r)}: {r.breakdown.home} / {r.breakdown.surroundings} / {r.breakdown.neighbours} / {r.breakdown.needs} → {r.breakdown.target} (nu {r.positivity}, +{r.skPerDay}/dag)
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <p className="muted">{text}</p>;
}

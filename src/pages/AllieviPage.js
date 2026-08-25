import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, CalendarDays, MapPin, X, SlidersHorizontal, ChevronDown, ChevronRight, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import BottomNav from '../componenti/BottomNav';
import SchedaAllievo from '../componenti/SchedaAllievo';
import { apiFetch, getInsegnanteId } from '../utils/api';

// ── utils ──────────────────────────────────────────────────────────────────
const ymd  = (d) => String(d || '').slice(0, 10);
const hhmm = (t) => t ? String(t).slice(0, 5) : '';

const parseHistory = (v) => {
  if (Array.isArray(v)) return v;
  try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
};
const statoLabel = (l) => {
  const raw = (l?.stato || 'appuntamentata').toLowerCase();
  if (raw === 'rimandata' && l?.riprogrammata && parseHistory(l?.old_schedules).length > 0) return 'riprogrammata';
  return raw;
};

const STATO_STYLE = {
  appuntamentata: 'bg-ama-100 text-blue-700 border-blue-100',
  svolta:         'bg-emerald-50 text-emerald-700 border-emerald-100',
  rimandata:      'bg-amber-50 text-amber-700 border-amber-100',
  riprogrammata:  'bg-purple-50 text-purple-700 border-purple-100',
  annullata:      'bg-red-50 text-red-700 border-red-100',
};

const STATI_OPZIONI = [
  { value: 'appuntamentata', label: 'Appuntamentata' },
  { value: 'svolta',         label: 'Svolta' },
  { value: 'rimandata',      label: 'Rimandata' },
  { value: 'riprogrammata',  label: 'Riprogrammata' },
  { value: 'annullata',      label: 'Annullata' },
];

const oggiStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const formatDataBreve = (ymdStr) => {
  if (!ymdStr) return '';
  const [y, m, d] = ymdStr.split('-');
  return new Date(Date.UTC(+y, +m-1, +d)).toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

// ── filtro avanzato default ────────────────────────────────────────────────
const defaultFiltro = () => ({ dataInizio: '', dataFine: '', stati: [] });

const contaFiltriAttivi = (f) => {
  let n = 0;
  if (f.dataInizio || f.dataFine) n++;
  if (f.stati.length) n++;
  return n;
};

// ── sub-componenti ─────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function FiltroButton({ attivi, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
        attivi > 0
          ? 'bg-ama-100 text-blue-700 border-blue-200'
          : 'bg-white text-n-600 border-n-100'
      }`}
    >
      <SlidersHorizontal size={13} />
      Filtri
      {attivi > 0 && (
        <span className="bg-ama-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {attivi}
        </span>
      )}
      <ChevronDown size={12} />
    </button>
  );
}

function PannelloFiltri({ filtro, onChange, onReset, oggi }) {
  const toggle = (stato) => {
    const stati = filtro.stati.includes(stato)
      ? filtro.stati.filter(s => s !== stato)
      : [...filtro.stati, stato];
    onChange({ ...filtro, stati });
  };

  return (
    <div className="bg-n-50 border border-gray-100 rounded-xl p-4 space-y-4">

      {/* Date rapide */}
      <div>
        <p className="text-xs font-semibold text-n-600 uppercase mb-2">Periodo</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {[
            { label: 'Oggi',           fn: () => onChange({ ...filtro, dataInizio: oggi, dataFine: oggi }) },
            { label: 'Questa settimana', fn: () => {
                const d = new Date(); d.setHours(0,0,0,0);
                const lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay()+6)%7));
                const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
                const f = (x) => x.toISOString().slice(0,10);
                onChange({ ...filtro, dataInizio: f(lun), dataFine: f(dom) });
              }
            },
            { label: 'Questo mese', fn: () => {
                const d = new Date();
                const ini = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
                const fin = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
                onChange({ ...filtro, dataInizio: ini, dataFine: fin });
              }
            },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-n-100 text-n-600 active:bg-n-100">
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-n-300 mb-1">Da</label>
            <input type="date" value={filtro.dataInizio}
              onChange={e => onChange({ ...filtro, dataInizio: e.target.value })}
              className="w-full border rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-n-300 mb-1">A</label>
            <input type="date" value={filtro.dataFine}
              onChange={e => onChange({ ...filtro, dataFine: e.target.value })}
              className="w-full border rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Stato */}
      <div>
        <p className="text-xs font-semibold text-n-600 uppercase mb-2">Stato lezione</p>
        <div className="flex flex-wrap gap-2">
          {STATI_OPZIONI.map(({ value, label }) => {
            const sel = filtro.stati.includes(value);
            return (
              <button key={value} onClick={() => toggle(value)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  sel
                    ? (STATO_STYLE[value] || 'bg-n-100 text-gray-700') + ' border-current'
                    : 'bg-white text-n-600 border-n-100'
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <button onClick={onReset}
        className="text-xs text-red-500 font-medium">
        Azzera filtri
      </button>
    </div>
  );
}

function LessonRow({ lezione, border }) {
  const label = statoLabel(lezione);
  const badgeClass = STATO_STYLE[label] || STATO_STYLE.appuntamentata;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${border ? 'border-b border-gray-50' : ''}`}>
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-400" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-n-900 truncate">
            {lezione.nome_allievo} {lezione.cognome_allievo}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs text-n-600">
          <span className="flex items-center gap-1">
            <CalendarDays size={11} /> {formatDataBreve(ymd(lezione.data))}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {hhmm(lezione.ora_inizio)}–{hhmm(lezione.ora_fine)}
          </span>
          {lezione.aula && (
            <span className="flex items-center gap-1"><MapPin size={11} /> {lezione.aula}</span>
          )}
        </div>
        {lezione.motivazione && label !== 'svolta' && label !== 'appuntamentata' && (
          <p className="text-xs text-n-300 mt-1 italic">{lezione.motivazione}</p>
        )}
      </div>
    </div>
  );
}

// ── SchedaGruppo ───────────────────────────────────────────────────────────
function SchedaGruppo({ gruppo, lezioniInsegnante, onClose }) {
  const [dettaglio, setDettaglio] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!gruppo) return;
    setLoading(true);
    apiFetch(`/api/gruppi/${gruppo.id}`)
      .then(setDettaglio)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gruppo]);

  if (!gruppo) return null;

  // lezioni del gruppo dai dati già caricati
  const lezioniGruppo = (lezioniInsegnante || []).filter(
    l => l.tipo === 'collettiva' && (l.gruppo_id === gruppo.id || l.nome_gruppo === gruppo.nome)
  );
  const svolte     = lezioniGruppo.filter(l => l.stato === 'svolta').length;
  const future     = lezioniGruppo.filter(l => l.stato === 'appuntamentata').length;
  const annullate  = lezioniGruppo.filter(l => l.stato === 'annullata').length;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-xl flex flex-col" style={{ maxHeight: 'calc(90vh - 56px - env(safe-area-inset-bottom))' }}>
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
          <button onClick={onClose} className="text-n-300 -ml-1"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-n-900 truncate">{gruppo.nome}</h2>
            <p className="text-xs text-n-300">Gruppo</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={17} className="text-blue-500" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Svolte',     n: svolte,    cls: 'bg-emerald-50 text-emerald-700' },
              { label: 'Future',     n: future,    cls: 'bg-ama-100 text-blue-700' },
              { label: 'Annullate',  n: annullate, cls: 'bg-red-50 text-red-700' },
            ].map(({ label, n, cls }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-xs mt-0.5 opacity-80">{label}</p>
              </div>
            ))}
          </div>

          {/* Partecipanti */}
          <div>
            <p className="text-xs font-semibold text-n-600 uppercase mb-2">
              Partecipanti ({dettaglio?.allievi?.length ?? gruppo.num_allievi ?? 0})
            </p>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (dettaglio?.allievi || []).length === 0 ? (
              <p className="text-sm text-n-300 text-center py-4">Nessun partecipante.</p>
            ) : (
              <div className="bg-n-50 rounded-xl divide-y divide-gray-100">
                {(dettaglio.allievi || []).map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-ama-500">
                        {(a.nome?.[0]||'').toUpperCase()}{(a.cognome?.[0]||'').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-n-900">{a.nome} {a.cognome}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ultime lezioni */}
          {lezioniGruppo.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-n-600 uppercase mb-2">Ultime lezioni</p>
              <div className="bg-n-50 rounded-xl divide-y divide-gray-100">
                {lezioniGruppo.slice(0, 5).map(l => {
                  const badge = {
                    svolta: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    appuntamentata: 'bg-ama-100 text-blue-700 border-blue-100',
                    rimandata: 'bg-amber-50 text-amber-700 border-amber-100',
                    annullata: 'bg-red-50 text-red-700 border-red-100',
                  }[l.stato] || 'bg-n-100 text-gray-700 border-n-100';
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-n-600">{formatDataBreve(ymd(l.data))} · {hhmm(l.ora_inizio)}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge}`}>{l.stato}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── pagina ─────────────────────────────────────────────────────────────────
export default function AllieviPage() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState('allievi');
  const [allievi, setAllievi]       = useState([]);
  const [lezioni, setLezioni]       = useState([]);
  const [gruppi, setGruppi]         = useState([]);
  const [schedaAllievo, setSchedaAllievo] = useState(null);
  const [schedaGruppo, setSchedaGruppo]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [searchAllievi, setSearchAllievi] = useState('');
  const [searchPassate, setSearchPassate] = useState('');
  const [searchFuture,  setSearchFuture]  = useState('');

  const [filtroPassate, setFiltroPassate] = useState(defaultFiltro);
  const [filtroFuture,  setFiltroFuture]  = useState(defaultFiltro);
  const [showFiltroPassate, setShowFiltroPassate] = useState(false);
  const [showFiltroFuture,  setShowFiltroFuture]  = useState(false);

  const oggi = oggiStr();

  const carica = useCallback(async () => {
    const id = getInsegnanteId();
    if (!id) { navigate('/login'); return; }
    setLoading(true);
    try {
      const [all, lez, grp] = await Promise.all([
        apiFetch(`/api/insegnanti/${id}/allievi`),
        apiFetch(`/api/insegnanti/${id}/lezioni`),
        apiFetch('/api/gruppi'),
      ]);
      setAllievi(Array.isArray(all) ? all : []);
      setLezioni(Array.isArray(lez) ? lez : []);
      // mostra solo i gruppi assegnati a questo insegnante
      const idNum = parseInt(id, 10);
      setGruppi((Array.isArray(grp) ? grp : []).filter(g => g.insegnante_id === idNum));
    } catch (e) {
      if (e?.status === 401 || e?.status === 403) navigate('/login');
      else setError(e.message || 'Errore di caricamento.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { carica(); }, [carica]);

  // applica filtro a una lista
  const applicaFiltro = (lista, filtro, search) => {
    let r = lista;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(l => `${l.nome_allievo || ''} ${l.cognome_allievo || ''}`.toLowerCase().includes(q));
    }
    if (filtro.dataInizio) r = r.filter(l => ymd(l.data) >= filtro.dataInizio);
    if (filtro.dataFine)   r = r.filter(l => ymd(l.data) <= filtro.dataFine);
    if (filtro.stati.length) {
      r = r.filter(l => filtro.stati.includes(statoLabel(l)));
    }
    return r;
  };

  const filteredAllievi = useMemo(() => {
    const q = searchAllievi.trim().toLowerCase();
    return q ? allievi.filter(a => `${a.nome} ${a.cognome}`.toLowerCase().includes(q)) : allievi;
  }, [allievi, searchAllievi]);

  const lezioniPassate = useMemo(() => {
    const base = lezioni.filter(l => ymd(l.data) < oggi);
    return applicaFiltro(base, filtroPassate, searchPassate)
      .sort((a, b) => ymd(b.data).localeCompare(ymd(a.data)));
  }, [lezioni, searchPassate, filtroPassate, oggi]);

  const lezioniFuture = useMemo(() => {
    const base = lezioni.filter(l => ymd(l.data) >= oggi);
    return applicaFiltro(base, filtroFuture, searchFuture)
      .sort((a, b) => ymd(a.data).localeCompare(ymd(b.data)));
  }, [lezioni, searchFuture, filtroFuture, oggi]);

  const TABS = [
    { id: 'allievi', label: 'Lista',        count: allievi.length + gruppi.length },
    { id: 'passate', label: 'Lez. passate', count: lezioni.filter(l => ymd(l.data) < oggi).length },
    { id: 'future',  label: 'Lez. future',  count: lezioni.filter(l => ymd(l.data) >= oggi).length },
  ];

  return (
    <div className="min-h-screen bg-n-50 pb-20">

      {/* Header + tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-base font-semibold text-n-900">Allievi</h1>
        </div>
        <div className="max-w-xl mx-auto flex border-t">
          {TABS.map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === id ? 'border-blue-600 text-ama-500' : 'border-transparent text-n-600'
              }`}>
              {label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  tab === id ? 'bg-ama-100 text-blue-700' : 'bg-n-100 text-n-600'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* ── Lista allievi + gruppi ── */}
            {tab === 'allievi' && (
              <>
                <div className="mb-4">
                  <SearchBar value={searchAllievi} onChange={setSearchAllievi} placeholder="Cerca allievo…" />
                </div>

                {filteredAllievi.length === 0 && gruppi.length === 0 ? (
                  <Empty text={searchAllievi ? 'Nessun allievo trovato.' : 'Nessun allievo assegnato.'} />
                ) : (
                  <>
                    {filteredAllievi.length > 0 && (
                      <div className="bg-white border rounded-xl overflow-hidden mb-4">
                        {filteredAllievi.map((a, i) => (
                          <button
                            key={a.id}
                            onClick={() => setSchedaAllievo(a)}
                            className={`flex items-center gap-3 px-4 py-3 w-full text-left active:bg-n-50 ${i < filteredAllievi.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-ama-500">
                                {(a.nome?.[0] || '').toUpperCase()}{(a.cognome?.[0] || '').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-n-900 truncate">{a.nome} {a.cognome}</p>
                              {a.strumento && <p className="text-xs text-n-300">{a.strumento}</p>}
                            </div>
                            <ChevronRight size={16} className="text-n-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {!searchAllievi && gruppi.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-n-600 uppercase mb-2">Gruppi</p>
                        <div className="bg-white border rounded-xl overflow-hidden">
                          {gruppi.map((g, i) => (
                            <button
                              key={g.id}
                              onClick={() => setSchedaGruppo(g)}
                              className={`flex items-center gap-3 px-4 py-3 w-full text-left active:bg-n-50 ${i < gruppi.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <Users size={16} className="text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-n-900 truncate">{g.nome}</p>
                                <p className="text-xs text-n-300">
                                  {g.num_allievi} {g.num_allievi === 1 ? 'partecipante' : 'partecipanti'}
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-n-300 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Lezioni passate ── */}
            {tab === 'passate' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <SearchBar value={searchPassate} onChange={setSearchPassate} placeholder="Cerca allievo…" />
                  </div>
                  <FiltroButton
                    attivi={contaFiltriAttivi(filtroPassate)}
                    onClick={() => setShowFiltroPassate(v => !v)}
                  />
                </div>
                {showFiltroPassate && (
                  <div className="mb-3">
                    <PannelloFiltri
                      filtro={filtroPassate}
                      onChange={setFiltroPassate}
                      onReset={() => setFiltroPassate(defaultFiltro())}
                      oggi={oggi}
                    />
                  </div>
                )}
                {lezioniPassate.length === 0 ? (
                  <Empty text={searchPassate || contaFiltriAttivi(filtroPassate) ? 'Nessuna lezione trovata con i filtri applicati.' : 'Nessuna lezione passata.'} />
                ) : (
                  <div className="bg-white border rounded-xl overflow-hidden">
                    {lezioniPassate.map((l, i) => (
                      <LessonRow key={l.id ?? i} lezione={l} border={i < lezioniPassate.length - 1} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Gruppi ── */}
            {tab === 'gruppi' && (
              gruppi.length === 0 ? (
                <Empty text="Nessun gruppo assegnato." />
              ) : (
                <div className="bg-white border rounded-xl overflow-hidden">
                  {gruppi.map((g, i) => (
                    <div
                      key={g.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i < gruppi.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-n-900 truncate">{g.nome}</p>
                        <p className="text-xs text-n-300">
                          {g.num_allievi} {g.num_allievi === 1 ? 'partecipante' : 'partecipanti'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Lezioni future ── */}
            {tab === 'future' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <SearchBar value={searchFuture} onChange={setSearchFuture} placeholder="Cerca allievo…" />
                  </div>
                  <FiltroButton
                    attivi={contaFiltriAttivi(filtroFuture)}
                    onClick={() => setShowFiltroFuture(v => !v)}
                  />
                </div>
                {showFiltroFuture && (
                  <div className="mb-3">
                    <PannelloFiltri
                      filtro={filtroFuture}
                      onChange={setFiltroFuture}
                      onReset={() => setFiltroFuture(defaultFiltro())}
                      oggi={oggi}
                    />
                  </div>
                )}
                {lezioniFuture.length === 0 ? (
                  <Empty text={searchFuture || contaFiltriAttivi(filtroFuture) ? 'Nessuna lezione trovata con i filtri applicati.' : 'Nessuna lezione futura.'} />
                ) : (
                  <div className="bg-white border rounded-xl overflow-hidden">
                    {lezioniFuture.map((l, i) => (
                      <LessonRow key={l.id ?? i} lezione={l} border={i < lezioniFuture.length - 1} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <SchedaAllievo
        allievo={schedaAllievo}
        lezioniInsegnante={lezioni}
        onClose={() => setSchedaAllievo(null)}
      />
      <SchedaGruppo
        gruppo={schedaGruppo}
        lezioniInsegnante={lezioni}
        onClose={() => setSchedaGruppo(null)}
      />
      <BottomNav />
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="bg-white border border-dashed rounded-xl p-8 text-center text-n-300 text-sm">
      {text}
    </div>
  );
}

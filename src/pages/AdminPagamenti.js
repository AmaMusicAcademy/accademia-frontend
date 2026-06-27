import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import CompensoInsegnante from '../componenti/CompensoInsegnante';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MESI_NOME = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function nomeMese(anno, mese) {
  return `${MESI_NOME[mese - 1]} ${anno}`;
}

function prevMese(anno, mese) {
  return mese === 1 ? { anno: anno - 1, mese: 12 } : { anno, mese: mese - 1 };
}
function nextMese(anno, mese) {
  return mese === 12 ? { anno: anno + 1, mese: 1 } : { anno, mese: mese + 1 };
}

function QuoteAllievi({ token }) {
  const now = new Date();
  const [anno, setAnno] = useState(now.getFullYear());
  const [mese, setMese] = useState(now.getMonth() + 1);
  const [dati, setDati] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState({}); // { [id]: true }

  const carica = (a, m) => {
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/pagamenti-overview?anno=${a}&mese=${m}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setDati(Array.isArray(d?.allievi) ? d.allievi : Array.isArray(d) ? d : []))
      .catch(() => setDati([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carica(anno, mese); }, [anno, mese]);

  const vai = (dir) => {
    const { anno: na, mese: nm } = dir === 'prev' ? prevMese(anno, mese) : nextMese(anno, mese);
    setAnno(na); setMese(nm);
  };

  const handleToggle = async (allievo) => {
    if (toggling[allievo.id]) return;
    setToggling(t => ({ ...t, [allievo.id]: true }));
    try {
      if (allievo.pagato) {
        await fetch(`${BASE_URL}/api/allievi/${allievo.id}/pagamenti?anno=${anno}&mese=${mese}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(`${BASE_URL}/api/allievi/${allievo.id}/pagamenti`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ anno, mese }),
        });
      }
      // aggiorna localmente
      setDati(prev => prev.map(r =>
        r.id === allievo.id
          ? { ...r, pagato: !r.pagato, data_pagamento: !r.pagato ? new Date().toISOString() : null }
          : r
      ));
    } catch { /* lascia invariato */ }
    finally { setToggling(t => ({ ...t, [allievo.id]: false })); }
  };

  const filtroDati = dati.filter(r => {
    const q = search.trim().toLowerCase();
    return !q || `${r.nome} ${r.cognome}`.toLowerCase().includes(q);
  });

  const pagati    = dati.filter(r => r.pagato).length;
  const nonPagati = dati.filter(r => !r.pagato).length;

  return (
    <div className="space-y-4">

      {/* Navigatore mese */}
      <div className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => vai('prev')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 text-lg font-medium">‹</button>
        <p className="text-sm font-semibold text-gray-900">{nomeMese(anno, mese)}</p>
        <button onClick={() => vai('next')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 text-lg font-medium">›</button>
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700 leading-none">{pagati}</p>
          <p className="text-xs text-emerald-600 mt-1">Pagate</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700 leading-none">{nonPagati}</p>
          <p className="text-xs text-red-600 mt-1">Non pagate</p>
        </div>
      </div>

      {/* Barra di ricerca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtroDati.length === 0 ? (
        <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-gray-400">
          {search ? 'Nessun risultato.' : 'Nessun allievo per questo mese.'}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtroDati.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-500">
                  {(r.nome?.[0]||'').toUpperCase()}{(r.cognome?.[0]||'').toUpperCase()}
                </span>
              </div>
              {/* Nome + data pagamento */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.nome} {r.cognome}</p>
                {r.pagato && r.data_pagamento ? (
                  <p className="text-xs text-gray-400">
                    Pagato il {new Date(r.data_pagamento).toLocaleDateString('it-IT')}
                  </p>
                ) : r.quota_mensile ? (
                  <p className="text-xs text-gray-400">€ {r.quota_mensile} / mese</p>
                ) : null}
              </div>
              {/* Toggle pagamento */}
              <button
                onClick={() => handleToggle(r)}
                disabled={!!toggling[r.id]}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                  r.pagato
                    ? 'bg-emerald-100 text-emerald-700 active:bg-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-100 active:bg-red-100'
                }`}
              >
                {toggling[r.id] ? '…' : r.pagato ? '✓ Pagato' : 'Non pagato'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PannelloNotifiche({ token }) {
  const [status, setStatus]   = useState(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/admin/cron-status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStatus(d)).catch(() => {});
  }, []);

  const inviaOra = async () => {
    setSending(true); setMsg('');
    try {
      const r = await fetch(`${BASE_URL}/api/admin/notifiche-pagamento-auto`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setMsg(`${d.notifiche_inviate} notifiche inviate.`);
      // aggiorna status
      fetch(`${BASE_URL}/api/admin/cron-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r2 => r2.json()).then(setStatus).catch(() => {});
    } catch { setMsg('Errore nell\'invio.'); }
    finally { setSending(false); }
  };

  const fmtDt = (d) => d ? new Date(d).toLocaleString('it-IT', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div className="bg-white border rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-amber-500" />
          <p className="text-sm font-semibold text-gray-800">Notifiche automatiche</p>
        </div>
        <button onClick={inviaOra} disabled={sending}
          className="flex items-center gap-1.5 text-xs text-blue-600 font-medium disabled:opacity-40">
          <RefreshCw size={12} className={sending ? 'animate-spin' : ''} />
          {sending ? 'Invio…' : 'Invia ora'}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Ogni <strong>lunedì alle 09:00</strong> gli allievi con pagamenti arretrati ricevono un promemoria automatico. Ultima esecuzione: <strong>{status ? fmtDt(status.eseguito_il) : '—'}</strong>
        {status?.notifiche_inviate != null && ` (${status.notifiche_inviate} notifiche)`}.
      </p>
      {msg && <p className="text-xs text-emerald-600 font-medium">{msg}</p>}
    </div>
  );
}

function TassaAnnuale({ token }) {
  const now = new Date();
  const [anno, setAnno] = useState(now.getFullYear());
  const [dati, setDati] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState({});

  const carica = (a) => {
    setLoading(true);
    fetch(`${BASE_URL}/api/admin/quote-associative-overview?anno=${a}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setDati(Array.isArray(d?.allievi) ? d.allievi : []))
      .catch(() => setDati([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carica(anno); }, [anno]);

  const handleToggle = async (allievo) => {
    if (toggling[allievo.id]) return;
    setToggling(t => ({ ...t, [allievo.id]: true }));
    try {
      await fetch(`${BASE_URL}/api/allievi/${allievo.id}/quota-associativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anno, pagata: !allievo.pagata }),
      });
      setDati(prev => prev.map(r =>
        r.id === allievo.id
          ? { ...r, pagata: !r.pagata, data_pagamento: !r.pagata ? new Date().toISOString() : null }
          : r
      ));
    } catch { /* invariato */ }
    finally { setToggling(t => ({ ...t, [allievo.id]: false })); }
  };

  const filtroDati = dati.filter(r => {
    const q = search.trim().toLowerCase();
    return !q || `${r.nome} ${r.cognome}`.toLowerCase().includes(q);
  });

  const pagate    = dati.filter(r => r.pagata).length;
  const nonPagate = dati.filter(r => !r.pagata).length;
  const annoOptions = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 2; y--) annoOptions.push(y);

  return (
    <div className="space-y-4">

      {/* Selettore anno */}
      <div className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => setAnno(a => a - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 text-lg font-medium">‹</button>
        <p className="text-sm font-semibold text-gray-900">{anno}</p>
        <button onClick={() => setAnno(a => a + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 text-lg font-medium">›</button>
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700 leading-none">{pagate}</p>
          <p className="text-xs text-emerald-600 mt-1">Pagate</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700 leading-none">{nonPagate}</p>
          <p className="text-xs text-red-600 mt-1">Non pagate</p>
        </div>
      </div>

      {/* Ricerca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtroDati.length === 0 ? (
        <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-gray-400">
          {search ? 'Nessun risultato.' : 'Nessun allievo.'}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtroDati.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-500">
                  {(r.nome?.[0]||'').toUpperCase()}{(r.cognome?.[0]||'').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.nome} {r.cognome}</p>
                {r.pagata && r.data_pagamento ? (
                  <p className="text-xs text-gray-400">
                    Pagata il {new Date(r.data_pagamento).toLocaleDateString('it-IT')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Tassa {anno}</p>
                )}
              </div>
              <button
                onClick={() => handleToggle(r)}
                disabled={!!toggling[r.id]}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                  r.pagata
                    ? 'bg-emerald-100 text-emerald-700 active:bg-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-100 active:bg-red-100'
                }`}
              >
                {toggling[r.id] ? '…' : r.pagata ? '✓ Pagata' : 'Non pagata'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPagamenti() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [tab, setTab] = useState('allievi'); // 'allievi' | 'tassa' | 'insegnanti'
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnanteId, setInsegnanteId] = useState('');

  useEffect(() => {
    let abort = false;
    if (!token) return;
    fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((js) => { if (!abort) setInsegnanti(Array.isArray(js) ? js : []); })
      .catch(() => { if (!abort) setInsegnanti([]); });
    return () => { abort = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between pb-16">
      <PageHeader title="Pagamenti" backTo="/admin" />

      {/* Tab switcher */}
      <div className="flex bg-white border-b">
        {[
          { id: 'allievi',    label: 'Quote mensili' },
          { id: 'tassa',      label: 'Tassa annuale' },
          { id: 'insegnanti', label: 'Compensi' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'allievi' && (
          <div className="space-y-4">
            <PannelloNotifiche token={token} />
            <QuoteAllievi token={token} />
          </div>
        )}

        {tab === 'tassa' && (
          <div className="space-y-4">
            <PannelloNotifiche token={token} />
            <TassaAnnuale token={token} />
          </div>
        )}

        {tab === 'insegnanti' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <label className="block text-xs text-gray-600 mb-1">Seleziona insegnante</label>
              <select
                value={insegnanteId}
                onChange={(e) => setInsegnanteId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">— Scegli —</option>
                {insegnanti.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.cognome ? `${i.cognome} ${i.nome}` : `${i.nome} ${i.cognome || ''}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Seleziona un insegnante per scegliere il mese e generare il PDF.
              </p>
            </div>
            {insegnanteId ? (
              <div className="bg-transparent">
                <CompensoInsegnante insegnanteId={insegnanteId} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600">
                Nessun insegnante selezionato.
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}
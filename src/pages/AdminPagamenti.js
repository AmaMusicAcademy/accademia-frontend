import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Link2, AlertCircle, CheckCircle2, X, CreditCard } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

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
        <button onClick={() => vai('prev')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 text-n-600 active:bg-n-100 text-lg font-medium">‹</button>
        <p className="text-sm font-semibold text-n-900">{nomeMese(anno, mese)}</p>
        <button onClick={() => vai('next')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 text-n-600 active:bg-n-100 text-lg font-medium">›</button>
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300">
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
        <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
          {search ? 'Nessun risultato.' : 'Nessun allievo per questo mese.'}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtroDati.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-500">
                  {(r.nome?.[0]||'').toUpperCase()}{(r.cognome?.[0]||'').toUpperCase()}
                </span>
              </div>
              {/* Nome + data pagamento */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-n-900 truncate">{r.nome} {r.cognome}</p>
                {r.pagato && r.data_pagamento ? (
                  <p className="text-xs text-n-300">
                    Pagato il {new Date(r.data_pagamento).toLocaleDateString('it-IT')}
                  </p>
                ) : r.quota_mensile ? (
                  <p className="text-xs text-n-300">€ {r.quota_mensile} / mese</p>
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
          <p className="text-sm font-semibold text-n-900">Notifiche automatiche</p>
        </div>
        <button onClick={inviaOra} disabled={sending}
          className="flex items-center gap-1.5 text-xs text-ama-500 font-medium disabled:opacity-40">
          <RefreshCw size={12} className={sending ? 'animate-spin' : ''} />
          {sending ? 'Invio…' : 'Invia ora'}
        </button>
      </div>
      <p className="text-xs text-n-300">
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
        <button onClick={() => setAnno(a => a - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 text-n-600 active:bg-n-100 text-lg font-medium">‹</button>
        <p className="text-sm font-semibold text-n-900">{anno}</p>
        <button onClick={() => setAnno(a => a + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 text-n-600 active:bg-n-100 text-lg font-medium">›</button>
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300">
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
        <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
          {search ? 'Nessun risultato.' : 'Nessun allievo.'}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtroDati.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-500">
                  {(r.nome?.[0]||'').toUpperCase()}{(r.cognome?.[0]||'').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-n-900 truncate">{r.nome} {r.cognome}</p>
                {r.pagata && r.data_pagamento ? (
                  <p className="text-xs text-n-300">
                    Pagata il {new Date(r.data_pagamento).toLocaleDateString('it-IT')}
                  </p>
                ) : (
                  <p className="text-xs text-n-300">Tassa {anno}</p>
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

const MESI_NOME_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

function fmtMesiRegistrati(mesi_registrati, tipo) {
  if (!mesi_registrati) return '—';
  const list = typeof mesi_registrati === 'string' ? JSON.parse(mesi_registrati) : mesi_registrati;
  if (!list?.length) return '—';
  if (tipo === 'associativa') return `Tassa ${list[0].anno}`;
  return list.map(({ anno, mese }) => `${MESI_NOME_SHORT[mese - 1]} ${anno}`).join(', ');
}

function SyncQonto({ token }) {
  const [syncing, setSyncing]           = useState(false);
  const [result, setResult]             = useState(null);
  const [nonAbbinate, setNonAbbinate]   = useState([]);
  const [storico, setStorico]           = useState([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [view, setView]                 = useState('nonAbbinate');
  const [modal, setModal]               = useState(null);
  const [allievi, setAllievi]           = useState([]);
  const [abbinando, setAbbinando]       = useState(false);
  const [scartando, setScartando]       = useState({});
  const [annullando, setAnnullando]     = useState({});

  // form abbinamento manuale — supporta più mesi
  const now = new Date();
  const [formAllievo, setFormAllievo]   = useState('');
  const [formTipo, setFormTipo]         = useState('mensile');
  const [formAnno, setFormAnno]         = useState(now.getFullYear());
  const [formMesi, setFormMesi]         = useState([now.getMonth() + 1]); // array di mesi selezionati

  const hdr = { Authorization: `Bearer ${token}` };

  const carica = useCallback(async () => {
    setLoadingList(true);
    try {
      const [na, st] = await Promise.all([
        fetch(`${BASE_URL}/api/qonto/non-abbinate`, { headers: hdr }).then(r => r.json()),
        fetch(`${BASE_URL}/api/qonto/storico`,       { headers: hdr }).then(r => r.json()),
      ]);
      setNonAbbinate(Array.isArray(na) ? na : []);
      setStorico(Array.isArray(st) ? st : []);
    } catch { /* ignora */ }
    finally { setLoadingList(false); }
  }, [token]);

  useEffect(() => {
    carica();
    fetch(`${BASE_URL}/api/allievi`, { headers: hdr })
      .then(r => r.json())
      .then(d => setAllievi(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [carica]);

  const sync = async () => {
    setSyncing(true); setResult(null);
    try {
      const r = await fetch(`${BASE_URL}/api/qonto/sync`, { method: 'POST', headers: hdr });
      const d = await r.json();
      setResult(d);
      if (d.ok) await carica();
    } catch (e) { setResult({ error: e.message }); }
    finally { setSyncing(false); }
  };

  const apriAbbina = (tx) => {
    setModal(tx);
    setFormAllievo('');
    setFormTipo('mensile');
    setFormAnno(now.getFullYear());
    setFormMesi([now.getMonth() + 1]);
  };

  const toggleMese = (m) => {
    setFormMesi(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b));
  };

  const confermaAbbina = async () => {
    if (!formAllievo) return;
    setAbbinando(true);
    try {
      const mesi = formTipo === 'mensile'
        ? formMesi.map(m => ({ anno: formAnno, mese: m }))
        : formTipo === 'mensile+associativa'
          ? [...formMesi.map(m => ({ anno: formAnno, mese: m })), { anno: formAnno }]
          : [{ anno: formAnno }];
      await fetch(`${BASE_URL}/api/qonto/abbina`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ qonto_tx_id: modal.qonto_tx_id, allievo_id: formAllievo, tipo_pagamento: formTipo, mesi }),
      });
      setModal(null);
      await carica();
    } catch { /* ignora */ }
    finally { setAbbinando(false); }
  };

  const scartaNonAbbinata = async (tx) => {
    if (!window.confirm(`Scartare il bonifico di ${euro(tx.importo)} da "${tx.mittente}"? Verrà rimosso dalla lista.`)) return;
    setScartando(s => ({ ...s, [tx.id]: true }));
    try {
      await fetch(`${BASE_URL}/api/qonto/non-abbinate/${tx.id}`, { method: 'DELETE', headers: hdr });
      await carica();
    } catch { /* ignora */ }
    finally { setScartando(s => ({ ...s, [tx.id]: false })); }
  };

  const annullaAbbinamento = async (tx) => {
    const label = fmtMesiRegistrati(tx.mesi_registrati, tx.tipo_pagamento);
    if (!window.confirm(`Annullare l'abbinamento di ${euro(tx.importo)} da "${tx.mittente}" (${label})?\nI pagamenti registrati verranno rimossi.`)) return;
    setAnnullando(s => ({ ...s, [tx.id]: true }));
    try {
      await fetch(`${BASE_URL}/api/qonto/abbina/${tx.id}`, { method: 'DELETE', headers: hdr });
      await carica();
    } catch { /* ignora */ }
    finally { setAnnullando(s => ({ ...s, [tx.id]: false })); }
  };

  const fmtData = (d) => {
    if (!d) return '—';
    const [y, m, g] = d.slice(0, 10).split('-');
    return `${g}/${m}/${y}`;
  };

  const euro = (n) => `€ ${parseFloat(n).toFixed(2)}`;

  return (
    <div className="space-y-4">
      {/* Pannello sync */}
      <div className="bg-white border rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-blue-500" />
            <p className="text-sm font-semibold text-n-900">Sincronizzazione Qonto</p>
          </div>
          <button onClick={sync} disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-ama-500 font-medium disabled:opacity-40">
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sync…' : 'Sincronizza ora'}
          </button>
        </div>
        <p className="text-xs text-n-300 mb-2">
          Scarica le transazioni in entrata dal conto Qonto e le abbina automaticamente per nome mittente o causale. I bonifici multi-mese vengono divisi automaticamente.
        </p>
        {result && (
          result.error ? (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={13} /> {result.error}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <CheckCircle2 size={13} />
              {result.nuove} nuove · {result.abbinate} abbinate · {result.nonAbbinate} da verificare
            </div>
          )
        )}
      </div>

      {/* Toggle lista */}
      <div className="flex bg-white border rounded-xl overflow-hidden">
        {[
          { id: 'nonAbbinate', label: `Da abbinare${nonAbbinate.length ? ` (${nonAbbinate.length})` : ''}` },
          { id: 'storico',     label: 'Storico abbinate' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              view === id ? 'bg-ama-500 text-white' : 'text-n-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loadingList ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'nonAbbinate' ? (
        nonAbbinate.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
            Nessuna transazione da abbinare.
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
            {nonAbbinate.map(tx => (
              <div key={tx.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-n-900 truncate">{tx.mittente || '—'}</p>
                    <p className="text-xs text-n-300 truncate">{tx.causale || 'Nessuna causale'}</p>
                    <p className="text-xs text-n-400">{fmtData(tx.data)}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-700 shrink-0">{euro(tx.importo)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => apriAbbina(tx)}
                    className="flex-1 py-1.5 rounded-lg bg-ama-500 text-white text-xs font-medium">
                    Abbina
                  </button>
                  <button onClick={() => scartaNonAbbinata(tx)} disabled={!!scartando[tx.id]}
                    className="flex-1 py-1.5 rounded-lg border border-n-200 text-n-500 text-xs font-medium disabled:opacity-40">
                    {scartando[tx.id] ? '…' : 'Scarta'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        storico.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
            Nessuna transazione abbinata.
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
            {storico.map(tx => (
              <div key={tx.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-n-900 truncate">{tx.nome} {tx.cognome}</p>
                    <p className="text-xs text-n-300 truncate">{tx.mittente}</p>
                    <p className="text-xs text-n-400">
                      {fmtData(tx.data)} · {fmtMesiRegistrati(tx.mesi_registrati, tx.tipo_pagamento)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-700 shrink-0">{euro(tx.importo)}</p>
                </div>
                <button onClick={() => annullaAbbinamento(tx)} disabled={!!annullando[tx.id]}
                  className="w-full py-1.5 rounded-lg border border-red-100 text-red-500 text-xs font-medium disabled:opacity-40">
                  {annullando[tx.id] ? '…' : 'Annulla abbinamento'}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal abbinamento manuale */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-n-900">Abbina transazione</p>
              <button onClick={() => setModal(null)}><X size={18} className="text-n-400" /></button>
            </div>
            <div className="bg-n-50 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm font-medium text-n-900">{modal.mittente}</p>
              <p className="text-xs text-n-300">{modal.causale || 'Nessuna causale'}</p>
              <p className="text-sm font-bold text-emerald-700">{euro(modal.importo)} · {fmtData(modal.data)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-n-600 mb-1">Allievo</label>
                <select value={formAllievo} onChange={e => setFormAllievo(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm">
                  <option value="">— Seleziona —</option>
                  {allievi.map(a => (
                    <option key={a.id} value={a.id}>{a.cognome} {a.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-n-600 mb-1">Tipo pagamento</label>
                <select value={formTipo} onChange={e => setFormTipo(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm">
                  <option value="mensile">Quota mensile</option>
                  <option value="associativa">Tassa associativa</option>
                  <option value="mensile+associativa">Quota mensile + Tassa associativa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-n-600 mb-1">Anno</label>
                <input type="number" value={formAnno} onChange={e => setFormAnno(parseInt(e.target.value))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              {(formTipo === 'mensile' || formTipo === 'mensile+associativa') && (
                <div>
                  <label className="block text-xs text-n-600 mb-2">Mesi coperti (seleziona uno o più)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MESI_NOME_SHORT.map((m, i) => {
                      const mNum = i + 1;
                      const sel = formMesi.includes(mNum);
                      return (
                        <button key={mNum} type="button" onClick={() => toggleMese(mNum)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            sel ? 'bg-ama-500 text-white border-ama-500' : 'bg-white text-n-600 border-n-200'
                          }`}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                  {formMesi.length > 0 && (
                    <p className="text-xs text-n-400 mt-1">
                      Selezionati: {formMesi.map(m => MESI_NOME_SHORT[m - 1]).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={confermaAbbina}
              disabled={!formAllievo || abbinando || ((formTipo === 'mensile' || formTipo === 'mensile+associativa') && formMesi.length === 0)}
              className="w-full bg-ama-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40">
              {abbinando ? 'Salvataggio…' : 'Conferma abbinamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PagamentiStripe({ token }) {
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const carica = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/stripe/pagamenti-admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setPagamenti(Array.isArray(d) ? d : []))
      .catch(() => setPagamenti([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carica(); }, []);

  const fmtData = (d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMesi = (mesi) => {
    if (!mesi?.length) return '—';
    return mesi.map(m => `${MESI_NOME[m.mese - 1]} ${m.anno}`).join(', ');
  };

  const filtrati = pagamenti.filter(p => {
    const q = search.trim().toLowerCase();
    return !q || p.allievo_nome.toLowerCase().includes(q);
  });

  const totale = pagamenti.reduce((s, p) => s + p.importo, 0);

  return (
    <div className="space-y-4">
      {/* Intestazione con totale e refresh */}
      <div className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={15} className="text-ama-500" />
          <p className="text-sm font-semibold text-n-900">Pagamenti via app</p>
        </div>
        <button onClick={carica} className="flex items-center gap-1.5 text-xs text-ama-500 font-medium">
          <RefreshCw size={12} />
          Aggiorna
        </button>
      </div>

      {/* Totale incassato */}
      {!loading && pagamenti.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700 leading-none">€{totale.toFixed(2)}</p>
            <p className="text-xs text-emerald-600 mt-1">Totale incassato</p>
          </div>
          <div className="bg-ama-50 border border-ama-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-ama-700 leading-none">{pagamenti.length}</p>
            <p className="text-xs text-ama-600 mt-1">Transazioni</p>
          </div>
        </div>
      )}

      {/* Ricerca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrati.length === 0 ? (
        <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
          {search ? 'Nessun risultato.' : 'Nessun pagamento ricevuto via app.'}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
          {filtrati.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-n-900 truncate">{p.allievo_nome}</p>
                <p className="text-xs text-n-400 truncate">
                  {p.tipo === 'abbonamento' ? 'Abbonamento mensile' : fmtMesi(p.mesi)}
                </p>
                <p className="text-xs text-n-300">{fmtData(p.data)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-700">€{p.importo.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.tipo === 'abbonamento' ? 'bg-ama-100 text-ama-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {p.tipo === 'abbonamento' ? 'Abbonamento' : 'Arretrati'}
                </span>
              </div>
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
  const [tab, setTab] = useState('allievi'); // 'allievi' | 'tassa' | 'qonto' | 'stripe'

  return (
    <div className="min-h-screen bg-n-100 flex flex-col justify-between pb-16">
      <PageHeader title="Pagamenti" backTo="/admin" />

      {/* Tab switcher — scrollabile orizzontalmente */}
      <div className="flex bg-white border-b overflow-x-auto">
        {[
          { id: 'allievi', label: 'Quote mensili' },
          { id: 'tassa',   label: 'Tassa annuale' },
          { id: 'stripe',  label: 'App (Stripe)' },
          { id: 'qonto',   label: 'Qonto' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-blue-600 text-ama-500' : 'border-transparent text-n-600'
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

        {tab === 'stripe' && (
          <PagamentiStripe token={token} />
        )}

        {tab === 'qonto' && (
          <SyncQonto token={token} />
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus, Search, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import { apiFetch } from '../utils/api';

/* ── Lista gruppi ─────────────────────────────────────────────────────── */
export function AdminGruppiList() {
  const navigate = useNavigate();
  const [gruppi, setGruppi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrea, setModalCrea] = useState(false);
  const [insegnanti, setInsegnanti] = useState([]);
  const [form, setForm] = useState({ nome: '', id_insegnante: '' });
  const [saving, setSaving] = useState(false);

  const carica = useCallback(async () => {
    setLoading(true);
    try {
      const [g, ins] = await Promise.all([
        apiFetch('/api/gruppi'),
        apiFetch('/api/insegnanti'),
      ]);
      setGruppi(Array.isArray(g) ? g : []);
      setInsegnanti(Array.isArray(ins) ? ins : []);
    } catch { /* ignora */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  const crea = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/gruppi', {
        method: 'POST',
        body: JSON.stringify({ nome: form.nome, id_insegnante: form.id_insegnante || null }),
      });
      setModalCrea(false);
      setForm({ nome: '', id_insegnante: '' });
      await carica();
    } catch { /* ignora */ }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader title="Gruppi" backTo="/admin" />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gruppi.length === 0 ? (
        <div className="m-4 bg-white border border-dashed rounded-xl p-10 text-center text-sm text-n-300">
          Nessun gruppo ancora. Creane uno con il tasto +.
        </div>
      ) : (
        <div className="m-4 bg-white border rounded-xl divide-y overflow-hidden">
          {gruppi.map(g => (
            <button
              key={g.id}
              onClick={() => navigate(`/admin/gruppi/${g.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-n-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-n-900">{g.nome}</p>
                <p className="text-xs text-n-400">
                  {g.insegnante_nome ? `${g.insegnante_nome} ${g.insegnante_cognome} · ` : ''}
                  {g.num_allievi} {g.num_allievi === 1 ? 'partecipante' : 'partecipanti'}
                </p>
              </div>
              <ChevronRight size={16} className="text-n-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Modal crea gruppo */}
      {modalCrea && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 pb-10">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-n-900">Nuovo gruppo</p>
              <button onClick={() => setModalCrea(false)}><X size={18} className="text-n-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-n-600 mb-1">Nome gruppo *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="es. Coro Adulti"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-n-600 mb-1">Insegnante</label>
                <select value={form.id_insegnante} onChange={e => setForm(f => ({ ...f, id_insegnante: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm">
                  <option value="">— Nessuno —</option>
                  {insegnanti.map(i => <option key={i.id} value={i.id}>{i.cognome} {i.nome}</option>)}
                </select>
              </div>
            </div>
            <button onClick={crea} disabled={!form.nome.trim() || saving}
              className="w-full bg-ama-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40">
              {saving ? 'Creazione…' : 'Crea gruppo'}
            </button>
          </div>
        </div>
      )}

      <BottomNavAdmin onAdd={() => setModalCrea(true)} />
    </div>
  );
}

/* ── Dettaglio gruppo ─────────────────────────────────────────────────── */
export function AdminGruppoDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gruppo, setGruppo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tuttiAllievi, setTuttiAllievi] = useState([]);
  const [search, setSearch] = useState('');
  const [modalAggiungi, setModalAggiungi] = useState(false);
  const [searchAgg, setSearchAgg] = useState('');
  const [rimuovendo, setRimuovendo] = useState({});
  const [aggiungendo, setAggiungendo] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [editNome, setEditNome] = useState(false);
  const [nuovoNome, setNuovoNome] = useState('');
  const [insegnanti, setInsegnanti] = useState([]);

  const carica = useCallback(async () => {
    setLoading(true);
    try {
      const [g, allievi, ins] = await Promise.all([
        apiFetch(`/api/gruppi/${id}`),
        apiFetch('/api/allievi'),
        apiFetch('/api/insegnanti'),
      ]);
      setGruppo(g);
      setTuttiAllievi(Array.isArray(allievi) ? allievi : []);
      setInsegnanti(Array.isArray(ins) ? ins : []);
    } catch { /* ignora */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { carica(); }, [carica]);

  const membroIds = useMemo(() => new Set((gruppo?.allievi || []).map(a => a.id)), [gruppo]);

  const allieviFiltrati = (gruppo?.allievi || []).filter(a => {
    const q = search.toLowerCase();
    return !q || `${a.nome} ${a.cognome}`.toLowerCase().includes(q);
  });

  const allieviDaAggiungere = tuttiAllievi.filter(a => {
    if (membroIds.has(a.id)) return false;
    const q = searchAgg.toLowerCase();
    return !q || `${a.nome} ${a.cognome}`.toLowerCase().includes(q);
  });

  const rimuovi = async (allievoId) => {
    setRimuovendo(r => ({ ...r, [allievoId]: true }));
    try {
      await apiFetch(`/api/gruppi/${id}/allievi/${allievoId}`, { method: 'DELETE' });
      await carica();
    } catch { /* ignora */ }
    finally { setRimuovendo(r => ({ ...r, [allievoId]: false })); }
  };

  const aggiungi = async (allievoId) => {
    setAggiungendo(a => ({ ...a, [allievoId]: true }));
    try {
      await apiFetch(`/api/gruppi/${id}/allievi/${allievoId}`, { method: 'POST' });
      await carica();
    } catch { /* ignora */ }
    finally { setAggiungendo(a => ({ ...a, [allievoId]: false })); }
  };

  const eliminaGruppo = async () => {
    try {
      await apiFetch(`/api/gruppi/${id}`, { method: 'DELETE' });
      navigate('/admin/gruppi');
    } catch { /* ignora */ }
  };

  const salvaModifiche = async (patch) => {
    try {
      const aggiornato = await apiFetch(`/api/gruppi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      setGruppo(g => ({ ...g, ...aggiornato }));
    } catch { /* ignora */ }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!gruppo) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-n-400">
      Gruppo non trovato.
    </div>
  );

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader title={gruppo.nome} backTo="/admin/gruppi" />

      {/* Info gruppo */}
      <div className="m-4 bg-white border rounded-xl p-4 space-y-3">
        {editNome ? (
          <div className="flex gap-2">
            <input value={nuovoNome} onChange={e => setNuovoNome(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm" />
            <button onClick={() => { salvaModifiche({ nome: nuovoNome }); setEditNome(false); }}
              className="px-3 py-2 bg-ama-500 text-white rounded-xl text-xs font-medium">
              Salva
            </button>
            <button onClick={() => setEditNome(false)}
              className="px-3 py-2 border rounded-xl text-xs text-n-600">
              Annulla
            </button>
          </div>
        ) : (
          <button onClick={() => { setNuovoNome(gruppo.nome); setEditNome(true); }}
            className="text-sm font-semibold text-n-900 underline decoration-dotted">
            {gruppo.nome}
          </button>
        )}

        <div>
          <label className="block text-xs text-n-600 mb-1">Insegnante</label>
          <select
            value={gruppo.insegnante_id || ''}
            onChange={e => salvaModifiche({ id_insegnante: e.target.value || null })}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">— Nessuno —</option>
            {insegnanti.map(i => <option key={i.id} value={i.id}>{i.cognome} {i.nome}</option>)}
          </select>
        </div>

        <button onClick={() => setConfirmDel(true)}
          className="flex items-center gap-2 text-xs text-red-500">
          <Trash2 size={13} /> Elimina gruppo
        </button>
      </div>

      {/* Lista partecipanti */}
      <div className="mx-4 mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-n-900">
          Partecipanti ({gruppo.allievi?.length || 0})
        </p>
        <button onClick={() => { setModalAggiungi(true); setSearchAgg(''); }}
          className="flex items-center gap-1 text-xs text-ama-500 font-medium">
          <UserPlus size={14} /> Aggiungi
        </button>
      </div>

      {/* Search */}
      <div className="mx-4 mb-3 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca partecipante…"
          className="w-full border rounded-xl pl-8 pr-4 py-2 text-sm bg-white" />
      </div>

      {allieviFiltrati.length === 0 ? (
        <div className="mx-4 bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
          {search ? 'Nessun risultato.' : 'Nessun partecipante. Aggiungine con il tasto sopra.'}
        </div>
      ) : (
        <div className="mx-4 bg-white border rounded-xl divide-y overflow-hidden">
          {allieviFiltrati.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-ama-600">
                  {a.nome?.[0]?.toUpperCase()}{a.cognome?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-n-900">{a.cognome} {a.nome}</p>
              </div>
              <button onClick={() => rimuovi(a.id)} disabled={!!rimuovendo[a.id]}
                className="p-1.5 text-red-400 active:text-red-600 disabled:opacity-40">
                <UserMinus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal aggiungi allievo */}
      {modalAggiungi && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-3" style={{ maxHeight: 'calc(80vh - 56px - env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-n-900">Aggiungi partecipante</p>
              <button onClick={() => setModalAggiungi(false)}><X size={18} className="text-n-400" /></button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" />
              <input value={searchAgg} onChange={e => setSearchAgg(e.target.value)}
                placeholder="Cerca allievo…"
                className="w-full border rounded-xl pl-8 pr-4 py-2.5 text-sm" autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 divide-y border rounded-xl">
              {allieviDaAggiungere.length === 0 ? (
                <p className="p-4 text-sm text-n-300 text-center">
                  {searchAgg ? 'Nessun risultato.' : 'Tutti gli allievi sono già nel gruppo.'}
                </p>
              ) : allieviDaAggiungere.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-n-900">{a.cognome} {a.nome}</p>
                  </div>
                  <button onClick={() => aggiungi(a.id)} disabled={!!aggiungendo[a.id]}
                    className="flex items-center gap-1 text-xs text-ama-500 font-medium disabled:opacity-40">
                    <UserPlus size={14} /> {aggiungendo[a.id] ? '…' : 'Aggiungi'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm elimina */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 space-y-4 w-full max-w-sm text-center">
            <Trash2 size={28} className="text-red-500 mx-auto" />
            <p className="font-semibold text-n-900">Eliminare "{gruppo.nome}"?</p>
            <p className="text-xs text-n-400">Le lezioni già programmate non verranno cancellate.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)}
                className="flex-1 py-2.5 border rounded-xl text-sm text-n-600">Annulla</button>
              <button onClick={eliminaGruppo}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

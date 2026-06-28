import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search, X, Check } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import { apiFetch } from '../utils/api';

const annoCorrente = new Date().getFullYear();

function fmtData(d) {
  if (!d) return '';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  return new Date(Date.UTC(+y,+m-1,+dd)).toLocaleDateString('it-IT', { day:'numeric', month:'short', year:'numeric' });
}

export default function AdminAllievi() {
  const navigate = useNavigate();

  const [allievi, setAllievi]       = useState([]);
  const [insegnanti, setInsegnanti] = useState([]);
  const [inAttesa, setInAttesa]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const [tab, setTab]       = useState('attivi'); // 'attivi' | 'non_attivi' | 'attesa'
  const [search, setSearch] = useState('');

  // Modal nuovo allievo
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ nome:'', cognome:'', data_iscrizione:'', quota_mensile:'', strumento:'' });
  const [insSelezionati, setInsSel] = useState([]);
  const [qaPagata, setQaPagata]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [errore, setErrore]       = useState('');

  const carica = async () => {
    setLoading(true);
    try {
      const [all, ins, att] = await Promise.all([
        apiFetch('/api/allievi'),
        apiFetch('/api/insegnanti'),
        apiFetch('/api/allievi/iscrizioni-attesa'),
      ]);
      setAllievi(Array.isArray(all) ? all : []);
      setInsegnanti(Array.isArray(ins) ? ins : []);
      setInAttesa(Array.isArray(att) ? att : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { carica(); }, []);

  const attivi    = useMemo(() => allievi.filter(a => a.attivo !== false), [allievi]);
  const nonAttivi = useMemo(() => allievi.filter(a => a.attivo === false), [allievi]);

  const filtra = (lista) => {
    const q = search.trim().toLowerCase();
    return q ? lista.filter(a => `${a.nome} ${a.cognome}`.toLowerCase().includes(q)) : lista;
  };

  const handleSalva = async () => {
    if (!form.nome.trim() || !form.cognome.trim()) { setErrore('Nome e cognome obbligatori.'); return; }
    setSaving(true); setErrore('');
    try {
      const nuovo = await apiFetch('/api/allievi', {
        method: 'POST',
        body: JSON.stringify({ ...form, quota_mensile: parseFloat(form.quota_mensile) || 0 })
      });
      if (insSelezionati.length) {
        await apiFetch(`/api/allievi/${nuovo.id}/insegnanti`, {
          method: 'POST', body: JSON.stringify({ insegnanti: insSelezionati })
        });
      }
      if (qaPagata) {
        await apiFetch(`/api/allievi/${nuovo.id}/quota-associativa`, {
          method: 'POST', body: JSON.stringify({ anno: annoCorrente, pagata: true })
        });
      }
      setShowModal(false);
      setForm({ nome:'', cognome:'', data_iscrizione:'', quota_mensile:'', strumento:'' });
      setInsSel([]); setQaPagata(false);
      carica();
    } catch (e) { setErrore(e.message || 'Errore.'); }
    finally { setSaving(false); }
  };

  const handleIscrizione = async (id, stato) => {
    try {
      await apiFetch(`/api/allievi/${id}/iscrizione`, { method: 'PATCH', body: JSON.stringify({ stato }) });
      setInAttesa(prev => prev.filter(a => a.id !== id));
      if (stato === 'attivo') carica();
    } catch { alert('Errore durante l\'aggiornamento'); }
  };

  const Riga = ({ a }) => (
    <button onClick={() => navigate(`/admin/allievi/${a.id}`)}
      className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-n-50">
      <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-blue-500">
          {(a.nome?.[0]||'').toUpperCase()}{(a.cognome?.[0]||'').toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-n-900 truncate">{a.nome} {a.cognome}</p>
        {a.strumento && <p className="text-xs text-n-300">{a.strumento}</p>}
      </div>
      <ChevronRight size={16} className="text-n-300 shrink-0" />
    </button>
  );

  const TabButton = ({ id, label, badge }) => (
    <button onClick={() => { setTab(id); setSearch(''); }}
      className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        tab === id ? 'border-blue-600 text-ama-500' : 'border-transparent text-n-300'}`}>
      {label}
      {badge > 0 && (
        <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader
        title="Allievi"
        action={
          <button onClick={() => { setShowModal(true); setErrore(''); }}
            className="flex items-center gap-1.5 text-sm font-medium text-ama-500">
            <Plus size={16} /> Nuovo
          </button>
        }
      />

      {/* Tab bar */}
      <div className="sticky top-0 z-20 bg-white border-b flex">
        <TabButton id="attivi"     label="Attivi" />
        <TabButton id="non_attivi" label="Non attivi" />
        <TabButton id="attesa"     label="In attesa" badge={inAttesa.length} />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* Ricerca */}
        {tab !== 'attesa' && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cerca allievo…"
              className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300"><X size={14} /></button>}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'attivi' && (
              <>
                <p className="text-xs font-semibold text-n-600 uppercase">Attivi ({filtra(attivi).length})</p>
                {filtra(attivi).length === 0 ? (
                  <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
                    {search ? 'Nessun risultato.' : 'Nessun allievo attivo.'}
                  </div>
                ) : (
                  <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
                    {filtra(attivi).map(a => <Riga key={a.id} a={a} />)}
                  </div>
                )}
              </>
            )}

            {tab === 'non_attivi' && (
              <>
                <p className="text-xs font-semibold text-n-600 uppercase">Non attivi ({filtra(nonAttivi).length})</p>
                {filtra(nonAttivi).length === 0 ? (
                  <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
                    {search ? 'Nessun risultato.' : 'Nessun allievo non attivo.'}
                  </div>
                ) : (
                  <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50 opacity-70">
                    {filtra(nonAttivi).map(a => <Riga key={a.id} a={a} />)}
                  </div>
                )}
              </>
            )}

            {tab === 'attesa' && (
              inAttesa.length === 0 ? (
                <div className="bg-white border border-dashed rounded-xl p-10 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-sm text-n-300">Nessuna iscrizione in attesa.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inAttesa.map(a => (
                    <div key={a.id} className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-semibold text-n-900 text-sm">{a.nome} {a.cognome}</p>
                          {a.email && <p className="text-xs text-n-300 mt-0.5">{a.email}</p>}
                          {a.telefono && <p className="text-xs text-n-300">{a.telefono}</p>}
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">In attesa</span>
                      </div>
                      <div className="flex gap-3 text-xs text-n-300 mb-3">
                        {a.strumento && <span>{a.strumento}</span>}
                        {a.data_nascita && <span>{fmtData(a.data_nascita)}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleIscrizione(a.id, 'attivo')}
                          className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-xl">✓ Accetta</button>
                        <button onClick={() => handleIscrizione(a.id, 'rifiutato')}
                          className="flex-1 bg-red-50 text-red-600 text-sm font-semibold py-2.5 rounded-xl border border-red-100">✕ Rifiuta</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modal nuovo allievo */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b z-10">
              <h2 className="text-base font-semibold text-n-900">Nuovo allievo</h2>
              <button onClick={() => setShowModal(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { key:'nome',           label:'Nome *',            type:'text' },
                { key:'cognome',        label:'Cognome *',         type:'text' },
                { key:'strumento',      label:'Strumento',         type:'text' },
                { key:'data_iscrizione',label:'Data iscrizione',   type:'date' },
                { key:'quota_mensile',  label:'Quota mensile (€)', type:'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-n-600 mb-1">{label}</label>
                  <input type={type} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              ))}

              <div>
                <label className="block text-xs text-n-600 mb-2">Assegna insegnante</label>
                <div className="border rounded-xl divide-y divide-gray-50 max-h-36 overflow-y-auto">
                  {insegnanti.filter(i => i.attivo !== false).map(i => (
                    <label key={i.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${insSelezionati.includes(i.id) ? 'bg-ama-500 border-blue-600' : 'border-n-300'}`}
                        onClick={() => setInsSel(prev => prev.includes(i.id) ? prev.filter(x => x !== i.id) : [...prev, i.id])}>
                        {insSelezionati.includes(i.id) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-n-900">{i.nome} {i.cognome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer"
                onClick={() => setQaPagata(v => !v)}>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${qaPagata ? 'bg-ama-500 border-blue-600' : 'border-n-300'}`}>
                  {qaPagata && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700">Quota associativa {annoCorrente} già saldata</span>
              </label>

              {errore && <p className="text-xs text-red-500">{errore}</p>}
            </div>
            <div className="px-5 pb-8 flex flex-col gap-2">
              <button onClick={handleSalva} disabled={saving}
                className="w-full py-3 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? 'Salvataggio…' : 'Crea allievo'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="w-full py-3 bg-n-100 text-gray-700 rounded-xl text-sm font-medium">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

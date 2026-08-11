import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search, X, Check, Users } from 'lucide-react';
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
  const [loading, setLoading]       = useState(true);

  const [tab, setTab]       = useState('attivi'); // 'attivi' | 'non_attivi' | 'gruppi'
  const [search, setSearch] = useState('');

  // Modal nuovo allievo
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ nome:'', cognome:'', data_iscrizione:'', quota_mensile:'', strumento:'' });
  const [insSelezionati, setInsSel] = useState([]);
  const [qaPagata, setQaPagata]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [errore, setErrore]       = useState('');

  // Gruppi
  const [gruppi, setGruppi]           = useState([]);
  const [gruppiLoading, setGruppiLoading] = useState(false);
  const [showModalGruppo, setShowModalGruppo] = useState(false);
  const [formGruppo, setFormGruppo]   = useState({ nome: '', id_insegnante: '' });
  const [savingGruppo, setSavingGruppo] = useState(false);

  const carica = useCallback(async () => {
    setLoading(true);
    try {
      const [all, ins] = await Promise.all([
        apiFetch('/api/allievi'),
        apiFetch('/api/insegnanti'),
      ]);
      setAllievi(Array.isArray(all) ? all : []);
      setInsegnanti(Array.isArray(ins) ? ins : []);
    } catch {}
    setLoading(false);
  }, []);

  const caricaGruppi = useCallback(async () => {
    setGruppiLoading(true);
    try {
      const g = await apiFetch('/api/gruppi');
      setGruppi(Array.isArray(g) ? g : []);
    } catch {}
    setGruppiLoading(false);
  }, []);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => { if (tab === 'gruppi') caricaGruppi(); }, [tab, caricaGruppi]);

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

  const handleSalvaGruppo = async () => {
    if (!formGruppo.nome.trim()) return;
    setSavingGruppo(true);
    try {
      await apiFetch('/api/gruppi', {
        method: 'POST',
        body: JSON.stringify({ nome: formGruppo.nome, id_insegnante: formGruppo.id_insegnante || null }),
      });
      setShowModalGruppo(false);
      setFormGruppo({ nome: '', id_insegnante: '' });
      caricaGruppi();
    } catch {}
    finally { setSavingGruppo(false); }
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
          tab === 'gruppi' ? (
            <button onClick={() => setShowModalGruppo(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-ama-500">
              <Plus size={16} /> Nuovo
            </button>
          ) : (
            <button onClick={() => { setShowModal(true); setErrore(''); }}
              className="flex items-center gap-1.5 text-sm font-medium text-ama-500">
              <Plus size={16} /> Nuovo
            </button>
          )
        }
      />

      {/* Tab bar */}
      <div className="sticky top-0 z-20 bg-white border-b flex">
        <TabButton id="attivi"     label="Attivi" />
        <TabButton id="non_attivi" label="Non attivi" />
        <TabButton id="gruppi"     label="Gruppi" />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* Ricerca */}
        {tab !== 'gruppi' && (
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

            {tab === 'gruppi' && (
              gruppiLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : gruppi.length === 0 ? (
                <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-n-300">
                  Nessun gruppo. Creane uno con il tasto +.
                </div>
              ) : (
                <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
                  {gruppi.map(g => (
                    <button key={g.id} onClick={() => navigate(`/admin/gruppi/${g.id}`)}
                      className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-n-50">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-n-900 truncate">{g.nome}</p>
                        <p className="text-xs text-n-300">
                          {g.insegnante_nome ? `${g.insegnante_nome} ${g.insegnante_cognome} · ` : ''}
                          {g.num_allievi} {g.num_allievi === 1 ? 'partecipante' : 'partecipanti'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-n-300 shrink-0" />
                    </button>
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

      {/* Modal nuovo gruppo */}
      {showModalGruppo && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl p-5 pb-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-n-900">Nuovo gruppo</h2>
              <button onClick={() => setShowModalGruppo(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-n-600 mb-1">Nome gruppo *</label>
                <input value={formGruppo.nome} onChange={e => setFormGruppo(f => ({ ...f, nome: e.target.value }))}
                  placeholder="es. Coro Adulti"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs text-n-600 mb-1">Insegnante</label>
                <select value={formGruppo.id_insegnante} onChange={e => setFormGruppo(f => ({ ...f, id_insegnante: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm">
                  <option value="">— Nessuno —</option>
                  {insegnanti.filter(i => i.attivo !== false).map(i => (
                    <option key={i.id} value={i.id}>{i.cognome} {i.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleSalvaGruppo} disabled={!formGruppo.nome.trim() || savingGruppo}
              className="w-full py-3 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
              {savingGruppo ? 'Creazione…' : 'Crea gruppo'}
            </button>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

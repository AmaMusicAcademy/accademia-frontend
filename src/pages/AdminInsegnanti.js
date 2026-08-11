import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search, X } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import { apiFetch } from '../utils/api';

export default function AdminInsegnanti() {
  const navigate = useNavigate();
  const [insegnanti, setInsegnanti] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ nome: '', cognome: '' });
  const [saving, setSaving]         = useState(false);
  const [errore, setErrore]         = useState('');

  const carica = () => {
    setLoading(true);
    apiFetch('/api/insegnanti')
      .then(d => setInsegnanti(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carica(); }, []);

  const attivi    = insegnanti.filter(i => i.attivo !== false);
  const nonAttivi = insegnanti.filter(i => i.attivo === false);

  const filtra = (list) => {
    const q = search.trim().toLowerCase();
    return q ? list.filter(i => `${i.nome} ${i.cognome}`.toLowerCase().includes(q)) : list;
  };

  const handleSalva = async () => {
    if (!form.nome.trim() || !form.cognome.trim()) { setErrore('Nome e cognome obbligatori.'); return; }
    setSaving(true); setErrore('');
    try {
      await apiFetch('/api/insegnanti', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ nome: '', cognome: '' });
      carica();
    } catch (e) {
      setErrore(e.message || 'Errore nella creazione.');
    } finally {
      setSaving(false);
    }
  };

  const Riga = ({ ins }) => (
    <button
      onClick={() => navigate(`/admin/insegnanti/${ins.id}`)}
      className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-n-50"
    >
      <div className="w-9 h-9 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-ama-500">
          {(ins.nome?.[0] || '').toUpperCase()}{(ins.cognome?.[0] || '').toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-n-900 truncate">{ins.nome} {ins.cognome}</p>
        {ins.data_inizio && (
          <p className="text-xs text-n-300">Dal {fmtData(ins.data_inizio)}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-n-300 shrink-0" />
    </button>
  );

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader
        title="Insegnanti"
        action={
          <button onClick={() => { setShowModal(true); setErrore(''); }}
            className="flex items-center gap-1.5 text-sm font-medium text-ama-500">
            <Plus size={16} /> Nuovo
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">

        {/* Ricerca */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca insegnante…"
            className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300"><X size={14} /></button>}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Attivi */}
            <div>
              <p className="text-xs font-semibold text-n-600 uppercase mb-2">
                Attivi ({filtra(attivi).length})
              </p>
              {filtra(attivi).length === 0 ? (
                <div className="bg-white border border-dashed rounded-xl p-6 text-center text-sm text-n-300">
                  {search ? 'Nessun risultato.' : 'Nessun insegnante attivo.'}
                </div>
              ) : (
                <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
                  {filtra(attivi).map(i => <Riga key={i.id} ins={i} />)}
                </div>
              )}
            </div>

            {/* Non attivi */}
            {filtra(nonAttivi).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-n-600 uppercase mb-2">
                  Non attivi ({filtra(nonAttivi).length})
                </p>
                <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50 opacity-70">
                  {filtra(nonAttivi).map(i => <Riga key={i.id} ins={i} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nuovo insegnante */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold text-n-900">Nuovo insegnante</h2>
              <button onClick={() => setShowModal(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs text-n-600 mb-1">Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Nome" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-n-600 mb-1">Cognome *</label>
                <input value={form.cognome} onChange={e => setForm(f => ({ ...f, cognome: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Cognome" />
              </div>
              {errore && <p className="text-xs text-red-500">{errore}</p>}
            </div>
            <div className="px-5 pb-5 flex flex-col gap-2">
              <button onClick={handleSalva} disabled={saving}
                className="w-full py-3 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? 'Salvataggio…' : 'Crea insegnante'}
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

function fmtData(d) {
  if (!d) return '';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  return new Date(Date.UTC(+y, +m-1, +dd)).toLocaleDateString('it-IT', { day:'numeric', month:'short', year:'numeric' });
}

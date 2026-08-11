import React, { useEffect, useState } from 'react';
import { Trash2, Plus, X, CalendarOff } from 'lucide-react';
import PageHeader from '../componenti/PageHeader';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import { apiFetch } from '../utils/api';

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

const fmtData = (d) => {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  const dt = new Date(Date.UTC(+y, +m - 1, +dd));
  return `${GIORNI[dt.getUTCDay()]} ${+dd} ${MESI[+m - 1]} ${y}`;
};

const fmtDataBreve = (d) => {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${+dd} ${MESI[+m - 1]} ${y}`;
};

const oggiStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// Raggruppa date consecutive con stessa descrizione in "intervalli"
function raggruppa(chiusure) {
  if (!chiusure.length) return [];
  const sorted = [...chiusure].sort((a, b) => a.data.localeCompare(b.data));
  const gruppi = [];
  let cur = { ...sorted[0], ids: [sorted[0].id], fine: sorted[0].data };

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${cur.fine}T00:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() + 1);
    const prevStr = prev.toISOString().slice(0, 10);
    if (sorted[i].data === prevStr && sorted[i].descrizione === cur.descrizione) {
      cur.fine = sorted[i].data;
      cur.ids.push(sorted[i].id);
    } else {
      gruppi.push(cur);
      cur = { ...sorted[i], ids: [sorted[i].id], fine: sorted[i].data };
    }
  }
  gruppi.push(cur);
  return gruppi;
}

export default function GiorniChiusura() {
  const [chiusure, setChiusure]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [modo, setModo]             = useState('singolo'); // 'singolo' | 'intervallo'
  const [form, setForm]             = useState({ data: oggiStr(), data_inizio: oggiStr(), data_fine: oggiStr(), descrizione: '' });
  const [saving, setSaving]         = useState(false);
  const [errore, setErrore]         = useState('');
  const [confirmDel, setConfirmDel] = useState(null); // gruppo da eliminare

  const carica = () => {
    setLoading(true);
    apiFetch('/api/giorni-chiusura')
      .then(d => setChiusure(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carica(); }, []);

  const handleSave = async () => {
    setErrore('');
    if (modo === 'singolo') {
      if (!form.data) { setErrore('Seleziona una data.'); return; }
    } else {
      if (!form.data_inizio || !form.data_fine) { setErrore('Seleziona entrambe le date.'); return; }
      if (form.data_inizio > form.data_fine) { setErrore('La data di inizio deve precedere quella di fine.'); return; }
    }
    setSaving(true);
    try {
      if (modo === 'singolo') {
        await apiFetch('/api/giorni-chiusura', {
          method: 'POST',
          body: JSON.stringify({ data: form.data, descrizione: form.descrizione }),
        });
      } else {
        await apiFetch('/api/giorni-chiusura/intervallo', {
          method: 'POST',
          body: JSON.stringify({ data_inizio: form.data_inizio, data_fine: form.data_fine, descrizione: form.descrizione }),
        });
      }
      setShowForm(false);
      setForm({ data: oggiStr(), data_inizio: oggiStr(), data_fine: oggiStr(), descrizione: '' });
      carica();
    } catch (e) {
      setErrore(e.message || 'Errore nel salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGruppo = async (gruppo) => {
    try {
      await Promise.all(gruppo.ids.map(id => apiFetch(`/api/giorni-chiusura/${id}`, { method: 'DELETE' })));
      setConfirmDel(null);
      carica();
    } catch (e) {
      alert(e.message || 'Errore nella cancellazione.');
    }
  };

  const gruppi = raggruppa(chiusure);

  // raggruppa per anno
  const perAnno = gruppi.reduce((acc, g) => {
    const anno = g.data.slice(0, 4);
    if (!acc[anno]) acc[anno] = [];
    acc[anno].push(g);
    return acc;
  }, {});
  const anni = Object.keys(perAnno).sort((a, b) => b - a);

  const nGiorni = form.data_fine >= form.data_inizio
    ? Math.round((new Date(`${form.data_fine}T00:00:00Z`) - new Date(`${form.data_inizio}T00:00:00Z`)) / 86400000) + 1
    : 0;

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader
        title="Giorni di chiusura"
        action={
          <button
            onClick={() => { setShowForm(v => !v); setErrore(''); }}
            className="flex items-center gap-1.5 text-sm font-medium text-ama-500"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annulla' : 'Aggiungi'}
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* Form aggiunta */}
        {showForm && (
          <div className="bg-white border rounded-xl px-4 py-4 space-y-4">
            <p className="text-sm font-semibold text-n-900">Nuova chiusura</p>

            {/* Toggle singolo / intervallo */}
            <div className="flex bg-n-100 rounded-xl p-1 gap-1">
              {[['singolo', 'Giorno singolo'], ['intervallo', 'Intervallo di date']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setModo(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    modo === val ? 'bg-white text-n-900 shadow-sm' : 'text-n-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Campi data */}
            {modo === 'singolo' ? (
              <div>
                <label className="block text-xs text-n-600 mb-1">Data *</label>
                <input type="date" value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-n-600 mb-1">Da *</label>
                  <input type="date" value={form.data_inizio}
                    onChange={e => setForm(f => ({ ...f, data_inizio: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-n-600 mb-1">A *</label>
                  <input type="date" value={form.data_fine}
                    onChange={e => setForm(f => ({ ...f, data_fine: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {nGiorni > 1 && (
                  <p className="col-span-2 text-xs text-ama-500 font-medium -mt-1">
                    {nGiorni} giorni selezionati
                  </p>
                )}
              </div>
            )}

            {/* Descrizione */}
            <div>
              <label className="block text-xs text-n-600 mb-1">Descrizione (es. "Natale", "Vacanze estive")</label>
              <input type="text" value={form.descrizione}
                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                placeholder="Opzionale"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {errore && <p className="text-xs text-red-500">{errore}</p>}

            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
              {saving ? 'Salvataggio…' : modo === 'intervallo' ? `Salva ${nGiorni > 1 ? nGiorni + ' giorni' : 'intervallo'}` : 'Salva chiusura'}
            </button>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chiusure.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-10 text-center">
            <CalendarOff size={32} className="mx-auto mb-3 text-n-300" />
            <p className="text-sm text-n-300">Nessun giorno di chiusura impostato.</p>
            <p className="text-xs text-n-300 mt-1">Le domeniche sono evidenziate automaticamente.</p>
          </div>
        ) : (
          anni.map(anno => (
            <div key={anno}>
              <p className="text-xs font-semibold text-n-600 uppercase mb-2">{anno}</p>
              <div className="bg-white border rounded-xl overflow-hidden">
                {perAnno[anno].map((g, i) => {
                  const isRange = g.data !== g.fine;
                  return (
                    <div key={g.ids.join()} className={`flex items-center gap-3 px-4 py-3 ${i < perAnno[anno].length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <CalendarOff size={16} className="text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isRange ? (
                          <>
                            <p className="text-sm font-semibold text-n-900">
                              {fmtDataBreve(g.data)} → {fmtDataBreve(g.fine)}
                            </p>
                            <p className="text-xs text-n-300">{g.ids.length} giorni{g.descrizione ? ` · ${g.descrizione}` : ''}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-n-900">{fmtData(g.data)}</p>
                            {g.descrizione && <p className="text-xs text-n-300">{g.descrizione}</p>}
                          </>
                        )}
                      </div>
                      <button onClick={() => setConfirmDel(g)}
                        className="p-2 text-n-300 active:text-red-500 rounded-xl">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* nota domeniche */}
        <div className="flex items-start gap-2 text-xs text-n-300 px-1">
          <div className="w-3 h-3 rounded-sm bg-n-100 border mt-0.5 shrink-0" />
          Le domeniche sono evidenziate automaticamente in grigio chiaro nel calendario.
        </div>
      </div>

      {/* popup conferma eliminazione */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-n-900 mb-1">Eliminare questa chiusura?</p>
            <p className="text-xs text-n-600 mb-1">
              {confirmDel.data !== confirmDel.fine
                ? `${fmtDataBreve(confirmDel.data)} → ${fmtDataBreve(confirmDel.fine)}`
                : fmtData(confirmDel.data)}
            </p>
            {confirmDel.ids.length > 1 && (
              <p className="text-xs text-red-400 mb-4">{confirmDel.ids.length} giorni verranno eliminati.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl bg-n-100 text-gray-700 text-sm font-medium">Annulla</button>
              <button onClick={() => handleDeleteGruppo(confirmDel)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

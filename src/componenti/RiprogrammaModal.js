import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, MapPin, Clock, History } from 'lucide-react';
import { apiFetch } from '../utils/api';

const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const fmt  = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' }) : '—';

export default function RiprogrammaModal({ lezione, onClose, onSaved }) {
  const [aule, setAule]         = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ data: '', ora_inizio: '', ora_fine: '', aula: '' });

  useEffect(() => {
    if (!lezione) return;
    setForm({ data: '', ora_inizio: hhmm(lezione.ora_inizio), ora_fine: hhmm(lezione.ora_fine), aula: lezione.aula || '' });
    setError('');
    apiFetch('/api/aule').then((r) => setAule(Array.isArray(r) ? r : [])).catch(() => {});
  }, [lezione]);

  if (!lezione) return null;

  const history = (() => {
    try { const h = lezione.old_schedules; return Array.isArray(h) ? h : JSON.parse(h || '[]'); }
    catch { return []; }
  })();

  const handleSave = async () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine || !form.aula) {
      setError('Compila tutti i campi.'); return;
    }
    setSaving(true); setError('');
    try {
      await apiFetch(`/api/lezioni/${lezione.id}/riprogramma`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (e) {
      setError(e.message || 'Errore nella riprogrammazione.');
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-n-900">Riprogramma lezione</h2>
          <button onClick={onClose} className="text-n-300 active:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* riepilogo lezione rimandata */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
            <p className="font-semibold text-n-900 mb-1">
              {lezione.nome_allievo} {lezione.cognome_allievo}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-amber-700">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {hhmm(lezione.ora_inizio)}–{hhmm(lezione.ora_fine)}
              </span>
              {lezione.aula && <span className="flex items-center gap-1"><MapPin size={11} /> {lezione.aula}</span>}
            </div>
            {lezione.motivazione && (
              <p className="text-xs text-amber-600 mt-1 italic">Motivo: {lezione.motivazione}</p>
            )}
          </div>

          {/* storico riprogrammazioni */}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-n-600 uppercase mb-2 flex items-center gap-1">
                <History size={11} /> Storico ({history.length} {history.length === 1 ? 'spostamento' : 'spostamenti'})
              </p>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <div key={i} className="bg-n-50 border rounded-xl px-3 py-2 text-xs text-n-600">
                    <span className="font-medium text-n-900">#{i + 1}</span>
                    {' · '}{fmt(h.data_originale || h.data)}
                    {' '}{hhmm(h.ora_inizio)}–{hhmm(h.ora_fine)}
                    {h.aula ? ` · ${h.aula}` : ''}
                    {h.motivazione && <span className="block text-n-300 italic mt-0.5">"{h.motivazione}"</span>}
                    {h.riprogrammata_il && (
                      <span className="block text-n-300 mt-0.5">
                        Riprogrammato il {fmt(h.riprogrammata_il)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* nuova data/ora */}
          <div>
            <p className="text-xs font-medium text-n-600 mb-2">Nuova data e orario</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-n-300 mb-1">Data *</label>
                <input type="date" value={form.data}
                  onChange={(e) => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-n-300 mb-1">Aula *</label>
                <select value={form.aula}
                  onChange={(e) => setForm(f => ({ ...f, aula: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">Seleziona</option>
                  {aule.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-n-300 mb-1">Inizio *</label>
                <input type="time" value={form.ora_inizio}
                  onChange={(e) => setForm(f => ({ ...f, ora_inizio: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-n-300 mb-1">Fine *</label>
                <input type="time" value={form.ora_fine}
                  onChange={(e) => setForm(f => ({ ...f, ora_fine: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* footer */}
        <div className="px-5 pb-5 pt-3 border-t flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-medium text-sm disabled:opacity-40 active:bg-amber-600"
          >
            <RotateCcw size={15} /> {saving ? 'Salvataggio…' : 'Conferma riprogrammazione'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-n-100 text-gray-700 rounded-xl font-medium text-sm active:bg-n-100"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

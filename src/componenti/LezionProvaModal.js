import React, { useState } from 'react';
import { X, FlaskConical } from 'lucide-react';
import { apiFetch } from '../utils/api';

function minToHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function hhmToMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export default function LezionProvaModal({ open, onClose, onSaved, startMin, data, teachers, preselectedTeacherId }) {
  const [nomeAllievo, setNomeAllievo] = useState('');
  const [telefono, setTelefono]       = useState('');
  const [note, setNote]               = useState('');
  const [dataVal, setDataVal]         = useState(data || '');
  const [oraInizio, setOraInizio]     = useState(minToHHMM(startMin || 480));
  const [oraFine, setOraFine]         = useState(minToHHMM((startMin || 480) + 45));
  const [insegnanteId, setInsegnanteId] = useState(preselectedTeacherId || '');
  const [loading, setLoading]         = useState(false);
  const [errore, setErrore]           = useState('');

  if (!open) return null;

  const handleOraInizioChange = (val) => {
    setOraInizio(val);
    const start = hhmToMin(val);
    setOraFine(minToHHMM(start + 45));
  };

  const handleSave = async () => {
    if (!nomeAllievo.trim()) { setErrore('Inserisci il nome dell\'allievo.'); return; }
    if (!insegnanteId) { setErrore('Seleziona un insegnante.'); return; }
    if (!dataVal) { setErrore('Inserisci la data.'); return; }
    setLoading(true); setErrore('');
    try {
      await apiFetch('/api/lezioni', {
        method: 'POST',
        body: JSON.stringify({
          id_insegnante: insegnanteId,
          data: dataVal,
          ora_inizio: oraInizio,
          ora_fine: oraFine,
          stato: 'prova',
          nome_allievo_prova: nomeAllievo.trim(),
          telefono_prova: telefono.trim() || null,
          note: note.trim() || null,
        }),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setErrore(e.message || 'Errore nel salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-end justify-center" style={{ transform: 'translate3d(0,0,0)' }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white rounded-t-2xl pt-4 shadow-xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center mb-1 shrink-0">
          <div className="w-10 h-1 bg-n-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 mt-2 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <FlaskConical size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-base font-bold text-n-900">Lezione prova</p>
              <p className="text-xs text-n-400">Nuovo appuntamento</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-n-100 text-n-500">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-3 pb-4">
          {/* Nome allievo */}
          <div>
            <label className="block text-xs font-medium text-n-600 mb-1">Nome allievo *</label>
            <input
              type="text"
              value={nomeAllievo}
              onChange={e => setNomeAllievo(e.target.value)}
              placeholder="Es. Mario Rossi"
              className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-xs font-medium text-n-600 mb-1">Telefono</label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Es. 333 1234567"
              className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
            />
          </div>

          {/* Data e ora */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-medium text-n-600 mb-1">Data</label>
              <input
                type="date"
                value={dataVal}
                onChange={e => setDataVal(e.target.value)}
                className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-n-600 mb-1">Inizio</label>
              <input
                type="time"
                value={oraInizio}
                onChange={e => handleOraInizioChange(e.target.value)}
                className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-n-600 mb-1">Fine</label>
              <input
                type="time"
                value={oraFine}
                onChange={e => setOraFine(e.target.value)}
                className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
              />
            </div>
          </div>

          {/* Insegnante */}
          {!preselectedTeacherId ? (
            <div>
              <label className="block text-xs font-medium text-n-600 mb-1">Insegnante *</label>
              <select
                value={insegnanteId}
                onChange={e => setInsegnanteId(e.target.value)}
                className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ama-400"
              >
                <option value="">— Scegli —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-n-600 mb-1">Insegnante</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-n-50 rounded-xl border border-n-200">
                <span className="text-sm font-medium text-n-800">
                  {teachers.find(t => String(t.id) === String(preselectedTeacherId))
                    ? `${teachers.find(t => String(t.id) === String(preselectedTeacherId)).nome} ${teachers.find(t => String(t.id) === String(preselectedTeacherId)).cognome}`
                    : '—'}
                </span>
                <button onClick={() => setInsegnanteId('')} className="ml-auto text-xs text-ama-500 underline">Cambia</button>
              </div>
              {insegnanteId === '' && (
                <select
                  value={insegnanteId}
                  onChange={e => setInsegnanteId(e.target.value)}
                  className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:border-ama-400"
                >
                  <option value="">— Scegli —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-n-600 mb-1">Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Es. Interessato al corso di pianoforte"
              rows={2}
              className="w-full border border-n-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-ama-400"
            />
          </div>

          {errore && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{errore}</p>}
        </div>
        </div>

        {/* Sticky save button */}
        <div className="shrink-0 px-4 pt-2 pb-6 border-t bg-white">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Salva lezione prova'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, RotateCcw, Ban } from 'lucide-react';

export default function AssenteModal({ open, onClose, onAnnulla, onRimanda }) {
  const [motivazione, setMotivazione] = useState('');
  const [errore, setErrore] = useState(false);

  if (!open) return null;

  const validate = () => {
    if (!motivazione.trim()) { setErrore(true); return false; }
    return true;
  };

  const handleAnnulla = () => { if (!validate()) return; onAnnulla(motivazione); setMotivazione(''); setErrore(false); };
  const handleRimanda = () => { if (!validate()) return; onRimanda(motivazione); setMotivazione(''); setErrore(false); };
  const handleClose   = () => { setMotivazione(''); setErrore(false); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Allievo assente</h2>
          <button onClick={handleClose} className="text-gray-400 active:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Motivazione <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={motivazione}
            onChange={(e) => { setMotivazione(e.target.value); setErrore(false); }}
            placeholder="Es. allievo malato, comunicato in anticipo…"
            className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 ${
              errore ? 'border-red-400 focus:ring-red-300' : 'focus:ring-blue-400'
            }`}
          />
          {errore && <p className="text-xs text-red-500 mt-1">La motivazione è obbligatoria.</p>}
        </div>

        {/* azioni */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={handleRimanda}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium text-sm active:bg-amber-100"
          >
            <RotateCcw size={16} /> Rimanda
          </button>
          <button
            onClick={handleAnnulla}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium text-sm active:bg-red-100"
          >
            <Ban size={16} /> Annulla lezione
          </button>
        </div>
      </div>
    </div>
  );
}

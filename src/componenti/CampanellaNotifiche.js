import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, FlaskConical } from 'lucide-react';
import { apiFetch } from '../utils/api';

function formatData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min}`;
}

export default function CampanellaNotifiche({ onOpenLezione }) {
  const [open, setOpen] = useState(false);
  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const ref = useRef(null);

  const carica = useCallback(async () => {
    try {
      const data = await apiFetch('/api/insegnante/notifiche');
      setNotifiche(data.notifiche || []);
      setNonLette(data.nonLette || 0);
    } catch { /* ignora */ }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  // polling ogni 60s
  useEffect(() => {
    const t = setInterval(carica, 60000);
    return () => clearInterval(t);
  }, [carica]);

  // chiudi cliccando fuori
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const segnaLetta = async (id) => {
    try { await apiFetch(`/api/insegnante/notifiche/${id}/letto`, { method: 'PATCH' }); } catch { /* ignora */ }
    setNotifiche(prev => prev.map(n => n.id === id ? { ...n, letto: true } : n));
    setNonLette(prev => Math.max(0, prev - 1));
  };

  const segnaLetteTutte = async () => {
    try { await apiFetch('/api/insegnante/notifiche/letto-tutte', { method: 'PATCH' }); } catch { /* ignora */ }
    setNotifiche(prev => prev.map(n => ({ ...n, letto: true })));
    setNonLette(0);
  };

  const handleClick = async (n) => {
    if (!n.letto) await segnaLetta(n.id);
    setOpen(false);
    if (n.lezione_id && onOpenLezione) onOpenLezione(n.lezione_id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-n-400 active:text-n-700"
        aria-label="Notifiche"
      >
        <Bell size={22} />
        {nonLette > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {nonLette > 9 ? '9+' : nonLette}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-n-100 z-50 overflow-hidden"
          style={{ transform: 'translate3d(0,0,0)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-n-100">
            <p className="text-sm font-semibold text-n-900">Notifiche</p>
            <div className="flex items-center gap-2">
              {nonLette > 0 && (
                <button onClick={segnaLetteTutte} className="text-xs text-ama-500 font-medium">
                  Segna tutte lette
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-n-300">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifiche.length === 0 ? (
              <p className="text-sm text-n-400 text-center py-8">Nessuna notifica</p>
            ) : (
              notifiche.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-n-50 flex items-start gap-3 active:bg-n-50 transition-colors ${n.letto ? 'opacity-60' : 'bg-amber-50'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.letto ? 'bg-n-100' : 'bg-amber-100'}`}>
                    <FlaskConical size={14} className={n.letto ? 'text-n-400' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-n-800 leading-snug">{n.messaggio}</p>
                    <p className="text-xs text-n-400 mt-0.5">{formatData(n.created_at)}</p>
                  </div>
                  {!n.letto && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

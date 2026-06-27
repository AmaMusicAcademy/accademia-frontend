import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CreditCard, ChevronRight, Calendar, CalendarOff, X, BellOff } from 'lucide-react';
import AllievoLayout from '../../componenti/AllievoLayout';
import { apiFetch } from '../../utils/api';
import { registraPush } from '../../utils/push';

const nomiMesi = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MESI_BR = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']; // eslint-disable-line no-unused-vars

function fmtData(d) {
  if (!d) return '';
  const [y, m, day] = String(d).slice(0,10).split('-');
  return `${day} ${nomiMesi[parseInt(m)]} ${y}`;
}

function fmtDataChiusura(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  const dt = new Date(Date.UTC(+y, +m-1, +dd));
  return `${GIORNI[dt.getUTCDay()]} ${+dd} ${MESI_BR[+m-1]} ${y}`;
}

function PopupNotifiche({ notifiche, nonLette, onLetto, onLettoTutte, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative mt-16 mr-4 bg-white rounded-2xl shadow-xl w-80 max-h-[70vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-900">Notifiche {nonLette > 0 && <span className="text-indigo-600">({nonLette})</span>}</p>
          <div className="flex items-center gap-2">
            {nonLette > 0 && (
              <button onClick={onLettoTutte} className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                <BellOff size={12} /> Lette tutte
              </button>
            )}
            <button onClick={onClose} className="text-gray-400"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {notifiche.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nessuna notifica</p>
            </div>
          ) : notifiche.map(n => (
            <div key={n.id}
              onClick={() => !n.letto && onLetto(n.id)}
              className={`px-4 py-3 border-b last:border-0 cursor-pointer ${n.letto ? 'bg-white' : 'bg-indigo-50'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-800 leading-snug">{n.messaggio}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('it-IT', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                {!n.letto && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalChiusure({ chiusure, onClose }) {
  const MESI_NOME = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const perAnno = chiusure.reduce((acc, c) => {
    const a = c.data.slice(0,4);
    if (!acc[a]) acc[a] = [];
    acc[a].push(c);
    return acc;
  }, {});
  const anni = Object.keys(perAnno).sort((a,b) => b-a);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <CalendarOff size={18} className="text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">Chiusure annuali</h2>
          </div>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {chiusure.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessuna chiusura impostata.</p>
          ) : anni.map(anno => (
            <div key={anno}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{anno}</p>
              <div className="bg-white border rounded-xl divide-y divide-gray-50 overflow-hidden">
                {perAnno[anno].map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <CalendarOff size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fmtDataChiusura(c.data)}</p>
                      {c.descrizione && <p className="text-xs text-gray-400">{c.descrizione}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardAllievo() {
  const navigate = useNavigate();
  const [profilo, setProfilo]           = useState(null);
  const [prossima, setProssima]         = useState(null);
  const [pagamentoMese, setPagamentoMese] = useState(null);
  const [notifiche, setNotifiche]       = useState([]);
  const [nonLette, setNonLette]         = useState(0);
  const [riepilogo, setRiepilogo]       = useState(null);
  const [chiusure, setChiusure]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showNotifiche, setShowNotifiche] = useState(false);
  const [showChiusure, setShowChiusure]   = useState(false);

  useEffect(() => {
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = oggi.getMonth() + 1;

    Promise.all([
      apiFetch('/api/allievo/me'),
      apiFetch('/api/allievo/lezioni?stato=future'),
      apiFetch('/api/allievo/pagamenti'),
      apiFetch('/api/allievo/notifiche'),
      apiFetch('/api/allievo/riepilogo-anno'),
      apiFetch('/api/giorni-chiusura'),
    ]).then(([p, lezioni, pag, notif, riep, chius]) => {
      setProfilo(p);
      const future = lezioni
        .filter(l => l.stato !== 'annullata')
        .sort((a,b) => a.data.localeCompare(b.data) || a.ora_inizio.localeCompare(b.ora_inizio));
      setProssima(future[0] || null);
      const mesePagato = pag.pagamenti?.find(p => p.anno === anno && p.mese === mese);
      setPagamentoMese({ pagato: !!mesePagato?.pagato, quota: pag.quota_mensile, anno, mese });
      setNotifiche(notif.notifiche || []);
      setNonLette(notif.nonLette || 0);
      setRiepilogo(riep);
      setChiusure(Array.isArray(chius) ? chius : []);
    }).catch(console.error).finally(() => setLoading(false));

    // Registra push al primo accesso
    registraPush().catch(() => {});
  }, []);

  const segnaLetto = async (id) => {
    try {
      await apiFetch(`/api/allievo/notifiche/${id}/letto`, { method: 'PATCH' });
      setNotifiche(prev => prev.map(n => n.id === id ? { ...n, letto: true } : n));
      setNonLette(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const segnaLettoTutte = async () => {
    try {
      await apiFetch('/api/allievo/notifiche/letto-tutte', { method: 'PATCH' });
      setNotifiche(prev => prev.map(n => ({ ...n, letto: true })));
      setNonLette(0);
    } catch {}
  };

  if (loading) return (
    <AllievoLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AllievoLayout>
  );

  const annoAcc = riepilogo ? `${riepilogo.annoInizio}/${riepilogo.annoFine}` : '';

  return (
    <AllievoLayout>
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Benvenuto</p>
          <h1 className="text-2xl font-bold text-gray-900">{profilo?.nome || '—'}</h1>
        </div>
        <button onClick={() => setShowNotifiche(true)} className="relative p-2">
          <Bell size={24} className="text-gray-600" />
          {nonLette > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {nonLette > 9 ? '9+' : nonLette}
            </span>
          )}
        </button>
      </div>

      {/* Card prossima lezione */}
      <div onClick={() => navigate('/allievo/lezioni')}
        className="bg-indigo-600 text-white rounded-2xl p-5 mb-4 cursor-pointer active:opacity-90">
        <div className="flex items-center gap-2 mb-3 opacity-80">
          <Calendar size={16} />
          <span className="text-sm font-medium">Prossima lezione</span>
        </div>
        {prossima ? (
          <>
            <p className="text-xl font-bold">{fmtData(prossima.data)}</p>
            <p className="text-lg mt-1">{prossima.ora_inizio} — {prossima.ora_fine}</p>
            <p className="text-sm opacity-80 mt-1">
              {prossima.nome_insegnante} {prossima.cognome_insegnante}
              {prossima.aula ? ` · Aula ${prossima.aula}` : ''}
            </p>
          </>
        ) : (
          <p className="text-lg opacity-80">Nessuna lezione programmata</p>
        )}
      </div>

      {/* Riepilogo anno accademico */}
      {riepilogo && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Anno accademico {annoAcc}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Svolte',    n: parseInt(riepilogo.svolte||0),    cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Rimandate', n: parseInt(riepilogo.rimandate||0), cls: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
              { label: 'Annullate', n: parseInt(riepilogo.annullate||0), cls: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
            ].map(({ label, n, cls, bg }) => (
              <div key={label} className={`border rounded-xl p-3 text-center ${bg}`}>
                <p className={`text-2xl font-bold ${cls}`}>{n}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card pagamento mese */}
      {pagamentoMese && pagamentoMese.quota > 0 && (
        <div onClick={() => navigate('/allievo/pagamenti')}
          className={`rounded-2xl p-5 mb-4 cursor-pointer active:opacity-90 ${
            pagamentoMese.pagato ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${pagamentoMese.pagato ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <CreditCard size={20} className={pagamentoMese.pagato ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Quota {nomiMesi[pagamentoMese.mese]}</p>
                <p className={`text-sm font-medium ${pagamentoMese.pagato ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {pagamentoMese.pagato ? 'Pagata ✓' : `Non ancora pagata · €${pagamentoMese.quota}`}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>
      )}

      {/* Link rapidi */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <button onClick={() => navigate('/allievo/lezioni')}
          className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 active:bg-gray-50">
          <BookOpen size={22} className="text-indigo-500" />
          <span className="text-xs font-medium text-gray-700 text-center">Le mie lezioni</span>
        </button>
        <button onClick={() => navigate('/allievo/pagamenti')}
          className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 active:bg-gray-50">
          <CreditCard size={22} className="text-indigo-500" />
          <span className="text-xs font-medium text-gray-700 text-center">Pagamenti</span>
        </button>
        <button onClick={() => setShowChiusure(true)}
          className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 active:bg-gray-50">
          <CalendarOff size={22} className="text-orange-400" />
          <span className="text-xs font-medium text-gray-700 text-center">Chiusure</span>
        </button>
      </div>

      {/* Popup notifiche */}
      {showNotifiche && (
        <PopupNotifiche
          notifiche={notifiche}
          nonLette={nonLette}
          onLetto={segnaLetto}
          onLettoTutte={segnaLettoTutte}
          onClose={() => setShowNotifiche(false)}
        />
      )}

      {/* Modal chiusure */}
      {showChiusure && (
        <ModalChiusure chiusure={chiusure} onClose={() => setShowChiusure(false)} />
      )}
    </AllievoLayout>
  );
}

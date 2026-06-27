import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, RotateCcw, CreditCard, AlertCircle, ChevronRight, ArrowLeft, Clock, CalendarDays, FileText } from 'lucide-react';
import { apiFetch } from '../utils/api';

const hhmm = (t) => t ? String(t).slice(0, 5) : '';
const ymd  = (d) => String(d || '').slice(0, 10);

const fmtData = (d) => {
  if (!d) return '—';
  const s = ymd(d);
  const [y, m, dd] = s.split('-');
  return new Date(Date.UTC(+y, +m-1, +dd)).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const MESI_IT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

const parseHistory = (v) => {
  if (Array.isArray(v)) return v;
  try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
};

// ── KPI card cliccabile ────────────────────────────────────────────────────
function KpiCard({ icon: Icon, color, label, value, onClick }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   val: 'text-amber-700' },
    red:     { bg: 'bg-red-50',     icon: 'text-red-600',     val: 'text-red-700' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    val: 'text-blue-700' },
    gray:    { bg: 'bg-gray-50',    icon: 'text-gray-500',    val: 'text-gray-700' },
  };
  const c = colors[color] || colors.gray;
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${c.bg} w-full text-left transition active:opacity-70 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`flex items-center justify-between w-full`}>
        <Icon size={18} className={c.icon} />
        {onClick && <ChevronRight size={14} className="text-gray-400" />}
      </div>
      <div>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── Popup log lezioni ──────────────────────────────────────────────────────
function LogPopup({ title, lezioni, tipo, onClose }) {
  // tipo: 'rimandate' | 'da_recuperare'
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 px-0">
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {lezioni.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">Nessuna voce.</div>
          )}
          {lezioni.map((l, i) => {
            const history = parseHistory(l.old_schedules);
            return (
              <div key={l.id ?? i} className="px-4 py-3">
                {/* data originale */}
                <div className="flex items-center gap-2 mb-1.5">
                  <CalendarDays size={13} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-semibold text-gray-900">
                    {fmtData(l.data)} · {hhmm(l.ora_inizio)}–{hhmm(l.ora_fine)}
                  </span>
                  {l.aula && <span className="text-xs text-gray-400">({l.aula})</span>}
                </div>

                {/* motivazione */}
                {l.motivazione && (
                  <div className="flex items-start gap-1.5 mb-1.5">
                    <FileText size={12} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 italic">"{l.motivazione}"</p>
                  </div>
                )}

                {/* log riprogrammazioni (solo per rimandate) */}
                {tipo === 'rimandate' && history.length > 0 && (
                  <div className="mt-1.5 space-y-2">
                    {history.map((h, j) => (
                      <div key={j} className="pl-3 border-l-2 border-amber-200 space-y-0.5">
                        <div className="flex items-start gap-1.5">
                          <RotateCcw size={11} className="text-amber-500 mt-0.5 shrink-0" />
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Riprog. #{j+1}</span>
                            {' → '}{fmtData(h.data || h.data_originale)}
                            {h.ora_inizio && ` · ${hhmm(h.ora_inizio)}–${hhmm(h.ora_fine)}`}
                            {h.riprogrammata_il && (
                              <span className="text-gray-400"> (il {fmtData(h.riprogrammata_il)})</span>
                            )}
                          </div>
                        </div>
                        {h.motivazione && (
                          <div className="flex items-start gap-1.5 pl-4">
                            <FileText size={11} className="text-gray-300 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-400 italic">"{h.motivazione}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ──────────────────────────────────────────────────
export default function SchedaAllievo({ allievo, lezioniInsegnante, onClose }) {
  const [conteggi, setConteggi]   = useState(null);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [popup, setPopup]         = useState(null); // 'rimandate' | 'da_recuperare'

  useEffect(() => {
    if (!allievo) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/allievi/${allievo.id}/conteggio-lezioni`),
      apiFetch(`/api/allievi/${allievo.id}/pagamenti`),
    ]).then(([cnt, pag]) => {
      setConteggi(cnt);
      setPagamenti(Array.isArray(pag) ? pag : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [allievo]);

  if (!allievo) return null;

  // Pagamento mese corrente
  const now = new Date();
  const annoCorrente = now.getFullYear();
  const meseCorrente = now.getMonth() + 1;
  const pagMese = pagamenti.find(p => +p.anno === annoCorrente && +p.mese === meseCorrente);
  const pagRegolare = !!pagMese;

  // Lezioni dell'allievo dai dati già caricati
  const lezioniAllievo = (lezioniInsegnante || []).filter(l => String(l.id_allievo) === String(allievo.id));
  // Rimandate = quelle già riprogrammate (stato='rimandata' + riprogrammata=true)
  // + quelle che pur avendo stato diverso hanno uno storico (old_schedules) di spostamenti
  const lezioniRimandate = lezioniAllievo.filter(l =>
    (l.stato === 'rimandata' && l.riprogrammata) ||
    parseHistory(l.old_schedules).length > 0
  );
  const lezioniDaRecuperare = lezioniAllievo.filter(l => l.stato === 'rimandata' && !l.riprogrammata);

  const dataIscrizione = allievo.data_iscrizione || allievo.created_at || allievo.data_creazione;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">

        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
          <button onClick={onClose} className="text-gray-400 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {allievo.nome} {allievo.cognome}
            </h2>
            {dataIscrizione && (
              <p className="text-xs text-gray-400">Iscritto dal {fmtData(dataIscrizione)}</p>
            )}
          </div>
          {allievo.strumento && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg shrink-0">
              {allievo.strumento}
            </span>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-3">

                <KpiCard
                  icon={CheckCircle2}
                  color="emerald"
                  label="Lezioni svolte"
                  value={conteggi?.svolte ?? '—'}
                />

                <KpiCard
                  icon={RotateCcw}
                  color="amber"
                  label="Lezioni rimandate"
                  value={conteggi ? (conteggi.riprogrammate || 0) + (conteggi.rimandate || 0) : '—'}
                  onClick={((conteggi?.riprogrammate || 0) + (conteggi?.rimandate || 0)) > 0 ? () => setPopup('rimandate') : null}
                />

                <KpiCard
                  icon={pagRegolare ? CreditCard : AlertCircle}
                  color={pagRegolare ? 'blue' : 'red'}
                  label={`Pagamento ${MESI_IT[meseCorrente - 1]} ${annoCorrente}`}
                  value={pagRegolare ? 'Regolare' : 'Non pagato'}
                />

                <KpiCard
                  icon={AlertCircle}
                  color={lezioniDaRecuperare.length > 0 ? 'red' : 'gray'}
                  label="Da recuperare"
                  value={lezioniDaRecuperare.length}
                  onClick={lezioniDaRecuperare.length > 0 ? () => setPopup('da_recuperare') : null}
                />
              </div>

              {/* info extra */}
              {allievo.email && (
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-gray-700">{allievo.email}</p>
                </div>
              )}

              {allievo.telefono && (
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Telefono</p>
                  <p className="text-sm text-gray-700">{allievo.telefono}</p>
                </div>
              )}

            </>
          )}
        </div>
      </div>

      {/* popup log */}
      {popup === 'rimandate' && (
        <LogPopup
          title="Lezioni rimandate"
          lezioni={lezioniRimandate}
          tipo="rimandate"
          onClose={() => setPopup(null)}
        />
      )}
      {popup === 'da_recuperare' && (
        <LogPopup
          title="Lezioni da recuperare"
          lezioni={lezioniDaRecuperare}
          tipo="da_recuperare"
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );

  return createPortal(modal, document.body);
}

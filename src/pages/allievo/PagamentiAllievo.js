import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, CreditCard, RefreshCw, AlertTriangle, X, Check, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import AllievoLayout from '../../componenti/AllievoLayout';
import StripePayment from '../../componenti/StripePayment';
import { apiFetch } from '../../utils/api';

const MESI = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function fmtData(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate()} ${MESI[dt.getMonth() + 1]} ${dt.getFullYear()}`;
}

// ── Modal pagamento arretrati ─────────────────────────────────────────────────
function ModalArretrati({ arretrati, quota, onClose, onPagato }) {
  const [step, setStep] = useState('riepilogo');
  const totale = arretrati.reduce((s, a) => s + parseFloat(a.importo || quota), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={step === 'ok' ? onClose : undefined}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl flex flex-col" style={{ maxHeight: 'calc(92vh - 56px - env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-ama-500" />
            <h2 className="font-semibold text-n-900">
              {step === 'ok' ? 'Pagamento completato' : 'Saldo arretrati'}
            </h2>
          </div>
          <button onClick={onClose} className="text-n-300"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 'riepilogo' && (
            <>
              <p className="text-sm text-n-600 mb-3">Quote mensili da saldare:</p>
              <div className="space-y-2 mb-5">
                {arretrati.map(a => (
                  <div key={`${a.anno}-${a.mese}`}
                    className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className="text-amber-500" />
                      <span className="text-sm font-medium text-n-900">{MESI[a.mese]} {a.anno}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      €{parseFloat(a.importo || quota).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-ama-100 border border-ama-100 rounded-xl px-4 py-3 flex items-center justify-between mb-5">
                <span className="text-sm font-semibold text-indigo-800">Totale</span>
                <span className="text-xl font-bold text-ama-700">€{totale.toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('checkout')}
                className="w-full py-3.5 rounded-xl bg-ama-500 text-white font-bold text-sm">
                Procedi al pagamento
              </button>
            </>
          )}

          {step === 'checkout' && (
            <StripePayment
              mode="arretrati"
              mesi={arretrati.map(a => ({ anno: a.anno, mese: a.mese, importo: parseFloat(a.importo || quota) }))}
              onSuccess={async (pi) => {
                // Conferma immediata (backup al webhook)
                try {
                  await apiFetch('/api/allievo/conferma-pagamento', {
                    method: 'POST',
                    body: JSON.stringify({ mesi: arretrati.map(a => ({ anno: a.anno, mese: a.mese })) }),
                  });
                } catch {}
                setStep('ok');
                setTimeout(() => { onPagato(); onClose(); }, 2500);
              }}
            />
          )}

          {step === 'ok' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <p className="text-lg font-bold text-n-900 mb-2">Pagamento riuscito!</p>
              <p className="text-sm text-n-600 text-center">Le quote sono state registrate. Grazie!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal abbonamento ─────────────────────────────────────────────────────────
function ModalAbbonamento({ quota, onClose, onAttivato }) {
  const [step, setStep] = useState('checkout');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={step === 'ok' ? onClose : undefined}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl flex flex-col" style={{ maxHeight: 'calc(92vh - 56px - env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-ama-500" />
            <h2 className="font-semibold text-n-900">
              {step === 'ok' ? 'Abbonamento attivato' : 'Addebito automatico mensile'}
            </h2>
          </div>
          <button onClick={onClose} className="text-n-300"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 'checkout' && (
            <>
              <div className="bg-ama-100 border border-ama-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-n-600 mb-0.5">Importo mensile</p>
                <p className="text-2xl font-bold text-ama-700">€{parseFloat(quota).toFixed(2)}</p>
                <p className="text-xs text-n-600 mt-1">
                  La carta verrà addebitata automaticamente ogni mese. Puoi annullare in qualsiasi momento contattando la segreteria.
                </p>
              </div>
              <StripePayment
                mode="abbonamento"
                onSuccess={() => {
                  setStep('ok');
                  setTimeout(() => { onAttivato(); onClose(); }, 2500);
                }}
              />
            </>
          )}

          {step === 'ok' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <p className="text-lg font-bold text-n-900 mb-2">Abbonamento attivato!</p>
              <p className="text-sm text-n-600 text-center">
                La quota di €{parseFloat(quota).toFixed(2)} verrà addebitata automaticamente ogni mese.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────
export default function PagamentiAllievo() {
  const [dati, setDati]           = useState(null);
  const [arretrati, setArretrati] = useState([]);
  const [tassaPagata, setTassaPagata] = useState(null);
  const [annoCorrente, setAnnoCorrente] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showArretrati, setShowArretrati]     = useState(false);
  const [showAbbonamento, setShowAbbonamento] = useState(false);
  const [storicoAperto, setStoricoAperto]     = useState(false);

  const carica = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/allievo/pagamenti'),
      apiFetch('/api/allievo/pagamenti-arretrati'),
    ]).then(([pag, arr]) => {
      setDati(pag);
      setArretrati(arr.arretrati || []);
      setTassaPagata(arr.tassaPagata);
      setAnnoCorrente(arr.annoCorrente);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { carica(); }, []);

  if (loading) return (
    <AllievoLayout>
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AllievoLayout>
  );

  const quota     = parseFloat(dati?.quota_mensile || 0);
  const pagamenti = dati?.pagamenti || [];
  const abbonamentoAttivo = dati?.abbonamentoAttivo || false;
  const mesiPagati   = pagamenti.filter(p => p.pagato).length;
  const totaleArretrati = arretrati.reduce((s, a) => s + parseFloat(a.importo || quota), 0);

  return (
    <AllievoLayout>
      <div className="pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-n-900">Pagamenti</h1>
        <button onClick={carica} className="p-2 text-n-600"><RefreshCw size={18} /></button>
      </div>

      {/* ── Card arretrati ── */}
      {arretrati.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">
                {arretrati.length === 1 ? '1 quota arretrata' : `${arretrati.length} quote arretrate`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Totale da saldare: <strong>€{totaleArretrati.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            {arretrati.map(a => (
              <div key={`${a.anno}-${a.mese}`}
                className="flex justify-between items-center text-sm px-3 py-2 bg-white rounded-xl border border-amber-100">
                <span className="text-gray-700">{MESI[a.mese]} {a.anno}</span>
                <span className="font-semibold text-amber-700">€{parseFloat(a.importo || quota).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowArretrati(true)}
            className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold flex items-center justify-center gap-2">
            <CreditCard size={16} /> Paga ora — €{totaleArretrati.toFixed(2)}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Nessun arretrato — posizione in regola</p>
        </div>
      )}

      {/* ── Card abbonamento ── */}
      {quota > 0 && (
        <div className={`rounded-2xl border p-5 mb-4 ${abbonamentoAttivo ? 'bg-ama-100 border-ama-100' : 'bg-white border-n-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Repeat size={18} className={abbonamentoAttivo ? 'text-ama-500' : 'text-n-300'} />
              <p className="font-bold text-n-900">Addebito automatico</p>
            </div>
            {abbonamentoAttivo && (
              <span className="text-xs bg-ama-500 text-white px-2.5 py-1 rounded-full font-semibold">Attivo</span>
            )}
          </div>
          <p className="text-xs text-n-600 mb-3 ml-6">
            {abbonamentoAttivo
              ? `€${quota.toFixed(2)}/mese addebitati automaticamente`
              : 'Attiva per addebitare automaticamente la quota mensile ogni mese'}
          </p>
          {!abbonamentoAttivo && (
            <button onClick={() => setShowAbbonamento(true)}
              className="w-full py-3 rounded-xl bg-ama-500 text-white text-sm font-bold flex items-center justify-center gap-2">
              <Repeat size={15} /> Attiva — €{quota.toFixed(2)}/mese
            </button>
          )}
        </div>
      )}

      {/* ── Tassa associativa ── */}
      {annoCorrente && (
        <div className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${tassaPagata ? 'bg-white border-n-100' : 'bg-amber-50 border-amber-200'}`}>
          {tassaPagata
            ? <CheckCircle size={20} className="text-emerald-500 shrink-0" />
            : <XCircle    size={20} className="text-amber-500 shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-n-900">Tassa associativa {annoCorrente}</p>
            <p className={`text-xs mt-0.5 ${tassaPagata ? 'text-emerald-700' : 'text-amber-700'}`}>
              {tassaPagata ? 'Versata ✓' : 'Non ancora versata — contatta la segreteria'}
            </p>
          </div>
        </div>
      )}

      {/* ── Storico mensile ── */}
      {pagamenti.length > 0 && (
        <div className="bg-white border rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setStoricoAperto(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-ama-500" />
              <span className="text-sm font-semibold text-n-900">Storico mensile</span>
              <span className="text-xs text-n-300 ml-1">{mesiPagati}/{pagamenti.length} pagati</span>
            </div>
            {storicoAperto ? <ChevronUp size={16} className="text-n-300" /> : <ChevronDown size={16} className="text-n-300" />}
          </button>
          {storicoAperto && (
            <div className="divide-y divide-gray-50">
              {pagamenti.map(p => (
                <div key={`${p.anno}-${p.mese}`}
                  className={`flex items-center justify-between px-4 py-3 ${p.pagato ? '' : 'bg-amber-50'}`}>
                  <div className="flex items-center gap-3">
                    {p.pagato
                      ? <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                      : <XCircle    size={18} className="text-amber-400 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-n-900">{MESI[p.mese]} {p.anno}</p>
                      {p.pagato && p.data_pagamento
                        ? <p className="text-xs text-n-300">Pagato il {fmtData(p.data_pagamento)}</p>
                        : <p className="text-xs text-amber-600">Non pagato</p>}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${p.pagato ? 'text-n-600' : 'text-amber-600'}`}>
                    €{quota.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showArretrati && (
        <ModalArretrati
          arretrati={arretrati}
          quota={quota}
          onClose={() => setShowArretrati(false)}
          onPagato={carica}
        />
      )}

      {showAbbonamento && (
        <ModalAbbonamento
          quota={quota}
          onClose={() => setShowAbbonamento(false)}
          onAttivato={carica}
        />
      )}
    </AllievoLayout>
  );
}

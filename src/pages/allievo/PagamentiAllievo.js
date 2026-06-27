import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, CreditCard, RefreshCw, AlertTriangle, Send, X, Check } from 'lucide-react';
import AllievoLayout from '../../componenti/AllievoLayout';
import StripePayment from '../../componenti/StripePayment';
import { apiFetch } from '../../utils/api';

const MESI = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function fmtDataPag(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate()} ${MESI[dt.getMonth() + 1]} ${dt.getFullYear()}`;
}

function ModalPagamento({ arretrati, quota, onClose, onPagato }) {
  const [step, setStep] = useState('riepilogo'); // 'riepilogo' | 'checkout' | 'ok'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">
              {step === 'ok' ? 'Pagamento completato' : 'Saldo arretrati'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 'riepilogo' && (
            <>
              <p className="text-sm text-gray-600 mb-4">Quote mensili da saldare:</p>
              <div className="space-y-2 mb-4">
                {arretrati.map(a => (
                  <div key={`${a.anno}-${a.mese}`}
                    className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-amber-500" />
                      <span className="text-sm font-medium text-gray-900">{MESI[a.mese]} {a.anno}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      €{parseFloat(a.importo || quota).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('checkout')}
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">
                Procedi al pagamento
              </button>
            </>
          )}

          {step === 'checkout' && (
            <StripePayment
              mode="arretrati"
              mesi={arretrati.map(a => ({ anno: a.anno, mese: a.mese, importo: a.importo || quota }))}
              onSuccess={() => { setStep('ok'); setTimeout(() => { onPagato(); onClose(); }, 2500); }}
            />
          )}

          {step === 'ok' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <p className="text-lg font-bold text-gray-900 text-center mb-2">Pagamento riuscito!</p>
              <p className="text-sm text-gray-500 text-center">
                Le quote sono state registrate. Grazie!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PagamentiAllievo() {
  const [dati, setDati]           = useState(null);
  const [arretrati, setArretrati] = useState([]);
  const [tassaPagata, setTassaPagata] = useState(null);
  const [annoCorrente, setAnnoCorrente] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [showAbbonamento, setShowAbbonamento] = useState(false);
  const [tab, setTab]                     = useState('mensili'); // 'mensili' | 'annuale'

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
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AllievoLayout>
  );

  const pagamenti  = dati?.pagamenti || [];
  const quota      = parseFloat(dati?.quota_mensile || 0);
  const pagati     = pagamenti.filter(p => p.pagato).length;
  const nonPagati  = pagamenti.filter(p => !p.pagato).length;

  return (
    <AllievoLayout>
      <div className="pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pagamenti</h1>
        <button onClick={carica} className="p-2 text-gray-500"><RefreshCw size={18} /></button>
      </div>

      {/* Alert arretrati */}
      {arretrati.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {arretrati.length} {arretrati.length === 1 ? 'quota arretrata' : 'quote arretrate'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Hai delle quote mensili non ancora registrate. Clicca per regolarizzare la posizione.
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="mt-3 w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Send size={14} /> Regolarizza ora
          </button>
        </div>
      )}

      {/* Tab mensili / annuale */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {[
          { id: 'mensili', label: 'Quote mensili' },
          { id: 'annuale', label: `Tassa ${annoCorrente || ''}` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Quote mensili */}
      {tab === 'mensili' && (
        <>
          <div className="bg-indigo-600 text-white rounded-2xl p-5 mb-4">
            <p className="text-sm opacity-80 mb-1">Quota mensile</p>
            <p className="text-3xl font-bold">€{quota.toFixed(2)}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 opacity-90">
                <CheckCircle size={14} /> {pagati} pagati
              </span>
              {nonPagati > 0 && (
                <span className="flex items-center gap-1 text-amber-300">
                  <XCircle size={14} /> {nonPagati} in attesa
                </span>
              )}
            </div>
          </div>

          {/* Abbonamento automatico */}
          {quota > 0 && (
            <div className="mb-4 bg-white border rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Addebito automatico</p>
                <p className="text-xs text-gray-500 mt-0.5">Non pensarci più ogni mese</p>
              </div>
              <button onClick={() => setShowAbbonamento(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                Attiva
              </button>
            </div>
          )}

          {pagamenti.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
              <p>Nessun dato disponibile</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pagamenti.map(p => (
                <div key={`${p.anno}-${p.mese}`}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    p.pagato ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    {p.pagato
                      ? <CheckCircle size={22} className="text-emerald-500 shrink-0" />
                      : <XCircle    size={22} className="text-amber-500 shrink-0" />}
                    <div>
                      <p className="font-semibold text-gray-900">{MESI[p.mese]} {p.anno}</p>
                      {p.pagato && p.data_pagamento
                        ? <p className="text-xs text-gray-500">Pagato il {fmtDataPag(p.data_pagamento)}</p>
                        : <p className="text-xs text-amber-600 font-medium">Non ancora pagato</p>}
                    </div>
                  </div>
                  <span className={`font-bold ${p.pagato ? 'text-gray-700' : 'text-amber-600'}`}>
                    €{quota.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tassa annuale */}
      {tab === 'annuale' && (
        <div>
          <div className={`rounded-2xl p-5 border ${tassaPagata ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {tassaPagata
                ? <CheckCircle size={28} className="text-emerald-500" />
                : <XCircle    size={28} className="text-amber-500" />}
              <div>
                <p className="font-bold text-gray-900 text-base">Tassa associativa {annoCorrente}</p>
                <p className={`text-sm font-medium ${tassaPagata ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {tassaPagata ? 'Versata ✓' : 'Non ancora versata'}
                </p>
              </div>
            </div>
            {!tassaPagata && (
              <>
                <p className="text-xs text-amber-700 mb-3">
                  La tassa associativa non risulta ancora registrata per l'anno {annoCorrente}.
                  Contatta la segreteria per procedere al versamento.
                </p>
                <button onClick={() => setShowModal(true)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
                  <Send size={14} /> Richiedi informazioni alla segreteria
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <ModalPagamento
          arretrati={arretrati}
          quota={quota}
          onClose={() => setShowModal(false)}
          onPagato={carica}
        />
      )}

      {showAbbonamento && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowAbbonamento(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-gray-900">Addebito automatico mensile</h2>
              </div>
              <button onClick={() => setShowAbbonamento(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <StripePayment
                mode="abbonamento"
                onSuccess={() => {
                  setShowAbbonamento(false);
                  carica();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AllievoLayout>
  );
}

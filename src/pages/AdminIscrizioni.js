import React, { useEffect, useRef, useState } from 'react';
import { Check, X, ChevronLeft, Eye, UserCheck, UserX, Pen } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { apiFetch, API_BASE } from '../utils/api';

const MESI = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function fmtData(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate()} ${MESI[dt.getMonth()+1]} ${dt.getFullYear()}`;
}

function Badge({ stato }) {
  const cfg = {
    in_attesa: 'bg-amber-100 text-amber-800',
    accettata: 'bg-emerald-100 text-emerald-800',
    rifiutata: 'bg-red-100 text-red-800',
  };
  const label = { in_attesa: 'In attesa', accettata: 'Accettata', rifiutata: 'Rifiutata' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg[stato] || ''}`}>
      {label[stato] || stato}
    </span>
  );
}

function ModalDettaglio({ isc, onClose, onAccetta, onRifiuta }) {
  const sigRef = useRef(null);
  const [showFirma, setShowFirma] = useState(false);
  const [loading, setLoading]    = useState(false);

  const handleAccetta = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert('Apponi la firma del presidente prima di accettare.');
      return;
    }
    setLoading(true);
    const firma_presidente = sigRef.current.toDataURL('image/png');
    try {
      await apiFetch(`/api/admin/iscrizioni/${isc.id}/accetta`, {
        method: 'PATCH',
        body: JSON.stringify({ firma_presidente }),
      });
      onAccetta();
      onClose();
    } catch (e) {
      alert('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRifiuta = async () => {
    if (!window.confirm(`Rifiutare la domanda di ${isc.nome} ${isc.cognome}?`)) return;
    setLoading(true);
    try {
      await apiFetch(`/api/admin/iscrizioni/${isc.id}/rifiuta`, { method: 'PATCH' });
      onRifiuta();
      onClose();
    } catch (e) {
      alert('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const riga = (label, val) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-xs text-gray-900 font-medium">{val || '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">{isc.nome} {isc.cognome}</h2>
            <p className="text-xs text-gray-500">{fmtData(isc.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge stato={isc.stato} />
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Dati allievo */}
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Dati allievo</p>
          <div className="bg-gray-50 rounded-xl px-4 py-2 mb-4">
            {riga('Codice Fiscale', isc.codice_fiscale)}
            {riga('Data di nascita', fmtData(isc.data_nascita))}
            {riga('Luogo di nascita', isc.luogo_nascita)}
            {riga('Indirizzo', `${isc.indirizzo || ''} ${isc.cap || ''} ${isc.citta || ''} ${isc.provincia ? `(${isc.provincia})` : ''}`)}
            {riga('Telefono', isc.telefono)}
            {riga('Email', isc.email)}
            {riga('Strumento', isc.strumento)}
            {isc.note && riga('Note', isc.note)}
          </div>

          {/* Dati genitore */}
          {isc.minore && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Genitore/Tutore</p>
              <div className="bg-gray-50 rounded-xl px-4 py-2 mb-4">
                {riga('Nome', `${isc.genitore_nome || ''} ${isc.genitore_cognome || ''}`)}
                {riga('Codice Fiscale', isc.genitore_cf)}
                {riga('Data di nascita', fmtData(isc.genitore_data_nascita))}
                {riga('Telefono', isc.genitore_telefono)}
                {riga('Email', isc.genitore_email)}
              </div>
            </>
          )}

          {/* Consensi */}
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Consensi</p>
          <div className="bg-gray-50 rounded-xl px-4 py-2 mb-4 text-xs space-y-1">
            <p>{isc.acc_tesseramento ? '✓' : '✗'} Domanda di tesseramento</p>
            <p>{isc.acc_regolamento  ? '✓' : '✗'} Regolamento interno</p>
            <p>{isc.acc_privacy      ? '✓' : '✗'} Trattamento dati personali</p>
            <p>{isc.acc_immagini     ? '✓' : '✗'} Uso immagini</p>
          </div>

          {/* Documenti */}
          {(isc.doc_allievo_fronte || isc.doc_allievo_retro) && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Documento allievo</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {isc.doc_allievo_fronte && (
                  <img src={isc.doc_allievo_fronte} alt="Fronte" className="w-full h-28 object-cover rounded-xl border" />
                )}
                {isc.doc_allievo_retro && (
                  <img src={isc.doc_allievo_retro} alt="Retro" className="w-full h-28 object-cover rounded-xl border" />
                )}
              </div>
            </>
          )}
          {isc.minore && (isc.doc_genitore_fronte || isc.doc_genitore_retro) && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Documento genitore</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {isc.doc_genitore_fronte && (
                  <img src={isc.doc_genitore_fronte} alt="Fronte" className="w-full h-28 object-cover rounded-xl border" />
                )}
                {isc.doc_genitore_retro && (
                  <img src={isc.doc_genitore_retro} alt="Retro" className="w-full h-28 object-cover rounded-xl border" />
                )}
              </div>
            </>
          )}

          {/* Firma allievo */}
          {isc.firma_allievo && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Firma allievo/genitore</p>
              <img src={isc.firma_allievo} alt="Firma" className="h-20 border rounded-xl bg-white mb-4" />
            </>
          )}

          {/* Firma presidente (se in attesa) */}
          {isc.stato === 'in_attesa' && (
            <>
              {!showFirma ? (
                <button onClick={() => setShowFirma(true)}
                  className="w-full mb-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 text-sm font-medium flex items-center justify-center gap-2">
                  <Pen size={16} /> Apponi firma del presidente
                </button>
              ) : (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Firma presidente</p>
                  <div className="bg-white border-2 border-indigo-300 rounded-xl overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
                      <span className="text-xs text-gray-600 flex items-center gap-1"><Pen size={12} /> Firma qui</span>
                      <button onClick={() => sigRef.current?.clear()} className="text-xs text-red-500">Cancella</button>
                    </div>
                    <SignatureCanvas ref={sigRef} penColor="#1e3a5f"
                      canvasProps={{ className: 'w-full', style: { height: '140px', touchAction: 'none' } }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Azioni */}
        {isc.stato === 'in_attesa' && (
          <div className="px-5 pb-6 pt-3 border-t flex gap-3 shrink-0">
            <button onClick={handleRifiuta} disabled={loading}
              className="flex-1 py-3 rounded-xl border border-red-300 text-red-600 text-sm font-semibold flex items-center justify-center gap-2">
              <UserX size={16} /> Rifiuta
            </button>
            <button onClick={handleAccetta} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserCheck size={16} /> Accetta</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminIscrizioni() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('in_attesa');
  const [dettaglio, setDettaglio] = useState(null);
  const [dettaglioData, setDettaglioData] = useState(null);

  const carica = async (stato = tab) => {
    setLoading(true);
    try {
      const rows = await apiFetch(`/api/admin/iscrizioni?stato=${stato}`);
      setLista(rows);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { carica(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const apriDettaglio = async (id) => {
    try {
      const d = await apiFetch(`/api/admin/iscrizioni/${id}`);
      setDettaglioData(d);
      setDettaglio(id);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
        <a href="/admin" className="text-gray-400"><ChevronLeft size={22} /></a>
        <h1 className="text-lg font-bold text-gray-900">Domande di iscrizione</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Tab */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {[
            { id: 'in_attesa', label: 'In attesa' },
            { id: 'accettata', label: 'Accettate' },
            { id: 'rifiutata', label: 'Rifiutate' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Eye size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nessuna domanda {tab === 'in_attesa' ? 'in attesa' : tab}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(isc => (
              <button key={isc.id} onClick={() => apriDettaglio(isc.id)}
                className="w-full bg-white rounded-2xl border p-4 text-left flex items-center justify-between hover:border-indigo-200 transition-colors active:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">{isc.nome} {isc.cognome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isc.strumento} · {fmtData(isc.created_at)}
                    {isc.minore && ' · Minore'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge stato={isc.stato} />
                  <Eye size={16} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {dettaglio && dettaglioData && (
        <ModalDettaglio
          isc={dettaglioData}
          onClose={() => { setDettaglio(null); setDettaglioData(null); }}
          onAccetta={() => carica(tab)}
          onRifiuta={() => carica(tab)}
        />
      )}
    </div>
  );
}

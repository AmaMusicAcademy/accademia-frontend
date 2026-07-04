import React, { useEffect, useRef, useState } from 'react';
import {
  Check, X, ChevronLeft, Eye, UserCheck, UserX, Pen,
  ChevronRight, AlertCircle, FileCheck, ClipboardList,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { apiFetch } from '../utils/api';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

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

// ── Modale rifiuto con motivazione ────────────────────────────────────────────
function ModalRifiuto({ isc, onClose, onRifiuta }) {
  const [motivazione, setMotivazione] = useState('');
  const [loading, setLoading] = useState(false);

  const conferma = async () => {
    setLoading(true);
    try {
      await apiFetch(`/api/admin/iscrizioni/${isc.id}/rifiuta`, {
        method: 'PATCH',
        body: JSON.stringify({ motivazione }),
      });
      onRifiuta();
      onClose();
    } catch (e) {
      alert('Errore: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={18} className="text-red-500" />
          <h3 className="font-bold text-n-900">Rifiuta domanda</h3>
        </div>
        <p className="text-sm text-n-600 mb-3">
          Stai per rifiutare la domanda di <strong>{isc.nome} {isc.cognome}</strong>.
          Indica facoltativamente un motivo.
        </p>
        <textarea
          value={motivazione}
          onChange={e => setMotivazione(e.target.value)}
          placeholder="Motivazione (facoltativa)..."
          rows={3}
          className="w-full text-sm border border-n-100 rounded-xl px-3 py-2.5 outline-none focus:border-red-300 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-n-100 text-n-600 text-sm font-semibold">
            Annulla
          </button>
          <button onClick={conferma} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><UserX size={15} /> Rifiuta</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal principale ───────────────────────────────────────────────────────────
function ModalDettaglio({ isc, onClose, onAccetta, onRifiuta }) {
  const sigRef = useRef(null);
  const [step, setStep] = useState(1); // 1=verifica, 2=firma
  const [firmaAcquisita, setFirmaAcquisita] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRifiuto, setShowRifiuto] = useState(false);

  // Conformità: checklist obbligatoria prima di procedere alla firma
  const [checks, setChecks] = useState({
    dati_corretti: false,
    consensi_validi: false,
    documento_valido: false,
    firma_presente: false,
  });
  const tuttiChecked = Object.values(checks).every(Boolean);
  const toggleCheck = k => setChecks(prev => ({ ...prev, [k]: !prev[k] }));

  const handleFirmaChange = () => {
    setFirmaAcquisita(sigRef.current && !sigRef.current.isEmpty());
  };

  const handleAccetta = async () => {
    if (!firmaAcquisita) return;
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

  const riga = (label, val) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-n-300 w-36 shrink-0">{label}</span>
      <span className="text-xs text-n-900 font-medium">{val || '—'}</span>
    </div>
  );

  const CheckItem = ({ id, label, note }) => (
    <button onClick={() => toggleCheck(id)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-colors text-left
        ${checks[id] ? 'border-emerald-200 bg-emerald-50' : 'border-n-100 bg-white'}`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors
        ${checks[id] ? 'bg-emerald-500 border-emerald-500' : 'border-n-300'}`}>
        {checks[id] && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <div>
        <p className={`text-sm font-medium ${checks[id] ? 'text-emerald-800' : 'text-gray-700'}`}>{label}</p>
        {note && <p className="text-xs text-n-300 mt-0.5">{note}</p>}
      </div>
    </button>
  );

  // Step indicator
  const StepBar = () => (
    <div className="flex items-center gap-2 px-5 py-3 bg-n-50 border-b">
      {[
        { n: 1, label: 'Verifica dati' },
        { n: 2, label: 'Firma direzione' },
      ].map(({ n, label }, i, arr) => (
        <React.Fragment key={n}>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${step >= n ? 'bg-ama-500 text-white' : 'bg-gray-200 text-n-300'}`}>
              {step > n ? <Check size={12} strokeWidth={3} /> : n}
            </div>
            <span className={`text-xs font-medium ${step >= n ? 'text-ama-500' : 'text-n-300'}`}>{label}</span>
          </div>
          {i < arr.length - 1 && <ChevronRight size={14} className="text-n-300 shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <div>
              <h2 className="font-bold text-n-900">{isc.nome} {isc.cognome}</h2>
              <p className="text-xs text-n-600">Domanda del {fmtData(isc.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge stato={isc.stato} />
              <button onClick={onClose}><X size={20} className="text-n-300" /></button>
            </div>
          </div>

          {/* Step bar (solo se in_attesa) */}
          {isc.stato === 'in_attesa' && <StepBar />}

          {/* ── STEP 1: VERIFICA DATI ── */}
          {(step === 1 || isc.stato !== 'in_attesa') && (
            <div className="overflow-y-auto flex-1 px-5 py-4">

              <p className="text-xs font-bold text-n-600 uppercase mb-2">Dati allievo</p>
              <div className="bg-n-50 rounded-xl px-4 py-2 mb-4">
                {riga('Nome e Cognome', `${isc.nome} ${isc.cognome}`)}
                {riga('Codice Fiscale', isc.codice_fiscale)}
                {riga('Data di nascita', fmtData(isc.data_nascita))}
                {riga('Luogo di nascita', isc.luogo_nascita)}
                {riga('Indirizzo', [isc.indirizzo, isc.cap, isc.citta, isc.provincia ? `(${isc.provincia})` : ''].filter(Boolean).join(' '))}
                {riga('Telefono', isc.telefono)}
                {riga('Email', isc.email)}
                {riga('Strumento', isc.strumento)}
                {isc.note && riga('Note', isc.note)}
              </div>

              {isc.minore && (
                <>
                  <p className="text-xs font-bold text-n-600 uppercase mb-2">Genitore / Tutore</p>
                  <div className="bg-n-50 rounded-xl px-4 py-2 mb-4">
                    {riga('Nome e Cognome', `${isc.genitore_nome || ''} ${isc.genitore_cognome || ''}`)}
                    {riga('Codice Fiscale', isc.genitore_cf)}
                    {riga('Data di nascita', fmtData(isc.genitore_data_nascita))}
                    {riga('Luogo di nascita', isc.genitore_luogo_nascita)}
                    {riga('Indirizzo', isc.genitore_indirizzo)}
                    {riga('Telefono', isc.genitore_telefono)}
                    {riga('Email', isc.genitore_email)}
                  </div>
                </>
              )}

              <p className="text-xs font-bold text-n-600 uppercase mb-2">Consensi</p>
              <div className="bg-n-50 rounded-xl px-4 py-2 mb-4 space-y-1">
                {[
                  { key: 'acc_tesseramento', label: 'Domanda di tesseramento' },
                  { key: 'acc_regolamento',  label: 'Regolamento interno' },
                  { key: 'acc_privacy',      label: 'Trattamento dati personali' },
                  { key: 'acc_immagini',     label: 'Uso immagini (facoltativo)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 py-1 text-xs">
                    {isc[key]
                      ? <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                      : <X size={14} className="text-red-400 shrink-0" />}
                    <span className={isc[key] ? 'text-n-900' : 'text-n-300'}>{label}</span>
                  </div>
                ))}
              </div>

              {(isc.doc_allievo_fronte || isc.doc_allievo_retro) && (
                <>
                  <p className="text-xs font-bold text-n-600 uppercase mb-2">Documento identità allievo</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {isc.doc_allievo_fronte && (
                      <div>
                        <p className="text-xs text-n-300 mb-1">Fronte</p>
                        <img src={isc.doc_allievo_fronte} alt="Fronte" className="w-full h-32 object-cover rounded-xl border" />
                      </div>
                    )}
                    {isc.doc_allievo_retro && (
                      <div>
                        <p className="text-xs text-n-300 mb-1">Retro</p>
                        <img src={isc.doc_allievo_retro} alt="Retro" className="w-full h-32 object-cover rounded-xl border" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {isc.minore && (isc.doc_genitore_fronte || isc.doc_genitore_retro) && (
                <>
                  <p className="text-xs font-bold text-n-600 uppercase mb-2">Documento identità genitore</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {isc.doc_genitore_fronte && (
                      <div>
                        <p className="text-xs text-n-300 mb-1">Fronte</p>
                        <img src={isc.doc_genitore_fronte} alt="Fronte" className="w-full h-32 object-cover rounded-xl border" />
                      </div>
                    )}
                    {isc.doc_genitore_retro && (
                      <div>
                        <p className="text-xs text-n-300 mb-1">Retro</p>
                        <img src={isc.doc_genitore_retro} alt="Retro" className="w-full h-32 object-cover rounded-xl border" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {isc.firma_allievo && (
                <>
                  <p className="text-xs font-bold text-n-600 uppercase mb-2">
                    Firma {isc.minore ? 'genitore/tutore' : 'allievo'}
                  </p>
                  <div className="bg-white border rounded-xl p-3 mb-4 inline-block">
                    <img src={isc.firma_allievo} alt="Firma allievo" className="h-20" />
                  </div>
                </>
              )}

              {/* Firma presidente (se già accettata) */}
              {isc.firma_presidente && (
                <>
                  <p className="text-xs font-bold text-n-600 uppercase mb-2">Firma della direzione</p>
                  <div className="bg-white border rounded-xl p-3 mb-4 inline-block">
                    <img src={isc.firma_presidente} alt="Firma direzione" className="h-20" />
                  </div>
                  <p className="text-xs text-n-300 mb-4">Accettata il {fmtData(isc.accettata_il)}</p>
                </>
              )}

              {/* Checklist conformità (solo in_attesa) */}
              {isc.stato === 'in_attesa' && (
                <>
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <ClipboardList size={15} className="text-ama-500" />
                    <p className="text-xs font-bold text-gray-700 uppercase">Verifica conformità</p>
                  </div>
                  <div className="space-y-2 mb-2">
                    <CheckItem id="dati_corretti"   label="Dati anagrafici corretti e completi"
                      note="Nome, cognome, CF, data/luogo nascita, indirizzo verificati" />
                    <CheckItem id="consensi_validi" label="Consensi obbligatori presenti"
                      note="Tesseramento, regolamento e privacy accettati" />
                    <CheckItem id="documento_valido" label="Documento di identità valido"
                      note="Documento leggibile, non scaduto, corrispondente ai dati" />
                    <CheckItem id="firma_presente"  label="Firma autografa acquisita"
                      note="Firma dell'allievo o del genitore/tutore presente" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: FIRMA DIREZIONE ── */}
          {step === 2 && isc.stato === 'in_attesa' && (
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="bg-ama-100 border border-ama-100 rounded-xl p-4 mb-5 flex gap-3">
                <FileCheck size={18} className="text-ama-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-800">
                  La verifica della domanda è stata completata. Apponi la firma della direzione
                  per procedere all'accettazione ufficiale.
                </p>
              </div>

              <p className="text-xs font-bold text-n-600 uppercase mb-3">Firma della direzione</p>
              <div className="bg-white border-2 border-ama-300 rounded-xl overflow-hidden mb-3">
                <div className="flex justify-between items-center px-4 py-2.5 bg-n-50 border-b">
                  <span className="text-xs text-n-600 flex items-center gap-1.5">
                    <Pen size={13} className="text-ama-500" /> Firma qui sotto
                  </span>
                  <button onClick={() => { sigRef.current?.clear(); setFirmaAcquisita(false); }}
                    className="text-xs text-red-500 font-medium">
                    Cancella
                  </button>
                </div>
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#1e3a5f"
                  onEnd={handleFirmaChange}
                  canvasProps={{ className: 'w-full', style: { height: '180px', touchAction: 'none' } }}
                />
              </div>
              {!firmaAcquisita && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5 mb-2">
                  <AlertCircle size={13} /> Firma richiesta per procedere all'accettazione
                </p>
              )}
            </div>
          )}

          {/* ── FOOTER AZIONI ── */}
          {isc.stato === 'in_attesa' && (
            <div className="px-5 pb-6 pt-3 border-t shrink-0">
              {step === 1 ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowRifiuto(true)}
                    className="py-3 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold flex items-center gap-2">
                    <UserX size={16} /> Rifiuta
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!tuttiChecked}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors
                      ${tuttiChecked
                        ? 'bg-ama-500 text-white active:bg-ama-700'
                        : 'bg-n-100 text-n-300 cursor-not-allowed'}`}>
                    Procedi alla firma <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="py-3 px-4 rounded-xl border border-n-100 text-n-600 text-sm font-semibold">
                    Indietro
                  </button>
                  <button
                    onClick={handleAccetta}
                    disabled={!firmaAcquisita || loading}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors
                      ${firmaAcquisita && !loading
                        ? 'bg-emerald-600 text-white active:bg-emerald-700'
                        : 'bg-n-100 text-n-300 cursor-not-allowed'}`}>
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><UserCheck size={16} /> Accetta iscrizione</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRifiuto && (
        <ModalRifiuto
          isc={isc}
          onClose={() => setShowRifiuto(false)}
          onRifiuta={() => { onRifiuta(); onClose(); }}
        />
      )}
    </>
  );
}

// ── Pagina principale ──────────────────────────────────────────────────────────
export default function AdminIscrizioni() {
  const [lista, setLista]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('in_attesa');
  const [dettaglioData, setDettaglioData] = useState(null);

  const carica = async (stato = tab) => {
    setLoading(true);
    try {
      const rows = await apiFetch(`/api/admin/iscrizioni?stato=${stato}`);
      setLista(rows);
    } catch (e) {
      console.error('Errore carica iscrizioni:', e);
      setLista([]);
    }
    setLoading(false);
  };

  useEffect(() => { carica(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const apriDettaglio = async (id) => {
    try {
      const d = await apiFetch(`/api/admin/iscrizioni/${id}`);
      setDettaglioData(d);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-n-50 pb-20">
      <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
        <a href="/admin" className="text-n-300"><ChevronLeft size={22} /></a>
        <h1 className="text-lg font-bold text-n-900">Domande di iscrizione</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Tab */}
        <div className="flex bg-n-100 rounded-xl p-1 mb-5">
          {[
            { id: 'in_attesa', label: 'In attesa' },
            { id: 'accettata', label: 'Accettate' },
            { id: 'rifiutata', label: 'Rifiutate' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === id ? 'bg-white text-ama-500 shadow-sm' : 'text-n-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16 text-n-300">
            <Eye size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'in_attesa' ? 'Nessuna domanda in attesa' :
               tab === 'accettata' ? 'Nessuna domanda accettata' : 'Nessuna domanda rifiutata'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(isc => (
              <button key={isc.id} onClick={() => apriDettaglio(isc.id)}
                className="w-full bg-white rounded-2xl border p-4 text-left flex items-center justify-between hover:border-ama-100 transition-colors active:bg-n-50">
                <div>
                  <p className="font-semibold text-n-900">{isc.nome} {isc.cognome}</p>
                  <p className="text-xs text-n-600 mt-0.5">
                    {isc.strumento} · {fmtData(isc.created_at)}
                    {isc.minore && ' · Minore'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge stato={isc.stato} />
                  <ChevronRight size={16} className="text-n-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {dettaglioData && (
        <ModalDettaglio
          isc={dettaglioData}
          onClose={() => setDettaglioData(null)}
          onAccetta={() => carica(tab)}
          onRifiuta={() => carica(tab)}
        />
      )}

      <BottomNavAdmin />
    </div>
  );
}

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Check, ChevronRight, ChevronLeft, X, Upload, FileText, Shield, Camera, Pen } from 'lucide-react';
import { API_BASE } from '../utils/api';

const STRUMENTI = [
  'Pianoforte','Chitarra','Violino','Violoncello','Flauto','Clarinetto',
  'Sassofono','Tromba','Trombone','Percussioni','Canto','Basso','Altro',
];

const TESTO_TESSERAMENTO = `DOMANDA DI TESSERAMENTO

Il/La sottoscritto/a chiede di essere ammesso/a come socio dell'Associazione AMA Music Academy,
impegnandosi a rispettare lo Statuto e il Regolamento interno dell'Associazione.

Dichiara di essere a conoscenza delle finalità e degli scopi dell'Associazione e di condividerli.

La quota associativa annuale verrà comunicata dalla segreteria al momento dell'iscrizione.

Il tesseramento ha validità per l'anno accademico in corso e deve essere rinnovato annualmente.`;

const TESTO_REGOLAMENTO = `REGOLAMENTO INTERNO — AMA MUSIC ACADEMY

Art. 1 — Iscrizione
L'iscrizione all'accademia dà diritto a frequentare le lezioni secondo quanto stabilito al momento dell'iscrizione. La quota associativa annuale deve essere versata entro il 30 settembre di ogni anno accademico.

Art. 2 — Quote mensili
Le quote mensili devono essere versate entro il 10 di ogni mese. Il ritardo nel pagamento comporta la sospensione temporanea dell'accesso alle lezioni.

Art. 3 — Lezioni e assenze
In caso di assenza programmata, l'allievo deve avvisare l'insegnante con almeno 24 ore di anticipo. Le lezioni annullate senza preavviso sufficiente non saranno recuperate.

Art. 4 — Comportamento
Tutti gli allievi sono tenuti a mantenere un comportamento rispettoso nei confronti degli insegnanti, del personale e degli altri allievi. L'uso degli spazi comuni deve avvenire nel rispetto delle regole di convivenza.

Art. 5 — Strumenti e materiali
Ogni allievo è responsabile della cura degli strumenti e dei materiali messi a disposizione dall'accademia. Eventuali danni saranno addebitati all'allievo.

Art. 6 — Privacy
I dati personali degli allievi saranno trattati nel rispetto del GDPR (Reg. UE 2016/679).

Art. 7 — Recesso
L'allievo può recedere dall'iscrizione in qualsiasi momento, con comunicazione scritta alla segreteria. Non è previsto il rimborso delle quote già versate.`;

const TESTO_PRIVACY = `INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI
(ai sensi dell'art. 13 del Regolamento UE 2016/679 — GDPR)

Titolare del trattamento: AMA Music Academy
Email: info@amamusicacademy.it

FINALITÀ DEL TRATTAMENTO:
I dati personali forniti verranno trattati per le seguenti finalità:
• Gestione amministrativa dell'iscrizione e del rapporto associativo
• Comunicazioni relative all'attività didattica e agli eventi dell'accademia
• Adempimenti fiscali e contabili previsti dalla legge
• Invio di comunicazioni relative all'attività associativa

CONSERVAZIONE: I dati saranno conservati per tutta la durata del rapporto associativo e per i 10 anni successivi, in adempimento agli obblighi di legge.

DIRITTI DELL'INTERESSATO: Hai diritto di accedere ai tuoi dati, rettificarli, cancellarli, limitarne il trattamento e opporti al loro utilizzo, rivolgendoti a info@amamusicacademy.it.`;

const TESTO_IMMAGINI = `CONSENSO ALL'USO DELLE IMMAGINI

AMA Music Academy potrebbe realizzare fotografie e video durante le attività didattiche, i saggi e gli eventi organizzati dall'Associazione.

Le immagini potrebbero essere utilizzate per:
• Documentazione delle attività dell'accademia
• Pubblicazione sul sito web e sui canali social dell'accademia
• Materiale promozionale e informativo dell'associazione

Il consenso è facoltativo e può essere revocato in qualsiasi momento inviando una comunicazione a info@amamusicacademy.it.

In caso di mancato consenso, non verranno utilizzate immagini che consentano l'identificazione del soggetto.`;

// ── Componenti UI ─────────────────────────────────────────────────────────
function Campo({ label, value, onChange, type = 'text', required = false, disabled = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        required={required} disabled={disabled}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white" />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 bg-white">
        <option value="">— Seleziona —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ModalTesto({ titolo, testo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-gray-900 text-sm">{titolo}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{testo}</pre>
        </div>
        <div className="px-5 pb-5 pt-3 border-t shrink-0">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
            Ho letto
          </button>
        </div>
      </div>
    </div>
  );
}

function FlagConLink({ checked, onChange, label, linkLabel, onLeggi }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-2">
      <div onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-gray-700 flex-1">
        {label}{' '}
        <button type="button" onClick={(e) => { e.preventDefault(); onLeggi(); }}
          className="text-indigo-600 underline font-medium">{linkLabel}</button>
      </span>
    </label>
  );
}

function UploadFoto({ label, value, onChange }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative">
          <img src={value} alt={label} className="w-full h-32 object-cover rounded-xl border" />
          <button type="button" onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50">
          <Camera size={24} />
          <span className="text-xs">Tocca per scattare o caricare</span>
        </button>
      )}
    </div>
  );
}

// ── Indicatore step ───────────────────────────────────────────────────────
const STEPS = ['Dati', 'Genitore', 'Consensi', 'Documenti', 'Firma', 'Invio'];

function StepBar({ step, minore }) {
  const stepsVis = minore ? STEPS : STEPS.filter(s => s !== 'Genitore');
  const stepIdx = stepsVis.indexOf(STEPS[step]);
  return (
    <div className="flex items-center justify-between mb-6 px-1">
      {stepsVis.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${i < stepIdx ? 'bg-indigo-600 text-white' : i === stepIdx ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-gray-200 text-gray-400'}`}>
              {i < stepIdx ? <Check size={14} /> : i + 1}
            </div>
            <span className="text-[9px] text-gray-500 hidden sm:block">{s}</span>
          </div>
          {i < stepsVis.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < stepIdx ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────
export default function IscrizionePage() {
  const [step, setStep]     = useState(0); // 0=dati, 1=genitore (se minore), 2=consensi, 3=docs, 4=firma, 5=invio
  const [loading, setLoading] = useState(false);
  const [successo, setSuccesso] = useState(false);
  const [errore, setErrore] = useState('');
  const [modal, setModal]   = useState(null); // quale modale è aperta

  const sigRef = useRef(null);

  const [form, setForm] = useState({
    // allievo
    nome: '', cognome: '', codice_fiscale: '', data_nascita: '', luogo_nascita: '',
    indirizzo: '', cap: '', citta: '', provincia: '', telefono: '', email: '',
    strumento: '', note: '',
    // minore
    minore: false,
    // genitore
    genitore_nome: '', genitore_cognome: '', genitore_cf: '',
    genitore_data_nascita: '', genitore_luogo_nascita: '',
    genitore_indirizzo: '', genitore_telefono: '', genitore_email: '',
    // consensi
    acc_tesseramento: false, acc_regolamento: false,
    acc_privacy: false, acc_immagini: false,
    // documenti
    doc_allievo_fronte: null, doc_allievo_retro: null,
    doc_genitore_fronte: null, doc_genitore_retro: null,
    // firma
    firma_allievo: null,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Calcola step effettivi in base a flag minore
  const stepOrder = form.minore
    ? [0, 1, 2, 3, 4, 5]   // con genitore
    : [0, 2, 3, 4, 5];      // senza genitore (salta step 1)
  const currentRealStep = stepOrder[step] ?? step;

  const avanti = () => {
    // Se siamo sullo step firma (real step 4), salva prima di navigare
    if (stepOrder[step] === 4 && sigRef.current && !sigRef.current.isEmpty()) {
      set('firma_allievo', sigRef.current.toDataURL('image/png'));
    }
    setStep(s => Math.min(s + 1, stepOrder.length - 1));
  };
  const indietro = () => setStep(s => Math.max(s - 1, 0));

  const svuotaFirma = () => { sigRef.current?.clear(); set('firma_allievo', null); };

  // Legge la firma direttamente dal canvas (evita race condition con setState)
  const getFirma = useCallback(() => {
    if (form.firma_allievo) return form.firma_allievo;
    if (!sigRef.current || sigRef.current.isEmpty()) return null;
    return sigRef.current.toDataURL('image/png');
  }, [form.firma_allievo]);

  const handleSubmit = async () => {
    const firma = getFirma();
    if (!firma) {
      setErrore('Apponi la firma prima di inviare.');
      return;
    }
    setLoading(true);
    setErrore('');
    try {
      const payload = { ...form, firma_allievo: firma };
      const res = await fetch(`${API_BASE}/api/iscrizione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      setSuccesso(true);
    } catch (e) {
      setErrore(e.message || "Errore nell'invio. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (successo) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Domanda inviata!</h1>
        <p className="text-sm text-gray-500">
          La tua domanda di iscrizione è stata inviata alla direzione. Riceverai una conferma via email non appena verrà accettata.
        </p>
        <a href="/login" className="mt-6 block w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">
          Torna al login
        </a>
      </div>
    </div>
  );

  // ── STEP 0 — Dati allievo ─────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome" value={form.nome} onChange={v => set('nome', v)} required />
        <Campo label="Cognome" value={form.cognome} onChange={v => set('cognome', v)} required />
      </div>
      <Campo label="Codice Fiscale" value={form.codice_fiscale}
        onChange={v => set('codice_fiscale', v.toUpperCase())} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data di nascita" type="date" value={form.data_nascita}
          onChange={v => set('data_nascita', v)} />
        <Campo label="Luogo di nascita" value={form.luogo_nascita}
          onChange={v => set('luogo_nascita', v)} />
      </div>
      <Campo label="Indirizzo" value={form.indirizzo} onChange={v => set('indirizzo', v)} />
      <div className="grid grid-cols-3 gap-3">
        <Campo label="CAP" value={form.cap} onChange={v => set('cap', v)} className="col-span-1" />
        <Campo label="Città" value={form.citta} onChange={v => set('citta', v)} className="col-span-1" />
        <Campo label="Prov." value={form.provincia} onChange={v => set('provincia', v)} className="col-span-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Telefono" type="tel" value={form.telefono} onChange={v => set('telefono', v)} />
        <Campo label="Email" type="email" value={form.email} onChange={v => set('email', v)} />
      </div>
      <Select label="Strumento richiesto" value={form.strumento}
        onChange={v => set('strumento', v)} options={STRUMENTI} required />
      <div>
        <label className="block text-xs text-gray-500 mb-1">Note</label>
        <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 resize-none" />
      </div>
      {/* Flag minore */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 mt-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => set('minore', !form.minore)}
            className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ${form.minore ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.minore ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Minore di 18 anni</p>
            <p className="text-xs text-gray-500">Richiede dati del genitore/tutore</p>
          </div>
        </label>
      </div>
    </div>
  );

  // ── STEP 1 — Dati genitore ────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-2">Dati del genitore o tutore legale del minore.</p>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome" value={form.genitore_nome} onChange={v => set('genitore_nome', v)} required />
        <Campo label="Cognome" value={form.genitore_cognome} onChange={v => set('genitore_cognome', v)} required />
      </div>
      <Campo label="Codice Fiscale" value={form.genitore_cf}
        onChange={v => set('genitore_cf', v.toUpperCase())} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data di nascita" type="date" value={form.genitore_data_nascita}
          onChange={v => set('genitore_data_nascita', v)} />
        <Campo label="Luogo di nascita" value={form.genitore_luogo_nascita}
          onChange={v => set('genitore_luogo_nascita', v)} />
      </div>
      <Campo label="Indirizzo di residenza" value={form.genitore_indirizzo}
        onChange={v => set('genitore_indirizzo', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Telefono" type="tel" value={form.genitore_telefono}
          onChange={v => set('genitore_telefono', v)} required />
        <Campo label="Email" type="email" value={form.genitore_email}
          onChange={v => set('genitore_email', v)} required />
      </div>
    </div>
  );

  // ── STEP 2 — Consensi ─────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-1">
      <p className="text-sm text-gray-500 mb-4">Leggi e accetta i documenti seguenti per procedere.</p>

      <FlagConLink checked={form.acc_tesseramento}
        onChange={v => set('acc_tesseramento', v)}
        label="Sottoscrivo la"
        linkLabel="domanda di tesseramento"
        onLeggi={() => setModal('tesseramento')} />

      <FlagConLink checked={form.acc_regolamento}
        onChange={v => set('acc_regolamento', v)}
        label="Ho letto e accetto il"
        linkLabel="regolamento interno"
        onLeggi={() => setModal('regolamento')} />

      <FlagConLink checked={form.acc_privacy}
        onChange={v => set('acc_privacy', v)}
        label="Accetto il trattamento dei dati personali (obbligatorio) —"
        linkLabel="leggi l'informativa"
        onLeggi={() => setModal('privacy')} />

      <FlagConLink checked={form.acc_immagini}
        onChange={v => set('acc_immagini', v)}
        label="Acconsento all'uso delle immagini (facoltativo) —"
        linkLabel="leggi le finalità"
        onLeggi={() => setModal('immagini')} />

      {!form.acc_privacy && (
        <p className="text-xs text-red-500 mt-2">Il consenso al trattamento dei dati personali è obbligatorio.</p>
      )}
    </div>
  );

  // ── STEP 3 — Documenti ────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Carica le foto del documento di identità (fronte e retro).</p>
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700 uppercase">Documento allievo</p>
        <div className="grid grid-cols-2 gap-3">
          <UploadFoto label="Fronte" value={form.doc_allievo_fronte}
            onChange={v => set('doc_allievo_fronte', v)} />
          <UploadFoto label="Retro" value={form.doc_allievo_retro}
            onChange={v => set('doc_allievo_retro', v)} />
        </div>
      </div>
      {form.minore && (
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 uppercase">Documento genitore/tutore</p>
          <div className="grid grid-cols-2 gap-3">
            <UploadFoto label="Fronte" value={form.doc_genitore_fronte}
              onChange={v => set('doc_genitore_fronte', v)} />
            <UploadFoto label="Retro" value={form.doc_genitore_retro}
              onChange={v => set('doc_genitore_retro', v)} />
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 text-center">
        I documenti vengono trasmessi in modo sicuro e conservati secondo la normativa GDPR.
      </p>
    </div>
  );

  // ── STEP 4 — Firma ────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {form.minore
          ? 'Firma del genitore/tutore che sottoscrive la domanda di iscrizione.'
          : 'Firma dell\'allievo che sottoscrive la domanda di iscrizione.'}
      </p>
      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Pen size={16} />
            <span className="text-xs font-medium">Firma qui</span>
          </div>
          <button type="button" onClick={svuotaFirma}
            className="text-xs text-red-500 font-medium">Cancella</button>
        </div>
        <div className="touch-none">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1e3a5f"
            canvasProps={{ className: 'w-full', style: { height: '180px', touchAction: 'none' } }}
          />
        </div>
      </div>
      {form.firma_allievo && (
        <div className="text-center">
          <p className="text-xs text-emerald-600 font-medium">✓ Firma acquisita</p>
        </div>
      )}
    </div>
  );

  // ── STEP 5 — Riepilogo e invio ────────────────────────────────────────
  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Controlla i dati inseriti. Premendo "Invia domanda" la tua richiesta verrà inviata alla direzione.
      </p>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Nome</span><span className="font-medium">{form.nome} {form.cognome}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Strumento</span><span className="font-medium">{form.strumento || '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{form.email || '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Telefono</span><span className="font-medium">{form.telefono || '—'}</span></div>
        {form.minore && <div className="flex justify-between"><span className="text-gray-500">Genitore</span><span className="font-medium">{form.genitore_nome} {form.genitore_cognome}</span></div>}
        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-gray-500 mb-1">Consensi</p>
          <p className="text-xs">{form.acc_tesseramento ? '✓' : '✗'} Tesseramento</p>
          <p className="text-xs">{form.acc_regolamento ? '✓' : '✗'} Regolamento</p>
          <p className="text-xs">{form.acc_privacy ? '✓' : '✗'} Privacy (obbligatorio)</p>
          <p className="text-xs">{form.acc_immagini ? '✓' : '✗'} Uso immagini (facoltativo)</p>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between">
          <span className="text-gray-500 text-xs">Documenti caricati</span>
          <span className="text-xs">{[form.doc_allievo_fronte, form.doc_allievo_retro].filter(Boolean).length}/2 allievo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-xs">Firma</span>
          <span className="text-xs">{form.firma_allievo ? '✓ Acquisita' : '✗ Mancante'}</span>
        </div>
      </div>
      {errore && <p className="text-sm text-red-500 text-center">{errore}</p>}
    </div>
  );

  const renderCurrentStep = () => {
    const real = stepOrder[step];
    if (real === 0) return renderStep0();
    if (real === 1) return renderStep1();
    if (real === 2) return renderStep2();
    if (real === 3) return renderStep3();
    if (real === 4) return renderStep4();
    if (real === 5) return renderStep5();
  };

  const isUltimoStep = step === stepOrder.length - 1;
  const isPrimoStep  = step === 0;

  const titoli = ['Dati allievo', 'Dati genitore/tutore', 'Consensi', 'Documenti', 'Firma', 'Riepilogo'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Domanda di iscrizione</h1>
          <p className="text-xs text-gray-500">AMA Music Academy</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <StepBar step={step} minore={form.minore} />

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-indigo-500" />
            <h2 className="text-base font-bold text-gray-900">{titoli[stepOrder[step]]}</h2>
          </div>
          {renderCurrentStep()}
        </div>

        {/* Navigazione */}
        <div className={`flex gap-3 ${isPrimoStep ? 'justify-end' : 'justify-between'}`}>
          {!isPrimoStep && (
            <button onClick={indietro}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 bg-white active:bg-gray-50">
              <ChevronLeft size={16} /> Indietro
            </button>
          )}
          {isUltimoStep ? (
            <button onClick={handleSubmit}
              disabled={loading || !form.acc_privacy}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check size={16} /> Invia domanda</>}
            </button>
          ) : (
            <button onClick={avanti}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold active:bg-indigo-700">
              Avanti <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modali testi */}
      {modal === 'tesseramento' && <ModalTesto titolo="Domanda di tesseramento" testo={TESTO_TESSERAMENTO} onClose={() => setModal(null)} />}
      {modal === 'regolamento'  && <ModalTesto titolo="Regolamento interno" testo={TESTO_REGOLAMENTO} onClose={() => setModal(null)} />}
      {modal === 'privacy'      && <ModalTesto titolo="Informativa privacy" testo={TESTO_PRIVACY} onClose={() => setModal(null)} />}
      {modal === 'immagini'     && <ModalTesto titolo="Uso delle immagini" testo={TESTO_IMMAGINI} onClose={() => setModal(null)} />}
    </div>
  );
}

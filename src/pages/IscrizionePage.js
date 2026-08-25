import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Check, ChevronRight, ChevronLeft, X, Upload, FileText, Shield, Camera, Pen, CreditCard, AlertCircle } from 'lucide-react';
import { API_BASE } from '../utils/api';

const MATERIE = [
  { nome: 'Canto 45min',           prezzo: 80 },
  { nome: 'Canto 1h',              prezzo: 100 },
  { nome: 'Pianoforte 45min',      prezzo: 80 },
  { nome: 'Pianoforte 1h',         prezzo: 100 },
  { nome: 'Violino 45min',         prezzo: 80 },
  { nome: 'Violino 1h',            prezzo: 100 },
  { nome: 'Chitarra 45min',        prezzo: 80 },
  { nome: 'Chitarra 1h',           prezzo: 100 },
  { nome: 'Batteria 45min',        prezzo: 80 },
  { nome: 'Batteria 1h',           prezzo: 100 },
  { nome: 'Coro',                  prezzo: 40 },
  { nome: 'Coro Teen',             prezzo: 30 },
  { nome: 'Band',    prezzo: 30, richiede_strumento: true },
  { nome: 'Trinity', prezzo: 10, richiede_strumento: true },
];

// Materie che fanno da "strumento base" (tutto tranne Coro, Coro Teen, Band, Trinity)
const MATERIE_BASE = MATERIE
  .filter(m => !m.richiede_strumento && m.nome !== 'Coro' && m.nome !== 'Coro Teen')
  .map(m => m.nome);

const TESTO_TESSERAMENTO = `DOMANDA DI TESSERAMENTO

Il/La sottoscritto/a chiede di essere ammesso/a come socio dell'Associazione AMA Music Academy,
impegnandosi a rispettare lo Statuto e il Regolamento interno dell'Associazione.

Dichiara di essere a conoscenza delle finalità e degli scopi dell'Associazione e di condividerli.

La quota associativa annuale verrà comunicata dalla segreteria al momento dell'iscrizione.

Il tesseramento ha validità per l'anno accademico in corso e deve essere rinnovato annualmente.`;

const TESTO_REGOLAMENTO = `REGOLAMENTO ACCADEMIA — AMA Academy of Musical Arts
Viale Felissent, 14 — Treviso (TV) · amamusicacademy.it

ISCRIZIONE E TESSERAMENTO
L'iscrizione al corso prescelto deve essere effettuata a seguito del tesseramento all'associazione stessa, tramite versamento della quota associativa di 50 euro.

CORSI ORDINARI
Il percorso di studi si articola in 36 lezioni da settembre a maggio. La durata è di 45 o 60 minuti per i corsi individuali (€ 80 o € 100 mensili) e 60 minuti per i corsi di gruppo (€ 30 mensili). Prove, saggi, concerti e spettacoli ai quali l'allievo è convocato sono considerati attività didattiche a tutti gli effetti e conteggiati tra le 36 lezioni previste.

MODALITÀ DI PAGAMENTO
Il costo annuale viene suddiviso in 9 quote mensili di pari importo, da versare entro la prima lezione di ciascun mese. La quota mensile non corrisponde al numero effettivo di lezioni del singolo mese, ma rappresenta una rata del costo annuale complessivo. La programmazione prevede una media di 4 lezioni al mese: alcuni mesi potranno averne 3, altri 4 o 5, senza variazioni dell'importo. La quota deve essere corrisposta integralmente, indipendentemente dalla presenza dell'allievo. In caso di mancato pagamento nei termini, il tesseramento decade e le lezioni vengono sospese, senza diritto a rimborso.

ORARI
Gli orari vengono concordati tra allievo e insegnante secondo le disponibilità. Si chiede la massima puntualità.

SPETTACOLO FINALE DI GIUGNO (Loggia dei Cavalieri)
La partecipazione è riservata agli allievi che abbiano frequentato con assiduità e siano ritenuti pronti dal docente. Per ciascun allievo: quota di partecipazione € 50,00 (prova generale + spettacolo) + € 10,00 maglietta ufficiale. Totale: € 60,00, da versare entro il 15 maggio. Le quote versate non sono rimborsabili in caso di rinuncia, salvo annullamento da parte dell'Accademia.

ASSENZE E RECUPERI
Massimo 3 recuperi per anno accademico per le lezioni individuali, riconosciuti solo se l'assenza è comunicata con almeno 24 ore di preavviso. Assenze senza preavviso sufficiente: lezione persa senza recupero né rimborso. I recuperi devono essere effettuati entro il 31 maggio, in data stabilita dal docente. Le lezioni di gruppo non sono recuperabili.

RITIRO
Comunicazioni di ritiro entro 30 giorni: le quote successive ai 30 giorni non saranno dovute. Con il ritiro decade il tesseramento annuale, senza rimborso dell'iscrizione.

PERCORSO TRINITY
Gli allievi interessati devono comunicarlo alla Segreteria all'inizio dell'anno. Il percorso comprende la lezione individuale + incontro mensile di solfeggio di gruppo (€ 10,00 ciascuno) + materiale didattico Trinity. Al costo d'esame si aggiunge un contributo di € 20,00 per spese di Segreteria.

CREDITI FORMATIVI
L'Accademia rilascia idonea documentazione per i crediti scolastici su richiesta specifica.`;

const TESTO_PRIVACY = `INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI
Ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (GDPR)
AMA Academy of Musical Arts — Viale Felissent 14, 31100 Treviso (TV) · amamusicacademy.it

1. TITOLARE DEL TRATTAMENTO
AMA – Academy of Musical Arts, con sede in Viale Felissent 14, 31100 Treviso (TV), contattabile all'indirizzo email indicato sul sito amamusicacademy.it.

2. FINALITÀ DEL TRATTAMENTO
I dati personali forniti in sede di iscrizione sono trattati per: gestione amministrativa dell'iscrizione e della frequenza ai corsi; organizzazione delle attività didattiche, sessioni d'esame e saggi; comunicazioni relative ai servizi dell'accademia; adempimenti contabili e fiscali previsti dalla legge.

3. BASE GIURIDICA
Il trattamento si basa sull'esecuzione del contratto di iscrizione ai corsi e sull'adempimento di obblighi di legge. Il trattamento delle immagini per finalità promozionali si basa sul consenso specifico, facoltativo e revocabile in ogni momento.

4. MODALITÀ E CONSERVAZIONE
I dati sono trattati con strumenti cartacei e informatici, con misure di sicurezza adeguate a prevenirne la perdita, l'uso illecito o l'accesso non autorizzato, e sono conservati per il tempo necessario alle finalità indicate e nel rispetto dei termini di legge.

5. COMUNICAZIONE A TERZI
I dati non sono diffusi. Possono essere comunicati a soggetti terzi solo per adempimenti amministrativi, contabili o assicurativi strettamente connessi all'attività didattica (es. Trinity College London per le certificazioni d'esame).

6. DIRITTI DELL'INTERESSATO
L'interessato può in qualsiasi momento esercitare i diritti di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione al trattamento, oltre al diritto di revocare il consenso prestato, scrivendo al Titolare ai recapiti indicati in intestazione.`;

const TESTO_IMMAGINI = `CONSENSO ALL'USO DELLE IMMAGINI

AMA Music Academy potrebbe realizzare fotografie e video durante le attività didattiche, i saggi e gli eventi organizzati dall'Associazione.

Le immagini potrebbero essere utilizzate per:
• Documentazione delle attività dell'accademia
• Pubblicazione sul sito web e sui canali social dell'accademia
• Materiale promozionale e informativo dell'associazione

Il consenso è facoltativo e può essere revocato in qualsiasi momento inviando una comunicazione a info@amamusicacademy.it.

In caso di mancato consenso, non verranno utilizzate immagini che consentano l'identificazione del soggetto.`;

// ── Componenti UI ─────────────────────────────────────────────────────────
function Campo({ label, value, onChange, type = 'text', required = false, disabled = false, className = '', error = false }) {
  return (
    <div className={className}>
      <label className="block text-xs text-n-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        required={required} disabled={disabled}
        className={`w-full text-sm border rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white transition-colors
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-n-100 focus:border-ama-300 focus:ring-ama-100'}`} />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false, error = false }) {
  return (
    <div>
      <label className="block text-xs text-n-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className={`w-full text-sm border rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white transition-colors
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-n-100 focus:border-ama-300'}`}>
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
          <h2 className="font-semibold text-n-900 text-sm">{titolo}</h2>
          <button onClick={onClose}><X size={20} className="text-n-300" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{testo}</pre>
        </div>
        <div className="px-5 pb-5 pt-3 border-t shrink-0">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-ama-500 text-white font-semibold text-sm">
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
          checked ? 'bg-ama-500 border-ama-500' : 'border-n-300 bg-white'}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-gray-700 flex-1">
        {label}{' '}
        <button type="button" onClick={(e) => { e.preventDefault(); onLeggi(); }}
          className="text-ama-500 underline font-medium">{linkLabel}</button>
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
      <p className="text-xs text-n-600 mb-1">{label}</p>
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
          className="w-full h-28 border-2 border-dashed border-n-300 rounded-xl flex flex-col items-center justify-center gap-2 text-n-300 active:bg-n-50">
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
              ${i < stepIdx ? 'bg-ama-500 text-white' : i === stepIdx ? 'bg-ama-500 text-white ring-2 ring-ama-100' : 'bg-gray-200 text-n-300'}`}>
              {i < stepIdx ? <Check size={14} /> : i + 1}
            </div>
            <span className="text-[9px] text-n-600 hidden sm:block">{s}</span>
          </div>
          {i < stepsVis.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < stepIdx ? 'bg-ama-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────
export default function IscrizionePage() {
  const [step, setStep]       = useState(0); // 0=dati, 1=genitore (se minore), 2=consensi, 3=docs, 4=firma, 5=invio
  const [loading, setLoading] = useState(false);
  const [successo, setSuccesso] = useState(false);
  const [errore, setErrore]   = useState('');
  const [modal, setModal]     = useState(null); // quale modale è aperta
  const [showAvviso, setShowAvviso]     = useState(true);
  const [showMinoreAvviso, setShowMinoreAvviso] = useState(false);
  const [erroriStep, setErroriStep]     = useState({});

  const sigRef = useRef(null);

  const [form, setForm] = useState({
    // allievo
    nome: '', cognome: '', codice_fiscale: '', data_nascita: '', luogo_nascita: '',
    indirizzo: '', cap: '', citta: '', provincia: '', telefono: '', email: '',
    materie: [], note: '',
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

  const isMinorenne = (dataNascita) => {
    if (!dataNascita) return false;
    const nascita = new Date(dataNascita);
    const oggi = new Date();
    const eta = oggi.getFullYear() - nascita.getFullYear() -
      (oggi < new Date(oggi.getFullYear(), nascita.getMonth(), nascita.getDate()) ? 1 : 0);
    return eta < 18;
  };

  const avanti = () => {
    // Validazione step 0 — dati allievo
    if (stepOrder[step] === 0) {
      const obbligatori = {
        nome:           'Nome',
        cognome:        'Cognome',
        codice_fiscale: 'Codice Fiscale',
        data_nascita:   'Data di nascita',
        luogo_nascita:  'Luogo di nascita',
        indirizzo:      'Indirizzo',
        cap:            'CAP',
        citta:          'Città',
        provincia:      'Provincia',
        telefono:       'Telefono',
        email:          'Email',
      };
      const errori = {};
      for (const [k, label] of Object.entries(obbligatori)) {
        if (!form[k]?.toString().trim()) errori[k] = `${label} obbligatorio`;
      }
      if (!form.materie || form.materie.length === 0) errori.materie = 'Seleziona almeno una materia';
      setErroriStep(errori);
      if (Object.keys(errori).length > 0) return;

      // Controlla se è minorenne senza flag
      if (isMinorenne(form.data_nascita) && !form.minore) {
        setShowMinoreAvviso(true);
        return;
      }
    }

    // Validazione step 1 — dati genitore
    if (stepOrder[step] === 1) {
      const obbligatori = {
        genitore_nome:          'Nome genitore',
        genitore_cognome:       'Cognome genitore',
        genitore_cf:            'Codice Fiscale genitore',
        genitore_data_nascita:  'Data di nascita genitore',
        genitore_luogo_nascita: 'Luogo di nascita genitore',
        genitore_indirizzo:     'Indirizzo di residenza genitore',
        genitore_telefono:      'Telefono genitore',
        genitore_email:         'Email genitore',
      };
      const errori = {};
      for (const [k, label] of Object.entries(obbligatori)) {
        if (!form[k]?.toString().trim()) errori[k] = `${label} obbligatorio`;
      }
      setErroriStep(errori);
      if (Object.keys(errori).length > 0) return;
    }

    // Validazione step 2 — consensi obbligatori
    if (stepOrder[step] === 2) {
      if (!form.acc_tesseramento || !form.acc_regolamento || !form.acc_privacy) return;
    }

    // Validazione step 3 — foto documenti obbligatorie
    if (stepOrder[step] === 3) {
      const errori = {};
      if (!form.doc_allievo_fronte) errori.doc_allievo_fronte = true;
      if (!form.doc_allievo_retro)  errori.doc_allievo_retro  = true;
      if (form.minore) {
        if (!form.doc_genitore_fronte) errori.doc_genitore_fronte = true;
        if (!form.doc_genitore_retro)  errori.doc_genitore_retro  = true;
      }
      setErroriStep(errori);
      if (Object.keys(errori).length > 0) return;
    }

    // Validazione step 4 — firma obbligatoria
    if (stepOrder[step] === 4) {
      const firma = sigRef.current && !sigRef.current.isEmpty()
        ? sigRef.current.toDataURL('image/png')
        : form.firma_allievo;
      if (!firma) {
        setErroriStep({ firma_allievo: true });
        return;
      }
      set('firma_allievo', firma);
    }

    setErroriStep({});
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
    <div className="min-h-screen bg-n-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-n-900 mb-2">Domanda inviata!</h1>
        <p className="text-sm text-n-600">
          La tua domanda di iscrizione è stata inviata alla direzione. Riceverai una conferma via email non appena verrà accettata.
        </p>
        <a href="/login" className="mt-6 block w-full py-3 rounded-xl bg-ama-500 text-white font-bold text-sm">
          Torna al login
        </a>
      </div>
    </div>
  );

  const e = erroriStep; // alias corto

  // ── STEP 0 — Dati allievo ─────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-3">
      {Object.keys(e).length > 0 && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Compila tutti i campi obbligatori prima di procedere.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome" value={form.nome} onChange={v => set('nome', v)} required error={!!e.nome} />
        <Campo label="Cognome" value={form.cognome} onChange={v => set('cognome', v)} required error={!!e.cognome} />
      </div>
      <Campo label="Codice Fiscale" value={form.codice_fiscale}
        onChange={v => set('codice_fiscale', v.toUpperCase())} required error={!!e.codice_fiscale} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data di nascita" type="date" value={form.data_nascita}
          onChange={v => set('data_nascita', v)} required error={!!e.data_nascita} />
        <Campo label="Luogo di nascita" value={form.luogo_nascita}
          onChange={v => set('luogo_nascita', v)} required error={!!e.luogo_nascita} />
      </div>
      <Campo label="Indirizzo" value={form.indirizzo} onChange={v => set('indirizzo', v)} required error={!!e.indirizzo} />
      <div className="grid grid-cols-3 gap-3">
        <Campo label="CAP" value={form.cap} onChange={v => set('cap', v)} className="col-span-1" required error={!!e.cap} />
        <Campo label="Città" value={form.citta} onChange={v => set('citta', v)} className="col-span-1" required error={!!e.citta} />
        <Campo label="Prov." value={form.provincia} onChange={v => set('provincia', v)} className="col-span-1" required error={!!e.provincia} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Telefono" type="tel" value={form.telefono} onChange={v => set('telefono', v)} required error={!!e.telefono} />
        <Campo label="Email" type="email" value={form.email} onChange={v => set('email', v)} required error={!!e.email} />
      </div>
      {/* Selezione materie */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-n-600">
            Materie richieste<span className="text-red-500 ml-0.5">*</span>
          </label>
          {form.materie.length > 0 && (
            <span className="text-xs font-bold text-ama-500">
              Totale: €{form.materie.reduce((sum, nome) => {
                const m = MATERIE.find(x => x.nome === nome);
                return sum + (m ? m.prezzo : 0);
              }, 0)}/mese
            </span>
          )}
        </div>
        {e.materie && (
          <p className="text-xs text-red-500 mb-2">Seleziona almeno una materia.</p>
        )}
        <div className={`border rounded-xl overflow-hidden divide-y ${e.materie ? 'border-red-400' : 'border-n-100'}`}>
          {MATERIE.map(({ nome, prezzo, richiede_strumento }) => {
            const sel = form.materie.includes(nome);
            const haBase = form.materie.some(m => MATERIE_BASE.includes(m));
            const bloccata = richiede_strumento && !haBase && !sel;

            const toggle = () => {
              if (bloccata) return;
              if (sel) {
                // Se sto deselezionando uno strumento base, rimuovi anche le dipendenti
                let nuove = form.materie.filter(m => m !== nome);
                const haBaseRimasta = nuove.some(m => MATERIE_BASE.includes(m));
                if (!haBaseRimasta) {
                  nuove = nuove.filter(m => !MATERIE.find(x => x.nome === m && x.richiede_strumento));
                }
                set('materie', nuove);
              } else {
                set('materie', [...form.materie, nome]);
              }
            };

            return (
              <button type="button" key={nome} onClick={toggle}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors
                  ${bloccata ? 'opacity-40 cursor-not-allowed bg-white' : sel ? 'bg-ama-50' : 'bg-white active:bg-n-50'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-colors
                    ${sel ? 'bg-ama-500 border-ama-500' : 'border-n-300 bg-white'}`}>
                    {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm ${sel ? 'font-semibold text-ama-700' : bloccata ? 'text-n-300' : 'text-n-900'}`}>{nome}</span>
                    {bloccata && (
                      <span className="text-[10px] text-n-300 leading-none">Richiede uno strumento o canto</span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium shrink-0 ${sel ? 'text-ama-500' : 'text-n-600'}`}>€{prezzo}/mese</span>
              </button>
            );
          })}
        </div>
        {form.materie.length > 0 && (
          <div className="mt-2 bg-ama-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-ama-700 font-medium">
              {form.materie.length} {form.materie.length === 1 ? 'materia selezionata' : 'materie selezionate'}
            </span>
            <span className="text-sm font-bold text-ama-600">
              €{form.materie.reduce((sum, nome) => {
                const m = MATERIE.find(x => x.nome === nome);
                return sum + (m ? m.prezzo : 0);
              }, 0)}/mese
            </span>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs text-n-600 mb-1">Note</label>
        <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
          className="w-full text-sm border border-n-100 rounded-xl px-3 py-2.5 outline-none focus:border-ama-300 resize-none" />
      </div>
      {/* Flag minore */}
      <div className="bg-n-50 rounded-xl px-4 py-3 mt-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => set('minore', !form.minore)}
            className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ${form.minore ? 'bg-ama-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.minore ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-n-900">Minore di 18 anni</p>
            <p className="text-xs text-n-600">Richiede dati del genitore/tutore</p>
          </div>
        </label>
      </div>
    </div>
  );

  // ── STEP 1 — Dati genitore ────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-3">
      <p className="text-sm text-n-600 mb-2">Dati del genitore o tutore legale del minore.</p>
      {Object.keys(e).length > 0 && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Compila tutti i campi obbligatori prima di procedere.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome" value={form.genitore_nome} onChange={v => set('genitore_nome', v)} required error={!!e.genitore_nome} />
        <Campo label="Cognome" value={form.genitore_cognome} onChange={v => set('genitore_cognome', v)} required error={!!e.genitore_cognome} />
      </div>
      <Campo label="Codice Fiscale" value={form.genitore_cf}
        onChange={v => set('genitore_cf', v.toUpperCase())} required error={!!e.genitore_cf} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data di nascita" type="date" value={form.genitore_data_nascita}
          onChange={v => set('genitore_data_nascita', v)} required error={!!e.genitore_data_nascita} />
        <Campo label="Luogo di nascita" value={form.genitore_luogo_nascita}
          onChange={v => set('genitore_luogo_nascita', v)} required error={!!e.genitore_luogo_nascita} />
      </div>
      <Campo label="Indirizzo di residenza" value={form.genitore_indirizzo}
        onChange={v => set('genitore_indirizzo', v)} required error={!!e.genitore_indirizzo} />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Telefono" type="tel" value={form.genitore_telefono}
          onChange={v => set('genitore_telefono', v)} required error={!!e.genitore_telefono} />
        <Campo label="Email" type="email" value={form.genitore_email}
          onChange={v => set('genitore_email', v)} required error={!!e.genitore_email} />
      </div>
    </div>
  );

  // ── STEP 2 — Consensi ─────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-1">
      <p className="text-sm text-n-600 mb-4">Leggi e accetta i documenti seguenti per procedere.</p>

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

      {(!form.acc_tesseramento || !form.acc_regolamento || !form.acc_privacy) && (
        <p className="text-xs text-red-500 mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          I primi tre consensi sono obbligatori per procedere.
        </p>
      )}
    </div>
  );

  // ── STEP 3 — Documenti ────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-n-600">Carica le foto del documento di identità (fronte e retro).</p>
      {(e.doc_allievo_fronte || e.doc_allievo_retro || e.doc_genitore_fronte || e.doc_genitore_retro) && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Carica tutte le foto dei documenti richiesti prima di procedere.
        </p>
      )}
      <div className={`bg-white border-2 rounded-2xl p-4 space-y-3 ${(e.doc_allievo_fronte || e.doc_allievo_retro) ? 'border-red-400' : 'border-transparent'}`}>
        <p className="text-xs font-semibold text-gray-700 uppercase">Documento allievo</p>
        <div className="grid grid-cols-2 gap-3">
          <UploadFoto label="Fronte *" value={form.doc_allievo_fronte}
            onChange={v => set('doc_allievo_fronte', v)} />
          <UploadFoto label="Retro *" value={form.doc_allievo_retro}
            onChange={v => set('doc_allievo_retro', v)} />
        </div>
      </div>
      {form.minore && (
        <div className={`bg-white border-2 rounded-2xl p-4 space-y-3 ${(e.doc_genitore_fronte || e.doc_genitore_retro) ? 'border-red-400' : 'border-transparent'}`}>
          <p className="text-xs font-semibold text-gray-700 uppercase">Documento genitore/tutore</p>
          <div className="grid grid-cols-2 gap-3">
            <UploadFoto label="Fronte *" value={form.doc_genitore_fronte}
              onChange={v => set('doc_genitore_fronte', v)} />
            <UploadFoto label="Retro *" value={form.doc_genitore_retro}
              onChange={v => set('doc_genitore_retro', v)} />
          </div>
        </div>
      )}
      <p className="text-xs text-n-300 text-center">
        I documenti vengono trasmessi in modo sicuro e conservati secondo la normativa GDPR.
      </p>
    </div>
  );

  // ── STEP 4 — Firma ────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-n-600">
        {form.minore
          ? 'Firma del genitore/tutore che sottoscrive la domanda di iscrizione.'
          : 'Firma dell\'allievo che sottoscrive la domanda di iscrizione.'}
      </p>
      <div className="bg-white border-2 border-n-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-n-50">
          <div className="flex items-center gap-2 text-n-600">
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
      {e.firma_allievo && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Apponi la firma prima di procedere.
        </p>
      )}
      {form.firma_allievo && !e.firma_allievo && (
        <div className="text-center">
          <p className="text-xs text-emerald-600 font-medium">✓ Firma acquisita</p>
        </div>
      )}
    </div>
  );

  // ── STEP 5 — Riepilogo e invio ────────────────────────────────────────
  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-sm text-n-600">
        Controlla i dati inseriti. Premendo "Invia domanda" la tua richiesta verrà inviata alla direzione.
      </p>
      <div className="bg-n-50 rounded-2xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-n-600">Nome</span><span className="font-medium">{form.nome} {form.cognome}</span></div>
        <div className="flex flex-col gap-0.5">
          <span className="text-n-600">Materie</span>
          {form.materie.length === 0
            ? <span className="font-medium">—</span>
            : form.materie.map(m => <span key={m} className="text-xs font-medium">• {m}</span>)
          }
        </div>
        {form.materie.length > 0 && (
          <div className="flex justify-between font-semibold text-ama-600">
            <span>Quota mensile</span>
            <span>€{form.materie.reduce((sum, nome) => {
              const mat = MATERIE.find(x => x.nome === nome);
              return sum + (mat ? mat.prezzo : 0);
            }, 0)}/mese</span>
          </div>
        )}
        <div className="flex justify-between"><span className="text-n-600">Email</span><span className="font-medium">{form.email || '—'}</span></div>
        <div className="flex justify-between"><span className="text-n-600">Telefono</span><span className="font-medium">{form.telefono || '—'}</span></div>
        {form.minore && <div className="flex justify-between"><span className="text-n-600">Genitore</span><span className="font-medium">{form.genitore_nome} {form.genitore_cognome}</span></div>}
        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-n-600 mb-1">Consensi</p>
          <p className="text-xs">{form.acc_tesseramento ? '✓' : '✗'} Tesseramento</p>
          <p className="text-xs">{form.acc_regolamento ? '✓' : '✗'} Regolamento</p>
          <p className="text-xs">{form.acc_privacy ? '✓' : '✗'} Privacy (obbligatorio)</p>
          <p className="text-xs">{form.acc_immagini ? '✓' : '✗'} Uso immagini (facoltativo)</p>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between">
          <span className="text-n-600 text-xs">Documenti caricati</span>
          <span className="text-xs">{[form.doc_allievo_fronte, form.doc_allievo_retro].filter(Boolean).length}/2 allievo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-n-600 text-xs">Firma</span>
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
    <div className="min-h-screen bg-n-50">

      {/* Popup minore senza flag */}
      {showMinoreAvviso && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-amber-500 px-5 py-4 flex items-center gap-3">
              <AlertCircle size={22} className="text-white shrink-0" />
              <h2 className="text-white font-bold text-base">Allievo minorenne?</h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-gray-700 mb-4">
                La data di nascita inserita indica che l'allievo è <strong>minore di 18 anni</strong>.
              </p>
              <p className="text-sm text-gray-700 mb-5">
                Per iscrivere un minore è necessario attivare il flag <strong>"Minore di 18 anni"</strong> e inserire i dati del genitore o tutore legale.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => { set('minore', true); setShowMinoreAvviso(false); }}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm active:bg-amber-600">
                  Attiva flag minore e continua
                </button>
                <button
                  onClick={() => setShowMinoreAvviso(false)}
                  className="w-full py-3 bg-n-100 text-gray-700 rounded-xl font-medium text-sm active:bg-n-100">
                  La data è corretta, non è minorenne
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup avviso documenti */}
      {showAvviso && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-ama-500 px-5 py-4 flex items-center gap-3">
              <AlertCircle size={22} className="text-white shrink-0" />
              <h2 className="text-white font-bold text-base">Prima di iniziare</h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-gray-700 mb-4">
                Per completare la domanda di iscrizione avrai bisogno di:
              </p>
              <ul className="space-y-3 mb-5">
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-ama-100 rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard size={18} className="text-ama-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-n-900">Carta d'identità</p>
                    <p className="text-xs text-n-600">dell'allievo (e del genitore se minorenne)</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-ama-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-ama-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-n-900">Codice fiscale</p>
                    <p className="text-xs text-n-600">dell'allievo (e del genitore se minorenne)</p>
                  </div>
                </li>
              </ul>
              <p className="text-xs text-n-300 mb-5">
                Sarà richiesto di fotografare o caricare i documenti e apporre la firma digitale.
              </p>
              <button
                onClick={() => setShowAvviso(false)}
                className="w-full py-3 bg-ama-500 text-white rounded-xl font-semibold text-sm active:bg-ama-700">
                Ho i documenti, procedi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-ama-500 rounded-lg flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-n-900">Domanda di iscrizione</h1>
          <p className="text-xs text-n-600">AMA Music Academy</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <StepBar step={step} minore={form.minore} />

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-ama-500" />
            <h2 className="text-base font-bold text-n-900">{titoli[stepOrder[step]]}</h2>
          </div>
          {renderCurrentStep()}
        </div>

        {/* Navigazione */}
        <div className={`flex gap-3 ${isPrimoStep ? 'justify-end' : 'justify-between'}`}>
          {!isPrimoStep && (
            <button onClick={indietro}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-n-300 text-sm font-medium text-gray-700 bg-white active:bg-n-50">
              <ChevronLeft size={16} /> Indietro
            </button>
          )}
          {isUltimoStep ? (
            <button onClick={handleSubmit}
              disabled={loading || !form.acc_tesseramento || !form.acc_regolamento || !form.acc_privacy}
              className="flex-1 py-3 rounded-xl bg-ama-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check size={16} /> Invia domanda</>}
            </button>
          ) : (
            <button onClick={avanti}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-ama-500 text-white text-sm font-bold active:bg-ama-700">
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

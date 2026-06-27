import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Users, FileText, ShieldCheck, ChevronDown, ChevronUp, Check, X, LogOut } from 'lucide-react';
import AllievoLayout from '../../componenti/AllievoLayout';
import { apiFetch } from '../../utils/api';

const nomiMesi = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function fmtData(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return `${day} ${nomiMesi[parseInt(m)]} ${y}`;
}

const REGOLAMENTO = `REGOLAMENTO INTERNO — ACCADEMIA MUSICALE

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
I dati personali degli allievi saranno trattati nel rispetto del GDPR (Reg. UE 2016/679) e utilizzati esclusivamente per finalità didattiche e amministrative.

Art. 7 — Recesso
L'allievo può recedere dall'iscrizione in qualsiasi momento, con comunicazione scritta alla segreteria. Non è previsto il rimborso delle quote già versate.`;

function ModalRegolamento({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Regolamento interno</h2>
          </div>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{REGOLAMENTO}</pre>
        </div>
        <div className="px-5 pb-5 pt-3 border-t shrink-0">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
            Ho letto il regolamento
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', disabled = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full text-sm border rounded-xl px-3 py-2.5 outline-none transition
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-transparent' :
            'bg-white text-gray-900 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
      />
    </div>
  );
}

function Sezione({ titolo, icona: Icon, children, collapsible = false }) {
  const [aperta, setAperta] = useState(true);
  return (
    <div className="bg-white border rounded-2xl overflow-hidden mb-4">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setAperta(v => !v)}>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">{titolo}</span>
        </div>
        {collapsible && (aperta ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}
      </div>
      {aperta && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function ProfiloAllievo() {
  const navigate  = useNavigate();
  const [dati, setDati]           = useState(null);
  const [form, setForm]           = useState({});
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [salvato, setSalvato]     = useState(false);
  const [errore, setErrore]       = useState('');
  const [showReg, setShowReg]     = useState(false);

  useEffect(() => {
    apiFetch('/api/allievo/me').then(d => {
      setDati(d);
      setForm({
        email:                  d.email || '',
        telefono:               d.telefono || '',
        indirizzo:              d.indirizzo || '',
        cap:                    d.cap || '',
        citta:                  d.citta || '',
        provincia:              d.provincia || '',
        codice_fiscale:         d.codice_fiscale || '',
        luogo_nascita:          d.luogo_nascita || '',
        data_nascita:           d.data_nascita ? String(d.data_nascita).slice(0,10) : '',
        minore:                 d.minore || false,
        genitore_nome:          d.genitore_nome || '',
        genitore_cognome:       d.genitore_cognome || '',
        genitore_cf:            d.genitore_cf || '',
        genitore_data_nascita:  d.genitore_data_nascita ? String(d.genitore_data_nascita).slice(0,10) : '',
        genitore_luogo_nascita: d.genitore_luogo_nascita || '',
        genitore_indirizzo:     d.genitore_indirizzo || '',
        genitore_telefono:      d.genitore_telefono || '',
        genitore_email:         d.genitore_email || '',
        accettazione_reg:       d.accettazione_reg || false,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const salva = async () => {
    setSalvando(true);
    setErrore('');
    try {
      await apiFetch('/api/allievo/profilo', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setSalvato(true);
      setTimeout(() => setSalvato(false), 2500);
    } catch {
      setErrore('Errore nel salvataggio. Riprova.');
    } finally {
      setSalvando(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return (
    <AllievoLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AllievoLayout>
  );

  return (
    <AllievoLayout>
      <div className="pt-6 pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
        <p className="text-sm text-gray-500">Aggiorna le tue informazioni personali</p>
      </div>

      {/* Dati anagrafici allievo */}
      <Sezione titolo="Dati personali" icona={User}>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nome"    value={dati?.nome}    onChange={() => {}} disabled />
          <Campo label="Cognome" value={dati?.cognome} onChange={() => {}} disabled />
        </div>
        <Campo label="Codice Fiscale" value={form.codice_fiscale}
          onChange={v => set('codice_fiscale', v.toUpperCase())} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data di nascita" value={form.data_nascita} type="date"
            onChange={v => set('data_nascita', v)} />
          <Campo label="Luogo di nascita" value={form.luogo_nascita}
            onChange={v => set('luogo_nascita', v)} />
        </div>
        <Campo label="Indirizzo di residenza" value={form.indirizzo}
          onChange={v => set('indirizzo', v)} />
        <div className="grid grid-cols-3 gap-3">
          <Campo label="CAP" value={form.cap} onChange={v => set('cap', v)} />
          <Campo label="Città" value={form.citta} onChange={v => set('citta', v)} />
          <Campo label="Prov." value={form.provincia} onChange={v => set('provincia', v.toUpperCase().slice(0,2))} />
        </div>
      </Sezione>

      {/* Contatti */}
      <Sezione titolo="Contatti" icona={Phone}>
        <Campo label="Telefono" value={form.telefono} type="tel"
          onChange={v => set('telefono', v)} />
        <Campo label="Email" value={form.email} type="email"
          onChange={v => set('email', v)} />
      </Sezione>

      {/* Flag minore */}
      <div className="bg-white border rounded-2xl px-4 py-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => set('minore', !form.minore)}
            className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 mt-0.5 ${form.minore ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.minore ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Minore di 18 anni</p>
            <p className="text-xs text-gray-500 mt-0.5">Attiva se l'allievo è minorenne — richiede i dati del genitore o tutore</p>
          </div>
        </label>
      </div>

      {/* Dati genitore (condizionale) */}
      {form.minore && (
        <Sezione titolo="Genitore / Tutore" icona={Users} collapsible>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nome" value={form.genitore_nome}
              onChange={v => set('genitore_nome', v)} />
            <Campo label="Cognome" value={form.genitore_cognome}
              onChange={v => set('genitore_cognome', v)} />
          </div>
          <Campo label="Codice Fiscale" value={form.genitore_cf}
            onChange={v => set('genitore_cf', v.toUpperCase())} />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Data di nascita" value={form.genitore_data_nascita} type="date"
              onChange={v => set('genitore_data_nascita', v)} />
            <Campo label="Luogo di nascita" value={form.genitore_luogo_nascita}
              onChange={v => set('genitore_luogo_nascita', v)} />
          </div>
          <Campo label="Indirizzo di residenza" value={form.genitore_indirizzo}
            onChange={v => set('genitore_indirizzo', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Telefono" value={form.genitore_telefono} type="tel"
              onChange={v => set('genitore_telefono', v)} />
            <Campo label="Email" value={form.genitore_email} type="email"
              onChange={v => set('genitore_email', v)} />
          </div>
        </Sezione>
      )}

      {/* Data iscrizione (sola lettura) */}
      <div className="bg-white border rounded-2xl px-4 py-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Iscrizione</span>
        </div>
        <p className="text-xs text-gray-400 mb-0.5">Data di iscrizione</p>
        <p className="text-sm font-medium text-gray-900">{fmtData(dati?.data_iscrizione)}</p>
      </div>

      {/* Regolamento */}
      <div className={`border rounded-2xl px-4 py-4 mb-6 ${form.accettazione_reg ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
        <div className="flex items-start gap-3">
          <div
            onClick={() => { if (!form.accettazione_reg) setShowReg(true); }}
            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 cursor-pointer border-2 transition-colors
              ${form.accettazione_reg ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}>
            {form.accettazione_reg && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {form.accettazione_reg ? 'Regolamento accettato ✓' : 'Accettazione regolamento'}
            </p>
            {form.accettazione_reg && dati?.data_accettazione_reg ? (
              <p className="text-xs text-emerald-700 mt-0.5">
                Accettato il {new Date(dati.data_accettazione_reg).toLocaleDateString('it-IT')}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Spunta per accettare il{' '}
                <button onClick={e => { e.stopPropagation(); setShowReg(true); }}
                  className="text-indigo-600 underline">regolamento interno</button>
                {' '}dell'accademia.
              </p>
            )}
          </div>
        </div>
        {!form.accettazione_reg && (
          <button onClick={() => setShowReg(true)}
            className="mt-3 w-full border border-indigo-200 rounded-xl py-2 text-xs font-medium text-indigo-600 bg-indigo-50">
            Leggi il regolamento
          </button>
        )}
      </div>

      {/* Salva */}
      {errore && <p className="text-xs text-red-500 mb-3 text-center">{errore}</p>}
      <button
        onClick={salva}
        disabled={salvando || salvato}
        className={`w-full py-4 rounded-2xl text-sm font-bold transition mb-4 flex items-center justify-center gap-2
          ${salvato ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white active:bg-indigo-700'}
          ${salvando ? 'opacity-70' : ''}`}>
        {salvando ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : salvato ? (
          <><Check size={16} strokeWidth={3} /> Salvato!</>
        ) : (
          <><ShieldCheck size={16} /> Salva modifiche</>
        )}
      </button>

      {/* Logout */}
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 mb-8 border border-red-100 rounded-xl bg-red-50 active:bg-red-100">
        <LogOut size={17} /> Esci dall'account
      </button>

      {showReg && (
        <ModalRegolamento
          onClose={() => {
            setShowReg(false);
            set('accettazione_reg', true);
          }}
        />
      )}
    </AllievoLayout>
  );
}

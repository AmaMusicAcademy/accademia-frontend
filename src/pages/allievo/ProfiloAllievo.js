import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Users, FileText, ShieldCheck, ChevronDown, ChevronUp, Check, X, LogOut, Pencil } from 'lucide-react';
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

function Riga({ label, value }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none
          bg-white text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
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
      {aperta && <div className="px-4 py-2">{children}</div>}
    </div>
  );
}

export default function ProfiloAllievo() {
  const navigate  = useNavigate();
  const [dati, setDati]         = useState(null);
  const [form, setForm]         = useState({});
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore]     = useState('');
  const [showReg, setShowReg]   = useState(false);

  const carica = () => {
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
  };

  useEffect(() => { carica(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const annulla = () => {
    carica();
    setEditing(false);
    setErrore('');
  };

  const salva = async () => {
    setSalvando(true);
    setErrore('');
    try {
      await apiFetch('/api/allievo/profilo', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      await apiFetch('/api/allievo/me').then(d => setDati(d));
      setEditing(false);
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

  const indirizzoCompleto = [dati?.indirizzo, dati?.cap, dati?.citta, dati?.provincia ? `(${dati.provincia})` : ''].filter(Boolean).join(', ') || '—';

  return (
    <AllievoLayout>
      {/* Header */}
      <div className="pt-6 pb-2 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
          <p className="text-sm text-gray-500">{editing ? 'Modifica le informazioni' : 'Informazioni personali'}</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-medium bg-indigo-50 active:bg-indigo-100">
            <Pencil size={14} /> Modifica
          </button>
        )}
      </div>

      {/* ── VIEW MODE ── */}
      {!editing && (
        <>
          <Sezione titolo="Dati personali" icona={User}>
            <Riga label="Nome" value={dati?.nome} />
            <Riga label="Cognome" value={dati?.cognome} />
            <Riga label="Codice Fiscale" value={dati?.codice_fiscale} />
            <Riga label="Data di nascita" value={fmtData(dati?.data_nascita)} />
            <Riga label="Luogo di nascita" value={dati?.luogo_nascita} />
            <Riga label="Indirizzo" value={indirizzoCompleto} />
          </Sezione>

          <Sezione titolo="Contatti" icona={Phone}>
            <Riga label="Telefono" value={dati?.telefono} />
            <Riga label="Email" value={dati?.email} />
          </Sezione>

          {dati?.minore && (
            <Sezione titolo="Genitore / Tutore" icona={Users} collapsible>
              <Riga label="Nome e Cognome" value={[dati.genitore_nome, dati.genitore_cognome].filter(Boolean).join(' ')} />
              <Riga label="Codice Fiscale" value={dati.genitore_cf} />
              <Riga label="Data di nascita" value={fmtData(dati.genitore_data_nascita)} />
              <Riga label="Luogo di nascita" value={dati.genitore_luogo_nascita} />
              <Riga label="Indirizzo" value={dati.genitore_indirizzo} />
              <Riga label="Telefono" value={dati.genitore_telefono} />
              <Riga label="Email" value={dati.genitore_email} />
            </Sezione>
          )}

          <div className="bg-white border rounded-2xl px-4 py-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900">Iscrizione</span>
            </div>
            <Riga label="Data iscrizione" value={fmtData(dati?.data_iscrizione)} />
            <Riga label="Minore di 18 anni" value={dati?.minore ? 'Sì' : 'No'} />
          </div>

          {/* Regolamento (sempre visibile, non in edit) */}
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
        </>
      )}

      {/* ── EDIT MODE ── */}
      {editing && (
        <>
          <Sezione titolo="Dati personali" icona={User}>
            <div className="space-y-3 py-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome</label>
                  <p className="text-sm text-gray-500 px-3 py-2.5 bg-gray-50 rounded-xl">{dati?.nome}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cognome</label>
                  <p className="text-sm text-gray-500 px-3 py-2.5 bg-gray-50 rounded-xl">{dati?.cognome}</p>
                </div>
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
                <Campo label="Prov." value={form.provincia}
                  onChange={v => set('provincia', v.toUpperCase().slice(0,2))} />
              </div>
            </div>
          </Sezione>

          <Sezione titolo="Contatti" icona={Phone}>
            <div className="space-y-3 py-1">
              <Campo label="Telefono" value={form.telefono} type="tel"
                onChange={v => set('telefono', v)} />
              <Campo label="Email" value={form.email} type="email"
                onChange={v => set('email', v)} />
            </div>
          </Sezione>

          {/* Minore: read-only in edit mode */}
          <div className="bg-gray-50 border rounded-2xl px-4 py-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-6 rounded-full flex items-center shrink-0 ${dati?.minore ? 'bg-indigo-400' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${dati?.minore ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Minore di 18 anni</p>
                <p className="text-xs text-gray-400">Non modificabile — contatta la segreteria</p>
              </div>
            </div>
          </div>

          {dati?.minore && (
            <Sezione titolo="Genitore / Tutore" icona={Users} collapsible>
              <div className="space-y-3 py-1">
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
                <Campo label="Indirizzo" value={form.genitore_indirizzo}
                  onChange={v => set('genitore_indirizzo', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Telefono" value={form.genitore_telefono} type="tel"
                    onChange={v => set('genitore_telefono', v)} />
                  <Campo label="Email" value={form.genitore_email} type="email"
                    onChange={v => set('genitore_email', v)} />
                </div>
              </div>
            </Sezione>
          )}

          {errore && <p className="text-xs text-red-500 mb-3 text-center">{errore}</p>}

          <div className="flex gap-3 mb-6">
            <button onClick={annulla}
              className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold">
              Annulla
            </button>
            <button onClick={salva} disabled={salvando}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 active:bg-indigo-700">
              {salvando
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ShieldCheck size={16} /> Salva</>}
            </button>
          </div>
        </>
      )}

      {/* Logout — sempre visibile */}
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 mb-8 border border-red-100 rounded-xl bg-red-50 active:bg-red-100">
        <LogOut size={17} /> Esci dall'account
      </button>

      {showReg && (
        <ModalRegolamento
          onClose={() => {
            setShowReg(false);
            set('accettazione_reg', true);
            apiFetch('/api/allievo/profilo', { method: 'PATCH', body: JSON.stringify({ accettazione_reg: true }) }).catch(() => {});
          }}
        />
      )}
    </AllievoLayout>
  );
}

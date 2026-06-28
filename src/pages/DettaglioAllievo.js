import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Check, X, UserX, UserCheck, Key, Trash2, FileDown } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import { apiFetch } from '../utils/api';

const MESI_NOME = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const fmtData = (d) => {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  return new Date(Date.UTC(+y,+m-1,+dd)).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' });
};

const CAMPI = [
  { key:'nome',           label:'Nome',             type:'text' },
  { key:'cognome',        label:'Cognome',          type:'text' },
  { key:'email',          label:'Email',            type:'email' },
  { key:'telefono',       label:'Telefono',         type:'tel' },
  { key:'indirizzo',      label:'Indirizzo',        type:'text' },
  { key:'cap',            label:'CAP',              type:'text' },
  { key:'citta',          label:'Città',            type:'text' },
  { key:'provincia',      label:'Provincia',        type:'text' },
  { key:'codice_fiscale', label:'Codice Fiscale',   type:'text' },
  { key:'luogo_nascita',  label:'Luogo di nascita', type:'text' },
  { key:'strumento',      label:'Strumento',        type:'text' },
  { key:'data_nascita',   label:'Data di nascita',  type:'date' },
  { key:'data_iscrizione',label:'Data iscrizione',  type:'date' },
  { key:'quota_mensile',  label:'Quota mensile (€)',type:'number' },
  { key:'note',           label:'Note',             type:'text' },
];

export default function DettaglioAllievo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allievo, setAllievo]           = useState(null);
  const [insAssegnati, setInsAssegnati] = useState([]);
  const [tuttiIns, setTuttiIns]         = useState([]);
  const [loading, setLoading]           = useState(true);

  const [editAna, setEditAna]   = useState(false);
  const [formAna, setFormAna]   = useState({});
  const [savingAna, setSavAna]  = useState(false);
  const [errAna, setErrAna]     = useState('');

  const [showPag, setShowPag]   = useState(false);
  const [mesiPagati, setMesiPag]= useState([]);
  const [mesiAttesi, setMesiAtt]= useState([]);
  const [savingPag, setSavPag]  = useState(false);
  const [mesiOriginali, setMesiOr] = useState([]);

  const [showIns, setShowIns]   = useState(false);
  const [selIns, setSelIns]     = useState([]);

  const [showTermina, setShowTermina] = useState(false);
  const [dataFine, setDataFine]       = useState('');
  const [savingTerm, setSavTerm]      = useState(false);
  const [errTerm, setErrTerm]         = useState('');

  const [accountMsg, setAccountMsg] = useState(null);
  const [accountLoad, setAccLoad]   = useState(false);

  const [showElimina, setShowElimina] = useState(false);
  const [pdfToken, setPdfToken]       = useState(null);

  const carica = async () => {
    setLoading(true);
    try {
      const [a, ins, tuttiI, pdfRes] = await Promise.all([
        apiFetch(`/api/allievi/${id}`),
        apiFetch(`/api/allievi/${id}/insegnanti`),
        apiFetch('/api/insegnanti'),
        apiFetch(`/api/allievi/${id}/iscrizione-pdf`).catch(() => ({})),
      ]);
      setPdfToken(pdfRes?.token || null);
      setAllievo(a);
      setInsAssegnati(Array.isArray(ins) ? ins : []);
      setTuttiIns(Array.isArray(tuttiI) ? tuttiI : []);

      if (a.data_iscrizione) {
        const inizio = new Date(`${String(a.data_iscrizione).slice(0,10)}T00:00:00Z`);
        const oggi = new Date();
        const lista = [];
        const y0 = inizio.getUTCFullYear(), m0 = inizio.getUTCMonth();
        const y1 = oggi.getFullYear(), m1 = oggi.getMonth();
        for (let y = y0; y <= y1; y++) {
          const s = y === y0 ? m0 : 0;
          const e = y === y1 ? m1 : 11;
          for (let m = s; m <= e; m++) lista.push(`${y}-${String(m+1).padStart(2,'0')}`);
        }
        setMesiAtt(lista);
        const pag = await apiFetch(`/api/allievi/${id}/pagamenti`);
        const pagati = (Array.isArray(pag) ? pag : []).map(p => `${p.anno}-${String(p.mese).padStart(2,'0')}`);
        setMesiPag(pagati); setMesiOr(pagati);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { carica(); }, [id]);

  const handleSaveAna = async () => {
    setSavAna(true); setErrAna('');
    try {
      const updated = await apiFetch(`/api/allievi/${id}`, { method:'PATCH', body:JSON.stringify(formAna) });
      setAllievo(updated); setEditAna(false);
    } catch (e) { setErrAna(e.message || 'Errore.'); }
    finally { setSavAna(false); }
  };

  const handleSavePag = async () => {
    setSavPag(true);
    try {
      const toAdd = mesiPagati.filter(m => !mesiOriginali.includes(m));
      const toDel = mesiOriginali.filter(m => !mesiPagati.includes(m));
      for (const m of toAdd) {
        const [a,me] = m.split('-').map(Number);
        await apiFetch(`/api/allievi/${id}/pagamenti`, { method:'POST', body:JSON.stringify({ anno:a, mese:me }) });
      }
      for (const m of toDel) {
        const [a,me] = m.split('-').map(Number);
        await apiFetch(`/api/allievi/${id}/pagamenti?anno=${a}&mese=${me}`, { method:'DELETE' });
      }
      setMesiOr(mesiPagati); setShowPag(false);
    } catch (e) { alert(e.message || 'Errore.'); }
    finally { setSavPag(false); }
  };

  const handleSaveIns = async () => {
    try {
      await apiFetch(`/api/allievi/${id}/insegnanti`, { method:'POST', body:JSON.stringify({ insegnanti: selIns }) });
      const updated = await apiFetch(`/api/allievi/${id}/insegnanti`);
      setInsAssegnati(Array.isArray(updated) ? updated : []);
      setShowIns(false);
    } catch (e) { alert(e.message || 'Errore.'); }
  };

  const handleTermina = async () => {
    if (!dataFine) { setErrTerm('Inserisci la data di fine.'); return; }
    setSavTerm(true); setErrTerm('');
    try {
      const updated = await apiFetch(`/api/allievi/${id}/termina`, { method:'PATCH', body:JSON.stringify({ data_fine: dataFine }) });
      setAllievo(updated); setShowTermina(false);
    } catch (e) { setErrTerm(e.message || 'Errore.'); }
    finally { setSavTerm(false); }
  };

  const handleRiattiva = async () => {
    try {
      const updated = await apiFetch(`/api/allievi/${id}/riattiva`, { method:'PATCH' });
      setAllievo(updated);
    } catch (e) { alert(e.message || 'Errore.'); }
  };

  const handleCreaAccount = async () => {
    setAccLoad(true); setAccountMsg(null);
    try {
      const data = await apiFetch(`/api/admin/allievi/${id}/credenziali`, { method:'POST' });
      setAccountMsg({ ok:true, text:`Account creato — username: "${data.username}" / password: "${data.password_iniziale}"` });
    } catch (e) { setAccountMsg({ ok:false, text: e.message || 'Errore.' }); }
    finally { setAccLoad(false); }
  };

  const handleElimina = async () => {
    try {
      await apiFetch(`/api/allievi/${id}`, { method:'DELETE' });
      navigate('/admin/allievi');
    } catch (e) { alert(e.message || 'Errore.'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-n-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!allievo) return (
    <div className="min-h-screen bg-n-50 flex items-center justify-center text-sm text-n-300">
      Allievo non trovato.
    </div>
  );

  const attivo = allievo.attivo !== false;

  // Raggruppa mesi per anno per la modale pagamenti
  const mesiPerAnno = mesiAttesi.reduce((acc, m) => {
    const anno = m.slice(0,4);
    if (!acc[anno]) acc[anno] = [];
    acc[anno].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader title={`${allievo.nome} ${allievo.cognome}`} />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">

        {/* Stato */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${attivo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-n-100 text-n-600 border border-n-100'}`}>
            {attivo ? 'Attivo' : 'Non attivo'}
          </span>
          {!attivo && allievo.data_fine && (
            <span className="text-xs text-n-300">Fine: {fmtData(allievo.data_fine)}</span>
          )}
        </div>

        {/* Anagrafica */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold text-n-900">Informazioni</p>
            {!editAna ? (
              <button onClick={() => { setFormAna({ ...allievo }); setEditAna(true); setErrAna(''); }}
                className="flex items-center gap-1 text-xs text-ama-500 font-medium">
                <Pencil size={12} /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleSaveAna} disabled={savingAna}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-medium disabled:opacity-40">
                  <Check size={12} /> Salva
                </button>
                <button onClick={() => setEditAna(false)} className="text-n-300"><X size={14} /></button>
              </div>
            )}
          </div>
          {!editAna ? (
            <div className="divide-y divide-gray-50">
              {CAMPI.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-n-300 w-36 shrink-0">{label}</span>
                  <span className="text-sm text-n-900 text-right truncate">
                    {key.includes('data') ? fmtData(allievo[key]) : (allievo[key] ?? '—')}
                    {key === 'quota_mensile' && allievo[key] != null ? ' €' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {CAMPI.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-n-600 mb-1">{label}</label>
                  <input type={type}
                    value={type==='date' ? (formAna[key] ? String(formAna[key]).slice(0,10) : '') : (formAna[key] ?? '')}
                    onChange={e => setFormAna(f => ({ ...f, [key]: e.target.value || null }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              ))}
              {errAna && <p className="text-xs text-red-500">{errAna}</p>}
            </div>
          )}
        </div>

        {/* Insegnanti */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold text-n-900">Insegnanti assegnati</p>
            <button onClick={() => { setSelIns(insAssegnati.map(i => i.id)); setShowIns(true); }}
              className="flex items-center gap-1 text-xs text-ama-500 font-medium">
              <Pencil size={12} /> Modifica
            </button>
          </div>
          {insAssegnati.length === 0 ? (
            <p className="px-4 py-3 text-sm text-n-300">Nessun insegnante assegnato.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {insAssegnati.map(i => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-500">{(i.nome?.[0]||'').toUpperCase()}{(i.cognome?.[0]||'').toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-n-900">{i.nome} {i.cognome}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagamenti */}
        <button onClick={() => setShowPag(true)}
          className="w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3 text-left active:bg-n-50">
          <div>
            <p className="text-sm font-semibold text-n-900">Pagamenti mensili</p>
            <p className="text-xs text-n-300 mt-0.5">{mesiPagati.length} / {mesiAttesi.length} mesi pagati</p>
          </div>
          <Pencil size={14} className="text-n-300" />
        </button>

        {/* Account */}
        <div className="bg-white border rounded-xl px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-n-900">Account allievo</p>
          <button onClick={handleCreaAccount} disabled={accountLoad}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
            <Key size={15} /> {accountLoad ? 'Creazione…' : 'Crea / reimposta credenziali'}
          </button>
          {pdfToken && (
            <a href={`${process.env.REACT_APP_API_URL || 'https://app-docenti.onrender.com'}/api/iscrizione/${pdfToken}/pdf`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium">
              <FileDown size={15} /> Scarica modulo iscrizione PDF
            </a>
          )}
          {accountMsg && (
            <div className={`text-xs rounded-xl px-3 py-2.5 ${accountMsg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {accountMsg.text}
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="space-y-2">
          {attivo ? (
            <button onClick={() => { setShowTermina(true); setDataFine(''); setErrTerm(''); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
              <UserX size={16} /> Termina iscrizione
            </button>
          ) : (
            <button onClick={handleRiattiva}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium">
              <UserCheck size={16} /> Riattiva iscrizione
            </button>
          )}
          <button onClick={() => setShowElimina(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-400 border border-red-100 rounded-xl text-sm font-medium">
            <Trash2 size={15} /> Elimina allievo
          </button>
        </div>
      </div>

      {/* Modal pagamenti */}
      {showPag && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold text-n-900">Pagamenti mensili</h2>
              <button onClick={() => setShowPag(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
              {Object.entries(mesiPerAnno).sort(([a],[b]) => b-a).map(([anno, mesi]) => (
                <div key={anno}>
                  <p className="text-xs font-semibold text-n-600 uppercase mb-2">{anno}</p>
                  <div className="bg-n-50 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {mesi.map(m => {
                      const pagato = mesiPagati.includes(m);
                      const [,mm] = m.split('-');
                      return (
                        <div key={m} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                          onClick={() => setMesiPag(prev => pagato ? prev.filter(x=>x!==m) : [...prev,m])}>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${pagato ? 'bg-emerald-500 border-emerald-500' : 'border-n-300'}`}>
                            {pagato && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm text-n-900">{MESI_NOME[+mm-1]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-6 pt-2 shrink-0 border-t">
              <button onClick={handleSavePag} disabled={savingPag}
                className="w-full py-3 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {savingPag ? 'Salvataggio…' : 'Salva modifiche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal insegnanti */}
      {showIns && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold text-n-900">Assegna insegnanti</h2>
              <button onClick={() => setShowIns(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 divide-y divide-gray-50">
              {tuttiIns.filter(i => i.attivo !== false).map(i => {
                const sel = selIns.includes(i.id);
                return (
                  <div key={i.id} className="flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={() => setSelIns(prev => sel ? prev.filter(x=>x!==i.id) : [...prev, i.id])}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-ama-500 border-blue-600' : 'border-n-300'}`}>
                      {sel && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-n-900">{i.nome} {i.cognome}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-6 pt-2 shrink-0 border-t">
              <button onClick={handleSaveIns}
                className="w-full py-3 bg-ama-500 text-white rounded-xl text-sm font-medium">
                Salva assegnazioni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal termina */}
      {showTermina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold text-n-900">Termina iscrizione</h2>
              <button onClick={() => setShowTermina(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-n-600">
                Inserisci la data di fine per <span className="font-semibold">{allievo.nome} {allievo.cognome}</span>.
              </p>
              <div>
                <label className="block text-xs text-n-600 mb-1">Data fine *</label>
                <input type="date" value={dataFine} onChange={e => setDataFine(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              </div>
              {errTerm && <p className="text-xs text-red-500">{errTerm}</p>}
            </div>
            <div className="px-5 pb-5 flex flex-col gap-2">
              <button onClick={handleTermina} disabled={savingTerm}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                <UserX size={15} /> {savingTerm ? 'Salvataggio…' : 'Conferma fine iscrizione'}
              </button>
              <button onClick={() => setShowTermina(false)}
                className="w-full py-3 bg-n-100 text-gray-700 rounded-xl text-sm font-medium">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal elimina */}
      {showElimina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center">
            <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-n-900 mb-1">Eliminare questo allievo?</p>
            <p className="text-xs text-n-600 mb-4">Operazione irreversibile. Tutti i dati verranno eliminati.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowElimina(false)}
                className="flex-1 py-2.5 bg-n-100 text-gray-700 rounded-xl text-sm font-medium">Annulla</button>
              <button onClick={handleElimina}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

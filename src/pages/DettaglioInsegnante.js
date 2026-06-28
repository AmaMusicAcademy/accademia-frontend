import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Check, X, Trash2, UserX, UserCheck } from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import { apiFetch } from '../utils/api';

const fmtData = (d) => {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  const [y, m, dd] = s.split('-');
  return new Date(Date.UTC(+y, +m-1, +dd)).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric' });
};

const euro = (n) =>
  new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n ?? 0);

const CAMPI = [
  { key: 'nome',          label: 'Nome',                  type: 'text' },
  { key: 'cognome',       label: 'Cognome',               type: 'text' },
  { key: 'username',      label: 'Username',              type: 'text' },
  { key: 'email',         label: 'Email',                 type: 'email' },
  { key: 'telefono',      label: 'Telefono',              type: 'tel' },
  { key: 'indirizzo',     label: 'Indirizzo',             type: 'text' },
  { key: 'data_nascita',  label: 'Data di nascita',       type: 'date' },
  { key: 'data_inizio',   label: 'Inizio collaborazione', type: 'date' },
];

export default function DettaglioInsegnante() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ins, setIns]             = useState(null);
  const [allievi, setAllievi]     = useState([]);
  const [loading, setLoading]     = useState(true);

  // Edit anagrafica
  const [editAna, setEditAna]     = useState(false);
  const [formAna, setFormAna]     = useState({});
  const [savingAna, setSavingAna] = useState(false);
  const [errAna, setErrAna]       = useState('');

  // Edit tariffa
  const [editTar, setEditTar]     = useState(false);
  const [tarInput, setTarInput]   = useState('');
  const [savingTar, setSavingTar] = useState(false);
  const [errTar, setErrTar]       = useState('');

  // Termina collaborazione
  const [showTermina, setShowTermina] = useState(false);
  const [dataFine, setDataFine]       = useState('');
  const [savingTerm, setSavingTerm]   = useState(false);
  const [errTerm, setErrTerm]         = useState('');

  const carica = () => {
    setLoading(true);
    Promise.all([
      apiFetch(`/api/insegnanti/${id}`),
      apiFetch(`/api/insegnanti/${id}/allievi`),
    ]).then(([i, a]) => {
      setIns(i);
      setAllievi(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { carica(); }, [id]);

  const handleSaveAna = async () => {
    setSavingAna(true); setErrAna('');
    try {
      const updated = await apiFetch(`/api/insegnanti/${id}`, {
        method: 'PATCH', body: JSON.stringify(formAna),
      });
      setIns(updated); setEditAna(false);
    } catch (e) { setErrAna(e.message || 'Errore.'); }
    finally { setSavingAna(false); }
  };

  const handleSaveTar = async () => {
    const val = parseFloat(tarInput.replace(',', '.'));
    if (isNaN(val) || val < 0) { setErrTar('Valore non valido.'); return; }
    setSavingTar(true); setErrTar('');
    try {
      const updated = await apiFetch(`/api/insegnanti/${id}/tariffa`, {
        method: 'PATCH', body: JSON.stringify({ tariffa_oraria: val }),
      });
      setIns(prev => ({ ...prev, tariffa_oraria: updated.tariffa_oraria }));
      setEditTar(false);
    } catch (e) { setErrTar(e.message || 'Errore.'); }
    finally { setSavingTar(false); }
  };

  const handleTermina = async () => {
    if (!dataFine) { setErrTerm('Inserisci la data di fine.'); return; }
    setSavingTerm(true); setErrTerm('');
    try {
      const updated = await apiFetch(`/api/insegnanti/${id}/termina`, {
        method: 'PATCH', body: JSON.stringify({ data_fine: dataFine }),
      });
      setIns(updated); setShowTermina(false);
    } catch (e) { setErrTerm(e.message || 'Errore.'); }
    finally { setSavingTerm(false); }
  };

  const handleRiattiva = async () => {
    try {
      const updated = await apiFetch(`/api/insegnanti/${id}/riattiva`, { method: 'PATCH' });
      setIns(updated);
    } catch (e) { alert(e.message || 'Errore.'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-n-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ins) return (
    <div className="min-h-screen bg-n-50 flex items-center justify-center text-sm text-n-300">
      Insegnante non trovato.
    </div>
  );

  const attivo = ins.attivo !== false;

  return (
    <div className="min-h-screen bg-n-50 pb-24">
      <PageHeader title={`${ins.nome} ${ins.cognome}`} />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">

        {/* Badge stato */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${attivo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-n-100 text-n-600 border border-n-100'}`}>
            {attivo ? 'Attivo' : 'Non attivo'}
          </span>
          {!attivo && ins.data_fine && (
            <span className="text-xs text-n-300">Fine: {fmtData(ins.data_fine)}</span>
          )}
        </div>

        {/* ── Anagrafica ── */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold text-n-900">Informazioni</p>
            {!editAna ? (
              <button onClick={() => { setFormAna({ ...ins }); setEditAna(true); setErrAna(''); }}
                className="flex items-center gap-1 text-xs text-ama-500 font-medium">
                <Pencil size={12} /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleSaveAna} disabled={savingAna}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-medium disabled:opacity-40">
                  <Check size={12} /> Salva
                </button>
                <button onClick={() => setEditAna(false)} className="text-n-300">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {!editAna ? (
            <div className="divide-y divide-gray-50">
              {CAMPI.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-n-300 w-36 shrink-0">{label}</span>
                  <span className="text-sm text-n-900 text-right truncate">
                    {key.includes('data') ? fmtData(ins[key]) : (ins[key] || '—')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {CAMPI.map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-n-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={type === 'date' ? (formAna[key] ? String(formAna[key]).slice(0,10) : '') : (formAna[key] || '')}
                    onChange={e => setFormAna(f => ({ ...f, [key]: e.target.value || null }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}
              {errAna && <p className="text-xs text-red-500">{errAna}</p>}
            </div>
          )}
        </div>

        {/* ── Tariffa oraria ── */}
        <div className="bg-white border rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-n-900">Tariffa oraria</p>
            {!editTar ? (
              <button onClick={() => { setTarInput(String(ins.tariffa_oraria ?? 15)); setEditTar(true); setErrTar(''); }}
                className="flex items-center gap-1 text-xs text-ama-500 font-medium">
                <Pencil size={12} /> Modifica
              </button>
            ) : null}
          </div>
          {!editTar ? (
            <p className="text-2xl font-bold text-n-900">
              {euro(ins.tariffa_oraria ?? 15)}
              <span className="text-sm font-normal text-n-300 ml-1">/ ora</span>
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-n-300 text-sm">€</span>
                <input type="number" min="0" step="0.5" value={tarInput}
                  onChange={e => setTarInput(e.target.value)}
                  className="w-full border rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  autoFocus />
              </div>
              <button onClick={handleSaveTar} disabled={savingTar}
                className="flex items-center gap-1 px-3 py-2 bg-ama-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                <Check size={14} /> Salva
              </button>
              <button onClick={() => setEditTar(false)} className="p-2 text-n-300 rounded-xl border">
                <X size={14} />
              </button>
            </div>
          )}
          {errTar && <p className="text-xs text-red-500 mt-1">{errTar}</p>}
        </div>

        {/* ── Allievi assegnati ── */}
        <div>
          <p className="text-xs font-semibold text-n-600 uppercase mb-2">
            Allievi assegnati ({allievi.length})
          </p>
          {allievi.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-6 text-center text-sm text-n-300">
              Nessun allievo assegnato.
            </div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-50">
              {allievi.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-ama-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-500">
                      {(a.nome?.[0]||'').toUpperCase()}{(a.cognome?.[0]||'').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-n-900">{a.nome} {a.cognome}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Azioni collaborazione ── */}
        <div className="space-y-2">
          {attivo ? (
            <button onClick={() => { setShowTermina(true); setDataFine(''); setErrTerm(''); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium active:bg-red-100">
              <UserX size={16} /> Termina collaborazione
            </button>
          ) : (
            <button onClick={handleRiattiva}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium active:bg-emerald-100">
              <UserCheck size={16} /> Riattiva collaborazione
            </button>
          )}
        </div>
      </div>

      {/* Modal termina collaborazione */}
      {showTermina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold text-n-900">Termina collaborazione</h2>
              <button onClick={() => setShowTermina(false)} className="text-n-300"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-n-600">
                Inserisci la data di fine collaborazione per <span className="font-semibold">{ins.nome} {ins.cognome}</span>.
                L'insegnante verrà spostato tra i non attivi.
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
                <UserX size={15} /> {savingTerm ? 'Salvataggio…' : 'Conferma fine collaborazione'}
              </button>
              <button onClick={() => setShowTermina(false)}
                className="w-full py-3 bg-n-100 text-gray-700 rounded-xl text-sm font-medium">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

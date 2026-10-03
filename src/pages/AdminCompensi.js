import React, { useEffect, useMemo, useState, useCallback } from 'react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import CompensoInsegnante from '../componenti/CompensoInsegnante';
import Spinner from '../componenti/Spinner';
import { apiFetch } from '../utils/api';

const euro = (n) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function nomeMese(yyyymm) {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-');
  return `${MESI_IT[+m - 1]} ${y}`;
}

function getPrevMonthYYYYMM() {
  const d = new Date();
  const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  const m = d.getMonth() === 0 ? 12 : d.getMonth();
  return `${y}-${String(m).padStart(2, '0')}`;
}

// ── Vista riepilogo tutti gli insegnanti ──────────────────────────────────
function RiepilogoTutti({ mese, onMeseChange }) {
  const [dati, setDati]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]  = useState(null);

  const carica = useCallback(async () => {
    setLoading(true); setErrore(null);
    try {
      const json = await apiFetch(`/api/insegnanti/compenso-totale?mese=${mese}`);
      setDati(json);
    } catch (e) {
      setErrore(e.message || 'Errore nel caricamento.');
      setDati(null);
    } finally {
      setLoading(false);
    }
  }, [mese]);

  useEffect(() => { carica(); }, [carica]);

  const stepMese = (delta) => {
    const [y, m] = mese.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onMeseChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-4">
      {/* Selettore mese */}
      <div className="bg-white border rounded-xl px-4 py-3">
        <label className="block text-xs font-medium text-n-600 mb-3">Mese di competenza</label>
        <div className="flex items-center gap-2">
          <button onClick={() => stepMese(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border text-n-600 text-lg active:bg-n-100">‹</button>
          <div className="flex-1 text-center">
            <p className="text-base font-semibold text-n-900">{nomeMese(mese)}</p>
          </div>
          <button onClick={() => stepMese(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border text-n-600 text-lg active:bg-n-100">›</button>
        </div>
      </div>

      {loading && <Spinner />}
      {errore && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{errore}</div>}

      {dati && (
        <>
          {/* KPI totali */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border rounded-xl px-4 py-3">
              <p className="text-xs text-n-300 mb-1">Ore totali</p>
              <p className="text-2xl font-bold text-n-900">{dati.totaleOre.toFixed(2)}</p>
            </div>
            <div className="bg-ama-500 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-200 mb-1">Totale compensi</p>
              <p className="text-2xl font-bold text-white">{euro(dati.totaleCompenso)}</p>
            </div>
          </div>

          {/* Tabella per insegnante */}
          <div>
            <p className="text-xs font-semibold text-n-600 uppercase mb-2">
              Dettaglio per insegnante — {nomeMese(mese)}
            </p>
            <div className="bg-white border rounded-xl overflow-hidden">
              {dati.insegnanti.filter(i => i.lezioni > 0).length === 0 ? (
                <p className="text-sm text-n-300 text-center py-8">Nessuna lezione in {nomeMese(mese)}.</p>
              ) : (
                dati.insegnanti.filter(i => i.lezioni > 0).map((ins, idx, arr) => (
                  <div key={ins.id}
                    className={`px-4 py-3 flex items-center justify-between gap-2 ${idx < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-n-900 truncate">{ins.nome}</p>
                      <p className="text-xs text-n-400 mt-0.5">
                        {ins.lezioni} lez · {ins.oreTotali.toFixed(2)} h · {euro(ins.tariffaOraria)}/h
                      </p>
                    </div>
                    <p className="text-sm font-bold text-n-900 shrink-0">{euro(ins.compenso)}</p>
                  </div>
                ))
              )}
              {/* riga totale */}
              {dati.insegnanti.some(i => i.lezioni > 0) && (
                <div className="px-4 py-3 bg-n-50 border-t flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Totale</span>
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-700">{euro(dati.totaleCompenso)}</p>
                    <p className="text-xs text-n-300">{dati.totaleOre.toFixed(2)} h</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────
export default function AdminCompensi() {
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnanteId, setInsegnanteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [mese, setMese] = useState(getPrevMonthYYYYMM());

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const BASE_URL = process.env.REACT_APP_API_URL || (
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000' : 'https://app-docenti.onrender.com'
    );
    fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInsegnanti(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-n-100 pb-20">
      <PageHeader title="Compensi" backTo="/admin" />

      <div className="p-4 space-y-4">
        {loading ? <Spinner /> : null}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-xs text-n-600 mb-1">Seleziona insegnante</label>
          <select
            value={insegnanteId}
            onChange={e => setInsegnanteId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Scegli —</option>
            <option value="all">Tutti gli insegnanti</option>
            {insegnanti.map(i => (
              <option key={i.id} value={i.id}>
                {i.cognome ? `${i.cognome} ${i.nome}` : `${i.nome} ${i.cognome || ''}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-n-600 mt-2">
            {insegnanteId === 'all'
              ? 'Riepilogo compensi di tutti gli insegnanti per il mese selezionato.'
              : 'Seleziona un insegnante per scegliere il mese e generare il PDF.'}
          </p>
        </div>

        {insegnanteId === 'all' ? (
          <RiepilogoTutti mese={mese} onMeseChange={setMese} />
        ) : insegnanteId ? (
          <CompensoInsegnante insegnanteId={insegnanteId} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-n-300 text-center py-10">
            Nessun insegnante selezionato.
          </div>
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}

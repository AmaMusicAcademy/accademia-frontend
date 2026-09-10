import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import InsegnanteLayout from '../componenti/InsegnanteLayout';
import AssenteModal from '../componenti/AssenteModal';
import { apiFetch, getInsegnanteId } from '../utils/api';

const GIORNI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MESI   = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const oggiStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const formatOra = (t) => (t ? String(t).slice(0, 5) : '');

export default function InsegnanteOggi() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assenteLezione, setAssenteLezione] = useState(null);
  const [busy, setBusy] = useState({});

  const carica = useCallback(async () => {
    const id = getInsegnanteId();
    if (!id) { navigate('/login'); return; }
    setLoading(true);
    try {
      const all = await apiFetch(`/api/insegnanti/${id}/lezioni`);
      const oggi = oggiStr();
      const lez = (Array.isArray(all) ? all : [])
        .filter(l => l.data?.slice(0, 10) === oggi)
        .sort((a, b) => (a.ora_inizio || '').localeCompare(b.ora_inizio || ''));
      setLezioni(lez);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { carica(); }, [carica]);

  const segnaPresente = async (lezione) => {
    setBusy(b => ({ ...b, [lezione.id]: true }));
    try {
      await apiFetch(`/api/lezioni/${lezione.id}/presente`, { method: 'PATCH' });
      await carica();
    } finally {
      setBusy(b => ({ ...b, [lezione.id]: false }));
    }
  };

  const annullaPresenza = async (lezione) => {
    setBusy(b => ({ ...b, [lezione.id]: true }));
    try {
      await apiFetch(`/api/lezioni/${lezione.id}/annulla-presenza`, { method: 'PATCH' });
      await carica();
    } finally {
      setBusy(b => ({ ...b, [lezione.id]: false }));
    }
  };

  const oggi = new Date();
  const dataLabel = `${GIORNI[oggi.getDay()]} ${oggi.getDate()} ${MESI[oggi.getMonth() + 1]}`;

  return (
    <InsegnanteLayout>
      <div className="pt-6 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/insegnante')} className="p-1.5 text-n-400">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-xs text-n-500 uppercase tracking-wide">Presenze</p>
              <h1 className="text-xl font-bold text-n-900">{dataLabel}</h1>
            </div>
          </div>
          <button onClick={carica} className="p-2 text-n-400" aria-label="Aggiorna">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Contenuto */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lezioni.length === 0 ? (
          <div className="bg-n-50 border border-dashed rounded-2xl p-10 text-center text-n-400">
            <p className="text-lg font-medium mb-1">Nessuna lezione oggi</p>
            <p className="text-sm">Buona giornata!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {lezioni.map(l => {
              const nome = l.tipo === 'collettiva'
                ? (l.nome_gruppo || 'Gruppo')
                : `${l.nome_allievo || ''} ${l.cognome_allievo || ''}`.trim();

              const isSvolta = l.stato === 'svolta';
              const isAppuntamentata = l.stato === 'appuntamentata';
              const isBusy = !!busy[l.id];

              return (
                <div
                  key={l.id}
                  className={`rounded-2xl border p-5 transition-colors ${
                    isSvolta
                      ? 'bg-emerald-50 border-emerald-200'
                      : isAppuntamentata
                      ? 'bg-white border-n-200'
                      : 'bg-n-50 border-n-100'
                  }`}
                >
                  {/* Info lezione */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-bold text-n-900 leading-tight">{nome}</p>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        isSvolta ? 'bg-emerald-200 text-emerald-800' :
                        isAppuntamentata ? 'bg-ama-100 text-blue-700' :
                        'bg-n-200 text-n-600'
                      }`}>
                        {isSvolta ? 'Svolta' : isAppuntamentata ? 'Da fare' : l.stato}
                      </span>
                    </div>
                    <p className="text-sm text-n-600 mt-1">
                      {formatOra(l.ora_inizio)} – {formatOra(l.ora_fine)}
                      {l.aula && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <MapPin size={11} /> {l.aula}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Bottoni azione */}
                  {isAppuntamentata && (
                    <div className="flex gap-3">
                      <button
                        disabled={isBusy}
                        onClick={() => segnaPresente(l)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 active:bg-emerald-600 disabled:opacity-60 rounded-xl text-white font-bold text-base shadow-sm"
                      >
                        <CheckCircle size={20} />
                        Presente
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => setAssenteLezione(l)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 active:bg-red-600 disabled:opacity-60 rounded-xl text-white font-bold text-base shadow-sm"
                      >
                        <XCircle size={20} />
                        Assente
                      </button>
                    </div>
                  )}

                  {isSvolta && (
                    <button
                      disabled={isBusy}
                      onClick={() => annullaPresenza(l)}
                      className="w-full py-3 border border-amber-300 bg-amber-50 active:bg-amber-100 disabled:opacity-60 rounded-xl text-amber-700 font-semibold text-sm"
                    >
                      Correggi presenza
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assenteLezione && (
        <AssenteModal
          lezione={assenteLezione}
          onClose={() => setAssenteLezione(null)}
          onSaved={() => { setAssenteLezione(null); carica(); }}
        />
      )}
    </InsegnanteLayout>
  );
}

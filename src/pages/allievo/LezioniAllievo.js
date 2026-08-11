import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, User, RefreshCw } from 'lucide-react';
import AllievoLayout from '../../componenti/AllievoLayout';
import { apiFetch } from '../../utils/api';

const nomiMesi = ['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

const STATI_BADGE = {
  futura:    { label: 'Programmata', cls: 'bg-ama-100 text-ama-700' },
  svolta:    { label: 'Svolta',      cls: 'bg-emerald-100 text-emerald-700' },
  rimandata: { label: 'Rimandata',   cls: 'bg-amber-100 text-amber-700' },
  annullata: { label: 'Annullata',   cls: 'bg-red-100 text-red-700' },
};

function formatData(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day} ${nomiMesi[parseInt(m)]} ${y}`;
}

function LezioneCard({ lezione }) {
  const badge = STATI_BADGE[lezione.stato] || { label: lezione.stato, cls: 'bg-n-100 text-gray-700' };
  return (
    <div className="bg-white border rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-n-900 font-semibold">
          <Calendar size={15} className="text-ama-300 shrink-0" />
          {formatData(lezione.data)}
        </div>
        <div className="flex items-center gap-1.5">
          {lezione.tipo === 'collettiva' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {lezione.nome_gruppo || 'Collettiva'}
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-n-600 mt-1">
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {lezione.ora_inizio} — {lezione.ora_fine}
        </span>
        {lezione.aula && (
          <span className="flex items-center gap-1">
            <MapPin size={13} />
            Aula {lezione.aula}
          </span>
        )}
        {lezione.nome_insegnante && (
          <span className="flex items-center gap-1">
            <User size={13} />
            {lezione.nome_insegnante} {lezione.cognome_insegnante}
          </span>
        )}
      </div>
      {lezione.motivazione && (
        <p className="mt-2 text-xs text-n-600 italic">"{lezione.motivazione}"</p>
      )}
    </div>
  );
}

export default function LezioniAllievo() {
  const [tab, setTab] = useState('future');
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);

  const carica = useCallback(() => {
    setLoading(true);
    apiFetch(`/api/allievo/lezioni?stato=${tab}`)
      .then(setLezioni)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { carica(); }, [carica]);

  const futureTot  = lezioni.filter((l) => l.stato === 'appuntamentata').length;
  const svolte     = lezioni.filter((l) => l.stato === 'svolta').length;
  const rimandate  = lezioni.filter((l) => l.stato === 'rimandata').length;
  const annullate  = lezioni.filter((l) => l.stato === 'annullata').length;

  return (
    <AllievoLayout>
      <div className="pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-n-900">Le mie lezioni</h1>
        <button onClick={carica} className="p-2 text-n-600" aria-label="Aggiorna">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tab */}
      <div className="flex bg-n-100 rounded-xl p-1 mb-5">
        {[
          { id: 'future',  label: 'Future' },
          { id: 'passate', label: 'Passate' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-white text-ama-500 shadow-sm'
                : 'text-n-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sommario (solo tab passate) */}
      {tab === 'passate' && lezioni.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Svolte',    n: svolte,    cls: 'text-emerald-600' },
            { label: 'Rimandate', n: rimandate, cls: 'text-amber-600' },
            { label: 'Annullate', n: annullate, cls: 'text-red-600' },
          ].map(({ label, n, cls }) => (
            <div key={label} className="bg-white border rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{n}</p>
              <p className="text-xs text-n-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sommario (solo tab future) */}
      {tab === 'future' && futureTot > 0 && (
        <p className="text-sm text-n-600 mb-4">
          {futureTot} lezione{futureTot !== 1 ? 'i' : ''} programmata{futureTot !== 1 ? 'e' : ''}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lezioni.length === 0 ? (
        <div className="text-center py-12 text-n-300">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessuna lezione {tab === 'future' ? 'programmata' : 'passata'}</p>
        </div>
      ) : (
        lezioni.map((l) => <LezioneCard key={l.id} lezione={l} />)
      )}
    </AllievoLayout>
  );
}

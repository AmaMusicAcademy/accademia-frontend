import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Users, TrendingUp, ChevronRight,
  MapPin, RefreshCw, DoorOpen, RotateCcw,
} from 'lucide-react';
import InsegnanteLayout from '../componenti/InsegnanteLayout';
import RiprogrammaModal from '../componenti/RiprogrammaModal';
import AssenteModal from '../componenti/AssenteModal';
import { apiFetch, getInsegnanteId } from '../utils/api';

const MESI  = ['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

const oggiStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const formatOra = (t) => (t ? String(t).slice(0, 5) : '');

// ─── componenti locali ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={19} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function LezioneRow({ lezione, onAnnullaPresenza }) {
  const badge = {
    appuntamentata: 'bg-blue-100 text-blue-700',
    svolta:         'bg-emerald-100 text-emerald-700',
    rimandata:      'bg-amber-100 text-amber-700',
    annullata:      'bg-red-100 text-red-700',
  }[lezione.stato] || 'bg-gray-100 text-gray-700';

  const labels = {
    appuntamentata: 'da fare',
    svolta:         'svolta',
    rimandata:      'rimandata',
    annullata:      'annullata',
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="text-center w-12 shrink-0">
        <p className="text-sm font-bold text-gray-900">{formatOra(lezione.ora_inizio)}</p>
        <p className="text-[10px] text-gray-400">{formatOra(lezione.ora_fine)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {lezione.nome_allievo} {lezione.cognome_allievo}
        </p>
        {lezione.aula && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={10} /> {lezione.aula}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
          {labels[lezione.stato] || lezione.stato}
        </span>
        {lezione.stato === 'svolta' && onAnnullaPresenza && (
          <button
            onClick={() => onAnnullaPresenza(lezione)}
            className="text-[10px] font-medium text-amber-500 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-full active:bg-amber-100"
          >
            Correggi
          </button>
        )}
      </div>
    </div>
  );
}

function AulaCard({ aula, lezioniAula }) {
  const occupata = lezioniAula.length > 0;
  return (
    <div className={`border rounded-xl p-3 flex items-center gap-3 ${occupata ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${occupata ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
        <DoorOpen size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{aula.nome}</p>
        {occupata ? (
          lezioniAula.map((l, i) => (
            <p key={i} className="text-xs text-red-600 truncate">
              {formatOra(l.ora_inizio)}–{formatOra(l.ora_fine)} · {l.nome_insegnante} {l.cognome_insegnante}
            </p>
          ))
        ) : (
          <p className="text-xs text-emerald-600">Libera</p>
        )}
      </div>
    </div>
  );
}

// ─── pagina principale ────────────────────────────────────────────────────────

export default function DashboardInsegnante() {
  const navigate  = useNavigate();
  const [profilo, setProfilo]   = useState(null);
  const [lezioni, setLezioni]   = useState([]);
  const [aule, setAule]         = useState([]);
  const [occupazione, setOccupazione] = useState({}); // { aulaId: [lezioni] }
  const [loading, setLoading]   = useState(true);
  const [sezione, setSezione]         = useState('oggi');
  const [dataAule, setDataAule]       = useState(oggiStr);
  const [riprogrammaLezione, setRiprogrammaLezione] = useState(null);
  const [assenteOpen, setAssenteOpen] = useState(false);

  const caricaOccupazione = useCallback(async (aulaArr, data) => {
    const results = await Promise.all(
      aulaArr.map((a) =>
        apiFetch(`/api/aule/${a.id}/disponibilita?data=${data}`)
          .catch(() => ({ lezioni: [] }))
      )
    );
    const occ = {};
    aulaArr.forEach((a, i) => { occ[a.id] = results[i]?.lezioni || []; });
    setOccupazione(occ);
  }, []);

  const carica = useCallback(async () => {
    const id = getInsegnanteId();
    if (!id) { navigate('/login'); return; }
    setLoading(true);
    try {
      const [me, lez, aulaList] = await Promise.all([
        apiFetch('/api/insegnante/me'),
        apiFetch(`/api/insegnanti/${id}/lezioni`),
        apiFetch('/api/aule'),
      ]);
      setProfilo(me);
      const lez_ = Array.isArray(lez) ? lez : [];
      setLezioni(lez_);

      const aulaArr = Array.isArray(aulaList) ? aulaList : [];
      setAule(aulaArr);

      await caricaOccupazione(aulaArr, oggiStr());
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { carica(); }, [carica]);

  useEffect(() => {
    if (aule.length > 0) caricaOccupazione(aule, dataAule);
  }, [dataAule, aule, caricaOccupazione]);

  // calcoli
  const dataOggi = oggiStr();
  const now = new Date();
  const oraOggi = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const lezioniOggi = lezioni
    .filter((l) => l.data?.slice(0, 10) === dataOggi)
    .sort((a, b) => (a.ora_inizio || '').localeCompare(b.ora_inizio || ''));

  const prossima = lezioni
    .filter((l) => {
      const d = l.data?.slice(0, 10);
      if (!d) return false;
      if (d > dataOggi) return true;
      if (d === dataOggi) return (l.ora_inizio || '') > oraOggi;
      return false;
    })
    .sort((a, b) => {
      const da = a.data?.slice(0,10) || '';
      const db = b.data?.slice(0,10) || '';
      return da !== db ? da.localeCompare(db) : (a.ora_inizio||'').localeCompare(b.ora_inizio||'');
    })[0] || null;

  const mese = now.getMonth() + 1;
  const anno = now.getFullYear();
  const lezioniMese = lezioni.filter((l) => {
    const d = new Date(l.data);
    return d.getMonth()+1 === mese && d.getFullYear() === anno && l.stato === 'svolta';
  }).length;
  const allieviUnici = new Set(lezioni.map((l) => l.id_allievo).filter(Boolean)).size;

  const formatDataBreve = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    const dt = new Date(Date.UTC(+y, +m-1, +d));
    return `${GIORNI[dt.getUTCDay()]} ${+d} ${MESI[+m]}`;
  };

  const auleFree  = aule.filter((a) => (occupazione[a.id] || []).length === 0).length;
  const auleBusy  = aule.length - auleFree;

  const daRiprogrammare = lezioni
    .filter((l) => l.stato === 'rimandata' && !l.riprogrammata)
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  if (loading) {
    return (
      <InsegnanteLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </InsegnanteLayout>
    );
  }

  return (
    <InsegnanteLayout>
      <div className="pt-6 pb-2">

        {/* Intestazione */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Ciao,</p>
            <h1 className="text-2xl font-bold text-gray-900">{profilo?.nome || '—'}</h1>
          </div>
          <button onClick={carica} className="p-2 text-gray-400" aria-label="Aggiorna">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard icon={Calendar}   label={`Lezioni ${MESI[mese]}`}  value={lezioniMese}        color="blue" />
          <StatCard icon={Users}      label="Allievi seguiti"           value={allieviUnici}        color="indigo" />
          <StatCard icon={TrendingUp} label="Oggi"                      value={lezioniOggi.length}  color="emerald" />
          <StatCard icon={Clock}      label="Totali archivio"           value={lezioni.length}      color="amber" />
        </div>

        {/* Tab */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {[
            { id: 'oggi',   label: 'Oggi' },
            { id: 'rimand', label: 'Da riprog.', badge: daRiprogrammare.length },
            { id: 'aule',   label: 'Aule' },
          ].map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => setSezione(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                sezione === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sezione: Oggi */}
        {sezione === 'oggi' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{formatDataBreve(dataOggi)}</h2>
              <button
                onClick={() => navigate('/insegnante/calendario')}
                className="text-sm text-blue-600 flex items-center gap-1"
              >
                Calendario <ChevronRight size={14} />
              </button>
            </div>

            {lezioniOggi.length === 0 ? (
              <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center text-gray-400 mb-5">
                <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna lezione oggi</p>
              </div>
            ) : (
              <div className="bg-white border rounded-xl px-4 mb-5">
                {lezioniOggi.map((l) => (
                  <LezioneRow
                    key={l.id}
                    lezione={l}
                    onAnnullaPresenza={async (lz) => {
                      await apiFetch(`/api/lezioni/${lz.id}/annulla-presenza`, { method: 'PATCH' });
                      carica();
                    }}
                  />
                ))}
              </div>
            )}

            {prossima && (
              <>
                <h2 className="font-semibold text-gray-900 mb-3">Prossima lezione</h2>
                <div className="bg-blue-600 text-white rounded-2xl p-5 mb-2">
                  <p className="text-sm opacity-80 mb-1">{formatDataBreve(prossima.data?.slice(0,10))}</p>
                  <p className="text-xl font-bold mb-0.5">
                    {prossima.nome_allievo} {prossima.cognome_allievo}
                  </p>
                  <p className="text-sm opacity-80">
                    {formatOra(prossima.ora_inizio)} — {formatOra(prossima.ora_fine)}
                    {prossima.aula ? ` · ${prossima.aula}` : ''}
                  </p>
                  {prossima.stato === 'appuntamentata' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          await apiFetch(`/api/lezioni/${prossima.id}/presente`, { method: 'PATCH' });
                          carica();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 active:bg-emerald-600 rounded-xl text-sm font-bold text-white shadow-sm"
                      >
                        P — Presente
                      </button>
                      <button
                        onClick={() => setAssenteOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 active:bg-red-600 rounded-xl text-sm font-bold text-white shadow-sm"
                      >
                        A — Assente
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Sezione: Da riprogrammare */}
        {sezione === 'rimand' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Da riprogrammare</h2>
              <span className="text-xs text-gray-400">{daRiprogrammare.length} {daRiprogrammare.length === 1 ? 'lezione' : 'lezioni'}</span>
            </div>

            {daRiprogrammare.length === 0 ? (
              <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center text-gray-400">
                <RotateCcw size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna lezione in attesa di riprogrammazione</p>
              </div>
            ) : (
              <div className="bg-white border rounded-xl overflow-hidden">
                {daRiprogrammare.map((l, i) => (
                  <div
                    key={l.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < daRiprogrammare.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {l.nome_allievo} {l.cognome_allievo}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatDataBreve(l.data?.slice(0,10))}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatOra(l.ora_inizio)}–{formatOra(l.ora_fine)}</span>
                        {l.aula && <span className="flex items-center gap-1"><MapPin size={10} /> {l.aula}</span>}
                      </p>
                      {l.motivazione && (
                        <p className="text-xs text-amber-600 mt-0.5 italic">{l.motivazione}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setRiprogrammaLezione(l)}
                      className="shrink-0 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-medium active:bg-amber-100"
                    >
                      Riprogramma
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sezione: Aule */}
        {sezione === 'aule' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Occupazione aule</h2>
              <input
                type="date"
                value={dataAule}
                onChange={(e) => setDataAule(e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm text-gray-700"
              />
            </div>

            {aule.length === 0 ? (
              <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center text-gray-400">
                <DoorOpen size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna aula trovata</p>
              </div>
            ) : (
              <div className="space-y-2">
                {aule.map((a) => (
                  <AulaCard key={a.id} aula={a} lezioniAula={occupazione[a.id] || []} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
      <AssenteModal
        open={assenteOpen}
        onClose={() => setAssenteOpen(false)}
        onRimanda={async (motivazione) => {
          setAssenteOpen(false);
          await apiFetch(`/api/lezioni/${prossima.id}/rimanda`, { method: 'PATCH', body: JSON.stringify({ motivazione }) });
          carica();
        }}
        onAnnulla={async (motivazione) => {
          setAssenteOpen(false);
          await apiFetch(`/api/lezioni/${prossima.id}/annulla`, { method: 'PATCH', body: JSON.stringify({ motivazione }) });
          carica();
        }}
      />
      <RiprogrammaModal
        lezione={riprogrammaLezione}
        onClose={() => setRiprogrammaLezione(null)}
        onSaved={() => { setRiprogrammaLezione(null); carica(); }}
      />
    </InsegnanteLayout>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Thermometer, Power, Minus, Plus, RefreshCw, AlertCircle, Target, Zap } from 'lucide-react';
import { apiFetch } from '../utils/api';
import PageHeader from '../componenti/PageHeader';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import BottomNav from '../componenti/BottomNav';

const TIPI_TERMOMETRO = ['Meter', 'MeterPlus', 'WoSensorTH', 'Hub 2', 'MeterPro'];
function isTermometro(d) { return TIPI_TERMOMETRO.some(t => (d.deviceType || '').includes(t)); }

// ── Card singola aula ────────────────────────────────────────────────────
function AulaCard({ aula, dispositivi, targets, onTargetChange }) {
  const termometri = dispositivi.filter(d => d.aula_nome === aula && isTermometro(d));
  const valvole    = dispositivi.filter(d => d.aula_nome === aula && !isTermometro(d));
  const tutti      = dispositivi.filter(d => d.aula_nome === aula);

  const target = targets.find(t => t.aula_nome === aula);

  const [stati, setStati]           = useState({});
  const [loading, setLoading]       = useState(false);
  const [errore, setErrore]         = useState(null);
  const [targetTemp, setTargetTemp] = useState(parseFloat(target?.temperatura_target ?? 20));
  const [salvando, setSalvando]     = useState(false);

  // Temperatura attuale dal termometro
  const tempAttuale = termometri.length > 0
    ? (stati[termometri[0]?.deviceId]?.temperature ?? stati[termometri[0]?.deviceId]?.tempC ?? null)
    : null;

  // Posizione valvola corrente
  const valvola = valvole[0];
  const statoValvola = valvola ? stati[valvola.deviceId] : null;
  const posizione = target?.posizione_attuale ?? statoValvola?.slidePosition ?? 0;
  const isAttivo  = target?.attivo ?? false;

  const aggiornaStati = useCallback(async () => {
    setLoading(true);
    setErrore(null);
    const nuovi = {};
    for (const d of tutti) {
      try {
        const s = await apiFetch(`/api/clima/stato/${d.deviceId}`);
        nuovi[d.deviceId] = s;
      } catch (e) {
        nuovi[d.deviceId] = { error: e.message };
      }
    }
    setStati(nuovi);
    setLoading(false);
  }, [tutti]);

  useEffect(() => { if (tutti.length > 0) aggiornaStati(); }, []);

  // Imposta target temperatura e attiva il controllo automatico
  const attivaControllo = async () => {
    if (!valvola) return;
    const termoId = termometri[0]?.deviceId ?? null;
    setSalvando(true);
    try {
      const res = await apiFetch('/api/clima/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aula_nome: aula,
          device_id_termometro: termoId,
          device_id_valvola: valvola.deviceId,
          temperatura_target: targetTemp,
          attivo: true,
        }),
      });
      onTargetChange(res);
    } catch (e) { setErrore(e.message); }
    finally { setSalvando(false); }
  };

  // Spegni: chiude valvola a 0% e disattiva il controllo automatico
  const spegni = async () => {
    if (!valvola) return;
    setSalvando(true);
    try {
      await apiFetch(`/api/clima/valvola/${valvola.deviceId}/spegni`, { method: 'POST' });
      onTargetChange({ ...target, attivo: false, posizione_attuale: 0 });
      setTimeout(aggiornaStati, 1200);
    } catch (e) { setErrore(e.message); }
    finally { setSalvando(false); }
  };

  // Imposta posizione manuale (sovrascrive il cron temporaneamente)
  const setPositione = async (pos) => {
    if (!valvola) return;
    try {
      await apiFetch(`/api/clima/valvola/${valvola.deviceId}/posizione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posizione: pos }),
      });
      onTargetChange({ ...target, posizione_attuale: pos });
    } catch (e) { setErrore(e.message); }
  };

  if (tutti.length === 0) return null;

  // Colore indicatore temperatura
  const deltaTemp = tempAttuale != null ? tempAttuale - targetTemp : null;
  const colorTemp = deltaTemp == null ? 'text-n-400'
    : Math.abs(deltaTemp) <= 0.5 ? 'text-emerald-600'
    : deltaTemp < 0 ? 'text-blue-500'
    : 'text-red-500';

  return (
    <div className="bg-white border rounded-2xl p-4 space-y-4">

      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-n-900">{aula}</h3>
          {isAttivo && (
            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
              <Zap size={10} /> Auto
            </span>
          )}
        </div>
        <button onClick={aggiornaStati} disabled={loading} className="p-1.5 rounded-lg text-n-400 active:bg-n-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {errore && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} />{errore}
        </div>
      )}

      {/* Temperatura attuale */}
      {termometri.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Thermometer size={18} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-n-500">{termometri[0].deviceName}</p>
            {loading && !stati[termometri[0].deviceId] ? (
              <div className="w-4 h-4 border-2 border-n-300 border-t-transparent rounded-full animate-spin mt-1" />
            ) : stati[termometri[0].deviceId]?.error ? (
              <p className="text-xs text-red-400">Errore lettura</p>
            ) : (
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold leading-none ${colorTemp}`}>
                  {tempAttuale != null ? `${tempAttuale}°C` : '—'}
                </p>
                {stati[termometri[0].deviceId]?.humidity != null && (
                  <span className="text-sm text-n-400">{stati[termometri[0].deviceId].humidity}%</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valvola */}
      {valvola && (
        <div className="border rounded-xl p-3 space-y-4">

          {/* Stato valvola + posizione */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-n-500">{valvola.deviceName}</p>
              <p className="text-xs text-n-400">Apertura: <span className="font-semibold text-n-700">{posizione}%</span></p>
            </div>
            {/* Barra apertura */}
            <div className="w-20 h-2 bg-n-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ama-500 rounded-full transition-all"
                style={{ width: `${posizione}%` }}
              />
            </div>
          </div>

          {/* Target temperatura */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Target size={12} className="text-n-400" />
              <span className="text-xs text-n-500">Temperatura target</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetTemp(t => Math.max(10, t - 0.5))}
                className="w-9 h-9 rounded-full border flex items-center justify-center active:bg-n-50 shrink-0"
              >
                <Minus size={15} />
              </button>
              <span className="flex-1 text-center text-xl font-bold text-n-900">
                {targetTemp.toFixed(1)}°C
              </span>
              <button
                onClick={() => setTargetTemp(t => Math.min(30, t + 0.5))}
                className="w-9 h-9 rounded-full border flex items-center justify-center active:bg-n-50 shrink-0"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Stato raggiungimento target */}
            {tempAttuale != null && deltaTemp != null && (
              <p className={`text-xs text-center mt-1 ${colorTemp}`}>
                {Math.abs(deltaTemp) <= 0.3
                  ? 'Temperatura raggiunta'
                  : deltaTemp < 0
                  ? `${Math.abs(deltaTemp).toFixed(1)}°C sotto il target`
                  : `${deltaTemp.toFixed(1)}°C sopra il target`}
              </p>
            )}
          </div>

          {/* Azioni */}
          <div className="flex gap-2">
            <button
              onClick={attivaControllo}
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-ama-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {isAttivo ? 'Aggiorna target' : 'Attiva controllo auto'}
            </button>
            <button
              onClick={spegni}
              disabled={salvando || posizione === 0}
              className="py-2.5 px-3 rounded-xl border border-n-200 text-n-600 disabled:opacity-30"
              title="Spegni e chiudi valvola"
            >
              <Power size={16} />
            </button>
          </div>

          {/* Controllo manuale posizione (override temporaneo) */}
          <details className="group">
            <summary className="text-xs text-n-400 cursor-pointer select-none list-none flex items-center gap-1">
              <span className="group-open:hidden">▸</span>
              <span className="hidden group-open:inline">▾</span>
              Controllo manuale apertura
            </summary>
            <div className="mt-3 flex items-center gap-2">
              {[0, 25, 50, 75, 100].map(p => (
                <button
                  key={p}
                  onClick={() => setPositione(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    posizione === p ? 'bg-ama-500 text-white border-ama-500' : 'text-n-600 border-n-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <p className="text-xs text-n-300 mt-1">Il controllo automatico riprenderà al prossimo ciclo (5 min)</p>
          </details>

        </div>
      )}
    </div>
  );
}

// ── Pagina principale ────────────────────────────────────────────────────
export default function AdminClima({ ruolo = 'admin', backTo = '/admin' }) {
  const [dispositivi, setDispositivi] = useState([]);
  const [aule, setAule]               = useState([]);
  const [targets, setTargets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errore, setErrore]           = useState(null);

  useEffect(() => {
    apiFetch('/api/clima/dispositivi')
      .then(d => {
        setDispositivi(Array.isArray(d.dispositivi) ? d.dispositivi : []);
        setAule(Array.isArray(d.aule) ? d.aule : []);
        setTargets(Array.isArray(d.targets) ? d.targets : []);
      })
      .catch(e => setErrore(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleTargetChange = (updated) => {
    setTargets(prev => {
      const idx = prev.findIndex(t => t.aula_nome === updated.aula_nome);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      }
      return [...prev, updated];
    });
  };

  const auleConDisp = aule
    .map(a => a.nome)
    .filter(nome => dispositivi.some(d => d.aula_nome === nome));

  const senzaAula = dispositivi.filter(d => !d.aula_nome);

  const NavBar = ruolo === 'insegnante' ? BottomNav : BottomNavAdmin;

  return (
    <div className="min-h-screen bg-n-50 pb-20">
      <PageHeader title="Controllo Clima" backTo={backTo} />

      <div className="p-4 max-w-xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errore ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            <p className="font-semibold mb-1">Errore connessione SwitchBot</p>
            <p>{errore}</p>
            {errore.includes('non configurate') && (
              <p className="mt-2 text-xs text-red-400">
                Aggiungi <code>SWITCHBOT_TOKEN</code> e <code>SWITCHBOT_SECRET</code> nelle env vars di Render.
              </p>
            )}
          </div>
        ) : auleConDisp.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-center text-sm text-n-400">
            <Thermometer size={32} className="mx-auto mb-2 text-n-200" />
            Nessun dispositivo abbinato alle aule.
          </div>
        ) : (
          auleConDisp.map(nome => (
            <AulaCard
              key={nome}
              aula={nome}
              dispositivi={dispositivi}
              targets={targets}
              onTargetChange={handleTargetChange}
            />
          ))
        )}

        {ruolo === 'admin' && senzaAula.length > 0 && (
          <details className="bg-white border rounded-xl p-4">
            <summary className="text-xs text-n-400 cursor-pointer select-none">
              {senzaAula.length} dispositivi non abbinati ad alcuna aula
            </summary>
            <ul className="mt-2 space-y-1">
              {senzaAula.map(d => (
                <li key={d.deviceId} className="text-xs text-n-500">
                  {d.deviceName} <span className="text-n-300">({d.deviceType})</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-n-400 mt-2">
              Per abbinare, includi il nome dell'aula nel nome dispositivo sull'app SwitchBot.
            </p>
          </details>
        )}
      </div>

      <NavBar />
    </div>
  );
}

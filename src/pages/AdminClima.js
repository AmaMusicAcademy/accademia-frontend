import React, { useCallback, useEffect, useState } from 'react';
import { Thermometer, Power, Minus, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';
import PageHeader from '../componenti/PageHeader';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

// Tipi dispositivo SwitchBot rilevanti per clima
const TIPI_TERMOMETRO = ['Meter', 'MeterPlus', 'WoSensorTH', 'Hub 2', 'MeterPro'];
const TIPI_VALVOLA    = ['Bot', 'Plug', 'Plug Mini (US)', 'Plug Mini (JP)', 'Humidifier', 'Blind Tilt', 'Curtain'];

function isTermometro(d) { return TIPI_TERMOMETRO.some(t => (d.deviceType || '').includes(t)); }
function isValvola(d)    {
  const tipo = (d.deviceType || '').toLowerCase();
  return tipo.includes('bot') || tipo.includes('plug') || tipo.includes('hub') || tipo.includes('meter') || tipo.includes('remote');
}

// ── Card singola aula ────────────────────────────────────────────────────
function AulaCard({ aula, dispositivi, ruolo, backTo }) {
  const termometri = dispositivi.filter(d => d.aula_nome === aula && isTermometro(d));
  const valvole    = dispositivi.filter(d => d.aula_nome === aula && !isTermometro(d));
  const tutti      = dispositivi.filter(d => d.aula_nome === aula);

  const [stati, setStati]     = useState({});
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]   = useState(null);

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

  const inviaComando = async (deviceId, command, parameter = 'default') => {
    try {
      await apiFetch(`/api/clima/comando/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'command', command, parameter }),
      });
      setTimeout(aggiornaStati, 1200);
    } catch (e) {
      setErrore(e.message);
    }
  };

  if (tutti.length === 0) return null;

  return (
    <div className="bg-white border rounded-2xl p-4 space-y-4">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-n-900">{aula}</h3>
        <button
          onClick={aggiornaStati}
          disabled={loading}
          className="p-1.5 rounded-lg text-n-400 active:bg-n-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {errore && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          {errore}
        </div>
      )}

      {/* Termometri */}
      {termometri.map(d => {
        const s = stati[d.deviceId];
        const temp = s?.temperature ?? s?.tempC ?? null;
        const umid = s?.humidity ?? null;
        return (
          <div key={d.deviceId} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Thermometer size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-n-500">{d.deviceName}</p>
              {loading && !s ? (
                <div className="w-4 h-4 border-2 border-n-300 border-t-transparent rounded-full animate-spin mt-1" />
              ) : s?.error ? (
                <p className="text-xs text-red-400">Errore lettura</p>
              ) : (
                <p className="text-xl font-bold text-n-900 leading-none">
                  {temp != null ? `${temp}°C` : '—'}
                  {umid != null && <span className="text-sm font-normal text-n-400 ml-2">{umid}%</span>}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Valvole / dispositivi controllabili */}
      {valvole.map(d => {
        const s      = stati[d.deviceId];
        const power  = s?.power?.toLowerCase?.() ?? s?.mode?.toLowerCase?.() ?? null;
        const isOn   = power === 'on' || s?.moving === true;
        // Temperatura target: setPoint per termovalvole, temperature come fallback
        const target = s?.setPoint ?? s?.targetTemperature ?? s?.temperature ?? null;
        const [tempInput, setTempInput] = [target, () => {}]; // gestito con inviaComando

        const stepTemp = (delta) => {
          const cur = Math.round(target ?? 20);
          const nuova = Math.min(30, Math.max(10, cur + delta));
          // Comando SwitchBot per termovalvole: setTemperature
          // Fallback per altri dispositivi: setAllStatus
          const tipo = (d.deviceType || '').toLowerCase();
          if (tipo.includes('radiator') || tipo.includes('valve') || tipo.includes('trv')) {
            inviaComando(d.deviceId, 'setTemperature', nuova);
          } else {
            inviaComando(d.deviceId, 'setAllStatus', `${nuova},on,0`);
          }
        };

        return (
          <div key={d.deviceId} className="border rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-n-500">{d.deviceName}</p>
                <p className="text-xs font-medium text-n-400">{d.deviceType}</p>
              </div>
              {/* Toggle on/off */}
              <button
                onClick={() => inviaComando(d.deviceId, isOn ? 'turnOff' : 'turnOn')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isOn ? 'bg-ama-500 text-white' : 'bg-n-100 text-n-500'
                }`}
              >
                <Power size={13} />
                {isOn ? 'Acceso' : 'Spento'}
              </button>
            </div>

            {/* Temperatura target — mostrata per tutti i dispositivi controllabili */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-n-500 flex-1">Temperatura target</span>
              <button
                onClick={() => stepTemp(-1)}
                className="w-8 h-8 rounded-full border flex items-center justify-center active:bg-n-50"
              >
                <Minus size={14} />
              </button>
              <span className="text-base font-bold text-n-900 w-12 text-center">
                {target != null ? `${Math.round(target)}°` : '—'}
              </span>
              <button
                onClick={() => stepTemp(+1)}
                className="w-8 h-8 rounded-full border flex items-center justify-center active:bg-n-50"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pagina principale ────────────────────────────────────────────────────
export default function AdminClima({ ruolo = 'admin', backTo = '/admin' }) {
  const [dispositivi, setDispositivi] = useState([]);
  const [aule, setAule]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errore, setErrore]           = useState(null);

  useEffect(() => {
    apiFetch('/api/clima/dispositivi')
      .then(d => {
        setDispositivi(Array.isArray(d.dispositivi) ? d.dispositivi : []);
        setAule(Array.isArray(d.aule) ? d.aule : []);
      })
      .catch(e => setErrore(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Aule che hanno almeno un dispositivo associato
  const auleConDisp = aule
    .map(a => a.nome)
    .filter(nome => dispositivi.some(d => d.aula_nome === nome));

  // Dispositivi senza aula associata (nome non matcha nessuna aula)
  const senzaAula = dispositivi.filter(d => !d.aula_nome);

  const BottomNav = ruolo === 'insegnante'
    ? require('../componenti/BottomNav').default
    : BottomNavAdmin;

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
                Aggiungi le variabili <code>SWITCHBOT_TOKEN</code> e <code>SWITCHBOT_SECRET</code> nelle env vars di Render.
              </p>
            )}
          </div>
        ) : auleConDisp.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-center text-sm text-n-400">
            <Thermometer size={32} className="mx-auto mb-2 text-n-200" />
            Nessun dispositivo SwitchBot associato alle aule.<br />
            <span className="text-xs">Assicurati che il nome del dispositivo contenga il nome dell'aula (es. "Aula 1 - Termometro").</span>
          </div>
        ) : (
          auleConDisp.map(nome => (
            <AulaCard
              key={nome}
              aula={nome}
              dispositivi={dispositivi}
              ruolo={ruolo}
              backTo={backTo}
            />
          ))
        )}

        {/* Dispositivi senza aula abbinata — solo admin */}
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
              Per abbinare un dispositivo aggiungi il nome dell'aula nel nome dispositivo sull'app SwitchBot.
            </p>
          </details>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function CambiaPasswordPrimoAccesso() {
  const navigate  = useNavigate();
  const [nuova,   setNuova]   = useState('');
  const [ripeti,  setRipeti]  = useState('');
  const [mostra,  setMostra]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errore,  setErrore]  = useState('');

  const ruolo = localStorage.getItem('ruolo');

  const submit = async (e) => {
    e.preventDefault();
    setErrore('');
    if (nuova.length < 6) return setErrore('La password deve essere di almeno 6 caratteri.');
    if (nuova !== ripeti) return setErrore('Le password non coincidono.');
    setLoading(true);
    try {
      await apiFetch('/api/cambia-password', {
        method: 'POST',
        body: JSON.stringify({ nuovaPassword: nuova }),
      });
      if (ruolo === 'admin') navigate('/admin');
      else if (ruolo === 'allievo') navigate('/allievo');
      else navigate('/insegnante');
    } catch {
      setErrore('Errore durante il cambio password. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-n-100 w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-ama-100 rounded-2xl flex items-center justify-center mb-3">
            <Lock size={26} className="text-ama-500" />
          </div>
          <h1 className="text-xl font-bold text-n-900">Crea la tua password</h1>
          <p className="text-sm text-n-600 text-center mt-1">
            È il tuo primo accesso. Scegli una password personale per proteggere il tuo account.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-n-700 mb-1">Nuova password</label>
            <div className="relative">
              <input
                type={mostra ? 'text' : 'password'}
                value={nuova}
                onChange={e => setNuova(e.target.value)}
                placeholder="Minimo 6 caratteri"
                className="w-full border border-n-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-ama-400"
                required
              />
              <button type="button" onClick={() => setMostra(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300">
                {mostra ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-n-700 mb-1">Ripeti password</label>
            <input
              type={mostra ? 'text' : 'password'}
              value={ripeti}
              onChange={e => setRipeti(e.target.value)}
              placeholder="Ripeti la password"
              className="w-full border border-n-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ama-400"
              required
            />
          </div>

          {errore && <p className="text-sm text-red-500 text-center">{errore}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-ama-500 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Conferma password'}
          </button>
        </form>
      </div>
    </div>
  );
}

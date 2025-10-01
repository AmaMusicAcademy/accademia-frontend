import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const API_BASE =
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  'https://app-docenti.onrender.com';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function CambiaPassword() {
  const navigate = useNavigate();
  const utente = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('utente') || 'null');
    } catch {
      return null;
    }
  }, []);

  const token = useMemo(() => {
    try {
      return localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  }, []);

  const [attuale, setAttuale] = useState(''); // UI only (non usata dal backend corrente)
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUserId = useMemo(() => {
    if (utente?.id) return utente.id;
    const payload = decodeJwt(token);
    return payload?.id || payload?.userId || null;
  }, [utente, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessaggio('');
    setErrore('');

    // Validazioni base lato client
    if (!nuova || !conferma) {
      setErrore('Inserisci la nuova password e la conferma');
      return;
    }
    if (nuova.length < 6) {
      setErrore('La nuova password deve avere almeno 6 caratteri');
      return;
    }
    if (nuova !== conferma) {
      setErrore('La nuova password non coincide');
      return;
    }

    try {
      setLoading(true);

      // L’endpoint backend accetta: { id, nuovaPassword }
      // Molte versioni aggiornate ignorano "id" e prendono quello dal token.
      // Per compatibilità inviamo entrambi.
      const body = {
        nuovaPassword: nuova,
        ...(currentUserId ? { id: currentUserId } : {}),
      };

      const res = await fetch(`${API_BASE}/api/cambia-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      // Alcuni backend rispondono con { message: '...' }
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrore(data.message || 'Errore durante l’aggiornamento della password');
        return;
        }

      setMessaggio('Password aggiornata con successo!');
      setAttuale('');
      setNuova('');
      setConferma('');
    } catch (err) {
      setErrore('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex items-center">
        <button
          onClick={() => navigate('/insegnante/profilo')}
          className="text-blue-500 font-semibold"
        >
          ← Indietro
        </button>
        <h2 className="text-lg font-bold mx-auto">Cambia Password</h2>
        <div className="w-16"></div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="flex-grow p-4 space-y-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          {/* Campo "attuale" è solo UI per ora (il backend non lo valida) */}
          <input
            type="password"
            placeholder="Password attuale"
            value={attuale}
            onChange={(e) => setAttuale(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Nuova password"
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            required
            className="w-full p-2 border rounded"
            minLength={6}
          />
          <input
            type="password"
            placeholder="Conferma nuova password"
            value={conferma}
            onChange={(e) => setConferma(e.target.value)}
            required
            className="w-full p-2 border rounded"
            minLength={6}
          />
        </div>

        {errore && <p className="text-red-500">{errore}</p>}
        {messaggio && <p className="text-green-600">{messaggio}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-3 rounded shadow disabled:opacity-60"
        >
          {loading ? 'Aggiornamento…' : 'Aggiorna Password'}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}

export default CambiaPassword;

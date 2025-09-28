import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberCreds, setRememberCreds] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  // Prefill + autologin se token presente
  useEffect(() => {
    try {
      const savedU = localStorage.getItem('savedUsername') || '';
      const savedP = localStorage.getItem('savedPassword') || '';
      if (savedU) {
        setUsername(savedU);
        setRememberCreds(true);
      }
      if (savedP) setPassword(savedP);

      const token = localStorage.getItem('token');
      const ruolo = localStorage.getItem('ruolo');
      if (token && ruolo) {
        if (ruolo === 'admin') navigate('/admin');
        else navigate('/insegnante/profilo');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');
    setLoading(true);

    try {
      // username case-insensitive
      const normalizedUsername = (username || '').trim().toLowerCase();

      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          password: password
        }),
      });

      // Provo a leggere JSON, fallback testo grezzo per errori non-json
      let data = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        const msg = data?.message || 'Credenziali non valide';
        setErrore(msg);
        // se c'è un token vecchio sporco lo rimuovo
        localStorage.removeItem('token');
        localStorage.removeItem('ruolo');
        localStorage.removeItem('username');
        localStorage.removeItem('utente');
        return;
      }

      // Dal backend arrivano: token, ruolo, username, (opzionale) insegnanteId
      const utente = {
        username: data.username || normalizedUsername,
        ruolo: data.ruolo,
        // niente "id": è l'id UTENTE, non serve al frontend
        insegnanteId: data.insegnanteId ?? null, // <-- importane!
        nome: data.nome || '',
        cognome: data.cognome || ''
      };

      // Persisto sessione
      localStorage.setItem('token', data.token);
      localStorage.setItem('ruolo', data.ruolo);
      localStorage.setItem('username', utente.username);
      localStorage.setItem('utente', JSON.stringify(utente));

      // Opzionale: salvataggio credenziali per prefill
      if (rememberCreds) {
        localStorage.setItem('savedUsername', normalizedUsername);
        localStorage.setItem('savedPassword', password);
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }

      // Rimani connesso: usiamo localStorage, quindi è già “persistente”
      localStorage.setItem('staySignedIn', staySignedIn ? '1' : '0');

      // Redirect in base al ruolo
      if (data.ruolo === 'admin') {
        navigate('/admin');
      } else {
        // Suggerimento: usa /api/insegnante/me nel componente profilo e NON /api/insegnanti/:id
        navigate('/insegnante/profilo');
      }
    } catch (err) {
      console.error(err);
      setErrore('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Login</h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {/* Opzioni */}
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rememberCreds}
              onChange={() => setRememberCreds(v => !v)}
            />
            <span>Ricorda credenziali</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={staySignedIn}
              onChange={() => setStaySignedIn(v => !v)}
            />
            <span>Rimani connesso</span>
          </label>
        </div>

        {errore && <p className="text-red-500 text-sm mb-3">{errore}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white p-2 rounded flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Accesso in corso…' : 'Accedi'}
        </button>

        <p className="text-xs text-gray-500 mt-3">
          Suggerimento: il nome utente non distingue tra maiuscole e minuscole.
        </p>
      </form>
    </div>
  );
}

export default LoginPage;


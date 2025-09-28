import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const ProfiloInsegnante = () => {
  const navigate = useNavigate();
  const [utente, setUtente] = useState(() => {
    const saved = localStorage.getItem('utente');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Carica sempre il profilo dal backend con /api/insegnante/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/'); // non loggato
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/insegnante/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          // se token non valido o non autorizzato → torna al login
          const err = await res.json().catch(() => ({}));
          const msg = err.message || err.error || 'Accesso non autorizzato';
          throw new Error(msg);
        }
        return res.json();
      })
      .then((profilo) => {
        // profilo: { id, nome, cognome, username, avatar_url }
        // compongo oggetto utente coerente con quanto salvato in login
        const payload = decodeJwt(token) || {};
        const merged = {
          // dal backend (autoritativi)
          id: profilo.id,
          nome: profilo.nome,
          cognome: profilo.cognome,
          username: profilo.username,
          avatar_url: profilo.avatar_url || '',
          // dal token (opzionali)
          ruolo: localStorage.getItem('ruolo') || payload.ruolo || 'insegnante',
          insegnanteId: payload.insegnanteId ?? profilo.id ?? null,
        };
        setUtente(merged);
        localStorage.setItem('utente', JSON.stringify(merged));
        // assicurati che username/ruolo siano coerenti
        localStorage.setItem('username', merged.username);
        localStorage.setItem('ruolo', merged.ruolo);
      })
      .catch((e) => {
        console.error('ProfiloInsegnante:', e.message);
        // pulizia e redirect al login
        localStorage.removeItem('token');
        localStorage.removeItem('utente');
        localStorage.removeItem('ruolo');
        localStorage.removeItem('username');
        navigate('/');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utente');
    localStorage.removeItem('ruolo');
    localStorage.removeItem('username');
    navigate('/');
  };

  if (loading || !utente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Caricamento profilo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      {/* Intestazione */}
      <div className="p-6 bg-white shadow-md text-center">
        {utente.avatar_url ? (
          <img
            src={`${API_BASE}${utente.avatar_url}`}
            alt="Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
          />
        ) : (
          <div className="text-5xl mb-2">👤</div>
        )}

        <h2 className="text-xl font-bold">{utente.nome} {utente.cognome}</h2>
        <p className="text-gray-500">@{utente.username}</p>
        {utente.id && <p className="text-gray-400 text-sm mt-1">Insegnante ID: {utente.id}</p>}
      </div>

      <div className="p-4 flex-1">
        {/* Sezione Account */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Account</h3>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            <button
              onClick={() => navigate('/profilo/account')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>👤 Informazioni Account</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/profilo/password')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🔑 Cambia password</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/cambia-avatar')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🖼️ Cambia immagine</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left p-4 flex items-center justify-between text-red-600 font-semibold"
            >
              <span>🚪 Esci</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Sezione Insegnamento */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Insegnamento</h3>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            <button
              onClick={() => navigate('/rimborso')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>💶 Calcolo Rimborso</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
};

export default ProfiloInsegnante;










import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

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

  useEffect(() => {
    // Se ho già tutto (compreso id), non faccio nulla
    if (utente && utente.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Provo a ricavare l'id dal JWT (req.user.id lato backend)
    const payload = decodeJwt(token);
    const idFromToken = payload?.id;

    // Se ho l'id, lo uso per chiamare /api/insegnanti/:id
    if (idFromToken) {
      setLoading(true);
      fetch(`https://app-docenti.onrender.com/api/insegnanti/${idFromToken}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) {
            // 403 se id non coincide con quello del token (o admin), 404 se non trovato
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Errore nel recupero insegnante');
          }
          return res.json();
        })
        .then((dati) => {
          const merged = { ...(utente || {}), ...dati }; // preservo eventuali campi già salvati
          setUtente(merged);
          localStorage.setItem('utente', JSON.stringify(merged));
        })
        .catch((e) => console.error(e.message))
        .finally(() => setLoading(false));
    }
  }, [utente]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utente');
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
            src={`https://app-docenti.onrender.com${utente.avatar_url}`}
            alt="Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
          />
        ) : (
          <div className="text-5xl mb-2">👤</div>
        )}

        <h2 className="text-xl font-bold">{utente.nome} {utente.cognome}</h2>
        <p className="text-gray-500">@{utente.username}</p>
        {utente.id && <p className="text-gray-400 text-sm mt-1">ID: {utente.id}</p>}
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










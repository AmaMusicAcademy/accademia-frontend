import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const ProfiloInsegnante = () => {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utente');
    navigate('/');
  };

  if (!utente) return null;

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
              onClick={() => navigate('/cambia-immagine')}
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








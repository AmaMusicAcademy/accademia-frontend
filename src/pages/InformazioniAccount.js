import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

function InformazioniAccount() {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-bold text-lg">
          ← Indietro
        </button>
        <h2 className="flex-grow text-center text-lg font-semibold">Informazioni Account</h2>
        <div style={{ width: '70px' }}></div>
      </div>

      {/* Contenuto */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p><strong>Nome:</strong> {utente?.nome}</p>
          <p><strong>Cognome:</strong> {utente?.cognome}</p>
          <p><strong>Username:</strong> @{utente?.username}</p>
          <p><strong>ID:</strong> {utente?.id}</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default InformazioniAccount;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

function InformazioniAccount() {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  if (!utente) return <div>Caricamento...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex items-center">
        <button onClick={() => navigate('/profilo')} className="text-blue-500 font-semibold">
          ← Indietro
        </button>
        <h2 className="text-lg font-bold mx-auto">Informazioni Account</h2>
        <div className="w-16"></div>
      </div>

      {/* CONTENUTO */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-xl p-4 shadow space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 font-semibold">Nome:</span>
            <span>{utente.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-semibold">Cognome:</span>
            <span>{utente.cognome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-semibold">Username:</span>
            <span>@{utente.username}</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default InformazioniAccount;

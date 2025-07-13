import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompensoInsegnante from '../componenti/CompensoInsegnante';
import BottomNav from '../componenti/BottomNav';

const CalcoloRimborso = () => {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  if (!utente) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      {/* Header stile iOS */}
      <div className="flex items-center justify-between bg-white p-4 shadow-md">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm font-medium">
          &lt; Indietro
        </button>
        <h1 className="text-lg font-semibold">Calcolo Rimborso</h1>
        <div className="w-16" /> {/* Spazio placeholder */}
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-4">
        <CompensoInsegnante insegnanteId={utente.id} />
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
};

export default CalcoloRimborso;

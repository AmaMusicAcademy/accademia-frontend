import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CompensoInsegnante from '../componenti/CompensoInsegnante';
import BottomNav from '../componenti/BottomNav';
import PageHeader from '../componenti/PageHeader';
import { getInsegnanteId } from '../utils/api'; // 👈 prende l'id certo dal token

const CalcoloRimborso = () => {
  const navigate = useNavigate();

  // id corretto dal JWT (claim "insegnanteId")
  const insegnanteId = useMemo(() => getInsegnanteId(), []);

  // opzionale: se vuoi mostrare info utente salvate
  let utente = null;
  try { utente = JSON.parse(localStorage.getItem('utente') || 'null'); } catch {}

  if (!insegnanteId) {
    // nessun token o token senza claim: chiedo di riloggarsi
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <PageHeader title="Calcolo Rimborso" />
        <div className="p-6 text-sm text-red-600">
          Sessione non valida. Effettua di nuovo il login.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <PageHeader title="Calcolo Rimborso" />

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 👇 Passiamo l'ID certo dal token, NON utente.id */}
        <CompensoInsegnante insegnanteId={insegnanteId} utenteSnapshot={utente} />
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
};

export default CalcoloRimborso;
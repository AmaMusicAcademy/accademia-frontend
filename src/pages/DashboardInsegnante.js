import React from 'react';
import BottomNav from '../componenti/BottomNav';

function DashboardInsegnante() {
  return (
    <div className="pb-20">
      <h2 className="text-xl font-bold mb-2">Dashboard Insegnante</h2>
      <p className="mb-4">Benvenuto! Qui troverai il tuo calendario, i tuoi allievi e i tuoi pagamenti.</p>

      {/* Inserisci il menu in basso */}
      <BottomNav />
    </div>
  );
}

export default DashboardInsegnante;

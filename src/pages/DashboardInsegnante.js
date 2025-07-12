import React from 'react';
import InsegnanteLayout from '../componenti/InsegnanteLayout';

const DashboardInsegnante = () => {
  return (
    <InsegnanteLayout>
      <h2 className="text-xl font-bold mb-2">Dashboard Insegnante</h2>
      <p className="text-gray-700">Benvenuto! Qui troverai il tuo calendario, i tuoi allievi e i tuoi pagamenti.</p>
    </InsegnanteLayout>
  );
};

export default DashboardInsegnante;


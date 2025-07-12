import React from 'react';
import InsegnanteLayout from './InsegnanteLayout';

const ProfiloInsegnante = () => {
  return (
    <InsegnanteLayout>
      <h2 className="text-xl font-bold mb-2">👤 Il tuo profilo</h2>
      <p className="text-gray-700">
        Qui potrai vedere e modificare i tuoi dati personali, come nome utente e password (funzionalità in arrivo).
      </p>
    </InsegnanteLayout>
  );
};

export default ProfiloInsegnante;



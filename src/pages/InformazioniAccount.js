import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';
import PageHeader from '../componenti/PageHeader';

function InformazioniAccount() {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  return (
    <div className="flex flex-col min-h-screen bg-n-100">
      <PageHeader title="Informazioni Account" />

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


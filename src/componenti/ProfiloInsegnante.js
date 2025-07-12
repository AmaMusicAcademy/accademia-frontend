import React from 'react';
import InsegnanteLayout from './InsegnanteLayout';

const ProfiloInsegnante = () => {
  const user = JSON.parse(localStorage.getItem('utente'));

  return (
    <InsegnanteLayout>
      <div className="flex flex-col items-center text-center mb-6">
        <div className="text-5xl mb-2">👤</div>
        <h2 className="text-2xl font-bold">{user.nome} {user.cognome}</h2>
        <p className="text-sm text-gray-500">@{user.username}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded-xl shadow mb-6 w-full">
        <h3 className="text-lg font-semibold mb-2">Informazioni account</h3>
        <div className="text-sm text-gray-700">
          <p><strong>Nome:</strong> {user.nome}</p>
          <p><strong>Cognome:</strong> {user.cognome}</p>
          <p><strong>Username:</strong> {user.username}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <button
          className="bg-blue-500 text-white rounded-lg py-2 font-semibold"
          onClick={() => alert('Funzione cambio password in arrivo')}
        >
          🔑 Cambia password
        </button>

        <button
          className="bg-red-500 text-white rounded-lg py-2 font-semibold"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('utente');
            window.location.href = '/login';
          }}
        >
          📕 Esci
        </button>
      </div>
    </InsegnanteLayout>
  );
};

export default ProfiloInsegnante;





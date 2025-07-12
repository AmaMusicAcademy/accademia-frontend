import React, { useEffect, useState } from 'react';
import InsegnanteLayout from './InsegnanteLayout';

const ProfiloInsegnante = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('utente');
      if (!stored) {
        window.location.href = '/login';
      } else {
        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato non valido');
        }
        setUser(parsed);
      }
    } catch (error) {
      console.error('Errore nel parsing utente:', error);
      localStorage.removeItem('utente');
      window.location.href = '/login';
    }
  }, []);

  if (!user) return null;

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






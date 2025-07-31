import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const ProfiloInsegnante = () => {
  const navigate = useNavigate();
  const [utente, setUtente] = useState(JSON.parse(localStorage.getItem('utente')));

  useEffect(() => {
    if (!utente) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://app-docenti.onrender.com/api/insegnante/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setUtente(data);
            localStorage.setItem('utente', JSON.stringify(data));
          })
          .catch(err => console.error(err));
      }
    }
  }, [utente]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utente');
    navigate('/');
  };

  if (!utente) return <div>Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <div className="p-6 bg-white shadow-md text-center">
        {utente.avatar_url ? (
          <img
            src={`https://app-docenti.onrender.com${utente.avatar_url}`}
            alt="Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
          />
        ) : (
          <div className="text-5xl mb-2">👤</div>
        )}
        <h2 className="text-xl font-bold">{utente.nome} {utente.cognome}</h2>
        <p className="text-gray-500">@{utente.username}</p>
      </div>

      <div className="p-4 flex-1">
        {/* Sezioni account */}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfiloInsegnante;









import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const AdminAllievi = () => {
  const [allievi, setAllievi] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllievi = async () => {
      try {
        const res = await fetch('https://app-docenti.onrender.com/api/allievi', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setAllievi(data);
      } catch (err) {
        console.error('Errore nel caricamento degli allievi:', err);
      }
    };
    fetchAllievi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4 text-center">Allievi</h1>
        <div className="space-y-2">
          {allievi.map((allievo) => (
            <button
              key={allievo.id}
              onClick={() => navigate(`/admin/allievi/${allievo.id}`)}
              className="w-full text-left bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <span>{allievo.nome} {allievo.cognome}</span>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNavAdmin current="allievi" />
    </div>
  );
};

export default AdminAllievi;

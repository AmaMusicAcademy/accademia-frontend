import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const AdminInsegnanti = () => {
  const [insegnanti, setInsegnanti] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsegnanti = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://app-docenti.onrender.com/api/insegnanti', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setInsegnanti(data);
      } catch (err) {
        console.error('Errore nel recupero insegnanti:', err);
      }
    };

    fetchInsegnanti();
  }, []);

  const handleClick = (id) => {
    navigate(`/admin/insegnanti/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center p-4 bg-white shadow">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 font-bold text-lg"
        >
          ← Indietro
        </button>
        <h2 className="flex-grow text-center text-lg font-semibold">
          Lista Insegnanti
        </h2>
        <div style={{ width: '70px' }}></div>
      </div>

      {/* Lista insegnanti */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow divide-y">
          {insegnanti.map((ins) => (
            <button
              key={ins.id}
              onClick={() => handleClick(ins.id)}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>
                <span>{ins.nome} {ins.cognome}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* BottomNavAdmin con "+" rosso */}
      <BottomNavAdmin showAddButton onAdd={() => navigate('/admin/insegnanti/nuovo')} />
    </div>
  );
};

export default AdminInsegnanti;



import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const AdminAllievi = () => {
  const [allievi, setAllievi] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllievi = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://app-docenti.onrender.com/api/allievi', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAllievi(data);
      } catch (err) {
        console.error('Errore nel recupero allievi:', err);
      }
    };

    fetchAllievi();
  }, []);

  const handleClick = (id) => {
    navigate(`/admin/allievi/${id}`);
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
    Lista Allievi
  </h2>
  <div style={{ width: '70px' }}></div>
</div>


      {/* Lista allievi */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow divide-y">
          {allievi.map((allievo) => (
            <button
              key={allievo.id}
              onClick={() => handleClick(allievo.id)}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    allievo.in_regola ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                <span>{allievo.nome} {allievo.cognome}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* BottomNavAdmin con pulsante centrale "+" rosso */}
      <BottomNavAdmin showAddButton onAdd={() => navigate('/admin/allievi/nuovo')} />
    </div>
  );
};

export default AdminAllievi;


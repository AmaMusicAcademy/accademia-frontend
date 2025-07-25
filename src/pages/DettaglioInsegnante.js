import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const DettaglioInsegnante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [insegnante, setInsegnante] = useState(null);
  const [allievi, setAllievi] = useState([]);

  useEffect(() => {
    const fetchInsegnante = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://app-docenti.onrender.com/api/insegnanti/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setInsegnante(data);
      } catch (err) {
        console.error('Errore nel recupero insegnante:', err);
      }
    };

    const fetchAllieviAssegnati = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://app-docenti.onrender.com/api/insegnanti/${id}/allievi`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAllievi(data);
      } catch (err) {
        console.error('Errore nel recupero allievi assegnati:', err);
      }
    };

    fetchInsegnante();
    fetchAllieviAssegnati();
  }, [id]);

  if (!insegnante) {
    return <div className="p-4 text-center">Caricamento...</div>;
  }

  const infoRows = [
    ['Nome', insegnante.nome],
    ['Cognome', insegnante.cognome],
    ['ID', insegnante.id]
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold text-lg">
          ← Indietro
        </button>
        <h2 className="text-center flex-grow text-lg font-semibold -ml-12">Insegnante</h2>
        <div style={{ width: '75px' }}></div>
      </div>

      {/* Info stile iOS */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-xl shadow divide-y text-sm">
          {infoRows.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-gray-600">{label}</span>
              <span className="text-gray-800 text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Allievi assegnati */}
        {allievi.length > 0 && (
  <div className="bg-white rounded-xl shadow mt-6 divide-y text-sm">
    <div className="flex justify-between px-4 py-3 font-semibold text-gray-700">
      <span>Allievi assegnati</span>
      <span className="text-gray-400">{allievi.length}</span>
    </div>
    {allievi.map((a) => (
      <div key={a.id} className="flex justify-between px-4 py-3">
        <span className="text-gray-600">Allievo</span>
        <span className="text-gray-800 text-right">{a.nome} {a.cognome}</span>
      </div>
    ))}
  </div>
)}


      {/* BottomBar con tasto "Modifica" centrale */}
      <BottomNavAdmin showEditButton onEdit={() => navigate(`/admin/insegnanti/${id}/modifica`)} />
    </div>
  );
};

export default DettaglioInsegnante;

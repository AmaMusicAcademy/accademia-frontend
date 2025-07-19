import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const DettaglioAllievo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allievo, setAllievo] = useState(null);

  useEffect(() => {
    const fetchAllievo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://app-docenti.onrender.com/api/allievi/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAllievo(data);
      } catch (err) {
        console.error('Errore nel recupero allievo:', err);
      }
    };

    fetchAllievo();
  }, [id]);

  if (!allievo) {
    return <div className="p-4 text-center">Caricamento...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-bold text-lg">
          ← Indietro
        </button>
        <h2 className="flex-grow text-center text-lg font-semibold">Allievo</h2>
        <div style={{ width: '70px' }}></div>
      </div>

      {/* Contenuto */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <p><strong>Nome:</strong> {allievo.nome}</p>
          <p><strong>Cognome:</strong> {allievo.cognome}</p>
          <p><strong>Email:</strong> {allievo.email || '—'}</p>
          <p><strong>Telefono:</strong> {allievo.telefono || '—'}</p>
          <p><strong>Quota mensile:</strong> {allievo.quota_mensile} €</p>
          <p><strong>Data iscrizione:</strong> {allievo.data_iscrizione}</p>
          <p><strong>ID:</strong> {allievo.id}</p>
        </div>
      </div>

      <BottomNavAdmin />
    </div>
  );
};

export default DettaglioAllievo;

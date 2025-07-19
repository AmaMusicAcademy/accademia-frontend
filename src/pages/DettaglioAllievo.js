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

  const infoRows = [
    ['Nome', allievo.nome],
    ['Cognome', allievo.cognome],
    ['Email', allievo.email || '—'],
    ['Telefono', allievo.telefono || '—'],
    ['Quota mensile', `${allievo.quota_mensile} €`],
    ['Data iscrizione', allievo.data_iscrizione],
    ['ID', allievo.id]
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold text-lg">
          ← Indietro
        </button>
        <h2 className="text-center flex-grow text-lg font-semibold -ml-12">Allievo</h2>
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
      </div>

      {/* BottomBar con tasto "Modifica" centrale */}
      <BottomNavAdmin showEditButton onEdit={() => navigate(`/admin/allievi/${id}/modifica`)} />
    </div>
  );
};

export default DettaglioAllievo;


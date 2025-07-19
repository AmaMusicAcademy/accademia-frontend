import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const DettaglioAllievo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allievo, setAllievo] = useState(null);
  const [modalType, setModalType] = useState(null); // 'pagamenti' | 'assegna' | null


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
    ['Data iscrizione', new Date(allievo.data_iscrizione).toLocaleDateString('it-IT')],
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

        <div className="mt-6 space-y-2">
  <button
    onClick={() => setModalType('pagamenti')}
    className="w-full bg-white rounded-xl px-4 py-3 text-left text-gray-800 shadow border border-gray-200"
  >
    Pagamenti
  </button>

  <button
    onClick={() => setModalType('assegna')}
    className="w-full bg-white rounded-xl px-4 py-3 text-left text-gray-800 shadow border border-gray-200"
  >
    Assegna insegnanti
  </button>
</div>
      </div>

      {/* BottomBar con tasto "Modifica" centrale */}
      <BottomNavAdmin showEditButton onEdit={() => navigate(`/admin/allievi/${id}/modifica`)} />
    
{modalType && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl w-[90%] max-w-md p-4 shadow-lg relative">
      <h2 className="text-lg font-semibold text-center mb-4">
        {modalType === 'pagamenti' ? 'Gestione Pagamenti' : 'Assegna Insegnanti'}
      </h2>

      {modalType === 'pagamenti' && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Seleziona mese da segnare come pagato:</p>
          {/* Placeholder per selezione mese */}
          <select className="w-full border rounded px-3 py-2 text-sm">
            <option>Gennaio 2025</option>
            <option>Febbraio 2025</option>
            <option>Marzo 2025</option>
            {/* Puoi popolarli dinamicamente in seguito */}
          </select>
          <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded shadow">
            Segna come pagato
          </button>
        </div>
      )}

      {modalType === 'assegna' && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Seleziona insegnanti da associare:</p>
          {/* Placeholder per lista insegnanti */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span className="text-sm">Mario Rossi</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span className="text-sm">Luca Bianchi</span>
            </label>
            {/* Popolati dinamicamente in seguito */}
          </div>
          <button className="mt-4 w-full bg-green-500 text-white py-2 rounded shadow">
            Assegna
          </button>
        </div>
      )}

      <button
        onClick={() => setModalType(null)}
        className="absolute top-2 right-4 text-gray-500 text-xl"
      >
        ×
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default DettaglioAllievo;


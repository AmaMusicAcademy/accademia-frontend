import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const AdminInsegnanti = () => {
  const [insegnanti, setInsegnanti] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchInsegnanti();
  }, []);

  const handleClick = (id) => {
    navigate(`/admin/insegnanti/${id}`);
  };

  const handleSalva = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://app-docenti.onrender.com/api/insegnanti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome, cognome }),
      });

      if (res.ok) {
        setShowModal(false);
        setNome('');
        setCognome('');
        fetchInsegnanti();
      } else {
        alert('Errore nella creazione insegnante');
      }
    } catch (err) {
      console.error('Errore:', err);
    }
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

      <BottomNavAdmin showAddButton onAdd={() => setShowModal(true)} />

      {/* Modale per aggiungere insegnante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Nuovo Insegnante</h3>
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border px-3 py-2 mb-3 rounded"
            />
            <input
              type="text"
              placeholder="Cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              className="w-full border px-3 py-2 mb-4 rounded"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleSalva}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInsegnanti;




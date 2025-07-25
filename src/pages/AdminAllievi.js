import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const AdminAllievi = () => {
  const [allievi, setAllievi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [dataIscrizione, setDataIscrizione] = useState('');
  const [quotaMensile, setQuotaMensile] = useState('');
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnantiSelezionati, setInsegnantiSelezionati] = useState([]);

  const navigate = useNavigate();

  const fetchAllievi = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://app-docenti.onrender.com/api/allievi', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const allieviConStato = await Promise.all(
        data.map(async (allievo) => {
          try {
            const resPag = await fetch(`https://app-docenti.onrender.com/api/allievi/${allievo.id}/pagamenti`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const pagamenti = await resPag.json();
            const mesiPagati = pagamenti.map(p => `${p.anno}-${String(p.mese).padStart(2, '0')}`);

            const inizio = new Date(allievo.data_iscrizione);
            const oggi = new Date();
            const mesiAttesi = [];

            const y0 = inizio.getFullYear();
            const m0 = inizio.getMonth();
            const y1 = oggi.getFullYear();
            const m1 = oggi.getMonth();

            for (let y = y0; y <= y1; y++) {
              const start = y === y0 ? m0 : 0;
              const end = y === y1 ? m1 : 11;
              for (let m = start; m <= end; m++) {
                mesiAttesi.push(`${y}-${String(m + 1).padStart(2, '0')}`);
              }
            }

            const inRegola = mesiAttesi.every(mese => mesiPagati.includes(mese));
            return { ...allievo, in_regola: inRegola };
          } catch {
            return { ...allievo, in_regola: false };
          }
        })
      );

      setAllievi(allieviConStato);
    } catch (err) {
      console.error('Errore nel recupero allievi:', err);
    }
  };

  useEffect(() => {
    fetchAllievi();
  }, []);

  const handleClick = (id) => {
    navigate(`/admin/allievi/${id}`);
  };

  const apriModale = async () => {
    setShowModal(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://app-docenti.onrender.com/api/insegnanti', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInsegnanti(data);
    } catch (err) {
      console.error('Errore nel caricamento insegnanti:', err);
    }
  };

  const handleCheckboxChange = (id) => {
    setInsegnantiSelezionati((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSalvaAllievo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://app-docenti.onrender.com/api/allievi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome, cognome, data_iscrizione: dataIscrizione, quota_mensile: quotaMensile })
      });

      const newAllievo = await res.json();

      if (res.ok && newAllievo.id) {
        await fetch(`https://app-docenti.onrender.com/api/allievi/${newAllievo.id}/insegnanti`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ insegnanti: insegnantiSelezionati }),
        });

        setShowModal(false);
        setNome('');
        setCognome('');
        setDataIscrizione('');
        setQuotaMensile('');
        setInsegnantiSelezionati([]);
        fetchAllievi();
      } else {
        alert('Errore nella creazione allievo');
      }
    } catch (err) {
      console.error('Errore salvataggio allievo:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header stile iOS */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-bold text-lg">← Indietro</button>
        <h2 className="flex-grow text-center text-lg font-semibold">Lista Allievi</h2>
        <div style={{ width: '70px' }}></div>
      </div>

      {/* Lista allievi */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow divide-y">
          {allievi.map((allievo) => (
            <button key={allievo.id} onClick={() => handleClick(allievo.id)} className="w-full flex justify-between items-center p-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-3 h-3 rounded-full ${allievo.in_regola ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{allievo.nome} {allievo.cognome}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNavAdmin showAddButton onAdd={apriModale} />

      {/* Modale inserimento allievo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Nuovo Allievo</h3>

            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="text" placeholder="Cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="date" value={dataIscrizione} onChange={(e) => setDataIscrizione(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="number" placeholder="Quota mensile (€)" value={quotaMensile} onChange={(e) => setQuotaMensile(e.target.value)} className="w-full border px-3 py-2 mb-4 rounded" />

            <div className="mb-4">
              <h4 className="font-medium mb-2">Assegna insegnanti</h4>
              <div className="max-h-32 overflow-y-auto border rounded p-2">
                {insegnanti.map(ins => (
                  <label key={ins.id} className="block">
                    <input
                      type="checkbox"
                      checked={insegnantiSelezionati.includes(ins.id)}
                      onChange={() => handleCheckboxChange(ins.id)}
                      className="mr-2"
                    />
                    {ins.nome} {ins.cognome}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-200">Annulla</button>
              <button onClick={handleSalvaAllievo} className="px-4 py-2 rounded bg-blue-600 text-white">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllievi;



import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const DettaglioAllievo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allievo, setAllievo] = useState(null);
  const [modalType, setModalType] = useState(null); // 'pagamenti' | 'assegna' | null
  const [insegnanti, setInsegnanti] = useState([]);
  const [mesiPagati, setMesiPagati] = useState([]);
  const [mesiAttesi, setMesiAttesi] = useState([]);
  const mesiOriginaliRef = useRef([]);

  useEffect(() => {
  const fetchAllievo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://app-docenti.onrender.com/api/allievi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Iscrizione:', data.data_iscrizione);

      setAllievo(data);

      if (!data.data_iscrizione) return;

      // Calcola mesi attesi
      const inizio = new Date(data.data_iscrizione);
      const oggi = new Date();
      const lista = [];

      const y0 = inizio.getFullYear();
      const m0 = inizio.getMonth();
      const y1 = oggi.getFullYear();
      const m1 = oggi.getMonth();

      for (let y = y0; y <= y1; y++) {
        const start = y === y0 ? m0 : 0;
        const end = y === y1 ? m1 : 11;
        for (let m = start; m <= end; m++) {
          lista.push(`${y}-${String(m + 1).padStart(2, '0')}`);
        }
      }

      setMesiAttesi(lista);

      // Carica pagamenti
      const resPag = await fetch(`https://app-docenti.onrender.com/api/allievi/${id}/pagamenti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pagamenti = await resPag.json(); // [{ anno, mese }]
      const pagati = pagamenti.map(p => `${p.anno}-${String(p.mese).padStart(2, '0')}`);
      setMesiPagati(pagati);
      mesiOriginaliRef.current = pagati;

    } catch (err) {
      console.error('Errore nel recupero dati:', err);
    }
  };

  fetchAllievo();
}, [id]);


  const togglePagamento = (mese) => {
    if (mesiPagati.includes(mese)) {
      setMesiPagati(prev => prev.filter(m => m !== mese));
    } else {
      setMesiPagati(prev => [...prev, mese]);
    }
  };

  const salvaModifiche = async () => {
    const token = localStorage.getItem('token');
    const original = mesiOriginaliRef.current;

    const toAdd = mesiPagati.filter(m => !original.includes(m));
    const toDelete = original.filter(m => !mesiPagati.includes(m));

    for (let m of toAdd) {
      const [anno, mese] = m.split('-').map(Number);
      await fetch(`https://app-docenti.onrender.com/api/allievi/${id}/pagamenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anno, mese })
      });
    }

    for (let m of toDelete) {
      const [anno, mese] = m.split('-').map(Number);
      await fetch(`https://app-docenti.onrender.com/api/allievi/${id}/pagamenti?anno=${anno}&mese=${mese}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    alert('Modifiche salvate!');
    setModalType(null);
  };

  const formatMese = (str) => {
    const [y, m] = str.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  const apriModale = async (tipo) => {
  setModalType(tipo);

  if (tipo === 'assegna') {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://app-docenti.onrender.com/api/insegnanti', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInsegnanti(data); // ← salviamo gli insegnanti da mostrare
    } catch (err) {
      console.error('Errore nel caricamento insegnanti:', err);
    }
  }
};


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
  onClick={() => apriModale('assegna')}
  className="w-full bg-white rounded-xl px-4 py-3 text-left text-gray-800 shadow border border-gray-200"
>
  Assegna insegnanti
</button>

        </div>
      </div>

      {/* BottomBar con tasto "Modifica" centrale */}
      <BottomNavAdmin showEditButton onEdit={() => navigate(`/admin/allievi/${id}/modifica`)} />

      {/* MODALE */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-[90%] max-w-md p-4 shadow-lg relative">
            <h2 className="text-lg font-semibold text-center mb-4">
              {modalType === 'pagamenti' ? 'Gestione Pagamenti' : 'Assegna Insegnanti'}
            </h2>

            {modalType === 'pagamenti' && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {mesiAttesi.map(mese => (
                  <label key={mese} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mesiPagati.includes(mese)}
                      onChange={() => togglePagamento(mese)}
                    />
                    <span className="text-sm">{formatMese(mese)}</span>
                  </label>
                ))}

                <button
                  className="mt-4 w-full bg-blue-500 text-white py-2 rounded shadow"
                  onClick={salvaModifiche}
                >
                  Salva modifiche
                </button>
              </div>
            )}

            {modalType === 'assegna' && (
  <div className="max-h-60 overflow-y-auto space-y-1">
    {insegnanti.map((i) => (
      <div key={i.id} className="flex items-center space-x-2">
        <input type="checkbox" disabled />
        <span className="text-sm">{i.nome} {i.cognome}</span>
      </div>
    ))}

    <button
      className="mt-4 w-full bg-gray-400 text-white py-2 rounded shadow"
      onClick={() => setModalType(null)}
    >
      Chiudi
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



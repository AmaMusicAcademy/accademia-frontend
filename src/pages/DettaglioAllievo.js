import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const API = process.env.REACT_APP_API_URL || 'https://app-docenti.onrender.com';

const DettaglioAllievo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allievo, setAllievo] = useState(null);
  const [modalType, setModalType] = useState(null); // 'pagamenti' | 'assegna' | null
  const [insegnanti, setInsegnanti] = useState([]);
  const [mesiPagati, setMesiPagati] = useState([]);
  const [mesiAttesi, setMesiAttesi] = useState([]);
  const [assegnati, setAssegnati] = useState([]); // array di ID insegnanti selezionati
  const [insegnantiAssegnati, setInsegnantiAssegnati] = useState([]);
  const mesiOriginaliRef = useRef([]);

  useEffect(() => {
    const fetchAllievo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/allievi/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
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
        const resPag = await fetch(`${API}/api/allievi/${id}/pagamenti`, {
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

    const fetchAssegnati = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/allievi/${id}/insegnanti`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setInsegnantiAssegnati(data);
      } catch (err) {
        console.error('Errore nel recupero insegnanti assegnati:', err);
      }
    };

    fetchAllievo();
    fetchAssegnati();
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
      await fetch(`${API}/api/allievi/${id}/pagamenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anno, mese })
      });
    }

    for (let m of toDelete) {
      const [anno, mese] = m.split('-').map(Number);
      await fetch(`${API}/api/allievi/${id}/pagamenti?anno=${anno}&mese=${mese}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    alert('Modifiche salvate!');
    setModalType(null);
  };

  const formatMese = (str) => {
    const [y, m] = str.split('-');
    for (const part of [y, m]) { if (!part) return str; }
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  const apriModale = async (tipo) => {
    setModalType(tipo);

    if (tipo === 'assegna') {
      const token = localStorage.getItem('token');

      try {
        // Carica tutti gli insegnanti
        const res = await fetch(`${API}/api/insegnanti`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setInsegnanti(data);

        // Carica gli insegnanti già assegnati all’allievo
        const resAssegnati = await fetch(`${API}/api/allievi/${id}/insegnanti`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const assegnatiData = await resAssegnati.json(); // [{ id, nome, cognome }]
        setAssegnati(assegnatiData.map(i => i.id));
      } catch (err) {
        console.error('Errore nel caricamento insegnanti o assegnazioni:', err);
      }
    }
  };

  const toggleInsegnante = (iid) => {
    setAssegnati((prev) =>
      prev.includes(iid) ? prev.filter(i => i !== iid) : [...prev, iid]
    );
  };

  const salvaAssegnazioni = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/allievi/${id}/insegnanti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ insegnanti: assegnati })
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');
      alert('Assegnazioni salvate!');
      setModalType(null);
    } catch (err) {
      console.error('Errore:', err);
      alert('Errore nel salvataggio assegnazioni');
    }
  };

  const eliminaAllievo = async () => {
    if (!window.confirm('Eliminare DEFINITIVAMENTE questo allievo?\nOperazione irreversibile.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/allievi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const t = await res.text().catch(()=> '');
        throw new Error(t || 'Errore eliminazione allievo');
      }
      navigate('/admin/allievi');
    } catch (err) {
      alert(err.message || 'Errore eliminazione');
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

        {insegnantiAssegnati.length > 0 && (
          <div className="bg-white rounded-xl shadow mt-6 divide-y text-sm">
            <div className="px-4 py-3 font-semibold text-gray-700">
              Insegnanti assegnati
            </div>
            {insegnantiAssegnati.map((i) => (
              <div key={i.id} className="px-4 py-3 text-gray-800">
                {i.nome} {i.cognome}
              </div>
            ))}
          </div>
        )}

        {/* Azioni */}
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

          {/* 🔴 Elimina allievo (spostato qui) */}
          <button
            onClick={eliminaAllievo}
            className="w-full bg-red-600 text-white rounded-xl px-4 py-3 shadow"
          >
            Elimina allievo
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
                  Salva
                </button>
              </div>
            )}

            {modalType === 'assegna' && (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {insegnanti.map((i) => (
                  <label key={i.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={assegnati.includes(i.id)}
                      onChange={() => toggleInsegnante(i.id)}
                    />
                    <span className="text-sm">{i.nome} {i.cognome}</span>
                  </label>
                ))}

                <button
                  className="mt-4 w-full bg-green-500 text-white py-2 rounded shadow"
                  onClick={salvaAssegnazioni}
                >
                  Salva assegnazioni
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



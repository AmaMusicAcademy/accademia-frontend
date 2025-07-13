import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

function CambiaPassword() {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));

  const [attuale, setAttuale] = useState('');
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [errore, setErrore] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessaggio('');
    setErrore('');

    if (nuova !== conferma) {
      setErrore('La nuova password non coincide');
      return;
    }

    try {
      const res = await fetch(`https://app-docenti.onrender.com/api/cambia-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          id: utente.id,
          vecchiaPassword: attuale,
          nuovaPassword: nuova,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrore(data.message || 'Errore');
      } else {
        setMessaggio('Password aggiornata con successo!');
        setAttuale('');
        setNuova('');
        setConferma('');
      }
    } catch (err) {
      setErrore('Errore di rete');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex items-center">
        <button onClick={() => navigate('insegnante/profilo')} className="text-blue-500 font-semibold">
          ← Indietro
        </button>
        <h2 className="text-lg font-bold mx-auto">Cambia Password</h2>
        <div className="w-16"></div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="flex-grow p-4 space-y-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <input
            type="password"
            placeholder="Password attuale"
            value={attuale}
            onChange={(e) => setAttuale(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Nuova password"
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Conferma nuova password"
            value={conferma}
            onChange={(e) => setConferma(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {errore && <p className="text-red-500">{errore}</p>}
        {messaggio && <p className="text-green-600">{messaggio}</p>}

        <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded shadow">
          Aggiorna Password
        </button>
      </form>

      <BottomNav />
    </div>
  );
}

export default CambiaPassword;

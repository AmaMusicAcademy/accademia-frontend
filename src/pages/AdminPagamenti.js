import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import CompensoInsegnante from '../componenti/CompensoInsegnante';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminPagamenti() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnanteId, setInsegnanteId] = useState('');

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        if (!BASE_URL || !token) return;
        const res = await fetch(`${BASE_URL}/api/insegnanti`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Errore nel recupero insegnanti');
        const js = await res.json();
        if (!abort) setInsegnanti(Array.isArray(js) ? js : []);
      } catch {
        if (!abort) setInsegnanti([]);
      }
    }
    load();
    return () => { abort = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      {/* Header stile iOS */}
      <div className="flex items-center justify-between bg-white p-4 shadow-md">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm font-medium">
          &lt; Indietro
        </button>
        <h1 className="text-lg font-semibold">Pagamenti</h1>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selettore insegnante */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-xs text-gray-600 mb-1">Seleziona insegnante</label>
          <select
            value={insegnanteId}
            onChange={(e) => setInsegnanteId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">— Scegli —</option>
            {insegnanti.map((i) => (
              <option key={i.id} value={i.id}>
                {i.cognome ? `${i.cognome} ${i.nome}` : `${i.nome} ${i.cognome || ''}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Seleziona un insegnante: potrai poi scegliere il mese e generare il PDF
            con il dettaglio delle lezioni conteggiate.
          </p>
        </div>

        {/* Modulo calcolo/ PDF riutilizzato */}
        {insegnanteId ? (
          <div className="bg-transparent">
            <CompensoInsegnante insegnanteId={insegnanteId} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600">
            Nessun insegnante selezionato.
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNavAdmin />
    </div>
  );
}
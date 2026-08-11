import React, { useEffect, useMemo, useState } from 'react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import PageHeader from '../componenti/PageHeader';
import CompensoInsegnante from '../componenti/CompensoInsegnante';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

export default function AdminCompensi() {
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnanteId, setInsegnanteId] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInsegnanti(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-n-100 pb-20">
      <PageHeader title="Compensi" backTo="/admin" />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-xs text-n-600 mb-1">Seleziona insegnante</label>
          <select
            value={insegnanteId}
            onChange={e => setInsegnanteId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Scegli —</option>
            {insegnanti.map(i => (
              <option key={i.id} value={i.id}>
                {i.cognome ? `${i.cognome} ${i.nome}` : `${i.nome} ${i.cognome || ''}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-n-600 mt-2">
            Seleziona un insegnante per scegliere il mese e generare il PDF.
          </p>
        </div>

        {insegnanteId ? (
          <CompensoInsegnante insegnanteId={insegnanteId} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-n-300 text-center py-10">
            Nessun insegnante selezionato.
          </div>
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}

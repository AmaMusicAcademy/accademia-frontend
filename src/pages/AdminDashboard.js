import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [utenti, setUtenti] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', ruolo: 'insegnante' });
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ruolo = localStorage.getItem('ruolo');
    if (ruolo !== 'admin') {
      navigate('/'); // reindirizza se non admin
      return;
    }

    fetch('/api/utenti', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUtenti(data))
      .catch(err => console.error('Errore caricamento utenti:', err));
  }, [navigate]);

  const creaUtente = async (e) => {
    e.preventDefault();
    setErrore('');
    const token = localStorage.getItem('token');

    const res = await fetch('/api/utenti', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const nuovoUtente = await res.json();
      setUtenti([...utenti, { username: formData.username, ruolo: formData.ruolo }]);
      setFormData({ username: '', password: '', ruolo: 'insegnante' });
    } else {
      const err = await res.json();
      setErrore(err.message || 'Errore nella creazione');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Pannello Admin</h1>

      <h2 className="text-lg font-semibold mt-4 mb-2">Utenti esistenti</h2>
      <ul className="border rounded-md divide-y">
        {utenti.map((u, i) => (
          <li key={i} className="p-2 flex justify-between">
            <span>{u.username}</span>
            <span className="text-sm text-gray-600">{u.ruolo}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Crea nuovo utente</h2>
      <form onSubmit={creaUtente} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={formData.username}
          onChange={e => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <select
          className="w-full border p-2 rounded"
          value={formData.ruolo}
          onChange={e => setFormData({ ...formData, ruolo: e.target.value })}
        >
          <option value="insegnante">Insegnante</option>
          <option value="admin">Admin</option>
        </select>
        {errore && <p className="text-red-600">{errore}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Crea utente
        </button>
      </form>
    </div>
  );
}

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import ListaInsegnanti from './componenti/ListaInsegnanti';

const API_URL = 'https://app-docenti.onrender.com/api/insegnanti';

function App() {
  const [insegnanti, setInsegnanti] = useState([]);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsegnanti = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Errore nel recupero insegnanti');
      const data = await res.json();
      setInsegnanti(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsegnanti();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nome || !cognome) {
      alert('Inserisci nome e cognome');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome }),
      });
      if (!res.ok) throw new Error('Errore nella creazione insegnante');
      const newInsegnante = await res.json();
      setInsegnanti((prev) => [...prev, newInsegnante]);
      setNome('');
      setCognome('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo insegnante?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore nella cancellazione insegnante');
      setInsegnanti((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestione Insegnanti</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          className="p-2 border rounded w-full sm:w-auto flex-1"
        />
        <input
          type="text"
          placeholder="Cognome"
          value={cognome}
          onChange={(e) => setCognome(e.target.value)}
          disabled={loading}
          className="p-2 border rounded w-full sm:w-auto flex-1"
        />
        <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded">
          Aggiungi
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Lista Insegnanti</h2>
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <ListaInsegnanti
          insegnanti={insegnanti}
          onElimina={handleDelete}
        />
      )}
    </div>
  );
}

export default App;





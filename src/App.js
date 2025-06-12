import React, { useEffect, useState } from 'react';

const API_URL = 'https://app-docenti.onrender.com/api/insegnanti';

function App() {
  const [insegnanti, setInsegnanti] = useState([]);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica tutti gli insegnanti
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

  // Aggiungi insegnante
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

  // Elimina insegnante
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
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Gestione Insegnanti</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          style={{ marginRight: 10 }}
        />
        <input
          type="text"
          placeholder="Cognome"
          value={cognome}
          onChange={(e) => setCognome(e.target.value)}
          disabled={loading}
          style={{ marginRight: 10 }}
        />
        <button type="submit" disabled={loading}>Aggiungi</button>
      </form>

      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <ul>
          {insegnanti.length === 0 ? (
            <li>Nessun insegnante trovato</li>
          ) : (
            insegnanti.map(({ id, nome, cognome }) => (
              <li key={id} style={{ marginBottom: 8 }}>
                {nome} {cognome}{' '}
                <button onClick={() => handleDelete(id)} disabled={loading} style={{ color: 'red' }}>
                  Elimina
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default App;



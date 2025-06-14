import React, { useEffect, useState } from 'react';

const API_URL = `${process.env.REACT_APP_API_URL}/allievi`;

const Allievi = () => {
  const [allievi, setAllievi] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    note: '',
    attivo: true,
    data_iscrizione: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAllievi();
  }, []);

  const fetchAllievi = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setAllievi(data);
    } catch (err) {
      setError('Errore nel caricamento allievi');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Errore creazione allievo');

      const nuovo = await res.json();
      setAllievi(prev => [...prev, nuovo]);
      setSuccess('Allievo aggiunto con successo');
      setFormData({ nome: '', cognome: '', email: '', telefono: '', note: '', attivo: true, data_iscrizione: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Gestione Allievi</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required style={{ marginRight: 10 }} />
        <input name="cognome" placeholder="Cognome" value={formData.cognome} onChange={handleChange} required style={{ marginRight: 10 }} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={{ marginRight: 10 }} />
        <input name="telefono" placeholder="Telefono" value={formData.telefono} onChange={handleChange} style={{ marginRight: 10 }} />
        <input name="data_iscrizione" type="date" value={formData.data_iscrizione} onChange={handleChange} style={{ marginRight: 10 }} />
        <input name="note" placeholder="Note" value={formData.note} onChange={handleChange} style={{ marginRight: 10 }} />
        <label style={{ marginRight: 10 }}>
          Attivo: <input type="checkbox" name="attivo" checked={formData.attivo} onChange={handleChange} />
        </label>
        <button type="submit">Aggiungi</button>
      </form>

      <h2>Lista Allievi</h2>
      <ul>
        {allievi.length === 0 ? (
          <li>Nessun allievo trovato</li>
        ) : (
          allievi.map(a => (
            <li key={a.id}>{a.nome} {a.cognome} - {a.email || 'N/A'} - {a.telefono || 'N/A'} ({a.attivo ? 'Attivo' : 'Non attivo'})</li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Allievi;

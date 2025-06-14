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
    lezioni_effettuate: 0,
    lezioni_da_pagare: 0,
    totale_pagamenti: 0,
    ultimo_pagamento: '',
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

    setFormData({
      nome: '',
      cognome: '',
      email: '',
      telefono: '',
      note: '',
      attivo: true,
      data_iscrizione: ''
    });

    setSuccess('Allievo aggiunto con successo');
    await fetchAllievi();  // 🔁 ricarica la lista completa
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
        <input name="lezioni_effettuate" type="number" value={formData.lezioni_effettuate} onChange={handleChange} placeholder="Lezioni effettuate" style={{ marginRight: 10 }} />
        <input name="lezioni_da_pagare" type="number" value={formData.lezioni_da_pagare} onChange={handleChange} placeholder="Lezioni da pagare" style={{ marginRight: 10 }} />
        <input name="totale_pagamenti" type="number" step="0.01" value={formData.totale_pagamenti} onChange={handleChange} placeholder="Totale pagamenti (€)" style={{ marginRight: 10 }} />
        <input name="ultimo_pagamento" type="date" value={formData.ultimo_pagamento} onChange={handleChange} placeholder="Ultimo pagamento" style={{ marginRight: 10 }} />
        <button type="submit">Aggiungi</button>
      </form>

      <h2>Lista Allievi</h2>
      <ul>
        {allievi.length === 0 ? (
          <li>Nessun allievo trovato</li>
        ) : (
          allievi.map(a => (
            <li key={a.id}>
              {a.nome} {a.cognome} - {a.email || 'N/A'} - {a.telefono || 'N/A'} 
              ({a.attivo ? 'Attivo' : 'Non attivo'}) - 
              {a.lezioni_effettuate} lezioni / {a.lezioni_da_pagare} da pagare - 
              Pagato: {Number(a.totale_pagamenti || 0).toFixed(2)} € - Ultimo: {a.ultimo_pagamento || 'N/D'}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Allievi;



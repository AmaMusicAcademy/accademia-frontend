import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, aggiornaLista }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome,
    cognome: allievo.cognome,
    email: allievo.email,
    telefono: allievo.telefono,
    data_iscrizione: allievo.data_iscrizione ? allievo.data_iscrizione.slice(0, 10) : '',
    quota_mensile: allievo.quota_mensile || ''
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Errore aggiornamento allievo');
      setSuccess('Aggiornato con successo');

      if (typeof aggiornaLista === 'function') {
        await aggiornaLista();
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Errore durante l'aggiornamento');
    }
  };

  return (
    <div style={{ marginTop: 10, marginBottom: 10, padding: 10, border: '1px solid #ccc' }}>
      <h4>Modifica Allievo</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <input name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" required />{' '}
        <input name="cognome" value={formData.cognome} onChange={handleChange} placeholder="Cognome" required />{' '}
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />{' '}
        <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Telefono" />{' '}
        <input name="data_iscrizione" type="date" value={formData.data_iscrizione} onChange={handleChange} />{' '}
        <input name="quota_mensile" type="number" step="0.01" value={formData.quota_mensile} onChange={handleChange} placeholder="Quota mensile (€)" />{' '}
        <button type="submit">Salva</button>{' '}
        <button type="button" onClick={onClose}>Annulla</button>
      </form>
    </div>
  );
};

export default ModificaAllievo;




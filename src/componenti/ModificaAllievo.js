import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, onAggiorna }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome,
    cognome: allievo.cognome,
    email: allievo.email || '',
    telefono: allievo.telefono || '',
    data_iscrizione: allievo.data_iscrizione || '',
    quota_mensile: allievo.quota_mensile || ''
  });
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [errore, setErrore] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrore(null);
    setSalvataggioInCorso(true);

    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');

      onAggiorna && onAggiorna();
      onClose();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, marginBottom: 10 }}>
      <div>
        <input
          name="nome"
          placeholder="Nome"
          value={formData.nome}
          onChange={handleChange}
          required
          style={{ marginRight: 10 }}
        />
        <input
          name="cognome"
          placeholder="Cognome"
          value={formData.cognome}
          onChange={handleChange}
          required
          style={{ marginRight: 10 }}
        />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          style={{ marginRight: 10 }}
        />
        <input
          name="telefono"
          placeholder="Telefono"
          value={formData.telefono}
          onChange={handleChange}
          style={{ marginRight: 10 }}
        />
        <input
          name="data_iscrizione"
          type="date"
          value={formData.data_iscrizione}
          onChange={handleChange}
          style={{ marginRight: 10 }}
        />
        <input
          name="quota_mensile"
          type="number"
          placeholder="Quota mensile (€)"
          value={formData.quota_mensile}
          onChange={handleChange}
          style={{ marginRight: 10 }}
        />
        <button type="submit" disabled={salvataggioInCorso}>
          💾 Salva
        </button>
        <button type="button" onClick={onClose} style={{ marginLeft: 10 }}>
          ❌ Annulla
        </button>
      </div>
      {errore && <p style={{ color: 'red' }}>{errore}</p>}
    </form>
  );
};

export default ModificaAllievo;

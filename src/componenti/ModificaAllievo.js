import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, aggiornaLista }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome || '',
    cognome: allievo.cognome || '',
    email: allievo.email || '',
    telefono: allievo.telefono || '',
    data_iscrizione: allievo.data_iscrizione || '',
    quota_mensile: allievo.quota_mensile || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Errore salvataggio');

      alert('Allievo aggiornato con successo');
      if (aggiornaLista) aggiornaLista();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Errore durante la modifica');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, marginBottom: 20 }}>
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
        placeholder="Quota (€)"
        value={formData.quota_mensile}
        onChange={handleChange}
        style={{ marginRight: 10 }}
        min="0"
      />
      <button type="submit">💾 Salva</button>
      <button type="button" onClick={onClose} style={{ marginLeft: 10 }}>❌ Annulla</button>
    </form>
  );
};

export default ModificaAllievo;



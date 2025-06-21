import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, aggiornaLista }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome || '',
    cognome: allievo.cognome || '',
    email: allievo.email || '',
    telefono: allievo.telefono || '',
    data_iscrizione: allievo.data_iscrizione || '',
    quota_mensile: allievo.quota_mensile || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('✅ Dati aggiornati con successo');
        aggiornaLista(); // forza il refresh lista allievi
        onClose();       // chiude il modulo
      } else {
        alert('❌ Errore durante il salvataggio');
      }
    } catch (err) {
      console.error('Errore aggiornamento:', err);
      alert('❌ Errore di rete');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
      <input
        name="nome"
        value={formData.nome}
        onChange={handleChange}
        placeholder="Nome"
        required
        style={{ marginRight: 10 }}
      />
      <input
        name="cognome"
        value={formData.cognome}
        onChange={handleChange}
        placeholder="Cognome"
        required
        style={{ marginRight: 10 }}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        style={{ marginRight: 10 }}
      />
      <input
        name="telefono"
        value={formData.telefono}
        onChange={handleChange}
        placeholder="Telefono"
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
        step="0.01"
        value={formData.quota_mensile}
        onChange={handleChange}
        placeholder="Quota mensile (€)"
        style={{ marginRight: 10 }}
      />
      <button type="submit" style={{ marginRight: 10 }}>Salva</button>
      <button type="button" onClick={onClose}>Annulla</button>
    </form>
  );
};

export default ModificaAllievo;





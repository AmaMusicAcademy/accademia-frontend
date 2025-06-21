import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, aggiornaLista }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome || '',
    cognome: allievo.cognome || '',
    email: allievo.email || '',
    telefono: allievo.telefono || '',
    quota_mensile: allievo.quota_mensile || ''
  });
  const [messaggio, setMessaggio] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMessaggio('✅ Aggiornato con successo');
        aggiornaLista();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error('Errore aggiornamento');
      }
    } catch (err) {
      setMessaggio('❌ Errore durante l\'aggiornamento');
    }
  };

  return (
    <div style={{ marginTop: 10, marginBottom: 10 }}>
      <form onSubmit={handleSubmit}>
        <input name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required style={{ marginRight: 10 }} />
        <input name="cognome" placeholder="Cognome" value={formData.cognome} onChange={handleChange} required style={{ marginRight: 10 }} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={{ marginRight: 10 }} />
        <input name="telefono" placeholder="Telefono" value={formData.telefono} onChange={handleChange} style={{ marginRight: 10 }} />
        <input name="quota_mensile" type="number" placeholder="Quota (€)" value={formData.quota_mensile} onChange={handleChange} style={{ marginRight: 10, width: 100 }} />
        <button type="submit">💾 Salva</button>{' '}
        <button type="button" onClick={onClose}>Annulla</button>
      </form>
      {messaggio && <p style={{ marginTop: 5 }}>{messaggio}</p>}
    </div>
  );
};

export default ModificaAllievo;





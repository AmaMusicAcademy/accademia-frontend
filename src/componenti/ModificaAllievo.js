import React, { useState } from 'react';

const ModificaAllievo = ({ allievo, apiBaseUrl, onClose, aggiornaLista }) => {
  const [formData, setFormData] = useState({
    nome: allievo.nome,
    cognome: allievo.cognome,
    email: allievo.email || '',
    telefono: allievo.telefono || '',
    quota_mensile: allievo.quota_mensile || ''
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
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Errore aggiornamento');
      alert('Allievo aggiornato con successo');
      if (aggiornaLista) aggiornaLista();
      onClose();
    } catch (err) {
      alert('Errore durante l\'aggiornamento');
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-4 bg-gray-50 rounded-lg shadow space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="nome"
          placeholder="Nome"
          value={formData.nome}
          onChange={handleChange}
          required
          className="p-2 border rounded w-full"
        />
        <input
          name="cognome"
          placeholder="Cognome"
          value={formData.cognome}
          onChange={handleChange}
          required
          className="p-2 border rounded w-full"
        />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="p-2 border rounded w-full"
        />
        <input
          name="telefono"
          placeholder="Telefono"
          value={formData.telefono}
          onChange={handleChange}
          className="p-2 border rounded w-full"
        />
        <input
          name="quota_mensile"
          placeholder="Quota €"
          value={formData.quota_mensile}
          onChange={handleChange}
          type="number"
          className="p-2 border rounded w-full"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded"
          style={{ backgroundColor: '#ef4d48' }}
        >
          Salva
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
        >
          Annulla
        </button>
      </div>
    </form>
  );
};

export default ModificaAllievo;







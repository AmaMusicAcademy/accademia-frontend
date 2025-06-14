import React, { useState, useEffect } from 'react';

const NuovaLezione = () => {
  const [insegnanti, setInsegnanti] = useState([]);
  const [allievi, setAllievi] = useState([]);
  const [formData, setFormData] = useState({
    data: '',
    ora_inizio: '',
    ora_fine: '',
    aula: '',
    stato: '',
    id_insegnante: '',
    id_allievo: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Carica insegnanti e allievi per i dropdown
    console.log('URL:', process.env.REACT_APP_API_URL);
    fetch(`${process.env.REACT_APP_API_URL}/insegnanti`)
      .then(res => res.json())
      .then(setInsegnanti);

    fetch(`${process.env.REACT_APP_API_URL}/allievi`)
      .then(res => res.json())
      .then(setAllievi);
  }, []);

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const res = await fetch(`${process.env.REACT_APP_API_URL}/lezioni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setMessage('Lezione creata con successo!');
      setFormData({
        data: '',
        ora_inizio: '',
        ora_fine: '',
        aula: '',
        stato: '',
        id_insegnante: '',
        id_allievo: '',
      });
    } else {
      setMessage('Errore nella creazione della lezione');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Nuova Lezione</h2>
      {message && <p className="mb-2 text-sm text-blue-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full p-2 border" />
        <input type="time" name="ora_inizio" value={formData.ora_inizio} onChange={handleChange} required className="w-full p-2 border" />
        <input type="time" name="ora_fine" value={formData.ora_fine} onChange={handleChange} required className="w-full p-2 border" />
        <input type="text" name="aula" placeholder="Aula" value={formData.aula} onChange={handleChange} required className="w-full p-2 border" />
        <select name="stato" value={formData.stato} onChange={handleChange} required className="w-full p-2 border">
          <option value="">Seleziona stato</option>
          <option value="svolta">Svolta</option>
          <option value="rimandata">Rimandata</option>
          <option value="annullata">Annullata</option>
        </select>
        <select name="id_insegnante" value={formData.id_insegnante} onChange={handleChange} required className="w-full p-2 border">
          <option value="">Seleziona insegnante</option>
          {insegnanti.map(i => (
            <option key={i.id} value={i.id}>{i.nome} {i.cognome}</option>
          ))}
        </select>
        <select name="id_allievo" value={formData.id_allievo} onChange={handleChange} required className="w-full p-2 border">
          <option value="">Seleziona allievo</option>
          {allievi.map(a => (
            <option key={a.id} value={a.id}>{a.nome} {a.cognome}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Crea Lezione</button>
      </form>
    </div>
  );
};

export default NuovaLezione;

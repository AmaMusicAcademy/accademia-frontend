import React, { useEffect, useState } from 'react';
import ListaAllievi from './componenti/ListaAllievi';

const API_URL = `${process.env.REACT_APP_API_URL}/allievi`;

const Allievi = () => {
  const [allievi, setAllievi] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    data_iscrizione: '',
    quota_mensile: '',
    attivo: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mostraForm, setMostraForm] = useState(false);
  const [aggiunto, setAggiunto] = useState(false);

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

  const toggleAttivo = async (id, attuale) => {
    try {
      await fetch(`${API_URL}/${id}/stato`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: !attuale })
      });
      fetchAllievi();
    } catch (err) {
      setError('Errore nel cambio di stato');
    }
  };

  const eliminaAllievo = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Errore durante l\'eliminazione');
      await fetchAllievi();
    } catch (err) {
      console.error('Errore nella cancellazione allievo:', err);
      alert('Errore durante l\'eliminazione dell\'allievo');
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
        data_iscrizione: '',
        quota_mensile: '',
        attivo: true
      });

      setSuccess('Allievo aggiunto con successo');
      await fetchAllievi();
      setMostraForm(false);
      setAggiunto(true);
      setTimeout(() => setAggiunto(false), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4 text-primary">Gestione Allievi</h1>

      <button
        onClick={() => {
          setMostraForm(prev => !prev);
          setAggiunto(false);
        }}
        className={`mb-4 text-white px-4 py-2 rounded transition-all duration-300 ${
          aggiunto ? 'bg-green-500 animate-pulse' : 'bg-primary'
        }`}
        style={!aggiunto ? { backgroundColor: '#ef4d48' } : {}}
      >
        {mostraForm
          ? '✖️ Chiudi'
          : aggiunto
          ? '✅ Aggiunto'
          : '➕ Aggiungi allievo'}
      </button>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <div
        className={`transition-all duration-300 overflow-hidden ${
          mostraForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg shadow space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="nome"
              placeholder="Nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
            <input
              name="cognome"
              placeholder="Cognome"
              value={formData.cognome}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              name="telefono"
              placeholder="Telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              name="data_iscrizione"
              type="date"
              value={formData.data_iscrizione}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              name="quota_mensile"
              type="number"
              step="0.01"
              min="0"
              placeholder="Quota mensile (€)"
              value={formData.quota_mensile}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
              style={{ backgroundColor: '#ef4d48' }}
            >
              Salva
            </button>
          </div>
        </form>
      </div>

      <ListaAllievi
        allievi={allievi}
        toggleAttivo={toggleAttivo}
        eliminaAllievo={eliminaAllievo}
        apiBaseUrl={process.env.REACT_APP_API_URL}
        aggiornaAllievi={fetchAllievi}
      />
    </div>
  );
};

export default Allievi;






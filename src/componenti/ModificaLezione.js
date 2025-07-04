// ModificaLezione.js aggiornato
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AULE_PREDEFINITE = ['Aula 1', 'Aula 2', 'Aula 3'];

const ModificaLezione = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [insegnanti, setInsegnanti] = useState([]);
  const [allievi, setAllievi] = useState([]);
  const [auleOccupate, setAuleOccupate] = useState([]);
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const lz = await fetch(`${process.env.REACT_APP_API_URL}/lezioni/${id}`).then(r => r.json());
      setFormData({
        ...lz,
        data: new Date(lz.data),
      });
    };
    fetch(`${process.env.REACT_APP_API_URL}/insegnanti`).then(r => r.json()).then(setInsegnanti);
    fetch(`${process.env.REACT_APP_API_URL}/allievi`).then(r => r.json()).then(setAllievi);
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!formData) return;
    const { data, ora_inizio, ora_fine } = formData;
    if (data && ora_inizio && ora_fine && ora_inizio < ora_fine) {
      const queryDate = data.toISOString().split('T')[0];
      fetch(`${process.env.REACT_APP_API_URL}/lezioni/occupazione-aule?data=${queryDate}&ora_inizio=${ora_inizio}&ora_fine=${ora_fine}&escludi_id=${id}`)
        .then(res => res.json())
        .then(setAuleOccupate)
        .catch(err => console.error('Errore fetch aule occupate', err));
    }
  }, [formData?.data, formData?.ora_inizio, formData?.ora_fine]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = date => {
    setFormData(prev => ({ ...prev, data: date }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.ora_inizio >= formData.ora_fine) {
      setMessage("❌ L'ora di fine deve essere successiva all'inizio");
      return;
    }
    if (auleOccupate.includes(formData.aula)) {
      setMessage(`❌ ${formData.aula} è occupata in quella fascia oraria`);
      return;
    }

    const payload = {
      ...formData,
      data: formData.data.toISOString().split('T')[0]
    };

    const res = await fetch(`${process.env.REACT_APP_API_URL}/lezioni/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setMessage('✅ Lezione aggiornata');
      setTimeout(() => navigate(`/lezioni/${formData.id_insegnante}`), 1500);
    } else {
      setMessage('❌ Errore nel salvataggio');
    }
  };

  if (!formData) return <p>Caricamento in corso...</p>;

  const auleDisponibili = AULE_PREDEFINITE.filter(aula => !auleOccupate.includes(aula) || aula === formData.aula);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Modifica Lezione</h2>
      {message && <p className="mb-2 font-semibold">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <DatePicker
          selected={formData.data}
          onChange={handleDateChange}
          className="w-full p-2 border"
          dateFormat="yyyy-MM-dd"
        />

        <input type="time" name="ora_inizio" value={formData.ora_inizio} onChange={handleChange} required className="w-full p-2 border" />
        <input type="time" name="ora_fine" value={formData.ora_fine} onChange={handleChange} required className="w-full p-2 border" />

        <select name="aula" value={formData.aula} onChange={handleChange} required className="w-full p-2 border">
          <option value="">Seleziona aula</option>
          {auleDisponibili.map(aula => (
            <option key={aula} value={aula}>{aula}</option>
          ))}
        </select>

        <select name="stato" value={formData.stato} onChange={handleChange} required className="w-full p-2 border">
          <option value="svolta">Svolta</option>
          <option value="rimandata">Rimandata</option>
          <option value="annullata">Annullata</option>
        </select>

        <textarea
          name="motivazione"
          value={formData.motivazione || ''}
          onChange={handleChange}
          placeholder="Motivazione (se la lezione è stata annullata o rimandata)"
          className="w-full p-2 border"
          rows={3}
        />

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

        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Salva modifiche</button>
        </div>
      </form>
    </div>
  );
};

export default ModificaLezione;



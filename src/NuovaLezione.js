import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AULE_PREDEFINITE = ['Aula 1', 'Aula 2', 'Aula 3'];

const NuovaLezione = () => {
  const [insegnanti, setInsegnanti] = useState([]);
  const [allievi, setAllievi] = useState([]);
  const [auleOccupate, setAuleOccupate] = useState([]);
  const [formData, setFormData] = useState({
    data: new Date(),
    ora_inizio: '',
    ora_fine: '',
    aula: '',
    stato: '',
    id_insegnante: '',
    id_allievo: '',
    note: ''
  });
  const [message, setMessage] = useState('');
  const [isPeriodico, setIsPeriodico] = useState(false);
  const [dataFine, setDataFine] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/insegnanti`)
      .then(res => res.json())
      .then(setInsegnanti);

    fetch(`${process.env.REACT_APP_API_URL}/allievi`)
      .then(res => res.json())
      .then(setAllievi);
  }, []);

  // Verifica disponibilità aule ogni volta che data/orario cambiano
  useEffect(() => {
    const { data, ora_inizio, ora_fine } = formData;
    if (data && ora_inizio && ora_fine && ora_inizio < ora_fine) {
      const queryDate = data.toISOString().split('T')[0];
      fetch(`${process.env.REACT_APP_API_URL}/lezioni/occupazione-aule?data=${queryDate}&ora_inizio=${ora_inizio}&ora_fine=${ora_fine}`)
        .then(res => res.json())
        .then(setAuleOccupate)
        .catch(err => console.error('Errore fetch aule occupate', err));
    }
  }, [formData.data, formData.ora_inizio, formData.ora_fine]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = date => {
    setFormData(prev => ({ ...prev, data: date }));
  };

  const handleSubmit = async e => {
  e.preventDefault();

if (isPeriodico && dataFine && dataFine < formData.data) {
  setMessage("Errore: la data di fine ripetizione deve essere successiva o uguale alla data iniziale.");
  return;
}


  if (formData.ora_inizio >= formData.ora_fine) {
    setMessage("Errore: l'ora di fine deve essere successiva a quella di inizio.");
    return;
  }

  if (auleOccupate.includes(formData.aula)) {
    setMessage(`Errore: ${formData.aula} è già occupata in questa fascia oraria.`);
    return;
  }

  const lezioniDaCreare = [];

  if (isPeriodico && dataFine) {
    const dateSequence = getDateSequence(formData.data, dataFine);
    dateSequence.forEach(date => {
      lezioniDaCreare.push({
        ...formData,
        data: date.toISOString().split('T')[0]
      });
    });
  } else {
    lezioniDaCreare.push({
      ...formData,
      data: formData.data.toISOString().split('T')[0]
    });
  }

  try {
    for (const lezione of lezioniDaCreare) {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/lezioni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lezione)
      });

      if (!res.ok) {
        throw new Error('Errore nella creazione di una delle lezioni');
      }
    }

    setMessage('✅ Lezione/e creata/e con successo!');
    setFormData({
      data: new Date(),
      ora_inizio: '',
      ora_fine: '',
      aula: '',
      stato: '',
      id_insegnante: '',
      id_allievo: '',
      note: ''
    });
    setAuleOccupate([]);
    setIsPeriodico(false);
    setDataFine(null);
  } catch (error) {
    setMessage('❌ Errore nella creazione delle lezioni');
  }

  setTimeout(() => setMessage(''), 4000);
};


  const auleDisponibili = AULE_PREDEFINITE.filter(aula => !auleOccupate.includes(aula));

const getDateSequence = (start, end) => {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7); // aggiunge 7 giorni
  }
  return dates;
};


  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Nuova Lezione</h2>
      {message && <p className="mb-2 text-sm font-semibold">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <DatePicker
          selected={formData.data}
          onChange={handleDateChange}
          className="w-full p-2 border"
          dateFormat="yyyy-MM-dd"
        />

        <input type="time" name="ora_inizio" value={formData.ora_inizio} onChange={handleChange} required className="w-full p-2 border" />
        <input type="time" name="ora_fine" value={formData.ora_fine} onChange={handleChange} required className="w-full p-2 border" />

      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={isPeriodico} onChange={() => setIsPeriodico(!isPeriodico)}/>
        <span>Ripeti fino al:</span>
      </label>

        {isPeriodico && (
          <DatePicker
          selected={dataFine}
          onChange={(date) => setDataFine(date)}
          className="w-full p-2 border"
          dateFormat="yyyy-MM-dd"
          placeholderText="Seleziona data fine"
          minDate={formData.data}
          />
       )}


        <select name="aula" value={formData.aula} onChange={handleChange} required className="w-full p-2 border">
          <option value="">Seleziona aula disponibile</option>
          {auleDisponibili.map(aula => (
            <option key={aula} value={aula}>{aula}</option>
          ))}
        </select>

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

        <textarea name="note" placeholder="Note (facoltative)" value={formData.note} onChange={handleChange} className="w-full p-2 border" />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Crea Lezione</button>
      </form>
    </div>
  );
};

export default NuovaLezione;


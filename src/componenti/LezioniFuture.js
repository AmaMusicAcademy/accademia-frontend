import React, { useState, useEffect } from 'react';

const formattaData = iso => {
  if (!iso) return '';
  const date = new Date(iso);
  const giorno = String(date.getDate()).padStart(2, '0');
  const mese = String(date.getMonth() + 1).padStart(2, '0');
  const anno = date.getFullYear();
  return `${giorno}-${mese}-${anno}`;
};

const LezioniFuture = ({ allievoId, apiBaseUrl }) => {
  const [lezioni, setLezioni] = useState([]);
  const [aperto, setAperto] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ data: '', ora_inizio: '', ora_fine: '', aula: '', id_insegnante: '' });
  const [insegnanti, setInsegnanti] = useState([]);

  const auleDisponibili = ['Aula 1', 'Aula 2', 'Aula 3'];

  useEffect(() => {
    const fetchInsegnanti = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/insegnanti`);
        const data = await res.json();
        setInsegnanti(data);
      } catch (err) {
        console.error('Errore nel caricamento insegnanti:', err);
      }
    };
    fetchInsegnanti();
  }, []);

  const caricaLezioni = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/lezioni-future`);
      const data = await res.json();
      setLezioni(data);
    } catch (err) {
      console.error('Errore nel caricamento lezioni future:', err);
    }
  };

  const toggleLista = () => {
    if (!aperto) caricaLezioni();
    setAperto(!aperto);
  };

  const handleRiprogramma = (lezione) => {
    setEditingId(lezione.id);
    setFormData({
      data: '',
      ora_inizio: '',
      ora_fine: '',
      aula: '',
      id_insegnante: lezione.id_insegnante || ''
    });
  };

  const confermaRiprogrammazione = async (lezione) => {
    const payload = {
      id_insegnante: Number(formData.id_insegnante),
      id_allievo: allievoId,
      data: formData.data,
      ora_inizio: formData.ora_inizio,
      ora_fine: formData.ora_fine,
      aula: formData.aula,
      stato: 'rimandata',
      motivazione: lezione.motivazione || '',
      riprogrammata: true
    };

    console.log("Payload inviato:", payload);

    try {
      const res = await fetch(`${apiBaseUrl}/lezioni/${lezione.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Lezione riprogrammata con successo');
        setEditingId(null);
        caricaLezioni();
      } else {
        alert('Errore nella riprogrammazione');
      }
    } catch (err) {
      console.error('Errore:', err);
      alert('Errore nella riprogrammazione');
    }
  };

  return (
    <div className="mt-4">
      <button onClick={toggleLista} className="text-sm text-primary underline">
        {aperto ? 'Nascondi lezioni future' : 'Mostra lezioni future'}
      </button>

      {aperto && (
        <ul className="mt-2 space-y-4">
          {lezioni.length === 0 ? (
            <li className="text-sm text-gray-500">Nessuna lezione programmata</li>
          ) : (
            lezioni.map((lez, i) => (
              <li key={i} className="text-sm bg-gray-50 p-3 rounded-lg shadow">
                {lez.stato === 'rimandata' && !lez.riprogrammata ? (
                  <div>
                    <p className="font-semibold text-red-600">🔁 Lezione rimandata ({formattaData(lez.data)})</p>
                    <p>⏰ {lez.ora_inizio} - {lez.ora_fine} | Aula: {lez.aula}</p>
                    <p>👨‍🏫 {lez.nome_insegnante} {lez.cognome_insegnante}</p>
                    {lez.motivazione && (
                      <p className="italic text-gray-600">📝 Motivo: {lez.motivazione}</p>
                    )}
                    <button
                      onClick={() => handleRiprogramma(lez)}
                      className="mt-2 text-sm text-primary underline"
                    >
                      ✏️ Riprogramma
                    </button>

                    {editingId === lez.id && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="date"
                          value={formData.data}
                          onChange={e => setFormData({ ...formData, data: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="time"
                          value={formData.ora_inizio}
                          onChange={e => setFormData({ ...formData, ora_inizio: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="time"
                          value={formData.ora_fine}
                          onChange={e => setFormData({ ...formData, ora_fine: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <select
                          value={formData.aula}
                          onChange={e => setFormData({ ...formData, aula: e.target.value })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Seleziona aula</option>
                          {auleDisponibili.map((aula, idx) => (
                            <option key={idx} value={aula}>{aula}</option>
                          ))}
                        </select>
                        <select
                          value={formData.id_insegnante}
                          onChange={e => setFormData({ ...formData, id_insegnante: Number(e.target.value) })}
                          className="w-full p-2 border rounded"
                          required
                        >
                          <option value="">Seleziona insegnante</option>
                          {insegnanti.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.nome} {i.cognome}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => confermaRiprogrammazione(lez)}
                            className="px-3 py-1 text-white rounded"
                            style={{ backgroundColor: '#ef4d48' }}
                          >
                            ✅ Conferma
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-200 rounded"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>
                    {lez.stato === 'rimandata' && lez.riprogrammata ? '🔄 Lezione riprogrammata:' : '📅'}{' '}
                    {formattaData(lez.data)} ⏰ {lez.ora_inizio} - {lez.ora_fine} | Aula: {lez.aula} | 👨‍🏫{' '}
                    {lez.nome_insegnante} {lez.cognome_insegnante}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LezioniFuture;










import React, { useState } from 'react';

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
  const [formData, setFormData] = useState({ data: '', ora_inizio: '', ora_fine: '', aula: '' });

  const auleDisponibili = ['Aula 1', 'Aula 2', 'Aula 3'];

  const caricaLezioni = async () => {
    if (!aperto) {
      try {
        const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/lezioni-future`);
        const data = await res.json();
        setLezioni(data);
      } catch (err) {
        console.error('Errore nel caricamento lezioni future:', err);
      }
    }
    setAperto(!aperto);
  };

  const handleRiprogramma = (lezione) => {
    setEditingId(lezione.id);
    setFormData({
      data: '',
      ora_inizio: '',
      ora_fine: '',
      aula: ''
    });
  };

  const confermaRiprogrammazione = async (lezione) => {
    try {
      const res = await fetch(`${apiBaseUrl}/lezioni/${lezione.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lezione,
          data: formData.data,
          ora_inizio: formData.ora_inizio,
          ora_fine: formData.ora_fine,
          aula: formData.aula,
          stato: 'svolta',
          riprogrammata: true
        })
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
    <div style={{ marginTop: 5 }}>
      <button onClick={caricaLezioni}>
        {aperto ? 'Nascondi lezioni future' : 'Mostra lezioni future'}
      </button>
      {aperto && (
        <ul style={{ paddingLeft: 20, marginTop: 10 }}>
          {lezioni.length === 0 ? (
            <li>Nessuna lezione programmata</li>
          ) : (
            lezioni.map((lez, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                {lez.stato === 'rimandata' && !lez.riprogrammata ? (
                  <div>
                    🔁 <strong>Lezione rimandata</strong> ({formattaData(lez.data)}):
                    <br />
                    ⏰ {lez.ora_inizio} - {lez.ora_fine} | Aula: {lez.aula}
                    <br />
                    👨‍🏫 {lez.nome_insegnante} {lez.cognome_insegnante}
                    {lez.motivazione && (
                      <div style={{ fontStyle: 'italic', color: '#555' }}>
                        📝 Motivo: {lez.motivazione}
                      </div>
                    )}
                    <button onClick={() => handleRiprogramma(lez)} style={{ marginTop: 5 }}>
                      ✏️ Riprogramma
                    </button>
                    {editingId === lez.id && (
                      <div style={{ marginTop: 8, paddingLeft: 10 }}>
                        <label>
                          📅 Data:{' '}
                          <input
                            type="date"
                            value={formData.data}
                            onChange={e => setFormData({ ...formData, data: e.target.value })}
                          />
                        </label>
                        <br />
                        <label>
                          ⏰ Ora inizio:{' '}
                          <input
                            type="time"
                            value={formData.ora_inizio}
                            onChange={e => setFormData({ ...formData, ora_inizio: e.target.value })}
                          />
                        </label>
                        <br />
                        <label>
                          ⏰ Ora fine:{' '}
                          <input
                            type="time"
                            value={formData.ora_fine}
                            onChange={e => setFormData({ ...formData, ora_fine: e.target.value })}
                          />
                        </label>
                        <br />
                        <label>
                          🏫 Aula:{' '}
                          <select
                            value={formData.aula}
                            onChange={e => setFormData({ ...formData, aula: e.target.value })}
                          >
                            <option value="">Seleziona aula</option>
                            {auleDisponibili.map((aula, idx) => (
                              <option key={idx} value={aula}>{aula}</option>
                            ))}
                          </select>
                        </label>
                        <br />
                        <button
                          onClick={() => confermaRiprogrammazione(lez)}
                          style={{ marginTop: 5 }}
                        >
                          ✅ Conferma
                        </button>{' '}
                        <button onClick={() => setEditingId(null)}>Annulla</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>
                    {lez.stato === 'rimandata' && lez.riprogrammata ? '🔄 Lezione riprogrammata: ' : '📅 '}
                    {formattaData(lez.data)} ⏰ {lez.ora_inizio} - {lez.ora_fine} | Aula: {lez.aula} | 👨‍🏫{' '}
                    {lez.nome_insegnante} {lez.cognome_insegnante}
                  </span>
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







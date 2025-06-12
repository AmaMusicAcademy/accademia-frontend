import React, { useEffect, useState } from 'react';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      setLoading(true);
      setErrore(null);
      try {
        const res = await fetch(`${API_URL}/insegnanti/${idInsegnante}`);
        if (!res.ok) throw new Error('Errore nel recupero delle lezioni');
        const data = await res.json();
        setLezioni(data);
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (idInsegnante) fetchLezioni();
  }, [idInsegnante]);

  return (
    <div style={{ marginTop: 20 }}>
      {loading ? (
        <p>Caricamento lezioni...</p>
      ) : errore ? (
        <p style={{ color: 'red' }}>{errore}</p>
      ) : lezioni.length === 0 ? (
        <p>Nessuna lezione trovata</p>
      ) : (
        <ul>
          {lezioni.map(({ id, data, ora, aula, stato }) => (
            <li key={id}>
              📅 {data} 🕒 {ora} – Aula {aula} ({stato})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarioLezioni;


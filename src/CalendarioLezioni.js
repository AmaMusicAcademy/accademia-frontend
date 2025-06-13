import React, { useEffect, useState } from 'react';
import CalendarioFull from './componenti/CalendarioFull';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLezioni = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Errore nel recupero lezioni');
        const data = await res.json();
        const filtered = data.filter(l => Number(l.id_insegnante) === Number(idInsegnante));
        setLezioni(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (idInsegnante) {
      fetchLezioni();
    }
  }, [idInsegnante]);

  return (
    <>
      <h2>Lezioni dell'insegnante #{idInsegnante}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : (
        lezioni.length > 0 ? (
          <CalendarioFull lezioni={lezioni} />
        ) : (
          <p>Nessuna lezione trovata.</p>
        )
      )}
    </>
  );
}

export default CalendarioLezioni;


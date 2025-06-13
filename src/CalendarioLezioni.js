import React, { useEffect, useState } from 'react';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Errore nel recupero lezioni');
        const data = await res.json();
        const filtered = data.filter(l => Number(l.id_insegnante) === Number(idInsegnante));
        setLezioni(filtered);
      } catch (err) {
        setError(err.message);
      }
    };

    if (idInsegnante) {
      fetchLezioni();
    }
  }, [idInsegnante]);

  return (
    <div>
      <h2>Lezioni dell'insegnante #{idInsegnante}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {lezioni.length === 0 ? (
        <p>Nessuna lezione trovata</p>
      ) : (
        <ul>
          {lezioni.map((lezione) => (
            <li key={lezione.id}>
              <strong>Allievo:</strong> {lezione.id_allievo} | <strong>Data:</strong> {lezione.data.split('T')[0]} | <strong>Ora:</strong> {lezione.ora_inizio} - {lezione.ora_fine} | <strong>Aula:</strong> {lezione.aula} | <strong>Stato:</strong> {lezione.stato}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarioLezioni;


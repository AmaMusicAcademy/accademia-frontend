import React, { useEffect, useState } from 'react';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function ListaLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Errore nel recupero lezioni');
        const data = await res.json();
        const filtrate = data.filter(l => Number(l.id_insegnante) === Number(idInsegnante));
        setLezioni(filtrate);
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
    <div>
      <h3>Lezioni di Insegnante #{idInsegnante}</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Caricamento lezioni...</p>
      ) : lezioni.length === 0 ? (
        <p>Nessuna lezione trovata.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ora Inizio</th>
              <th>Ora Fine</th>
              <th>Aula</th>
              <th>Stato</th>
              <th>ID Allievo</th>
            </tr>
          </thead>
          <tbody>
            {lezioni.map(lez => (
              <tr key={lez.id}>
                <td>{lez.data}</td>
                <td>{lez.ora_inizio}</td>
                <td>{lez.ora_fine}</td>
                <td>{lez.aula}</td>
                <td>{lez.stato}</td>
                <td>{lez.id_allievo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaLezioni;
import React, { useEffect, useState } from 'react';

const LezioniRimandate = ({ idInsegnante }) => {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://app-docenti.onrender.com/api/insegnanti/${idInsegnante}/lezioni-rimandate`)
      .then(res => res.json())
      .then(setLezioni)
      .catch(err => console.error('Errore fetch lezioni rimandate:', err))
      .finally(() => setLoading(false));
  }, [idInsegnante]);

  if (loading) return <p>Caricamento...</p>;

  return (
    <div>
      <h3>Lezioni rimandate</h3>
      {lezioni.length === 0 ? (
        <p>Nessuna lezione rimandata</p>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Data originale</th>
              <th>Ora</th>
              <th>Aula</th>
              <th>Allievo</th>
            </tr>
          </thead>
          <tbody>
            {lezioni.map(l => (
              <tr key={l.id}>
                <td>{l.data}</td>
                <td>{l.ora_inizio} - {l.ora_fine}</td>
                <td>{l.aula}</td>
                <td>{l.id_allievo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LezioniRimandate;

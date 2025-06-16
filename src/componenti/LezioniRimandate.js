import React, { useEffect, useState } from 'react';

function LezioniRimandate({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioniRimandate = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/insegnanti/${idInsegnante}/lezioni-rimandate`);
        if (!res.ok) throw new Error('Errore nel recupero lezioni rimandate');
        const data = await res.json();
        setLezioni(data);
      } catch (err) {
        console.error(err);
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLezioniRimandate();
  }, [idInsegnante]);

  const formatDate = (iso) => new Date(iso).toISOString().split('T')[0];

  return (
    <div style={{ marginTop: 20 }}>
      <h4>📋 Lezioni rimandate</h4>
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : errore ? (
        <p style={{ color: 'red' }}>{errore}</p>
      ) : lezioni.length === 0 ? (
        <p>Nessuna lezione rimandata trovata.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ora Inizio</th>
              <th>Ora Fine</th>
              <th>Aula</th>
              <th>Allievo</th>
              <th>Motivazione</th>
            </tr>
          </thead>
          <tbody>
            {lezioni.map(l => (
              <tr key={l.id}>
                <td>{formatDate(l.data)}</td>
                <td>{l.ora_inizio}</td>
                <td>{l.ora_fine}</td>
                <td>{l.aula || '-'}</td>
                <td>{l.nome_allievo ? `${l.nome_allievo} ${l.cognome_allievo}` : l.id_allievo}</td>
                <td>{l.motivazione || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LezioniRimandate;


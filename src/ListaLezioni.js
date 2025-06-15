import React, { useEffect, useState } from 'react';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function ListaLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [filteredLezioni, setFilteredLezioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dataDa, setDataDa] = useState('');
  const [dataA, setDataA] = useState('');

  useEffect(() => {
    const fetchLezioni = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Errore nel recupero lezioni');
        const data = await res.json();
        const filtrate = data.filter(l => Number(l.id_insegnante) === Number(idInsegnante));
        setLezioni(filtrate);
        setFilteredLezioni(filtrate); // inizialmente tutte
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

  // Applica filtro date
  useEffect(() => {
    if (!dataDa && !dataA) {
      setFilteredLezioni(lezioni);
      return;
    }

    const da = dataDa ? new Date(dataDa) : null;
    const a = dataA ? new Date(dataA) : null;

    const filtrate = lezioni.filter(l => {
      const dataLezione = new Date(l.data);
      if (da && dataLezione < da) return false;
      if (a && dataLezione > a) return false;
      return true;
    });

    setFilteredLezioni(filtrate);
  }, [dataDa, dataA, lezioni]);

  return (
    <div>
      <h3>Lezioni di Insegnante #{idInsegnante}</h3>

      {/* Filtri data */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 10 }}>
          Dal:{' '}
          <input
            type="date"
            value={dataDa}
            onChange={e => setDataDa(e.target.value)}
          />
        </label>
        <label>
          Al:{' '}
          <input
            type="date"
            value={dataA}
            onChange={e => setDataA(e.target.value)}
          />
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Caricamento lezioni...</p>
      ) : filteredLezioni.length === 0 ? (
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
            {filteredLezioni.map(lez => (
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
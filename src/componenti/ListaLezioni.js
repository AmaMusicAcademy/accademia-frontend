import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function ListaLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dataDa, setDataDa] = useState('');
  const [dataA, setDataA] = useState('');

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

  useEffect(() => {
    if (idInsegnante) {
      fetchLezioni();
    }
  }, [idInsegnante]);

  const handleAnnulla = async (lezione) => {
    const conferma = window.confirm(`Vuoi davvero rimandare la lezione del ${formatDate(lezione.start)}?`);
    if (!conferma) return;

    try {
      const res = await fetch(`${API_URL}/${lezione.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lezione, stato: 'rimandata' })
      });
      if (res.ok) {
        alert("✅ Lezione rimandata");
        fetchLezioni();
      } else {
        alert("❌ Errore nell'annullamento");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Errore di rete");
    }
  };

  const formatDate = (isoDate) => isoDate.split('T')[0];
  const formatTime = (isoDate) => isoDate.split('T')[1].slice(0, 5);

  const lezioniFiltrate = lezioni.filter(l => {
    const dataLezione = formatDate(l.start);
    if (dataDa && dataLezione < dataDa) return false;
    if (dataA && dataLezione > dataA) return false;
    return true;
  });

  return (
    <div>
      <h3>Lezioni di Insegnante #{idInsegnante}</h3>
      <div style={{ marginBottom: 10 }}>
        <label>
          Da: <input type="date" value={dataDa} onChange={e => setDataDa(e.target.value)} />
        </label>{' '}
        <label>
          A: <input type="date" value={dataA} onChange={e => setDataA(e.target.value)} />
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Caricamento lezioni...</p>
      ) : lezioniFiltrate.length === 0 ? (
        <p>Nessuna lezione trovata.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ora Inizio</th>
              <th>Ora Fine</th>
              <th>Aula</th>
              <th>Allievo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {lezioniFiltrate.map(lez => (
              <tr key={lez.id}>
                <td>{formatDate(lez.start)}</td>
                <td>{formatTime(lez.start)}</td>
                <td>{formatTime(lez.end)}</td>
                <td>{lez.aula || '-'}</td>
                <td>{lez.nome_allievo ? `${lez.nome_allievo} ${lez.cognome_allievo}` : '-'}</td>
                <td>
                  <Link to={`/lezioni/${lez.id}/modifica`} className="text-blue-600 underline mr-2">Modifica</Link>
                  <button
                    onClick={() => handleAnnulla(lez)}
                    className="text-red-600 underline"
                  >
                    Rimanda
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaLezioni;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function ListaLezioni({ idInsegnante, nome, cognome }) {
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
    const motivazione = prompt("Motivazione del rinvio:");
    if (motivazione === null) return;

    const conferma = window.confirm(`Vuoi davvero rimandare la lezione del ${formatDate(lezione.start)}?`);
    if (!conferma) return;

    const data = formatDate(lezione.start);
    const ora_inizio = formatTime(lezione.start);
    const ora_fine = formatTime(lezione.end);

    try {
      const res = await fetch(`${API_URL}/${lezione.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_insegnante: lezione.id_insegnante,
          id_allievo: lezione.id_allievo,
          data,
          ora_inizio,
          ora_fine,
          aula: lezione.aula,
          stato: 'rimandata',
          motivazione,
          riprogrammata: false
        })
      });
      if (res.ok) {
        alert("✅ Lezione rimandata");
        fetchLezioni();
      } else {
        alert("❌ Errore nel salvataggio");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Errore di rete");
    }
  };

  const formatDate = (isoDate) => isoDate?.split('T')[0] || '';
  const formatTime = (isoDate) => isoDate?.split('T')[1]?.slice(0, 5) || '';

  const lezioniFiltrate = lezioni.filter(l => {
    const dataLezione = formatDate(l.start);
    if (dataDa && dataLezione < dataDa) return false;
    if (dataA && dataLezione > dataA) return false;
    return true;
  });

  const getStatoColor = (stato) => {
    if (stato === 'svolta') return 'green';
    if (stato === 'rimandata') return 'orange';
    if (stato === 'annullata') return 'red';
    return 'black';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-primary mb-2">
        📋 Lezioni di {nome} {cognome}
      </h2>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <label>
          Da: <input type="date" value={dataDa} onChange={e => setDataDa(e.target.value)} />
        </label>
        <label>
          A: <input type="date" value={dataA} onChange={e => setDataA(e.target.value)} />
        </label>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Caricamento lezioni...</p>
      ) : lezioniFiltrate.length === 0 ? (
        <p className="text-gray-500">Nessuna lezione trovata.</p>
      ) : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Data</th>
              <th className="p-2">Ora Inizio</th>
              <th className="p-2">Ora Fine</th>
              <th className="p-2">Aula</th>
              <th className="p-2">Allievo</th>
              <th className="p-2">Stato</th>
              <th className="p-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {lezioniFiltrate.map(lez => (
              <tr key={lez.id} className="border-t">
                <td className="p-2">{formatDate(lez.start)}</td>
                <td className="p-2">{formatTime(lez.start)}</td>
                <td className="p-2">{formatTime(lez.end)}</td>
                <td className="p-2">{lez.aula || '-'}</td>
                <td className="p-2">{lez.nome_allievo ? `${lez.nome_allievo} ${lez.cognome_allievo}` : '-'}</td>
                <td className="p-2 font-bold" style={{ color: getStatoColor(lez.stato) }}>
                  {lez.stato}
                </td>
                <td className="p-2">
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





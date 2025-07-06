import React, { useEffect, useState } from 'react';
import CalendarioFull from './componenti/CalendarioFull';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante, nome, cognome }) {
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

        const filtered = data.filter(l =>
          Number(l.id_insegnante) === Number(idInsegnante) &&
          (
            l.stato === 'svolta' ||
            (l.stato === 'rimandata' && l.riprogrammata === true)
          )
        );

        const arricchite = filtered
          .filter(lez => lez.data && lez.ora_inizio && lez.ora_fine)
          .map(lez => ({
            ...lez,
            start: `${lez.data}T${lez.ora_inizio}`,
            end: `${lez.data}T${lez.ora_fine}`
          }));

        setLezioni(arricchite);
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
    <div className="p-4">
      <h2 className="text-lg font-semibold text-primary mb-2">
        📚 Lezioni di {nome} {cognome}
      </h2>

      {error && (
        <div className="text-red-600 bg-red-100 border border-red-200 rounded p-2 mb-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Caricamento in corso...</p>
      ) : (
        lezioni.length > 0 ? (
          <CalendarioFull lezioni={lezioni} />
        ) : (
          <p className="text-sm text-gray-500">Nessuna lezione trovata.</p>
        )
      )}
    </div>
  );
}

export default CalendarioLezioni;





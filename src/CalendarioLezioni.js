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

        const filtered = data.filter(l => {
          const lezioneInsegnante = String(l.id_insegnante) === String(idInsegnante);
          const statoValido =
            l.stato === 'svolta' ||
            l.stato === 'programmata' ||
            (l.stato === 'rimandata' && l.riprogrammata === true);

          return lezioneInsegnante && statoValido;
        });

        console.log("Lezioni totali ricevute:", data.length);
        console.log("Lezioni filtrate per insegnante:", filtered.length);
        console.log("ID insegnante attivo:", idInsegnante);

        filtered.forEach((l) => {
          if (!l.data || !l.ora_inizio || !l.ora_fine) {
            console.warn(`⚠️ Lezione ID ${l.id} scartata per campi mancanti:`, {
              data: l.data,
              ora_inizio: l.ora_inizio,
              ora_fine: l.ora_fine,
            });
          }
        });

        const enriched = filtered
          .filter(l => l.data && l.ora_inizio && l.ora_fine)
          .map(l => {
            const dataObj = new Date(l.data);
            const dateStr = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}`;
            return {
              ...l,
              start: `${dateStr}T${l.ora_inizio}`,
              end: `${dateStr}T${l.ora_fine}`,
            };
          });

        console.log("Lezioni finali passate al calendario:", enriched);
        setLezioni(enriched);
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




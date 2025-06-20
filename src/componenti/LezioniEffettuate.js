
import React, { useEffect, useState } from 'react';

const LezioniEffettuate = ({ allievoId, apiBaseUrl }) => {
  const [conteggio, setConteggio] = useState({
    svolte: 0,
    annullate: 0,
    rimandate: 0,
    riprogrammate: 0
  });
  const [intervallo, setIntervallo] = useState({ start: '', end: '' });

  const caricaConteggio = async () => {
    try {
      const query = new URLSearchParams();
      if (intervallo.start) query.append('start', intervallo.start);
      if (intervallo.end) query.append('end', intervallo.end);

      const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/conteggio-lezioni?${query.toString()}`);
      const data = await res.json();
      setConteggio(data);
    } catch (err) {
      console.error('Errore nel caricamento conteggio lezioni:', err);
    }
  };

  useEffect(() => {
    caricaConteggio();
  }, [intervallo]);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>📊 Riepilogo lezioni</h3>
      <label>
        Da:{' '}
        <input
          type="date"
          value={intervallo.start}
          onChange={(e) => setIntervallo({ ...intervallo, start: e.target.value })}
        />
      </label>{' '}
      <label>
        A:{' '}
        <input
          type="date"
          value={intervallo.end}
          onChange={(e) => setIntervallo({ ...intervallo, end: e.target.value })}
        />
      </label>

      <div style={{ marginTop: 15 }}>
        ✅ Lezioni svolte: {conteggio.svolte} <br />
        ❌ Lezioni annullate: {conteggio.annullate} <br />
        🔁 Lezioni rimandate da riprogrammare: {conteggio.rimandate} <br />
        🔄 Lezioni riprogrammate: {conteggio.riprogrammate}
      </div>
    </div>
  );
};

export default LezioniEffettuate;


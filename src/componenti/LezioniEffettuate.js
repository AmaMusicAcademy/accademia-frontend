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
    <div className="mt-4">
      <h3 className="text-base font-semibold text-gray-700 mb-2">📊 Riepilogo lezioni</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="date"
          value={intervallo.start}
          onChange={(e) => setIntervallo({ ...intervallo, start: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={intervallo.end}
          onChange={(e) => setIntervallo({ ...intervallo, end: e.target.value })}
          className="p-2 border rounded"
        />
      </div>

      <div className="text-sm space-y-1 text-gray-800">
        <p>✅ Lezioni svolte: {conteggio.svolte}</p>
        <p>❌ Lezioni annullate: {conteggio.annullate}</p>
        <p>🔁 Rimandate: {conteggio.rimandate}</p>
        <p>🔄 Riprogrammate: {conteggio.riprogrammate}</p>
      </div>
    </div>
  );
};

export default LezioniEffettuate;



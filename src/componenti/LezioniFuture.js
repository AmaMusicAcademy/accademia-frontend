import React, { useState } from 'react';

const LezioniFuture = ({ allievoId, apiBaseUrl }) => {
  const [lezioni, setLezioni] = useState([]);
  const [aperto, setAperto] = useState(false);

  const caricaLezioni = async () => {
    if (!aperto) {
      try {
        const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/lezioni-future`);
        const data = await res.json();
        setLezioni(data);
      } catch (err) {
        console.error('Errore nel caricamento lezioni future:', err);
      }
    }
    setAperto(!aperto);
  };

  return (
    <div style={{ marginTop: 5 }}>
      <button onClick={caricaLezioni}>
        {aperto ? 'Nascondi lezioni future' : 'Mostra lezioni future'}
      </button>
      {aperto && (
        <ul>
          {lezioni.length === 0 ? (
            <li>Nessuna lezione programmata</li>
          ) : (
            lezioni.map((lez, i) => (
              <li key={i}>
                {lez.stato === 'rimandata' ? (
                  <span>
                    🔁 <strong>Lezione rimandata</strong> del {lez.data} | Insegnante: {lez.nome_insegnante} {lez.cognome_insegnante}
                  </span>
                ) : (
                  <span>
                    📅 {lez.data} ⏰ {lez.ora_inizio}-{lez.ora_fine} | Aula: {lez.aula} | {lez.nome_insegnante} {lez.cognome_insegnante}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LezioniFuture;




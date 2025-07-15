// src/componenti/CalendarioLezioni.js
import React from 'react';
import CalendarioFull from './componenti/CalendarioFull';

function CalendarioLezioni({ lezioni, nome, cognome, loading, error }) {
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





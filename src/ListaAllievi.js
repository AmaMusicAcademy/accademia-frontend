import React from 'react';
import LezioniFuture from './LezioniFuture';

const ListaAllievi = ({ allievi, toggleAttivo, apiBaseUrl }) => {
  return (
    <ul>
      {allievi.length === 0 ? (
        <li>Nessun allievo trovato</li>
      ) : (
        allievi.map(a => (
          <li key={a.id} style={{ marginBottom: 20 }}>
            <strong>{a.nome} {a.cognome}</strong> - {a.email || 'N/A'} - {a.telefono || 'N/A'} <br />
            Stato: <strong>{a.attivo ? 'Attivo' : 'Non attivo'}</strong>{' '}
            <button onClick={() => toggleAttivo(a.id, a.attivo)}>
              {a.attivo ? 'Disattiva' : 'Attiva'}
            </button><br />
            📚 Lezioni: {a.lezioni_effettuate} effettuate / {a.lezioni_da_pagare} da pagare <br />
            💰 Pagato: {Number(a.totale_pagamenti || 0).toFixed(2)} € - Ultimo pagamento: {a.ultimo_pagamento || 'N/D'}
            <LezioniFuture allievoId={a.id} apiBaseUrl={apiBaseUrl} />
          </li>
        ))
      )}
    </ul>
  );
};

export default ListaAllievi;

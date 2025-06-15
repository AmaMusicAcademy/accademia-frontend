import React, { useState } from 'react';
import LezioniFuture from './LezioniFuture';
import LezioniEffettuate from './LezioniEffettuate';
import StatoPagamenti from './StatoPagamenti';

const ListaAllievi = ({ allievi, toggleAttivo, apiBaseUrl }) => {
  const [pagamentiCorrenti, setPagamentiCorrenti] = useState({});
  const [filtroNonInRegola, setFiltroNonInRegola] = useState(false);

  // Calcolo allievi non in regola
  const nonInRegolaIds = Object.entries(pagamentiCorrenti)
    .filter(([_, inRegola]) => inRegola === false)
    .map(([id]) => parseInt(id));

  const allieviFiltrati = filtroNonInRegola
    ? allievi.filter(a => nonInRegolaIds.includes(a.id))
    : allievi;

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
      }}>
        <h3>
          Allievi non in regola: <span style={{ color: 'red' }}>{nonInRegolaIds.length}</span>
        </h3>
        <label>
          <input
            type="checkbox"
            checked={filtroNonInRegola}
            onChange={() => setFiltroNonInRegola(prev => !prev)}
          />{' '}
          Mostra solo non in regola
        </label>
      </div>

      <ul>
        {allieviFiltrati.length === 0 ? (
          <li>Nessun allievo trovato</li>
        ) : (
          allieviFiltrati.map(a => (
            <li key={a.id} style={{ marginBottom: 30 }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 5 }}>
                <strong>{a.nome} {a.cognome}</strong>
                {pagamentiCorrenti[a.id] === false && (
                  <span style={{
                    color: 'white',
                    backgroundColor: 'red',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    fontSize: '0.8rem'
                  }}>
                    NON IN REGOLA
                  </span>
                )}
              </div>

              <div>
                Email: {a.email || 'N/A'} – Tel: {a.telefono || 'N/A'}<br />
                Stato: <strong>{a.attivo ? 'Attivo' : 'Non attivo'}</strong>{' '}
                <button onClick={() => toggleAttivo(a.id, a.attivo)} style={{ marginLeft: 10 }}>
                  {a.attivo ? 'Disattiva' : 'Attiva'}
                </button>
              </div>

              <LezioniFuture allievoId={a.id} apiBaseUrl={apiBaseUrl} />
              <LezioniEffettuate allievoId={a.id} apiBaseUrl={apiBaseUrl} />
              <StatoPagamenti
                allievoId={a.id}
                apiBaseUrl={apiBaseUrl}
                onPagamentoCorrente={(inRegola) => {
                  setPagamentiCorrenti(prev => ({ ...prev, [a.id]: inRegola }));
                }}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ListaAllievi;


import React, { useState, useEffect } from 'react';
import LezioniFuture from './LezioniFuture';
import LezioniEffettuate from './LezioniEffettuate';
import StatoPagamenti from './StatoPagamenti';

const ListaAllievi = ({ allievi, toggleAttivo, eliminaAllievo, apiBaseUrl }) => {
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [filtroPagamenti, setFiltroPagamenti] = useState('tutti');
  const [pagamentiCorrenti, setPagamentiCorrenti] = useState({});

  useEffect(() => {
    const fetchPagamenti = async () => {
      const aggiornati = {};
      const now = new Date();
      const meseCorrente = now.getMonth() + 1;
      const annoCorrente = now.getFullYear();

      for (const allievo of allievi) {
        try {
          const res = await fetch(`${apiBaseUrl}/allievi/${allievo.id}/pagamenti`);
          const dati = await res.json();
          aggiornati[allievo.id] = dati.some(p => p.mese === meseCorrente && p.anno === annoCorrente);
        } catch (err) {
          aggiornati[allievo.id] = false;
        }
      }
      setPagamentiCorrenti(aggiornati);
    };

    fetchPagamenti();
  }, [allievi, apiBaseUrl]);

  const allieviFiltrati = allievi.filter(a => {
    const filtroStatoMatch = filtroStato === 'tutti' || (filtroStato === 'attivi' ? a.attivo : !a.attivo);
    const filtroPagamentiMatch = filtroPagamenti === 'tutti' ||
      (filtroPagamenti === 'paganti' && pagamentiCorrenti[a.id]) ||
      (filtroPagamenti === 'morosi' && !pagamentiCorrenti[a.id]);
    return filtroStatoMatch && filtroPagamentiMatch;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label>Filtro stato: </label>
        <select value={filtroStato} onChange={e => setFiltroStato(e.target.value)} style={{ marginRight: 20 }}>
          <option value="tutti">Tutti</option>
          <option value="attivi">Solo attivi</option>
          <option value="nonattivi">Solo non attivi</option>
        </select>

        <label>Filtro pagamenti: </label>
        <select value={filtroPagamenti} onChange={e => setFiltroPagamenti(e.target.value)}>
          <option value="tutti">Tutti</option>
          <option value="paganti">In regola</option>
          <option value="morosi">Non in regola</option>
        </select>
      </div>

      <ul>
        {allieviFiltrati.map(a => (
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
              <button
                onClick={() => {
                  if (window.confirm(`Sei sicuro di voler eliminare ${a.nome} ${a.cognome}?`)) {
                    eliminaAllievo(a.id);
                  }
                }}
                style={{ marginLeft: 10, color: 'red' }}
              >
                Elimina
              </button>
            </div>

            <LezioniFuture allievoId={a.id} apiBaseUrl={apiBaseUrl} />
            <LezioniEffettuate allievoId={a.id} apiBaseUrl={apiBaseUrl} />
            <StatoPagamenti allievoId={a.id} apiBaseUrl={apiBaseUrl} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaAllievi;



import React, { useState } from 'react';
import ModificaAllievo from './ModificaAllievo';
import LezioniFuture from './LezioniFuture';
import LezioniEffettuate from './LezioniEffettuate';
import StatoPagamenti from './StatoPagamenti';

const ListaAllievi = ({ allievi, toggleAttivo, eliminaAllievo, apiBaseUrl, aggiornaAllievi }) => {
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [filtroPagamenti, setFiltroPagamenti] = useState('tutti');
  const [pagamentiCorrenti, setPagamentiCorrenti] = useState({});
  const [editingAllievo, setEditingAllievo] = useState(null);

  const allieviFiltrati = allievi.filter(a => {
    const matchStato = filtroStato === 'tutti' || (filtroStato === 'attivi' ? a.attivo : !a.attivo);
    const matchPagamento = filtroPagamenti === 'tutti'
      || (filtroPagamenti === 'paganti' && pagamentiCorrenti[a.id])
      || (filtroPagamenti === 'morosi' && !pagamentiCorrenti[a.id]);
    return matchStato && matchPagamento;
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium">Filtro stato:</label>
        <select
          value={filtroStato}
          onChange={e => setFiltroStato(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="tutti">Tutti</option>
          <option value="attivi">Solo attivi</option>
          <option value="nonattivi">Solo non attivi</option>
        </select>

        <label className="block text-sm font-medium mt-4">Filtro pagamenti:</label>
        <select
          value={filtroPagamenti}
          onChange={e => setFiltroPagamenti(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="tutti">Tutti</option>
          <option value="paganti">In regola</option>
          <option value="morosi">Non in regola</option>
        </select>
      </div>

      <div className="space-y-4">
        {allieviFiltrati.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                {a.nome} {a.cognome}
              </h3>
              {!a.attivo && (
                <span className="text-xs px-2 py-1 rounded bg-gray-300">Non attivo</span>
              )}
            </div>

            <p className="text-sm text-gray-700">Email: {a.email || 'N/A'}</p>
            <p className="text-sm text-gray-700">Tel: {a.telefono || 'N/A'}</p>
            <p className="text-sm text-gray-700">Quota: {a.quota_mensile ? `${a.quota_mensile}€` : 'N/D'}</p>
            <p className="text-sm text-gray-700">
              Iscritto il: {new Date(a.data_iscrizione).toLocaleDateString('it-IT')}
            </p>
            {pagamentiCorrenti[a.id] === false && (
              <span className="inline-block mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded">
                NON IN REGOLA
              </span>
            )}

            {editingAllievo === a.id ? (
              <ModificaAllievo
                allievo={a}
                apiBaseUrl={apiBaseUrl}
                onClose={() => {
                  setEditingAllievo(null);
                  aggiornaAllievi();
                }}
                aggiornaLista={aggiornaAllievi}
              />
            ) : (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => toggleAttivo(a.id, a.attivo)}
                  className="px-3 py-1 text-sm rounded bg-gray-200"
                >
                  {a.attivo ? 'Disattiva' : 'Attiva'}
                </button>
                <button
                  onClick={() => setEditingAllievo(a.id)}
                  className="px-3 py-1 text-sm rounded text-white"
                  style={{ backgroundColor: '#ef4d48' }}
                >
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Eliminare ${a.nome} ${a.cognome}?`)) {
                      eliminaAllievo(a.id);
                    }
                  }}
                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700"
                >
                  🗑️ Elimina
                </button>
              </div>
            )}

            <LezioniFuture allievoId={a.id} apiBaseUrl={apiBaseUrl} />
            <LezioniEffettuate allievoId={a.id} apiBaseUrl={apiBaseUrl} />
            <StatoPagamenti allievoId={a.id} apiBaseUrl={apiBaseUrl} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaAllievi;








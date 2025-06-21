import React, { useState } from 'react';
import ModificaAllievo from './ModificaAllievo';
import LezioniFuture from './LezioniFuture';
import LezioniEffettuate from './LezioniEffettuate';
import StatoPagamenti from './StatoPagamenti';

const ListaAllievi = ({ allievi, toggleAttivo, eliminaAllievo, apiBaseUrl, aggiornaAllievi }) => {
  const [filtroCombinato, setFiltroCombinato] = useState('tutti');
  const [pagamentiCorrenti, setPagamentiCorrenti] = useState({});
  const [editingAllievo, setEditingAllievo] = useState(null);
  const [espandiDettagli, setEspandiDettagli] = useState(null);

  const aggiornaPagamento = (idAllievo, stato) => {
    setPagamentiCorrenti(prev => ({ ...prev, [idAllievo]: stato }));
  };

  const allieviFiltrati = allievi.filter(a => {
  const pagamento = pagamentiCorrenti[a.id];

  if (filtroCombinato === 'attivi') {
    return a.attivo && pagamento === true;
  }

  if (filtroCombinato === 'nonattivi') {
    return !a.attivo;
  }

  if (filtroCombinato === 'noninregola') {
    return a.attivo && pagamento === false;
  }

  return true;
});


  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium">Filtro allievi:</label>
        <select
          value={filtroCombinato}
          onChange={e => setFiltroCombinato(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="tutti">Tutti</option>
          <option value="attivi">Solo attivi (in regola)</option>
          <option value="nonattivi">Solo non attivi</option>
          <option value="noninregola">Solo non in regola</option>
        </select>
      </div>

      <div className="space-y-4">
        {allieviFiltrati.map(a => {
          const statoBadge = !a.attivo
            ? { label: 'Non attivo', className: 'bg-gray-400' }
            : pagamentiCorrenti[a.id] === false
            ? { label: 'Non in regola', className: 'bg-red-500' }
            : { label: 'Attivo', className: 'bg-green-500' };

          return (
            <div key={a.id} className="relative bg-white rounded-xl shadow-md p-4">
            <StatoPagamenti
  allievoId={a.id}
  apiBaseUrl={apiBaseUrl}
  onPagamentoCorrente={(pagato) => aggiornaPagamento(a.id, pagato)}
  hidden
/>

              {/* Badge di stato */}
              <div className={`absolute top-2 right-2 text-xs text-white px-2 py-1 rounded-full ${statoBadge.className}`}>
                {statoBadge.label}
              </div>

              <h3 className="text-lg font-semibold">
                {a.nome} {a.cognome}
              </h3>
              <p className="text-sm text-gray-700">📞 {a.telefono || 'N/A'}</p>
              <p className="text-sm text-gray-700">
                🗓️ Iscritto il: {new Date(a.data_iscrizione).toLocaleDateString('it-IT')}
              </p>
              <p className="text-sm text-gray-700">
                💶 Quota: {a.quota_mensile ? `${a.quota_mensile}€` : 'N/D'}
              </p>

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
                <>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => setEditingAllievo(a.id)}
                      className="px-3 py-1 text-sm rounded text-white"
                      style={{ backgroundColor: '#ef4d48' }}
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => toggleAttivo(a.id, a.attivo)}
                      className="px-3 py-1 text-sm rounded bg-gray-200"
                    >
                      {a.attivo ? 'Disattiva' : 'Attiva'}
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
                    <button
                      onClick={() => setEspandiDettagli(prev => prev === a.id ? null : a.id)}
                      className="px-3 py-1 text-sm rounded bg-gray-100 text-primary border border-primary"
                    >
                      📊 Dettagli
                    </button>
                  </div>

                  {espandiDettagli === a.id && (
                    <div className="mt-4 space-y-2">
                      <LezioniFuture allievoId={a.id} apiBaseUrl={apiBaseUrl} />
                      <LezioniEffettuate allievoId={a.id} apiBaseUrl={apiBaseUrl} />
                      
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaAllievi;










import React, { useEffect, useState } from 'react';

const MesiNomi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const StatoPagamenti = ({ allievoId, apiBaseUrl, onPagamentoCorrente }) => {
  const [pagamenti, setPagamenti] = useState([]);
  const [anno, setAnno] = useState(new Date().getFullYear());

  const fetchPagamenti = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/pagamenti`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setPagamenti(lista);

      // Verifica mese corrente
      const now = new Date();
      const meseCorrente = now.getMonth() + 1;
      const annoCorrente = now.getFullYear();
      const pagato = lista.some(p => p.anno === annoCorrente && p.mese === meseCorrente);
      onPagamentoCorrente?.(pagato);

    } catch (err) {
      console.error('Errore nel caricamento pagamenti:', err);
      setPagamenti([]);
      onPagamentoCorrente?.(false);
    }
  };

  const isPagato = (mese) => {
    return pagamenti.some(p => p.anno === anno && p.mese === mese);
  };

  const togglePagamento = async (mese) => {
    const pagato = isPagato(mese);
    const url = `${apiBaseUrl}/allievi/${allievoId}/pagamenti`;

    try {
      if (pagato) {
        await fetch(`${url}?anno=${anno}&mese=${mese}`, { method: 'DELETE' });
      } else {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anno, mese })
        });
      }
      fetchPagamenti();
    } catch (err) {
      console.error('Errore nel toggle pagamento:', err);
    }
  };

  useEffect(() => {
    fetchPagamenti();
  }, []);

  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-gray-700 mb-2">
        Pagamenti {anno}:
      </h3>
      <div className="flex flex-wrap gap-2">
        {MesiNomi.map((nome, idx) => {
          const pagato = isPagato(idx + 1);
          return (
            <button
              key={idx}
              onClick={() => togglePagamento(idx + 1)}
              className={`px-3 py-1 text-sm rounded border shadow-sm ${
                pagato
                  ? 'bg-green-100 text-green-800 border-green-400'
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}
              title={pagato ? 'Pagato' : 'Non pagato'}
            >
              {nome}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatoPagamenti;


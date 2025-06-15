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
    <div style={{ marginTop: 10 }}>
      <strong>Pagamenti {anno}:</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 5 }}>
        {MesiNomi.map((nome, idx) => {
          const pagato = isPagato(idx + 1);
          return (
            <button
              key={idx}
              onClick={() => togglePagamento(idx + 1)}
              style={{
                margin: 2,
                padding: '5px 8px',
                borderRadius: 4,
                border: '1px solid #ccc',
                backgroundColor: pagato ? 'lightgreen' : '#f8d7da',
                cursor: 'pointer'
              }}
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


import React from 'react';

const ListaInsegnanti = ({ insegnanti, onSeleziona, onElimina }) => {
  return (
    <div className="space-y-4">
      {insegnanti.length === 0 ? (
        <p className="text-gray-600 text-sm">Nessun insegnante trovato.</p>
      ) : (
        insegnanti.map((ins) => (
          <div key={ins.id} className="bg-white rounded-xl shadow-md p-4 relative">
            <h3 className="text-lg font-semibold text-gray-800">
              {ins.nome} {ins.cognome}
            </h3>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => onSeleziona(ins)}
                className="px-3 py-1 text-sm rounded text-white"
                style={{ backgroundColor: '#ef4d48' }}
              >
                📋 Visualizza Lezioni
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Eliminare ${ins.nome} ${ins.cognome}?`)) {
                    onElimina(ins.id);
                  }
                }}
                className="px-3 py-1 text-sm rounded bg-red-100 text-red-700"
              >
                🗑️ Elimina
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ListaInsegnanti;

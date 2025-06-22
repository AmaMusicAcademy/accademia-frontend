import React, { useState } from 'react';
import ListaLezioni from './ListaLezioni';
import CalendarioLezioni from '../CalendarioLezioni';

const ListaInsegnanti = ({ insegnanti, onElimina }) => {
  const [insegnanteAperto, setInsegnanteAperto] = useState(null);
  const [visualizzazioneAperta, setVisualizzazioneAperta] = useState('lista');

  const toggleApertura = (id) => {
    if (insegnanteAperto === id) {
      setInsegnanteAperto(null);
    } else {
      setInsegnanteAperto(id);
      setVisualizzazioneAperta('lista');
    }
  };

  return (
    <div className="space-y-4">
      {insegnanti.length === 0 ? (
        <p className="text-gray-600 text-sm">Nessun insegnante trovato.</p>
      ) : (
        insegnanti.map((ins) => (
          <div key={ins.id} className="bg-white rounded-xl shadow-md p-4 relative w-full">
            <h3 className="text-lg font-semibold text-gray-800">
              {ins.nome} {ins.cognome}
            </h3>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => toggleApertura(ins.id)}
                className="px-3 py-1 text-sm rounded text-white"
                style={{ backgroundColor: '#ef4d48' }}
              >
                {insegnanteAperto === ins.id ? '🔽 Nascondi Lezioni' : '📋 Visualizza Lezioni'}
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

            {insegnanteAperto === ins.id && (
              <div className="mt-4">
                <button
                  onClick={() =>
                    setVisualizzazioneAperta(prev =>
                      prev === 'lista' ? 'calendario' : 'lista'
                    )
                  }
                  className="mb-3 text-sm underline text-primary"
                >
                  {visualizzazioneAperta === 'lista' ? '📅 Visualizza Calendario' : '📋 Visualizza Lista'}
                </button>

                <div className="border-t pt-4">
                  {visualizzazioneAperta === 'lista' ? (
                    <ListaLezioni
                      idInsegnante={ins.id}
                      nome={ins.nome}
                      cognome={ins.cognome}
                    />
                  ) : (
                    <CalendarioLezioni
                      idInsegnante={ins.id}
                      nome={ins.nome}
                      cognome={ins.cognome}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ListaInsegnanti;



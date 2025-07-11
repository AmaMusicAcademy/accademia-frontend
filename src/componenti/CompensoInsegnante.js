import { useState } from 'react';

function CompensoInsegnante({ insegnanteId }) {
  const [mese, setMese] = useState('');
  const [compenso, setCompenso] = useState(null);
  const [loading, setLoading] = useState(false);

  const calcolaCompenso = async () => {
    if (!mese) return;
    setLoading(true);
    setCompenso(null);

    try {
      const res = await fetch(`https://app-docenti.onrender.com/api/insegnanti/${insegnanteId}/compenso?mese=${mese}`);
      const data = await res.json();
      setCompenso(data);
    } catch (err) {
      console.error('Errore nel calcolo compenso:', err);
      alert('Errore nel calcolo del compenso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white mt-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-3">Calcolo compenso</h2>

      <label className="block mb-2">Seleziona mese:</label>
      <input
        type="month"
        value={mese}
        onChange={(e) => setMese(e.target.value)}
        className="border px-2 py-1 rounded mb-4 w-full"
      />

      <button
        onClick={calcolaCompenso}
        disabled={!mese || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Calcolo...' : 'Calcola compenso'}
      </button>

      {compenso && (
        <div className="mt-4 bg-gray-50 p-3 rounded border">
          <p><strong>Mese:</strong> {compenso.mese}</p>
          <p><strong>Lezioni pagate:</strong> {compenso.lezioniPagate}</p>
          <p><strong>Ore totali:</strong> {compenso.oreTotali}</p>
          <p className="font-bold text-lg mt-2">Compenso: €{compenso.compenso}</p>
        </div>
      )}
    </div>
  );
}

export default CompensoInsegnante;

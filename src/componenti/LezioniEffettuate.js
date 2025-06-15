import React, { useState } from 'react';

const LezioniEffettuate = ({ allievoId, apiBaseUrl }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  const calcola = async () => {
    if (!start || !end) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/allievi/${allievoId}/lezioni-effettuate?start=${start}&end=${end}`);
      const data = await res.json();
      setCount(data.count);
    } catch (err) {
      console.error('Errore nel conteggio lezioni:', err);
      setCount(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <label>
        Dal: <input type="date" value={start} onChange={e => setStart(e.target.value)} />
      </label>
      <label style={{ marginLeft: 10 }}>
        Al: <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
      </label>
      <button onClick={calcola} disabled={!start || !end || loading} style={{ marginLeft: 10 }}>
        {loading ? 'Calcolo...' : 'Mostra lezioni'}
      </button>
      {count !== null && (
        <div style={{ marginTop: 5 }}>
          ✅

function ListaAllievi() {
  const [allievi, setAllievi] = useState([]);

  useEffect(() => {
    fetch('/api/allievi')
      .then(res => res.json())
      .then(setAllievi);
  }, []);

  const toggleStato = async (id, attivo) => {
    await fetch(`/api/allievi/${id}/stato`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attivo: !attivo })
    });
    setAllievi(allievi.map(a => a.id === id ? { ...a, attivo: !attivo } : a));
  };

  return (
    <div>
      <h2>Allievi</h2>
      <ul>
        {allievi.map(a => (
          <li key={a.id}>
            {a.nome} {a.cognome} - {a.attivo ? 'Attivo' : 'Non Attivo'}
            <button onClick={() => toggleStato(a.id, a.attivo)}>
              {a.attivo ? 'Disattiva' : 'Attiva'}
            </button>
            <LezioniFuture allievoId={a.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
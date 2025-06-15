function LezioniFuture({ allievoId }) {
  const [lezioni, setLezioni] = useState([]);
  const [visibile, setVisibile] = useState(false);

  const toggle = () => {
    if (!visibile) {
      fetch(`/api/allievi/${allievoId}/lezioni-future`)
        .then(res => res.json())
        .then(setLezioni);
    }
    setVisibile(!visibile);
  };

  return (
    <div>
      <button onClick={toggle}>
        {visibile ? 'Nascondi Lezioni' : 'Mostra Lezioni Future'}
      </button>
      {visibile && (
        <ul>
          {lezioni.map((lez, i) => (
            <li key={i}>
              {lez.data} – {lez.ora_inizio}–{lez.ora_fine} | Aula: {lez.aula} | Insegnante: {lez.nome} {lez.cognome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
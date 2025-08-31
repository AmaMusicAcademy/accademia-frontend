import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioAdmin() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    let abort = false;

    const fetchLezioni = async () => {
      try {
        setErrore(null);
        setLoading(true);
        if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL");
        if (!token) throw new Error("Sessione scaduta, effettua di nuovo il login");

        // Admin: cumulativo
        const res = await fetch(`${BASE_URL}/api/lezioni?scope=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("utente");
          navigate("/login");
          return;
        }
        if (!res.ok) throw new Error("Errore nel recupero lezioni");

        const data = await res.json();

        // Normalizza stato: tratta { stato:"rimandata", riprogrammata:true } come "riprogrammata"
        const normalizzaStato = (l) =>
          l?.stato === "rimandata" && l?.riprogrammata === true ? "riprogrammata" : (l?.stato || "svolta");

        // Includi solo "svolta" e "riprogrammata" (come lato insegnante)
        const eventiValidi = (Array.isArray(data) ? data : [])
          .map((l) => ({ ...l, stato: normalizzaStato(l) }))
          .filter((l) => l.stato === "svolta" || l.stato === "riprogrammata");

        if (!abort) setLezioni(eventiValidi);
      } catch (err) {
        if (!abort) setErrore(err.message || "Errore inatteso");
      } finally {
        if (!abort) setLoading(false);
      }
    };

    fetchLezioni();
    return () => {
      abort = true;
    };
  }, [token, navigate]);

  return (
    <CalendarioLezioni
      lezioni={lezioni}
      loading={loading}
      error={errore}
      nome="Tutti"
      cognome="gli insegnanti"
      mostraInsegnante={true}   // mostra il docente accanto all’evento
    />
  );
}
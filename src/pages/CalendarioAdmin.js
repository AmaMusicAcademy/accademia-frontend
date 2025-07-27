import React, { useEffect, useState } from "react";
import CalendarioLezioni from "../CalendarioLezioni";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioAdmin() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/lezioni`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Errore nel recupero lezioni");
        const data = await res.json();

        // Filtra lezioni rilevanti
        const eventiValidi = data.filter(l =>
          (l.stato === "programmata" || l.stato === "svolta" || (l.stato === "rimandata" && l.riprogrammata))
        );

        setLezioni(eventiValidi);
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLezioni();
  }, []);

  return (
    <CalendarioLezioni
      lezioni={lezioni}
      loading={loading}
      error={errore}
      nome="Tutti"
      cognome="gli insegnanti"
    />
  );
}

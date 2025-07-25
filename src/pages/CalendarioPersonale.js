// src/pages/CalendarioPersonale.js
import React, { useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';
import CalendarioLezioni from "../CalendarioLezioni";

// ✅ Recupera URL del backend dalla variabile ambiente
const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioPersonale() {
  const [lezioni, setLezioni] = useState([]);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchDati = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token non trovato");

        const decoded = jwtDecode(token);
        const id = decoded.id || decoded.userId;

        const [infoRes, lezRes] = await Promise.all([
          fetch(`${BASE_URL}/api/insegnanti/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!infoRes.ok || !lezRes.ok) {
          throw new Error("Errore nel recupero dati dal server");
        }

        const info = await infoRes.json();
        const lez = await lezRes.json();

        setNome(info.nome);
        setCognome(info.cognome);

        const enriched = lez
          .filter(l => {
            const statoValido =
              l.stato === "svolta" ||
              l.stato === "programmata" ||
              (l.stato === "rimandata" && l.riprogrammata === true);

            return statoValido && l.data && l.ora_inizio && l.ora_fine;
          })
          .map(l => {
            const dataObj = new Date(l.data);
            const dateStr = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}`;
            return {
              ...l,
              start: `${dateStr}T${l.ora_inizio}`,
              end: `${dateStr}T${l.ora_fine}`,
            };
          });

        setLezioni(enriched);
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDati();
  }, []);

  return (
    <CalendarioLezioni
      lezioni={lezioni}
      nome={nome}
      cognome={cognome}
      loading={loading}
      error={errore}
    />
  );
}



import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioFull from "./componenti/CalendarioFull";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioLezioni() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        setErrore(null);

        if (!BASE_URL) {
          throw new Error("Config mancante: REACT_APP_API_URL non impostata");
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token mancante");

        // Decodifica id insegnante dal JWT
        let id;
        try {
          const decoded = jwtDecode(token);
          id = decoded.id || decoded.userId;
        } catch {
          doLogout();
          return;
        }
        if (!id) throw new Error("ID utente non presente nel token");

        const res = await fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Se token scaduto/non valido → logout + redirect
        if (res.status === 401 || res.status === 403) {
          doLogout();
          return;
        }
        if (!res.ok) throw new Error("Errore nel caricamento delle lezioni");

        const lez = await res.json();

        // Utility per evitare problemi di fuso: usa sempre stringa YYYY-MM-DD
        const safeDateStr = (d) => {
          if (!d) return null;
          const s = String(d);
          return s.length >= 10 ? s.slice(0, 10) : s; // taglia eventuale parte oraria
        };

        const filtrate = (Array.isArray(lez) ? lez : [])
          .filter(
            (l) =>
              (l.stato === "svolta" ||
                l.stato === "programmata" ||
                (l.stato === "rimandata" && l.riprogrammata)) &&
              safeDateStr(l.data) &&
              l.ora_inizio &&
              l.ora_fine
          )
          .map((l) => {
            const dateStr = safeDateStr(l.data); // "YYYY-MM-DD" garantito
            return {
              ...l,
              start: `${dateStr}T${l.ora_inizio}`,
              end: `${dateStr}T${l.ora_fine}`,
            };
          });

        setLezioni(filtrate);
      } catch (err) {
        console.error("❌ Errore fetch lezioni:", err);
        setErrore(err.message || "Errore inatteso");
      } finally {
        setLoading(false);
      }
    };

    fetchLezioni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  if (loading) return <p>Caricamento...</p>;
  if (errore) return <p className="text-red-600">{errore}</p>;

  return <CalendarioFull lezioni={lezioni} />;
}


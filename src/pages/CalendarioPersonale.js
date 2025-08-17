import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";
import BottomNav from "../componenti/BottomNav";

// ✅ URL backend da .env (es: REACT_APP_API_URL=https://app-docenti.onrender.com)
const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioPersonale() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  //useEffect(() => {
    const fetchDati = async () => {
      try {
        setErrore(null);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token non trovato");

        // Decodifica id dal JWT
        let id;
        try {
          const decoded = jwtDecode(token);
          id = decoded.id || decoded.userId;
        } catch {
          // token malformato → logout
          doLogout();
          return;
        }
        if (!id) throw new Error("ID utente non presente nel token");

        // Chiamate parallele
        const [infoRes, lezRes] = await Promise.all([
          fetch(`${BASE_URL}/api/insegnanti/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Gestione 401/403 → logout soft e redirect
        if (infoRes.status === 401 || infoRes.status === 403 || lezRes.status === 401 || lezRes.status === 403) {
          doLogout();
          return;
        }
        if (!infoRes.ok || !lezRes.ok) {
          throw new Error("Errore nel recupero dati dal server");
        }

        const info = await infoRes.json();
        const lezRaw = await lezRes.json();

        setNome(info.nome || "");
        setCognome(info.cognome || "");

        // ✅ Evita timezone: costruisci start/end usando la stringa data senza passare da new Date()
        const safeDateStr = (d) => {
          // Se il server invia "YYYY-MM-DD", usalo.
          // Se invia un ISO, taglia alla parte data.
          if (!d) return null;
          const iso = String(d);
          return iso.length >= 10 ? iso.slice(0, 10) : iso;
        };

        const enriched = (Array.isArray(lezRaw) ? lezRaw : [])
          .filter((l) => {
            const statoValido =
              l.stato === "svolta" ||
              l.stato === "annullata" ||
              (l.stato === "rimandata" && l.riprogrammata === true);
            return (
              statoValido &&
              safeDateStr(l.data) &&
              l.ora_inizio &&
              l.ora_fine
            );
          })
          .map((l) => {
            const dateStr = safeDateStr(l.data); // "YYYY-MM-DD"
            return {
              ...l,
              start: `${dateStr}T${l.ora_inizio}`,
              end: `${dateStr}T${l.ora_fine}`,
            };
          });

        setLezioni(enriched);
      } catch (err) {
        setErrore(err.message || "Errore inatteso");
      } finally {
        setLoading(false);
      }
    };

   // fetchDati();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  //}, []);

useEffect(() => { fetchDati(); }, []); // una sola volta all’avvio

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
    <CalendarioLezioni
      lezioni={lezioni}
      nome={nome}
      cognome={cognome}
      loading={loading}
      error={errore}
    />
    <BottomNav onLessonCreated={fetchDati} /> {/* 👈 refresh dopo creazione */}
    </div>
  );
}



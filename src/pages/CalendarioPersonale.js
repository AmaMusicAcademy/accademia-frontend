import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";
import BottomNav from "../componenti/BottomNav";

// ✅ URL backend da .env (es: REACT_APP_API_URL=https://app-docenti.onrender.com)
const BASE_URL = process.env.REACT_APP_API_URL;

// Helpers
const safeDateStr = (d) => {
  if (!d) return null;
  const iso = String(d);
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
};
const enrichOne = (l) => {
  if (!l) return null;
  const dateStr = safeDateStr(l.data);
  if (!dateStr || !l.ora_inizio || !l.ora_fine) return null;
  return { ...l, start: `${dateStr}T${l.ora_inizio}`, end: `${dateStr}T${l.ora_fine}` };
};

export default function CalendarioPersonale() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);
  const [calendarKey, setCalendarKey] = useState(0); // 👈 forza il remount del calendario

  const fetchNoStore = (url, options = {}) =>
    fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        ...(options.headers || {}),
      },
    });

  const fetchDati = async () => {
    try {
      setErrore(null);
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token non trovato");

      // Decodifica id dal JWT
      let id;
      try {
        const decoded = jwtDecode(token);
        id = decoded.id || decoded.userId;
      } catch {
        doLogout();
        return;
      }
      if (!id) throw new Error("ID utente non presente nel token");

      // Chiamate parallele
      const [infoRes, lezRes] = await Promise.all([
        fetchNoStore(`${BASE_URL}/api/insegnanti/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchNoStore(`${BASE_URL}/api/insegnanti/${id}/lezioni?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Gestione 401/403 → logout soft e redirect
      if (
        infoRes.status === 401 ||
        infoRes.status === 403 ||
        lezRes.status === 401 ||
        lezRes.status === 403
      ) {
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

      const enriched = (Array.isArray(lezRaw) ? lezRaw : [])
        .filter((l) => {
          const statoValido =
            l.stato === "svolta" ||
            l.stato === "annullata" ||
            (l.stato === "rimandata" && l.riprogrammata === true);
          return statoValido && safeDateStr(l.data) && l.ora_inizio && l.ora_fine;
        })
        .map(enrichOne)
        .filter(Boolean);

      setLezioni(enriched);
      setCalendarKey((k) => k + 1); // 👈 forza re-render del calendario con i dati server
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDati();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  // 👇 chiamata subito dopo la creazione: aggiunge localmente e forza re-render, poi fa fetch e re-forza
  const handleLessonCreated = async (created) => {
    const arr = Array.isArray(created) ? created : created ? [created] : [];
    if (arr.length) {
      const enrichedNew = arr.map(enrichOne).filter(Boolean);
      setLezioni((prev) => {
        const byKey = new Map(
          prev.map((e) => [(e?.id ?? `${e.start}-${e.id_allievo ?? ""}`), e])
        );
        for (const e of enrichedNew) {
          const key = e?.id ?? `${e.start}-${e.id_allievo ?? ""}`;
          byKey.set(key, e);
        }
        return Array.from(byKey.values());
      });
      setCalendarKey((k) => k + 1); // 👈 re-render immediato del calendario
    }

    // riallinea dal server e re-render di sicurezza
    await fetchDati();
    setCalendarKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <CalendarioLezioni
        key={calendarKey}            /* 👈 remount forzato, il calendario rilegge gli eventi */
        lezioni={lezioni}
        nome={nome}
        cognome={cognome}
        loading={loading}
        error={errore}
      />
      <BottomNav onLessonCreated={handleLessonCreated} />
    </div>
  );
}






import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";
import BottomNav from "../componenti/BottomNav";
import { apiFetch, getInsegnanteId } from "../utils/api"; // 👈 wrapper + id dal token

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
  const [calendarKey, setCalendarKey] = useState(0); // forza remount calendario

  const doLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }, [navigate]);

  const fetchDati = useCallback(async () => {
    try {
      setErrore(null);
      setLoading(true);

      const id = getInsegnanteId(); // 👈 ID DOCENTE dal JWT
      if (!id) {
        doLogout();
        return;
      }

      // richieste parallele, entrambe con Authorization (grazie ad apiFetch)
      const [info, lezRaw] = await Promise.all([
        apiFetch(`/api/insegnanti/${id}`),
        apiFetch(`/api/insegnanti/${id}/lezioni?t=${Date.now()}`)
      ]);

      setNome(info?.nome || "");
      setCognome(info?.cognome || "");

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
      setCalendarKey((k) => k + 1); // re-render calendario con i dati
    } catch (err) {
      // 401/403 arrivano come Error() da apiFetch
      if (err?.status === 401 || err?.status === 403) {
        doLogout();
        return;
      }
      setErrore(err.message || "Errore nel recupero dati dal server");
    } finally {
      setLoading(false);
    }
  }, [doLogout]);

  useEffect(() => {
    fetchDati();
  }, [fetchDati]);

  // chiamata subito dopo la creazione: aggiunge localmente e forza re-render, poi riallinea dal server
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
      setCalendarKey((k) => k + 1);
    }

    await fetchDati();
    setCalendarKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <CalendarioLezioni
        key={calendarKey}     /* remount forzato, il calendario rilegge gli eventi */
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






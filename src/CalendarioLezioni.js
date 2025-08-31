import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioFull from "./componenti/CalendarioFull";
import EditLessonModal from "./componenti/EditLessonModal";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioLezioni() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  // ---- Modale modifica / riprogramma ----
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  const openEdit = (lesson, mode = "edit") => {
    setEditLesson(lesson);
    setEditMode(mode);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const fetchLezioni = async () => {
    try {
      setErrore(null);
      setLoading(true);

      if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL non impostata");

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
        return s.length >= 10 ? s.slice(0, 10) : s;
      };

      // Mostriamo: "svolta", "annullata", e "rimandata" SOLO se riprogrammata = true
      const filtrate = (Array.isArray(lez) ? lez : [])
        .filter(
          (l) =>
            (l.stato === "svolta" ||
              l.stato === "annullata" ||
              (l.stato === "rimandata" && l.riprogrammata === true)) &&
            safeDateStr(l.data) &&
            l.ora_inizio &&
            l.ora_fine
        )
        .map((l) => {
          const dateStr = safeDateStr(l.data);
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

  useEffect(() => {
    fetchLezioni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  // ---- Helpers PUT completi (coerenti col backend) ----
  const buildPutBody = (src, overrides = {}) => {
    const base = {
      id_insegnante: Number(src.id_insegnante),
      id_allievo: Number(src.id_allievo),
      data: src.data || (typeof src.start === "string" ? src.start.slice(0, 10) : ""),
      ora_inizio: src.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
      ora_fine: src.ora_fine || (typeof src.end === "string" ? src.end.slice(11, 16) : ""),
      aula: src.aula || "",
      stato: src.stato || "svolta",
      motivazione: src.motivazione || "",
      riprogrammata: Boolean(src.riprogrammata) || false,
    };
    return { ...base, ...overrides };
  };

  const putLesson = async (lessonId, payload) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/lezioni/${lessonId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore aggiornamento (${res.status})`);
    }
    return res.json().catch(() => null);
  };

  // ---- Azioni richieste ----
  const handleRimanda = async (lesson) => {
    try {
      const payload = buildPutBody(lesson, { stato: "rimandata", riprogrammata: false });
      await putLesson(lesson.id, payload);
      await fetchLezioni(); // ricarica
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
    }
  };

  const handleAnnulla = async (lesson) => {
    try {
      const payload = buildPutBody(lesson, { stato: "annullata" });
      await putLesson(lesson.id, payload);
      await fetchLezioni(); // ricarica
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
    }
  };

  const handleSaved = async () => {
    closeEdit();
    await fetchLezioni();
  };

  if (loading) return <p>Caricamento...</p>;
  if (errore) return <p className="text-red-600">{errore}</p>;

  return (
    <>
      <CalendarioFull
        lezioni={lezioni}
        showActions
        onOpenEdit={(lesson, mode) => openEdit(lesson, mode || "edit")}
        onRimanda={handleRimanda}
        onAnnulla={handleAnnulla}
      />

      <EditLessonModal
        open={editOpen}
        onClose={closeEdit}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
      />
    </>
  );
}


import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioFull from "./componenti/CalendarioFull";
import EditLessonModal from "./componenti/EditLessonModal";

const BASE_URL = process.env.REACT_APP_API_URL || "https://app-docenti.onrender.com";

// helpers
const ymd = (d) => (d ? String(d).slice(0, 10) : "");
const sameKey = (o) =>
  [
    ymd(o.data) || ymd(o.start),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11, 16) : ""),
    o.ora_fine || (typeof o.end === "string" ? o.end.slice(11, 16) : ""),
    String(o.id_allievo || ""),
    String(o.aula || ""),
  ].join("|");

export default function CalendarioLezioni() {
  const navigate = useNavigate();

  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  const [teacherId, setTeacherId] = useState(null);
  const [token, setToken] = useState(null);

  // Modale modifica/riprogramma
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  // --- auth bootstrap
  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      if (!t) throw new Error("Token mancante");
      setToken(t);

      let id;
      try {
        const decoded = jwtDecode(t);
        id = decoded.id || decoded.userId;
      } catch {
        doLogout();
        return;
      }
      if (!id) throw new Error("ID utente non presente nel token");
      setTeacherId(id);
    } catch (e) {
      setErrore(e.message || "Errore autenticazione");
    }
  }, []);

  // --- fetch lezioni
  const refetchLessons = useCallback(async () => {
    if (!teacherId || !token) return;
    try {
      setLoading(true);
      setErrore(null);
      const res = await fetch(`${BASE_URL}/api/insegnanti/${teacherId}/lezioni?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        doLogout();
        return;
      }
      if (!res.ok) throw new Error("Errore nel caricamento delle lezioni");
      const lez = await res.json();
      setLezioni(Array.isArray(lez) ? lez : []);
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }, [teacherId, token]);

  useEffect(() => {
    if (teacherId && token) refetchLessons();
  }, [teacherId, token, refetchLessons]);

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  // --- risoluzione ID robusta (se mai servisse)
  const resolveLessonId = async (src) => {
    if (!token) throw new Error("Token non presente");
    if (src?.id != null) {
      const r = await fetch(`${BASE_URL}/api/lezioni/${src.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) return src.id;
      if (r.status !== 404) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `Errore lettura lezione (${r.status})`);
      }
    }
    // fallback: cerca per “chiave naturale”
    const res = await fetch(`${BASE_URL}/api/insegnanti/${teacherId}/lezioni?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore nel recupero lezioni insegnante (${res.status})`);
    }
    const list = await res.json();
    const key = (o) =>
      [
        ymd(o.data) || ymd(src.start),
        o.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
        o.ora_fine || (typeof src.end === "string" ? src.end.slice(11, 16) : ""),
        String(o.id_allievo || ""),
        String(o.aula || ""),
      ].join("|");
    const want = key(src);
    const found = (Array.isArray(list) ? list : []).find((x) => key(x) === want);
    if (!found?.id) throw new Error("Lezione equivalente non trovata sul server (ID irrilevabile)");
    return found.id;
  };

  const buildPutBody = (src, overrides = {}) => ({
    id_insegnante: Number(src.id_insegnante),
    id_allievo: Number(src.id_allievo),
    data: ymd(src.data) || ymd(src.start),
    ora_inizio: src.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
    ora_fine: src.ora_fine || (typeof src.end === "string" ? src.end.slice(11, 16) : ""),
    aula: src.aula || "",
    stato: src.stato || "svolta",
    motivazione: src.motivazione || "",
    riprogrammata: Boolean(src.riprogrammata) || false,
    old_schedules: src.old_schedules,
    ...overrides,
  });

  const putLesson = async (lessonId, payload) => {
    const res = await fetch(`${BASE_URL}/api/lezioni/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore aggiornamento (${res.status})`);
    }
    return res.json().catch(() => null);
  };

  // update ottimistico locale (mappa per “chiave naturale”)
  const patchLocal = (target, patch) => {
    setLezioni((prev) => prev.map((e) => (sameKey(e) === sameKey(target) ? { ...e, ...patch } : e)));
  };

  // --- azioni invocate da CalendarioFull (lista sotto al calendario)
  const handleRimanda = async (lesson) => {
    try {
      // nel calendario scompare (perché non riprogrammata) ma resta nella lista della pagina Allievi
      patchLocal(lesson, { stato: "rimandata", riprogrammata: false });
      const realId = await resolveLessonId(lesson);
      const payload = buildPutBody(lesson, { stato: "rimandata", riprogrammata: false });
      await putLesson(realId, payload);
      await refetchLessons();
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
      refetchLessons();
    }
  };

  const handleAnnulla = async (lesson) => {
    try {
      patchLocal(lesson, { stato: "annullata", riprogrammata: false });
      const realId = await resolveLessonId(lesson);
      const payload = buildPutBody(lesson, { stato: "annullata", riprogrammata: false });
      await putLesson(realId, payload);
      await refetchLessons();
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
      refetchLessons();
    }
  };

  // apertura modale da: click sulla card (edit) o tasto “Riprogramma”
  const openEdit = (lesson, mode = "edit") => {
    setEditLesson(lesson);
    setEditMode(mode);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const handleSaved = async () => {
    // dopo salvataggio del modale, riallinea tutto
    closeEdit();
    await refetchLessons();
  };

  if (loading) return <p>Caricamento...</p>;
  if (errore) return <p className="text-red-600">{errore}</p>;

  return (
    <>
      <CalendarioFull
        lezioni={lezioni}
        onOpenEdit={openEdit}
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
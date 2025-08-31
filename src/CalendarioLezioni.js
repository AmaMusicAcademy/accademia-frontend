import React, { useEffect, useState, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioFull from "./componenti/CalendarioFull";
import EditLessonModal from "./componenti/EditLessonModal";

const BASE_URL = process.env.REACT_APP_API_URL || "https://app-docenti.onrender.com";

const ymd = (d) => (d ? String(d).slice(0, 10) : "");
const sameKey = (o) =>
  [
    ymd(o.data) || ymd(o.start),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11, 16) : ""),
    o.ora_fine || (typeof o.end === "string" ? o.end.slice(11, 16) : ""),
    String(o.id_allievo || ""),
    String(o.aula || ""),
  ].join("|");

/**
 * CalendarioLezioni
 *
 * - Modalità DOCENTE (uncontrolled): nessuna prop -> carica lezioni del docente dal token, azioni abilitate.
 * - Modalità ADMIN (controlled): se arrivano lezioni/loading/error allora usa quelle e NON fa fetch interni.
 *   In questa modalità è read-only di default; per abilitare azioni passa gli handler come prop.
 */
export default function CalendarioLezioni(props) {
  const {
    // Modalità controllata (ADMIN)
    lezioni: lezioniProp,
    loading: loadingProp,
    error: errorProp,
    mostraInsegnante = false,
    onOpenEdit: onOpenEditProp,     // opzionale (ADMIN)
    onRimanda: onRimandaProp,       // opzionale (ADMIN)
    onAnnulla: onAnnullaProp,       // opzionale (ADMIN)
  } = props || {};

  const controlled = typeof lezioniProp !== "undefined"; // se true -> ADMIN mode (no fetch interni)
  const navigate = useNavigate();

  // Stato interno (usato solo in modalità docente)
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  const [teacherId, setTeacherId] = useState(null);
  const [token, setToken] = useState(null);

  // Modale modifica/riprogramma (solo quando usiamo i nostri handler interni)
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  // ---- Modalità DOCENTE: setup token e id ----
  useEffect(() => {
    if (controlled) return; // in modalità admin non facciamo nulla
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
  }, [controlled]);

  const doLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }, [navigate]);

  // ---- Modalità DOCENTE: fetch lezioni proprie ----
  const refetchLessons = useCallback(async () => {
    if (controlled) return;           // admin: i dati arrivano da props
    if (!teacherId || !token) return; // docente: wait setup
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
  }, [controlled, teacherId, token, doLogout]);

  useEffect(() => {
    if (controlled) return; // admin non fa fetch
    if (teacherId && token) refetchLessons();
  }, [controlled, teacherId, token, refetchLessons]);

  // ---- Utilities comuni (usate dagli handler interni) ----
  const resolveLessonId = async (src) => {
    if (!token) throw new Error("Token non presente");
    if (src?.id != null) {
      const r = await fetch(`${BASE_URL}/api/lezioni/${src.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) return src.id;
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

  // --- nuove chiamate ai PATCH dedicati (usate solo in modalità docente) ---
  const patchRimanda = async (lessonId, motivazione = "") => {
    const res = await fetch(`${BASE_URL}/api/lezioni/${lessonId}/rimanda`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore rimanda (${res.status})`);
    }
    return res.json();
  };
  const patchAnnulla = async (lessonId, motivazione = "") => {
    const res = await fetch(`${BASE_URL}/api/lezioni/${lessonId}/annulla`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore annulla (${res.status})`);
    }
    return res.json();
  };

  // update ottimistico locale (solo docente)
  const patchLocal = (target, patch) => {
    setLezioni((prev) => prev.map((e) => (sameKey(e) === sameKey(target) ? { ...e, ...patch } : e)));
  };

  // --- Handler azioni ---
  // Se il parent (ADMIN) passa handler, usiamo quelli; altrimenti usiamo i nostri (DOCENTE)
  const handleRimanda = useCallback(
    async (lesson) => {
      if (onRimandaProp) return onRimandaProp(lesson);
      try {
        patchLocal(lesson, { stato: "rimandata", riprogrammata: false });
        const realId = await resolveLessonId(lesson);
        await patchRimanda(realId, lesson.motivazione || "");
        await refetchLessons();
      } catch (e) {
        alert(e.message || "Errore nel rimandare la lezione");
        refetchLessons();
      }
    },
    [onRimandaProp, refetchLessons]
  );

  const handleAnnulla = useCallback(
    async (lesson) => {
      if (onAnnullaProp) return onAnnullaProp(lesson);
      try {
        patchLocal(lesson, { stato: "annullata", riprogrammata: false });
        const realId = await resolveLessonId(lesson);
        await patchAnnulla(realId, lesson.motivazione || "");
        await refetchLessons();
      } catch (e) {
        alert(e.message || "Errore nell'annullare la lezione");
        refetchLessons();
      }
    },
    [onAnnullaProp, refetchLessons]
  );

  const openEdit = useCallback(
    (lesson, mode = "edit") => {
      if (onOpenEditProp) return onOpenEditProp(lesson, mode);
      setEditLesson(lesson);
      setEditMode(mode);
      setEditOpen(true);
    },
    [onOpenEditProp]
  );
  const closeEdit = () => setEditOpen(false);
  const handleSaved = async () => {
    closeEdit();
    if (!controlled) await refetchLessons();
    // in admin/controlled, il parent decide se/come refetchare
  };

  // ---- Dati visualizzati: prop (admin) o stato (docente) ----
  const lezioniToShow   = controlled ? (lezioniProp || []) : lezioni;
  const loadingToShow   = controlled ? !!loadingProp : loading;
  const erroreToShow    = controlled ? (errorProp || null) : errore;

  if (loadingToShow) return <p>Caricamento...</p>;
  if (erroreToShow)  return <p className="text-red-600">{erroreToShow}</p>;

  return (
    <>
      <CalendarioFull
        lezioni={lezioniToShow}
        onOpenEdit={onOpenEditProp ? onOpenEditProp : openEdit}
        onRimanda={onRimandaProp ? onRimandaProp : handleRimanda}
        onAnnulla={onAnnullaProp ? onAnnullaProp : handleAnnulla}
        // 👇 nuovo flag: se CalendarioFull lo gestisce, può mostrare il docente
        mostraInsegnante={mostraInsegnante}
        // NB: nessun cambio al resto delle props: il lato docente resta invariato
      />

      {/* Modale usata SOLAMENTE in modalità docente (quando non forniamo handler esterni) */}
      {!onOpenEditProp && (
        <EditLessonModal
          open={editOpen}
          onClose={closeEdit}
          onSaved={handleSaved}
          lesson={editLesson}
          mode={editMode}
        />
      )}
    </>
  );
}
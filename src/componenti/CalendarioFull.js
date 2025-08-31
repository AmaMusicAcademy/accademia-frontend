import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarioFull from "./componenti/CalendarioFull";
import EditLessonModal from "./componenti/EditLessonModal";

const BASE_URL = process.env.REACT_APP_API_URL;

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "t" || s === "1" || s === "yes";
}
const ymd = (d) => (typeof d === "string" ? d.slice(0, 10) : "");
const safeDateStr = (d) => (d ? String(d).slice(0, 10) : null);

export default function CalendarioLezioni() {
  const navigate = useNavigate();
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  // modale modifica/riprogramma
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  const token = localStorage.getItem("token");

  const fetchLezioni = async () => {
    try {
      setErrore(null);
      setLoading(true);

      if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL non impostata");
      if (!token) throw new Error("Token mancante");

      let id;
      try {
        const decoded = jwtDecode(token);
        id = decoded.id || decoded.userId;
      } catch {
        doLogout();
        return;
      }
      if (!id) throw new Error("ID utente non presente nel token");

      const res = await fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        doLogout();
        return;
      }
      if (!res.ok) throw new Error("Errore nel caricamento delle lezioni");

      const lez = await res.json();

      // 👇 mostra SOLO: "svolta" oppure "rimandata" con riprogrammata=true
      const filtrate = (Array.isArray(lez) ? lez : [])
        .map((l) => ({ ...l, riprogrammata: toBool(l.riprogrammata) })) // 👈 normalizza
        .filter(
          (l) =>
            (l.stato === "svolta" ||
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

  useEffect(() => { fetchLezioni(); /* eslint-disable-next-line */ }, []);

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }

  // --- azioni dal calendario (lista giornaliera) ---

  const resolveLessonId = async (src) => {
    if (src?.id != null) {
      const r = await fetch(`${BASE_URL}/api/lezioni/${src.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) return src.id;
    }
    const decoded = jwtDecode(token);
    const teacherId = decoded.id || decoded.userId;
    const res = await fetch(`${BASE_URL}/api/insegnanti/${teacherId}/lezioni?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Errore recupero lezioni insegnante (${res.status})`);
    const list = await res.json();
    const key = (o) => [
      ymd(o.data) || ymd(src.start),
      o.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
      o.ora_fine   || (typeof src.end   === "string" ? src.end.slice(11, 16)   : ""),
      String(o.id_allievo || ""),
      String(o.aula || "")
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
    ora_inizio: src.ora_inizio || (typeof src.start === "string" ? src.start.slice(11,16) : ""),
    ora_fine:   src.ora_fine   || (typeof src.end   === "string" ? src.end.slice(11,16)   : ""),
    aula: src.aula || "",
    stato: src.stato || "svolta",
    motivazione: src.motivazione || "",
    riprogrammata: Boolean(src.riprogrammata) || false,
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

  const handleRimanda = async (lesson) => {
    try {
      // nel calendario: sparisce subito
      setLezioni((prev) => prev.filter((e) => (e.id || e.start) !== (lesson.id || lesson.start)));
      const realId = await resolveLessonId(lesson);
      const payload = buildPutBody(lesson, { stato: "rimandata", riprogrammata: false });
      await putLesson(realId, payload);
      await fetchLezioni();
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
      await fetchLezioni();
    }
  };

  const handleAnnulla = async (lesson) => {
    try {
      setLezioni((prev) => prev.filter((e) => (e.id || e.start) !== (lesson.id || lesson.start)));
      const realId = await resolveLessonId(lesson);
      const payload = buildPutBody(lesson, { stato: "annullata", riprogrammata: false });
      await putLesson(realId, payload);
      await fetchLezioni();
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
      await fetchLezioni();
    }
  };

  const openEdit = (lesson, mode = "edit") => {
    setEditLesson(lesson);
    setEditMode(mode);
    setEditOpen(true);
  };
  const handleSaved = async () => {
    setEditOpen(false);
    await fetchLezioni();
  };

  if (loading) return <p>Caricamento...</p>;
  if (errore)  return <p className="text-red-600">{errore}</p>;

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
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
      />
    </>
  );
}
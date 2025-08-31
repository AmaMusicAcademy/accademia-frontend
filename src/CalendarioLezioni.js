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

  // --- helper: normalizza YYYY-MM-DD e HH:MM
  const ymd = (d) => (typeof d === "string" ? d.slice(0, 10) : "");
  const hhmm = (t) => (typeof t === "string" ? t.slice(0, 5) : "");
  const sameKey = (o) => [
    ymd(o.data) || ymd(o.start),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11, 16) : ""),
    o.ora_fine   || (typeof o.end   === "string" ? o.end.slice(11, 16)   : ""),
    String(o.id_allievo || ""),
    String(o.aula || "")
  ].join("|");
  const sameLesson = (a, b) => sameKey(a) === sameKey(b);

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

      const res = await fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni?t=${Date.now()}`, {
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

      // ❗️Mostra SOLO lezioni "svolta" (annullate e rimandate non compaiono mai)
      const filtrate = (Array.isArray(lez) ? lez : [])
        .filter(
          (l) =>
            l.stato === "svolta" &&
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

  // 🔎 verifica l'id sul server, altrimenti risolvi l'id cercando per chiave "naturale"
  const resolveLessonId = async (src) => {
    const token = localStorage.getItem("token");
    // 1) tenta GET /api/lezioni/:id
    if (src?.id != null) {
      const r = await fetch(`${BASE_URL}/api/lezioni/${src.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) return src.id; // id valido
      if (r.status !== 404) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `Errore lettura lezione (${r.status})`);
      }
      // se 404 → passa al fallback
    }

    // 2) fallback: cerca tra le lezioni dell'insegnante una lezione equivalente
    const inz = Number(src.id_insegnante);
    if (!inz) throw new Error("id_insegnante mancante per la risoluzione ID");
    const res = await fetch(`${BASE_URL}/api/insegnanti/${inz}/lezioni?t=${Date.now()}`, {
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
        o.ora_fine   || (typeof src.end   === "string" ? src.end.slice(11, 16)   : ""),
        String(o.id_allievo || ""),
        String(o.aula || "")
      ].join("|");

    const want = key(src);
    const found = (Array.isArray(list) ? list : []).find((x) => key(x) === want);
    if (!found?.id) throw new Error("Lezione equivalente non trovata sul server (ID irrilevabile)");
    return found.id;
  };

  const buildPutBody = (src, overrides = {}) => {
    const base = {
      id_insegnante: Number(src.id_insegnante),
      id_allievo: Number(src.id_allievo),
      data: src.data || ymd(src.start),
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

  // 🔁 wrapper robusto usato da Rimanda/Annulla
  const safeUpdateLesson = async (src, overrides) => {
    const realId = await resolveLessonId(src);
    const payload = buildPutBody({ ...src, id: realId }, overrides);
    return putLesson(realId, payload);
  };

  // --- azioni:
  const handleRimanda = async (lesson) => {
    try {
      // 🔸 rimuovi SUBITO dalla UI
      setLezioni((prev) => prev.filter((e) => e.id !== lesson.id && !sameLesson(e, lesson)));
      // 🔸 aggiorna sul server
      await safeUpdateLesson(lesson, { stato: "rimandata", riprogrammata: false });
      // 🔸 riallinea
      await fetchLezioni();
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
      // in caso di errore, riallineo comunque dal server
      fetchLezioni();
    }
  };

  const handleAnnulla = async (lesson) => {
    try {
      // 🔸 rimuovi SUBITO dalla UI
      setLezioni((prev) => prev.filter((e) => e.id !== lesson.id && !sameLesson(e, lesson)));
      // 🔸 aggiorna sul server
      await safeUpdateLesson(lesson, { stato: "annullata" });
      // 🔸 riallinea
      await fetchLezioni();
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
      fetchLezioni();
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



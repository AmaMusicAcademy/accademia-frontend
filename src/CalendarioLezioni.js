import React, { useEffect, useState } from "react";
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

  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit");
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

      const safeDateStr = (d) => {
        if (!d) return null;
        const s = String(d);
        return s.length >= 10 ? s.slice(0, 10) : s;
      };

      // 👇 mostra "svolta" + "rimandata" SOLO se riprogrammata = true
      const filtrate = (Array.isArray(lez) ? lez : [])
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




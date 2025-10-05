import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal"; // modale unificata

const BASE_URL = process.env.REACT_APP_API_URL || "https://app-docenti.onrender.com";

export default function CalendarioAdmin() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  // filtro insegnante
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");

  // modale
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("create"); // "create" | "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json().catch(()=>[]);
        setTeachers(Array.isArray(data)?data:[]);
      } catch {}
    })();
  }, [token]);

  const refetch = useCallback(async () => {
    try {
      setErrore(null);
      setLoading(true);
      if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL");
      if (!token) throw new Error("Sessione scaduta, effettua di nuovo il login");

      const url = teacherId
        ? `${BASE_URL}/api/insegnanti/${teacherId}/lezioni?t=${Date.now()}`
        : `${BASE_URL}/api/lezioni?t=${Date.now()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("utente");
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Errore nel recupero lezioni");

      const data = await res.json();

      // normalizza start/end se non presenti
      const safeDateStr = (d) => (d ? String(d).slice(0,10) : null);
      const enrich = (l) => {
        const ymd = safeDateStr(l.data);
        const oi = l.ora_inizio ? String(l.ora_inizio).slice(0,5) : null;
        const of = l.ora_fine   ? String(l.ora_fine).slice(0,5)   : null;
        return {
          ...l,
          start: ymd && oi ? `${ymd}T${oi}` : l.start || null,
          end:   ymd && of ? `${ymd}T${of}` : l.end   || null,
        };
      };

      setLezioni((Array.isArray(data) ? data : []).map(enrich));
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }, [teacherId, token, navigate]);

  useEffect(() => { refetch(); }, [refetch]);

  const openAddLesson = () => {
    setEditLesson(null);
    setEditMode("create");
    setEditOpen(true);
  };
  const closeModal = () => setEditOpen(false);
  const handleSaved = async () => {
    setEditOpen(false);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Filtro insegnante */}
      <div className="sticky top-0 z-30 bg-white border-b p-3 flex gap-2 items-center">
        <label className="text-sm text-gray-600">Insegnante:</label>
        <select
          className="border rounded px-3 py-1.5 text-sm"
          value={teacherId}
          onChange={(e)=>setTeacherId(e.target.value)}
        >
          <option value="">Tutti</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
          ))}
        </select>
      </div>

      <CalendarioLezioni
        lezioni={lezioni}
        loading={loading}
        error={errore}
        nome={teacherId ? (teachers.find(t=>String(t.id)===String(teacherId))?.nome||"") : "Tutti"}
        cognome={teacherId ? (teachers.find(t=>String(t.id)===String(teacherId))?.cognome||"") : "gli insegnanti"}
        mostraInsegnante={!teacherId} // se filtro singolo, puoi nascondere la colonna docente
      />

      {/* Modale unificata (mostra selettori docente/allievo) */}
      <EditLessonModal
        open={editOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
        allowRecurring={true}
        showTeacherSelect={true}
      />

      <BottomNavAdmin onAdd={openAddLesson} />
    </div>
  );
}
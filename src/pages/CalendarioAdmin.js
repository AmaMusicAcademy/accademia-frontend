import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CalendarioLezioni from "../CalendarioLezioni";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal"; // ✅ stessa modale del docente

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioAdmin() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  // ✅ stato modale unificata
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("create"); // "create" | "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);  // null => creazione

  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const refetch = async () => {
    try {
      setErrore(null);
      setLoading(true);
      if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL");
      if (!token) throw new Error("Sessione scaduta, effettua di nuovo il login");

      const res = await fetch(`${BASE_URL}/api/lezioni?scope=all`, {
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

      // Normalizza stato: { stato:"rimandata", riprogrammata:true } => "riprogrammata"
      const normalizzaStato = (l) =>
        l?.stato === "rimandata" && l?.riprogrammata === true ? "riprogrammata" : (l?.stato || "svolta");

      // Includi solo "svolta" e "riprogrammata" (come lato insegnante)
      const eventiValidi = (Array.isArray(data) ? data : [])
        .map((l) => ({ ...l, stato: normalizzaStato(l) }))
        .filter((l) => l.stato === "svolta" || l.stato === "riprogrammata");

      setLezioni(eventiValidi);
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ✅ handler per "+" (nuova lezione)
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
    <>
      <CalendarioLezioni
        lezioni={lezioni}
        loading={loading}
        error={errore}
        nome="Tutti"
        cognome="gli insegnanti"
        mostraInsegnante={true}
      />

      {/* ✅ Modale unificata (aule select + lezioni ricorrenti) */}
      <EditLessonModal
        open={editOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        lesson={editLesson}      // null => creazione
        mode={editMode}
        allowRecurring={true}    // 👈 abilita lezioni ricorrenti
        showTeacherSelect={true} // 👈 select insegnante obbligatoria lato admin
      />

      {/* Bottom bar con "+" su /admin/calendario */}
      <BottomNavAdmin onAdd={openAddLesson} />
    </>
  );
}
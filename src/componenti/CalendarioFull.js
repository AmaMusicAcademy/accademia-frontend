import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import EditLessonModal from "./EditLessonModal";
import "./calendario.css";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

// ---------- utils ----------
function getToken() {
  try { return localStorage.getItem("token") || null; } catch { return null; }
}
function ymd(dateLike) { return String(dateLike || "").slice(0, 10); }
function hhmm(t) { return t ? String(t).slice(0, 5) : ""; }

// per riconoscere l’evento localmente
const sameKey = (o) =>
  [
    ymd(o.data) || (typeof o.start === "string" ? o.start.slice(0,10) : ""),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11,16) : ""),
    o.ora_fine   || (typeof o.end   === "string" ? o.end.slice(11,16)   : ""),
    String(o.id_allievo || o.extendedProps?.id_allievo || ""),
    String(o.aula || o.extendedProps?.aula || "")
  ].join("|");

// history helpers
const parseHistory = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; } }
  return [];
};
const hasHistory = (l) => parseHistory(l?.old_schedules).length > 0;
const statoLabel = (src) => {
  const stato = (src?.stato || src?.extendedProps?.stato || "svolta").toLowerCase();
  const riprogrammata = Boolean(src?.riprogrammata ?? src?.extendedProps?.riprogrammata);
  const history = src?.old_schedules ?? src?.extendedProps?.old_schedules;
  if (stato === "rimandata" && riprogrammata && hasHistory({ old_schedules: history })) {
    return "riprogrammata";
  }
  return stato;
};
const visibleInCalendar = (src) => {
  const stato = (src?.stato || src?.extendedProps?.stato || "svolta").toLowerCase();
  const riprogrammata = Boolean(src?.riprogrammata ?? src?.extendedProps?.riprogrammata);
  if (stato === "annullata") return false;
  if (stato === "rimandata" && !riprogrammata) return false;
  return true;
};

// chiamate specifiche backend
async function patchRimanda(id, motivazione, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/rimanda`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivazione: motivazione || "" }),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore rimanda (${res.status})`);
  return res.json();
}
async function patchAnnulla(id, motivazione, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/annulla`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivazione: motivazione || "" }),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore annulla (${res.status})`);
  return res.json();
}

// ---------- componente ----------
export default function CalendarioFull({ lezioni }) {
  const token = getToken();

  // eventi per FullCalendar + lista
  const [eventi, setEventi] = useState([]);
  const [dataSelezionata, setDataSelezionata] = useState("");
  const [lezioniDelGiorno, setLezioniDelGiorno] = useState([]);

  // modale modifica / riprogramma
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  // rigenera eventi quando cambia prop
  useEffect(() => {
    const colori = [
      "#007bff","#28a745","#ffc107","#17a2b8",
      "#6610f2","#e83e8c","#fd7e14","#20c997"
    ];

    const mapped = (Array.isArray(lezioni) ? lezioni : [])
      .map((l, index) => {
        const d = ymd(l.data);
        const start = `${d}T${hhmm(l.ora_inizio)}`;
        const end   = `${d}T${hhmm(l.ora_fine)}`;
        const evt = {
          id: l.id, // se presente
          title: "",
          start, end,
          backgroundColor: colori[index % colori.length],
          borderColor: colori[index % colori.length],
          extendedProps: {
            ...l, // include: stato, riprogrammata, old_schedules, nomi, aula, ecc.
            oraInizio: hhmm(l.ora_inizio),
            oraFine: hhmm(l.ora_fine),
          },
        };
        return evt;
      })
      .filter(visibleInCalendar);

    setEventi(mapped);

    if (dataSelezionata) {
      const delGiorno = mapped.filter(
        (ev) => (typeof ev.start === "string" ? ev.start.slice(0,10) : "") === dataSelezionata
      );
      setLezioniDelGiorno(delGiorno);
    }
  }, [lezioni]); // eslint-disable-line react-hooks/exhaustive-deps

  // click su giorno → mostra lista
  const handleDateClick = (info) => {
    const day = info.dateStr;
    setDataSelezionata(day);
    const delGiorno = eventi.filter(
      (ev) => (typeof ev.start === "string" ? ev.start.slice(0,10) : "") === day
    );
    setLezioniDelGiorno(delGiorno);
  };

  // util per patch locale
  const patchLocalEvent = (target, patch) => {
    setEventi((prev) => {
      const next = prev.map((ev) => {
        const match =
          (ev.id != null && ev.id === target.id) ||
          sameKey(ev) === sameKey(target.extendedProps || target);
        if (!match) return ev;
        const ext = { ...(ev.extendedProps || {}), ...patch };
        const merged = { ...ev, extendedProps: ext };
        return merged;
      }).filter(visibleInCalendar); // filtra secondo visibilità aggiornata

      if (dataSelezionata) {
        const delGiorno = next.filter(
          (ev) => (typeof ev.start === "string" ? ev.start.slice(0,10) : "") === dataSelezionata
        );
        setLezioniDelGiorno(delGiorno);
      }
      return next;
    });
  };

  // azioni
  const onRimanda = async (ev) => {
    try {
      const motivo = window.prompt(
        "Confermi di rimandare questa lezione?\nInserisci una motivazione (opzionale):",
        ev.extendedProps?.motivazione || ""
      );
      if (motivo === null) return;
      patchLocalEvent(ev, { stato: "rimandata", riprogrammata: false, motivazione: motivo });
      const realId = ev.id ?? ev.extendedProps?.id;
      if (!realId) throw new Error("ID lezione non disponibile");
      await patchRimanda(realId, motivo, token);
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
    }
  };

  const onAnnulla = async (ev) => {
    try {
      const motivo = window.prompt(
        "Confermi l'annullamento della lezione?\nInserisci una motivazione (opzionale):",
        ev.extendedProps?.motivazione || ""
      );
      if (motivo === null) return;
      patchLocalEvent(ev, { stato: "annullata", riprogrammata: false, motivazione: motivo });
      const realId = ev.id ?? ev.extendedProps?.id;
      if (!realId) throw new Error("ID lezione non disponibile");
      await patchAnnulla(realId, motivo, token);
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
    }
  };

  const openEdit = (ev, mode = "edit") => {
    const l = { ...(ev.extendedProps || {}), start: ev.start, end: ev.end };
    setEditLesson(l);
    setEditMode(mode);
    setEditOpen(true);
  };
  const handleSaved = (updated) => {
    setEditOpen(false);
    if (!updated) return;
    setEventi((prev) => {
      const d = ymd(updated.data);
      const start = `${d}T${hhmm(updated.ora_inizio)}`;
      const end   = `${d}T${hhmm(updated.ora_fine)}`;
      const filtered = prev.filter(e => (e.id ?? e.extendedProps?.id) !== updated.id);
      const visibile = visibleInCalendar(updated);
      if (!visibile) return filtered;
      const nuovo = {
        id: updated.id,
        title: "",
        start, end,
        backgroundColor: "#007bff",
        borderColor: "#007bff",
        extendedProps: {
          ...updated,
          oraInizio: hhmm(updated.ora_inizio),
          oraFine: hhmm(updated.ora_fine),
        },
      };
      const next = [...filtered, nuovo];
      if (dataSelezionata) {
        const delGiorno = next.filter(
          (ev) => (typeof ev.start === "string" ? ev.start.slice(0,10) : "") === dataSelezionata
        );
        setLezioniDelGiorno(delGiorno);
      }
      return next;
    });
  };

  const renderLabelAndTone = (ev) => {
    const label = statoLabel({
      stato: ev.extendedProps?.stato,
      riprogrammata: ev.extendedProps?.riprogrammata,
      old_schedules: ev.extendedProps?.old_schedules,
    });
    let toneClass = "bg-blue-100 text-blue-700 border-blue-200";
    if (label === "annullata") toneClass = "bg-red-100 text-red-700 border-red-200";
    else if (label === "rimandata") toneClass = "bg-amber-100 text-amber-800 border-amber-200";
    else if (label === "riprogrammata") toneClass = "bg-purple-100 text-purple-700 border-purple-200";
    else if (label === "svolta") toneClass = "bg-green-100 text-green-700 border-green-200";
    return { label, toneClass };
  };

  const eventiDelGiornoOrdinati = useMemo(() => {
    return [...lezioniDelGiorno].sort((a, b) => {
      const A = a.extendedProps?.oraInizio || (typeof a.start === "string" ? a.start.slice(11,16) : "");
      const B = b.extendedProps?.oraInizio || (typeof b.start === "string" ? b.start.slice(11,16) : "");
      return A.localeCompare(B);
    });
  }, [lezioniDelGiorno]);

  return (
    <div className="calendario-container">
      {/* 👇 gutter ai lati per calendario + lista */}
      <div className="cal-gutters">
        <div className="calendario-sticky calendario-compact">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={eventi}
            dateClick={handleDateClick}
            displayEventTime={false}
            eventContent={renderCompactDot}
            dayMaxEvents={5}
            moreLinkContent={null}

            /* calendario leggermente più basso ma con tutte le settimane */
            height="auto"
            contentHeight={20}
            expandRows={true}
            fixedWeekCount={true}
            handleWindowResize={true}
          />
        </div>

        {dataSelezionata && (
          <div className="bg-white mt-4 p-4 rounded-xl shadow overflow-y-auto elenco-lezioni">
            <h2 className="text-lg font-semibold mb-3">
              Appuntamenti del {new Date(dataSelezionata).toLocaleDateString("it-IT", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </h2>

            {eventiDelGiornoOrdinati.length === 0 && (
              <p className="text-gray-500 italic">Nessuna lezione</p>
            )}

            {eventiDelGiornoOrdinati.map((ev, i) => {
              const ep = ev.extendedProps || {};
              const orario = `${ep.oraInizio || hhmm(ep.ora_inizio)} – ${ep.oraFine || hhmm(ep.ora_fine)}`;
              const { label, toneClass } = renderLabelAndTone(ev);
              const isRimandata = label === "rimandata";
              const isAnnullata = label === "annullata";

              return (
                <div
                  key={`${ev.id || "k"}-${i}`}
                  className={`flex items-center gap-3 px-3 py-2 ${i === eventiDelGiornoOrdinati.length - 1 ? "" : "border-b"} cursor-pointer`}
                  onClick={() => openEdit(ev, "edit")}
                  title="Modifica lezione"
                >
                  <div className="w-12 text-xs text-gray-600 shrink-0">{orario}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium truncate">
                        {(ep.nome_allievo && ep.cognome_allievo)
                          ? `${ep.nome_allievo} ${ep.cognome_allievo}`
                          : "Allievo"}
                      </div>
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${toneClass}`}>
                        {label}
                      </span>
                      {ep.aula ? (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200">
                          Aula {ep.aula}
                        </span>
                      ) : null}
                    </div>
                    {ep.motivazione && label !== "svolta" && (
                      <div className="text-xs text-gray-500 mt-0.5">Motivo: {ep.motivazione}</div>
                    )}
                  </div>

                  {/* Azioni a destra */}
                  {!isAnnullata && (
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isRimandata ? (
                        <>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-amber-600 text-white"
                            title="Riprogramma"
                            onClick={() => openEdit(ev, "reschedule")}
                          >
                            Riprogramma
                          </button>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                            title="Annulla"
                            onClick={() => onAnnulla(ev)}
                          >
                            Annulla
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-800"
                            title="Rimanda"
                            onClick={() => onRimanda(ev)}
                          >
                            Rimanda
                          </button>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                            title="Annulla"
                            onClick={() => onAnnulla(ev)}
                          >
                            Annulla
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Modifica/Riprogramma */}
      <EditLessonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
      />
    </div>
  );
}

function renderCompactDot(arg) {
  return (
    <div
      className="fc-event-dot"
      style={{ backgroundColor: arg.event.backgroundColor }}
    />
  );
}
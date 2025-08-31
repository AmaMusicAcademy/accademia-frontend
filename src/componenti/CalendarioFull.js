import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import "./calendario.css";

/**
 * Props:
 * - lezioni: array eventi { id, id_insegnante, id_allievo, data, ora_inizio, ora_fine, aula, stato, riprogrammata, motivazione, start, end, ... }
 * - height?: string|number -> altezza calendario; se assente la calcolo
 * - listMinPx?: number -> spazio minimo per lista (default 260)
 * - bottomNavPx?: number -> altezza bottom bar per calcolo auto (default 72)
 * - showActions?: boolean -> mostra bottoni Rimanda/Riprogramma + Annulla (default false)
 * - onOpenEdit?(lesson, mode): apre modal esterna ("edit" | "reschedule")
 * - onRimanda?(lesson)
 * - onAnnulla?(lesson)
 */
export default function CalendarioFull({
  lezioni = [],
  height,
  listMinPx = 260,
  bottomNavPx = 72,
  showActions = false,
  onOpenEdit,
  onRimanda,
  onAnnulla,
}) {
  // oggi (timezone-safe)
  const todayYMD = useMemo(
    () =>
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10),
    []
  );
  const [dataSelezionata, setDataSelezionata] = useState(todayYMD);

  const colori = [
    "#007bff", "#28a745", "#ffc107", "#17a2b8",
    "#6610f2", "#e83e8c", "#fd7e14", "#20c997",
  ];

  // 🔄 mappa lezioni -> eventi FullCalendar (mantengo la lezione originale in extendedProps.source)
  const [eventi, setEventi] = useState([]);
  useEffect(() => {
    const mapped = (Array.isArray(lezioni) ? lezioni : []).map((l, index) => ({
      id: l.id,
      title: "",
      start: l.start,
      end: l.end,
      color: colori[index % colori.length],
      extendedProps: {
        stato: l.stato,
        riprogrammata: l.riprogrammata,
        oraInizio: l.ora_inizio,
        oraFine: l.ora_fine,
        nome: l.nome_allievo,
        cognome: l.cognome_allievo,
        aula: l.aula,
        source: l, // 👈 lezione originale
      },
    }));
    setEventi(mapped);
  }, [lezioni]);

  // Altezza dinamica se non specificata
  const [autoHeightPx, setAutoHeightPx] = useState(360);
  useEffect(() => {
    if (height != null) return;
    const calc = () => {
      const vh = window.innerHeight || 700;
      const outerPadding = 16 * 2;
      const gap = 8;
      const h = Math.max(260, vh - bottomNavPx - listMinPx - outerPadding - gap);
      setAutoHeightPx(h);
    };
    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("orientationchange", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("orientationchange", calc);
    };
  }, [height, bottomNavPx, listMinPx]);

  const calHeightProp = height ?? autoHeightPx;

  // Lezioni del giorno selezionato (derivate dagli eventi mappati)
  const lezioniDelGiorno = useMemo(() => {
    const day = dataSelezionata;
    return eventi
      .filter((ev) => String(ev.start).slice(0, 10) === day)
      .sort((a, b) => {
        const ta = a.extendedProps?.oraInizio || String(a.start).slice(11, 16) || "";
        const tb = b.extendedProps?.oraInizio || String(b.start).slice(11, 16) || "";
        return ta.localeCompare(tb);
      });
  }, [eventi, dataSelezionata]);

  const handleDateClick = (info) => setDataSelezionata(info.dateStr.slice(0, 10));
  const handleEventClick = (arg) => {
    const ds = arg?.event?.startStr?.slice(0, 10);
    if (ds) setDataSelezionata(ds);
  };

  const fmtIT = (ymd) => {
    try {
      const [y, m, d] = ymd.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return ymd; }
  };

  const hhmm = (s) => (s ? String(s).slice(0, 5) : "");

  return (
    <div className="calendario-container h-full flex flex-col overflow-hidden px-2 pt-2">
      {/* CALENDARIO */}
      <div className="rounded-xl bg-white shadow calendario-sticky">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          firstDay={1}
          events={eventi}
          height={calHeightProp}
          expandRows={true}
          dayMaxEvents={true}
          moreLinkContent={null}
          displayEventTime={false}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderCompactDot}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        />
      </div>

      {/* LISTA DEL GIORNO */}
      <div
        className="bg-white mt-2 p-4 rounded-xl shadow overflow-y-auto elenco-lezioni flex-1"
        style={{ minHeight: listMinPx }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Appuntamenti del {fmtIT(dataSelezionata)}
          </h2>
          <button
            className="rounded-lg border px-2 py-1 text-xs text-gray-600"
            onClick={() => setDataSelezionata(todayYMD)}
          >
            Oggi
          </button>
        </div>

        {lezioniDelGiorno.length === 0 && (
          <p className="text-gray-500 italic">Nessuna lezione</p>
        )}

        {lezioniDelGiorno.map((ev, i) => {
          const raw = ev.extendedProps?.source || {};
          const isRimandata = ev.extendedProps?.stato === "rimandata";
          const titolo = `${ev.extendedProps?.nome || ""} ${ev.extendedProps?.cognome || ""}`.trim() || "Lezione";
          const oraI = ev.extendedProps?.oraInizio || String(ev.start).slice(11, 16);
          const oraF = ev.extendedProps?.oraFine || String(ev.end).slice(11, 16);

          return (
            <div
              key={ev.id || i}
              className="border-b py-2 cursor-pointer"
              onClick={() => onOpenEdit && onOpenEdit(raw, "edit")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{titolo}</div>
                  <div className="text-sm text-gray-700">
                    {oraI} - {oraF}{ev.extendedProps?.aula ? ` | ${ev.extendedProps.aula}` : ""}
                  </div>
                  {ev.extendedProps?.stato && (
                    <div className="text-xs italic text-gray-500">
                      ({ev.extendedProps.stato}{ev.extendedProps.riprogrammata ? " - riprogrammata" : ""})
                    </div>
                  )}
                </div>

                {showActions && (
                  <div
                    className="flex flex-col sm:flex-row gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`px-2 py-1 rounded-md text-xs ${isRimandata ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"}`}
                      title={isRimandata ? "Riprogramma" : "Rimanda"}
                      onClick={() => {
                        if (isRimandata) {
                          onOpenEdit && onOpenEdit(raw, "reschedule");
                        } else {
                          onRimanda && onRimanda(raw);
                        }
                      }}
                    >
                      {isRimandata ? "Riprogramma" : "Rimanda"}
                    </button>
                    <button
                      className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                      title="Annulla"
                      onClick={() => onAnnulla && onAnnulla(raw)}
                    >
                      Annulla
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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


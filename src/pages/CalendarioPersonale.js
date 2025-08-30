import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";

/**
 * Props:
 * - lezioni: [{ start, end, data, ora_inizio, ora_fine, aula, id, id_allievo, id_insegnante, stato, title/titolo }]
 * - nome, cognome, loading, error
 * - calendarHeight: string CSS -> altezza del box calendario (es. "280px", "100%", "calc(100vh - 332px)")
 */
export default function CalendarioLezioni({
  lezioni = [],
  nome = "",
  cognome = "",
  loading = false,
  error = null,
  calendarHeight = "calc(100% - 260px)", // default: lascia ~260px alla lista
}) {
  const calendarRef = useRef(null);

  // oggi in YYYY-MM-DD, timezone-safe
  const todayYMD = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10),
    []
  );
  const [selectedDate, setSelectedDate] = useState(todayYMD);

  // eventi già arricchiti nel parent
  const events = useMemo(() => (Array.isArray(lezioni) ? lezioni : []), [lezioni]);

  // porta la vista al giorno selezionato
  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (api && selectedDate) api.gotoDate(selectedDate);
  }, [selectedDate]);

  // eventi del giorno selezionato
  const eventsOfSelectedDay = useMemo(() => {
    const day = selectedDate;
    return events
      .filter((e) => (typeof e.start === "string" ? e.start.slice(0, 10) : "") === day)
      .sort((a, b) => {
        const ta = (a.ora_inizio || (typeof a.start === "string" ? a.start.slice(11, 16) : "")) || "";
        const tb = (b.ora_inizio || (typeof b.start === "string" ? b.start.slice(11, 16) : "")) || "";
        return ta.localeCompare(tb);
      });
  }, [events, selectedDate]);

  const fmtDateIT = (ymd) => {
    try {
      const [y, m, d] = ymd.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return ymd;
    }
  };
  const hhmm = (s) => (s ? String(s).slice(0, 5) : "");

  const onDateClick = (arg) => setSelectedDate(arg.dateStr.slice(0, 10));
  const onEventClick = (arg) => {
    const startStr = arg?.event?.startStr || "";
    if (startStr) setSelectedDate(startStr.slice(0, 10));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {(nome || cognome) && (
        <div className="px-2 pb-1 text-sm text-gray-600">
          Calendario di <span className="font-medium">{cognome} {nome}</span>
        </div>
      )}

      {error && (
        <div className="mx-2 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(error)}
        </div>
      )}
      {loading && (
        <div className="mx-2 mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          Caricamento…
        </div>
      )}

      {/* CALENDARIO: altezza IMPOSTATA dal parent */}
      <div className="shrink-0 rounded-xl bg-white shadow mx-2" style={{ height: calendarHeight }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          locale={itLocale}
          firstDay={1}
          height="100%"          // riempi il box
          expandRows={true}      // comprime le righe: niente scroll interno
          dayMaxEvents={true}
          moreLinkClick="popover"
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          eventContent={(arg) => {
            const startTime =
              arg.event.extendedProps?.ora_inizio ||
              (arg.event.startStr?.slice(11, 16)) || "";
            return (
              <div className="flex items-center gap-1 text-[11px] leading-none">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                {startTime && <span className="opacity-70">{startTime}</span>}
              </div>
            );
          }}
        />
      </div>

      {/* LISTA DEL GIORNO: riempie il resto ed è scrollabile */}
      <div className="mt-2 flex-1 overflow-y-auto px-2 pb-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">
            {fmtDateIT(selectedDate)}
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border px-2 py-1 text-xs text-gray-600"
              onClick={() => setSelectedDate(todayYMD)}
            >
              Oggi
            </button>
          </div>
        </div>

        {eventsOfSelectedDay.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
            Nessuna lezione in questo giorno.
          </div>
        ) : (
          <div className="space-y-2">
            {eventsOfSelectedDay.map((e) => {
              const key = e.id ?? `${e.start}-${e.id_allievo ?? ""}-${e.id_insegnante ?? ""}`;
              const oraInizio = e.ora_inizio || (typeof e.start === "string" ? e.start.slice(11, 16) : "");
              const oraFine   = e.ora_fine   || (typeof e.end   === "string" ? e.end.slice(11, 16)   : "");
              const title     = e.titolo || e.title || "Lezione";
              const stato     = e.stato || "";

              return (
                <div key={key} className="rounded-xl bg-white shadow p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    {stato && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {stato}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    <span className="font-medium">{hhmm(oraInizio)}–{hhmm(oraFine)}</span>
                    {e.aula && <span className="ml-2">• Aula: {e.aula}</span>}
                    {e.id_allievo && <span className="ml-2">• Allievo #{e.id_allievo}</span>}
                  </div>
                  {e.motivazione && (
                    <div className="mt-1 text-xs text-gray-500">
                      {e.motivazione}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import "./calendario.css";

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "t" || s === "1" || s === "yes";
}

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

  const [eventi, setEventi] = useState([]);
  useEffect(() => {
    const mapped = (Array.isArray(lezioni) ? lezioni : [])
      .map((l, index) => {
        const ripro = toBool(l.riprogrammata); // 👈 normalizza
        return {
          id: l.id,
          title: "",
          start: l.start,
          end: l.end,
          color: colori[index % colori.length],
          extendedProps: {
            displayState: ripro ? "riprogrammata" : (l.stato || ""),
            riprogrammata: ripro,
            stato: l.stato,
            oraInizio: l.ora_inizio,
            oraFine: l.ora_fine,
            nome: l.nome_allievo,
            cognome: l.cognome_allievo,
            aula: l.aula,
            source: { ...l, riprogrammata: ripro },
          },
        };
      });
    setEventi(mapped);
  }, [lezioni]);

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

  return (
    <div className="calendario-container h-full flex flex-col overflow-hidden px-2 pt-2">
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

      <div className="bg-white mt-2 p-4 rounded-xl shadow overflow-y-auto elenco-lezioni flex-1" style={{ minHeight: 260 }}>
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
          const titolo = `${ev.extendedProps?.nome || ""} ${ev.extendedProps?.cognome || ""}`.trim() || "Lezione";
          const oraI = ev.extendedProps?.oraInizio || String(ev.start).slice(11, 16);
          const oraF = ev.extendedProps?.oraFine || String(ev.end).slice(11, 16);

          const ripro = toBool(ev.extendedProps?.riprogrammata);
          const rawState = (ev.extendedProps?.stato || "svolta").toLowerCase();
          const showState = rawState === "annullata" ? "annullata" : (ripro ? "riprogrammata" : rawState);

          const tone =
            showState === "annullata" ? "text-red-600"
            : showState === "riprogrammata" ? "text-purple-600"
            : showState === "rimandata" ? "text-amber-600"
            : showState === "svolta" ? "text-green-600"
            : "text-gray-600";

          const isAnnullata = rawState === "annullata";
          const isRimandataOrRiprogrammata = rawState === "rimandata";

          return (
            <div key={ev.id || i} className="border-b py-2">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onOpenEdit && onOpenEdit(raw, "edit")}
                  title="Modifica lezione"
                >
                  <div className="font-semibold">{titolo}</div>
                  <div className="text-sm text-gray-700">
                    {oraI} - {oraF}{ev.extendedProps?.aula ? ` | ${ev.extendedProps.aula}` : ""}
                  </div>
                  <div className={`text-xs italic ${tone}`}>({showState})</div>
                </div>

                {showActions && !isAnnullata && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isRimandataOrRiprogrammata ? (
                      <>
                        <button
                          className="px-2 py-1 rounded-md text-xs bg-amber-600 text-white"
                          title="Riprogramma"
                          onClick={() => onOpenEdit && onOpenEdit(raw, "reschedule")}
                        >
                          Riprogramma
                        </button>
                        <button
                          className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                          title="Annulla"
                          onClick={() => onAnnulla && onAnnulla(raw)}
                        >
                          Annulla
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-800"
                          title="Rimanda"
                          onClick={() => onRimanda && onRimanda(raw)}
                        >
                          Rimanda
                        </button>
                        <button
                          className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                          title="Annulla"
                          onClick={() => onAnnulla && onAnnulla(raw)}
                        >
                          Annulla
                        </button>
                      </>
                    )}
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
  return <div className="fc-event-dot" style={{ backgroundColor: arg.event.backgroundColor }} />;
}
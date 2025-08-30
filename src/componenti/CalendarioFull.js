import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import "./calendario.css";

/**
 * Props:
 * - lezioni: array di eventi già arricchiti { id, start, end, stato, ora_inizio, ora_fine, nome_allievo, cognome_allievo, aula }
 * - height?: string|number -> altezza del calendario (es. 360, "calc(100vh - 332px)"). Se non la passi, viene calcolata.
 * - listMinPx?: numero -> spazio minimo per la lista sottostante (default 260)
 * - bottomNavPx?: numero -> spazio riservato alla bottom bar (default 72) usato solo per il calcolo auto
 */
export default function CalendarioFull({
  lezioni = [],
  height,             // opzionale: se presente, usata direttamente
  listMinPx = 260,
  bottomNavPx = 72,
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

  // Colori per i puntini
  const colori = [
    "#007bff", "#28a745", "#ffc107", "#17a2b8",
    "#6610f2", "#e83e8c", "#fd7e14", "#20c997",
  ];

  // 🔄 sincronizza gli eventi quando cambiano le prop `lezioni`
  const [eventi, setEventi] = useState([]);
  useEffect(() => {
    const mapped = (Array.isArray(lezioni) ? lezioni : []).map((l, idx) => ({
      id: l.id ?? `${l.start}-${l.end}-${idx}`,
      title: "",
      start: l.start,
      end: l.end,
      color: colori[idx % colori.length],
      extendedProps: {
        stato: l.stato,
        oraInizio: l.ora_inizio,
        oraFine: l.ora_fine,
        nome: l.nome_allievo,
        cognome: l.cognome_allievo,
        aula: l.aula,
      },
    }));
    setEventi(mapped);
  }, [lezioni]); // 👈 prima mancava: per questo non vedevi subito le nuove lezioni

  // Altezza dinamica (se non specificata via prop)
  const [autoHeightPx, setAutoHeightPx] = useState(360);
  useEffect(() => {
    if (height != null) return; // se la passi tu, non calcolo
    const calc = () => {
      const vh = window.innerHeight || 700;
      const outerPadding = 16 * 2; // padding verticale tipico del wrapper (.px-2 .pt-2)
      const gap = 8;               // spazio tra calendario e lista
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

  const calHeightProp = height ?? autoHeightPx; // numero o stringa

  // Lezioni del giorno selezionato
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

  const fmtDateIT = (ymd) => {
    try {
      const [y, m, d] = ymd.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString("it-IT", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return ymd; }
  };

  const handleDateClick = (info) => {
    setDataSelezionata(info.dateStr.slice(0, 10));
  };
  const handleEventClick = (arg) => {
    const ds = arg?.event?.startStr?.slice(0, 10);
    if (ds) setDataSelezionata(ds);
  };

  return (
    <div className="calendario-container h-full flex flex-col overflow-hidden px-2 pt-2">
      {/* CALENDARIO (in alto, altezza controllata, no scroll interno) */}
      <div className="rounded-xl bg-white shadow calendario-sticky">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          firstDay={1}
          events={eventi}
          height={calHeightProp}   // 👈 chiave
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

      {/* LISTA (sotto, scrollabile) */}
      <div
        className="bg-white mt-2 p-4 rounded-xl shadow overflow-y-auto elenco-lezioni flex-1"
        style={{ minHeight: listMinPx }}
      >
        <h2 className="text-lg font-semibold mb-3">
          Appuntamenti del{" "}
          {new Date(dataSelezionata).toLocaleDateString("it-IT", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </h2>

        {lezioniDelGiorno.length === 0 && (
          <p className="text-gray-500 italic">Nessuna lezione</p>
        )}

        {lezioniDelGiorno.map((lez, i) => (
          <div key={i} className="border-b py-2">
            <div className="font-semibold">
              {lez.extendedProps?.nome} {lez.extendedProps?.cognome}
            </div>
            <div className="text-sm text-gray-700">
              {lez.extendedProps?.oraInizio} - {lez.extendedProps?.oraFine}
              {lez.extendedProps?.aula ? ` | ${lez.extendedProps.aula}` : ""}
            </div>
            {lez.extendedProps?.stato && (
              <div className="text-xs italic text-gray-500">
                ({lez.extendedProps.stato})
              </div>
            )}
          </div>
        ))}
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


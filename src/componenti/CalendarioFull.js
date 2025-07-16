// CalendarioFull.js
import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../calendario.css";

export default function CalendarioFull({ lezioni = [] }) {
  const [dataSelezionata, setDataSelezionata] = useState(null);

  const eventi = lezioni.map((lezione) => {
    const colore =
      lezione.stato === "annullata"
        ? "stato-annullata"
        : lezione.stato === "rimandata" && !lezione.riprogrammata
        ? "stato-rimandata non-riprogrammata"
        : "stato-generale";

    return {
      title: " ",
      start: lezione.start,
      end: lezione.end,
      extendedProps: {
        stato: lezione.stato,
        riprogrammata: lezione.riprogrammata,
        allievo: lezione.allievo || "",
        ora_inizio: lezione.ora_inizio,
        ora_fine: lezione.ora_fine,
      },
      classNames: ["fc-event-dot", colore],
    };
  });

  const appuntamentiDelGiorno = eventi
    .filter((e) => {
      if (!dataSelezionata) return false;
      const dataEvento = new Date(e.start);
      return (
        dataEvento.toDateString() === new Date(dataSelezionata).toDateString()
      );
    })
    .sort((a, b) => a.extendedProps.ora_inizio.localeCompare(b.extendedProps.ora_inizio));

  return (
    <div className="calendario-container">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="it"
        events={eventi}
        dayMaxEventRows={false}
        fixedWeekCount={false}
        selectable={true}
        headerToolbar={{
          start: "prev",
          center: "title",
          end: "next",
        }}
        contentHeight="auto"
        dateClick={(info) => setDataSelezionata(info.dateStr)}
      />

      {dataSelezionata && (
        <div className="lista-appuntamenti animate-fade-in">
          <h3 className="titolo-giorno">
            Appuntamenti del {new Date(dataSelezionata).toLocaleDateString("it-IT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {appuntamentiDelGiorno.length === 0 ? (
            <p className="nessun-evento">Nessun appuntamento</p>
          ) : (
            <ul className="lista">
              {appuntamentiDelGiorno.map((e, idx) => (
                <li key={idx} className="voce">
                  <span className="ora">
                    {e.extendedProps.ora_inizio} - {e.extendedProps.ora_fine}
                  </span>
                  <span className="allievo">{e.extendedProps.allievo}</span>
                  <span className="stato">({e.extendedProps.stato})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}














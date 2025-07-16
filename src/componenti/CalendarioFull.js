// src/componenti/CalendarioFull.js
import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import './calendario.css';

export default function CalendarioFull({ lezioni = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const colori = [
    '#1e90ff', '#ff6347', '#32cd32', '#ffcc00', '#8a2be2', '#e91e63'
  ];

  // Evento clic su data
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
  };

  // Eventi raggruppati per giorno
  const eventiPerData = lezioni.reduce((acc, evento) => {
    const giorno = evento.start.split('T')[0];
    if (!acc[giorno]) acc[giorno] = [];
    acc[giorno].push(evento);
    return acc;
  }, {});

  // Rende i pallini nella cella del giorno
  const renderDayCellContent = (arg) => {
    const dateStr = arg.date.toISOString().split('T')[0];
    const eventi = eventiPerData[dateStr] || [];

    return (
      <div className="day-cell-dots">
        {eventi.slice(0, 6).map((_, i) => (
          <span
            key={i}
            className="event-dot"
            style={{ backgroundColor: colori[i % colori.length] }}
          />
        ))}
      </div>
    );
  };

  // Appuntamenti del giorno selezionato
  const eventiDelGiorno = selectedDate
    ? lezioni.filter(e => e.start.startsWith(selectedDate))
    : [];

  return (
    <div className="px-4 pt-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        dayCellContent={renderDayCellContent}
        events={lezioni}
        dateClick={handleDateClick}
        height="auto"
        fixedWeekCount={false}
      />

      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">
            Appuntamenti del {selectedDate.split("-").reverse().join("/")}
          </h2>
          {eventiDelGiorno.length === 0 ? (
            <p>Nessun appuntamento.</p>
          ) : (
            <ul className="space-y-2">
              {eventiDelGiorno.map((e, idx) => (
                <li key={idx} className="border p-2 rounded-md shadow-sm">
                  <div className="font-medium">{e.titolo || 'Lezione'}</div>
                  <div className="text-sm text-gray-600">
                    {e.ora_inizio} - {e.ora_fine}
                  </div>
                  {e.allievo && (
                    <div className="text-sm italic">{e.allievo}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}














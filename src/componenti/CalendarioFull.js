import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './calendario.css';

export default function CalendarioFull({ lezioni }) {
  const [dataSelezionata, setDataSelezionata] = useState(null);
  const [lezioniGiornaliere, setLezioniGiornaliere] = useState([]);

  const coloriDisponibili = [
    '#007bff', '#28a745', '#ffc107', '#17a2b8',
    '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
  ];

  const eventi = lezioni.map((lezione, index) => ({
    id: lezione.id,
    title: `${lezione.allievo?.nome || ''} ${lezione.allievo?.cognome || ''}`,
    start: `${lezione.data}T${lezione.oraInizio}`, // Assunto: data già in formato YYYY-MM-DD
    end: `${lezione.data}T${lezione.oraFine}`,
    extendedProps: {
      stato: lezione.stato,
      allievo: lezione.allievo,
      data: lezione.data,
      oraInizio: lezione.oraInizio,
      oraFine: lezione.oraFine,
    },
    color: coloriDisponibili[index % coloriDisponibili.length]
  }));

console.log("Lezioni originali:", lezioni);

  const handleDateClick = (arg) => {
    const data = arg.dateStr; // es. '2025-06-17'
    const lezioniDelGiorno = eventi.filter(e => e.start.startsWith(data));
    setDataSelezionata(data);
    setLezioniGiornaliere(lezioniDelGiorno);
  };

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={eventi}
        dateClick={handleDateClick}
        displayEventTime={false}
        eventDisplay="background"
        eventContent={renderEventDot}
        height="auto"
      />

      console.log("Eventi costruiti per il calendario:", eventi);


      {dataSelezionata && (
        <div className="bg-white mt-4 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2">
            Appuntamenti del {new Date(dataSelezionata).toLocaleDateString('it-IT', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </h2>

          {lezioniGiornaliere.length === 0 && (
            <p className="text-gray-500 italic">Nessun appuntamento</p>
          )}

          {lezioniGiornaliere
            .sort((a, b) => a.extendedProps.oraInizio.localeCompare(b.extendedProps.oraInizio))
            .map((lezione, i) => (
              <div key={i} className="border-b py-2 px-3">
                <div className="font-semibold">
                  {lezione.extendedProps.allievo?.nome} {lezione.extendedProps.allievo?.cognome}
                </div>
                <div className="text-sm text-gray-700">
                  {lezione.extendedProps.oraInizio} - {lezione.extendedProps.oraFine}
                </div>
                <div className="text-xs italic text-gray-500">
                  ({lezione.extendedProps.stato})
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function renderEventDot(arg) {
  return (
    <div className="fc-event-dot" style={{ backgroundColor: arg.event.backgroundColor }}></div>
  );
}
















import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './calendario.css';

export default function CalendarioFull({ lezioni }) {
  const [dataSelezionata, setDataSelezionata] = useState('');
  const [lezioniDelGiorno, setLezioniDelGiorno] = useState([]);

  const colori = [
    '#007bff', '#28a745', '#ffc107', '#17a2b8',
    '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
  ];

  const eventi = lezioni.map((lezione, index) => {
    console.log("🎨 Costruzione evento da lezione:", lezione);
    return {
      id: lezione.id,
      title: `${lezione.nome_allievo} ${lezione.cognome_allievo}`,
      start: lezione.start,
      end: lezione.end,
      color: colori[index % colori.length],
      extendedProps: {
        stato: lezione.stato,
        oraInizio: lezione.ora_inizio,
        oraFine: lezione.ora_fine,
        nome: lezione.nome_allievo,
        cognome: lezione.cognome_allievo,
      }
    };
  });

  console.log("🗓️ Eventi finali per calendario:", eventi);

  const handleDateClick = (info) => {
    const data = info.dateStr;
    const filtrate = eventi.filter(ev => ev.start.slice(0, 10) === data);
    console.log("📅 Giorno cliccato:", data, "| Eventi trovati:", filtrate);
    setDataSelezionata(data);
    setLezioniDelGiorno(filtrate);
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

      {dataSelezionata && (
        <div className="bg-white mt-4 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3">
            Appuntamenti del {new Date(dataSelezionata).toLocaleDateString('it-IT', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </h2>

          {lezioniDelGiorno.length === 0 && (
            <p className="text-gray-500 italic">Nessuna lezione</p>
          )}

          {lezioniDelGiorno.map((lez, i) => (
            <div key={i} className="border-b py-2">
              <div className="font-semibold">
                {lez.extendedProps.nome} {lez.extendedProps.cognome}
              </div>
              <div className="text-sm text-gray-700">
                {lez.extendedProps.oraInizio} - {lez.extendedProps.oraFine}
              </div>
              <div className="text-xs italic text-gray-500">
                ({lez.extendedProps.stato})
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
    <div
      className="fc-event-dot"
      style={{ backgroundColor: arg.event.backgroundColor }}
    ></div>
  );
}

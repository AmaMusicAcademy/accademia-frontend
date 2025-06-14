import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

//import '@fullcalendar/common/main.css';
//import '@fullcalendar/daygrid/main.css';
//import '@fullcalendar/timegrid/main.css';

const CalendarioFull = () => {
  const [lezioni, setLezioni] = useState([]);

  useEffect(() => {
     useEffect(() => {
    fetch(${process.env.REACT_APP_API_URL}/lezioni)
      .then(response => response.json())
      .then(data => {
        const eventi = data.map(lezione => {
          const dataSolo = lezione.data.split('T')[0]; // es. "2025-06-09"
          const start = ${dataSolo}T${lezione.ora_inizio};
          const end = ${dataSolo}T${lezione.ora_fine};

          return {
            id: lezione.id,
            title: ${lezione.nome_allievo} (${lezione.nome_insegnante}),
            start,
            end,
          };
        });

      setLezioni(eventi);
  });
      
  }, []);

  const handleDateClick = (info) => {
    alert(`Hai cliccato su: ${info.dateStr}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calendario Lezioni</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        editable={false}
        selectable={true}
        events={lezioni}
        dateClick={handleDateClick}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        locale="it"
        allDaySlot={false}
        nowIndicator={true}
        height="auto"
      />
    </div>
  );
};

export default CalendarioFull;
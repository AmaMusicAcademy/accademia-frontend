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
    f.then(data => {
      const eventi = data.map(lezione => {
      const data = lezione.data.split('T')[0]; // Es. "2025-06-09"
      const start = `${data}T${lezione.ora_inizio}`; // "2025-06-09T15:00:00"
      const end = `${data}T${lezione.ora_fine}`;     // "2025-06-09T16:00:00"

      return {
        id: lezione.id,
        title: `${lezione.nome_allievo} (${lezione.nome_insegnante})`,
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
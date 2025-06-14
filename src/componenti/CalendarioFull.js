import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

//import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';

const CalendarioFull = () => {
  const [lezioni, setLezioni] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/lezioni`)
      .then(response => response.json())
      .then(data => {
        const eventi = data.map(lezione => ({
          id: lezione.id,
          title: `${lezione.nome_allievo} (${lezione.nome_insegnante})`,
          start: lezione.data_ora,
          end: new Date(new Date(lezione.data_ora).getTime() + 60 * 60 * 1000).toISOString(), // fine lezione dopo 1h
        }));
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
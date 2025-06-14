import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarioFull = ({ lezioni }) => {
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

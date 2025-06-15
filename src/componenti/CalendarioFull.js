import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';

const CalendarioFull = ({ lezioni }) => {
  const navigate = useNavigate();

  const handleEventClick = (info) => {
    const lezioneId = info.event.id;
    navigate(`/lezioni/${lezioneId}/modifica`);
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
        eventClick={handleEventClick} // <-- aggiunto!
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


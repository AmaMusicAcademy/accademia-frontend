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

  const eventDidMount = (info) => {
    const stato = info.event.extendedProps.stato;

    if (stato === 'rimandata') {
      info.el.style.backgroundColor = 'orange';
      info.el.style.color = 'white';
    } else if (stato === 'annullata') {
      info.el.style.backgroundColor = 'red';
      info.el.style.color = 'white';
    } else if (stato === 'svolta') {
      info.el.style.backgroundColor = 'green';
      info.el.style.color = 'white';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-primary mb-4">
        📅 Calendario Lezioni
      </h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        editable={false}
        selectable={true}
        events={lezioni}
        eventClick={handleEventClick}
        eventDidMount={eventDidMount}
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




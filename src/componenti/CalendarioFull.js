import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; // <-- aggiunto
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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calendario Lezioni</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="listWeek" // <-- vista agenda settimanale
        headerToolbar={{
          start: 'title',
          center: '',
          end: 'dayGridMonth,timeGridWeek,listWeek'
        }}
        events={lezioni}
        eventClick={handleEventClick}
        eventDidMount={eventDidMount}
        locale="it"
        height="auto"
        nowIndicator={true}
      />
    </div>
  );
};

export default CalendarioFull;





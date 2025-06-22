import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useNavigate } from 'react-router-dom';

const CalendarioFull = ({ lezioni }) => {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

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

  const handleDateChange = (e) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const date = new Date(e.target.value);
      calendarApi.gotoDate(date);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calendario Lezioni</h2>

      {/* Selettore Data */}
      <div className="mb-4">
        <label className="mr-2 font-medium text-sm">📅 Vai a settimana:</label>
        <input
          type="date"
          onChange={handleDateChange}
          className="p-1 border rounded text-sm"
        />
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="listWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
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






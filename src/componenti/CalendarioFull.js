import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useNavigate } from 'react-router-dom';

const CalendarioFull = ({ lezioni }) => {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEventClick = (info) => {
    const lezioneId = info.event.id;
    navigate(`/lezioni/${lezioneId}/modifica`);
  };

  const eventDidMount = (info) => {
    const { stato, riprogrammata } = info.event.extendedProps;
    if (stato === 'rimandata' && riprogrammata) {
      info.el.style.backgroundColor = '#9333ea';
      info.el.style.color = 'white';
    } else if (stato === 'rimandata') {
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

  const eventContent = ({ event }) => {
    const { extendedProps } = event;

    return (
      <div className="text-sm leading-tight">
        <div className="font-medium">
          👤 {extendedProps.nome_allievo} {extendedProps.cognome_allievo}
        </div>
      </div>
    );
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    const calendarApi = calendarRef.current.getApi();
    calendarApi.gotoDate(date);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(date);
  };

  const eventi = lezioni.map(lez => {
    const isRecupero = lez.stato === 'rimandata' && lez.riprogrammata;

    return {
      ...lez,
      title: isRecupero
        ? `🔄 Recupero con ${lez.nome_allievo || 'allievo'}`
        : `Lezione con ${lez.nome_allievo || 'allievo'}`,
      backgroundColor: isRecupero ? '#a855f7' : undefined,
      borderColor: isRecupero ? '#9333ea' : undefined,
      textColor: isRecupero ? 'white' : undefined
    };
  });

  return (
    <div className={`p-2 sm:p-4 w-full ${isFullscreen ? 'fixed top-0 left-0 w-screen h-screen bg-white z-50 p-4 overflow-y-auto' : 'overflow-hidden'}`}>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg sm:text-xl font-bold">
          🗓️ Calendario Lezioni
        </h2>
        <button
          onClick={() => setIsFullscreen(prev => !prev)}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          {isFullscreen ? '🔽 Riduci' : '⛶ Schermo Intero'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-2 gap-2 text-sm">
        <label className="flex items-center gap-2">
          📅 Vai a data:
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border p-1 rounded text-sm"
          />
        </label>
        <span className="text-gray-600">
          📌 Data corrente: <strong>{formatDate(currentDate)}</strong>
        </span>
      </div>

      <div className="w-full h-full">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: '',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          events={eventi}
          eventClick={handleEventClick}
          eventDidMount={eventDidMount}
          eventContent={eventContent}
          datesSet={(arg) => setCurrentDate(arg.start)}
          locale="it"
          nowIndicator={true}
          height="auto"
          aspectRatio={isMobile ? 0.8 : 1.5}
        />
      </div>
    </div>
  );
};

export default CalendarioFull;













import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

const CalendarioFull = ({ lezioni }) => {
  const calendarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [filtroAllievo, setFiltroAllievo] = useState('');
  const [lezioneSelezionata, setLezioneSelezionata] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calendarApi = () => calendarRef.current?.getApi();

  const handleEventClick = (info) => {
    setLezioneSelezionata(info.event.extendedProps);
  };

  const eventDidMount = (info) => {
    const { stato, riprogrammata } = info.event.extendedProps;
    const el = info.el;

    if (stato === 'rimandata' && riprogrammata) {
      el.style.backgroundColor = '#9333ea';
      el.style.color = 'white';
    } else if (stato === 'rimandata') {
      el.style.backgroundColor = 'orange';
      el.style.color = 'white';
    } else if (stato === 'annullata') {
      el.style.backgroundColor = 'red';
      el.style.color = 'white';
    } else if (stato === 'svolta') {
      el.style.backgroundColor = 'green';
      el.style.color = 'white';
    }
  };

  const eventContent = ({ event }) => {
    const { extendedProps } = event;
    return (
      <div className="text-sm leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            👤 {extendedProps.nome_allievo} {extendedProps.cognome_allievo}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            extendedProps.stato === 'svolta' ? 'bg-green-200 text-green-700' :
            extendedProps.stato === 'annullata' ? 'bg-red-200 text-red-700' :
            extendedProps.stato === 'rimandata' && extendedProps.riprogrammata ? 'bg-purple-200 text-purple-700' :
            extendedProps.stato === 'rimandata' ? 'bg-orange-200 text-orange-700' :
            'bg-gray-200 text-gray-600'
          }`}>
            {extendedProps.stato}
          </span>
        </div>
      </div>
    );
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    calendarApi()?.gotoDate(date);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(date);
  };

  // Filtro lezioni per nome allievo
  const lezioniFiltrate = lezioni.filter(lez => {
    const nomeCompleto = `${lez.nome_allievo} ${lez.cognome_allievo}`.toLowerCase();
    return nomeCompleto.includes(filtroAllievo.toLowerCase());
  });

  const eventi = lezioniFiltrate.map(lez => {
    const isRecupero = lez.stato === 'rimandata' && lez.riprogrammata;
    return {
      ...lez,
      title: isRecupero
        ? `🔄 Recupero con ${lez.nome_allievo || 'allievo'}`
        : `Lezione con ${lez.nome_allievo || 'allievo'}`,
    };
  });

  return (
    <div className={`p-2 sm:p-4 w-full ${isFullscreen ? 'fixed top-0 left-0 w-screen h-screen bg-white dark:bg-black z-50 p-4 overflow-y-auto' : 'overflow-hidden'}`}>

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">🗓️ Calendario Lezioni</h2>
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="px-3 py-1 rounded-xl bg-white dark:bg-gray-800 border text-primary text-sm shadow-sm active:scale-95 transition"
          >
            {isFullscreen ? '🔽 Riduci' : '⛶ Schermo Intero'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-sm">
          <label className="flex items-center gap-2">
            📅 Vai a data:
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="appearance-none border rounded-xl px-3 py-1 text-sm text-gray-800 bg-white dark:bg-gray-900 shadow-sm"
            />
          </label>

          <input
            type="text"
            placeholder="🔍 Filtra per allievo"
            value={filtroAllievo}
            onChange={(e) => setFiltroAllievo(e.target.value)}
            className="px-3 py-1 border rounded-xl text-sm shadow-sm bg-white dark:bg-gray-900"
          />

          <div className="flex gap-1">
            <button onClick={() => calendarApi()?.today()} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
              Oggi
            </button>
            <button onClick={() => setCurrentView('dayGridMonth') || calendarApi()?.changeView('dayGridMonth')} className="px-3 py-1 rounded-full bg-gray-200 text-xs">
              Mese
            </button>
            <button onClick={() => setCurrentView('timeGridWeek') || calendarApi()?.changeView('timeGridWeek')} className="px-3 py-1 rounded-full bg-gray-200 text-xs">
              Settimana
            </button>
            <button onClick={() => setCurrentView('listWeek') || calendarApi()?.changeView('listWeek')} className="px-3 py-1 rounded-full bg-gray-200 text-xs">
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentView}
          headerToolbar={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
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

      {/* MODAL Dettaglio Lezione */}
      <Dialog open={!!lezioneSelezionata} onClose={() => setLezioneSelezionata(null)} className="fixed z-50 inset-0 p-4 overflow-y-auto bg-black/50 flex items-center justify-center">
        <Dialog.Panel className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <Dialog.Title className="text-lg font-semibold">📄 Dettagli Lezione</Dialog.Title>
            <button onClick={() => setLezioneSelezionata(null)}>
              <X size={20} />
            </button>
          </div>
          {lezioneSelezionata && (
            <div className="space-y-2 text-sm">
              <p><strong>Allievo:</strong> {lezioneSelezionata.nome_allievo} {lezioneSelezionata.cognome_allievo}</p>
              <p><strong>Data:</strong> {formatDate(new Date(lezioneSelezionata.data))}</p>
              <p><strong>Ora:</strong> {lezioneSelezionata.ora_inizio} - {lezioneSelezionata.ora_fine}</p>
              <p><strong>Stato:</strong> {lezioneSelezionata.stato}</p>
              {lezioneSelezionata.motivazione && (
                <p><strong>Motivazione:</strong> {lezioneSelezionata.motivazione}</p>
              )}
              <p><strong>Aula:</strong> {lezioneSelezionata.aula}</p>
            </div>
          )}
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default CalendarioFull;














// src/CalendarioLezioni.js
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useEffect, useState } from 'react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import it from 'date-fns/locale/it';

const locales = {
  'it-IT': it,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);

  useEffect(() => {
    fetch(`https://app-docenti.onrender.com/api/insegnanti/${idInsegnante}/lezioni`)
      .then(res => res.json())
      .then(data => {
        const eventi = data.map(lez => ({
          title: `Allievo ${lez.id_allievo} - Aula ${lez.aula}`,
          start: new Date(`${lez.data}T${lez.ora_inizio}`),
          end: new Date(`${lez.data}T${lez.ora_fine}`),
        }));
        setLezioni(eventi);
      });
  }, [idInsegnante]);

  return (
    <div style={{ height: '600px', marginTop: '1rem' }}>
      <Calendar
        localizer={localizer}
        events={lezioni}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
      />
    </div>
  );
}

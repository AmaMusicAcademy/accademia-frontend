// src/CalendarioLezioni.js
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // Filtra solo le lezioni per l'insegnante specificato
        const filtered = data.filter(l => l.id_insegnante === idInsegnante);
        const eventi = filtered.map((lezione) => ({
          id: lezione.id,
          title: `Allievo: ${lezione.id_allievo}`,
          start: `${lezione.data}T${lezione.ora_inizio}`,
          end: `${lezione.data}T${lezione.ora_fine}`,
          extendedProps: {
            aula: lezione.aula,
            stato: lezione.stato,
          },
        }));
        setLezioni(eventi);
      } catch (err) {
        console.error('Errore nel caricamento lezioni:', err);
      }
    };
    fetchLezioni();
  }, [idInsegnante]);

  return (
    <div>
      <h2>Lezioni Insegnante #{idInsegnante}</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={lezioni}
        locale="it"
        height="auto"
      />
    </div>
  );
}

export default CalendarioLezioni;

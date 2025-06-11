// src/CalendarioLezioni.js
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import itLocale from '@fullcalendar/core/locales/it';

import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';

const API_URL = 'https://app-docenti.onrender.com/api/lezioni';

function CalendarioLezioni({ idInsegnante }) {
  const [lezioni, setLezioni] = useState([]);

  useEffect(() => {
//console.log('ID ins:',idInsegnante);
    
    const fetchLezioni = async () => {
      try {
        const res = await fetch(API_URL);
//console.log('risp fetch:',res);
        
        if (!res.ok) throw new Error('Errore nel recupero lezioni');
        const data = await res.json();
//console.log('lez ricevute:',data);
        
        // Filtra solo le lezioni per l'insegnante specificato
        const filtered = data.filter(l => l.id_insegnante === idInsegnante);
//console.log('lez filtrate:',filtered);
        
        // Mappa lezioni in eventi per il calendario
        const eventi = filtered.map((lezione) => ({
          id: lezione.id,
          title: `Allievo: ${lezione.id_allievo} | Aula: ${lezione.aula}`,
          start: `${lezione.data}T${lezione.ora_inizio}`,
          end: `${lezione.data}T${lezione.ora_fine}`,
          extendedProps: {
            stato: lezione.stato,
            aula: lezione.aula,
          },
        }));

        setLezioni(eventi);
      } catch (err) {
        console.error('Errore nel caricamento lezioni:', err);
        //alert('errore nel caricamento lezioni: ' + err.message);
      }
    };

    if (idInsegnante) {
      fetchLezioni();
    }
  }, [idInsegnante]);

  return (
    <div>
      <h2>Lezioni dell'insegnante #{idInsegnante}</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={itLocale}
        events={lezioni}
        height="auto"
        nowIndicator={true}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
      />
    </div>
  );
}

export default CalendarioLezioni;


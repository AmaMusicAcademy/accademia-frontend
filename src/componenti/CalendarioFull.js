import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import BottomNav from './BottomNav';
import './calendario.css';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioFull({ lezioni }) {
  //const [dataSelezionata, setDataSelezionata] = useState('');
  const [lezioniDelGiorno, setLezioniDelGiorno] = useState([]);
  const [data, setData] = useState('');
  const [dataSelezionata, setDataSelezionata] = useState('');

  const events = lezioni || [];



const colori = [
    '#007bff', '#28a745', '#ffc107', '#17a2b8',
    '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
  ];

  const [eventi, setEventi] = useState(
    lezioni.map((lezione, index) => ({
      id: lezione.id,
      title: '',
      start: lezione.start,
      end: lezione.end,
      color: colori[index % colori.length],
      extendedProps: {
        stato: lezione.stato,
        oraInizio: lezione.ora_inizio,
        oraFine: lezione.ora_fine,
        nome: lezione.nome_allievo,
        cognome: lezione.cognome_allievo,
        aula: lezione.aula
      }
    }))
  );

  const [showModal, setShowModal] = useState(false);
  const [oraInizio, setOraInizio] = useState('');
  const [oraFine, setOraFine] = useState('');
  const [allievo, setAllievo] = useState('');
  const [aula, setAula] = useState('');


  const handleDateClick = (info) => {
    const data = info.dateStr;
    const filtrate = eventi.filter(ev => ev.start.slice(0, 10) === data);
    setDataSelezionata(data);
    setLezioniDelGiorno(filtrate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuovaLezione = {
      data: data,
      ora_inizio: oraInizio,
      ora_fine: oraFine,
      aula: aula,
      stato: 'programmata',
      motivazione: '',
      id_allievo: parseInt(allievo),
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/lezioni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(nuovaLezione)
      });

      const lezioneCreata = await res.json();

      const nuovoEvento = {
        id: lezioneCreata.id,
        title: '',
        start: `${data}T${oraInizio}`,
        end: `${data}T${oraFine}`,
        color: colori[eventi.length % colori.length],
        extendedProps: {
          ...lezioneCreata,
          nome: lezioneCreata.nome_allievo || '',
          cognome: lezioneCreata.cognome_allievo || '',
          aula: aula,
          oraInizio: oraInizio,
          oraFine: oraFine
        }
      };

      setEventi([...eventi, nuovoEvento]);
      setShowModal(false);
      setOraInizio('');
      setOraFine('');
      setAllievo('');
      setAula('');
    } catch (err) {
      console.error('Errore creazione lezione:', err);
    }
  };

  return (
    <div className="calendario-container">
      <div className="calendario-sticky">
        <FullCalendar
          key={`${events.length}-${events[0]?.start || ''}`} 
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={eventi}
          dateClick={handleDateClick}
          displayEventTime={false}
          eventContent={renderCompactDot}
          dayMaxEvents={5}
          moreLinkContent={null}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          height="auto"
        />
        
      </div>

      {dataSelezionata && (
        <div className="bg-white mt-4 p-4 rounded-xl shadow overflow-y-auto elenco-lezioni">
          <h2 className="text-lg font-semibold mb-3">
            Appuntamenti del {new Date(dataSelezionata).toLocaleDateString('it-IT', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </h2>
          {lezioniDelGiorno.length === 0 && <p className="text-gray-500 italic">Nessuna lezione</p>}
          {lezioniDelGiorno.map((lez, i) => (
            <div key={i} className="border-b py-2">
              <div className="font-semibold">{lez.extendedProps.nome} {lez.extendedProps.cognome}</div>
              <div className="text-sm text-gray-700">{lez.extendedProps.oraInizio} - {lez.extendedProps.oraFine} | {lez.extendedProps.aula}</div>
              <div className="text-xs italic text-gray-500">({lez.extendedProps.stato})</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2">Nuova lezione</h2>
            <input
  type="date"
  className="border p-2 rounded"
  value={data}
  onChange={e => setData(e.target.value)}
  required
/>

            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <input type="time" className="border p-2 rounded" value={oraInizio} onChange={e => setOraInizio(e.target.value)} required />
              <input type="time" className="border p-2 rounded" value={oraFine} onChange={e => setOraFine(e.target.value)} required />
              <input type="text" className="border p-2 rounded" value={aula} onChange={e => setAula(e.target.value)} placeholder="Aula" required />
              <input type="number" className="border p-2 rounded" value={allievo} onChange={e => setAllievo(e.target.value)} placeholder="ID allievo" required />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salva</button>
            </form>
          </div>
        </div>
      )}

      <BottomNav
  mostraAggiungi={true}
  onAggiungiClick={() => {
    setDataSelezionata(new Date().toISOString().split('T')[0]);
    setData(new Date().toISOString().split('T')[0]); // Imposta la data odierna come default
    setShowModal(true);

  }}
/>

    </div>
  );
}

function renderCompactDot(arg) {
  return (
    <div className="fc-event-dot" style={{
      backgroundColor: arg.event.backgroundColor
    }}></div>
  );
}

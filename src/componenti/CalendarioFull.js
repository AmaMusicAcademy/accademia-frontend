import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './calendario.css';

// helpers etichette…
const parseHistory = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; } }
  return [];
};
const hasHistory = (l) => parseHistory(l?.old_schedules).length > 0;
const statoLabel = (l) => {
  const raw = (l?.stato || "svolta").toLowerCase();
  if (raw === "rimandata" && l?.riprogrammata && hasHistory(l)) return "riprogrammata";
  return raw;
};
const badgeTone = (label) => {
  if (label === "annullata") return "red";
  if (label === "riprogrammata") return "purple";
  if (label === "rimandata") return "orange";
  if (label === "svolta") return "green";
  return "gray";
};

const colori = [
  '#007bff', '#28a745', '#ffc107', '#17a2b8',
  '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
];

export default function CalendarioFull({
  lezioni = [],
  onOpenEdit = () => {},
  onRimanda = () => {},
  onAnnulla = () => {},
}) {
  const [lezioniDelGiorno, setLezioniDelGiorno] = useState([]);
  const [dataSelezionata, setDataSelezionata] = useState('');

  // Solo “svolta” o “rimandata riprogrammata” nel calendario
  const eventi = useMemo(() => {
    const filtered = (Array.isArray(lezioni) ? lezioni : []).filter((l) => {
      const raw = (l.stato || "svolta").toLowerCase();
      if (raw === "annullata") return false;
      if (raw === "rimandata") return Boolean(l.riprogrammata) && hasHistory(l);
      return true;
    });

    return filtered.map((l, index) => ({
      id: l.id,
      title: '',
      start: l.start ?? `${String(l.data).slice(0,10)}T${String(l.ora_inizio).slice(0,5)}`,
      end: l.end ?? `${String(l.data).slice(0,10)}T${String(l.ora_fine).slice(0,5)}`,
      color: colori[index % colori.length],
      extendedProps: {
        ...l,
        oraInizio: l.ora_inizio,
        oraFine: l.ora_fine,
        nome: l.nome_allievo,
        cognome: l.cognome_allievo,
      }
    }));
  }, [lezioni]);

  const handleDateClick = (info) => {
    const day = info.dateStr;
    setDataSelezionata(day);
    const items = eventi.filter(ev => (ev.start || "").slice(0, 10) === day);
    items.sort((a, b) => (a.extendedProps.oraInizio || "").localeCompare(b.extendedProps.oraInizio || ""));
    setLezioniDelGiorno(items);
  };

  return (
    <div className="calendario-container">
      <div className="calendario-sticky">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={eventi}
          dateClick={handleDateClick}
          displayEventTime={false}
          eventContent={renderCompactDot}
          dayMaxEvents={5}
          moreLinkContent={null}
          /* 👇 niente scroll interni, il calendario cresce in altezza */
          height="auto"
          contentHeight="auto"
          handleWindowResize={true}
          expandRows={true}
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

          {lezioniDelGiorno.map((ev, i) => {
            const l = ev.extendedProps || {};
            const label = statoLabel(l);
            const tone = badgeTone(label);
            const raw = (l.stato || "svolta").toLowerCase();
            const isRimandata = raw === "rimandata";
            const isAnnullata = raw === "annullata";
            const orario = `${String(l.oraInizio || '').slice(0,5)} - ${String(l.oraFine || '').slice(0,5)}`;

            return (
              <div
                key={`${ev.id || "k"}-${i}`}
                className="border-b py-2 cursor-pointer"
                title="Modifica lezione"
                onClick={() => onOpenEdit(l, "edit")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {l.nome || ""} {l.cognome || ""}
                    </div>
                    <div className="text-sm text-gray-700">
                      {orario} {l.aula ? `| Aula ${l.aula}` : ""}
                    </div>
                    {l.motivazione && label !== "svolta" && (
                      <div className="text-xs text-gray-500 mt-0.5">Motivo: {l.motivazione}</div>
                    )}
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${
                      tone === "red" ? "bg-red-100 text-red-700 border-red-200" :
                      tone === "purple" ? "bg-purple-100 text-purple-700 border-purple-200" :
                      tone === "orange" ? "bg-orange-100 text-orange-700 border-orange-200" :
                      tone === "green" ? "bg-green-100 text-green-700 border-green-200" :
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {label}
                    </span>
                  </div>

                  {!isAnnullata && (
                    <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isRimandata ? (
                        <>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-amber-600 text-white"
                            title="Riprogramma"
                            onClick={() => onOpenEdit(l, "reschedule")}
                          >
                            Riprogramma
                          </button>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                            title="Annulla"
                            onClick={() => onAnnulla(l)}
                          >
                            Annulla
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-800"
                            title="Rimanda"
                            onClick={() => onRimanda(l)}
                          >
                            Rimanda
                          </button>
                          <button
                            className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                            title="Annulla"
                            onClick={() => onAnnulla(l)}
                          >
                            Annulla
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderCompactDot(arg) {
  return (
    <div className="fc-event-dot" style={{ backgroundColor: arg.event.backgroundColor }}></div>
  );
}
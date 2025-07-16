// src/componenti/CalendarioFull.js
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import { BadgeInfo, X } from "lucide-react";
import "./calendario.css"; // opzionale per override stile

Modal.setAppElement("#root");

const CalendarioFull = ({ lezioni = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [lezioniDelGiorno, setLezioniDelGiorno] = useState([]);
  const [lezioneAttiva, setLezioneAttiva] = useState(null);
  const calendarRef = useRef(null);

  const handleDateClick = (arg) => {
    const giorno = arg.dateStr;
    setSelectedDate(giorno);

    const lezioniGiorno = lezioni.filter((l) => l.start.startsWith(giorno));
    setLezioniDelGiorno(lezioniGiorno);
  };

  const handleEventClick = (info) => {
    setLezioneAttiva(info.event.extendedProps);
  };

  const renderEventContent = (eventInfo) => (
    <div className="flex items-center justify-center h-3 w-3 rounded-full bg-blue-500 mx-auto mt-1"></div>
  );

  const closeModal = () => setLezioneAttiva(null);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4">
      <div className="sticky top-0 z-10 bg-white pb-2 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          events={lezioni}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto"
        />
      </div>

      {selectedDate && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Lezioni del {new Date(selectedDate).toLocaleDateString("it-IT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {lezioniDelGiorno.length === 0 ? (
            <p className="text-gray-500">Nessuna lezione in questo giorno.</p>
          ) : (
            <ul className="space-y-2">
              {lezioniDelGiorno.map((lezione, idx) => (
                <li
                  key={idx}
                  className="bg-white border rounded-lg p-3 shadow flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {lezione.nome_allievo || "Allievo sconosciuto"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lezione.ora_inizio} - {lezione.ora_fine}
                    </p>
                  </div>
                  <button
                    onClick={() => setLezioneAttiva(lezione)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <BadgeInfo size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal
        isOpen={!!lezioneAttiva}
        onRequestClose={closeModal}
        contentLabel="Dettaglio Lezione"
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-24 relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
      >
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={22} />
        </button>
        {lezioneAttiva && (
          <>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Dettagli Lezione
            </h2>
            <p className="mb-1">
              <strong>Allievo:</strong> {lezioneAttiva.nome_allievo}
            </p>
            <p className="mb-1">
              <strong>Data:</strong>{" "}
              {new Date(lezioneAttiva.data).toLocaleDateString("it-IT")}
            </p>
            <p className="mb-1">
              <strong>Orario:</strong> {lezioneAttiva.ora_inizio} -{" "}
              {lezioneAttiva.ora_fine}
            </p>
            <p className="mb-1">
              <strong>Aula:</strong> {lezioneAttiva.aula}
            </p>
            <p className="mb-1">
              <strong>Stato:</strong> {lezioneAttiva.stato}
            </p>
            {lezioneAttiva.motivazione && (
              <p className="text-sm italic text-gray-600">
                {lezioneAttiva.motivazione}
              </p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default CalendarioFull;













import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { MapPin, User, Clock, Pencil, UserCheck, UserX, RotateCcw, Users, ChevronDown, ChevronUp } from "lucide-react";
import EditLessonModal from "./EditLessonModal";
import AssenteModal from "./AssenteModal";
import "./calendario.css";

const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

// ── utils ──────────────────────────────────────────────────────────────────
function getToken() {
  try { return localStorage.getItem("token") || null; } catch { return null; }
}
const ymd  = (d) => String(d || "").slice(0, 10);
const hhmm = (t) => t ? String(t).slice(0, 5) : "";

const sameKey = (o) =>
  [
    ymd(o.data) || (typeof o.start === "string" ? o.start.slice(0,10) : ""),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11,16) : ""),
    o.ora_fine   || (typeof o.end   === "string" ? o.end.slice(11,16)   : ""),
    String(o.id_allievo || o.extendedProps?.id_allievo || ""),
    String(o.aula || o.extendedProps?.aula || ""),
  ].join("|");

const parseHistory  = (v) => { if (Array.isArray(v)) return v; try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; } };
const hasHistory    = (l) => parseHistory(l?.old_schedules).length > 0;

const statoLabel = (src) => {
  const stato = (src?.stato || src?.extendedProps?.stato || "appuntamentata").toLowerCase();
  const riprogrammata = Boolean(src?.riprogrammata ?? src?.extendedProps?.riprogrammata);
  const history = src?.old_schedules ?? src?.extendedProps?.old_schedules;
  if (stato === "rimandata" && riprogrammata && hasHistory({ old_schedules: history })) return "riprogrammata";
  return stato;
};

const visibleInCalendar = (src) => {
  const stato = (src?.stato || src?.extendedProps?.stato || "appuntamentata").toLowerCase();
  const riprogrammata = Boolean(src?.riprogrammata ?? src?.extendedProps?.riprogrammata);
  if (stato === "annullata") return false;
  if (stato === "rimandata" && !riprogrammata) return false;
  return true;
};

const STATO_STYLE = {
  appuntamentata: { dot: "bg-ama-1000",    badge: "bg-ama-100 text-blue-700 border-blue-100" },
  svolta:         { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rimandata:      { dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100" },
  riprogrammata:  { dot: "bg-purple-500",  badge: "bg-purple-50 text-purple-700 border-purple-100" },
  annullata:      { dot: "bg-red-400",     badge: "bg-red-50 text-red-700 border-red-100" },
  senza_aula:     { dot: "bg-orange-400",  badge: "bg-orange-50 text-orange-700 border-orange-200" },
};

// dot color per FullCalendar events
const DOT_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#6366f1"];

// ── API helpers ────────────────────────────────────────────────────────────
async function patchRimanda(id, motivazione, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/rimanda`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivazione: motivazione || "" }),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore (${res.status})`);
  return res.json();
}
async function patchPresente(id, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/presente`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore (${res.status})`);
  return res.json();
}
async function patchAnnullaPresenza(id, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/annulla-presenza`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore (${res.status})`);
  return res.json();
}
async function patchAnnulla(id, motivazione, token) {
  const res = await fetch(`${API_BASE}/api/lezioni/${id}/annulla`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivazione: motivazione || "" }),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Errore (${res.status})`);
  return res.json();
}

// ── componente ─────────────────────────────────────────────────────────────
export default function CalendarioFull({ lezioni, mostraInsegnante = false }) {
  const token = getToken();
  const isAdmin = (localStorage.getItem('ruolo') || '') === 'admin';

  const [eventi, setEventi]               = useState([]);
  const [chiusure, setChiusure]           = useState([]); // [{data, descrizione}]
  const [dataSelezionata, setDataSel]     = useState("");
  const [lezioniDelGiorno, setLDG]        = useState([]);
  const [editOpen, setEditOpen]           = useState(false);
  const [editMode, setEditMode]           = useState("edit");
  const [editLesson, setEditLesson]       = useState(null);
  const [azioneLoading, setAzioneLoading] = useState(null);
  const [assenteEv, setAssenteEv]         = useState(null);
  // presenze lezioni collettive
  const [presenzeOpen, setPresenzeOpen]   = useState(null); // lezione_id aperta
  const [presenze, setPresenze]           = useState({});   // { [lezione_id]: [...] }
  const [presenzeLoading, setPresenzeLoading] = useState({});

  // carica giorni di chiusura
  useEffect(() => {
    fetch(`${API_BASE}/api/giorni-chiusura`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setChiusure(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  // costruisce eventi FullCalendar
  useEffect(() => {
    const mapped = (Array.isArray(lezioni) ? lezioni : [])
      .map((l, i) => ({
        id: l.id,
        title: "",
        start: `${ymd(l.data)}T${hhmm(l.ora_inizio)}`,
        end:   `${ymd(l.data)}T${hhmm(l.ora_fine)}`,
        backgroundColor: "#3b82f6",
        borderColor:     "#3b82f6",
        extendedProps:   { ...l, oraInizio: hhmm(l.ora_inizio), oraFine: hhmm(l.ora_fine) },
      }))
      .filter(visibleInCalendar);

    setEventi(mapped);
    if (dataSelezionata) {
      setLDG(mapped.filter((ev) => ev.start.slice(0,10) === dataSelezionata));
    }
  }, [lezioni]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateClick = ({ dateStr }) => {
    setDataSel(dateStr);
    setLDG(eventi.filter((ev) => ev.start.slice(0,10) === dateStr));
  };

  // aggiorna evento nel state locale
  const patchLocalEvent = (target, patch) => {
    setEventi((prev) => {
      const next = prev.map((ev) => {
        const match = (ev.id != null && ev.id === target.id) || sameKey(ev) === sameKey(target.extendedProps || target);
        if (!match) return ev;
        return { ...ev, extendedProps: { ...(ev.extendedProps || {}), ...patch } };
      }).filter(visibleInCalendar);
      if (dataSelezionata) setLDG(next.filter((ev) => ev.start.slice(0,10) === dataSelezionata));
      return next;
    });
  };

  const onPresente = async (ev) => {
    const realId = ev.id ?? ev.extendedProps?.id;
    if (!realId) return;
    setAzioneLoading(realId);
    try {
      patchLocalEvent(ev, { stato: "svolta" });
      await patchPresente(realId, token);
    } catch (e) { alert(e.message); }
    finally { setAzioneLoading(null); }
  };

  const onAnnullaPresenza = async (ev) => {
    const realId = ev.id ?? ev.extendedProps?.id;
    if (!realId) return;
    setAzioneLoading(realId);
    try {
      patchLocalEvent(ev, { stato: "appuntamentata" });
      await patchAnnullaPresenza(realId, token);
    } catch (e) { alert(e.message); }
    finally { setAzioneLoading(null); }
  };

  const onAssenteRimanda = async (note) => {
    const ev = assenteEv;
    setAssenteEv(null);
    const realId = ev.id ?? ev.extendedProps?.id;
    if (!realId) return;
    setAzioneLoading(realId);
    try {
      patchLocalEvent(ev, { stato: "rimandata", riprogrammata: false, motivazione: note });
      await patchRimanda(realId, note, token);
    } catch (e) { alert(e.message); }
    finally { setAzioneLoading(null); }
  };

  const onAssenteAnnulla = async (note) => {
    const ev = assenteEv;
    setAssenteEv(null);
    const realId = ev.id ?? ev.extendedProps?.id;
    if (!realId) return;
    setAzioneLoading(realId);
    try {
      patchLocalEvent(ev, { stato: "annullata", riprogrammata: false, motivazione: note });
      await patchAnnulla(realId, note, token);
    } catch (e) { alert(e.message); }
    finally { setAzioneLoading(null); }
  };

  const togglePresenzePanel = async (lezioneId) => {
    if (presenzeOpen === lezioneId) { setPresenzeOpen(null); return; }
    setPresenzeOpen(lezioneId);
    if (presenze[lezioneId]) return; // già caricate
    setPresenzeLoading(l => ({ ...l, [lezioneId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/lezioni/${lezioneId}/partecipanti`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lista = await res.json();
      setPresenze(p => ({ ...p, [lezioneId]: Array.isArray(lista) ? lista : [] }));
    } catch { /* ignora */ }
    finally { setPresenzeLoading(l => ({ ...l, [lezioneId]: false })); }
  };

  const togglePresenza = async (lezioneId, allievoId, presente) => {
    setPresenze(p => ({
      ...p,
      [lezioneId]: (p[lezioneId] || []).map(a =>
        a.allievo_id === allievoId ? { ...a, presente } : a
      ),
    }));
    await fetch(`${API_BASE}/api/lezioni/${lezioneId}/partecipanti/${allievoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ presente }),
    }).catch(() => {});
  };

  const openEdit = (ev, mode = "edit") => {
    setEditLesson({ ...(ev.extendedProps || {}), start: ev.start, end: ev.end });
    setEditMode(mode);
    setEditOpen(true);
  };

  const handleSaved = (updated) => {
    setEditOpen(false);
    if (!updated) return;
    setEventi((prev) => {
      const filtered = prev.filter((e) => (e.id ?? e.extendedProps?.id) !== updated.id);
      if (!visibleInCalendar(updated)) return filtered;
      const d = ymd(updated.data);
      const next = [...filtered, {
        id: updated.id,
        title: "",
        start: `${d}T${hhmm(updated.ora_inizio)}`,
        end:   `${d}T${hhmm(updated.ora_fine)}`,
        backgroundColor: "#3b82f6",
        borderColor:     "#3b82f6",
        extendedProps:   { ...updated, oraInizio: hhmm(updated.ora_inizio), oraFine: hhmm(updated.ora_fine) },
      }];
      if (dataSelezionata) setLDG(next.filter((ev) => ev.start.slice(0,10) === dataSelezionata));
      return next;
    });
  };

  const eventiOrdinati = useMemo(() =>
    [...lezioniDelGiorno].sort((a, b) => {
      const A = a.extendedProps?.oraInizio || a.start.slice(11,16);
      const B = b.extendedProps?.oraInizio || b.start.slice(11,16);
      return A.localeCompare(B);
    }),
  [lezioniDelGiorno]);

  const formatDataLunga = (ymdStr) => {
    if (!ymdStr) return "";
    const [y, m, d] = ymdStr.split("-");
    return new Date(Date.UTC(+y, +m-1, +d)).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long",
    });
  };

  return (
    <div className="calendario-container">
      <div className="cal-gutters">

        {/* ── Griglia mensile ── */}
        <div className="calendario-sticky">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={[
              ...eventi,
              // Background events: domeniche
              // (gestite via dayCellClassNames, non servono eventi extra)
              // Background events: giorni di chiusura
              ...chiusure.map(c => ({
                start: c.data,
                display: 'background',
                backgroundColor: '#fef2f2',
                classNames: ['fc-chiusura'],
                extendedProps: { isChiusura: true, descrizione: c.descrizione },
              })),
            ]}
            dateClick={handleDateClick}
            displayEventTime={false}
            eventContent={(arg) => {
              if (arg.event.display === 'background') return null;
              return renderDot(arg);
            }}
            dayCellClassNames={(arg) => {
              const classes = [];
              if (arg.date.getDay() === 0) classes.push('fc-domenica');
              const dataStr = arg.date.toISOString().slice(0, 10);
              if (chiusure.some(c => c.data === dataStr)) classes.push('fc-chiusura-cell');
              return classes;
            }}
            dayCellDidMount={(arg) => {
              const dataStr = arg.date.toISOString().slice(0, 10);
              const chiusura = chiusure.find(c => c.data === dataStr);
              if (chiusura?.descrizione) {
                const el = arg.el.querySelector('.fc-daygrid-day-top');
                if (el && !el.querySelector('.fc-chiusura-label')) {
                  const label = document.createElement('div');
                  label.className = 'fc-chiusura-label';
                  label.textContent = chiusura.descrizione;
                  el.appendChild(label);
                }
              }
            }}
            dayMaxEvents={5}
            height="auto"
            contentHeight="auto"
            fixedWeekCount={false}
            handleWindowResize={true}
            locale="it"
            buttonText={{ today: "Oggi", month: "Mese" }}
          />
        </div>

        {/* ── Lista lezioni del giorno ── */}
        {dataSelezionata && (
          <div className="mt-4">
            {/* intestazione giorno */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-n-900 capitalize">
                {formatDataLunga(dataSelezionata)}
              </h2>
              <span className="text-xs text-n-300">
                {eventiOrdinati.length} {eventiOrdinati.length === 1 ? "lezione" : "lezioni"}
              </span>
            </div>

            {eventiOrdinati.length === 0 ? (
              <div className="bg-white border rounded-xl p-6 text-center text-n-300 text-sm">
                Nessuna lezione in questo giorno
              </div>
            ) : (
              <div className="bg-white border rounded-xl overflow-hidden elenco-lezioni">
                {eventiOrdinati.map((ev, i) => {
                  const ep     = ev.extendedProps || {};
                  const label  = statoLabel(ev);
                  const senzaAula = label === 'appuntamentata' && !ep.aula;
                  const style  = senzaAula ? STATO_STYLE.senza_aula : (STATO_STYLE[label] || STATO_STYLE.appuntamentata);
                  const orario = `${ep.oraInizio || hhmm(ep.ora_inizio)} – ${ep.oraFine || hhmm(ep.ora_fine)}`;
                  const realId = ev.id ?? ep.id;
                  const loading = azioneLoading === realId;
                  const isAppuntamentata = label === "appuntamentata";
                  const isRimandata      = label === "rimandata";
                  const isAnnullata      = label === "annullata";
                  const isSvolta         = label === "svolta";

                  const isCollettiva = ep.tipo === 'collettiva';
                  const presenzeAperte = presenzeOpen === realId;

                  return (
                    <div key={`${realId || "k"}-${i}`}>
                      <div
                        className={`flex items-start gap-3 px-4 py-3 ${i < eventiOrdinati.length - 1 && !presenzeAperte ? "border-b border-gray-50" : ""}`}
                      >
                        {/* dot colore */}
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />

                        {/* contenuto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-n-900">
                              {isCollettiva
                                ? (ep.nome_gruppo || "Gruppo")
                                : (ep.nome_allievo && ep.cognome_allievo)
                                  ? `${ep.nome_allievo} ${ep.cognome_allievo}`
                                  : "Allievo"}
                            </span>
                            {isCollettiva && (
                              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                <Users size={9} /> {ep.num_partecipanti || 0}
                              </span>
                            )}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
                              {label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap text-xs text-n-600">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {orario}
                            </span>
                            {ep.aula ? (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} /> {ep.aula}
                              </span>
                            ) : label === 'appuntamentata' ? (
                              <span className="flex items-center gap-1 text-orange-500 font-medium">
                                <MapPin size={11} /> Aula da assegnare
                              </span>
                            ) : null}
                            {mostraInsegnante && ep.nome_insegnante && (
                              <span className="flex items-center gap-1">
                                <User size={11} /> {ep.nome_insegnante} {ep.cognome_insegnante}
                              </span>
                            )}
                          </div>

                          {ep.motivazione && label !== "svolta" && (
                            <p className="text-xs text-n-300 mt-1 italic">{ep.motivazione}</p>
                          )}
                        </div>

                        {/* azioni */}
                        {!loading && (
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isCollettiva ? (
                              <>
                                {isAppuntamentata && (
                                  <ActionBtn icon={<Pencil size={13} />} label="Modifica" color="gray" onClick={() => openEdit(ev, "edit")} />
                                )}
                                {isSvolta && isAdmin && (
                                  <ActionBtn icon={<RotateCcw size={13} />} label="Ripristina" color="gray" onClick={() => onAnnullaPresenza(ev)} />
                                )}
                                <ActionBtn
                                  icon={presenzeAperte ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  label="Presenze"
                                  color="gray"
                                  onClick={() => togglePresenzePanel(realId)}
                                />
                              </>
                            ) : (
                              <>
                                {isAppuntamentata && (
                                  <>
                                    <ActionBtn icon={<Pencil size={13} />}    label="Modifica" color="gray"    onClick={() => openEdit(ev, "edit")} />
                                    <ActionBtn icon={<UserCheck size={13} />} label="P"        color="emerald" onClick={() => onPresente(ev)} />
                                    <ActionBtn icon={<UserX size={13} />}     label="A"        color="red"     onClick={() => setAssenteEv(ev)} />
                                  </>
                                )}
                                {isRimandata && (
                                  <ActionBtn icon={<Pencil size={13} />} label="Riprogramma" color="amber" onClick={() => openEdit(ev, "reschedule")} />
                                )}
                                {isSvolta && isAdmin && (
                                  <ActionBtn icon={<RotateCcw size={13} />} label="Ripristina" color="gray" onClick={() => onAnnullaPresenza(ev)} />
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {loading && (
                          <div className="w-4 h-4 border-2 border-ama-500 border-t-transparent rounded-full animate-spin shrink-0 mt-1" />
                        )}
                      </div>

                      {/* Presenze panel per lezioni collettive */}
                      {isCollettiva && presenzeAperte && (
                        <div className={`px-4 pb-3 border-b border-gray-50 ${i < eventiOrdinati.length - 1 ? "" : ""}`}>
                          {presenzeLoading[realId] ? (
                            <div className="flex justify-center py-3">
                              <div className="w-4 h-4 border-2 border-ama-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (presenze[realId] || []).length === 0 ? (
                            <p className="text-xs text-n-300 py-2 text-center">Nessun partecipante.</p>
                          ) : (
                            <div className="space-y-1 mt-1">
                              {(presenze[realId] || []).map(p => (
                                <div key={p.allievo_id} className="flex items-center gap-2">
                                  <div className="flex-1 text-xs text-n-700">{p.cognome} {p.nome}</div>
                                  <button
                                    onClick={() => togglePresenza(realId, p.allievo_id, !p.presente)}
                                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                                      p.presente
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                    }`}
                                  >
                                    {p.presente ? <UserCheck size={9} /> : <UserX size={9} />}
                                    {p.presente ? 'Presente' : 'Assente'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <EditLessonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
      />

      <AssenteModal
        open={!!assenteEv}
        onClose={() => setAssenteEv(null)}
        onRimanda={onAssenteRimanda}
        onAnnulla={onAssenteAnnulla}
      />
    </div>
  );
}

// ── sub-componenti ─────────────────────────────────────────────────────────
function ActionBtn({ icon, label, color, onClick }) {
  const colors = {
    gray:    "bg-n-100 text-n-600 hover:bg-gray-200",
    amber:   "bg-amber-50 text-amber-700 hover:bg-amber-100",
    red:     "bg-red-50 text-red-600 hover:bg-red-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <button
      title={label}
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color] || colors.gray}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function renderDot(arg) {
  return (
    <div
      className="fc-event-dot"
      style={{ backgroundColor: arg.event.backgroundColor }}
    />
  );
}

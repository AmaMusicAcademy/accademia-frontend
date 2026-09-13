import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal";
import PageHeader from "../componenti/PageHeader";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

const GRID_START  = 8;   // 08:00
const GRID_END    = 21;  // 21:00
const HOUR_H      = 64;  // px per hour
const TOTAL_H     = (GRID_END - GRID_START) * HOUR_H;

const COLORS = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', chip: '#3b82f6' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', chip: '#10b981' },
  { bg: '#ede9fe', border: '#c4b5fd', text: '#4c1d95', chip: '#8b5cf6' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', chip: '#f59e0b' },
  { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', chip: '#ef4444' },
  { bg: '#cffafe', border: '#67e8f9', text: '#164e63', chip: '#06b6d4' },
  { bg: '#ffedd5', border: '#fdba74', text: '#9a3412', chip: '#f97316' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d', chip: '#ec4899' },
];

const GIORNI_LONG  = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MESI_SHORT   = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function todayYMD() { return toYMD(new Date()); }

function fmtHeader(ymd) {
  const d = new Date(ymd + 'T00:00:00');
  const t = todayYMD();
  const label = ymd === t ? 'Oggi' : GIORNI_LONG[d.getDay()];
  return `${label} ${d.getDate()} ${MESI_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function addDays(ymd, n) {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

function timeToMin(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.slice(0,5).split(':').map(Number);
  return h * 60 + m;
}

// Layout algorithm: assign column index to overlapping events
function layoutEvents(events) {
  const sorted = [...events].sort((a,b) => a.startMin - b.startMin);
  const cols = []; // cols[i] = endMin of last event in column i

  return sorted.map(ev => {
    let col = cols.findIndex(endMin => endMin <= ev.startMin);
    if (col === -1) { col = cols.length; }
    cols[col] = ev.endMin;
    return { ...ev, col, totalCols: 0 };
  }).map((ev, _, arr) => {
    // count how many columns are needed for overlapping group
    const overlapping = arr.filter(e =>
      e.startMin < ev.endMin && e.endMin > ev.startMin
    );
    return { ...ev, totalCols: Math.max(...overlapping.map(e => e.col)) + 1 };
  });
}

export default function CalendarioAdmin() {
  const [lezioni, setLezioni]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [day, setDay]           = useState(todayYMD());

  const [editOpen, setEditOpen]     = useState(false);
  const [editMode, setEditMode]     = useState("edit");
  const [editLesson, setEditLesson] = useState(null);

  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/lezioni?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
      const data = await res.json();
      setLezioni(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { refetch(); }, [refetch]);

  const colorMap = useMemo(() => {
    const map = {};
    teachers.forEach((t, i) => { map[String(t.id)] = COLORS[i % COLORS.length]; });
    return map;
  }, [teachers]);

  // Lezioni del giorno corrente, filtrate per insegnante
  const dayEvents = useMemo(() => {
    return lezioni
      .filter(l => {
        if (!l.data) return false;
        if (String(l.data).slice(0,10) !== day) return false;
        if (selected.size > 0 && !selected.has(String(l.id_insegnante))) return false;
        return true;
      })
      .map(l => {
        const oi = l.ora_inizio ? String(l.ora_inizio).slice(0,5) : null;
        const of = l.ora_fine   ? String(l.ora_fine).slice(0,5)   : null;
        return {
          ...l,
          startMin: timeToMin(oi),
          endMin:   timeToMin(of),
          oi, of,
        };
      })
      .filter(l => l.startMin !== null && l.endMin !== null);
  }, [lezioni, day, selected]);

  const laidOut = useMemo(() => layoutEvents(dayEvents), [dayEvents]);

  const toggleTeacher = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
      return next;
    });
  };

  const openEdit = (l) => { setEditLesson(l); setEditMode('edit'); setEditOpen(true); };
  const openAdd  = () => { setEditLesson(null); setEditMode('create'); setEditOpen(true); };

  // Indicatore ora corrente
  const nowMin = useMemo(() => {
    if (day !== todayYMD()) return null;
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }, [day]);

  const nowTop = nowMin !== null
    ? ((nowMin - GRID_START * 60) / 60) * HOUR_H
    : null;

  return (
    <div className="min-h-screen bg-n-100 flex flex-col pb-20">
      <PageHeader title="Calendario" backTo={false} />

      {/* Chip filtro insegnanti */}
      {teachers.length > 0 && (
        <div className="px-4 pt-3 pb-2 bg-white border-b">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {teachers.map(t => {
              const c   = colorMap[String(t.id)] || COLORS[0];
              const sel = selected.has(String(t.id));
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTeacher(t.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={sel
                    ? { backgroundColor: c.chip, color: '#fff' }
                    : { backgroundColor: '#fff', color: c.chip, border: `1.5px solid ${c.chip}` }
                  }
                >
                  {!sel && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.chip }} />}
                  {t.nome} {t.cognome}
                </button>
              );
            })}
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-n-100 text-n-500"
              >
                Tutti
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigatore giorno */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b">
        <button
          onClick={() => setDay(d => addDays(d, -1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-n-50 active:bg-n-100"
        >
          <ChevronLeft size={18} className="text-n-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-n-900">{fmtHeader(day)}</p>
        </div>
        <button
          onClick={() => setDay(d => addDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-n-50 active:bg-n-100"
        >
          <ChevronRight size={18} className="text-n-600" />
        </button>
      </div>

      {/* Griglia oraria */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative flex" style={{ height: TOTAL_H }}>

            {/* Colonna orari */}
            <div className="w-12 shrink-0 relative border-r border-n-100">
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 flex items-start justify-end pr-1.5"
                  style={{ top: i * HOUR_H - 7, height: HOUR_H }}
                >
                  <span className="text-[10px] text-n-300 font-medium">
                    {String(GRID_START + i).padStart(2,'0')}
                  </span>
                </div>
              ))}
            </div>

            {/* Area eventi */}
            <div className="flex-1 relative">

              {/* Righe orarie */}
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-n-100"
                  style={{ top: i * HOUR_H }}
                />
              ))}

              {/* Linea ora corrente */}
              {nowTop !== null && nowTop >= 0 && nowTop <= TOTAL_H && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              )}

              {/* Nessuna lezione */}
              {laidOut.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-n-300">Nessuna lezione</p>
                </div>
              )}

              {/* Blocchi lezione */}
              {laidOut.map(l => {
                const c = colorMap[String(l.id_insegnante)] || COLORS[0];
                const top    = Math.max(0, (l.startMin - GRID_START * 60) / 60 * HOUR_H);
                const height = Math.max(20, (l.endMin - l.startMin) / 60 * HOUR_H - 2);
                const colW   = 100 / l.totalCols;
                const left   = `${l.col * colW}%`;
                const width  = `calc(${colW}% - 4px)`;
                const nomeAllievo = l.nome_allievo
                  ? `${l.nome_allievo} ${l.cognome_allievo || ''}`.trim()
                  : l.title || '—';
                const nomeIns = l.nome_insegnante
                  ? `${l.nome_insegnante} ${l.cognome_insegnante || ''}`.trim()
                  : '';

                return (
                  <button
                    key={l.id}
                    onClick={() => openEdit(l)}
                    className="absolute rounded-lg px-2 py-1 text-left overflow-hidden active:opacity-70 transition-opacity"
                    style={{
                      top,
                      height,
                      left,
                      width,
                      backgroundColor: c.bg,
                      border: `1.5px solid ${c.border}`,
                    }}
                  >
                    <p className="text-xs font-semibold leading-tight truncate" style={{ color: c.text }}>
                      {l.oi} – {l.of}
                    </p>
                    <p className="text-xs font-medium leading-tight truncate" style={{ color: c.text }}>
                      {nomeAllievo}
                    </p>
                    {height > 36 && nomeIns && (
                      <p className="text-[10px] leading-tight truncate opacity-70" style={{ color: c.text }}>
                        {nomeIns}
                        {l.aula ? ` · Aula ${l.aula}` : ''}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <EditLessonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={async () => { setEditOpen(false); await refetch(); }}
        lesson={editLesson}
        mode={editMode}
        allowRecurring={true}
        showTeacherSelect={true}
      />

      <BottomNavAdmin onAdd={openAdd} />
    </div>
  );
}

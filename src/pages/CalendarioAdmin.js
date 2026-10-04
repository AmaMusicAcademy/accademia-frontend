import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal";
import LezionProvaModal from "../componenti/LezionProvaModal";
import PageHeader from "../componenti/PageHeader";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

const GRID_START  = 8;
const GRID_END    = 21;
const HOUR_H      = 64;
const TOTAL_H     = (GRID_END - GRID_START) * HOUR_H;

const COLORS = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a', chip: '#2563eb' },
  { bg: '#dcfce7', border: '#86efac', text: '#14532d', chip: '#16a34a' },
  { bg: '#f3e8ff', border: '#d8b4fe', text: '#581c87', chip: '#9333ea' },
  { bg: '#fee2e2', border: '#fca5a5', text: '#7f1d1d', chip: '#dc2626' },
  { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12', chip: '#ea580c' },
  { bg: '#fdf4ff', border: '#f0abfc', text: '#701a75', chip: '#c026d3' },
  { bg: '#ccfbf1', border: '#5eead4', text: '#134e4a', chip: '#0d9488' },
  { bg: '#fefce8', border: '#fde047', text: '#713f12', chip: '#ca8a04' },
];

const GIORNI_LONG  = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const GIORNI_SHORT = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
const MESI_SHORT   = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const MESI_LONG    = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

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

function parseDow(str) {
  if (!str) return new Set();
  return new Set(str.split(',').map(Number).filter(n => !isNaN(n)));
}

function snapTo15(min) {
  return Math.round(min / 15) * 15;
}

function minToHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
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

function layoutEvents(events) {
  const sorted = [...events].sort((a,b) => a.startMin - b.startMin);
  const cols = [];
  return sorted.map(ev => {
    let col = cols.findIndex(endMin => endMin <= ev.startMin);
    if (col === -1) { col = cols.length; }
    cols[col] = ev.endMin;
    return { ...ev, col, totalCols: 0 };
  }).map((ev, _, arr) => {
    const overlapping = arr.filter(e => e.startMin < ev.endMin && e.endMin > ev.startMin);
    return { ...ev, totalCols: Math.max(...overlapping.map(e => e.col)) + 1 };
  });
}

// ── Monthly calendar picker ───────────────────────────────────────────────────
function MonthPicker({ currentDay, lessonDays, availableDows, onSelect, onClose }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(currentDay + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const stepMonth = (delta) => {
    setViewDate(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const { year, month } = viewDate;
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayYMD();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push(ymd);
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-end justify-center" style={{ transform: 'translate3d(0,0,0)' }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white rounded-t-2xl pt-4 px-4 shadow-xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="w-10 h-1 bg-n-200 rounded-full" />
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button onClick={() => stepMonth(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 active:bg-n-100">
            <ChevronLeft size={18} className="text-n-600" />
          </button>
          <span className="text-base font-semibold text-n-900">{MESI_LONG[month]} {year}</span>
          <button onClick={() => stepMonth(1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-n-50 active:bg-n-100">
            <ChevronRight size={18} className="text-n-600" />
          </button>
        </div>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {GIORNI_SHORT.map(g => (
              <div key={g} className="text-center text-[10px] font-semibold text-n-400 py-1">{g}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((ymd, idx) => {
              if (!ymd) return <div key={`e${idx}`} />;
              const dow = new Date(ymd + 'T00:00:00').getDay();
              const isToday = ymd === today;
              const isSel   = ymd === currentDay;
              const hasLesson = lessonDays.has(ymd);
              const isAvail = availableDows.size > 0 && availableDows.has(dow);

              return (
                <button
                  key={ymd}
                  onClick={() => { onSelect(ymd); onClose(); }}
                  className="relative flex flex-col items-center justify-center py-1"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                      ${isSel ? 'bg-ama-500 text-white' : isToday ? 'bg-ama-100 text-ama-700' : 'text-n-700 active:bg-n-100'}`}
                  >
                    {new Date(ymd + 'T00:00:00').getDate()}
                  </span>
                  {hasLesson && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSel ? 'bg-white/80' : 'bg-red-500'}`} />
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Strumento dropdown ────────────────────────────────────────────────────────
function StrumentoDropdown({ strumento, teachers, selected, colorMap, onToggle, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-start pt-24 pl-4" style={{ transform: 'translate3d(0,0,0)' }} onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-n-100 overflow-hidden min-w-48"
        style={{ transform: 'translate3d(0,0,0)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b bg-n-50">
          <p className="text-xs font-semibold text-n-600 uppercase tracking-wide">{strumento}</p>
        </div>
        {teachers.map(t => {
          const c = colorMap[String(t.id)] || COLORS[0];
          const sel = selected.has(String(t.id));
          return (
            <button
              key={t.id}
              onClick={() => { onToggle(t.id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 active:bg-n-50"
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.chip }} />
              <span className="text-sm text-n-800 flex-1 text-left">{t.nome} {t.cognome}</span>
              {sel && <span className="w-2 h-2 rounded-full bg-ama-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
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

  const [showCalendar, setShowCalendar] = useState(false);
  const [dropdownStrumento, setDropdownStrumento] = useState(null);

  // Drag-to-create lezione prova
  const [dragProva, setDragProva] = useState(null);
  // { startMin, allConflict, freeTeacherId }
  const [provaModal, setProvaModal] = useState(null);
  // { startMin, preselectedTeacherId }
  const gridRef = useRef(null);
  const dragState = useRef(null);
  // { active, pointerId, startClientY, longPressTimer }

  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const longPressTimers = useRef({});
  const pointerStartX = useRef({});
  const pointerMoved = useRef({});
  const pointerIsTouch = useRef({});

  useEffect(() => {
    fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeachers((Array.isArray(d) ? d : []).filter(t => t.attivo !== false))).catch(() => {});
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
    teachers.forEach((t, i) => {
      const base = t.colore || COLORS[i % COLORS.length].chip;
      map[String(t.id)] = { bg: `${base}22`, border: `${base}66`, text: base, chip: base };
    });
    return map;
  }, [teachers]);

  // Group teachers by strumento
  const teachersByStrumento = useMemo(() => {
    const groups = {};
    teachers.forEach(t => {
      const s = t.strumento?.trim() || 'Altro';
      if (!groups[s]) groups[s] = [];
      groups[s].push(t);
    });
    return groups;
  }, [teachers]);

  const activeTeacherIds = useMemo(() => new Set(teachers.map(t => String(t.id))), [teachers]);

  // Teachers available on current day (for prova drag)
  const dayDow = useMemo(() => new Date(day + 'T00:00:00').getDay(), [day]);

  const teachersForProva = useMemo(() => {
    return teachers.filter(t => {
      const dows = parseDow(t.disponibilita);
      const availToday = dows.size === 0 || dows.has(dayDow); // if no dispo set, assume available
      const inSelected = selected.size === 0 || selected.has(String(t.id));
      return availToday && inSelected;
    });
  }, [teachers, dayDow, selected]);

  // Days-of-week where at least one selected/filtered teacher is available (for calendar picker)
  const availableDows = useMemo(() => {
    const toCheck = selected.size > 0 ? teachers.filter(t => selected.has(String(t.id))) : teachers;
    const dows = new Set();
    toCheck.forEach(t => {
      const td = parseDow(t.disponibilita);
      if (td.size === 0) { [0,1,2,3,4,5,6].forEach(d => dows.add(d)); }
      else td.forEach(d => dows.add(d));
    });
    return dows;
  }, [teachers, selected]);

  // Days that have lessons (for calendar picker dots)
  const lessonDays = useMemo(() => {
    const set = new Set();
    lezioni.forEach(l => {
      if (!l.data) return;
      if (l.stato === 'rimandata') return;
      const tid = String(l.id_insegnante);
      if (!activeTeacherIds.has(tid)) return;
      if (selected.size > 0 && !selected.has(tid)) return;
      set.add(String(l.data).slice(0, 10));
    });
    return set;
  }, [lezioni, selected, activeTeacherIds]);

  const dayEvents = useMemo(() => {
    return lezioni
      .filter(l => {
        if (!l.data) return false;
        if (String(l.data).slice(0,10) !== day) return false;
        if (!activeTeacherIds.has(String(l.id_insegnante))) return false;
        if (l.stato === 'rimandata') return false;
        if (selected.size > 0 && !selected.has(String(l.id_insegnante))) return false;
        return true;
      })
      .map(l => {
        const oi = l.ora_inizio ? String(l.ora_inizio).slice(0,5) : null;
        const of = l.ora_fine   ? String(l.ora_fine).slice(0,5)   : null;
        return { ...l, startMin: timeToMin(oi), endMin: timeToMin(of), oi, of };
      })
      .filter(l => l.startMin !== null && l.endMin !== null);
  }, [lezioni, day, selected, activeTeacherIds]);

  const laidOut = useMemo(() => layoutEvents(dayEvents), [dayEvents]);

  const toggleTeacher = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
      return next;
    });
  };

  const toggleAllInStrumento = (strumento) => {
    const group = teachersByStrumento[strumento] || [];
    const ids = group.map(t => String(t.id));
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const isStrumentoActive = (strumento) => {
    const group = teachersByStrumento[strumento] || [];
    return group.length > 0 && group.every(t => selected.has(String(t.id)));
  };

  const isStrumentoPart = (strumento) => {
    const group = teachersByStrumento[strumento] || [];
    return group.some(t => selected.has(String(t.id))) && !isStrumentoActive(strumento);
  };

  // Long press handlers for strumento chips (pointer events = touch + mouse unified)
  const onStrumentoPointerDown = (e, strumento) => {
    pointerStartX.current[strumento] = e.clientX;
    pointerMoved.current[strumento] = false;
    pointerIsTouch.current[strumento] = e.pointerType === 'touch';
    e.currentTarget.setPointerCapture(e.pointerId);
    longPressTimers.current[strumento] = setTimeout(() => {
      longPressTimers.current[strumento] = null;
      if (!pointerMoved.current[strumento]) setDropdownStrumento(strumento);
    }, 500);
  };

  const onStrumentoPointerMove = (e, strumento) => {
    const dx = Math.abs(e.clientX - (pointerStartX.current[strumento] || 0));
    if (dx > 8) {
      pointerMoved.current[strumento] = true;
      if (longPressTimers.current[strumento]) {
        clearTimeout(longPressTimers.current[strumento]);
        longPressTimers.current[strumento] = null;
      }
    }
  };

  const onStrumentoPointerUp = (e, strumento) => {
    if (longPressTimers.current[strumento]) {
      clearTimeout(longPressTimers.current[strumento]);
      longPressTimers.current[strumento] = null;
      if (!pointerMoved.current[strumento]) toggleAllInStrumento(strumento);
    }
  };

  const onStrumentoPointerCancel = (strumento) => {
    pointerMoved.current[strumento] = true;
    if (longPressTimers.current[strumento]) {
      clearTimeout(longPressTimers.current[strumento]);
      longPressTimers.current[strumento] = null;
    }
  };

  // Conflict detection for drag-to-create (uses only teachers available today)
  const getConflictStatus = useCallback((startM, endM) => {
    if (teachersForProva.length === 0) return { allConflict: true, freeTeacherId: null, freeTeachers: [], noAvail: true };
    const freeTeachers = teachersForProva.filter(t =>
      !dayEvents.some(e => String(e.id_insegnante) === String(t.id) && e.startMin < endM && e.endMin > startM)
    );
    if (freeTeachers.length === 0) return { allConflict: true, freeTeacherId: null, freeTeachers: [], noAvail: false };
    return { allConflict: false, freeTeacherId: String(freeTeachers[0].id), freeTeachers, noAvail: false };
  }, [teachersForProva, dayEvents]);

  const clientYToStartMin = useCallback((clientY) => {
    if (!gridRef.current) return GRID_START * 60;
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.scrollTop;
    const rawMin = GRID_START * 60 + (y / HOUR_H) * 60;
    const snapped = snapTo15(rawMin);
    return Math.max(GRID_START * 60, Math.min(GRID_END * 60 - 45, snapped));
  }, []);

  const onGridPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    if (dragState.current?.active) return;
    const startClientY = e.clientY;
    const timer = setTimeout(() => {
      if (!dragState.current) return;
      dragState.current.active = true;
      gridRef.current?.setPointerCapture(dragState.current.pointerId);
      const startM = clientYToStartMin(startClientY);
      const { allConflict, freeTeacherId, freeTeachers } = getConflictStatus(startM, startM + 45);
      setDragProva({ startMin: startM, allConflict, freeTeacherId, freeTeachers });
    }, 500);
    dragState.current = { active: false, pointerId: e.pointerId, startClientY, longPressTimer: timer };
  }, [clientYToStartMin, getConflictStatus]);

  const onGridPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const dy = Math.abs(e.clientY - dragState.current.startClientY);
    if (!dragState.current.active) {
      // Cancel long press if scrolling
      if (dy > 12) {
        clearTimeout(dragState.current.longPressTimer);
        dragState.current = null;
      }
      return;
    }
    e.preventDefault();
    const startM = clientYToStartMin(e.clientY);
    const { allConflict, freeTeacherId, freeTeachers } = getConflictStatus(startM, startM + 45);
    setDragProva({ startMin: startM, allConflict, freeTeacherId, freeTeachers });
  }, [clientYToStartMin, getConflictStatus]);

  const onGridPointerUp = useCallback((e) => {
    if (!dragState.current) return;
    clearTimeout(dragState.current.longPressTimer);
    const wasActive = dragState.current.active;
    const startM = dragState.current.active ? clientYToStartMin(e.clientY) : null;
    dragState.current = null;
    setDragProva(null);
    if (wasActive && startM !== null) {
      // Pre-select: single selected teacher, or the only free available teacher
      const ids = teachersForProva.map(t => String(t.id));
      const free = ids.filter(tid =>
        !dayEvents.some(ev => String(ev.id_insegnante) === tid && ev.startMin < startM + 45 && ev.endMin > startM)
      );
      const preselected = ids.length === 1 ? ids[0] : (free.length === 1 ? free[0] : null);
      setProvaModal({ startMin: startM, preselectedTeacherId: preselected });
    }
  }, [clientYToStartMin, teachersForProva, dayEvents]);

  const openEdit = (l) => { setEditLesson(l); setEditMode('edit'); setEditOpen(true); };
  const openAdd  = () => { setEditLesson(null); setEditMode('create'); setEditOpen(true); };

  const nowMin = useMemo(() => {
    if (day !== todayYMD()) return null;
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }, [day]);

  const nowTop = nowMin !== null ? ((nowMin - GRID_START * 60) / 60) * HOUR_H : null;

  const strumentiKeys = Object.keys(teachersByStrumento);
  const multiGroup = strumentiKeys.length > 1 || (strumentiKeys.length === 1 && strumentiKeys[0] !== 'Altro');

  return (
    <div className="h-screen flex flex-col bg-n-100 overflow-hidden pb-16">
      <PageHeader title="Calendario" backTo={false} />

      {/* ── Row 1: Teacher selection ── */}
      {teachers.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-2 bg-white border-b z-20">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {multiGroup ? (
              // Grouped by strumento
              strumentiKeys.map(strumento => {
                const group = teachersByStrumento[strumento];
                const active = isStrumentoActive(strumento);
                const partial = isStrumentoPart(strumento);
                return (
                  <button
                    key={strumento}
                    onPointerDown={(e) => onStrumentoPointerDown(e, strumento)}
                    onPointerMove={(e) => onStrumentoPointerMove(e, strumento)}
                    onPointerUp={(e) => onStrumentoPointerUp(e, strumento)}
                    onPointerCancel={() => onStrumentoPointerCancel(strumento)}
                    onClick={(e) => e.preventDefault()}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none"
                    style={
                      active
                        ? { backgroundColor: '#4f46e5', color: '#fff' }
                        : partial
                        ? { backgroundColor: '#4f46e51a', color: '#4f46e5', border: '1.5px solid #4f46e5' }
                        : { backgroundColor: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb' }
                    }
                  >
                    {/* Color dots for teachers in group */}
                    <span className="flex gap-0.5">
                      {group.slice(0, 3).map(t => (
                        <span key={t.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: (colorMap[String(t.id)] || COLORS[0]).chip }} />
                      ))}
                    </span>
                    {strumento}
                    {group.length > 1 && <span className="ml-0.5 text-[10px] opacity-70">{group.length}</span>}
                  </button>
                );
              })
            ) : (
              // No instrument grouping → flat list
              teachers.map(t => {
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
              })
            )}
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

      {/* ── Row 2: Day navigator ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b z-20">
        <button
          onClick={() => setDay(d => addDays(d, -1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-n-50 active:bg-n-100"
        >
          <ChevronLeft size={18} className="text-n-600" />
        </button>
        <button
          onClick={() => setShowCalendar(true)}
          className="flex-1 text-center px-2 active:opacity-70"
        >
          <p className="text-sm font-semibold text-n-900">{fmtHeader(day)}</p>
          <p className="text-[10px] text-n-400 mt-0.5">Tocca per scegliere la data</p>
        </button>
        <button
          onClick={() => setDay(d => addDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-n-50 active:bg-n-100"
        >
          <ChevronRight size={18} className="text-n-600" />
        </button>
      </div>

      {/* ── Time grid ── */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto bg-white"
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className="relative flex"
            style={{ height: TOTAL_H, touchAction: dragProva ? 'none' : 'pan-y' }}
            onPointerDown={onGridPointerDown}
            onPointerMove={onGridPointerMove}
            onPointerUp={onGridPointerUp}
            onPointerCancel={() => {
              if (dragState.current) {
                clearTimeout(dragState.current.longPressTimer);
                dragState.current = null;
              }
              setDragProva(null);
            }}
          >
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

            <div className="flex-1 relative">
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-n-100" style={{ top: i * HOUR_H }} />
              ))}

              {nowTop !== null && nowTop >= 0 && nowTop <= TOTAL_H && (
                <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top: nowTop }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              )}

              {laidOut.length === 0 && !dragProva && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-n-300">Nessuna lezione</p>
                </div>
              )}

              {laidOut.map(l => {
                const c = colorMap[String(l.id_insegnante)] || COLORS[0];
                const top    = Math.max(0, (l.startMin - GRID_START * 60) / 60 * HOUR_H);
                const height = Math.max(20, (l.endMin - l.startMin) / 60 * HOUR_H - 2);
                const colW   = 100 / l.totalCols;
                const left   = `${l.col * colW}%`;
                const width  = `calc(${colW}% - 4px)`;
                const isProva = l.stato === 'prova';
                const nomeAllievo = l.nome_allievo ? `${l.nome_allievo} ${l.cognome_allievo || ''}`.trim() : (isProva ? 'Lezione prova' : l.title || '—');
                const nomeIns = l.nome_insegnante ? `${l.nome_insegnante} ${l.cognome_insegnante || ''}`.trim() : '';

                return (
                  <button
                    key={l.id}
                    onClick={() => openEdit(l)}
                    className="absolute rounded-lg px-2 py-1 text-left overflow-hidden active:opacity-70 transition-opacity"
                    style={{
                      top, height, left, width,
                      backgroundColor: c.bg,
                      border: isProva ? `1.5px dashed ${c.border}` : `1.5px solid ${c.border}`,
                    }}
                  >
                    <p className="text-xs font-semibold leading-tight truncate" style={{ color: c.text }}>
                      {l.oi} – {l.of}
                      {isProva && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 rounded px-1">PROVA</span>}
                    </p>
                    <p className="text-xs font-medium leading-tight truncate" style={{ color: c.text }}>
                      {nomeAllievo}
                    </p>
                    {height > 36 && nomeIns && (
                      <p className="text-[10px] leading-tight truncate opacity-70" style={{ color: c.text }}>
                        {nomeIns}{l.aula ? ` · Aula ${l.aula}` : ''}
                      </p>
                    )}
                  </button>
                );
              })}

              {/* Ghost block for drag-to-create prova */}
              {dragProva && (() => {
                const top = Math.max(0, (dragProva.startMin - GRID_START * 60) / 60 * HOUR_H);
                const height = (45 / 60) * HOUR_H - 2;
                const ghostC = dragProva.allConflict
                  ? { bg: '#111827', border: '#4b5563', text: '#d1d5db' }
                  : dragProva.freeTeacherId && colorMap[dragProva.freeTeacherId]
                    ? { bg: `${colorMap[dragProva.freeTeacherId].chip}30`, border: colorMap[dragProva.freeTeacherId].chip, text: colorMap[dragProva.freeTeacherId].chip }
                    : { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' };
                const freeTeachers = dragProva.freeTeachers || [];
                return (
                  <div
                    className="absolute left-1 right-1 rounded-lg px-2 py-1 pointer-events-none z-20 shadow-lg flex flex-col items-start text-left"
                    style={{ top, height, backgroundColor: 'transparent', border: `2px dashed ${ghostC.border}` }}
                  >
                    <p className="text-xs font-bold leading-tight" style={{ color: ghostC.text }}>
                      Lezione prova · 45min
                    </p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: ghostC.text }}>
                      {minToHHMM(dragProva.startMin)} – {minToHHMM(dragProva.startMin + 45)}
                    </p>
                    {dragProva.allConflict ? (
                      <p className="text-[10px] mt-0.5 font-semibold" style={{ color: ghostC.text }}>
                        {dragProva.noAvail ? 'Nessun ins. disponibile' : 'Slot occupato'}
                      </p>
                    ) : freeTeachers.length > 0 && (
                      <div className="mt-1 flex flex-col items-start gap-0.5">
                        {freeTeachers.map(t => (
                          <span
                            key={t.id}
                            className="text-[10px] font-medium leading-tight"
                            style={{ color: colorMap[String(t.id)]?.chip || ghostC.text }}
                          >
                            {t.nome} {t.cognome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── Monthly calendar picker overlay ── */}
      {showCalendar && (
        <MonthPicker
          currentDay={day}
          lessonDays={lessonDays}
          availableDows={availableDows}
          onSelect={setDay}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* ── Strumento dropdown overlay ── */}
      {dropdownStrumento && (
        <StrumentoDropdown
          strumento={dropdownStrumento}
          teachers={teachersByStrumento[dropdownStrumento] || []}
          selected={selected}
          colorMap={colorMap}
          onToggle={toggleTeacher}
          onClose={() => setDropdownStrumento(null)}
        />
      )}

      <EditLessonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={async () => { setEditOpen(false); await refetch(); }}
        lesson={editLesson}
        mode={editMode}
        allowRecurring={true}
        showTeacherSelect={true}
      />

      {provaModal && (
        <LezionProvaModal
          open={true}
          onClose={() => setProvaModal(null)}
          onSaved={async () => { setProvaModal(null); await refetch(); }}
          startMin={provaModal.startMin}
          data={day}
          teachers={teachersForProva.length > 0 ? teachersForProva : teachers}
          preselectedTeacherId={provaModal.preselectedTeacherId}
        />
      )}

      <BottomNavAdmin onAdd={openAdd} />
    </div>
  );
}

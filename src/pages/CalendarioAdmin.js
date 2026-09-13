import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal";
import PageHeader from "../componenti/PageHeader";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

const COLORS = [
  { bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-800',   dot: 'bg-blue-500',   chipSel: 'bg-blue-500 text-white',   chipDef: 'bg-white text-blue-600 border border-blue-300' },
  { bg: 'bg-emerald-100',border: 'border-emerald-300', text: 'text-emerald-800',dot: 'bg-emerald-500', chipSel: 'bg-emerald-500 text-white', chipDef: 'bg-white text-emerald-600 border border-emerald-300' },
  { bg: 'bg-violet-100', border: 'border-violet-300',  text: 'text-violet-800', dot: 'bg-violet-500',  chipSel: 'bg-violet-500 text-white',  chipDef: 'bg-white text-violet-600 border border-violet-300' },
  { bg: 'bg-amber-100',  border: 'border-amber-300',   text: 'text-amber-800',  dot: 'bg-amber-500',   chipSel: 'bg-amber-500 text-white',   chipDef: 'bg-white text-amber-700 border border-amber-300' },
  { bg: 'bg-rose-100',   border: 'border-rose-300',    text: 'text-rose-800',   dot: 'bg-rose-500',    chipSel: 'bg-rose-500 text-white',    chipDef: 'bg-white text-rose-600 border border-rose-300' },
  { bg: 'bg-cyan-100',   border: 'border-cyan-300',    text: 'text-cyan-800',   dot: 'bg-cyan-500',    chipSel: 'bg-cyan-500 text-white',    chipDef: 'bg-white text-cyan-600 border border-cyan-300' },
  { bg: 'bg-orange-100', border: 'border-orange-300',  text: 'text-orange-800', dot: 'bg-orange-500',  chipSel: 'bg-orange-500 text-white',  chipDef: 'bg-white text-orange-600 border border-orange-300' },
  { bg: 'bg-pink-100',   border: 'border-pink-300',    text: 'text-pink-800',   dot: 'bg-pink-500',    chipSel: 'bg-pink-500 text-white',    chipDef: 'bg-white text-pink-600 border border-pink-300' },
];

const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MESI   = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];

function fmtData(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const domani = new Date(oggi); domani.setDate(oggi.getDate()+1);
  if (d.getTime() === oggi.getTime())   return `Oggi, ${d.getDate()} ${MESI[d.getMonth()]}`;
  if (d.getTime() === domani.getTime()) return `Domani, ${d.getDate()} ${MESI[d.getMonth()]}`;
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

function isToday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  return d.getTime() === oggi.getTime();
}

export default function CalendarioAdmin() {
  const [lezioni, setLezioni]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(new Set()); // Set di id_insegnante selezionati (vuoto = tutti)

  const [editOpen, setEditOpen]   = useState(false);
  const [editMode, setEditMode]   = useState("edit");
  const [editLesson, setEditLesson] = useState(null);

  const todayRef = useRef(null);
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  // Carica insegnanti
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
      const safeDateStr = (d) => (d ? String(d).slice(0,10) : null);
      const enrich = (l) => {
        const ymd = safeDateStr(l.data);
        const oi  = l.ora_inizio ? String(l.ora_inizio).slice(0,5) : null;
        const of  = l.ora_fine   ? String(l.ora_fine).slice(0,5)   : null;
        return { ...l, start: ymd && oi ? `${ymd}T${oi}` : null, end: ymd && of ? `${ymd}T${of}` : null };
      };
      setLezioni((Array.isArray(data) ? data : []).map(enrich));
    } catch {}
    finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { refetch(); }, [refetch]);

  // Scroll verso oggi dopo il caricamento
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  // Mappa id_insegnante → colore
  const colorMap = useMemo(() => {
    const map = {};
    teachers.forEach((t, i) => { map[String(t.id)] = COLORS[i % COLORS.length]; });
    return map;
  }, [teachers]);

  // Filtra e raggruppa per data
  const grouped = useMemo(() => {
    const oggi = new Date(); oggi.setHours(0,0,0,0);
    const filtered = lezioni.filter(l => {
      if (!l.data) return false;
      const d = new Date(l.data + 'T00:00:00');
      if (d < oggi) return false; // solo da oggi in poi
      if (selected.size === 0) return true;
      return selected.has(String(l.id_insegnante));
    });

    const map = {};
    filtered.forEach(l => {
      const key = String(l.data).slice(0,10);
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });

    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, lz]) => ({
        date,
        lezioni: lz.sort((a,b) => (a.ora_inizio||'').localeCompare(b.ora_inizio||'')),
      }));
  }, [lezioni, selected]);

  const toggleTeacher = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
      return next;
    });
  };

  const openEdit = (l) => {
    setEditLesson(l);
    setEditMode('edit');
    setEditOpen(true);
  };

  const openAdd = () => {
    setEditLesson(null);
    setEditMode('create');
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-n-100 flex flex-col pb-20">
      <PageHeader title="Calendario" backTo={false} />

      {/* Chip filtro insegnanti */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {teachers.map(t => {
            const c   = colorMap[String(t.id)] || COLORS[0];
            const sel = selected.has(String(t.id));
            return (
              <button
                key={t.id}
                onClick={() => toggleTeacher(t.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sel ? c.chipSel : c.chipDef}`}
              >
                {!sel && <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
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

      {/* Agenda */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-10 text-center text-sm text-n-300">
            Nessuna lezione in programma.
          </div>
        ) : (
          grouped.map(({ date, lezioni: lz }) => (
            <div key={date} ref={isToday(date) ? todayRef : null}>
              {/* Header data */}
              <div className={`flex items-center gap-2 mb-2 ${isToday(date) ? 'text-ama-500' : 'text-n-500'}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${isToday(date) ? 'text-ama-500' : 'text-n-400'}`}>
                  {fmtData(date)}
                </span>
                <div className="flex-1 h-px bg-n-200" />
              </div>

              {/* Lezioni del giorno */}
              <div className="space-y-2">
                {lz.map(l => {
                  const c = colorMap[String(l.id_insegnante)] || COLORS[0];
                  const nomeAllievo = l.nome_allievo
                    ? `${l.nome_allievo} ${l.cognome_allievo || ''}`.trim()
                    : l.title || '—';
                  const nomeIns = l.nome_insegnante
                    ? `${l.nome_insegnante} ${l.cognome_insegnante || ''}`.trim()
                    : '—';
                  return (
                    <button
                      key={l.id}
                      onClick={() => openEdit(l)}
                      className={`w-full text-left flex items-stretch gap-3 bg-white border ${c.border} rounded-xl px-3 py-2.5 active:opacity-70 transition-opacity`}
                    >
                      {/* Barra colore sinistra */}
                      <div className={`w-1 rounded-full ${c.dot} shrink-0`} />
                      {/* Contenuto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-n-900 truncate">{nomeAllievo}</p>
                          <p className="text-xs text-n-400 shrink-0">
                            {l.ora_inizio?.slice(0,5)} – {l.ora_fine?.slice(0,5)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-medium ${c.text}`}>{nomeIns}</span>
                          {l.aula && <span className="text-xs text-n-300">· Aula {l.aula}</span>}
                          {l.stato === 'recupero' && <span className="text-xs text-amber-600 font-medium">· Recupero</span>}
                          {l.stato === 'annullata' && <span className="text-xs text-red-500 font-medium">· Annullata</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
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

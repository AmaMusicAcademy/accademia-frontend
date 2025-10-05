import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import EditLessonModal from "../componenti/EditLessonModal";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

// --- utils ---
function getToken() {
  try { return localStorage.getItem("token") || null; } catch { return null; }
}
async function fetchJSON(url, token, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
function ymd(dateLike) { return String(dateLike || "").slice(0, 10); }
function hhmm(t) { return t ? String(t).slice(0,5) : ""; }
function isoFromDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${t}`;
}
function inRangeInclusive(lez, startYMD, endYMD) {
  const day = ymd(lez.data);
  if (!day) return false;
  if (startYMD && day < startYMD) return false;
  if (endYMD && day > endYMD) return false;
  return true;
}
const statoLabel = (l) => {
  const raw = (l?.stato || "svolta").toLowerCase();
  if (raw === "rimandata" && l?.riprogrammata === true) return "riprogrammata";
  return raw;
};

export default function AllieviAdminPage() {
  const token = getToken();

  // filtro insegnante
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");

  const [students, setStudents] = useState([]);
  const [allLessons, setAllLessons] = useState([]); // tutte (non solo da oggi)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // selezione multipla lezioni
  const [selectedIds, setSelectedIds] = useState(new Set());

  // modale modifica/riprogramma
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  // UI
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusOnly, setStatusOnly] = useState({
    svolta: false,
    annullata: false,
    riprogrammata: false,
    rimandata: false,
  });
  const toggleStatus = (key) => setStatusOnly((s) => ({ ...s, [key]: !s[key] }));
  const clearStatusFilters = () => setStatusOnly({ svolta: false, annullata: false, riprogrammata: false, rimandata: false });

  // carica insegnanti (per filtro)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json().catch(()=>[]);
        setTeachers(Array.isArray(data)?data:[]);
      } catch {}
    })();
  }, [token]);

  // primo caricamento
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!token) throw new Error("Token non presente. Esegui il login.");

        // allievi (tutti o per insegnante)
        if (teacherId) {
          const a = await fetchJSON(`${API_BASE}/api/insegnanti/${teacherId}/allievi`, token);
          if (cancel) return;
          setStudents(Array.isArray(a) ? a : []);
        } else {
          const all = await fetchJSON(`${API_BASE}/api/allievi`, token);
          if (cancel) return;
          setStudents(Array.isArray(all) ? all : []);
        }

        await refetchLessons(teacherId);
      } catch (e) {
        if (!cancel) setErr(e.message || "Errore di caricamento.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [token, teacherId]);

  async function refetchLessons(tid = teacherId) {
    const url = tid
      ? `${API_BASE}/api/insegnanti/${tid}/lezioni?t=${Date.now()}`
      : `${API_BASE}/api/lezioni?t=${Date.now()}`;
    const lezioni = await fetchJSON(url, token);
    setAllLessons(Array.isArray(lezioni) ? lezioni : []);
    setSelectedIds(new Set());
  }

  // filtro studenti (ricerca)
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.nome} ${s.cognome}`.toLowerCase().includes(q));
  }, [students, search]);

  // base lezioni → filtri data e ricerca, poi stato
  const baseFiltered = useMemo(() => {
    let list = allLessons;

    if (dateFrom || dateTo) list = list.filter((l) => inRangeInclusive(l, dateFrom, dateTo));

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        `${l.nome_allievo || ""} ${l.cognome_allievo || ""}`.toLowerCase().includes(q)
      );
    }

    // se filtro insegnante è attivo ma l'endpoint /api/lezioni (tutte) lo include già,
    // lascia così; se unisci endpoint, puoi filtrare qui per sicurezza:
    if (teacherId) {
      list = list.filter(l => String(l.id_insegnante) === String(teacherId));
    }

    return list;
  }, [allLessons, dateFrom, dateTo, search, teacherId]);

  const statusCounts = useMemo(() => {
    const counts = { svolta: 0, annullata: 0, riprogrammata: 0, rimandata: 0 };
    for (const l of baseFiltered) {
      const s = statoLabel(l);
      if (counts[s] != null) counts[s] += 1;
      else counts[s] = 1;
    }
    return counts;
  }, [baseFiltered]);

  const filteredLessons = useMemo(() => {
    const activeStates = Object.entries(statusOnly).filter(([,v])=>v).map(([k])=>k);
    if (activeStates.length === 0) return baseFiltered;
    return baseFiltered.filter((l) => activeStates.includes(statoLabel(l)));
  }, [baseFiltered, statusOnly]);

  const lessonsByDay = useMemo(() => {
    const map = new Map();
    for (const l of filteredLessons) {
      const day = ymd(l.data);
      if (!day) continue;
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(l);
    }
    return Array.from(map.entries()).sort(([a],[b]) => (a < b ? -1 : 1));
  }, [filteredLessons]);

  const rangeError = useMemo(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return "Intervallo date non valido: la data iniziale è successiva alla finale.";
    }
    return null;
  }, [dateFrom, dateTo]);

  // selezione multipla
  function toggleSelect(id){
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  async function deleteSelected(){
    if (!selectedIds.size) return;
    if (!window.confirm(`Eliminare ${selectedIds.size} lezioni selezionate?`)) return;
    await Promise.all([...selectedIds].map(id =>
      fetch(`${API_BASE}/api/lezioni/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    ));
    await refetchLessons();
  }

  // azioni singola lezione
  const patchRimanda = async (lessonId, motivazione = "") => {
    const res = await fetch(`${API_BASE}/api/lezioni/${lessonId}/rimanda`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) throw new Error(await res.text().catch(()=> "Errore rimanda"));
    return res.json();
  };
  const patchAnnulla = async (lessonId, motivazione = "") => {
    const res = await fetch(`${API_BASE}/api/lezioni/${lessonId}/annulla`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) throw new Error(await res.text().catch(()=> "Errore annulla"));
    return res.json();
  };
  const handleRimanda = async (l) => {
    try {
      const motivo = window.prompt("Motivazione (opzionale):", l.motivazione || "");
      if (motivo === null) return;
      await patchRimanda(l.id, motivo);
      await refetchLessons();
    } catch (e) { alert(e.message || "Errore rimando"); }
  };
  const handleAnnulla = async (l) => {
    try {
      const motivo = window.prompt("Motivazione (opzionale):", l.motivazione || "");
      if (motivo === null) return;
      await patchAnnulla(l.id, motivo);
      await refetchLessons();
    } catch (e) { alert(e.message || "Errore annullamento"); }
  };

  const openEdit = (lesson, mode = "edit") => {
    setEditLesson(lesson);
    setEditMode(mode);
    setEditOpen(true);
  };
  const handleSaved = async () => {
    setEditOpen(false);
    await refetchLessons();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Allievi (Admin)</h1>
          {/* filtro insegnante */}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-gray-600">Insegnante:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={teacherId}
              onChange={(e)=>setTeacherId(e.target.value)}
            >
              <option value="">Tutti</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Ricerca + Filtro date + Filtro stato */}
      <div className="max-w-xl mx-auto px-4 pt-3 pb-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca allievo…"
          className="w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-10">Da</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-1.5 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-10">A</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-1.5 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border bg-white"
            onClick={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, "0");
              const d = String(today.getDate()).padStart(2, "0");
              setDateFrom(`${y}-${m}-${d}`); setDateTo("");
            }}
          >
            Da oggi
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border bg-white"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
          >
            Pulisci date
          </button>
        </div>

        {/* filtro stato */}
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Mostra solo:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["svolta","annullata","riprogrammata","rimandata"].map(k=>(
              <label key={k} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={statusOnly[k]} onChange={()=>toggleStatus(k)} />
                <span className="capitalize">
                  {k} ({(filteredLessons.length ? filteredLessons : baseFiltered).filter(l=>statoLabel(l)===k).length})
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2">
            <button type="button" className="text-xs px-3 py-1.5 rounded-lg border bg-white" onClick={clearStatusFilters}>
              Pulisci stati
            </button>
          </div>
        </div>
      </div>

      {/* barra azioni selezione */}
      <div className="sticky top-[140px] z-20 bg-white border-y px-4 py-2 flex items-center gap-2">
        <button
          onClick={deleteSelected}
          disabled={!selectedIds.size}
          className="px-3 py-1.5 text-sm rounded bg-red-600 text-white disabled:opacity-50"
        >
          Elimina selezionate ({selectedIds.size})
        </button>
      </div>

      {/* Errori */}
      {err && (
        <div className="max-w-xl mx-auto px-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {err}
          </div>
        </div>
      )}

      {/* Contenuti */}
      {!err && (
        <>
          {/* Allievi */}
          <SectionTitle title="Allievi" />
          <div className="max-w-xl mx-auto px-4 pb-4 grid gap-2">
            {filteredStudents.length === 0 ? (
              <EmptyState title="Nessun allievo" subtitle={search ? "Modifica la ricerca." : "Non sono presenti allievi."} />
            ) : (
              filteredStudents.map((s) => <StudentRow key={s.id} s={s} />)
            )}
          </div>

          {/* Lezioni filtrate */}
          <SectionTitle title="Lezioni" />
          <div className="max-w-xl mx-auto px-4">
            {lessonsByDay.length === 0 ? (
              <EmptyState title="Nessuna lezione trovata" />
            ) : (
              lessonsByDay.map(([day, items]) => (
                <div key={day} className="mb-5">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {format(parseISO(`${day}T00:00:00`), "EEEE d MMMM yyyy", { locale: it })}
                  </div>
                  <div className="rounded-xl border bg-white">
                    {items
                      .sort((a, b) => (a.ora_inizio || "").localeCompare(b.ora_inizio || ""))
                      .map((l, i) => (
                        <LessonRow
                          key={`${l.id || "k"}-${i}`}
                          l={l}
                          last={i === items.length - 1}
                          onOpenEdit={(mode) => { setEditLesson(l); setEditMode(mode || "edit"); setEditOpen(true); }}
                          onRimanda={() => handleRimanda(l)}
                          onAnnulla={() => handleAnnulla(l)}
                          selected={selectedIds.has(l.id)}
                          onToggle={() => toggleSelect(l.id)}
                        />
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modale modifica/riprogramma */}
      <EditLessonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
        lesson={editLesson}
        mode={editMode}
        showTeacherSelect={true} // admin può cambiare docente/allievo
      />

      <BottomNavAdmin />
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="max-w-xl mx-auto px-4 pt-3 pb-2">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    </div>
  );
}
function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-xl border bg-white p-6 text-center">
      <div className="text-base font-medium">{title}</div>
      {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
    </div>
  );
}
function StudentRow({ s }) {
  const initials = `${(s.nome || "?")[0] ?? ""}${(s.cognome || "?")[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white px-3 py-2">
      <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-600">{initials}</span>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium truncate">
          {s.nome} {s.cognome}
        </div>
      </div>
    </div>
  );
}
function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-red-100 text-red-700 border-red-200",
    green: "bg-green-100 text-green-700 border-green-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}
function LessonRow({ l, last, onOpenEdit, onRimanda, onAnnulla, selected, onToggle }) {
  const startISO = isoFromDateTime(ymd(l.data), l.ora_inizio);
  const endISO = isoFromDateTime(ymd(l.data), l.ora_fine);
  const orario =
    startISO && endISO
      ? `${format(new Date(startISO), "HH:mm")} – ${format(new Date(endISO), "HH:mm")}`
      : `${hhmm(l.ora_inizio)} – ${hhmm(l.ora_fine)}`;

  const label = statoLabel(l);
  const isRimandata = label === "rimandata";
  const isAnnullata = label === "annullata";
  const isRiprogrammata = label === "riprogrammata";
  const tone =
    isAnnullata ? "red" : isRiprogrammata ? "purple" : isRimandata ? "orange" : (label === "svolta" ? "green" : "blue");

  const docente = [l.nome_insegnante, l.cognome_insegnante].filter(Boolean).join(" ");

  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${last ? "" : "border-b"}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-0.5" />
      <div className="w-12 text-xs text-gray-600 shrink-0">{orario}</div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenEdit("edit")}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-medium truncate">
            {l.nome_allievo ? `${l.nome_allievo} ${l.cognome_allievo || ""}`.trim() : "Allievo"}
          </div>
          <Badge tone={tone}>{label}</Badge>
          {l.aula ? <Badge>{`Aula ${l.aula}`}</Badge> : null}
        </div>
        {docente && <div className="text-xs text-gray-500 mt-0.5">👨‍🏫 {docente}</div>}
        {l.motivazione && label !== "svolta" && (
          <div className="text-xs text-gray-500 mt-0.5">Motivo: {l.motivazione}</div>
        )}
      </div>
      {!isAnnullata && (
        <div className="flex items-center gap-2 shrink-0">
          {isRimandata ? (
            <>
              <button className="px-2 py-1 rounded-md text-xs bg-amber-600 text-white" onClick={() => onOpenEdit("reschedule")}>
                Riprogramma
              </button>
              <button className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800" onClick={onAnnulla}>
                Annulla
              </button>
            </>
          ) : (
            <>
              <button className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-800" onClick={onRimanda}>
                Rimanda
              </button>
              <button className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800" onClick={onAnnulla}>
                Annulla
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
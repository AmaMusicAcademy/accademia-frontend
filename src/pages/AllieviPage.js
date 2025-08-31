import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import BottomNav from "../componenti/BottomNav";
import EditLessonModal from "../componenti/EditLessonModal";

// Base API
const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

// --- utils ---
function getToken() {
  try { return localStorage.getItem("token") || null; } catch { return null; }
}
function jwtPayload(token) {
  try { return JSON.parse(atob(token.split(".")[1] || "")); } catch { return null; }
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
/** 1) /api/insegnante/me  2) fallback: username dal JWT → /api/insegnanti */
async function resolveTeacherId(token) {
  try {
    const me = await fetchJSON(`${API_BASE}/api/insegnante/me`, token);
    if (me?.id) return { id: String(me.id), profile: me };
  } catch {}
  const payload = jwtPayload(token);
  const username = payload?.username;
  if (!username) throw new Error("Impossibile determinare l'insegnante corrente.");
  const list = await fetchJSON(`${API_BASE}/api/insegnanti`, null);
  const match = (Array.isArray(list) ? list : []).find(
    (i) => (i.username || "").toLowerCase() === username.toLowerCase()
  );
  if (!match?.id) throw new Error("Nessun insegnante trovato per questo utente.");
  return { id: String(match.id), profile: match };
}

function ymd(dateLike) { return String(dateLike || "").slice(0, 10); } // "YYYY-MM-DD"
function hhmm(t) { return t ? String(t).slice(0,5) : ""; }
function isoFromDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${t}`;
}
function isFromTodayOnward(lez) {
  const ymdStr = ymd(lez.data);
  if (!ymdStr) return false;
  const lessonDay = new Date(`${ymdStr}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return lessonDay.getTime() >= today.getTime();
}
function inRangeInclusive(lez, startYMD, endYMD) {
  const day = ymd(lez.data);
  if (!day) return false;
  if (startYMD && day < startYMD) return false;
  if (endYMD && day > endYMD) return false;
  return true;
}
const sameKey = (o) =>
  [
    ymd(o.data) || ymd(o.start),
    o.ora_inizio || (typeof o.start === "string" ? o.start.slice(11,16) : ""),
    o.ora_fine   || (typeof o.end   === "string" ? o.end.slice(11,16)   : ""),
    String(o.id_allievo || ""),
    String(o.aula || "")
  ].join("|");

// history helpers → etichetta “riprogrammata”
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

// --- component ---
export default function AllieviPage() {
  const token = getToken();
  const [teacherId, setTeacherId] = useState(null);

  const [students, setStudents] = useState([]);
  const [allLessonsFromToday, setAllLessonsFromToday] = useState([]); // oggi → futuro (tutti gli stati)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Modale modifica/riprogramma
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("edit"); // "edit" | "reschedule"
  const [editLesson, setEditLesson] = useState(null);

  // UI state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState("");     // "YYYY-MM-DD"

  // ✅ Filtro per stato (checkbox multiple)
  const [statusOnly, setStatusOnly] = useState({
    svolta: false,
    annullata: false,
    riprogrammata: false,
    rimandata: false,
  });
  const toggleStatus = (key) =>
    setStatusOnly((s) => ({ ...s, [key]: !s[key] }));
  const clearStatusFilters = () =>
    setStatusOnly({ svolta: false, annullata: false, riprogrammata: false, rimandata: false });

  // primo caricamento
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!token) throw new Error("Token non presente. Esegui il login.");
        const { id } = await resolveTeacherId(token);
        if (cancel) return;

        setTeacherId(id);

        // allievi assegnati
        const allievi = await fetchJSON(`${API_BASE}/api/insegnanti/${id}/allievi`, null);
        if (cancel) return;
        setStudents(Array.isArray(allievi) ? allievi : []);

        await refetchLessons(id);
      } catch (e) {
        if (!cancel) setErr(e.message || "Errore di caricamento.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [token]);

  // Refetch lezioni (oggi → futuro, TUTTI gli stati)
  const refetchLessons = async (id = teacherId) => {
    if (!id || !token) return;
    const lezioni = await fetchJSON(`${API_BASE}/api/insegnanti/${id}/lezioni?t=${Date.now()}`, token);
    const base = (Array.isArray(lezioni) ? lezioni : []).filter(isFromTodayOnward);
    setAllLessonsFromToday(base);
  };

  // Filtro studenti (ricerca)
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.nome} ${s.cognome}`.toLowerCase().includes(q));
  }, [students, search]);

  // Filtro lezioni per intervallo date + ricerca + stato
  const filteredLessons = useMemo(() => {
    let list = allLessonsFromToday;

    // filtro intervallo date
    if (dateFrom || dateTo) list = list.filter((l) => inRangeInclusive(l, dateFrom, dateTo));

    // filtro ricerca
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        `${l.nome_allievo || ""} ${l.cognome_allievo || ""}`.toLowerCase().includes(q)
      );
    }

    // filtro per stato (se uno o più checkbox selezionati)
    const activeStates = Object.entries(statusOnly)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeStates.length > 0) {
      list = list.filter((l) => activeStates.includes(statoLabel(l)));
    }

    return list;
  }, [allLessonsFromToday, dateFrom, dateTo, search, statusOnly]);

  // Raggruppa lezioni per giorno
  const lessonsByDay = useMemo(() => {
    const map = new Map();
    for (const l of filteredLessons) {
      const day = ymd(l.data);
      if (!day) continue;
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(l);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [filteredLessons]);

  const rangeError = useMemo(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return "Intervallo date non valido: la data iniziale è successiva alla finale.";
    }
    return null;
  }, [dateFrom, dateTo]);

  // --- azioni (Rimanda / Riprogramma / Annulla / Modifica) ---

  // verifica ID sul server, altrimenti risolvi per “chiave naturale”
  const resolveLessonId = async (src) => {
    if (!token) throw new Error("Token non presente");
    if (src?.id != null) {
      const r = await fetch(`${API_BASE}/api/lezioni/${src.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) return src.id;
      if (r.status !== 404) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `Errore lettura lezione (${r.status})`);
      }
    }
    const res = await fetch(`${API_BASE}/api/insegnanti/${teacherId}/lezioni?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore nel recupero lezioni insegnante (${res.status})`);
    }
    const list = await res.json();
    const key = (o) => [
      ymd(o.data) || ymd(src.start),
      o.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
      o.ora_fine   || (typeof src.end   === "string" ? src.end.slice(11, 16)   : ""),
      String(o.id_allievo || ""),
      String(o.aula || "")
    ].join("|");
    const want = key(src);
    const found = (Array.isArray(list) ? list : []).find((x) => key(x) === want);
    if (!found?.id) throw new Error("Lezione equivalente non trovata sul server (ID irrilevabile)");
    return found.id;
  };

  // PATCH dedicati (rimanda/annulla)
  const patchRimanda = async (lessonId, motivazione = "") => {
    const res = await fetch(`${API_BASE}/api/lezioni/${lessonId}/rimanda`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore rimanda (${res.status})`);
    }
    return res.json();
  };
  const patchAnnulla = async (lessonId, motivazione = "") => {
    const res = await fetch(`${API_BASE}/api/lezioni/${lessonId}/annulla`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore annulla (${res.status})`);
    }
    return res.json();
  };

  // update ottimistico locale
  const patchLocal = (target, patch) => {
    setAllLessonsFromToday((prev) =>
      prev.map((e) => (sameKey(e) === sameKey(target) ? { ...e, ...patch } : e))
    );
  };

  const handleRimanda = async (lesson) => {
    try {
      const motivo = window.prompt(
        "Confermi di rimandare questa lezione?\nInserisci una motivazione (opzionale):",
        lesson.motivazione || ""
      );
      if (motivo === null) return;

      patchLocal(lesson, { stato: "rimandata", riprogrammata: false, motivazione: motivo });
      const realId = await resolveLessonId(lesson);
      await patchRimanda(realId, motivo);
      await refetchLessons();
    } catch (e) {
      alert(e.message || "Errore nel rimandare la lezione");
      refetchLessons();
    }
  };

  const handleAnnulla = async (lesson) => {
    try {
      const motivo = window.prompt(
        "Confermi l'annullamento della lezione?\nInserisci una motivazione (opzionale):",
        lesson.motivazione || ""
      );
      if (motivo === null) return;

      patchLocal(lesson, { stato: "annullata", riprogrammata: false, motivazione: motivo });
      const realId = await resolveLessonId(lesson);
      await patchAnnulla(realId, motivo);
      await refetchLessons();
    } catch (e) {
      alert(e.message || "Errore nell'annullare la lezione");
      refetchLessons();
    }
  };

  const openEdit = (lesson, mode = "edit") => {
    setEditLesson(lesson);
    setEditMode(mode);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);
  const handleSaved = async () => {
    closeEdit();
    await refetchLessons();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">{/* spazio per BottomNav */}
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold">Allievi</h1>
          <p className="text-sm text-gray-500">Assegnati & lezioni future</p>
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

        {/* Intervallo date */}
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

        {/* Azioni rapide su date */}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border bg-white"
            onClick={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, "0");
              const d = String(today.getDate()).padStart(2, "0");
              setDateFrom(`${y}-${m}-${d}`);
              setDateTo("");
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

        {/* ⚡ Filtro STATO */}
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Mostra solo:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={statusOnly.svolta}
                onChange={() => toggleStatus("svolta")}
              />
              <span>Svolte</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={statusOnly.annullata}
                onChange={() => toggleStatus("annullata")}
              />
              <span>Annullate</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={statusOnly.riprogrammata}
                onChange={() => toggleStatus("riprogrammata")}
              />
              <span>Riprogrammate</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={statusOnly.rimandata}
                onChange={() => toggleStatus("rimandata")}
              />
              <span>Rimandate</span>
            </label>
          </div>
          <div className="mt-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg border bg-white"
              onClick={clearStatusFilters}
            >
              Pulisci stati
            </button>
          </div>
        </div>

        {rangeError && (
          <div className="mt-2 text-xs text-red-600">
            {rangeError}
          </div>
        )}
      </div>

      {/* Loading / Errore */}
      {loading && (
        <div className="max-w-xl mx-auto px-4 space-y-3">
          <Skeleton h="48px" />
          <Skeleton h="48px" />
          <Skeleton h="112px" />
        </div>
      )}
      {!loading && err && (
        <div className="max-w-xl mx-auto px-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {err}
          </div>
        </div>
      )}

      {/* Contenuti */}
      {!loading && !err && (
        <>
          {/* Allievi */}
          <SectionTitle title="Allievi assegnati" />
          <div className="max-w-xl mx-auto px-4 pb-4 grid gap-2">
            {filteredStudents.length === 0 ? (
              <EmptyState
                title="Nessun allievo"
                subtitle={search ? "Modifica la ricerca." : "Non sono presenti assegnazioni."}
              />
            ) : (
              filteredStudents.map((s) => <StudentRow key={s.id} s={s} />)
            )}
          </div>

          {/* Lezioni future (tutti gli stati, filtrati) */}
          <SectionTitle title="Lezioni future" />
          <div className="max-w-xl mx-auto px-4">
            {lessonsByDay.length === 0 ? (
              <EmptyState
                title="Nessuna lezione trovata"
                subtitle={
                  dateFrom || dateTo || search || Object.values(statusOnly).some(Boolean)
                    ? "Nessuna lezione che rispetta i filtri."
                    : "Quando verranno aggiunte, le vedrai qui."
                }
              />
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
                          onOpenEdit={(mode) => openEdit(l, mode || "edit")}
                          onRimanda={() => handleRimanda(l)}
                          onAnnulla={() => handleAnnulla(l)}
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
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// --- UI bits ---
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
    <div className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2">
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
    <span
      className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}
function LessonRow({ l, last, onOpenEdit, onRimanda, onAnnulla }) {
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
    isAnnullata ? "red"
    : isRiprogrammata ? "purple"
    : isRimandata ? "orange"
    : (label === "svolta" ? "green" : "blue");

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 ${last ? "" : "border-b"} cursor-pointer`}
      onClick={() => onOpenEdit && onOpenEdit("edit")}
      title="Modifica lezione"
    >
      <div className="w-12 text-xs text-gray-600 shrink-0">{orario}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-medium truncate">
            {l.nome_allievo ? `${l.nome_allievo} ${l.cognome_allievo || ""}`.trim() : "Allievo"}
          </div>
          <Badge tone={tone}>{label}</Badge>
          {l.aula ? <Badge>{`Aula ${l.aula}`}</Badge> : null}
        </div>
        {l.motivazione && label !== "svolta" && (
          <div className="text-xs text-gray-500 mt-0.5">Motivo: {l.motivazione}</div>
        )}
      </div>

      {/* Azioni – per stato */}
      {!isAnnullata && (
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isRimandata ? (
            <>
              <button
                className="px-2 py-1 rounded-md text-xs bg-amber-600 text-white"
                title="Riprogramma"
                onClick={() => onOpenEdit && onOpenEdit("reschedule")}
              >
                Riprogramma
              </button>
              <button
                className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                title="Annulla"
                onClick={onAnnulla}
              >
                Annulla
              </button>
            </>
          ) : (
            <>
              <button
                className="px-2 py-1 rounded-md text-xs bg-amber-100 text-amber-800"
                title="Rimanda"
                onClick={onRimanda}
              >
                Rimanda
              </button>
              <button
                className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800"
                title="Annulla"
                onClick={onAnnulla}
              >
                Annulla
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
function Skeleton({ h = "48px" }) {
  return <div className="animate-pulse rounded-xl bg-gray-200" style={{ height: h }} />;
}

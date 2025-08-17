import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import BottomNav from "../componenti/BottomNav";

// Config base API (CRA usa process.env.REACT_APP_*)
const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "https://app-docenti.onrender.com"; // 👈 fallback (sostituisci col tuo URL)

// --- utils ---
function getToken() {
  try {
    return localStorage.getItem("token") || null;
  } catch {
    return null;
  }
}

function jwtPayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1] || ""));
  } catch {
    return null;
  }
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

/**
 * Ottieni l'id dell'insegnante:
 * 1) /api/insegnante/me
 * 2) fallback: username nel JWT -> match in /api/insegnanti
 */
async function resolveTeacherId(token) {
  try {
    const me = await fetchJSON(`${API_BASE}/api/insegnante/me`, token);
    if (me?.id) return { id: String(me.id), profile: me };
  } catch {
    // fallback
  }

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

function ymd(dateLike) {
  return String(dateLike || "").slice(0, 10); // "YYYY-MM-DD"
}

function isFromTodayOnward(lez) {
  const ymdStr = ymd(lez.data);
  if (!ymdStr) return false;
  const lessonDay = new Date(`${ymdStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return lessonDay.getTime() >= today.getTime();
}

function inRangeInclusive(lez, startYMD, endYMD) {
  const day = ymd(lez.data);
  if (!day) return false;
  if (startYMD && day < startYMD) return false;
  if (endYMD && day > endYMD) return false;
  return true;
}

function isoFromDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${t}`;
}

// --- component ---
export default function AllieviPage() {
  const token = getToken();
  const [teacherId, setTeacherId] = useState(null);

  const [students, setStudents] = useState([]);
  const [allLessonsFromToday, setAllLessonsFromToday] = useState([]); // dati base (oggi → futuro)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // UI state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState("");     // "YYYY-MM-DD"

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

        // tutte le lezioni dell'insegnante
        const lezioni = await fetchJSON(`${API_BASE}/api/insegnanti/${id}/lezioni`, token);
        if (cancel) return;

        // tieni solo quelle da oggi in poi (indipendentemente dallo stato)
        const base = (Array.isArray(lezioni) ? lezioni : []).filter(isFromTodayOnward);
        setAllLessonsFromToday(base);
      } catch (e) {
        if (!cancel) setErr(e.message || "Errore di caricamento.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  // Filtro studenti (ricerca)
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.nome} ${s.cognome}`.toLowerCase().includes(q));
  }, [students, search]);

  // Filtro lezioni per intervallo date (inclusivo)
  const filteredLessons = useMemo(() => {
    // se non c'è nessun capo, mostra da oggi in poi (già limitato a monte)
    if (!dateFrom && !dateTo) return allLessonsFromToday;
    return allLessonsFromToday.filter((l) => inRangeInclusive(l, dateFrom, dateTo));
  }, [allLessonsFromToday, dateFrom, dateTo]);

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

  // Messaggio di errore specifico se range invertito
  const rangeError = useMemo(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return "Intervallo date non valido: la data iniziale è successiva alla finale.";
    }
    return null;
  }, [dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">{/* spazio per BottomNav */}
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold">Allievi</h1>
          <p className="text-sm text-gray-500">Assegnati & lezioni future</p>
        </div>
      </div>

      {/* Ricerca + Filtro date */}
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
              setDateFrom(`${y}-${m}-${d}`);
              setDateTo("");
            }}
          >
            Da oggi
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg border bg-white"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Pulisci filtro
          </button>
        </div>
        {rangeError && (
          <div className="mt-2 text-xs text-red-600">
            {rangeError}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-xl mx-auto px-4 space-y-3">
          <Skeleton h="48px" />
          <Skeleton h="48px" />
          <Skeleton h="112px" />
        </div>
      )}

      {/* Errore */}
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
                subtitle={
                  search
                    ? "Modifica la ricerca."
                    : "Non sono presenti assegnazioni."
                }
              />
            ) : (
              filteredStudents.map((s) => <StudentRow key={s.id} s={s} />)
            )}
          </div>

          {/* Lezioni future (filtrate) */}
          <SectionTitle title="Lezioni future" />
          <div className="max-w-xl mx-auto px-4">
            {lessonsByDay.length === 0 ? (
              <EmptyState
                title="Nessuna lezione trovata"
                subtitle={
                  dateFrom || dateTo
                    ? "Nessuna lezione nell'intervallo selezionato."
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
                        <LessonRow key={l.id} l={l} last={i === items.length - 1} />
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="allievi" />
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

function LessonRow({ l, last }) {
  const startISO = isoFromDateTime(ymd(l.data), l.ora_inizio);
  const endISO = isoFromDateTime(ymd(l.data), l.ora_fine);
  const orario =
    startISO && endISO
      ? `${format(new Date(startISO), "HH:mm")} – ${format(new Date(endISO), "HH:mm")}`
      : "--:--";

  const stato = (l.stato || "futura").toLowerCase();
  const tone =
    stato === "annullata" ? "red"
    : stato === "rimandata" ? "orange"
    : stato === "svolta" ? "green"
    : "blue";

  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${last ? "" : "border-b"}`}>
      <div className="w-12 text-xs text-gray-600 shrink-0">{orario}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-medium truncate">
            {l.nome_allievo ? `${l.nome_allievo} ${l.cognome_allievo || ""}`.trim() : "Allievo"}
          </div>
          <Badge tone={tone}>{stato}</Badge>
          {l.riprogrammata ? <Badge tone="purple">riprogrammata</Badge> : null}
          {l.aula ? <Badge>{`Aula ${l.aula}`}</Badge> : null}
        </div>
        {l.motivazione && stato !== "futura" && (
          <div className="text-xs text-gray-500 mt-0.5">Motivo: {l.motivazione}</div>
        )}
      </div>
    </div>
  );
}

function Skeleton({ h = "48px" }) {
  return (
    <div className="animate-pulse rounded-xl bg-gray-200" style={{ height: h }} />
  );
}




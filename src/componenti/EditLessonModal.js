import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

// helpers base
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

export default function EditLessonModal({
  open,
  onClose,
  onSaved,
  lesson,           // { id?, id_insegnante, id_allievo, data, ora_inizio, ora_fine, aula, ... }
  mode = "edit"     // "edit" | "reschedule"
}) {
  const token = getToken();

  // ─────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Insegnanti / Allievi
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsErr, setStudentsErr] = useState("");

  // Filtra allievi per insegnante assegnato (toggle)
  const [filterByTeacher, setFilterByTeacher] = useState(false);

  // Aule
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsErr, setRoomsErr] = useState("");
  const [useManualAula, setUseManualAula] = useState(false);

  // Form
  const [form, setForm] = useState({
    id_insegnante: lesson?.id_insegnante || "",
    id_allievo: lesson?.id_allievo || "",
    data: (lesson?.data || "").slice(0, 10),
    ora_inizio: (lesson?.ora_inizio || "").slice(0, 5),
    ora_fine: (lesson?.ora_fine || "").slice(0, 5),
    aula: lesson?.aula || "",
  });

  // ─────────────────────────────────────────────────────────
  // EFFECTS: reset su open/lesson
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setForm({
      id_insegnante: lesson?.id_insegnante || "",
      id_allievo: lesson?.id_allievo || "",
      data: (lesson?.data || "").slice(0, 10),
      ora_inizio: (lesson?.ora_inizio || "").slice(0, 5),
      ora_fine: (lesson?.ora_fine || "").slice(0, 5),
      aula: lesson?.aula || "",
    });
    setUseManualAula(false);
    setError("");
  }, [open, lesson]);

  // Carica insegnanti
  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      try {
        setLoadingTeachers(true);
        const list = await fetchJSON(`${API_BASE}/api/insegnanti`, null);
        if (cancel) return;
        setTeachers(Array.isArray(list) ? list : []);
      } catch (e) {
        // in genere endpoint pubblico: difficilmente fallisce
      } finally {
        if (!cancel) setLoadingTeachers(false);
      }
    })();
    return () => { cancel = true; };
  }, [open]);

  // Carica allievi (tutti o per insegnante selezionato se filterByTeacher)
  useEffect(() => {
    if (!open) return;
    let cancel = false;

    const loadAll = async () => {
      try {
        setLoadingStudents(true);
        setStudentsErr("");
        const list = await fetchJSON(`${API_BASE}/api/allievi`, token);
        if (cancel) return;
        setStudents(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancel) setStudentsErr(e.message || "Errore nel caricamento allievi");
      } finally {
        if (!cancel) setLoadingStudents(false);
      }
    };

    const loadByTeacher = async (teacherId) => {
      if (!teacherId) { setStudents([]); return; }
      try {
        setLoadingStudents(true);
        setStudentsErr("");
        const list = await fetchJSON(`${API_BASE}/api/insegnanti/${teacherId}/allievi`, token);
        if (cancel) return;
        setStudents(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancel) setStudentsErr(e.message || "Errore nel caricamento allievi");
      } finally {
        if (!cancel) setLoadingStudents(false);
      }
    };

    if (filterByTeacher && form.id_insegnante) {
      loadByTeacher(form.id_insegnante);
    } else {
      loadAll();
    }

    return () => { cancel = true; };
  }, [open, token, filterByTeacher, form.id_insegnante]);

  // Carica aule
  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      try {
        setRoomsLoading(true);
        setRoomsErr("");
        const list = await fetchJSON(`${API_BASE}/api/aule`, token);
        if (cancel) return;
        setRooms(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancel) setRoomsErr(e.message || "Errore nel caricamento aule");
      } finally {
        if (!cancel) setRoomsLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [open, token]);

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "id_insegnante") {
      // se cambio insegnante, azzero allievo (per evitare mismatch)
      setForm((f) => ({ ...f, id_insegnante: value, id_allievo: "" }));
    }
  };

  const hasMinData = useMemo(() => {
    return form.id_insegnante && form.id_allievo && form.data && form.ora_inizio && form.ora_fine && form.aula;
  }, [form]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!hasMinData) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        id_insegnante: Number(form.id_insegnante),
        id_allievo: Number(form.id_allievo),
        data: form.data,
        ora_inizio: form.ora_inizio,
        ora_fine: form.ora_fine,
        aula: form.aula, // stringa
      };

      const isEdit = Boolean(lesson?.id);
      const url = isEdit
        ? `${API_BASE}/api/lezioni/${lesson.id}`
        : `${API_BASE}/api/lezioni`;
      const method = isEdit ? "PUT" : "POST";

      await fetchJSON(url, token, {
        method,
        body: JSON.stringify(payload),
      });

      onSaved && onSaved();
    } catch (e) {
      setError(e.message || "Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // ─────────────────────────────────────────────────────────
  // PORTAL con z-index alto (sopra calendario e bottom bar)
  // ─────────────────────────────────────────────────────────
  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Pannello */}
      <div className="relative z-[10000] bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 m-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">
            {mode === "reschedule"
              ? "Riprogramma lezione"
              : (lesson?.id ? "Modifica lezione" : "Nuova lezione")}
          </div>
          <button className="text-sm text-gray-500" onClick={onClose}>Chiudi</button>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* INSEGNANTE / ALLIEVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Insegnante *">
            <select
              name="id_insegnante"
              value={form.id_insegnante}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
              disabled={loadingTeachers}
            >
              <option value="">
                {loadingTeachers ? "Caricamento…" : "Seleziona insegnante"}
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.cognome}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Allievo *">
            <select
              name="id_allievo"
              value={form.id_allievo}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
              disabled={loadingStudents}
            >
              <option value="">
                {loadingStudents ? "Caricamento…" : "Seleziona allievo"}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cognome} {s.nome}
                </option>
              ))}
            </select>

            {/* toggle filtro per assegnazioni insegnante */}
            <div className="mt-1 text-xs text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterByTeacher}
                  onChange={(e) => setFilterByTeacher(e.target.checked)}
                  disabled={!form.id_insegnante}
                />
                <span>Mostra solo assegnati a questo insegnante</span>
              </label>
              {studentsErr && (
                <div className="mt-1 text-red-600">{studentsErr}</div>
              )}
            </div>
          </Field>
        </div>

        {/* DATA / ORARI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <Field label="Data *">
            <input
              type="date"
              name="data"
              value={form.data}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Inizio *">
              <input
                type="time"
                name="ora_inizio"
                value={form.ora_inizio}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Fine *">
              <input
                type="time"
                name="ora_fine"
                value={form.ora_fine}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>

        {/* AULA */}
        <div className="mt-2">
          <Field label="Aula *">
            {!useManualAula ? (
              <>
                <select
                  name="aula"
                  value={form.aula}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  disabled={roomsLoading || (!!roomsErr && rooms.length === 0)}
                >
                  <option value="" disabled>
                    {roomsLoading ? "Caricamento aule..." : "Seleziona un'aula"}
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.nome}>
                      {r.nome}{r.capienza ? ` (cap. ${r.capienza})` : ""}
                    </option>
                  ))}
                  <option value="__manual__">Altro… (non in lista)</option>
                </select>

                {form.aula === "__manual__" && (
                  <div className="mt-2">
                    <input
                      autoFocus
                      placeholder="Inserisci nome/numero aula"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      value=""
                      onChange={(e) =>
                        setForm((f) => ({ ...f, aula: e.target.value }))
                      }
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        setForm((f) => ({ ...f, aula: v }));
                        if (!v) setUseManualAula(true);
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Verrà salvato esattamente il testo inserito.
                    </div>
                  </div>
                )}

                {roomsErr && rooms.length === 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-2 p-2">
                    {roomsErr}. Puoi comunque inserire manualmente:
                    <button
                      type="button"
                      className="ml-2 text-blue-600 underline"
                      onClick={() => setUseManualAula(true)}
                    >
                      inserisci a mano
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  name="aula"
                  value={form.aula}
                  onChange={onChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Inserisci nome/numero aula"
                />
                <div className="mt-1">
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => setUseManualAula(false)}
                  >
                    Torna alla lista aule
                  </button>
                </div>
              </>
            )}
          </Field>
        </div>

        {/* AZIONI */}
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border bg-white" onClick={onClose} type="button">
            Annulla
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            onClick={handleSave}
            disabled={saving || !hasMinData}
          >
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

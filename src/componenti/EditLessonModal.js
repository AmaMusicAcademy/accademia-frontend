import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

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
  lesson,
  mode = "edit",
  /** 👇 NUOVO: se passato, blocca l'insegnante a questo ID (uso lato insegnante) */
  lockedTeacherId = null,
}) {
  const token = getToken();

  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError]           = useState("");

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsErr, setStudentsErr] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsErr, setRoomsErr] = useState("");
  const [useManualAula, setUseManualAula] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [giorniChiusura, setGiorniChiusura] = useState([]);

  /** se lockedTeacherId è presente, il filtro allievi è sempre by-teacher */
  const [filterByTeacher, setFilterByTeacher] = useState(!!lockedTeacherId);
  const [tipoLezione, setTipoLezione] = useState('individuale'); // 'individuale' | 'collettiva'
  const [gruppi, setGruppi] = useState([]);
  const [loadingGruppi, setLoadingGruppi] = useState(false);

  const [form, setForm] = useState({
    id_insegnante: lockedTeacherId || lesson?.id_insegnante || "",
    id_allievo: lesson?.id_allievo || "",
    gruppo_id: lesson?.gruppo_id || "",
    data: (lesson?.data || "").slice(0, 10),
    ora_inizio: (lesson?.ora_inizio || "").slice(0, 5),
    ora_fine: (lesson?.ora_fine || "").slice(0, 5),
    aula: lesson?.aula || "",
  });

  // reset su open/lesson o quando si blocca l'insegnante
  useEffect(() => {
    if (!open) return;
    const tipo = lesson?.tipo || 'individuale';
    setTipoLezione(tipo);
    setForm({
      id_insegnante: lockedTeacherId || lesson?.id_insegnante || "",
      id_allievo: lesson?.id_allievo || "",
      gruppo_id: lesson?.gruppo_id || "",
      data: (lesson?.data || "").slice(0, 10),
      ora_inizio: (lesson?.ora_inizio || "").slice(0, 5),
      ora_fine: (lesson?.ora_fine || "").slice(0, 5),
      aula: lesson?.aula || "",
    });
    setUseManualAula(false);
    setIsRecurring(false);
    setRepeatUntil("");
    setError("");
    setFilterByTeacher(!!lockedTeacherId);
  }, [open, lesson, lockedTeacherId]);

  // carica giorni di chiusura (solo su nuova lezione)
  useEffect(() => {
    if (!open || lesson?.id) return;
    let cancel = false;
    (async () => {
      try {
        const list = await fetchJSON(`${API_BASE}/api/giorni-chiusura`, token);
        if (!cancel) setGiorniChiusura(Array.isArray(list) ? list.map(g => g.data?.slice(0, 10)) : []);
      } catch { /* ignore */ }
    })();
    return () => { cancel = true; };
  }, [open, lesson, token]);

  // carica gruppi (filtrati per insegnante se locked)
  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      try {
        setLoadingGruppi(true);
        const list = await fetchJSON(`${API_BASE}/api/gruppi`, token);
        if (cancel) return;
        const all = Array.isArray(list) ? list : [];
        setGruppi(lockedTeacherId
          ? all.filter(g => String(g.insegnante_id) === String(lockedTeacherId))
          : all
        );
      } finally {
        if (!cancel) setLoadingGruppi(false);
      }
    })();
    return () => { cancel = true; };
  }, [open, token, lockedTeacherId]);

  // carica insegnanti (serve anche solo per mostrare il nome quando locked)
  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      try {
        setLoadingTeachers(true);
        const list = await fetchJSON(`${API_BASE}/api/insegnanti`, null);
        if (cancel) return;
        setTeachers(Array.isArray(list) ? list : []);
      } finally {
        if (!cancel) setLoadingTeachers(false);
      }
    })();
    return () => { cancel = true; };
  }, [open]);

  // carica allievi (tutti oppure solo quelli assegnati in base a locked/filter)
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

    const teacherId = lockedTeacherId || form.id_insegnante;
    if (lockedTeacherId || (filterByTeacher && teacherId)) {
      loadByTeacher(teacherId);
    } else {
      loadAll();
    }

    return () => { cancel = true; };
  }, [open, token, filterByTeacher, form.id_insegnante, lockedTeacherId]);

  // carica aule
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

  const onChange = (e) => {
    const { name, value } = e.target;
    // se l'insegnante è bloccato, ignora modifiche a id_insegnante
    if (name === "id_insegnante" && lockedTeacherId) return;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "id_insegnante") {
      setForm((f) => ({ ...f, id_insegnante: value, id_allievo: "" }));
    }
  };

  const hasMinData = useMemo(() => {
    const teacher = lockedTeacherId || form.id_insegnante;
    const soggetto = tipoLezione === 'collettiva' ? form.gruppo_id : form.id_allievo;
    const aulaOk = isRecurring ? true : !!form.aula;
    const repeatOk = !isRecurring || (repeatUntil && repeatUntil >= form.data);
    return teacher && soggetto && form.data && form.ora_inizio && form.ora_fine && aulaOk && repeatOk;
  }, [form, lockedTeacherId, tipoLezione, isRecurring, repeatUntil]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!hasMinData) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    try {
      setSaving(true);
      const isEdit = Boolean(lesson?.id);

      const buildPayload = (data, aula, motivazione) => {
        const base = tipoLezione === 'collettiva'
          ? { id_insegnante: Number(lockedTeacherId || form.id_insegnante), gruppo_id: Number(form.gruppo_id) }
          : { id_insegnante: Number(lockedTeacherId || form.id_insegnante), id_allievo: Number(form.id_allievo) };
        const p = { ...base, data, ora_inizio: form.ora_inizio, ora_fine: form.ora_fine };
        if (aula) p.aula = aula;
        if (motivazione) p.motivazione = motivazione;
        return p;
      };

      if (!isEdit && isRecurring) {
        // loop settimanale
        let current = new Date(form.data + 'T00:00:00');
        const end = new Date(repeatUntil + 'T00:00:00');
        let created = 0;
        while (current <= end) {
          const dateStr = current.toISOString().slice(0, 10);
          if (!giorniChiusura.includes(dateStr)) {
            try {
              await fetchJSON(`${API_BASE}/api/lezioni`, token, {
                method: 'POST',
                body: JSON.stringify(buildPayload(dateStr, form.aula, null)),
              });
            } catch (err) {
              if (err.status === 409) {
                // aula occupata: crea senza aula con nota
                await fetchJSON(`${API_BASE}/api/lezioni`, token, {
                  method: 'POST',
                  body: JSON.stringify(buildPayload(dateStr, null, 'Aula non disponibile - da assegnare')),
                });
              }
              // altri errori: ignora e continua
            }
            created++;
          }
          current.setDate(current.getDate() + 7);
        }
      } else {
        const url = isEdit
          ? `${API_BASE}/api/lezioni/${lesson.id}`
          : `${API_BASE}/api/lezioni`;
        const method = isEdit ? "PUT" : "POST";
        await fetchJSON(url, token, { method, body: JSON.stringify(buildPayload(form.data, form.aula, null)) });
      }

      onSaved && onSaved();
    } catch (e) {
      setError(e.message || "Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson?.id) return;
    setConfirmDel(false);
    try {
      setDeleting(true);
      await fetchJSON(`${API_BASE}/api/lezioni/${lesson.id}`, token, { method: "DELETE" });
      onSaved && onSaved();
    } catch (e) {
      setError(e.message || "Errore nell'eliminazione.");
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  // nome/cognome insegnante bloccato per etichetta
  const lockedTeacher =
    lockedTeacherId
      ? teachers.find(t => String(t.id) === String(lockedTeacherId))
      : null;

  const title = mode === "reschedule"
    ? "Riprogramma lezione"
    : lesson?.id ? "Modifica lezione" : "Nuova lezione";

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-n-900">{title}</h2>
          <button onClick={onClose} className="text-n-300 active:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* body */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">

          {error && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* TIPO LEZIONE — solo su nuova lezione */}
          {!lesson?.id && (
            <div className="flex rounded-xl border overflow-hidden">
              {[
                { id: 'individuale', label: 'Individuale' },
                { id: 'collettiva',  label: 'Di gruppo' },
              ].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setTipoLezione(id)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    tipoLezione === id ? 'bg-ama-500 text-white' : 'text-n-600 bg-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* INSEGNANTE / ALLIEVO o GRUPPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Insegnante *">
              {lockedTeacherId ? (
                <div className="w-full rounded-xl border px-3 py-2 text-sm bg-n-50 text-gray-700">
                  {lockedTeacher ? `${lockedTeacher.nome} ${lockedTeacher.cognome}` : `ID ${lockedTeacherId}`}
                </div>
              ) : (
                <select
                  name="id_insegnante"
                  value={form.id_insegnante}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                  disabled={loadingTeachers}
                >
                  <option value="">{loadingTeachers ? "Caricamento…" : "Seleziona insegnante"}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
                  ))}
                </select>
              )}
            </Field>

            {tipoLezione === 'collettiva' ? (
              <Field label="Gruppo *">
                <select
                  name="gruppo_id"
                  value={form.gruppo_id}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                  disabled={loadingGruppi}
                >
                  <option value="">{loadingGruppi ? "Caricamento…" : "Seleziona gruppo"}</option>
                  {gruppi.map((g) => (
                    <option key={g.id} value={g.id}>{g.nome} ({g.num_allievi} p.)</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Allievo *">
                <select
                  name="id_allievo"
                  value={form.id_allievo}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                  disabled={loadingStudents}
                >
                  <option value="">{loadingStudents ? "Caricamento…" : "Seleziona allievo"}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.cognome} {s.nome}</option>
                  ))}
                </select>
                {!lockedTeacherId && (
                  <label className="inline-flex items-center gap-2 mt-1.5 text-xs text-n-600">
                    <input
                      type="checkbox"
                      checked={filterByTeacher}
                      onChange={(e) => setFilterByTeacher(e.target.checked)}
                      disabled={!form.id_insegnante}
                    />
                    Solo allievi di questo insegnante
                  </label>
                )}
                {studentsErr && <p className="text-xs text-red-500 mt-1">{studentsErr}</p>}
              </Field>
            )}
          </div>

          {/* DATA / ORARI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data *">
              <input
                type="date" name="data" value={form.data} onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Inizio *">
                <input
                  type="time" name="ora_inizio" value={form.ora_inizio} onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Fine *">
                <input
                  type="time" name="ora_fine" value={form.ora_fine} onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>

          {/* RIPETIZIONE SETTIMANALE — solo su nuova lezione */}
          {!lesson?.id && (
            <div className="rounded-xl border p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-n-800">Ripeti settimanalmente</span>
              </label>
              {isRecurring && (
                <div className="pt-1">
                  <Field label="Fino al *">
                    <input
                      type="date"
                      value={repeatUntil}
                      min={form.data || undefined}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                    />
                  </Field>
                  {repeatUntil && form.data && repeatUntil >= form.data && (
                    <p className="text-xs text-n-500 mt-1.5">
                      {(() => {
                        let count = 0;
                        let d = new Date(form.data + 'T00:00:00');
                        const end = new Date(repeatUntil + 'T00:00:00');
                        while (d <= end) {
                          if (!giorniChiusura.includes(d.toISOString().slice(0, 10))) count++;
                          d.setDate(d.getDate() + 7);
                        }
                        const skipped = (() => {
                          let s = 0;
                          let d2 = new Date(form.data + 'T00:00:00');
                          while (d2 <= end) {
                            if (giorniChiusura.includes(d2.toISOString().slice(0, 10))) s++;
                            d2.setDate(d2.getDate() + 7);
                          }
                          return s;
                        })();
                        return `${count} lezioni${skipped > 0 ? `, ${skipped} saltate (giorno di chiusura)` : ''}`;
                      })()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AULA */}
          <Field label={isRecurring ? "Aula preferita" : "Aula *"}>
            {!useManualAula ? (
              <>
                <select
                  name="aula" value={form.aula} onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                  disabled={roomsLoading || (!!roomsErr && rooms.length === 0)}
                >
                  <option value="" disabled>{roomsLoading ? "Caricamento aule…" : "Seleziona un'aula"}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.nome}>{r.nome}{r.capienza ? ` (cap. ${r.capienza})` : ""}</option>
                  ))}
                  <option value="__manual__">Altro… (non in lista)</option>
                </select>
                {form.aula === "__manual__" && (
                  <input
                    autoFocus
                    placeholder="Inserisci nome/numero aula"
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-2"
                    value=""
                    onChange={(e) => setForm((f) => ({ ...f, aula: e.target.value }))}
                    onBlur={(e) => { const v = e.target.value.trim(); setForm((f) => ({ ...f, aula: v })); if (!v) setUseManualAula(true); }}
                  />
                )}
              </>
            ) : (
              <>
                <input
                  name="aula" value={form.aula} onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Inserisci nome/numero aula"
                />
                <button type="button" className="text-xs text-ama-500 mt-1" onClick={() => setUseManualAula(false)}>
                  Torna alla lista aule
                </button>
              </>
            )}
          </Field>
        </div>

        {/* footer */}
        <div className="px-5 pb-5 pt-3 border-t flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving || deleting || !hasMinData}
            className="w-full py-3 bg-ama-500 text-white rounded-xl font-medium text-sm disabled:opacity-40 active:bg-blue-700"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
          {lesson?.id && (
            <button
              onClick={() => setConfirmDel(true)}
              disabled={saving || deleting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium text-sm active:bg-red-100 disabled:opacity-40"
            >
              <Trash2 size={15} /> {deleting ? "Eliminazione…" : "Elimina appuntamento"}
            </button>
          )}
        </div>

        {/* popup conferma eliminazione */}
        {confirmDel && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-2xl">
            <div className="bg-white border shadow-lg rounded-2xl p-6 mx-4 text-center">
              <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-n-900 mb-1">Eliminare l'appuntamento?</p>
              <p className="text-xs text-n-600 mb-5">L'operazione è irreversibile.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDel(false)}
                  className="flex-1 py-2.5 rounded-xl bg-n-100 text-gray-700 text-sm font-medium active:bg-n-100"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium active:bg-red-700"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-n-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
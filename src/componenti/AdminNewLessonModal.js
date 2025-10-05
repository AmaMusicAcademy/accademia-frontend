import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";

const BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

export default function AdminNewLessonModal({ open, onClose, onCreated }) {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [insegnanti, setInsegnanti] = useState([]);
  const [aule, setAule] = useState([]);
  const [allievi, setAllievi] = useState([]);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showAllStudents, setShowAllStudents] = useState(false);

  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    id_allievo: "",
    motivazione: "",
  });

  // Ricorrenza
  const [isRecurring, setIsRecurring] = useState(false);
  const [untilDate, setUntilDate] = useState("");
  const [occurrences, setOccurrences] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  // ---- util date ----
  const addDays = (ymd, days) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  const dateGte = (a, b) => a >= b;
  function* weeklyGenerator(startYmd, endYmd) {
    let cur = startYmd;
    while (dateGte(endYmd, cur)) {
      yield cur;
      cur = addDays(cur, 7);
    }
  }

  // preview ricorrenza
  useEffect(() => {
    if (!isRecurring || !form.data || !untilDate) return setOccurrences(0);
    if (untilDate < form.data) return setOccurrences(0);
    let c = 0;
    for (const _ of weeklyGenerator(form.data, untilDate)) c++;
    setOccurrences(c);
  }, [isRecurring, form.data, untilDate]);

  // carica INSEGNANTI + AULE all’apertura
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setErrore(null);
        // insegnanti (endpoint pubblico nel tuo backend)
        const tRes = await fetch(`${BASE_URL}/api/insegnanti`);
        const t = await tRes.json().catch(() => []);
        setInsegnanti(Array.isArray(t) ? t : []);

        // aule (protetto admin)
        const aRes = await fetch(`${BASE_URL}/api/aule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const a = await aRes.json().catch(() => []);
        setAule(Array.isArray(a) ? a : []);
      } catch (e) {
        setErrore("Errore nel caricamento iniziale");
      }
    })();
  }, [open, token]);

  // carica ALLIEVI in base all’insegnante selezionato o tutti
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setErrore(null);
        let url;
        if (showAllStudents || !selectedTeacher) {
          url = `${BASE_URL}/api/allievi`;
        } else {
          url = `${BASE_URL}/api/insegnanti/${selectedTeacher}/allievi`;
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAllievi(Array.isArray(data) ? data : []);
      } catch {
        setErrore("Errore nel recupero allievi");
      }
    })();
  }, [open, selectedTeacher, showAllStudents, token]);

  const cambia = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const valida = () => {
    if (!selectedTeacher) {
      setErrore("Seleziona un insegnante");
      return false;
    }
    if (!form.id_allievo) {
      setErrore("Seleziona un allievo");
      return false;
    }
    if (!form.data || !form.ora_inizio || !form.ora_fine || !form.aula) {
      setErrore("Compila data, orari e aula");
      return false;
    }
    if (form.ora_fine <= form.ora_inizio) {
      setErrore("L'orario di fine deve essere successivo all'inizio");
      return false;
    }
    setErrore(null);
    return true;
  };

  const createOne = async (payload) => {
    const res = await fetch(`${BASE_URL}/api/lezioni`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // admin è autorizzato a creare per chiunque
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${t ? `: ${t}` : ""}`);
    }
    return res.json().catch(() => null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;

    setLoading(true);
    try {
      const basePayload = {
        id_insegnante: Number(selectedTeacher),
        id_allievo: Number(form.id_allievo),
        data: form.data,
        ora_inizio: form.ora_inizio,
        ora_fine: form.ora_fine,
        aula: form.aula,
        motivazione: form.motivazione || null,
        stato: "svolta",
      };

      if (!isRecurring) {
        const created = await createOne(basePayload);
        onCreated && onCreated(created);
        resetAndClose();
        return;
      }

      const createdItems = [];
      for (const ymd of weeklyGenerator(form.data, untilDate)) {
        try {
          const c = await createOne({ ...basePayload, data: ymd });
          if (c) createdItems.push(c);
        } catch {}
      }
      onCreated && onCreated(createdItems);
      resetAndClose();
    } catch (err) {
      setErrore(err.message || "Errore salvataggio");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedTeacher("");
    setShowAllStudents(false);
    setForm({
      data: "",
      ora_inizio: "",
      ora_fine: "",
      aula: "",
      id_allievo: "",
      motivazione: "",
    });
    setIsRecurring(false);
    setUntilDate("");
    onClose && onClose();
  };

  if (!open) return null;

  const body = (
    <div
      className="fixed inset-0 z-80 flex items-end sm:items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-nuova-lezione-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 id="admin-nuova-lezione-title" className="text-lg font-semibold">
            Nuova lezione (admin)
          </h2>
          <button onClick={onClose} className="text-gray-500 text-xl">✕</button>
        </div>

        {errore && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {errore}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {/* Insegnante */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Insegnante *</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={selectedTeacher}
              onChange={(e) => { setSelectedTeacher(e.target.value); setForm(f => ({...f, id_allievo: ""})); }}
              required
            >
              <option value="">Seleziona insegnante…</option>
              {insegnanti.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.cognome} {i.nome} {i.username ? `(@${i.username})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Allievo */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-600 mb-1">Allievo *</label>
              <label className="text-xs flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAllStudents}
                  onChange={(e) => setShowAllStudents(e.target.checked)}
                />
                <span>Mostra tutti</span>
              </label>
            </div>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.id_allievo}
              onChange={(e) => cambia("id_allievo", e.target.value)}
              required
              disabled={!selectedTeacher && !showAllStudents}
            >
              <option value="">Seleziona allievo…</option>
              {allievi.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.cognome} {a.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data / Aula */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data *</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={form.data}
                onChange={(e) => cambia("data", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Aula *</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.aula}
                onChange={(e) => cambia("aula", e.target.value)}
                required
              >
                <option value="">Seleziona un'aula…</option>
                {aule.map((a) => (
                  <option key={a.id} value={a.nome}>{a.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Orari */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Inizio *</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_inizio}
                onChange={(e) => cambia("ora_inizio", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fine *</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_fine}
                onChange={(e) => cambia("ora_fine", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Ricorrenza */}
          <div className="border rounded-xl p-3 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span className="text-sm font-medium">Ricorrenza settimanale</span>
            </label>
            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fino al (incluso)</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border px-3 py-2"
                    value={untilDate}
                    onChange={(e) => setUntilDate(e.target.value)}
                    min={form.data || undefined}
                    required
                  />
                </div>
                <div className="text-xs text-gray-600 flex items-end">
                  {occurrences > 0
                    ? `Verranno create ${occurrences} lezioni.`
                    : "Seleziona una data di fine valida."}
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Motivazione (opz.)</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2"
              value={form.motivazione}
              onChange={(e) => cambia("motivazione", e.target.value)}
              placeholder="Es. lezione recupero…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            >
              {loading
                ? "Salvataggio…"
                : isRecurring
                ? "Crea ricorrenza"
                : "Crea lezione"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(body, document.body);
}
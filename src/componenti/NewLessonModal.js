import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.REACT_APP_API_URL;
const AULE_PREDEFINITE = ["Aula 1", "Aula 2", "Aula 3"];

export default function NewLessonModal({ open, onClose, onCreated }) {
  const [allievi, setAllievi] = useState([]);
  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: AULE_PREDEFINITE[0],
    id_allievo: "",
    motivazione: "",
  });

  // Ricorrenza settimanale
  const [isRecurring, setIsRecurring] = useState(false);
  const [untilDate, setUntilDate] = useState(""); // YYYY-MM-DD
  const [occurrences, setOccurrences] = useState(0); // preview conteggio

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const insegnanteId = useMemo(() => {
    try {
      const decoded = token ? jwtDecode(token) : null;
      return decoded?.id || decoded?.userId || null;
    } catch {
      return null;
    }
  }, [token]);

  // ---- util date safe (YYYY-MM-DD) ----
  const addDays = (ymd, days) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  const dateGte = (a, b) => a >= b; // string compare su YYYY-MM-DD

  function* weeklyGenerator(startYmd, endYmd) {
    // entrambe inclusive (end incluso)
    let cur = startYmd;
    while (dateGte(endYmd, cur)) {
      yield cur;
      cur = addDays(cur, 7);
    }
  }

  // Preview occorrenze per UI
  useEffect(() => {
    if (!isRecurring || !form.data || !untilDate) {
      setOccurrences(0);
      return;
    }
    if (untilDate < form.data) {
      setOccurrences(0);
      return;
    }
    let count = 0;
    for (const _ of weeklyGenerator(form.data, untilDate)) count++;
    setOccurrences(count);
  }, [isRecurring, form.data, untilDate]);

  // Carica allievi assegnati
  useEffect(() => {
    const fetchAllievi = async () => {
      if (!open || !insegnanteId || !token) return;
      setErrore(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/insegnanti/${insegnanteId}/allievi`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Errore nel recupero allievi assegnati");
        const data = await res.json();
        setAllievi(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrore(err.message);
      }
    };
    fetchAllievi();
  }, [open, insegnanteId, token]);

  const cambia = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const valida = () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine) {
      setErrore("Compila data e orari");
      return false;
    }
    if (!form.id_allievo) {
      setErrore("Seleziona un allievo");
      return false;
    }
    if (form.ora_fine <= form.ora_inizio) {
      setErrore("L'orario di fine deve essere successivo all'inizio");
      return false;
    }
    if (isRecurring) {
      if (!untilDate) {
        setErrore("Seleziona la data di fine ricorrenza");
        return false;
      }
      if (untilDate < form.data) {
        setErrore("La data di fine non può essere precedente alla data iniziale");
        return false;
      }
    }
    setErrore(null);
    return true;
  };

  const createOne = async (payload) => {
    const res = await fetch(`${BASE_URL}/api/lezioni`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      if (!BASE_URL) throw new Error("REACT_APP_API_URL non configurata");
      if (!insegnanteId) throw new Error("ID insegnante non disponibile");

      const basePayload = {
        id_insegnante: insegnanteId,
        id_allievo: Number(form.id_allievo),
        data: form.data, // YYYY-MM-DD
        ora_inizio: form.ora_inizio,
        ora_fine: form.ora_fine,
        aula: form.aula,
        motivazione: form.motivazione || null,
        stato: "svolta", // 👈 default richiesto
      };

      if (!isRecurring) {
        const created = await createOne(basePayload);
        onCreated && onCreated(created); // 👈 passa al genitore
        resetAndClose();
        return;
      }

      // Ricorrenza settimanale: ritorna array di create
      let ok = 0, ko = 0;
      const createdItems = [];
      for (const ymd of weeklyGenerator(form.data, untilDate)) {
        try {
          const c = await createOne({ ...basePayload, data: ymd });
          ok++; if (c) createdItems.push(c);
        } catch {
          ko++;
        }
      }
      onCreated && onCreated(createdItems); // 👈 array verso il genitore
      resetAndClose();
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setForm({
      data: "",
      ora_inizio: "",
      ora_fine: "",
      aula: AULE_PREDEFINITE[0],
      id_allievo: "",
      motivazione: "",
    });
    setIsRecurring(false);
    setUntilDate("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuova-lezione-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 id="nuova-lezione-title" className="text-lg font-semibold">
            Nuova lezione
          </h2>
          <button onClick={onClose} className="text-gray-500 text-xl">✕</button>
        </div>

        {errore && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {errore}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={form.data}
                onChange={(e) => cambia("data", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Aula</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.aula}
                onChange={(e) => cambia("aula", e.target.value)}
              >
                {AULE_PREDEFINITE.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora inizio</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_inizio}
                onChange={(e) => cambia("ora_inizio", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora fine</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_fine}
                onChange={(e) => cambia("ora_fine", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Allievo</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.id_allievo}
              onChange={(e) => cambia("id_allievo", e.target.value)}
              required
            >
              <option value="">Seleziona allievo…</option>
              {allievi.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.cognome} {a.nome}
                </option>
              ))}
            </select>
          </div>

          {/* RICORRENZA */}
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
                  <label className="block text-xs text-gray-600 mb-1">
                    Fino al (incluso)
                  </label>
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
                    ? `Verranno create ${occurrences} lezioni (ogni 7 giorni).`
                    : "Seleziona una data di fine valida."}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
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
}



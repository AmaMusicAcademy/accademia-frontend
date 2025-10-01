import React, { useEffect, useMemo, useState, useCallback } from "react";
import { apiFetch, getInsegnanteId } from "../utils/api";

const AULE_PREDEFINITE = ["Aula 1", "Aula 2", "Aula 3"];

// util date (YYYY-MM-DD)
const addDays = (ymd, days) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};
const dateGte = (a, b) => a >= b; // string compare
function* weeklyGenerator(startYmd, endYmd) {
  let cur = startYmd;
  while (dateGte(endYmd, cur)) {
    yield cur;
    cur = addDays(cur, 7);
  }
}

export default function NewLessonModal({ open, onClose, onCreated }) {
  const [allievi, setAllievi] = useState([]);
  const [aule, setAule] = useState(AULE_PREDEFINITE);
  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    id_allievo: "",
    motivazione: "",
  });

  // Ricorrenza settimanale
  const [isRecurring, setIsRecurring] = useState(false);
  const [untilDate, setUntilDate] = useState(""); // YYYY-MM-DD
  const [occurrences, setOccurrences] = useState(0); // preview conteggio

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  const insegnanteId = useMemo(() => getInsegnanteId(), []);

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

  const loadAllievi = useCallback(async () => {
    if (!open || !insegnanteId) return;
    setErrore(null);
    try {
      const data = await apiFetch(`/api/insegnanti/${insegnanteId}/allievi`);
      setAllievi(Array.isArray(data) ? data : []);
    } catch (err) {
      // se 401/403 probabilmente token scaduto: qui NON forziamo logout (lo farà il parent)
      setErrore(err.message || "Errore nel recupero allievi assegnati");
      setAllievi([]);
    }
  }, [open, insegnanteId]);

  const loadAule = useCallback(async () => {
  if (!open) return;
  try {
    const rows = await apiFetch(`/api/aule`);
    const list = Array.isArray(rows)
      ? rows.map(r => String(r?.nome || '').trim()).filter(Boolean)
      : [];
    // usa SOLO le aule del server (niente merge con le predefinite)
    if (list.length > 0) {
      setAule(list);
      // se l'aula selezionata non è più valida, seleziona la prima
      setForm(f => ({ ...f, aula: list.includes(f.aula) ? f.aula : list[0] }));
    } else {
      // fallback se il server risponde ma senza dati
      setAule(AULE_PREDEFINITE);
      setForm(f => ({ ...f, aula: AULE_PREDEFINITE[0] }));
    }
  } catch (err) {
    // 401/403 o errore qualsiasi → fallback predefinito
    setAule(AULE_PREDEFINITE);
    setForm(f => ({ ...f, aula: AULE_PREDEFINITE[0] }));
  }
}, [open]);

  // Carica allievi e aule quando il modal si apre
  useEffect(() => {
    if (!open) return;
    loadAllievi();
    loadAule();
  }, [open, loadAllievi, loadAule]);

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
    if (!form.aula) {
      setErrore("Seleziona un'aula");
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
    // usa apiFetch per avere Authorization automatico
    return await apiFetch(`/api/lezioni`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;

    setLoading(true);
    try {
      if (!insegnanteId) throw new Error("ID insegnante non disponibile");

      const basePayload = {
        id_insegnante: insegnanteId,              // 👈 docente vincolato al proprio id
        id_allievo: Number(form.id_allievo),
        data: form.data,                          // YYYY-MM-DD
        ora_inizio: form.ora_inizio,
        ora_fine: form.ora_fine,
        aula: form.aula,
        motivazione: form.motivazione || null,
        stato: "svolta",                          // default
      };

      if (!isRecurring) {
        const created = await createOne(basePayload);
        onCreated && onCreated(created);
        resetAndClose();
        return;
      }

      // Ricorrenza settimanale
      const createdItems = [];
      for (const ymd of weeklyGenerator(form.data, untilDate)) {
        try {
          const c = await createOne({ ...basePayload, data: ymd });
          if (c) createdItems.push(c);
        } catch {
          // silenzia singoli errori per continuare a creare le altre occorrenze
        }
      }
      onCreated && onCreated(createdItems);
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
      aula: (aule[0] || ""),
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
                required
              >
                {aule.map((a) => (
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



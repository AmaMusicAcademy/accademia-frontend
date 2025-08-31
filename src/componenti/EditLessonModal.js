import React, { useEffect, useState } from "react";

const BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Props:
 * - open: bool
 * - onClose(): void
 * - onSaved(updated): void
 * - lesson: { id, id_insegnante, id_allievo, data, ora_inizio, ora_fine, aula, motivazione, stato, riprogrammata, start, end }
 * - mode: "edit" | "reschedule"
 */
export default function EditLessonModal({ open, onClose, onSaved, lesson, mode = "edit" }) {
  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    motivazione: "",
  });
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    if (!open || !lesson) return;
    setErrore(null);
    setForm({
      data: (lesson.data && String(lesson.data).slice(0,10)) || (typeof lesson.start === "string" ? lesson.start.slice(0,10) : ""),
      ora_inizio: lesson.ora_inizio || (typeof lesson.start === "string" ? lesson.start.slice(11,16) : ""),
      ora_fine:   lesson.ora_fine   || (typeof lesson.end   === "string" ? lesson.end.slice(11,16)   : ""),
      aula: lesson.aula || "",
      motivazione: lesson.motivazione || "",
    });
  }, [open, lesson]);

  const cambia = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const valida = () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine) {
      setErrore("Compila data e orari");
      return false;
    }
    if (form.ora_fine <= form.ora_inizio) {
      setErrore("L'orario di fine deve essere successivo all'inizio");
      return false;
    }
    return true;
  };

  const buildPutBody = () => ({
    id_insegnante: Number(lesson.id_insegnante),
    id_allievo: Number(lesson.id_allievo),
    data: form.data,
    ora_inizio: form.ora_inizio,
    ora_fine: form.ora_fine,
    aula: form.aula,
    stato: mode === "reschedule" ? "rimandata" : (lesson.stato || "svolta"),
    motivazione: form.motivazione || "",
    riprogrammata: mode === "reschedule" ? true : Boolean(lesson.riprogrammata) || false,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;
    if (!lesson?.id) {
      setErrore("ID lezione non disponibile");
      return;
    }
    try {
      setErrore(null);
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token mancante");

      const payload = buildPutBody();

      const res = await fetch(`${BASE_URL}/api/lezioni/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Errore aggiornamento lezione (${res.status})`);
      }

      const updated = await res.json().catch(() => null);
      onSaved && onSaved(updated || { ...lesson, ...payload });
      onClose && onClose();
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {mode === "reschedule" ? "Riprogramma lezione" : "Modifica lezione"}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-xl">✕</button>
        </div>

        {errore && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{errore}</div>}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data</label>
              <input type="date" className="w-full rounded-lg border px-3 py-2"
                value={form.data} onChange={(e) => cambia("data", e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Aula</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2"
                value={form.aula} onChange={(e) => cambia("aula", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora inizio</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2"
                value={form.ora_inizio} onChange={(e) => cambia("ora_inizio", e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora fine</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2"
                value={form.ora_fine} onChange={(e) => cambia("ora_fine", e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Motivazione (opz.)</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2"
              value={form.motivazione} onChange={(e) => cambia("motivazione", e.target.value)} placeholder="Es. spostata per indisponibilità…" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Chiudi</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
              {loading ? "Salvataggio…" : (mode === "reschedule" ? "Salva nuova data" : "Salva modifiche")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



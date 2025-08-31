import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "https://app-docenti.onrender.com";

export default function EditLessonModal({ open, onClose, onSaved, lesson, mode = "edit" }) {
  const token = useMemo(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  }, []);

  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    motivazione: lesson?.motivazione || "",
    stato: (lesson?.stato || "svolta").toLowerCase()
  });
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!lesson) return;
    setErrore(null);
    const ymd = String(lesson.data || "").slice(0,10);
    setForm({
      data: ymd,
      ora_inizio: lesson.ora_inizio || "",
      ora_fine: lesson.ora_fine || "",
      aula: lesson.aula || "",
      motivazione: lesson.motivazione || "",
      stato: (lesson.stato || "svolta").toLowerCase()
    });
  }, [open, lesson]);

  const cambia = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const valida = () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine || !form.aula) {
      setErrore("Compila data, orari e aula.");
      return false;
    }
    if (form.ora_fine <= form.ora_inizio) {
      setErrore("L'orario di fine deve essere successivo all'inizio");
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;
    if (!lesson?.id) { setErrore("ID lezione mancante"); return; }
    if (!token) { setErrore("Token non presente"); return; }

    setErrore(null);
    setLoading(true);
    try {
      // Se sto RIPROGRAMMANDO: lo stato resta "rimandata" (il backend deciderà se marcarla riprogrammata in base al cambio orario/data/aula)
      const nextState = mode === "reschedule" ? "rimandata" : form.stato;

      const payload = {
        id_insegnante: Number(lesson.id_insegnante),
        id_allievo: Number(lesson.id_allievo),
        data: form.data,
        ora_inizio: form.ora_inizio,
        ora_fine: form.ora_fine,
        aula: form.aula,
        stato: nextState,
        motivazione: form.motivazione || "",
        // NON inviamo più riprogrammata: il backend la ricalcola se scheduleChanged
        // riprogrammata: nextState === "rimandata" ? true : false
      };

      const res = await fetch(`${API_BASE}/api/lezioni/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Errore aggiornamento (${res.status})`);
      }
      await res.json().catch(() => null);

      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
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
              <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.data} onChange={(e) => cambia("data", e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Aula</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2" value={form.aula} onChange={(e) => cambia("aula", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora inizio</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2" value={form.ora_inizio} onChange={(e) => cambia("ora_inizio", e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora fine</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2" value={form.ora_fine} onChange={(e) => cambia("ora_fine", e.target.value)} required />
            </div>
          </div>

          {mode !== "reschedule" && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Stato</label>
              <select className="w-full rounded-lg border px-3 py-2" value={form.stato} onChange={(e) => cambia("stato", e.target.value)}>
                <option value="svolta">svolta</option>
                <option value="rimandata">rimandata</option>
                <option value="annullata">annullata</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-1">Motivazione (opz.)</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2" value={form.motivazione} onChange={(e) => cambia("motivazione", e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Annulla</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
              {loading ? "Salvataggio…" : (mode === "reschedule" ? "Riprogramma" : "Salva")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



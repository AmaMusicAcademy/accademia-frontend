import React, { useEffect, useMemo, useState } from "react";

const BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Props:
 * - open: bool
 * - onClose(): void
 * - onSaved(updated): void
 * - lesson: { id, id_insegnante, id_allievo, data, ora_inizio, ora_fine, aula, motivazione, stato, riprogrammata, storico_programmazioni?: [{data,ora_inizio,ora_fine,aula,recorded_at}], start, end }
 * - mode: "edit" | "reschedule"
 */
export default function EditLessonModal({ open, onClose, onSaved, lesson, mode = "edit" }) {
  const [form, setForm] = useState({ data: "", ora_inizio: "", ora_fine: "", aula: "", motivazione: "" });
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);

  const history = useMemo(() => {
    const h = Array.isArray(lesson?.storico_programmazioni) ? lesson.storico_programmazioni : [];
    // ordina dal più recente (recorded_at) al più vecchio
    return [...h].sort((a, b) => String(b.recorded_at || "").localeCompare(String(a.recorded_at || "")));
  }, [lesson]);

  const ymd = (d) => (typeof d === "string" ? d.slice(0, 10) : "");
  const hhmm = (t) => (typeof t === "string" ? t.slice(0, 5) : "");

  const resolveLessonId = async (src) => {
    const token = localStorage.getItem("token");
    // tenta GET diretta
    if (src?.id != null) {
      const r = await fetch(`${BASE_URL}/api/lezioni/${src.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) return src.id;
      if (r.status !== 404) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `Errore lettura lezione (${r.status})`);
      }
    }
    // fallback per elenco insegnante
    const inz = Number(src.id_insegnante);
    const res = await fetch(`${BASE_URL}/api/insegnanti/${inz}/lezioni?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Errore nel recupero lezioni insegnante (${res.status})`);
    }
    const list = await res.json();
    const key = (o) =>
      [ymd(o.data) || ymd(src.start),
       o.ora_inizio || (typeof src.start === "string" ? src.start.slice(11, 16) : ""),
       o.ora_fine   || (typeof src.end   === "string" ? src.end.slice(11, 16)   : ""),
       String(o.id_allievo || ""),
       String(o.aula || "")]
        .join("|");
    const want = key(src);
    const found = (Array.isArray(list) ? list : []).find((x) => key(x) === want);
    if (!found?.id) throw new Error("Lezione equivalente non trovata sul server (ID irrilevabile)");
    return found.id;
  };

  useEffect(() => {
    if (!open || !lesson) return;
    setErrore(null);
    setForm({
      data: (lesson.data && String(lesson.data).slice(0, 10)) || (typeof lesson.start === "string" ? lesson.start.slice(0, 10) : ""),
      ora_inizio: lesson.ora_inizio || (typeof lesson.start === "string" ? lesson.start.slice(11, 16) : ""),
      ora_fine: lesson.ora_fine || (typeof lesson.end === "string" ? lesson.end.slice(11, 16) : ""),
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

  const buildPutBody = (src) => ({
    id_insegnante: Number(src.id_insegnante),
    id_allievo: Number(src.id_allievo),
    data: form.data,
    ora_inizio: form.ora_inizio,
    ora_fine: form.ora_fine,
    aula: form.aula,
    // 👇 se sto riprogrammando, lo stato DB resta "rimandata", ma per la UI risulterà "riprogrammata" (riprogrammata=true)
    stato: mode === "reschedule" ? "rimandata" : (src.stato || "svolta"),
    motivazione: form.motivazione || "",
    riprogrammata: mode === "reschedule" ? true : Boolean(src.riprogrammata) || false,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;
    if (!lesson?.id) {
      // ok, lo risolvo via fallback
    }
    try {
      setErrore(null);
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token mancante");

      const realId = await resolveLessonId(lesson);
      const payload = buildPutBody(lesson);

      const res = await fetch(`${BASE_URL}/api/lezioni/${realId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Errore aggiornamento lezione (${res.status})`);
      }

      const updated = await res.json().catch(() => null);
      onSaved && onSaved(updated || { ...lesson, id: realId, ...payload });
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

        {/* ⬇️ storico programmazioni */}
        {history.length > 0 && (
          <div className="mb-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2">
            <div className="font-medium mb-1">Storico programmazioni</div>
            <ul className="space-y-1 list-disc pl-4">
              {history.map((h, idx) => (
                <li key={idx}>
                  {h.data} {h.ora_inizio?.slice(0,5)}–{h.ora_fine?.slice(0,5)}
                  {h.aula ? ` (Aula ${h.aula})` : ""} {h.recorded_at ? `— spostata il ${new Date(h.recorded_at).toLocaleString("it-IT")}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errore && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{errore}</div>}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data</label>
              <input type="date" className="w-full rounded-lg border px-3 py-2"
                value={form.data} onChange={(e) => setForm(f => ({...f, data: e.target.value}))} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Aula</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2"
                value={form.aula} onChange={(e) => setForm(f => ({...f, aula: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora inizio</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2"
                value={form.ora_inizio} onChange={(e) => setForm(f => ({...f, ora_inizio: e.target.value}))} required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ora fine</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2"
                value={form.ora_fine} onChange={(e) => setForm(f => ({...f, ora_fine: e.target.value}))} required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Motivazione (opz.)</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2"
              value={form.motivazione} onChange={(e) => setForm(f => ({...f, motivazione: e.target.value}))}
              placeholder="Es. spostata per indisponibilità…" />
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




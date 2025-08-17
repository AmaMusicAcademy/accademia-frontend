import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.REACT_APP_API_URL;

// Puoi sostituire con la lista aule reale (o passare via prop)
const AULE_PREDEFINITE = ["Aula 1", "Aula 2", "Aula 3"];

export default function NewLessonModal({ open, onClose, onCreated }) {
  const [allievi, setAllievi] = useState([]);
  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: AULE_PREDEFINITE[0],
    id_allievo: "",
    motivazione: ""
  });
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

  // Carica allievi assegnati all'insegnante
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
        setAllievi(data || []);
      } catch (err) {
        setErrore(err.message);
      }
    };
    fetchAllievi();
  }, [open, insegnanteId, token]);

  const cambia = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const valida = () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine) {
      setErrore("Compila data e orari");
      return false;
    }
    if (!form.id_allievo) {
      setErrore("Seleziona un allievo");
      return false;
    }
    // controllo orari
    if (form.ora_fine <= form.ora_inizio) {
      setErrore("L'orario di fine deve essere successivo all'inizio");
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valida()) return;

    setErrore(null);
    setLoading(true);
    try {
      if (!BASE_URL) throw new Error("REACT_APP_API_URL non configurata");

      // Payload previsto dal tuo schema lezioni
      const payload = {
        id_insegnante: insegnanteId,
        id_allievo: Number(form.id_allievo),
        data: form.data,             // "YYYY-MM-DD"
        ora_inizio: form.ora_inizio, // "HH:MM"
        ora_fine: form.ora_fine,     // "HH:MM"
        aula: form.aula,
        motivazione: form.motivazione || null
      };

      // 🔸 Endpoint: suppongo esista POST /api/lezioni (adegua se diverso)
      const res = await fetch(`${BASE_URL}/api/lezioni`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        let msg = "Errore nella creazione della lezione";
        if (res.status === 404) msg += " (endpoint non presente sul server)";
        throw new Error(`${msg}${t ? `: ${t}` : ""}`);
      }

      // Lezione creata
      //if (onCreated) onCreated();

      const created = await res.json().catch(() => null);
      if (onCreated) onCreated(created); // 👈 notifica su successo
      onClose();
      // Reset form
      setForm({
        data: "",
        ora_inizio: "",
        ora_fine: "",
        aula: AULE_PREDEFINITE[0],
        id_allievo: "",
        motivazione: ""
      });
    } catch (err) {
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
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
          <div className="mb-3 text-sm text-red-600">{errore}</div>
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

          <div>
            <label className="block text-xs text-gray-600 mb-1">Motivazione (opzionale)</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2"
              value={form.motivazione}
              onChange={(e) => cambia("motivazione", e.target.value)}
              placeholder="Es. recupero, variazione orario…"
            />
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
              {loading ? "Salvataggio…" : "Crea lezione"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

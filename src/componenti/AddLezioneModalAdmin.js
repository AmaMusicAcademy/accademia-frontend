import React, { useEffect, useMemo, useState } from "react";

const BASE_URL = process.env.REACT_APP_API_URL;

function hhmm(n) { return n ? String(n).slice(0,5) : ""; }
function ymd(d)  { return d ? String(d).slice(0,10) : ""; }

export default function AddLezioneModalAdmin({ onClose, onCreated }) {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [insegnanti, setInsegnanti] = useState([]);
  const [allievi, setAllievi] = useState([]);

  const [form, setForm] = useState({
    id_insegnante: "",
    id_allievo: "",
    data: ymd(new Date()),
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    motivazione: "",
  });

  useEffect(() => {
    let abort = false;

    async function load() {
      try {
        if (!BASE_URL || !token) return;

        const [rIns, rAll] = await Promise.all([
          fetch(`${BASE_URL}/api/insegnanti`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE_URL}/api/allievi`,     { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (rIns.ok) {
          const js = await rIns.json();
          if (!abort) setInsegnanti(Array.isArray(js) ? js : []);
        }
        if (rAll.ok) {
          const js = await rAll.json();
          if (!abort) setAllievi(Array.isArray(js) ? js : []);
        }
      } catch {
        if (!abort) { setInsegnanti([]); setAllievi([]); }
      }
    }

    load();
    return () => { abort = true; };
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (!form.id_insegnante) {
        alert("Seleziona un insegnante");
        return;
      }
      if (!form.id_allievo) {
        alert("Seleziona un allievo");
        return;
      }
      if (!form.data || !form.ora_inizio || !form.ora_fine) {
        alert("Compila data e orario");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/lezioni`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_insegnante: Number(form.id_insegnante),
          id_allievo: Number(form.id_allievo),
          data: form.data,
          ora_inizio: form.ora_inizio,
          ora_fine: form.ora_fine,
          aula: form.aula || null,
          motivazione: form.motivazione || null,
          stato: "svolta",          // default sistema (puoi cambiare in "svolta" o "rimandata" se serve)
          riprogrammata: false,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Errore creazione lezione");
      }

      onCreated && onCreated();
    } catch (err) {
      alert(err.message || "Errore inatteso");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">Nuova lezione</div>
          <button onClick={onClose} className="text-gray-500">Chiudi</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Insegnante */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Insegnante</label>
            <select
              value={form.id_insegnante}
              onChange={(e)=>setForm(f=>({ ...f, id_insegnante: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">— Seleziona —</option>
              {insegnanti.map(i=>(
                <option key={i.id} value={i.id}>
                  {i.cognome ? `${i.cognome} ${i.nome}` : `${i.nome} ${i.cognome || ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Allievo */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Allievo</label>
            <select
              value={form.id_allievo}
              onChange={(e)=>setForm(f=>({ ...f, id_allievo: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">— Seleziona —</option>
              {allievi.map(a=>(
                <option key={a.id} value={a.id}>
                  {a.cognome ? `${a.cognome} ${a.nome}` : `${a.nome} ${a.cognome || ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Data & orari */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={form.data}
                onChange={(e)=>setForm(f=>({ ...f, data: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Inizio</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2"
                value={form.ora_inizio}
                onChange={(e)=>setForm(f=>({ ...f, ora_inizio: hhmm(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fine</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2"
                value={form.ora_fine}
                onChange={(e)=>setForm(f=>({ ...f, ora_fine: hhmm(e.target.value) }))}
                required
              />
            </div>
          </div>

          {/* Aula */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Aula</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={form.aula}
              onChange={(e)=>setForm(f=>({ ...f, aula: e.target.value }))}
              placeholder="Es. A1 / Piano Terra"
            />
          </div>

          {/* Motivazione (opzionale) */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Note / Motivazione</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              value={form.motivazione}
              onChange={(e)=>setForm(f=>({ ...f, motivazione: e.target.value }))}
              placeholder="Opzionale"
            />
          </div>

          <button className="w-full bg-black text-white rounded-lg py-2">
            Salva lezione
          </button>
        </form>
      </div>
    </div>
  );
}
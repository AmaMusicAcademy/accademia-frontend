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
  const [gruppi, setGruppi]   = useState([]);
  const [tipoLezione, setTipoLezione] = useState('individuale'); // 'individuale' | 'collettiva'
  const [aule, setAule] = useState(AULE_PREDEFINITE);
  const [form, setForm] = useState({
    data: "",
    ora_inizio: "",
    ora_fine: "",
    aula: "",
    id_allievo: "",
    gruppo_id: "",
    motivazione: "",
  });

  // Ricorrenza settimanale
  const [isRecurring, setIsRecurring] = useState(false);
  const [untilDate, setUntilDate] = useState(""); // YYYY-MM-DD
  const [occurrences, setOccurrences] = useState(0); // preview conteggio

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);
  const [conflittoAula, setConflittoAula] = useState(null);
  const [checkingAula, setCheckingAula] = useState(false);
  const [auleConId, setAuleConId] = useState([]); // [{id, nome}]
  const [giorniChiusura, setGiorniChiusura] = useState(new Set()); // Set di YYYY-MM-DD
  const [riepilogoRicorrenza, setRiepilogoRicorrenza] = useState(null); // {create, saltate, senzaAula}

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
    for (const ymd of weeklyGenerator(form.data, untilDate)) {
      if (!giorniChiusura.has(ymd)) count++;
    }
    setOccurrences(count);
  }, [isRecurring, form.data, untilDate, giorniChiusura]);

  const loadAllievi = useCallback(async () => {
    if (!open || !insegnanteId) return;
    setErrore(null);
    try {
      const [all, grp] = await Promise.all([
        apiFetch(`/api/insegnanti/${insegnanteId}/allievi`),
        apiFetch('/api/gruppi'),
      ]);
      setAllievi(Array.isArray(all) ? all : []);
      const idNum = parseInt(insegnanteId, 10);
      setGruppi((Array.isArray(grp) ? grp : []).filter(g => g.insegnante_id === idNum));
    } catch (err) {
      setErrore(err.message || "Errore nel recupero allievi assegnati");
      setAllievi([]);
    }
  }, [open, insegnanteId]);

  const loadAule = useCallback(async () => {
    if (!open) return;
    try {
      const rows = await apiFetch(`/api/aule`);
      const objList = Array.isArray(rows) ? rows.filter((r) => r?.nome) : [];
      setAuleConId(objList);
      const list = objList.map((r) => String(r.nome).trim()).filter(Boolean);
      if (list.length > 0) {
        setAule(list);
        setForm((f) => ({ ...f, aula: list.includes(f.aula) ? f.aula : list[0] }));
      } else {
        setAule(AULE_PREDEFINITE);
        setForm((f) => ({ ...f, aula: AULE_PREDEFINITE[0] }));
      }
    } catch {
      setAule(AULE_PREDEFINITE);
      setForm((f) => ({ ...f, aula: AULE_PREDEFINITE[0] }));
    }
  }, [open]);

  // Carica allievi, aule e giorni di chiusura quando il modal si apre
  useEffect(() => {
    if (!open) return;
    loadAllievi();
    loadAule();
    apiFetch('/api/giorni-chiusura')
      .then(rows => setGiorniChiusura(new Set((rows || []).map(r => r.data))))
      .catch(() => {});
  }, [open, loadAllievi, loadAule]);

  // Conflict detection aula in tempo reale
  useEffect(() => {
    const { data, ora_inizio, ora_fine, aula } = form;
    if (!data || !ora_inizio || !ora_fine || !aula || ora_fine <= ora_inizio) {
      setConflittoAula(null);
      return;
    }
    const aulaObj = auleConId.find((a) => a.nome === aula);
    if (!aulaObj) { setConflittoAula(null); return; }

    let cancelled = false;
    setCheckingAula(true);
    apiFetch(`/api/aule/${aulaObj.id}/disponibilita?data=${data}`)
      .then((res) => {
        if (cancelled) return;
        const occupate = (res.lezioni || []).filter(
          (l) => l.ora_inizio < ora_fine && l.ora_fine > ora_inizio
        );
        setConflittoAula(occupate.length > 0 ? occupate : null);
      })
      .catch(() => setConflittoAula(null))
      .finally(() => { if (!cancelled) setCheckingAula(false); });

    return () => { cancelled = true; };
  }, [form.data, form.ora_inizio, form.ora_fine, form.aula, auleConId]);

  const cambia = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const valida = () => {
    if (!form.data || !form.ora_inizio || !form.ora_fine) {
      setErrore("Compila data e orari");
      return false;
    }
    if (tipoLezione === 'individuale' && !form.id_allievo) {
      setErrore("Seleziona un allievo");
      return false;
    }
    if (tipoLezione === 'collettiva' && !form.gruppo_id) {
      setErrore("Seleziona un gruppo");
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

      const basePayload = tipoLezione === 'collettiva'
        ? {
            id_insegnante: insegnanteId,
            gruppo_id: Number(form.gruppo_id),
            data: form.data,
            ora_inizio: form.ora_inizio,
            ora_fine: form.ora_fine,
            aula: form.aula,
            motivazione: form.motivazione || null,
            stato: "appuntamentata",
          }
        : {
            id_insegnante: insegnanteId,
            id_allievo: Number(form.id_allievo),
            data: form.data,
            ora_inizio: form.ora_inizio,
            ora_fine: form.ora_fine,
            aula: form.aula,
            motivazione: form.motivazione || null,
            stato: "appuntamentata",
          };

      if (!isRecurring) {
        const created = await createOne(basePayload);
        onCreated && onCreated(created);
        resetAndClose();
        return;
      }

      // Ricorrenza settimanale
      const createdItems = [];
      let saltate = 0;
      let senzaAula = 0;

      for (const ymd of weeklyGenerator(form.data, untilDate)) {
        // Salta giorni di chiusura
        if (giorniChiusura.has(ymd)) { saltate++; continue; }

        // Controlla disponibilità aula per questa data
        let aulaOk = true;
        if (form.aula) {
          try {
            const aulaObj = auleConId.find(a => a.nome === form.aula);
            if (aulaObj) {
              const disp = await apiFetch(`/api/aule/${aulaObj.id}/disponibilita?data=${ymd}`);
              const occupate = (disp.lezioni || []).filter(
                l => l.ora_inizio < form.ora_fine && l.ora_fine > form.ora_inizio
              );
              if (occupate.length > 0) aulaOk = false;
            }
          } catch { /* se la verifica fallisce proviamo comunque */ }
        }

        try {
          const payload = aulaOk
            ? { ...basePayload, data: ymd }
            : { ...basePayload, data: ymd, aula: null, motivazione: 'Aula non disponibile - da assegnare' };
          const c = await createOne(payload);
          if (c) { createdItems.push(c); if (!aulaOk) senzaAula++; }
        } catch { /* continua con le altre */ }
      }

      setRiepilogoRicorrenza({ create: createdItems.length, saltate, senzaAula });
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
      gruppo_id: "",
      motivazione: "",
    });
    setTipoLezione('individuale');
    setIsRecurring(false);
    setUntilDate("");
    setConflittoAula(null);
    setRiepilogoRicorrenza(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuova-lezione-title"
    >
      <div className="relative z-[10000] bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 m-4">
        <div className="flex items-center justify-between mb-3">
          <h2 id="nuova-lezione-title" className="text-lg font-semibold">
            Nuova lezione
          </h2>
          <button onClick={onClose} className="text-n-600 text-xl">✕</button>
        </div>

        {errore && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {errore}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-n-600 mb-1">Data</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={form.data}
                onChange={(e) => cambia("data", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-n-600 mb-1">Aula</label>
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
              <label className="block text-xs text-n-600 mb-1">Ora inizio</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_inizio}
                onChange={(e) => cambia("ora_inizio", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-n-600 mb-1">Ora fine</label>
              <input
                type="time"
                className="w-full rounded-lg border px-3 py-2"
                value={form.ora_fine}
                onChange={(e) => cambia("ora_fine", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Banner conflitto aula */}
          {checkingAula && (
            <div className="text-xs text-n-300 flex items-center gap-1 -mt-1">
              <span className="inline-block w-3 h-3 border-2 border-n-300 border-t-transparent rounded-full animate-spin" />
              Verifica disponibilità aula…
            </div>
          )}
          {!checkingAula && conflittoAula && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 -mt-1">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                ⚠️ Aula già occupata in questo orario
              </p>
              {conflittoAula.map((l, i) => (
                <p key={i} className="text-xs text-amber-600">
                  {String(l.ora_inizio).slice(0,5)}–{String(l.ora_fine).slice(0,5)}
                  {l.nome_insegnante ? ` · ${l.nome_insegnante} ${l.cognome_insegnante}` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Tipo lezione */}
          <div className="flex bg-n-100 rounded-xl p-1">
            {[
              { id: 'individuale', label: 'Individuale' },
              { id: 'collettiva',  label: 'Collettiva' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTipoLezione(id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipoLezione === id ? 'bg-white text-ama-500 shadow-sm' : 'text-n-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tipoLezione === 'individuale' ? (
            <div>
              <label className="block text-xs text-n-600 mb-1">Allievo</label>
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
          ) : (
            <div>
              <label className="block text-xs text-n-600 mb-1">Gruppo</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.gruppo_id}
                onChange={(e) => cambia("gruppo_id", e.target.value)}
                required
              >
                <option value="">Seleziona gruppo…</option>
                {gruppi.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.num_allievi} partecipanti)
                  </option>
                ))}
              </select>
              {gruppi.length === 0 && (
                <p className="text-xs text-n-300 mt-1">Nessun gruppo assegnato.</p>
              )}
            </div>
          )}

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
                  <label className="block text-xs text-n-600 mb-1">
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
                <div className="text-xs text-n-600 flex items-end">
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
              className="px-4 py-2 rounded-lg bg-ama-500 text-white disabled:opacity-50"
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



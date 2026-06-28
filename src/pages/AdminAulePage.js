import React, { useEffect, useState, useMemo } from "react";
import BottomNavAdmin from "../componenti/BottomNavAdmin";
import PageHeader from "../componenti/PageHeader";

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

export default function AdminAulePage() {
  const token = getToken();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // {id, nome} | null
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("elenco"); // "elenco" | "occupazione"
  const [occData, setOccData] = useState({}); // { aulaId: [lezioni] }
  const [occLoading, setOccLoading] = useState(false);
  const [occDate, setOccDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  const loadOccupazione = async (date, aulaList) => {
    if (!aulaList || aulaList.length === 0) return;
    setOccLoading(true);
    try {
      const results = await Promise.all(
        aulaList.map((a) =>
          fetchJSON(`${API_BASE}/api/aule/${a.id}/disponibilita?data=${date}`, token)
            .then((r) => ({ id: a.id, lezioni: r.lezioni || [] }))
            .catch(() => ({ id: a.id, lezioni: [] }))
        )
      );
      const map = {};
      results.forEach(({ id, lezioni }) => { map[id] = lezioni; });
      setOccData(map);
    } finally {
      setOccLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setNome(""); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setNome(a.nome || ""); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setNome(""); setSaving(false); setErr(null); };

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await fetchJSON(`${API_BASE}/api/aule`, token);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Errore di caricamento aule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(a => (a.nome || "").toLowerCase().includes(q));
  }, [list, search]);

  const onSave = async () => {
    const trimmed = nome.trim();
    if (!trimmed) {
      alert("Inserisci un nome aula.");
      return;
    }
    try {
      setSaving(true);
      setErr(null);

      if (editing) {
        await fetchJSON(`${API_BASE}/api/aule/${editing.id}`, token, {
          method: "PUT",
          body: JSON.stringify({ nome: trimmed }),
        });
      } else {
        await fetchJSON(`${API_BASE}/api/aule`, token, {
          method: "POST",
          body: JSON.stringify({ nome: trimmed }),
        });
      }

      closeModal();
      await load();
    } catch (e) {
      setSaving(false);
      const msg = e.message || "Errore salvataggio aula";
      if (msg.includes("409")) {
        setErr("Esiste già un'aula con questo nome.");
      } else {
        setErr(msg);
      }
    }
  };

  const onDelete = async (a) => {
    if (!window.confirm(`Eliminare l'aula "${a.nome}"?`)) return;
    try {
      await fetchJSON(`${API_BASE}/api/aule/${a.id}`, token, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e.message || "Errore nella cancellazione");
    }
  };

  return (
    <div className="min-h-screen bg-n-50 pb-16">
      <div className="sticky top-0 z-10 bg-white border-b">
        <PageHeader title="Aule" backTo="/admin" />
        {/* Tabs */}
        <div className="max-w-xl mx-auto px-4 flex gap-0 border-t">
          {[
            { id: 'elenco',      label: 'Elenco' },
            { id: 'occupazione', label: 'Occupazione' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                if (id === 'occupazione' && list.length > 0) loadOccupazione(occDate, list);
              }}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-blue-600 text-ama-500' : 'border-transparent text-n-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-3">
        {tab === 'elenco' && (
          <>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca aula…"
                className="flex-1 rounded-xl border px-4 py-2 text-sm"
              />
              <button type="button" className="px-3 py-2 rounded-xl bg-ama-500 text-white" onClick={openAdd}>
                + Aula
              </button>
            </div>

            {loading && (
              <div className="mt-4 space-y-2">
                <Skeleton h="48px" />
                <Skeleton h="48px" />
              </div>
            )}

            {!loading && (
              <div className="mt-4 rounded-xl border bg-white divide-y">
                {filtered.length === 0 ? (
                  <div className="p-4 text-sm text-n-600">Nessuna aula trovata.</div>
                ) : filtered.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2">
                    <div className="text-sm font-medium">{a.nome}</div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 rounded border bg-white" onClick={() => openEdit(a)}>Modifica</button>
                      <button className="text-xs px-2 py-1 rounded bg-red-600 text-white" onClick={() => onDelete(a)}>Elimina</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'occupazione' && (
          <>
            {/* Selettore data */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="date"
                value={occDate}
                onChange={(e) => {
                  setOccDate(e.target.value);
                  if (list.length > 0) loadOccupazione(e.target.value, list);
                }}
                className="flex-1 border rounded-xl px-3 py-2 text-sm"
              />
              <button
                className="px-3 py-2 rounded-xl bg-ama-500 text-white text-sm"
                onClick={() => loadOccupazione(occDate, list)}
              >
                Aggiorna
              </button>
            </div>

            {occLoading && (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!occLoading && list.map((a) => {
              const lezioni = occData[a.id] || [];
              return (
                <div key={a.id} className="mb-4 bg-white rounded-xl border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-n-50 border-b">
                    <span className="font-semibold text-sm">{a.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      lezioni.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {lezioni.length > 0 ? `${lezioni.length} lezione/i` : 'Libera'}
                    </span>
                  </div>
                  {lezioni.length > 0 && (
                    <div className="divide-y">
                      {lezioni.map((l) => (
                        <div key={l.id} className="px-4 py-2 flex items-center gap-3">
                          <span className="text-sm font-mono text-n-600 shrink-0">
                            {String(l.ora_inizio).slice(0,5)}–{String(l.ora_fine).slice(0,5)}
                          </span>
                          <span className="text-sm text-n-900 flex-1 truncate">
                            {l.nome_allievo} {l.cognome_allievo}
                          </span>
                          <span className="text-xs text-n-300 truncate">
                            {l.nome_insegnante} {l.cognome_insegnante}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modale add/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow">
            <div className="text-base font-semibold mb-2">
              {editing ? "Modifica aula" : "Nuova aula"}
            </div>

            {err && (
              <div className="mb-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
                {err}
              </div>
            )}

            <label className="block text-xs text-n-600 mb-1">Nome aula</label>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Aula 1"
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border bg-white" onClick={closeModal}>
                Annulla
              </button>
              <button
                className="px-3 py-2 rounded bg-ama-500 text-white disabled:opacity-50"
                onClick={onSave}
                disabled={saving || !nome.trim()}
              >
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin onAdd={openAdd} />
    </div>
  );
}

function Skeleton({ h = "48px" }) {
  return <div className="animate-pulse rounded-xl bg-gray-200" style={{ height: h }} />;
}

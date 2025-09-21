import React, { useEffect, useState, useMemo } from "react";
import BottomNavAdmin from "../componenti/BottomNavAdmin";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  "https://app-docenti.onrender.com";

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
        setErr("Esiste già un’aula con questo nome.");
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
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold">Aule</h1>
          <p className="text-sm text-gray-500">Gestisci l’elenco delle aule</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-3">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca aula…"
            className="flex-1 rounded-xl border px-4 py-2 text-sm"
          />
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white"
            onClick={openAdd}
            title="Nuova aula"
          >
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
              <div className="p-4 text-sm text-gray-500">Nessuna aula trovata.</div>
            ) : filtered.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2">
                <div className="text-sm font-medium">{a.nome}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs px-2 py-1 rounded border bg-white"
                    onClick={() => openEdit(a)}
                    title="Modifica"
                  >
                    Modifica
                  </button>
                  <button
                    className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                    onClick={() => onDelete(a)}
                    title="Elimina"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
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

            <label className="block text-xs text-gray-600 mb-1">Nome aula</label>
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
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
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

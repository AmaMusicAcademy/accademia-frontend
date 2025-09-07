import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
function parseEuroToNumber(v) {
  if (v == null) return 0;
  const s = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number(s);
  return Number.isFinite(num) ? num : 0;
}
function formatNumberToEuro(n) {
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n ?? 0);
  } catch {
    return `${Number(n || 0).toFixed(2)} €`;
  }
}

export default function AllievoEditPage() {
  const token = getToken();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    quota_mensile: "",      // stringa editabile
    data_iscrizione: "",    // YYYY-MM-DD
  });

  // carica dati allievo
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!token) throw new Error("Token non presente. Esegui il login.");
        setLoading(true);
        setErr(null);

        const data = await fetchJSON(`${API_BASE}/api/allievi/${id}`, token);
        if (cancel) return;

        setForm({
          nome: data?.nome || "",
          cognome: data?.cognome || "",
          email: data?.email || "",
          telefono: data?.telefono || "",
          quota_mensile: data?.quota_mensile != null ? String(data.quota_mensile) : "",
          data_iscrizione: (data?.data_iscrizione || "").slice(0,10),
        });
      } catch (e) {
        if (!cancel) setErr(e.message || "Errore di caricamento.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id, token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = useMemo(() => {
    const errors = {};
    if (!form.nome.trim()) errors.nome = "Obbligatorio";
    if (!form.cognome.trim()) errors.cognome = "Obbligatorio";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email non valida";
    if (form.telefono && !/^[0-9 +().-]{6,}$/.test(form.telefono)) errors.telefono = "Telefono non valido";
    if (form.data_iscrizione && !/^\d{4}-\d{2}-\d{2}$/.test(form.data_iscrizione)) errors.data_iscrizione = "Data non valida";
    const quota = parseEuroToNumber(form.quota_mensile);
    if (quota < 0) errors.quota_mensile = "Importo non valido";
    return errors;
  }, [form]);

  const hasErrors = Object.keys(validate).length > 0;

  const onSave = async (e) => {
    e.preventDefault();
    setOkMsg("");
    if (hasErrors) return;

    try {
      setSaving(true);
      setErr(null);

      const payload = {
        nome: form.nome.trim(),
        cognome: form.cognome.trim(),
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        quota_mensile: parseEuroToNumber(form.quota_mensile),
        data_iscrizione: form.data_iscrizione || null,
      };

      await fetchJSON(`${API_BASE}/api/allievi/${id}`, token, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setOkMsg("Dati salvati con successo.");
      // torna alla scheda allievo
      setTimeout(() => navigate(`/admin/allievi/${id}`), 600);
    } catch (e) {
      setErr(e.message || "Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header stile iOS */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="text-blue-600 text-sm" onClick={() => navigate(-1)}>&lt; Indietro</button>
          <div className="text-base font-semibold">Modifica allievo</div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton h="40px" />
            <Skeleton h="40px" />
            <Skeleton h="40px" />
            <Skeleton h="40px" />
            <Skeleton h="40px" />
            <Skeleton h="40px" />
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-4">
            {err && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
            )}
            {okMsg && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{okMsg}</div>
            )}

            <Field label="Nome" error={validate.nome}>
              <input
                name="nome"
                value={form.nome}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                required
              />
            </Field>

            <Field label="Cognome" error={validate.cognome}>
              <input
                name="cognome"
                value={form.cognome}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                required
              />
            </Field>

            <Field label="E-mail" error={validate.email}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="es. nome@dominio.it"
              />
            </Field>

            <Field label="Telefono" error={validate.telefono}>
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="+39 ..."
              />
            </Field>

            <Field label="Quota mensile" error={validate.quota_mensile}>
              <input
                name="quota_mensile"
                value={form.quota_mensile}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="es. 70,00"
                inputMode="decimal"
              />
              <div className="text-xs text-gray-500 mt-1">
                Valore corrente: <b>{formatNumberToEuro(parseEuroToNumber(form.quota_mensile))}</b>
              </div>
            </Field>

            <Field label="Data iscrizione" error={validate.data_iscrizione}>
              <input
                name="data_iscrizione"
                type="date"
                value={form.data_iscrizione}
                onChange={onChange}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </Field>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border bg-white"
                onClick={() => navigate(-1)}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving || hasErrors}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                title={hasErrors ? "Controlla i campi" : "Salva"}
              >
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </form>
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
function Skeleton({ h = "40px" }) {
  return <div className="animate-pulse rounded-xl bg-gray-200" style={{ height: h }} />;
}
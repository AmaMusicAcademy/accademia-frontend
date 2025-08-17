import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE_URL = process.env.REACT_APP_API_URL;

function getPrevMonthYYYYMM(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function euro(n) {
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n ?? 0);
  } catch {
    return `${Number(n || 0).toFixed(2)} €`;
  }
}

function hhmmDiff(start, end) {
  // start/end: "HH:MM[:SS]"
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
}

// "YYYY-MM-DD" helper
const dateStr = (d) => (d ? String(d).slice(0, 10) : "");

export default function CompensoInsegnante({ insegnanteId }) {
  const navigate = useNavigate();
  const [mese, setMese] = useState(getPrevMonthYYYYMM());
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);
  const [dati, setDati] = useState(null);
  const [lezioniDettaglio, setLezioniDettaglio] = useState([]); // 👈 per il PDF

  const token = useMemo(() => localStorage.getItem("token"), []);

  const doLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("utente");
    navigate("/login");
  }, [navigate]);

  const calcola = useCallback(async () => {
    try {
      setErrore(null);
      setLoading(true);

      if (!BASE_URL) throw new Error("Config mancante: REACT_APP_API_URL");
      if (!token) throw new Error("Sessione scaduta, effettua nuovamente il login");
      if (!insegnanteId) throw new Error("ID insegnante non disponibile");

      // 1) Riepilogo (tuo endpoint)
      const urlCompenso = `${BASE_URL}/api/insegnanti/${insegnanteId}/compenso?mese=${mese}`;
      const resCompenso = await fetch(urlCompenso, { headers: { Authorization: `Bearer ${token}` } });

      if (resCompenso.status === 401 || resCompenso.status === 403) {
        doLogout();
        return;
      }
      if (!resCompenso.ok) {
        const t = await resCompenso.text().catch(() => "");
        throw new Error(t || "Errore nel calcolo del rimborso");
      }
      const json = await resCompenso.json();
      setDati(json);

      // 2) Dettaglio lezioni (per PDF): scarico tutto e filtro come da regole del backend
      const urlLezioni = `${BASE_URL}/api/insegnanti/${insegnanteId}/lezioni`;
      const resLez = await fetch(urlLezioni, { headers: { Authorization: `Bearer ${token}` } });
      if (resLez.status === 401 || resLez.status === 403) {
        doLogout();
        return;
      }
      if (!resLez.ok) throw new Error("Errore nel recupero lezioni");

      const lezRaw = await resLez.json();

      // Mese selezionato
      const [yy, mm] = mese.split("-").map(Number);

      const filtrate = (Array.isArray(lezRaw) ? lezRaw : [])
        .filter((l) => {
          // contano: svolta, annullata, rimandata(riprogrammata = true)
          const flagged =
            l.stato === "svolta" ||
            l.stato === "annullata" ||
            (l.stato === "rimandata" && l.riprogrammata === true);

          // stesso mese della data ORIGINALE (regola rimborso)
          const d = dateStr(l.data);
          if (!d) return false;
          const y = Number(d.slice(0, 4));
          const m = Number(d.slice(5, 7));
          return flagged && y === yy && m === mm;
        })
        .map((l) => {
          const d = dateStr(l.data);
          const ore = hhmmDiff(l.ora_inizio, l.ora_fine);
          return {
            data: d,                                    // "YYYY-MM-DD"
            orario: `${l.ora_inizio?.slice(0,5)}–${l.ora_fine?.slice(0,5)}`,
            allievo: `${l.cognome_allievo || ""} ${l.nome_allievo || ""}`.trim() || "Allievo",
            aula: l.aula || "-",
            stato: l.stato,
            ore: Number(ore.toFixed(2)),
          };
        })
        // ordine per data, poi ora_inizio
        .sort((a, b) => (a.data + a.orario).localeCompare(b.data + b.orario));

      setLezioniDettaglio(filtrate);
    } catch (err) {
      setDati(null);
      setLezioniDettaglio([]);
      setErrore(err.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }, [mese, insegnanteId, token, doLogout]);

  useEffect(() => {
    calcola();
  }, [calcola]);

  // 👉 Esporta PDF
  const exportPdf = () => {
    if (!dati) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Titolo
    doc.setFontSize(16);
    doc.text(`Riepilogo compenso insegnante — ${dati.mese}`, 40, 40);

    // Box riepilogo
    doc.setFontSize(11);
    const riepilogo = [
      [`Lezioni pagate`, String(dati.lezioniPagate ?? 0)],
      [`Ore totali`, String(Number(dati.oreTotali || 0).toFixed(2))],
      [`Compenso`, euro(dati.compenso)],
    ];
    // @ts-ignore
     autoTable(doc, {
   startY: 60,
   head: [['Voce', 'Valore']],
   body: riepilogo,
   styles: { fontSize: 10, cellPadding: 6 },
   theme: 'striped',
   headStyles: { fillColor: [0, 122, 255] },
   margin: { left: 40, right: 40 },
});

    // Tabella lezioni conteggiate
    const body = lezioniDettaglio.map((r) => [
      r.data,
      r.orario,
      r.allievo,
      r.aula,
      r.stato,
      r.ore.toFixed(2),
    ]);
    const startY = (doc.lastAutoTable?.finalY || 60) + 20;

    // @ts-ignore
    autoTable(doc, {
   startY,
   head: [['Data', 'Orario', 'Allievo', 'Aula', 'Stato', 'Ore']],
   body,
   styles: { fontSize: 9, cellPadding: 5 },
   theme: 'grid',
   headStyles: { fillColor: [0, 122, 255] },
   margin: { left: 40, right: 40 },
   didDrawPage: (data) => {
     const page = doc.internal.getNumberOfPages();
     doc.setFontSize(8);
     doc.text(`Pagina ${page}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
   },
});

    doc.save(`compenso_${dati.mese}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Filtro mese */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-xs text-gray-600 mb-1">Mese di competenza</label>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={mese}
            onChange={(e) => setMese(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={calcola}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Calcolo..." : "Calcola"}
          </button>

          {/* 👇 Bottone Esporta PDF */}
          <button
            onClick={exportPdf}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
            disabled={loading || !dati}
            title="Esporta PDF con riepilogo e lezioni conteggiate"
          >
            Esporta PDF
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Le lezioni <span className="font-medium">svolte</span> e <span className="font-medium">annullate</span> sono pagate.
          Le <span className="font-medium">rimandate</span> sono pagate nel <span className="font-medium">mese originale</span>.
        </p>
      </div>

      {/* Errori */}
      {errore && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          {errore}
        </div>
      )}

      {/* Riepilogo */}
      {dati && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-2">Riepilogo {dati.mese}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Lezioni pagate</div>
                <div className="text-lg font-bold">{dati.lezioniPagate}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Ore totali</div>
                <div className="text-lg font-bold">{Number(dati.oreTotali || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <div className="text-gray-500">Compenso</div>
                <div className="text-xl font-extrabold">{euro(dati.compenso)}</div>
              </div>
            </div>
          </div>

          {/* Nota logica */}
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600">
            Elenco lezioni conteggiate nel PDF: <b>svolte</b>, <b>annullate</b>, e <b>rimandate riprogrammate</b> nel mese selezionato.
          </div>
        </>
      )}
    </div>
  );
}

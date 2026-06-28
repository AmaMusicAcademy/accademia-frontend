import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, FileText, CalendarDays, Clock, MapPin, Euro } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../utils/api';

// ── utils ──────────────────────────────────────────────────────────────────
const euro = (n) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const MESI_IT = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre',
];

const nomeMese = (yyyymm) => {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-');
  return `${MESI_IT[+m - 1]} ${y}`;
};

const fmtData = (d) => {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return new Date(Date.UTC(+y, +m - 1, +dd)).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short',
  });
};

function getPrevMonthYYYYMM() {
  const d = new Date();
  const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  const m = d.getMonth() === 0 ? 12 : d.getMonth();
  return `${y}-${String(m).padStart(2, '0')}`;
}

// ── export Excel ──────────────────────────────────────────────────────────
function exportExcel(dati) {
  const rows = dati.lezioni.map((l) => ({
    Data: l.data,
    'Inizio': l.ora_inizio,
    'Fine': l.ora_fine,
    Allievo: l.allievo,
    Aula: l.aula,
    'Ore': l.ore,
    'Compenso (€)': l.compenso,
  }));

  // riga totali
  rows.push({
    Data: '',
    Inizio: '',
    Fine: '',
    Allievo: 'TOTALE',
    Aula: '',
    Ore: dati.oreTotali,
    'Compenso (€)': dati.compensoTotale,
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [10,8,8,22,10,6,12].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeMese(dati.mese));
  XLSX.writeFile(wb, `rimborso_${dati.mese}.xlsx`);
}

// ── export PDF ────────────────────────────────────────────────────────────
function exportPdf(dati) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const titolo = `Rimborso ${nomeMese(dati.mese)}`;

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(titolo, 40, 44);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Tariffa: ${euro(dati.tariffaOraria)}/ora  ·  Lezioni svolte: ${dati.lezioniSvolte}  ·  Ore totali: ${dati.oreTotali}  ·  Totale: ${euro(dati.compensoTotale)}`, 40, 64);

  autoTable(doc, {
    startY: 80,
    head: [['Data', 'Orario', 'Allievo', 'Aula', 'Ore', 'Compenso']],
    body: dati.lezioni.map(l => [
      fmtData(l.data),
      `${l.ora_inizio}–${l.ora_fine}`,
      l.allievo,
      l.aula,
      l.ore.toFixed(2),
      euro(l.compenso),
    ]),
    foot: [['', '', '', 'Totale', dati.oreTotali.toFixed(2), euro(dati.compensoTotale)]],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 30, 30], fontStyle: 'bold' },
    theme: 'striped',
    margin: { left: 40, right: 40 },
  });

  doc.save(`rimborso_${dati.mese}.pdf`);
}

// ── componente ────────────────────────────────────────────────────────────
export default function CompensoInsegnante({ insegnanteId }) {
  const navigate   = useNavigate();
  const [mese, setMese]     = useState(getPrevMonthYYYYMM());
  const [dati, setDati]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]  = useState(null);

  const calcola = useCallback(async () => {
    if (!insegnanteId) return;
    setLoading(true); setErrore(null);
    try {
      const json = await apiFetch(`/api/insegnanti/${insegnanteId}/compenso?mese=${mese}`);
      setDati(json);
    } catch (e) {
      if (e?.status === 401 || e?.status === 403) { navigate('/login'); return; }
      setErrore(e.message || 'Errore nel calcolo.');
      setDati(null);
    } finally {
      setLoading(false);
    }
  }, [mese, insegnanteId, navigate]);

  useEffect(() => { calcola(); }, [calcola]);

  return (
    <div className="space-y-4">

      {/* Selettore mese */}
      <div className="bg-white border rounded-xl px-4 py-3">
        <label className="block text-xs font-medium text-n-600 mb-3">Mese di competenza</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const [y, m] = mese.split('-').map(Number);
              const d = new Date(y, m - 2, 1);
              setMese(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border text-n-600 text-lg active:bg-n-100"
          >‹</button>

          <div className="flex-1 text-center">
            <p className="text-base font-semibold text-n-900">{nomeMese(mese)}</p>
          </div>

          <button
            onClick={() => {
              const [y, m] = mese.split('-').map(Number);
              const d = new Date(y, m, 1);
              setMese(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border text-n-600 text-lg active:bg-n-100"
          >›</button>
        </div>
        <p className="text-xs text-n-300 mt-3">
          Solo lezioni <span className="font-medium text-n-600">svolte</span> nel mese selezionato.
        </p>
      </div>

      {errore && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{errore}</div>
      )}

      {dati && (
        <>
          {/* KPI riepilogo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border rounded-xl px-4 py-3">
              <p className="text-xs text-n-300 mb-1">Lezioni svolte</p>
              <p className="text-2xl font-bold text-n-900">{dati.lezioniSvolte}</p>
            </div>
            <div className="bg-white border rounded-xl px-4 py-3">
              <p className="text-xs text-n-300 mb-1">Ore totali</p>
              <p className="text-2xl font-bold text-n-900">{dati.oreTotali.toFixed(2)}</p>
            </div>
            <div className="bg-white border rounded-xl px-4 py-3">
              <p className="text-xs text-n-300 mb-1">Tariffa oraria</p>
              <p className="text-2xl font-bold text-n-900">{euro(dati.tariffaOraria)}</p>
            </div>
            <div className="bg-ama-500 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-200 mb-1">Totale rimborso</p>
              <p className="text-2xl font-bold text-white">{euro(dati.compensoTotale)}</p>
            </div>
          </div>

          {/* Export */}
          {dati.lezioni.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => exportExcel(dati)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium active:bg-emerald-100"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                onClick={() => exportPdf(dati)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium active:bg-red-100"
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          )}

          {/* Lista lezioni */}
          {dati.lezioni.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-8 text-center text-n-300 text-sm">
              Nessuna lezione svolta in {nomeMese(dati.mese)}.
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-n-600 uppercase mb-2">
                Lezioni conteggiate — {nomeMese(dati.mese)}
              </p>
              <div className="bg-white border rounded-xl overflow-hidden">
                {dati.lezioni.map((l, i) => (
                  <div key={l.id ?? i} className={`px-4 py-3 ${i < dati.lezioni.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-n-900 truncate">{l.allievo}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-n-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} /> {fmtData(l.data)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {l.ora_inizio}–{l.ora_fine}
                          </span>
                          {l.aula && l.aula !== '—' && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {l.aula}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-n-900">{euro(l.compenso)}</p>
                        <p className="text-xs text-n-300">{l.ore.toFixed(2)} h</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* riga totale */}
                <div className="px-4 py-3 bg-n-50 border-t flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Totale</span>
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-700">{euro(dati.compensoTotale)}</p>
                    <p className="text-xs text-n-300">{dati.oreTotali.toFixed(2)} h</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

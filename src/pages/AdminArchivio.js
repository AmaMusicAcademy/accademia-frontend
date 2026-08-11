import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import PageHeader from '../componenti/PageHeader';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

export default function AdminArchivio() {
  const navigate = useNavigate();
  const [anni, setAnni] = useState([]);
  const [annoSelezionato, setAnnoSelezionato] = useState(null);
  const [dati, setDati] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAnni, setLoadingAnni] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/anni-accademici')
      .then(d => setAnni(Array.isArray(d.anni) ? d.anni : []))
      .catch(() => setAnni([]))
      .finally(() => setLoadingAnni(false));
  }, []);

  const caricaAnno = async (anno) => {
    setAnnoSelezionato(anno);
    setDati(null);
    setLoading(true);
    try {
      const d = await apiFetch(`/api/admin/archivio/${anno}`);
      setDati(d);
    } catch {
      setDati(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-n-50 pb-20">
      <PageHeader title="Archivio anni accademici" backTo="/admin" />

      <div className="p-4 max-w-xl mx-auto space-y-4">
        {loadingAnni ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : anni.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-sm text-n-400">
            Nessun anno accademico archiviato.<br />
            Gli anni vengono creati al termine dell'anno tramite "Termina anno accademico".
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-n-500 mb-2">Seleziona anno da consultare</p>
              <div className="flex flex-wrap gap-2">
                {anni.map(a => (
                  <button
                    key={a}
                    onClick={() => caricaAnno(a)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      annoSelezionato === a
                        ? 'bg-ama-500 text-white border-ama-500'
                        : 'bg-white text-n-700 border-n-200 active:bg-n-50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {dati && !loading && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-n-900">{dati.lezioni?.svolta ?? 0}</p>
                    <p className="text-xs text-n-500 mt-0.5">Lezioni svolte</p>
                  </div>
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{dati.lezioni?.annullata ?? 0}</p>
                    <p className="text-xs text-n-500 mt-0.5">Annullate</p>
                  </div>
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-n-900">{dati.pagamenti ?? 0}</p>
                    <p className="text-xs text-n-500 mt-0.5">Pagamenti</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold text-n-900">Allievi — anno {dati.anno}</p>
                  </div>
                  {dati.allievi?.length === 0 ? (
                    <p className="text-sm text-n-400 text-center py-6">Nessun dato.</p>
                  ) : (
                    <div className="divide-y">
                      {dati.allievi?.map(a => (
                        <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-n-900">{a.cognome} {a.nome}</span>
                          <div className="flex gap-3 text-xs text-n-500">
                            <span className="text-emerald-600 font-semibold">{a.svolte} sv</span>
                            <span className="text-amber-500">{a.annullate} an</span>
                            <span className="text-blue-500">{a.rimandate} rim</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNavAdmin />
    </div>
  );
}

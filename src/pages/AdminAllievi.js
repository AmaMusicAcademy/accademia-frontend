import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const API = process.env.REACT_APP_API_URL || 'https://app-docenti.onrender.com';

const AdminAllievi = () => {
  const [allievi, setAllievi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [dataIscrizione, setDataIscrizione] = useState('');
  const [quotaMensile, setQuotaMensile] = useState('');
  const [insegnanti, setInsegnanti] = useState([]);
  const [insegnantiSelezionati, setInsegnantiSelezionati] = useState([]);

  // filtro insegnante (lista allievi)
  const [teacherId, setTeacherId] = useState('');

  // filtro “solo non in regola”
  const [arretratoOnly, setArretratoOnly] = useState(false);

  // quota associativa nella modale “nuovo allievo”
  const [qaPagataAnnoCorrente, setQaPagataAnnoCorrente] = useState(false);

  const navigate = useNavigate();
  const annoCorrente = new Date().getFullYear();

  // ─────────────────────────────────────────────────────
  // Helpers per mesi
  // ─────────────────────────────────────────────────────
  const ymKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
  const incMonth = (y, m) => {
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    return { y: nextY, m: nextM };
  };
  const monthLabelShort = (y, m) => {
    const mesi = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    return `${mesi[m - 1] || ''}${String(y).slice(-2)}`; // es. ott25
  };

  async function fetchInsegnanti() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/insegnanti`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInsegnanti(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Errore insegnanti:', err);
    }
  }

  async function fetchAllieviBase() {
    const token = localStorage.getItem('token');
    if (teacherId) {
      // allievi assegnati a un insegnante specifico
      const r = await fetch(`${API}/api/insegnanti/${teacherId}/allievi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await r.json();
    }
    const res = await fetch(`${API}/api/allievi`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  }

  const fetchAllievi = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseList = await fetchAllieviBase();

      const allieviEnriched = await Promise.all(
        (Array.isArray(baseList) ? baseList : []).map(async (allievo) => {
          const base = {
            ...allievo,
            in_regola: false,
            quota_assoc_anno_corrente: null,
            mesiPagati: [],       // es. ["2025-09", "2025-10", ...]
            ultimoPagato: null,   // es. { anno: 2025, mese: 9 }
            currentPaid: false    // mese corrente già pagato?
          };

          try {
            // mensilità
            const resPag = await fetch(`${API}/api/allievi/${allievo.id}/pagamenti`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const pagamenti = await resPag.json(); // [{anno, mese}]
            const mesiPagati = (Array.isArray(pagamenti) ? pagamenti : []).map(
              (p) => ymKey(Number(p.anno), Number(p.mese))
            );
            base.mesiPagati = mesiPagati;

            // in_regola = ogni mese da iscrizione → oggi è tra i pagati
            try {
              const inizio = new Date(allievo.data_iscrizione);
              const oggi = new Date();
              const mesiAttesi = [];
              const y0 = inizio.getFullYear();
              const m0 = inizio.getMonth();
              const y1 = oggi.getFullYear();
              const m1 = oggi.getMonth();
              for (let y = y0; y <= y1; y++) {
                const start = y === y0 ? m0 : 0;
                const end = y === y1 ? m1 : 11;
                for (let m = start; m <= end; m++) {
                  mesiAttesi.push(ymKey(y, m + 1));
                }
              }
              base.in_regola = mesiAttesi.every(mese => mesiPagati.includes(mese));
            } catch {
              base.in_regola = false;
            }

            // ultimoPagato
            if (mesiPagati.length) {
              const toPairs = mesiPagati
                .map(s => {
                  const [yy, mm] = s.split('-').map(Number);
                  return { yy, mm };
                })
                .sort((a,b) => (a.yy === b.yy ? a.mm - b.mm : a.yy - b.yy));
              const last = toPairs[toPairs.length - 1];
              base.ultimoPagato = { anno: last.yy, mese: last.mm };
            }

            // currentPaid?
            const now = new Date();
            const curKey = ymKey(now.getFullYear(), now.getMonth() + 1);
            base.currentPaid = mesiPagati.includes(curKey);
          } catch {
            base.in_regola = false;
          }

          try {
            // quota associativa anno corrente
            const resQA = await fetch(`${API}/api/allievi/${allievo.id}/quote-associative`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const qaList = await resQA.json();
            const itemAnno = Array.isArray(qaList)
              ? qaList.find(q => Number(q.anno) === annoCorrente)
              : null;

            base.quota_assoc_anno_corrente = itemAnno
              ? { pagata: !!itemAnno.pagata, data_pagamento: itemAnno.data_pagamento }
              : { pagata: false, data_pagamento: null };
          } catch {
            base.quota_assoc_anno_corrente = { pagata: false, data_pagamento: null };
          }

          return base;
        })
      );

      setAllievi(allieviEnriched);
    } catch (err) {
      console.error('Errore nel recupero allievi:', err);
    }
  };

  useEffect(() => { fetchInsegnanti(); }, []);
  useEffect(() => { fetchAllievi(); }, [teacherId]);

  const handleClick = (id) => {
    navigate(`/admin/allievi/${id}`);
  };

  const apriModale = async () => {
    setShowModal(true);
    setQaPagataAnnoCorrente(false);
    if (!insegnanti.length) await fetchInsegnanti();
  };

  const handleCheckboxChange = (id) => {
    setInsegnantiSelezionati((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSalvaAllievo = async () => {
    try {
      const token = localStorage.getItem('token');
      // 1) crea
      const res = await fetch(`${API}/api/allievi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome,
          cognome,
          data_iscrizione: dataIscrizione,
          quota_mensile: quotaMensile
        })
      });
      const newAllievo = await res.json();
      if (!res.ok || !newAllievo?.id) {
        alert('Errore nella creazione allievo'); return;
      }

      // 2) assegna insegnanti
      await fetch(`${API}/api/allievi/${newAllievo.id}/insegnanti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ insegnanti: insegnantiSelezionati }),
      });

      // 3) quota associativa (opzionale)
      if (qaPagataAnnoCorrente) {
        await fetch(`${API}/api/allievi/${newAllievo.id}/quota-associativa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ anno: annoCorrente, pagata: true })
        });
      }

      // reset
      setShowModal(false);
      setNome(''); setCognome(''); setDataIscrizione(''); setQuotaMensile('');
      setInsegnantiSelezionati([]); setQaPagataAnnoCorrente(false);
      fetchAllievi();
    } catch (err) {
      console.error('Errore salvataggio allievo:', err);
    }
  };

  // filtro “solo non in regola”
  const visibili = useMemo(() => {
    if (!arretratoOnly) return allievi;
    return allievi.filter(a => {
      const qaOk = a.quota_assoc_anno_corrente?.pagata === true;
      const mensOk = a.in_regola === true;
      return !(qaOk && mensOk); // mostra solo chi non è pienamente in regola
    });
  }, [allievi, arretratoOnly]);

  // calcola prossimo mese da segnare pagato: mese successivo a ultimoPagato
  const getNextMonthToPay = (allievo) => {
    const iscr = new Date(allievo.data_iscrizione);
    let y = iscr.getFullYear();
    let m = iscr.getMonth() + 1;
    if (allievo.ultimoPagato) {
      y = allievo.ultimoPagato.anno;
      m = allievo.ultimoPagato.mese;
      const step = incMonth(y, m);
      y = step.y;
      m = step.m;
    }
    return { y, m };
  };

  const handleSegnaPagato = async (allievo) => {
    try {
      // se già pagato il mese corrente → non fare nulla
      if (allievo.currentPaid) return;

      const { y, m } = getNextMonthToPay(allievo);
      const token = localStorage.getItem('token');

      const res = await fetch(`${API}/api/allievi/${allievo.id}/pagamenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anno: y, mese: m })
      });

      if (!res.ok) {
        const t = await res.text().catch(()=>'');
        throw new Error(t || 'Errore nel registrare il pagamento');
      }

      // aggiorna stato locale senza ricaricare tutto
      setAllievi(prev => prev.map(a => {
        if (String(a.id) !== String(allievo.id)) return a;
        const newMesi = [...(a.mesiPagati || []), ymKey(y,m)];
        // ricalcola ultimoPagato
        const pairs = newMesi
          .map(s => {
            const [yy, mm] = s.split('-').map(Number);
            return { yy, mm };
          })
          .sort((A,B) => (A.yy === B.yy ? A.mm - B.mm : A.yy - B.yy));
        const last = pairs[pairs.length - 1];
        // currentPaid?
        const now = new Date();
        const curKey = ymKey(now.getFullYear(), now.getMonth() + 1);
        const isCurPaid = newMesi.includes(curKey);
        return {
          ...a,
          mesiPagati: newMesi,
          ultimoPagato: { anno: last.yy, mese: last.mm },
          currentPaid: isCurPaid
        };
      }));
    } catch (e) {
      alert(e.message || 'Errore durante il salvataggio del pagamento');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-bold text-lg">←</button>
        <h2 className="flex-grow text-center text-lg font-semibold">Lista Allievi</h2>
        <div style={{ width: '70px' }}></div>
      </div>

      {/* Filtro insegnante + toggle arretrati */}
      <div className="sticky top-[56px] z-20 bg-white border-b px-4 py-2 flex items-center gap-3">
        <label className="text-sm text-gray-600">Insegnante:</label>
        <select
          className="border rounded px-3 py-1.5 text-sm"
          value={teacherId}
          onChange={(e)=>setTeacherId(e.target.value)}
        >
          <option value="">Tutti</option>
          {insegnanti.map(t => (
            <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
          ))}
        </select>

        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={arretratoOnly}
            onChange={(e)=>setArretratoOnly(e.target.checked)}
          />
          <span>Solo non in regola</span>
        </label>
      </div>

      {/* Lista allievi */}
      <div className="flex-grow p-4">
        <div className="bg-white rounded-lg shadow divide-y">
          {visibili.map((allievo) => {
            const qa = allievo.quota_assoc_anno_corrente;
            const qaOk = qa?.pagata === true;

            // mese corrente è già pagato?
            const disabled = allievo.currentPaid === true;

            // prossimo mese “dopo l’ultimo pagato” oppure dal mese di iscrizione
            const { y: nextY, m: nextM } = getNextMonthToPay(allievo);
            const shortLabel = monthLabelShort(nextY, nextM).toUpperCase();

            return (
              <div key={allievo.id} className="flex items-center justify-between p-4">
                <button
                  onClick={() => handleClick(allievo.id)}
                  className="flex-1 flex items-center text-left gap-3"
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${allievo.in_regola ? 'bg-green-500' : 'bg-red-500'}`}
                    title={allievo.in_regola ? 'Mensilità in regola' : 'Mensilità NON in regola'}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {allievo.nome} {allievo.cognome}
                    </span>
                    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${qaOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      🪪 Quota {annoCorrente}: {qaOk ? 'SALDATA' : 'DA SALDARE'}
                      {qa?.data_pagamento ? ` · ${qa.data_pagamento}` : ''}
                    </span>
                  </div>
                </button>

                {/* Bottone PAGATO (pill), disabilitato se mese corrente già saldato */}
                <div className="flex items-center gap-2 pl-3">
                  <button
                    onClick={() => handleSegnaPagato(allievo)}
                    disabled={disabled}
                    className={`relative flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm
                      ${disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500 text-white active:scale-95 hover:bg-emerald-600'
                      }`}
                    title={disabled ? 'Mese corrente già saldato' : `Registra pagamento ${shortLabel}`}
                  >
                    {disabled ? (
                      <span className="flex items-center gap-1">
                        ✅ <span className="text-[13px]">Pagato</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        💶 <span className="text-[13px]">{shortLabel}</span>
                      </span>
                    )}
                  </button>

                  {/* caret */}
                  <span
                    onClick={() => handleClick(allievo.id)}
                    className="text-gray-400 cursor-pointer select-none"
                    title="Dettaglio"
                  >
                    ›
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavAdmin showAddButton onAdd={apriModale} />

      {/* Modale inserimento allievo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Nuovo Allievo</h3>

            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="text" placeholder="Cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="date" value={dataIscrizione} onChange={(e) => setDataIscrizione(e.target.value)} className="w-full border px-3 py-2 mb-3 rounded" />
            <input type="number" placeholder="Quota mensile (€)" value={quotaMensile} onChange={(e) => setQuotaMensile(e.target.value)} className="w-full border px-3 py-2 mb-4 rounded" />

            <div className="mb-4">
              <h4 className="font-medium mb-2">Assegna insegnanti</h4>
              <div className="max-h-32 overflow-y-auto border rounded p-2">
                {insegnanti.map(ins => (
                  <label key={ins.id} className="block">
                    <input
                      type="checkbox"
                      checked={insegnantiSelezionati.includes(ins.id)}
                      onChange={() => handleCheckboxChange(ins.id)}
                      className="mr-2"
                    />
                    {ins.nome} {ins.cognome}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={qaPagataAnnoCorrente}
                onChange={(e) => setQaPagataAnnoCorrente(e.target.checked)}
              />
              <span className="text-sm">
                Segna quota associativa {annoCorrente} come <b>saldata</b>
              </span>
            </label>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-200">Annulla</button>
              <button onClick={handleSalvaAllievo} className="px-4 py-2 rounded bg-blue-600 text-white">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllievi;



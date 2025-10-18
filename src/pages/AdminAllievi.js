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

  // filtro “solo non in regola” (mensilità e/o quota associativa anno corrente)
  const [arretratoOnly, setArretratoOnly] = useState(false);

  // quota associativa nella modale “nuovo allievo”
  const [qaPagataAnnoCorrente, setQaPagataAnnoCorrente] = useState(false);

  const navigate = useNavigate();
  const annoCorrente = new Date().getFullYear();

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
          const base = { ...allievo, in_regola: false, quota_assoc_anno_corrente: null, __pagamenti: [] };

          try {
            // mensilità (salviamo anche i pagamenti grezzi per il bottone "Pagato")
            const resPag = await fetch(`${API}/api/allievi/${allievo.id}/pagamenti`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const pagamenti = await resPag.json();
            base.__pagamenti = Array.isArray(pagamenti) ? pagamenti : [];

            const mesiPagati = base.__pagamenti.map(p => `${p.anno}-${String(p.mese).padStart(2, '0')}`);

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
                mesiAttesi.push(`${y}-${String(m + 1).padStart(2, '0')}`);
              }
            }
            base.in_regola = mesiAttesi.every(mese => mesiPagati.includes(mese));
          } catch {
            base.in_regola = false;
            base.__pagamenti = [];
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

            // 🔢 ultimo mese pagato
            const pagamenti = Array.isArray(allievo.__pagamenti) ? allievo.__pagamenti : [];
            const last = pagamenti.reduce((acc, p) => {
              const k = Number(p.anno) * 100 + Number(p.mese);
              return k > acc.key ? { key: k, anno: Number(p.anno), mese: Number(p.mese) } : acc;
            }, { key: 0, anno: 0, mese: 0 });

            // 📅 mese corrente
            const now = new Date();
            const curAnno = now.getFullYear();
            const curMese = now.getMonth() + 1;

            // ⚠️ disabilita se mese corrente già pagato
            const currentPaid = pagamenti.some(p => Number(p.anno) === curAnno && Number(p.mese) === curMese);

            // ➕ prossimo mese da registrare
            let nextAnno = curAnno, nextMese = curMese;
            if (last.key > 0) {
              nextAnno = last.anno;
              nextMese = last.mese + 1;
              if (nextMese === 13) { nextMese = 1; nextAnno += 1; }
              // se "ultimo pagato" è nel passato remoto, non torniamo indietro: al minimo il corrente
              if (nextAnno * 100 + nextMese < curAnno * 100 + curMese) {
                nextAnno = curAnno; nextMese = curMese;
              }
            }

            const handleSegnaPagato = async (e) => {
              e.stopPropagation();
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/api/allievi/${allievo.id}/pagamenti`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ anno: nextAnno, mese: nextMese }),
                });
                if (!res.ok) {
                  const t = await res.text().catch(()=> '');
                  throw new Error(t || 'Errore nel salvataggio del pagamento');
                }
                // ricarica per riflettere subito lo stato
                fetchAllievi();
              } catch (err) {
                alert(err.message || 'Errore nel salvataggio pagamento');
              }
            };

            return (
              <div key={allievo.id} className="flex items-center justify-between p-4">
                <button
                  onClick={() => handleClick(allievo.id)}
                  className="flex-1 flex items-center text-left gap-3"
                  title="Apri dettaglio allievo"
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

                {/* 👉 Bottone Pagato (al posto di "Elimina") */}
                <div className="ml-3">
                  <button
                    onClick={handleSegnaPagato}
                    disabled={currentPaid}
                    className={`px-3 py-1.5 rounded text-sm border ${
                      currentPaid
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                    }`}
                    title={currentPaid ? 'Mese corrente già saldato' : `Registra ${String(nextMese).padStart(2, '0')}/${nextAnno}`}
                  >
                    {currentPaid ? 'Pagato (mese ok)' : `Pagato ${String(nextMese).padStart(2, '0')}/${nextAnno}`}
                  </button>
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



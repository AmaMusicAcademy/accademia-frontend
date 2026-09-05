import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Info, KeyRound, ImageIcon, Calculator, LogOut, ChevronRight, Thermometer, ScrollText, X } from 'lucide-react';
import BottomNav from '../componenti/BottomNav';
import { apiFetch } from '../utils/api';

const TESTO_REGOLAMENTO = `REGOLAMENTO ACCADEMIA — AMA Academy of Musical Arts
Viale Felissent, 14 — Treviso (TV) · amamusicacademy.it

ISCRIZIONE E TESSERAMENTO
L'iscrizione al corso prescelto deve essere effettuata a seguito del tesseramento all'associazione stessa, tramite versamento della quota associativa di 50 euro.

CORSI ORDINARI
Il percorso di studi si articola in 36 lezioni da settembre a maggio. La durata è di 45 o 60 minuti per i corsi individuali (€ 80 o € 100 mensili) e 60 minuti per i corsi di gruppo (€ 30 mensili). Prove, saggi, concerti e spettacoli ai quali l'allievo è convocato sono considerati attività didattiche a tutti gli effetti e conteggiati tra le 36 lezioni previste.

MODALITÀ DI PAGAMENTO
Il costo annuale viene suddiviso in 9 quote mensili di pari importo, da versare entro la prima lezione di ciascun mese. La quota mensile non corrisponde al numero effettivo di lezioni del singolo mese, ma rappresenta una rata del costo annuale complessivo. La programmazione prevede una media di 4 lezioni al mese: alcuni mesi potranno averne 3, altri 4 o 5, senza variazioni dell'importo. La quota deve essere corrisposta integralmente, indipendentemente dalla presenza dell'allievo. In caso di mancato pagamento nei termini, il tesseramento decade e le lezioni vengono sospese, senza diritto a rimborso.

ORARI
Gli orari vengono concordati tra allievo e insegnante secondo le disponibilità. Si chiede la massima puntualità.

SPETTACOLO FINALE DI GIUGNO (Loggia dei Cavalieri)
La partecipazione è riservata agli allievi che abbiano frequentato con assiduità e siano ritenuti pronti dal docente. Per ciascun allievo: quota di partecipazione € 50,00 (prova generale + spettacolo) + € 10,00 maglietta ufficiale. Totale: € 60,00, da versare entro il 15 maggio. Le quote versate non sono rimborsabili in caso di rinuncia, salvo annullamento da parte dell'Accademia.

ASSENZE E RECUPERI
Massimo 3 recuperi per anno accademico per le lezioni individuali, riconosciuti solo se l'assenza è comunicata con almeno 24 ore di preavviso. Assenze senza preavviso sufficiente: lezione persa senza recupero né rimborso. I recuperi devono essere effettuati entro il 31 maggio, in data stabilita dal docente. Le lezioni di gruppo non sono recuperabili.

RITIRO
Comunicazioni di ritiro entro 30 giorni: le quote successive ai 30 giorni non saranno dovute. Con il ritiro decade il tesseramento annuale, senza rimborso dell'iscrizione.

PERCORSO TRINITY
Gli allievi interessati devono comunicarlo alla Segreteria all'inizio dell'anno. Il percorso comprende la lezione individuale + incontro mensile di solfeggio di gruppo (€ 10,00 ciascuno) + materiale didattico Trinity. Al costo d'esame si aggiunge un contributo di € 20,00 per spese di Segreteria.

CREDITI FORMATIVI
L'Accademia rilascia idonea documentazione per i crediti scolastici su richiesta specifica.`;

function MenuRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b last:border-0"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-n-100'}`}>
        <Icon size={17} className={danger ? 'text-red-400' : 'text-n-600'} />
      </div>
      <span className={`flex-1 text-sm font-medium text-left ${danger ? 'text-red-500' : 'text-n-900'}`}>
        {label}
      </span>
      <ChevronRight size={16} className="text-n-300" />
    </button>
  );
}

const ProfiloInsegnante = () => {
  const navigate = useNavigate();
  const [utente, setUtente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegolamento, setShowRegolamento] = useState(false);

  useEffect(() => {
    apiFetch('/api/insegnante/me')
      .then((profilo) => {
        setUtente(profilo);
        localStorage.setItem('username', profilo.username);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading || !utente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-n-50 pb-20">
      <div className="pt-6 pb-2 px-4 max-w-xl mx-auto">

        {/* Avatar e nome */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-ama-100 rounded-full flex items-center justify-center mb-3">
            <User size={36} className="text-ama-300" />
          </div>
          <h1 className="text-xl font-bold text-n-900">{utente.nome} {utente.cognome}</h1>
          <p className="text-sm text-ama-500 mt-0.5">@{utente.username}</p>
        </div>

        {/* Account */}
        <div className="bg-white border rounded-xl px-4 mb-4">
          <MenuRow icon={Info}      label="Informazioni Account" onClick={() => navigate('/profilo/account')} />
          <MenuRow icon={KeyRound}  label="Cambia password"      onClick={() => navigate('/profilo/password')} />
          <MenuRow icon={ImageIcon} label="Cambia immagine"      onClick={() => navigate('/cambia-avatar')} />
        </div>

        {/* Insegnamento */}
        <div className="bg-white border rounded-xl px-4 mb-4">
          <MenuRow icon={ScrollText}  label="Regolamento"      onClick={() => setShowRegolamento(true)} />
          <MenuRow icon={Calculator}  label="Calcolo Rimborso" onClick={() => navigate('/rimborso')} />
          <MenuRow icon={Thermometer} label="Controllo Clima"  onClick={() => navigate('/insegnante/clima')} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 border border-red-100 rounded-xl bg-red-50 active:bg-red-100"
        >
          <LogOut size={17} /> Esci dall'account
        </button>

      </div>
      <BottomNav />

      {showRegolamento && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <ScrollText size={18} className="text-ama-500" />
                <h2 className="font-semibold text-n-900">Regolamento interno</h2>
              </div>
              <button onClick={() => setShowRegolamento(false)} className="text-n-300">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {TESTO_REGOLAMENTO.split('\n\n').map((blocco, i) => {
                const righe = blocco.split('\n');
                const titolo = righe[0];
                const corpo = righe.slice(1).join('\n');
                return (
                  <div key={i} className="mb-5">
                    <p className="text-sm font-bold text-n-900 mb-1">{titolo}</p>
                    {corpo && <p className="text-sm text-n-600 leading-relaxed">{corpo}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfiloInsegnante;

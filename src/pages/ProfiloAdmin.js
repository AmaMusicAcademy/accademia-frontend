import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, CreditCard, Users, GraduationCap, Banknote,
  ChevronRight, LogOut, KeyRound, Info, School, CalendarOff, RefreshCw, X,
} from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';
import { apiFetch } from '../utils/api';

const MESI_NOME = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const API = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://app-docenti.onrender.com');

function KpiCard({ icon: Icon, label, value, color, onClick }) {
  const colors = {
    blue:    'bg-ama-100 text-ama-500',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
  };
  return (
    <button
      onClick={onClick}
      className="bg-white border rounded-xl p-4 flex items-center gap-3 text-left active:bg-n-50 w-full"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors[color] || 'bg-n-50 text-n-300'}`}>
        <Icon size={19} />
      </div>
      <div>
        <p className="text-2xl font-bold text-n-900 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-n-600 mt-0.5">{label}</p>
      </div>
    </button>
  );
}

function MenuRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 border-b last:border-0 ${danger ? 'text-red-500' : 'text-n-900'}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-n-100'}`}>
        <Icon size={17} className={danger ? 'text-red-400' : 'text-n-600'} />
      </div>
      <span className="flex-1 text-sm font-medium text-left">{label}</span>
      <ChevronRight size={16} className="text-n-300" />
    </button>
  );
}

function QuoteCard({ onClick }) {
  const now = new Date();
  const [anno, setAnno] = useState(now.getFullYear());
  const [mese, setMese] = useState(now.getMonth() + 1);
  const [nonPagati, setNonPagati] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/pagamenti-overview?anno=${anno}&mese=${mese}`)
      .then(d => {
        const lista = Array.isArray(d?.allievi) ? d.allievi : Array.isArray(d) ? d : [];
        setNonPagati(lista.filter(r => !r.pagato).length);
      })
      .catch(() => setNonPagati(null))
      .finally(() => setLoading(false));
  }, [anno, mese]);

  const startX = useRef(null);

  const onPointerDown = (e) => { startX.current = e.clientX; };
  const onPointerUp   = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) {
        if (mese === 12) { setAnno(a => a + 1); setMese(1); } else { setMese(m => m + 1); }
      } else {
        if (mese === 1) { setAnno(a => a - 1); setMese(12); } else { setMese(m => m - 1); }
      }
    } else {
      onClick();
    }
    startX.current = null;
  };

  const red = nonPagati > 0;

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="bg-white border rounded-xl p-4 flex items-center gap-3 text-left active:bg-n-50 w-full select-none"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${red ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
        <CreditCard size={19} />
      </div>
      <div>
        {loading
          ? <div className="w-5 h-5 border-2 border-n-300 border-t-transparent rounded-full animate-spin" />
          : <p className={`text-2xl font-bold leading-none ${red ? 'text-red-600' : 'text-emerald-700'}`}>{nonPagati ?? '—'}</p>
        }
        <p className="text-xs text-n-600 mt-0.5">Quote non pagate · {MESI_NOME[mese - 1].slice(0,3)}</p>
      </div>
    </button>
  );
}

export default function ProfiloAdmin() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';
  const [kpi, setKpi] = useState(null);
  const [sezione, setSezione] = useState('panoramica');
  const [drawerRiprog, setDrawerRiprog] = useState(false);
  const [lezioniRiprog, setLezioniRiprog] = useState([]);
  const [loadingRiprog, setLoadingRiprog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setKpi).catch(() => {});
  }, []);

  const fmtData = (d) => {
    if (!d) return '—';
    const [y, m, dd] = String(d).slice(0, 10).split('-');
    return new Date(Date.UTC(+y,+m-1,+dd)).toLocaleDateString('it-IT', { day:'numeric', month:'short', year:'numeric' });
  };

  const apriDrawerRiprog = async () => {
    setDrawerRiprog(true);
    setLoadingRiprog(true);
    try {
      const lista = await apiFetch('/api/admin/lezioni-da-riprogrammare');
      setLezioniRiprog(Array.isArray(lista) ? lista : []);
    } catch { setLezioniRiprog([]); }
    finally { setLoadingRiprog(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-n-50 pb-20">
      <div className="pt-6 pb-2 px-4 max-w-xl mx-auto">

        {/* Avatar e nome */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-ama-100 rounded-full flex items-center justify-center mb-3">
            <User size={36} className="text-ama-300" />
          </div>
          <h1 className="text-xl font-bold text-n-900">Amministratore</h1>
          <p className="text-sm text-ama-500 mt-0.5">@{username}</p>
        </div>

        {/* Tab */}
        <div className="flex bg-n-100 rounded-xl p-1 mb-5">
          {[
            { id: 'panoramica', label: 'Panoramica' },
            { id: 'account',    label: 'Account' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSezione(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                sezione === id
                  ? 'bg-white text-ama-500 shadow-sm'
                  : 'text-n-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sezione === 'panoramica' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiCard
                icon={RefreshCw}
                label="Da riprogrammare"
                value={kpi?.daRiprogrammare}
                color={kpi?.daRiprogrammare > 0 ? 'red' : 'emerald'}
                onClick={apriDrawerRiprog}
              />
              <KpiCard
                icon={GraduationCap}
                label="Allievi attivi"
                value={kpi?.allieviAttivi}
                color="emerald"
                onClick={() => navigate('/admin/allievi')}
              />
              <QuoteCard onClick={() => navigate('/admin/pagamenti')} />
              <KpiCard
                icon={Users}
                label="Insegnanti"
                value={kpi?.insegnanti}
                color="amber"
                onClick={() => navigate('/admin/insegnanti')}
              />
            </div>

            <div className="bg-white border rounded-xl px-4 mb-4">
              <MenuRow icon={Users}       label="Insegnanti"  onClick={() => navigate('/admin/insegnanti')} />
              <MenuRow icon={School}      label="Aule"        onClick={() => navigate('/admin/aule')} />
              <MenuRow icon={CalendarOff} label="Chiusure"    onClick={() => navigate('/admin/chiusure')} />
              <MenuRow icon={CreditCard}  label="Pagamenti"   onClick={() => navigate('/admin/pagamenti')} />
              <MenuRow icon={Banknote}    label="Compensi"    onClick={() => navigate('/admin/compensi')} />
            </div>
          </>
        )}

        {sezione === 'account' && (
          <div className="bg-white border rounded-xl px-4 mb-4">
            <MenuRow icon={Info}     label="Informazioni Account" onClick={() => navigate('/admin/account')} />
            <MenuRow icon={KeyRound} label="Cambia password"      onClick={() => navigate('/admin/password')} />
            <MenuRow icon={LogOut}   label="Esci"                 onClick={handleLogout} danger />
          </div>
        )}

      </div>

      {/* Popup lezioni da riprogrammare */}
      {drawerRiprog && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4" onClick={() => setDrawerRiprog(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <p className="font-semibold text-n-900 text-sm">Lezioni da riprogrammare</p>
              <button onClick={() => setDrawerRiprog(false)}><X size={18} className="text-n-300" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingRiprog ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-ama-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : lezioniRiprog.length === 0 ? (
                <p className="text-center text-sm text-n-300 py-10">Nessuna lezione da riprogrammare.</p>
              ) : (
                <div className="divide-y">
                  {lezioniRiprog.map(l => (
                    <div key={l.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-n-900">{l.cognome_allievo} {l.nome_allievo}</span>
                        <span className="text-xs text-n-300">{fmtData(l.data)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-n-300">{l.ora_inizio?.slice(0,5)}–{l.ora_fine?.slice(0,5)}</span>
                        {l.nome_insegnante && <span className="text-xs text-n-300">· {l.nome_insegnante} {l.cognome_insegnante}</span>}
                        {l.aula && <span className="text-xs text-n-300">· {l.aula}</span>}
                      </div>
                      {l.motivazione && <p className="text-xs text-amber-600 mt-0.5">{l.motivazione}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}

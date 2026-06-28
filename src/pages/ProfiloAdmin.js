import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, CalendarDays, CreditCard, Users, GraduationCap,
  ChevronRight, LogOut, KeyRound, Info, School, CalendarOff, ClipboardList,
} from 'lucide-react';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

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

export default function ProfiloAdmin() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';
  const [kpi, setKpi] = useState(null);
  const [sezione, setSezione] = useState('panoramica');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setKpi).catch(() => {});
  }, []);

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
                icon={CalendarDays}
                label="Lezioni questa settimana"
                value={kpi?.lezioniSettimana}
                color="blue"
                onClick={() => navigate('/admin/calendario')}
              />
              <KpiCard
                icon={CreditCard}
                label="Quote non pagate"
                value={kpi?.pagamentiMancanti}
                color={kpi?.pagamentiMancanti > 0 ? 'red' : 'emerald'}
                onClick={() => navigate('/admin/pagamenti')}
              />
              <KpiCard
                icon={GraduationCap}
                label="Allievi attivi"
                value={kpi?.allieviAttivi}
                color="emerald"
                onClick={() => navigate('/admin/allievi')}
              />
              <KpiCard
                icon={Users}
                label="Insegnanti"
                value={kpi?.insegnanti}
                color="amber"
                onClick={() => navigate('/admin/insegnanti')}
              />
            </div>

            <div className="bg-white border rounded-xl px-4 mb-4">
              <MenuRow icon={Users}        label="Insegnanti"  onClick={() => navigate('/admin/insegnanti')} />
              <MenuRow icon={School}       label="Aule"        onClick={() => navigate('/admin/aule')} />
              <MenuRow icon={CalendarOff} label="Chiusure"    onClick={() => navigate('/admin/chiusure')} />
              <MenuRow icon={CreditCard}   label="Pagamenti"   onClick={() => navigate('/admin/pagamenti')} />
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

      <BottomNavAdmin />
    </div>
  );
}

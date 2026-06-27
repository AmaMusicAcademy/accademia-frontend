import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Info, KeyRound, ImageIcon, Calculator, LogOut, ChevronRight } from 'lucide-react';
import BottomNav from '../componenti/BottomNav';
import { apiFetch } from '../utils/api';

function MenuRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b last:border-0"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        <Icon size={17} className={danger ? 'text-red-400' : 'text-gray-500'} />
      </div>
      <span className={`flex-1 text-sm font-medium text-left ${danger ? 'text-red-500' : 'text-gray-800'}`}>
        {label}
      </span>
      <ChevronRight size={16} className="text-gray-300" />
    </button>
  );
}

const ProfiloInsegnante = () => {
  const navigate = useNavigate();
  const [utente, setUtente] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="pt-6 pb-2 px-4 max-w-xl mx-auto">

        {/* Avatar e nome */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <User size={36} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{utente.nome} {utente.cognome}</h1>
          <p className="text-sm text-blue-600 mt-0.5">@{utente.username}</p>
        </div>

        {/* Account */}
        <div className="bg-white border rounded-xl px-4 mb-4">
          <MenuRow icon={Info}      label="Informazioni Account" onClick={() => navigate('/profilo/account')} />
          <MenuRow icon={KeyRound}  label="Cambia password"      onClick={() => navigate('/profilo/password')} />
          <MenuRow icon={ImageIcon} label="Cambia immagine"      onClick={() => navigate('/cambia-avatar')} />
        </div>

        {/* Insegnamento */}
        <div className="bg-white border rounded-xl px-4 mb-4">
          <MenuRow icon={Calculator} label="Calcolo Rimborso" onClick={() => navigate('/rimborso')} />
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
    </div>
  );
};

export default ProfiloInsegnante;

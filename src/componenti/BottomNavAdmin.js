import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, ClipboardList } from 'lucide-react';
import DraggableFAB from './DraggableFAB';
import { apiFetch } from '../utils/api';

const TABS = [
  { label: 'Home',        icon: LayoutDashboard, to: '/admin',              exact: true  },
  { label: 'Allievi',     icon: Users,           to: '/admin/allievi',      exact: false },
  { label: 'Calendario',  icon: CalendarDays,    to: '/admin/calendario',   exact: false },
  { label: 'Iscrizioni',  icon: ClipboardList,   to: '/admin/iscrizioni',   exact: false },
];

const SHOW_FAB_ON = ['/admin/allievi', '/admin/insegnanti', '/admin/aule', '/admin/calendario'];

const BottomNavAdmin = ({ onAdd }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [attesa, setAttesa] = useState(0);

  useEffect(() => {
    apiFetch('/api/admin/dashboard')
      .then(d => setAttesa(d.iscrizioniAttesa || 0))
      .catch(() => {});
  }, [pathname]);

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  const showFab = onAdd && SHOW_FAB_ON.some((p) => pathname.startsWith(p));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showFab && <DraggableFAB onClick={onAdd} color="bg-ama-500" />}

      <div className="max-w-xl mx-auto h-[56px] flex items-center justify-around px-1">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          const showBadge = tab.to === '/admin/iscrizioni' && attesa > 0;
          return (
            <button
              key={tab.to}
              onClick={() => navigate(tab.to)}
              className={`relative flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors ${
                active ? 'text-ama-500' : 'text-n-300'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {attesa > 9 ? '9+' : attesa}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavAdmin;

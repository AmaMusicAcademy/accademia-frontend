import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, CreditCard } from 'lucide-react';

const TABS = [
  { label: 'Home',       icon: LayoutDashboard, to: '/admin',           exact: true  },
  { label: 'Allievi',    icon: Users,           to: '/admin/allievi',   exact: false },
  { label: 'Calendario', icon: CalendarDays,    to: '/admin/calendario',exact: false },
  { label: 'Pagamenti',  icon: CreditCard,      to: '/admin/pagamenti', exact: false },
];

const SHOW_FAB_ON = ['/admin/allievi', '/admin/insegnanti', '/admin/aule'];

const BottomNavAdmin = ({ onAdd }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  const showFab = onAdd && SHOW_FAB_ON.some((p) => pathname.startsWith(p));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showFab && (
        <button
          onClick={onAdd}
          className="absolute -top-5 right-5 w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform text-2xl font-light"
          aria-label="Aggiungi"
        >
          +
        </button>
      )}

      <div className="max-w-xl mx-auto h-[56px] flex items-center justify-around px-1">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.to}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavAdmin;

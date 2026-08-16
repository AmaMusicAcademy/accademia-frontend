import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, CreditCard, User } from 'lucide-react';

const TABS = [
  { label: 'Home',      icon: Home,       to: '/allievo',          exact: true  },
  { label: 'Lezioni',   icon: BookOpen,   to: '/allievo/lezioni',  exact: false },
  { label: 'Pagamenti', icon: CreditCard, to: '/allievo/pagamenti',exact: false },
  { label: 'Profilo',   icon: User,       to: '/allievo/profilo',  exact: false },
];

const BottomNavAllievo = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-xl mx-auto h-[56px] flex items-center justify-around px-1">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.to}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 relative transition-colors ${
                active ? 'text-ama-500' : 'text-n-300'
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

export default BottomNavAllievo;

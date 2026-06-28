import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Users, User, Plus } from 'lucide-react';
import NewLessonModal from './NewLessonModal';

const TABS = [
  { label: 'Home',      icon: Home,         to: '/insegnante',           exact: true  },
  { label: 'Calendario',icon: CalendarDays, to: '/insegnante/calendario',exact: false },
  { label: 'Allievi',   icon: Users,        to: '/insegnante/allievi',   exact: false },
  { label: 'Profilo',   icon: User,         to: '/insegnante/profilo',   exact: false },
];

const BottomNav = ({ onLessonCreated }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showModal, setShowModal] = useState(false);

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  const onCalendar = pathname.startsWith('/insegnante/calendario');

  const handleCreated = useCallback((created) => {
    setShowModal(false);
    if (onLessonCreated) onLessonCreated(created);
  }, [onLessonCreated]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="navigation"
        aria-label="Navigazione insegnante"
      >
        {/* FAB nuova lezione — visibile solo sul calendario */}
        {onCalendar && (
          <button
            onClick={() => setShowModal(true)}
            className="absolute -top-5 right-5 w-11 h-11 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Nuova lezione"
          >
            <Plus size={22} strokeWidth={2.5} />
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

      <NewLessonModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
};

export default BottomNav;

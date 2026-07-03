import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Users, User } from 'lucide-react';
import EditLessonModal from './EditLessonModal';
import DraggableFAB from './DraggableFAB';
import { getInsegnanteId } from '../utils/api';

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
  const insegnanteId = useMemo(() => getInsegnanteId(), []);

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  const onCalendar = pathname.startsWith('/insegnante/calendario');

  const handleSaved = useCallback(() => {
    setShowModal(false);
    if (onLessonCreated) onLessonCreated();
  }, [onLessonCreated]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="navigation"
        aria-label="Navigazione insegnante"
      >
        {/* FAB draggable — visibile solo sul calendario */}
        {onCalendar && (
          <DraggableFAB onClick={() => setShowModal(true)} color="bg-emerald-500" />
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

      <EditLessonModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        lesson={null}
        lockedTeacherId={insegnanteId}
      />
    </>
  );
};

export default BottomNav;

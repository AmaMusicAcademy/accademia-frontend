import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NewLessonModal from './NewLessonModal';

const BottomNav = ({ onLessonCreated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewLesson, setShowNewLesson] = useState(false);

  const isOnCalendar = location.pathname.startsWith('/insegnante/calendario');
  const isOnProfile  = location.pathname.startsWith('/insegnante/profilo');
  const isOnStudents = location.pathname.startsWith('/insegnante/allievi');

  const openModal = useCallback(() => setShowNewLesson(true), []);
  const closeModal = useCallback(() => setShowNewLesson(false), []);

  // 👇 inoltra al genitore la/le lezione/i create
  const handleCreated = useCallback((created) => {
    closeModal();
    if (onLessonCreated) onLessonCreated(created);
  }, [closeModal, onLessonCreated]);

  const centralAction = () => {
    if (isOnCalendar) {
      openModal();
    } else {
      navigate('/insegnante/calendario');
    }
  };

  const centralIcon  = isOnCalendar ? '➕' : '📅';
  const centralLabel = isOnCalendar ? 'Nuova lezione' : 'Calendario';

  return (
    <>
      <nav
  className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t backdrop-blur supports-[backdrop-filter]:bg-white/80 h-[72px]"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  role="navigation"
        aria-label="Navigazione insegnante"
      >

      <div className="max-w-xl mx-auto h-full w-full flex items-center justify-around px-2">
        {/* Profilo */}
        <button
          onClick={() => navigate('/insegnante/profilo')}
          className={`text-center flex-1 ${isOnProfile ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
          aria-current={isOnProfile ? 'page' : undefined}
          aria-label="Profilo"
        >
          <div className="text-xl">👤</div>
          <div className="text-xs">Profilo</div>
        </button>

        {/* Centrale */}
        <button
          onClick={centralAction}
          className={`rounded-full p-4 -mt-8 shadow-md text-xl text-white ${isOnCalendar ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ position: 'relative', zIndex: 10 }}
          aria-label={centralLabel}
          title={centralLabel}
        >
          {centralIcon}
        </button>

        {/* Allievi */}
        <button
          onClick={() => navigate('/insegnante/allievi')}
          className={`text-center flex-1 ${isOnStudents ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
          aria-current={isOnStudents ? 'page' : undefined}
          aria-label="Allievi"
        >
          <div className="text-xl">🎓</div>
          <div className="text-xs">Allievi</div>
        </button>
        </div>
      </nav>

      {/* Modale nuova lezione (solo se sono sul calendario) */}
      {isOnCalendar && (
        <NewLessonModal
          open={showNewLesson}
          onClose={closeModal}
          onCreated={handleCreated}   // 👈 qui
        />
      )}
    </>
  );
};

export default BottomNav;





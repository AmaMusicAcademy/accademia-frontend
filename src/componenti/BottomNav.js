import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-50 flex justify-between items-center px-6 py-2"
    >
      {/* Profilo */}
      <button onClick={() => navigate('/insegnante/profilo')} className="text-center flex-1">
        <div className="text-xl">👤</div>
        <div className="text-xs">Profilo</div>
      </button>

      {/* Calendario (centrale, tondo) */}
      <button
        onClick={() => navigate('/insegnante/calendario')}
        className="bg-blue-500 text-white rounded-full p-4 -mt-8 shadow-md text-xl"
        style={{ position: 'relative', zIndex: 10 }}
      >
        📅
      </button>

      {/* Allievi */}
      <button onClick={() => navigate('/insegnante/allievi')} className="text-center flex-1">
        <div className="text-xl">🎓</div>
        <div className="text-xs">Allievi</div>
      </button>
    </nav>
  );
};

export default BottomNav;

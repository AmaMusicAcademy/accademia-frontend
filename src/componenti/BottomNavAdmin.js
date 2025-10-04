import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavAdmin = ({ onAdd, onEdit }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const isAllieviList = location.pathname === '/admin/allievi';
  const isInsegnantiList = location.pathname === '/admin/insegnanti';
  const isAllievoDettaglio = /^\/admin\/allievi\/\d+$/.test(location.pathname);
  const isInsegnanteDettaglio = /^\/admin\/insegnanti\/\d+$/.test(location.pathname);
  const isCalendario = location.pathname.startsWith('/admin/calendario');
  const isAuleList = location.pathname === '/admin/aule';

  // mostriamo il pallino centrale "+" anche su aule
  const showAddCentral = isAllieviList || isInsegnantiList || isCalendario || isAuleList;

  // fallback: se sei su /admin/allievi/:id e non passi onEdit,
  // ricava l'id e naviga a /admin/allievi/:id/modifica
  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit();
      return;
    }
    if (isAllievoDettaglio) {
      const match = location.pathname.match(/^\/admin\/allievi\/(\d+)$/);
      const id = match?.[1];
      if (id) navigate(`/admin/allievi/${id}/modifica`);
    } else if (isInsegnanteDettaglio) {
      const match = location.pathname.match(/^\/admin\/insegnanti\/(\d+)$/);
      const id = match?.[1];
      if (id) navigate(`/admin/insegnanti/${id}/modifica`);
    }
  };

  return (
    <nav
  className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t backdrop-blur supports-[backdrop-filter]:bg-white/80 h-[72px]"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  role="navigation"
        aria-label="Navigazione insegnante"
      >

      <div className="max-w-xl mx-auto h-full w-full flex items-center justify-around px-2">
      {/* Profilo */}
      <button
        onClick={() => navigate('/admin')}
        className={`text-center ${
          isActive('/admin') &&
          !isAllieviList &&
          !isAllievoDettaglio &&
          !isCalendario &&
          !isAuleList
            ? 'text-blue-600'
            : 'text-gray-500'
        }`}
      >
        <div>👤</div>
        <div className="text-xs">Profilo</div>
      </button>

      {/* CENTRO: "+" / "✏️" / "📅" */}
      {showAddCentral ? (
        <button
          onClick={onAdd}
          className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md -mt-10"
          aria-label="Aggiungi"
          title="Aggiungi"
        >
          +
        </button>
      ) : isAllievoDettaglio || isInsegnanteDettaglio ? (
        <button
          onClick={handleEdit}
          className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md -mt-10"
          aria-label="Modifica"
          title="Modifica"
        >
          ✏️
        </button>
      ) : (
        <button
          onClick={() => navigate('/admin/calendario')}
          className={`text-center ${isActive('/admin/calendario') ? 'text-blue-600' : 'text-gray-500'}`}
          title="Calendario"
        >
          <div>📅</div>
          <div className="text-xs">Calendario</div>
        </button>
      )}

      {/* Lista Allievi */}
      <button
        onClick={() => navigate('/admin/allievi_lesson')}
        className={`text-center ${isActive('/admin/allievi_lesson') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div className="text-xl">🎓</div>
        <div className="text-xs">Allievi</div>
      </button>
    </div>
    </nav>
  );
};

export default BottomNavAdmin;

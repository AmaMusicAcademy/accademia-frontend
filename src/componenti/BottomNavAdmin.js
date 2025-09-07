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

  const showAddCentral = isAllieviList || isInsegnantiList || isCalendario;

  // 👇 fallback: se sei su /admin/allievi/:id e non passi onEdit,
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
      // qui volendo puoi gestire anche il dettaglio insegnante
    }
  };

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-inner flex justify-between items-center px-10 py-2 h-16 z-50">
      {/* Profilo */}
      <button
        onClick={() => navigate('/admin')}
        className={`text-center ${isActive('/admin') && !isAllieviList && !isAllievoDettaglio && !isCalendario ? 'text-blue-600' : 'text-gray-500'}`}
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
          title="Nuova lezione"
        >
          +
        </button>
      ) : (isAllievoDettaglio || isInsegnanteDettaglio) ? (
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

      {/* Lista Lezioni */}
      <button
        onClick={() => navigate('/admin/allievi_lesson')}
        className={`text-center ${isActive('/admin/allievi_lesson') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div className="text-xl">🎓</div>
        <div className="text-xs">Allievi</div>
      </button>
    </div>
  );
};

export default BottomNavAdmin;
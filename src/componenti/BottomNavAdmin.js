import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Props:
 * - addActionsByRoute: { [routePrefix: string]: () => void }
 *   es: {
 *     '/admin/allievi': openNuovoAllievoModal,
 *     '/admin/insegnanti': openNuovoInsegnanteModal,
 *     '/admin/aule': openNuovaAulaModal,
 *     '/admin/calendario': openAdminNewLessonModal,
 *     'default': openFallbackModal
 *   }
 * - onEdit?: () => void
 */
const BottomNavAdmin = ({ addActionsByRoute = {}, onEdit }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);
  const isAllieviList = location.pathname === '/admin/allievi' || location.pathname === '/admin/allievi_lesson';
  const isInsegnantiList = location.pathname === '/admin/insegnanti';
  const isAllievoDettaglio = /^\/admin\/allievi\/\d+$/.test(location.pathname);
  const isInsegnanteDettaglio = /^\/admin\/insegnanti\/\d+$/.test(location.pathname);
  const isCalendario = location.pathname.startsWith('/admin/calendario');
  const isAuleList = location.pathname === '/admin/aule';

  // Mostra il FAB "+" nelle sezioni elenco / calendario / aule
  const showAddCentral = isAllieviList || isInsegnantiList || isCalendario || isAuleList;

  // decide quale azione lanciare quando si preme il "+"
  const handleAdd = () => {
    // priorità: match più specifico
    const prefixes = Object.keys(addActionsByRoute || {}).filter(k => k !== 'default');
    const match = prefixes
      .filter(prefix => location.pathname.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0];

    const action =
      (match && typeof addActionsByRoute[match] === 'function' && addActionsByRoute[match]) ||
      (typeof addActionsByRoute.default === 'function' && addActionsByRoute.default) ||
      null;

    if (action) action();
  };

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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t backdrop-blur supports-[backdrop-filter]:bg-white/80 h-16"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
    >
      {/* griglia a 3 colonne per centrare le icone */}
      <div className="max-w-xl mx-auto h-full w-full grid grid-cols-3 place-items-center px-4">
        {/* Profilo */}
        <button
          onClick={() => navigate('/admin')}
          className={`w-full flex flex-col items-center justify-center text-center ${
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

        {/* CENTRO: FAB / Modifica / Calendario */}
        <div className="relative w-full flex items-center justify-center">
          {showAddCentral ? (
            <button
              onClick={handleAdd} // 👈 context-aware
              className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md -mt-10 z-10"
              aria-label="Aggiungi"
              title="Aggiungi"
            >
              +
            </button>
          ) : (isAllievoDettaglio || isInsegnanteDettaglio) ? (
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md -mt-10 z-10"
              aria-label="Modifica"
              title="Modifica"
            >
              ✏️
            </button>
          ) : (
            <button
              onClick={() => navigate('/admin/calendario')}
              className={`w-full flex flex-col items-center justify-center text-center ${
                isActive('/admin/calendario') ? 'text-blue-600' : 'text-gray-500'
              }`}
              title="Calendario"
            >
              <div>📅</div>
              <div className="text-xs">Calendario</div>
            </button>
          )}
        </div>

        {/* Allievi */}
        <button
          onClick={() => navigate('/admin/allievi_lesson')}
          className={`w-full flex flex-col items-center justify-center text-center ${
            isActive('/admin/allievi_lesson') ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <div className="text-xl">🎓</div>
          <div className="text-xs">Allievi</div>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavAdmin;
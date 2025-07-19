import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavAdmin = ({ showAddButton = false, onAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const isAllieviPage = location.pathname === '/admin/allievi';

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-inner flex justify-between items-center px-10 py-2 h-16 z-50">
      {/* Profilo */}
      <button
        onClick={() => navigate('/admin')}
        className={`text-center ${isActive('/admin') && !isAllieviPage ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div>👤</div>
        <div className="text-xs">Profilo</div>
      </button>

      {/* CENTRO: "+" oppure Calendario */}
      {isAllieviPage ? (
        <button
          onClick={onAdd}
          className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md -mt-8"
        >
          +
        </button>
      ) : (
        <button
          onClick={() => navigate('/admin/calendario')}
          className={`text-center ${isActive('/admin/calendario') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <div>📅</div>
          <div className="text-xs">Calendario</div>
        </button>
      )}

      {/* Pagamenti */}
      <button
        onClick={() => navigate('/admin/pagamenti')}
        className={`text-center ${isActive('/admin/pagamenti') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div>💰</div>
        <div className="text-xs">Pagamenti</div>
      </button>
    </div>
  );
};

export default BottomNavAdmin;





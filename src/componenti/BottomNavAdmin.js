/*import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserIcon, CalendarIcon, CreditCardIcon } from 'lucide-react';

function BottomNavAdmin() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/admin', icon: <UserIcon size={22} />, label: 'Profilo' },
    { path: '/admin/calendario', icon: <CalendarIcon size={22} />, label: 'Calendario' },
    { path: '/admin/pagamenti', icon: <CreditCardIcon size={22} />, label: 'Pagamenti' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center text-sm ${
              isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
            }`}
          >
            {tab.icon}
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavAdmin;
*/

const BottomNavAdmin = ({ showAddButton = false, onAdd, showEditButton = false, onEdit }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-inner flex justify-between items-center px-6 py-2 z-50">
      <button
        onClick={() => navigate('/admin')}
        className={`text-center ${isActive('/admin') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div>👤</div>
        <div className="text-xs">Profilo</div>
      </button>

      {showAddButton ? (
        <button
          onClick={onAdd}
          className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md -mt-8"
        >
          +
        </button>
      ) : showEditButton ? (
        <button
          onClick={onEdit}
          className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md -mt-8"
        >
          ✏️
        </button>
      ) : (
        <div className="w-12" />
      )}

      <button
        onClick={() => navigate('/admin/calendario')}
        className={`text-center ${isActive('/admin/calendario') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <div>📅</div>
        <div className="text-xs">Calendario</div>
      </button>

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



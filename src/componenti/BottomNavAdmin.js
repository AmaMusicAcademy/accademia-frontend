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

import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomNavAdmin = ({ current }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md flex justify-around py-2 border-t">
      <button onClick={() => navigate('/admin')}>
        <span className="text-xl">👤</span>
      </button>

      {current === 'allievi' ? (
        <button
          onClick={() => navigate('/admin/allievi/aggiungi')}
          className="bg-red-500 text-white w-12 h-12 rounded-full -mt-6 shadow-lg flex items-center justify-center text-2xl"
        >
          +
        </button>
      ) : (
        <button onClick={() => navigate('/admin/calendario')}>
          <span className="text-xl">📅</span>
        </button>
      )}

      <button onClick={() => navigate('/admin/pagamenti')}>
        <span className="text-xl">💰</span>
      </button>
    </div>
  );
};

export default BottomNavAdmin;

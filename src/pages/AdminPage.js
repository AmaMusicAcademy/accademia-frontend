import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

function AdminPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';

  return (
    <div className="min-h-screen pb-20 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white px-6 py-5 shadow">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{username}</h2>
            <p className="text-gray-500 text-sm">Account Admin</p>
          </div>
        </div>
      </div>

      {/* SEZIONE ACCOUNT */}
      <div className="mt-4">
        <h3 className="text-sm text-gray-500 px-6 mb-1">ACCOUNT</h3>
        <div className="bg-white divide-y shadow">
          <button className="w-full text-left px-6 py-4" onClick={() => navigate('/admin/account')}>
            Informazioni Account
          </button>
          <button className="w-full text-left px-6 py-4" onClick={() => navigate('/admin/password')}>
            Cambia Password
          </button>
          <button className="w-full text-left px-6 py-4" onClick={() => navigate('/admin/avatar')}>
            Cambia Immagine
          </button>
        </div>
      </div>

      {/* SEZIONE SICUREZZA */}
      <div className="mt-6">
        <h3 className="text-sm text-gray-500 px-6 mb-1">SICUREZZA</h3>
        <div className="bg-white divide-y shadow">
          <button className="w-full text-left px-6 py-4 text-red-600" onClick={() => {
            localStorage.clear();
            navigate('/');
          }}>
            Esci
          </button>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <BottomNavAdmin />
    </div>
  );
}

export default AdminPage;


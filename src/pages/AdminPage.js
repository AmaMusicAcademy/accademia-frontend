import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

function AdminPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow mb-4">
        <h1 className="text-xl font-bold">Benvenuto, {username}</h1>
        <p className="text-sm text-gray-500">Ruolo: Admin</p>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold mb-2">Gestione</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/utenti')}>Utenti (Admin/Insegnanti)</li>
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/allievi')}>Allievi</li>
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/lezioni')}>Lezioni</li>
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/aule')}>Aule</li>
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/pagamenti')}>Pagamenti</li>
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold mb-2">Sicurezza</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/password')}>Cambia password</li>
          <li className="py-2 cursor-pointer" onClick={() => navigate('/admin/avatar')}>Cambia immagine</li>
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Esci
        </button>
      </div>
      <BottomNavAdmin />
    </div>
  );
}

export default AdminPage;

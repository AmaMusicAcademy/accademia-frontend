import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavAdmin from '../componenti/BottomNavAdmin';

const ProfiloAdmin = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      {/* Intestazione */}
      <div className="p-6 bg-white shadow-md text-center">
        <div className="text-5xl mb-2">👤</div>
        <h2 className="text-xl font-bold">Admin</h2>
        <p className="text-gray-500">@{username}</p>
      </div>

      <div className="p-4 flex-1">
        {/* Sezione Account */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Account</h3>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            <button
              onClick={() => navigate('/admin/account')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>👤 Informazioni Account</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/admin/password')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🔑 Cambia password</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/admin/avatar')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🖼️ Cambia immagine</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left p-4 flex items-center justify-between text-red-600 font-semibold"
            >
              <span>🚪 Esci</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Sezione Gestione */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Gestione</h3>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            <button
              onClick={() => navigate('/admin/insegnanti')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>👨‍🏫 Insegnanti</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/admin/allievi')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🎓 Allievi</span>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/admin/aule')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>🏫 Aule</span>
              <span className="text-gray-400">›</span>
            </button>
            {/* 👇 NUOVA VOCE */}
            <button
              onClick={() => navigate('/admin/pagamenti')}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <span>💶 Pagamenti</span>
              <span className="text-gray-400">›</span>
            </button>
            {/* 🔧 Bottone allineamento insegnanti ↔ utenti */}
<li
  className="bg-white px-4 py-3 text-red-600 font-semibold rounded-lg shadow cursor-pointer"
  onClick={async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Nessun token trovato, rifai login come admin.");
        return;
      }

      const res = await fetch(
        "https://app-docenti.onrender.com/api/admin/align-insegnanti-utenti?normalize=true&apply=true",
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Errore ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("Allineamento completato:", data);
      alert("✅ Allineamento completato!\nControlla la console per i dettagli.");
    } catch (err) {
      console.error("Errore allineamento:", err);
      alert("❌ Errore durante l'allineamento, guarda la console.");
    }
  }}
>
  Allinea insegnanti ↔ utenti
</li>

          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNavAdmin />
    </div>
  );
};

export default ProfiloAdmin;



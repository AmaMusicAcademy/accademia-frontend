import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import NuovaLezione from './NuovaLezione';
import ModificaLezione from './componenti/ModificaLezione';
import CalendarioLezioniWrapper from './CalendarioLezioniWrapper';
import Home from './Home';
import Allievi from './Allievi';
import LoginPage from './pages/LoginPage';
import DashboardInsegnante from './pages/DashboardInsegnante'; // 👈 placeholder da creare
import ProfiloInsegnante from './componenti/ProfiloInsegnante';
import AllieviInsegnante from './componenti/AllieviInsegnante';
import InformazioniAccount from './pages/InformazioniAccount';
import CambiaPassword from './pages/CambiaPassword';
import CambiaAvatar from './pages/CambiaAvatar';
import CalcoloRimborso from './pages/CalcoloRimborso';
import CalendarioPersonale from './pages/CalendarioPersonale';
//import AdminDashboard from './pages/AdminDashboard';
import ProfiloAdmin from './pages/ProfiloAdmin';
import AdminAllievi from './pages/AdminAllievi';
import DettaglioAllievo from './pages/DettaglioAllievo';
import AdminInsegnanti from './pages/AdminInsegnanti';
import DettaglioInsegnante from './pages/DettaglioInsegnante';


function Layout({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      {!isLogin && (
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 10 }}>🏠 Home</Link>
          <Link to="/nuova-lezione" style={{ marginRight: 10 }}>➕ Nuova Lezione</Link>
          <Link to="/allievi">🎓 Gestione Allievi</Link>
        </nav>
      )}
      {children}
    </div>
  );
}

function App() {
  return (
    <Routes>
  <Route path="/" element={<LoginPage />} /> {/* 👈 LOGIN come home */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/insegnante" element={<DashboardInsegnante />} />
  <Route path="/nuova-lezione" element={<NuovaLezione />} />
  <Route path="/lezioni/:id/modifica" element={<ModificaLezione />} />
  <Route path="/lezioni/:idInsegnante" element={<CalendarioLezioniWrapper />} />
  <Route path="/allievi" element={<Allievi />} />
  <Route path="/insegnante/profilo" element={<ProfiloInsegnante />} />
  <Route path="/insegnante/allievi" element={<AllieviInsegnante />} />
  <Route path="/insegnante/calendario" element={<CalendarioPersonale/>} />
  <Route path="/profilo/account" element={<InformazioniAccount />} />
  <Route path="/profilo/password" element={<CambiaPassword />} />
  <Route path="/cambia-avatar" element={<CambiaAvatar />} />
  <Route path="/rimborso" element={<CalcoloRimborso />} />
  <Route path="/admin" element={<ProfiloAdmin />} />
  <Route path="/admin/allievi" element={<AdminAllievi />} />
  <Route path="/admin/allievi/:id" element={<DettaglioAllievo />} />
  <Route path="/admin/insegnanti" element={<AdminInsegnanti />} />
  <Route path="/admin/insegnanti/nuovo" element={<NuovoInsegnante />} />
  <Route path="/admin/insegnanti/:id" element={<DettaglioInsegnante />} />


</Routes>

  );
}

export default App;





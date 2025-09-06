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
import AllieviInsegnante from './pages/AllieviPage';
import InformazioniAccount from './pages/InformazioniAccount';
import CambiaPassword from './pages/CambiaPassword';
import CambiaAvatar from './pages/CambiaAvatar';
import CalcoloRimborso from './pages/CalcoloRimborso';
import CalendarioPersonale from './pages/CalendarioPersonale';
import ProfiloAdmin from './pages/ProfiloAdmin';
import AdminAllievi from './pages/AdminAllievi';
import AdminLessonTotal from './pages/AllieviAdminPages.js';
import DettaglioAllievo from './pages/DettaglioAllievo';
import AdminInsegnanti from './pages/AdminInsegnanti';
import DettaglioInsegnante from './pages/DettaglioInsegnante';
import CalendarioAdmin from './pages/CalendarioAdmin';
import AdminPagamenti from './pages/AdminPagamenti';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ element, allowedRoles }) {
  const ruolo = localStorage.getItem('ruolo');

  if (!allowedRoles.includes(ruolo)) {
    return <Navigate to="/login" replace />;
  }

  return element;
}


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
  {/* Login sempre accessibile */}
  <Route path="/" element={<LoginPage />} />
  <Route path="/login" element={<LoginPage />} />

  {/* 👨‍🏫 Insegnante */}
  <Route path="/insegnante" element={
    <ProtectedRoute element={<DashboardInsegnante />} allowedRoles={['insegnante']} />
  } />
  <Route path="/nuova-lezione" element={
    <ProtectedRoute element={<NuovaLezione />} allowedRoles={['insegnante']} />
  } />
  <Route path="/lezioni/:id/modifica" element={
    <ProtectedRoute element={<ModificaLezione />} allowedRoles={['insegnante']} />
  } />
  <Route path="/lezioni/:idInsegnante" element={
    <ProtectedRoute element={<CalendarioLezioniWrapper />} allowedRoles={['insegnante']} />
  } />
  <Route path="/allievi" element={
    <ProtectedRoute element={<Allievi />} allowedRoles={['insegnante']} />
  } />
  <Route path="/insegnante/profilo" element={
    <ProtectedRoute element={<ProfiloInsegnante />} allowedRoles={['insegnante']} />
  } />
  <Route path="/insegnante/allievi" element={
    <ProtectedRoute element={<AllieviInsegnante />} allowedRoles={['insegnante']} />
  } />
  <Route path="/insegnante/calendario" element={
    <ProtectedRoute element={<CalendarioPersonale />} allowedRoles={['insegnante']} />
  } />
  <Route path="/profilo/account" element={
    <ProtectedRoute element={<InformazioniAccount />} allowedRoles={['insegnante']} />
  } />
  <Route path="/profilo/password" element={
    <ProtectedRoute element={<CambiaPassword />} allowedRoles={['insegnante']} />
  } />
  <Route path="/cambia-avatar" element={
    <ProtectedRoute element={<CambiaAvatar />} allowedRoles={['insegnante']} />
  } />
  <Route path="/rimborso" element={
    <ProtectedRoute element={<CalcoloRimborso />} allowedRoles={['insegnante']} />
  } />

  {/* 👩‍💼 Admin */}
  <Route path="/admin" element={
    <ProtectedRoute element={<ProfiloAdmin />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/allievi" element={
    <ProtectedRoute element={<AdminAllievi />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/allievi_lesson" element={
    <ProtectedRoute element={<AllieviAdminPage />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/allievi/:id" element={
    <ProtectedRoute element={<DettaglioAllievo />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/insegnanti" element={
    <ProtectedRoute element={<AdminInsegnanti />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/insegnanti/:id" element={
    <ProtectedRoute element={<DettaglioInsegnante />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/calendario" element={
    <ProtectedRoute element={<CalendarioAdmin />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/pagamenti" element={
    <ProtectedRoute element={<AdminPagamenti />} allowedRoles={['admin']} />
  } />
</Routes>

  );
}

export default App;





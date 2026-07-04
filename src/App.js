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
import AdminIscrizioni from './pages/AdminIscrizioni';
import AdminLessonTotal from './pages/AllieviAdminPage';
import DettaglioAllievo from './pages/DettaglioAllievo';
import AdminInsegnanti from './pages/AdminInsegnanti';
import DettaglioInsegnante from './pages/DettaglioInsegnante';
import CalendarioAdmin from './pages/CalendarioAdmin';
import AdminPagamenti from './pages/AdminPagamenti';
import AdminCompensi from './pages/AdminCompensi';
import AdminArchivio from './pages/AdminArchivio';
import AllieviEdit from './pages/AllievoEditPage';
import AuleAdmin from './pages/AdminAulePage';
import GiorniChiusura from './pages/GiorniChiusura';
import { AdminGruppiList, AdminGruppoDettaglio } from './pages/AdminGruppi';
import DashboardAllievo from './pages/allievo/DashboardAllievo';
import LezioniAllievo from './pages/allievo/LezioniAllievo';
import PagamentiAllievo from './pages/allievo/PagamentiAllievo';
import ProfiloAllievo from './pages/allievo/ProfiloAllievo';
import IscrizionePage from './pages/IscrizionePage';
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
    <ProtectedRoute element={<AdminLessonTotal />} allowedRoles={['admin']} />
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
  <Route path="/admin/compensi" element={
    <ProtectedRoute element={<AdminCompensi />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/allievi/:id/modifica" element={
    <ProtectedRoute element={<AllieviEdit />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/aule" element={
    <ProtectedRoute element={<AuleAdmin />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/chiusure" element={
    <ProtectedRoute element={<GiorniChiusura />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/gruppi" element={
    <ProtectedRoute element={<AdminGruppiList />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/gruppi/:id" element={
    <ProtectedRoute element={<AdminGruppoDettaglio />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/archivio" element={
    <ProtectedRoute element={<AdminArchivio />} allowedRoles={['admin']} />
  } />
  <Route path="/admin/iscrizioni" element={
    <ProtectedRoute element={<AdminIscrizioni />} allowedRoles={['admin']} />
  } />

  {/* 📚 Allievo */}
  <Route path="/iscrizione" element={<IscrizionePage />} />
  <Route path="/allievo" element={
    <ProtectedRoute element={<DashboardAllievo />} allowedRoles={['allievo']} />
  } />
  <Route path="/allievo/lezioni" element={
    <ProtectedRoute element={<LezioniAllievo />} allowedRoles={['allievo']} />
  } />
  <Route path="/allievo/pagamenti" element={
    <ProtectedRoute element={<PagamentiAllievo />} allowedRoles={['allievo']} />
  } />
  <Route path="/allievo/profilo" element={
    <ProtectedRoute element={<ProfiloAllievo />} allowedRoles={['allievo']} />
  } />
</Routes>

  );
}

export default App;





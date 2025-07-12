/*import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NuovaLezione from './NuovaLezione';
import ModificaLezione from './componenti/ModificaLezione';
import CalendarioLezioniWrapper from './CalendarioLezioniWrapper'; // ✅ nuovo wrapper
import Home from './Home';
import Allievi from './Allievi';

function App() {
  return (
    <Router>
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 10 }}>🏠 Home</Link>
          <Link to="/nuova-lezione" style={{ marginRight: 10 }}>➕ Nuova Lezione</Link>
          <Link to="/allievi">🎓 Gestione Allievi</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nuova-lezione" element={<NuovaLezione />} />
          <Route path="/lezioni/:id/modifica" element={<ModificaLezione />} />
          <Route path="/lezioni/:idInsegnante" element={<CalendarioLezioniWrapper />} />
          <Route path="/allievi" element={<Allievi />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
*/

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
  <Route path="/insegnante/calendario" element={<CalendarioLezioniWrapper />} />
</Routes>

  );
}

export default App;





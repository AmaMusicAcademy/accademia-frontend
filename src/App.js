import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CalendarioLezioni from './CalendarioLezioni';
import NuovaLezione from './NuovaLezione';
import ModificaLezione from './ModificaLezione'; // 👈 AGGIUNTO
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
          <Route path="/lezioni/:id/modifica" element={<ModificaLezione />} /> {/* ✅ AGGIUNTO */}
          <Route path="/allievi" element={<Allievi />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;







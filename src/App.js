import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CalendarioLezioni from './CalendarioLezioni';
import NuovaLezione from './NuovaLezione';
import Home from './Home';
import Allievi from './Allievi'; // 👈 importa il componente Allievi

function App() {
  return (
    <Router>
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 10 }}>🏠 Home</Link>
          <Link to="/nuova-lezione" style={{ marginRight: 10 }}>➕ Nuova Lezione</Link>
          <Link to="/allievi">🎓 Gestione Allievi</Link> {/* 👈 nuovo link */}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nuova-lezione" element={<NuovaLezione />} />
          <Route path="/allievi" element={<Allievi />} /> {/* 👈 nuova route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;






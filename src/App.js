import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CalendarioLezioni from './CalendarioLezioni';
import NuovaLezione from './NuovaLezione'; // importa il componente
import Home from './Home'; // nuovo componente per la pagina insegnanti

function App() {
  return (
    <Router>
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 10 }}>🏠 Home</Link>
          <Link to="/nuova-lezione">➕ Nuova Lezione</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nuova-lezione" element={<NuovaLezione />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;





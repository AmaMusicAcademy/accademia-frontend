
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');

    try {
      const res = await fetch(`https://app-docenti.onrender.com/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrore(data.message || 'Credenziali non valide');
        return;
      }

      // Oggetto utente (alcuni campi potrebbero non arrivare dal backend: ok)
      const utente = {
        username: data.username || username.trim(),
        ruolo: data.ruolo,
        id: data.id || null,
        nome: data.nome || '',
        cognome: data.cognome || ''
      };

      // 🔑 SALVATAGGI NECESSARI
      localStorage.setItem('token', data.token);
      localStorage.setItem('ruolo', data.ruolo);      // 👈 fondamentale per ProtectedRoute
      localStorage.setItem('username', utente.username);
      localStorage.setItem('utente', JSON.stringify(utente));

      // Redirect in base al ruolo
      if (data.ruolo === 'admin') {
        navigate('/admin'); // se la tua route è /admin/dashboard, cambia qui
      } else {
        navigate('/insegnante/profilo');
      }
    } catch (err) {
      console.error(err);
      setErrore('Errore di connessione al server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errore && <p className="text-red-500 text-sm mb-3">{errore}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        >
          Accedi
        </button>
      </form>
    </div>
  );
}
export default LoginPage;


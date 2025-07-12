// src/pages/Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrore('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Credenziali non valide');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('utente', JSON.stringify(data.utente)); // es: { id, ruolo }

      // reindirizza alla dashboard insegnante
      if (data.utente.ruolo === 'insegnante') {
        navigate('/insegnante');
      } else {
        navigate('/'); // default o admin, ecc.
      }
    } catch (err) {
      setErrore(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border w-full p-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 rounded"
            required
          />
        </div>
        {errore && <p className="text-red-500 mb-4">{errore}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Accedi
        </button>
      </form>
    </div>
  );
}

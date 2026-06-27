import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, CheckCircle } from 'lucide-react';
import { API_BASE } from '../utils/api';

const STRUMENTI = [
  'Pianoforte','Chitarra','Violino','Violoncello','Flauto','Clarinetto',
  'Sassofono','Tromba','Trombone','Percussioni','Canto','Basso','Altro',
];

export default function IscrizionePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', cognome: '', email: '', telefono: '',
    strumento: '', data_nascita: '', note: '',
  });
  const [loading, setLoading] = useState(false);
  const [successo, setSuccesso] = useState(false);
  const [errore, setErrore] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/iscrizione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          data_nascita: form.data_nascita || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Errore nella richiesta');
      setSuccesso(true);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successo) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Richiesta inviata!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Abbiamo ricevuto la tua richiesta di iscrizione. Ti contatteremo presto per confermare.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl"
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Richiesta di iscrizione</h1>
          <p className="text-gray-500 text-sm mt-1">
            Compila il modulo e ti contatteremo per completare l'iscrizione
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          {/* Nome + Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nome *</label>
              <input
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Mario"
                value={form.nome}
                onChange={set('nome')}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cognome *</label>
              <input
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Rossi"
                value={form.cognome}
                onChange={set('cognome')}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="mario.rossi@email.it"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Telefono</label>
            <input
              type="tel"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="333 1234567"
              value={form.telefono}
              onChange={set('telefono')}
            />
          </div>

          {/* Strumento */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Strumento di interesse</label>
            <select
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              value={form.strumento}
              onChange={set('strumento')}
            >
              <option value="">Seleziona uno strumento…</option>
              {STRUMENTI.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Data di nascita */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data di nascita</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.data_nascita}
              onChange={set('data_nascita')}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Note aggiuntive</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={3}
              placeholder="Livello attuale, preferenze orarie, ecc."
              value={form.note}
              onChange={set('note')}
            />
          </div>

          {errore && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {errore}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading && (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Invio in corso…' : 'Invia richiesta'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Hai già un account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-indigo-600 font-medium">
              Accedi
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

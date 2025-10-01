import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const API_BASE =
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE)) ||
  'https://app-docenti.onrender.com';

const MAX_SIZE_MB = 5;

const CambiaAvatar = () => {
  const navigate = useNavigate();

  const utente = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('utente') || 'null'); }
    catch { return null; }
  }, []);

  const token = useMemo(() => {
    try { return localStorage.getItem('token') || ''; }
    catch { return ''; }
  }, []);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  // cleanup URL preview quando cambia file o quando smonta
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    setErrore('');
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validazioni base
    if (!selected.type.startsWith('image/')) {
      setErrore('Seleziona un file immagine valido');
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrore(`L’immagine è troppo grande (max ${MAX_SIZE_MB} MB)`);
      return;
    }

    // crea nuova preview e libera l’eventuale precedente
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(selected);
    setFile(selected);
    setPreview(url);
  };

  const handleUpload = async () => {
    setErrore('');
    if (!file) {
      setErrore('Nessun file selezionato');
      return;
    }
    if (!token) {
      setErrore('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE}/api/avatar`, {
        method: 'POST',
        headers: {
          // NON impostare Content-Type qui (lo fa il browser con boundary)
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: 'no-store',
      });

      // prova a leggere JSON anche in caso di errore per messaggi utili
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Errore durante l’upload');
      }

      // data.avatarUrl è un path tipo "/uploads/xxx.jpg"
      const newUrlPath = data?.avatarUrl || '';
      // cache-busting quando lo mostriamo
      const cacheBuster = `?t=${Date.now()}`;

      // aggiorna localStorage utente
      if (utente) {
        const aggiornato = {
          ...utente,
          avatar_url: newUrlPath, // salvo SOLO il path (come da backend)
        };
        localStorage.setItem('utente', JSON.stringify(aggiornato));
      }

      // vai al profilo
      navigate('/insegnante/profilo', { replace: true });

    } catch (err) {
      console.error(err);
      setErrore(err.message || 'Errore durante l’upload');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarSrc = (() => {
    if (preview) return preview;
    if (utente?.avatar_url) {
      // se in storage ho un path, lo compongo con la BASE e un cache-buster leggero
      const path = utente.avatar_url.startsWith('http')
        ? utente.avatar_url
        : `${API_BASE}${utente.avatar_url}`;
      return `${path}?v=${utente?.avatarUpdatedAt || ''}`;
    }
    return null;
  })();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-xl mr-4" aria-label="Torna indietro">←</button>
        <h2 className="text-lg font-semibold">Cambia Immagine</h2>
      </div>

      {/* Contenuto */}
      <div className="p-6 flex-1 flex flex-col items-center">
        {currentAvatarSrc ? (
          <img
            src={currentAvatarSrc}
            className="w-32 h-32 rounded-full object-cover mb-4"
            alt="avatar"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-3xl">👤</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />

        {errore && (
          <p className="text-red-500 mb-2 text-sm">{errore}</p>
        )}

        <button
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded disabled:opacity-60"
          disabled={loading || !file}
        >
          {loading ? 'Caricamento…' : 'Salva'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default CambiaAvatar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../componenti/BottomNav';

const CambiaAvatar = () => {
  const navigate = useNavigate();
  const utente = JSON.parse(localStorage.getItem('utente'));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('https://app-docenti.onrender.com/api/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Errore upload');

      const data = await res.json();

      // aggiorna localStorage
      const nuovoUtente = { ...utente, avatar_url: data.avatarUrl };
      localStorage.setItem('utente', JSON.stringify(nuovoUtente));
      navigate('/insegnante');
    } catch (err) {
      setErrore('Errore durante l\'upload');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-xl mr-4">←</button>
        <h2 className="text-lg font-semibold">Cambia Immagine</h2>
      </div>

      {/* Contenuto */}
      <div className="p-6 flex-1 flex flex-col items-center">
        {preview ? (
          <img src={preview} className="w-32 h-32 rounded-full object-cover mb-4" alt="preview" />
        ) : utente?.avatar_url ? (
          <img src={`https://app-docenti.onrender.com${utente.avatar_url}`} className="w-32 h-32 rounded-full object-cover mb-4" alt="avatar" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-3xl">👤</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        {errore && <p className="text-red-500 mb-2">{errore}</p>}
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? 'Caricamento...' : 'Salva'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default CambiaAvatar;

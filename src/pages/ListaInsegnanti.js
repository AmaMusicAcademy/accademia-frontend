// src/pages/admin/ListaInsegnanti.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomBarNav from '../componenti/BottomNavAdmin';

export default function ListaInsegnanti() {
  const [insegnanti, setInsegnanti] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsegnanti = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://app-docenti.onrender.com/api/insegnanti', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setInsegnanti(data);
      } catch (err) {
        console.error('Errore nel caricamento insegnanti:', err);
      }
    };

    fetchInsegnanti();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <h1 className="text-xl font-bold px-4 py-4">Insegnanti</h1>
      
      <ul className="px-4">
        {insegnanti.map((ins) => (
          <li
            key={ins.id}
            onClick={() => navigate(`/admin/insegnanti/${ins.id}`)}
            className="bg-white rounded-2xl shadow p-4 mb-3 flex items-center justify-between cursor-pointer active:bg-gray-100 transition"
          >
            <span className="text-base font-medium">
              {ins.nome} {ins.cognome}
            </span>
            <span className="text-gray-400 text-xl">{'>'}</span>
          </li>
        ))}
      </ul>

      <BottomBarNav
        current="profilo"
        showAddButton
        onAdd={() => navigate('/admin/insegnanti/aggiungi')}
      />
    </div>
  );
}


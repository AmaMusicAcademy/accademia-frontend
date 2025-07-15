import React, { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import CalendarioLezioni from "../componenti/CalendarioLezioni";

export default function CalendarioPersonale() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioniInsegnante = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrore("Utente non autenticato");
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token);
        const idInsegnante = decoded.id || decoded.userId;

        const res = await fetch(`/api/insegnanti/${idInsegnante}/lezioni`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Errore nel recupero delle lezioni");
        }

        const lezioni = await res.json();
        setLezioni(lezioni);
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLezioniInsegnante();
  }, []);

  if (loading) return <p className="text-center mt-4">Caricamento...</p>;
  if (errore) return <p className="text-red-500 text-center mt-4">{errore}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Il tuo Calendario</h2>
      <CalendarioLezioni lezioni={lezioni} />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import CalendarioFull from "./componenti/CalendarioFull";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function CalendarioLezioni() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token mancante");

        const decoded = jwtDecode(token);
        const id = decoded.id || decoded.userId;

        const res = await fetch(`${BASE_URL}/api/insegnanti/${id}/lezioni`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento delle lezioni");

        const lez = await res.json();
        console.log("📦 Lezioni ricevute dal backend:", lez);

        const filtrate = lez
          .filter(l =>
            (l.stato === "svolta" || l.stato === "programmata" || (l.stato === "rimandata" && l.riprogrammata)) &&
            l.data && l.ora_inizio && l.ora_fine
          )
          .map(l => {
            const dataObj = new Date(l.data);
            const yyyy = dataObj.getFullYear();
            const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dataObj.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            return {
              ...l,
              start: `${dateStr}T${l.ora_inizio}`,
              end: `${dateStr}T${l.ora_fine}`,
            };
          });

        console.log("✅ Lezioni filtrate per calendario:", filtrate);
        setLezioni(filtrate);
      } catch (err) {
        console.error("❌ Errore fetch:", err);
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLezioni();
  }, []);

  if (loading) return <p>Caricamento...</p>;
  if (errore) return <p className="text-red-600">{errore}</p>;

  return <CalendarioFull lezioni={lezioni} />;
}

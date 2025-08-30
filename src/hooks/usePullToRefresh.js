import { useEffect, useRef, useState } from "react";

/**
 * Gestisce il gesto di pull-to-refresh sul contenitore passato via ref.
 * - onRefresh: funzione async da eseguire al rilascio (sopra soglia)
 * - threshold: distanza in px per attivare il refresh (default 60)
 * - maxPull: pull massimo (default 120)
 */
export default function usePullToRefresh({ onRefresh, threshold = 60, maxPull = 120 } = {}) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Stato gesto
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const canDragRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshing) return;
      // Abilita trascinamento solo se siamo in cima
      canDragRef.current = el.scrollTop <= 0;
      if (!canDragRef.current) return;

      draggingRef.current = true;
      startYRef.current = e.touches[0].clientY;
      setPull(0);
    };

    const onTouchMove = (e) => {
      if (!draggingRef.current || !canDragRef.current || refreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        // Applica easing (resistenza)
        const eased = Math.min(maxPull, dy * 0.6);
        setPull(eased);
        // Evita che il browser faccia il proprio refresh nativo / rimbalzo
        // (su Android/Chrome funziona bene; su iOS Safari il nativo può prevalere)
        e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      if (pull >= threshold && typeof onRefresh === "function") {
        try {
          setRefreshing(true);
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        // anima ritorno
        setPull(0);
      }
    };

    // Listener (non-passive per poter chiamare preventDefault)
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onRefresh, threshold, maxPull, refreshing]);

  return { containerRef, pull, refreshing, threshold };
}

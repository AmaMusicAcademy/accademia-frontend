import { useEffect, useRef, useState } from "react";

/**
 * Gesto pull-to-refresh sul contenitore (ref interno).
 * Nessuna trasformazione del layout.
 */
export default function usePullToRefresh({ onRefresh, threshold = 60, maxPull = 120, disabled = false } = {}) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const canDragRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e) => {
      if (refreshing) return;
      // abilita solo se siamo già in cima
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
        const eased = Math.min(maxPull, dy * 0.6);
        setPull(eased);
        // evita rubber-band/refresh nativo
        e.preventDefault();
      }
    };

    const endDrag = async () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      const doReset = () => {
        // reset “forte” per iOS: assicura che lo scroll torni a 0
        const node = containerRef.current;
        if (node) {
          node.scrollTop = 0;
        }
        setPull(0);
      };

      if (pull >= threshold && typeof onRefresh === "function") {
        try {
          setRefreshing(true);
          await onRefresh();
        } finally {
          setRefreshing(false);
          // piccolo delay per evitare che l'inerzia di iOS rimanga “su”
          setTimeout(doReset, 0);
        }
      } else {
        setTimeout(doReset, 0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", endDrag, { passive: true });
    el.addEventListener("touchcancel", endDrag, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", endDrag);
      el.removeEventListener("touchcancel", endDrag);
    };
  }, [onRefresh, threshold, maxPull, refreshing, disabled]);

  useEffect(() => {
    if (disabled) setPull(0);
  }, [disabled]);

  return { containerRef, pull, refreshing, threshold };
}



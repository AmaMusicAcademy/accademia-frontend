import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

const STORAGE_KEY = 'ama_fab_pos';
const NAV_H = 64; // bottom nav height + gap
const BTN_SIZE = 48;
const EDGE_PAD = 16;

function loadPos() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}
function savePos(pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

export default function DraggableFAB({ onClick, color = 'bg-ama-500' }) {
  const btnRef  = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originLeft: 0, originTop: 0, moved: false });

  // posizione in px dal top-left della viewport
  const [pos, setPos] = useState(() => {
    const saved = loadPos();
    if (saved) return saved;
    // default: in basso a destra, appena sopra la bottomnav
    return {
      left: window.innerWidth - BTN_SIZE - EDGE_PAD,
      top: window.innerHeight - NAV_H - BTN_SIZE - 8,
    };
  });

  // aggiorna la posizione default se la finestra viene ridimensionata e non c'è una posizione salvata
  useEffect(() => {
    const onResize = () => {
      if (!loadPos()) {
        setPos({
          left: window.innerWidth - BTN_SIZE - EDGE_PAD,
          top: window.innerHeight - NAV_H - BTN_SIZE - 8,
        });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const clamp = useCallback((p) => {
    const maxLeft = window.innerWidth  - BTN_SIZE - EDGE_PAD;
    const maxTop  = window.innerHeight - BTN_SIZE - EDGE_PAD;
    return {
      left: Math.max(EDGE_PAD, Math.min(maxLeft, p.left)),
      top:  Math.max(EDGE_PAD, Math.min(maxTop,  p.top)),
    };
  }, []);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const btn = btnRef.current;
    if (!btn) return;
    btn.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: pos.left,
      originTop: pos.top,
      moved: false,
    };
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return; // soglia minima
    d.moved = true;
    const next = clamp({ left: d.originLeft + dx, top: d.originTop + dy });
    setPos(next);
  }, [clamp]);

  const onPointerUp = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    if (!d.moved) {
      // click normale
      onClick && onClick();
      return;
    }
    // snap al bordo sinistro o destro più vicino
    const midX = window.innerWidth / 2;
    const finalLeft = pos.left + BTN_SIZE / 2 < midX
      ? EDGE_PAD
      : window.innerWidth - BTN_SIZE - EDGE_PAD;
    const snapped = clamp({ left: finalLeft, top: pos.top });
    setPos(snapped);
    savePos(snapped);
  }, [onClick, pos, clamp]);

  return (
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: BTN_SIZE, height: BTN_SIZE, touchAction: 'none', zIndex: 9999 }}
      className={`${color} text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 select-none`}
      aria-label="Aggiungi"
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  );
}

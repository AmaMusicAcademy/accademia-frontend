import React from "react";
import usePullToRefresh from "../hooks/usePullToRefresh";

/**
 * PullToRefresh senza alcuna modifica al layout:
 * - overlay fixed in alto (non cliccabile)
 * - nessuna transform, nessuno spacer
 */
export default function PullToRefresh({ onRefresh, className = "", children, disabled = false }) {
  const { containerRef, pull, refreshing, threshold } = usePullToRefresh({ onRefresh, disabled });

  const progress = Math.min(1, pull / threshold);
  const visible = pull > 0 || refreshing;

  return (
    <div
      ref={containerRef}
      className={`relative h-full overflow-y-auto overscroll-contain touch-pan-y ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Overlay progresso: FIXED, non blocca i tap */}
      {visible && (
        <div
          className="fixed top-2 left-0 right-0 z-[60] flex justify-center pointer-events-none"
          aria-hidden
        >
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white/90 rounded-full px-3 py-1 shadow">
            <div
              className="h-5 w-5 rounded-full border-2 border-gray-300"
              style={{
                background: `conic-gradient(currentColor ${progress * 360}deg, transparent 0deg)`,
                color: "#4b5563",
                mask: "radial-gradient(farthest-side,transparent calc(100% - 2px),#000 0)",
                WebkitMask: "radial-gradient(farthest-side,transparent calc(100% - 2px),#000 0)",
              }}
            />
            <span>
              {refreshing
                ? "Aggiornamento…"
                : pull >= threshold
                ? "Rilascia per aggiornare"
                : "Trascina per aggiornare"}
            </span>
          </div>
        </div>
      )}

      {/* Contenuti: zero transform/offset → niente interferenze */}
      {children}
    </div>
  );
}



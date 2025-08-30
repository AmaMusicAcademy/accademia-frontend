import React from "react";
import usePullToRefresh from "../hooks/usePullToRefresh";

/**
 * PullToRefresh senza transform: usa uno spacer in alto
 * e un indicatore sticky. Evita bug con elementi fixed (BottomNav).
 *
 * Props:
 *  - onRefresh: async () => void
 *  - className: string
 *  - disabled?: boolean (opzionale)
 */
export default function PullToRefresh({ onRefresh, className = "", children, disabled = false }) {
  const { containerRef, pull, refreshing, threshold } = usePullToRefresh({ onRefresh, disabled });

  const progress = Math.min(1, pull / threshold);
  const showHeader = pull > 0 || refreshing;

  return (
    <div
      ref={containerRef}
      className={`relative h-full overflow-y-auto overscroll-contain touch-pan-y ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Spacer che “apre” lo spazio quando si tira giù */}
      <div style={{ height: showHeader ? 56 : 0, transition: "height 140ms ease" }} />

      {/* Indicatore sticky in alto */}
      <div className="sticky top-0 z-10 flex items-center justify-center pointer-events-none" style={{ height: 0 }}>
        <div
          className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white/90 rounded-full px-3 py-1 shadow"
          style={{ transform: `translateY(${showHeader ? 8 : -24}px)`, transition: "transform 140ms ease" }}
          aria-hidden={!showHeader}
        >
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

      {/* Contenuti: nessuna transform qui → niente bug con il BottomNav fixed */}
      <div>{children}</div>
    </div>
  );
}


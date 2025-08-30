import React from "react";
import usePullToRefresh from "../hooks/usePullToRefresh";

/**
 * Wrapper che mostra l'indicatore e gestisce il gesto di pull.
 * - onRefresh: async () => void
 * - className: classi extra per il contenitore scrollabile
 */
export default function PullToRefresh({ onRefresh, className = "", children }) {
  const { containerRef, pull, refreshing, threshold } = usePullToRefresh({ onRefresh });

  const progress = Math.min(1, pull / threshold);

  return (
    <div
      ref={containerRef}
      className={`relative h-full overflow-y-auto overscroll-contain touch-pan-y ${className}`}
      // tailwind: assicurati di avere queste utility (o sostituisci con CSS)
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Indicatore (sticky in alto) */}
      <div
        className="sticky top-0 z-10 flex items-center justify-center"
        style={{ height: pull > 0 || refreshing ? 56 : 0, transition: "height 140ms ease" }}
        aria-hidden={!refreshing && pull === 0}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="h-5 w-5 rounded-full border-2 border-gray-300"
            style={{
              // cerchietto che si riempie con il progresso
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

      {/* Contenuti della pagina */}
      <div
        // Trasla in basso il contenuto mentre si tira
        style={{ transform: `translateY(${pull}px)`, transition: refreshing ? "transform 140ms ease" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

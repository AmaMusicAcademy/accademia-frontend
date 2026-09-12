import React, { useEffect, useState } from 'react';
import { X, Share, MoreVertical, Plus, Download } from 'lucide-react';

const STORAGE_KEY = 'pwa_guide_shown';

function detectDevice() {
  const ua = navigator.userAgent || '';
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) return 'installed';

  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) return 'ios';

  const isAndroid = /android/i.test(ua);
  if (isAndroid) return 'android';

  return 'desktop';
}

// Arrow pointing downward toward bottom bar (iOS)
function ArrowDown() {
  return (
    <svg viewBox="0 0 40 80" className="w-10 h-20 text-white" fill="currentColor">
      <line x1="20" y1="0" x2="20" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <polyline points="8,50 20,70 32,50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Arrow pointing upward toward top-right (Android)
function ArrowUp() {
  return (
    <svg viewBox="0 0 40 80" className="w-10 h-20 text-white" fill="currentColor">
      <line x1="20" y1="80" x2="20" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <polyline points="8,30 20,10 32,30" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PwaInstallGuide({ forceShow = false, onDismiss }) {
  const [device, setDevice] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const d = detectDevice();
    if (d === 'installed' || d === 'desktop') return;
    setDevice(d);

    if (forceShow) {
      setVisible(true);
      return;
    }

    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY);
      if (alreadyShown) return;
    } catch { return; }

    setVisible(true);
  }, [forceShow]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible || !device) return null;

  const isIOS = device === 'ios';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
      {/* Sfondo semitrasparente */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={dismiss} />

      {isIOS ? (
        // iOS: bolla al centro in basso, freccia verso la barra in fondo
        <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-1 pointer-events-auto">
          {/* Bolla */}
          <div className="bg-white rounded-2xl shadow-2xl px-5 py-4 mx-6 max-w-xs w-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold text-n-900">Installa l'app</p>
              <button onClick={dismiss} className="text-n-300 -mr-1 -mt-1">
                <X size={16} />
              </button>
            </div>
            <ol className="text-sm text-n-700 space-y-2 list-none">
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">1</span>
                <span>Tocca il pulsante <Share size={13} className="inline -mt-0.5" /> <strong>Condividi</strong> in basso</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">2</span>
                <span>Scorri e scegli <strong>"Aggiungi a Home"</strong> <Plus size={12} className="inline -mt-0.5" /></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">3</span>
                <span>Tocca <strong>Aggiungi</strong> in alto a destra</span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-3 w-full py-2 bg-ama-500 text-white rounded-xl text-sm font-semibold active:bg-ama-700"
            >
              Ho capito
            </button>
          </div>
          {/* Freccia verso il basso */}
          <ArrowDown />
        </div>
      ) : (
        // Android: bolla in alto a destra, freccia verso i 3 puntini
        <div className="absolute top-12 right-4 flex flex-col items-end gap-1 pointer-events-auto">
          {/* Freccia verso l'alto */}
          <div className="mr-2">
            <ArrowUp />
          </div>
          {/* Bolla */}
          <div className="bg-white rounded-2xl shadow-2xl px-5 py-4 max-w-xs w-72">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold text-n-900">Installa l'app</p>
              <button onClick={dismiss} className="text-n-300 -mr-1 -mt-1">
                <X size={16} />
              </button>
            </div>
            <ol className="text-sm text-n-700 space-y-2 list-none">
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">1</span>
                <span>Tocca <MoreVertical size={13} className="inline -mt-0.5" /> <strong>i 3 puntini</strong> in alto a destra</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">2</span>
                <span>Scegli <strong>"Aggiungi a schermata Home"</strong> <Download size={12} className="inline -mt-0.5" /></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-ama-100 text-ama-600 text-xs font-bold flex items-center justify-center">3</span>
                <span>Tocca <strong>Aggiungi</strong> per confermare</span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-3 w-full py-2 bg-ama-500 text-white rounded-xl text-sm font-semibold active:bg-ama-700"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

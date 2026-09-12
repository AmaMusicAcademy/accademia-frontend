import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

const STORAGE_KEY = 'pwa_prompt_shown';

function detectMobile() {
  if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) return false; // già installata
  const ua = navigator.userAgent || '';
  return /iphone|ipad|ipod|android/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function PwaInstallPrompt({ onInstall }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!detectMobile()) return;
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch { return; }
    setVisible(true);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
  };

  const handleInstall = () => {
    dismiss();
    if (onInstall) onInstall();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />

      {/* Sheet dal basso */}
      <div className="relative z-10 bg-white w-full max-w-md rounded-t-3xl shadow-2xl px-6 pt-6 pb-10">

        {/* Chiudi */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-n-300 p-1"
        >
          <X size={18} />
        </button>

        {/* Icona + testo */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-16 h-16 bg-ama-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-n-900">Installa l'app</h2>
            <p className="text-sm text-n-500 mt-1">
              Aggiungi AMA Music Academy alla tua schermata Home per accedere
              più velocemente, anche offline.
            </p>
          </div>
        </div>

        {/* Bottoni */}
        <button
          onClick={handleInstall}
          className="w-full py-3.5 bg-ama-500 active:bg-ama-700 text-white font-bold text-base rounded-2xl shadow mb-3"
        >
          Installa l'app
        </button>
        <button
          onClick={dismiss}
          className="w-full py-3 text-n-400 text-sm font-medium"
        >
          Continua senza installare
        </button>
      </div>
    </div>
  );
}

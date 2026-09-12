import React, { useEffect, useState } from 'react';
import { X, MoreVertical, Share } from 'lucide-react';

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
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

// ── Frecce SVG ───────────────────────────────────────────────────────────────

function Arrow({ direction }) {
  // direction: 'up' | 'down' | 'up-right' | 'down-right'
  const paths = {
    up:         { line: 'M20 70 L20 15', poly: '8,28 20,8 32,28' },
    down:       { line: 'M20 10 L20 65', poly: '8,52 20,72 32,52' },
    'up-right': { line: 'M10 65 L55 20', poly: '42,10 65,18 57,40' },
  };
  const p = paths[direction] || paths.up;
  return (
    <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-lg" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d={p.line} stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points={p.poly} fill="white" />
    </svg>
  );
}

// ── Bolla ────────────────────────────────────────────────────────────────────

function Bubble({ icon: Icon, label, text, onNext, onDismiss, isLast, step }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl px-5 py-4 w-72 max-w-[85vw]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-ama-500 shrink-0" />}
          <p className="text-xs font-semibold text-n-400 uppercase tracking-wide">{label}</p>
        </div>
        <button onClick={onDismiss} className="text-n-200 -mr-1 -mt-1 p-1">
          <X size={14} />
        </button>
      </div>
      <p className="text-sm font-medium text-n-900 leading-snug mb-4">{text}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-ama-500' : 'bg-n-200'}`} />
          ))}
        </div>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-ama-500 text-white rounded-xl text-sm font-semibold active:bg-ama-700"
        >
          {isLast ? 'Ho capito' : 'Avanti →'}
        </button>
      </div>
    </div>
  );
}

// ── Step definitions ──────────────────────────────────────────────────────────
//
// position: className per il wrapper dello step (absolute + inset)
// arrowClass: className per il wrapper della freccia
// bubbleClass: className per il wrapper della bolla

const STEPS = {
  android: [
    {
      // Step 0 – 3 puntini in alto a destra
      // La bolla appare sotto i 3 puntini, la freccia punta in alto a destra
      wrapperClass: 'top-16 right-3 flex flex-col items-end gap-1',
      arrowFirst: true,   // freccia sopra la bolla
      arrowDir: 'up-right',
      icon: MoreVertical,
      label: 'Passo 1 di 3',
      text: 'Tocca i 3 puntini in alto a destra per aprire il menu del browser',
    },
    {
      // Step 1 – Condividi nel menu a tendina (metà schermo in alto occupata dal menu)
      // La bolla appare nella metà inferiore visibile
      wrapperClass: 'top-[45%] right-3 flex flex-col items-end gap-1',
      arrowFirst: true,
      arrowDir: 'up',
      icon: Share,
      label: 'Passo 2 di 3',
      text: 'Nel menu che si apre, tocca "Condividi"',
    },
    {
      // Step 2 – Aggiungi a Home (il foglio di condivisione copre la metà inferiore)
      // La bolla appare nella metà superiore visibile
      wrapperClass: 'top-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
      arrowFirst: false,  // freccia sotto la bolla
      arrowDir: 'down',
      icon: null,
      label: 'Passo 3 di 3',
      text: 'Scorri il foglio di condivisione, scegli "Aggiungi a schermata Home" e tocca Aggiungi',
    },
  ],
  ios: [
    {
      // Step 0 – Pulsante Condividi in basso al centro (Safari)
      wrapperClass: 'bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
      arrowFirst: false,
      arrowDir: 'down',
      icon: Share,
      label: 'Passo 1 di 3',
      text: 'Tocca il pulsante Condividi nella barra in fondo a Safari',
    },
    {
      // Step 1 – Il foglio di condivisione è aperto dal basso (~50% schermo occupato)
      // La bolla nella metà superiore
      wrapperClass: 'top-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
      arrowFirst: false,
      arrowDir: 'down',
      icon: null,
      label: 'Passo 2 di 3',
      text: 'Nel menu che appare, tocca "Aggiungi a schermata Home"',
    },
    {
      // Step 2 – Dialog conferma: il pulsante Aggiungi è in alto a destra
      wrapperClass: 'top-[30%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
      arrowFirst: true,
      arrowDir: 'up',
      icon: null,
      label: 'Passo 3 di 3',
      text: 'Tocca "Aggiungi" in alto a destra per completare l\'installazione',
    },
  ],
};

// ── Componente principale ─────────────────────────────────────────────────────

export default function PwaInstallGuide({ forceShow = false, onDismiss: onDismissProp }) {
  const [device, setDevice] = useState(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const d = detectDevice();
    if (d === 'installed' || d === 'desktop') return;
    setDevice(d);

    if (forceShow) { setStep(0); setVisible(true); return; }

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch { return; }

    setStep(0);
    setVisible(true);
  }, [forceShow]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    if (onDismissProp) onDismissProp();
  };

  const next = () => {
    const steps = STEPS[device] || [];
    if (step >= steps.length - 1) { dismiss(); } else { setStep(s => s + 1); }
  };

  if (!visible || !device) return null;

  const steps = STEPS[device] || [];
  const s = steps[step];
  if (!s) return null;

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Sfondo */}
      <div className="absolute inset-0 bg-black/55 pointer-events-auto" onClick={dismiss} />

      {/* Step corrente */}
      <div className={`absolute ${s.wrapperClass} pointer-events-auto`}>
        {s.arrowFirst && (
          <div className="flex justify-end pr-2">
            <Arrow direction={s.arrowDir} />
          </div>
        )}
        <Bubble
          icon={s.icon}
          label={s.label}
          text={s.text}
          onNext={next}
          onDismiss={dismiss}
          isLast={isLast}
          step={step}
        />
        {!s.arrowFirst && (
          <div className="flex justify-center">
            <Arrow direction={s.arrowDir} />
          </div>
        )}
      </div>
    </div>
  );
}

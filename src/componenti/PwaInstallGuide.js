import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, MoreVertical, Share, Plus, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'pwa_guide_shown';
const AUTO_MS = 5000;

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

// ── Freccia SVG ───────────────────────────────────────────────────────────────

function Arrow({ direction }) {
  const defs = {
    up:         { vb: '0 0 40 80', line: 'M20 72 L20 14', poly: '8,26 20,6 32,26' },
    down:       { vb: '0 0 40 80', line: 'M20 8 L20 66',  poly: '8,54 20,74 32,54' },
    'up-right': { vb: '0 0 80 80', line: 'M10 70 L62 18', poly: '47,10 72,16 64,40' },
  };
  const d = defs[direction] || defs.up;
  return (
    <svg viewBox={d.vb} className="drop-shadow-lg shrink-0"
      style={{ width: direction === 'up-right' ? 48 : 32, height: direction === 'up-right' ? 48 : 64 }}
      fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d.line} stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points={d.poly} fill="white" />
    </svg>
  );
}

// ── Progress bar automatica ───────────────────────────────────────────────────

function ProgressBar({ running, onComplete, resetKey }) {
  const [width, setWidth] = useState(0);
  const start = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    setWidth(0);
    start.current = null;
    if (!running) return;

    const tick = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const pct = Math.min((elapsed / AUTO_MS) * 100, 100);
      setWidth(pct);
      if (pct < 100) {
        raf.current = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resetKey]);

  return (
    <div className="h-0.5 bg-n-100 rounded-full overflow-hidden mt-3">
      <div
        className="h-full bg-ama-400 rounded-full transition-none"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Bolla ─────────────────────────────────────────────────────────────────────

function Bubble({ label, text, onNext, onDismiss, step, total, resetKey }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl px-5 py-4 w-72 max-w-[88vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-n-400 uppercase tracking-widest">{label}</span>
        <button onClick={onDismiss} className="text-n-200 p-1 -mr-1 -mt-1">
          <X size={14} />
        </button>
      </div>

      {/* Testo con icone inline */}
      <p className="text-sm text-n-800 leading-snug">{typeof text === 'function' ? text() : text}</p>

      {/* Progress + bottone */}
      <ProgressBar running onComplete={onNext} resetKey={resetKey} />

      <div className="flex items-center justify-between mt-3">
        {/* Pallini */}
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-ama-500' : 'bg-n-200'}`} />
          ))}
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-1 px-3 py-1.5 bg-ama-500 text-white rounded-xl text-xs font-semibold active:bg-ama-700"
        >
          Avanti <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Step definitions ──────────────────────────────────────────────────────────

const ic = (Icon, cls = '') => <Icon size={13} className={`inline -mt-0.5 mx-0.5 ${cls}`} />;

const STEPS = {
  android: [
    {
      // Step 0 – 3 puntini
      wrapperClass: 'top-14 right-3 flex flex-col items-end gap-1',
      arrowFirst: true,
      arrowDir: 'up-right',
      label: 'Passo 1 di 3',
      text: () => (
        <span>
          Tocca i <strong>3 puntini</strong> {ic(MoreVertical, 'text-n-700')} in alto a destra
          per aprire il menu del browser
        </span>
      ),
    },
    {
      // Step 1 – Condividi
      wrapperClass: 'top-[42%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2',
      arrowFirst: true,
      arrowDir: 'up',
      label: 'Passo 2 di 3',
      text: () => (
        <span>
          Nel menu che si apre, scegli <strong>Condividi</strong> {ic(Share, 'text-n-700')}
        </span>
      ),
    },
    {
      // Step 2 – Aggiungi a Home
      wrapperClass: 'top-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2',
      arrowFirst: false,
      arrowDir: 'down',
      label: 'Passo 3 di 3',
      text: () => (
        <span>
          Scorri il foglio e scegli <strong>"Aggiungi a schermata Home"</strong>{' '}
          {ic(Plus, 'text-n-700')} poi conferma con <strong>Aggiungi</strong>
        </span>
      ),
    },
  ],
  ios: [
    {
      // Step 0 – Condividi Safari
      wrapperClass: 'bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
      arrowFirst: false,
      arrowDir: 'down',
      label: 'Passo 1 di 2',
      text: () => (
        <span>
          Tocca il pulsante <strong>Condividi</strong> {ic(Share, 'text-n-700')} nella barra
          in fondo a Safari
        </span>
      ),
    },
    {
      // Step 1 – Aggiungi a Home
      wrapperClass: 'top-[18%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2',
      arrowFirst: false,
      arrowDir: 'down',
      label: 'Passo 2 di 2',
      text: () => (
        <span>
          Scorri il menu che appare e scegli <strong>"Aggiungi a schermata Home"</strong>{' '}
          {ic(Plus, 'text-n-700')} — poi tocca <strong>Aggiungi</strong> in alto a destra
        </span>
      ),
    },
  ],
};

// ── Componente principale ─────────────────────────────────────────────────────

export default function PwaInstallGuide({ forceShow = false, onDismiss: onDismissProp }) {
  const [device, setDevice] = useState(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const d = detectDevice();
    if (d === 'installed' || d === 'desktop') return;
    setDevice(d);

    if (forceShow) { setStep(0); setResetKey(k => k + 1); setVisible(true); return; }

    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch { return; }

    setStep(0);
    setResetKey(k => k + 1);
    setVisible(true);
  }, [forceShow]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    if (onDismissProp) onDismissProp();
  }, [onDismissProp]);

  const next = useCallback(() => {
    const total = (STEPS[device] || []).length;
    setStep(s => (s + 1) % total);
    setResetKey(k => k + 1);
  }, [device]);

  if (!visible || !device) return null;

  const steps = STEPS[device] || [];
  const s = steps[step];
  if (!s) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute inset-0 bg-black/55 pointer-events-auto" onClick={dismiss} />

      <div className={`absolute ${s.wrapperClass} pointer-events-auto`}>
        {s.arrowFirst && <Arrow direction={s.arrowDir} />}
        <Bubble
          label={s.label}
          text={s.text}
          onNext={next}
          onDismiss={dismiss}
          step={step}
          total={steps.length}
          resetKey={resetKey}
        />
        {!s.arrowFirst && <Arrow direction={s.arrowDir} />}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiFetch } from '../utils/api';

let stripePromise = null;

async function getStripe() {
  if (!stripePromise) {
    const { publishableKey } = await apiFetch('/api/stripe/config');
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

// ── Pagamento singolo (PaymentIntent) ────────────────────────────────────────
function FormPagamento({ label, onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrore('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErrore(error.message || 'Errore nel pagamento.');
      onError?.(error);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess?.(paymentIntent);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {errore && <p className="text-sm text-red-500 text-center">{errore}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        {loading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : label}
      </button>
    </form>
  );
}

// ── Abbonamento (SetupIntent → conferma → crea subscription) ─────────────────
function FormAbbonamento({ onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrore('');

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErrore(error.message || 'Errore nella configurazione della carta.');
      onError?.(error);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/stripe/abbonamento', {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
      });
      if (res.clientSecret) {
        const { error: piErr } = await stripe.confirmCardPayment(res.clientSecret);
        if (piErr) throw new Error(piErr.message);
      }
      onSuccess?.(res);
    } catch (err) {
      setErrore(err.message || "Errore nell'attivazione abbonamento.");
      onError?.(err);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {errore && <p className="text-sm text-red-500 text-center">{errore}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        {loading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : 'Attiva addebito mensile'}
      </button>
    </form>
  );
}

// ── Wrapper ────────────────────────────────────────────────────────────────────
// mode: 'arretrati' | 'abbonamento'
// mesi: [{anno, mese, importo}]  — richiesto solo per 'arretrati'
export default function StripePayment({ mode, mesi = [], onSuccess, onError }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [totale, setTotale]             = useState(null);
  const [stripeObj, setStripeObj]       = useState(null);
  const [errore, setErrore]             = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStripe();
        if (cancelled) return;
        setStripeObj(s);

        if (mode === 'arretrati') {
          const d = await apiFetch('/api/stripe/payment-intent', {
            method: 'POST',
            body: JSON.stringify({ mesi }),
          });
          if (!cancelled) { setClientSecret(d.clientSecret); setTotale(d.totale); }
        } else {
          const d = await apiFetch('/api/stripe/setup-intent', { method: 'POST' });
          if (!cancelled) setClientSecret(d.clientSecret);
        }
      } catch {
        if (!cancelled) setErrore('Impossibile avviare il pagamento. Riprova.');
      }
    })();
    return () => { cancelled = true; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (errore) return <p className="text-center text-sm text-red-500 py-6">{errore}</p>;

  if (!clientSecret || !stripeObj) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const appearance = {
    theme: 'stripe',
    variables: { colorPrimary: '#4f46e5', borderRadius: '12px', fontFamily: 'inherit' },
  };

  return (
    <Elements stripe={stripeObj} options={{ clientSecret, appearance, locale: 'it' }}>
      {mode === 'arretrati' ? (
        <FormPagamento
          label={totale !== null ? `Paga €${totale.toFixed(2)}` : 'Paga ora'}
          onSuccess={onSuccess}
          onError={onError}
        />
      ) : (
        <FormAbbonamento onSuccess={onSuccess} onError={onError} />
      )}
    </Elements>
  );
}

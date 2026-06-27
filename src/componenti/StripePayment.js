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

// ── Form pagamento singolo (PaymentIntent) ────────────────────────────────
function CheckoutFormPagamento({ onSuccess, onError, label = 'Paga ora' }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading]     = useState(false);
  const [messaggio, setMessaggio] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setMessaggio('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessaggio(error.message || 'Errore nel pagamento.');
      onError?.(error);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess?.(paymentIntent);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {messaggio && <p className="text-sm text-center font-medium text-red-500">{messaggio}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : label}
      </button>
    </form>
  );
}

// ── Form abbonamento (SetupIntent → conferma → crea sub) ──────────────────
function CheckoutFormAbbonamento({ onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading]     = useState(false);
  const [messaggio, setMessaggio] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setMessaggio('');

    // 1. Conferma il SetupIntent per salvare la carta
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessaggio(error.message || 'Errore nella configurazione della carta.');
      onError?.(error);
      setLoading(false);
      return;
    }

    // 2. Crea l'abbonamento con il payment method confermato
    try {
      const res = await apiFetch('/api/stripe/abbonamento', {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
      });

      if (res.clientSecret) {
        // Primo addebito richiede conferma
        const { error: piError } = await stripe.confirmCardPayment(res.clientSecret);
        if (piError) throw new Error(piError.message);
      }
      onSuccess?.(res);
    } catch (err) {
      setMessaggio(err.message || 'Errore nell\'attivazione abbonamento.');
      onError?.(err);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {messaggio && <p className="text-sm text-center font-medium text-red-500">{messaggio}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Attiva addebito mensile'}
      </button>
    </form>
  );
}

// ── Wrapper pubblico ──────────────────────────────────────────────────────
// mode: 'arretrati' | 'abbonamento'
// mesi: [{anno, mese, importo}]  (solo per arretrati)
// priceId: string                (solo per abbonamento)
export default function StripePayment({ mode, mesi = [], priceId, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [totale, setTotale]             = useState(null);
  const [stripeObj, setStripeObj]       = useState(null);
  const [errore, setErrore]             = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStripe();
        if (!cancelled) setStripeObj(s);

        if (mode === 'arretrati') {
          const d = await apiFetch('/api/stripe/payment-intent', {
            method: 'POST',
            body: JSON.stringify({ mesi }),
          });
          if (!cancelled) { setClientSecret(d.clientSecret); setTotale(d.totale); }
        } else if (mode === 'abbonamento') {
          const d = await apiFetch('/api/stripe/setup-intent', { method: 'POST' });
          if (!cancelled) setClientSecret(d.clientSecret);
        }
      } catch (e) {
        if (!cancelled) setErrore('Impossibile avviare il pagamento. Riprova.');
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  if (errore) return (
    <div className="text-center py-8 text-red-500 text-sm">{errore}</div>
  );

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
      <div className="space-y-4">
        {mode === 'arretrati' && totale !== null && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Totale da pagare</p>
            <p className="text-2xl font-bold text-indigo-700">€{totale.toFixed(2)}</p>
          </div>
        )}
        {mode === 'abbonamento' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
            Inserisci la carta per attivare l'addebito mensile automatico. Verrà addebitata la tua quota ogni mese. Potrai annullare in qualsiasi momento contattando la segreteria.
          </div>
        )}
        {mode === 'arretrati'
          ? <CheckoutFormPagamento
              label={`Paga €${totale?.toFixed(2)}`}
              onSuccess={onSuccess}
              onError={() => {}}
            />
          : <CheckoutFormAbbonamento
              onSuccess={onSuccess}
              onError={() => {}}
            />
        }
      </div>
    </Elements>
  );
}

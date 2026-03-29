'use client';

import { createContext, useContext, useState } from 'react';

type IntervalContextType = {
  interval: 'month' | 'year';
  setInterval: (interval: 'month' | 'year') => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
};

const IntervalContext = createContext<IntervalContextType>({
  interval: 'month',
  setInterval: () => {},
  couponCode: '',
  setCouponCode: () => {},
});

export function useBillingInterval() {
  return useContext(IntervalContext);
}

export function PricingIntervalProvider({ children }: { children: React.ReactNode }) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [couponCode, setCouponCode] = useState('');

  return (
    <IntervalContext.Provider value={{ interval, setInterval, couponCode, setCouponCode }}>
      {children}
    </IntervalContext.Provider>
  );
}

export function PricingIntervalToggle() {
  const { interval, setInterval } = useBillingInterval();

  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 p-0.5">
      <button
        type="button"
        onClick={() => setInterval('month')}
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          interval === 'month'
            ? 'bg-white text-slate-900'
            : 'text-white/70 hover:text-white'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => setInterval('year')}
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          interval === 'year'
            ? 'bg-white text-slate-900'
            : 'text-white/70 hover:text-white'
        }`}
      >
        Annual
      </button>
    </div>
  );
}

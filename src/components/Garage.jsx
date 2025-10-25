import React, { useMemo } from 'react';
import { Check, ArrowLeft } from 'lucide-react';

const CARS = [
  { name: 'Porsche', desc: 'Sleek, agile, high acceleration.', color: '#e11d48' },
  { name: 'BMW', desc: 'Balanced handling and speed.', color: '#60a5fa' },
  { name: 'G-Wagon', desc: 'Heavy, stable, strong braking.', color: '#d1d5db' },
  { name: 'Supra', desc: 'High top speed, stylish.', color: '#f59e0b' },
  { name: 'Bolero', desc: 'Rugged, reliable on rough roads.', color: '#10b981' },
  { name: 'Mahindra Marshal', desc: 'Classic utility, steady control.', color: '#a78bfa' },
];

export default function Garage({ selected, onSelect, onBack }) {
  const items = useMemo(() => CARS, []);
  return (
    <div className="relative w-full h-dvh bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white overflow-hidden">
      <header className="flex items-center justify-between px-6 sm:px-10 py-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 border border-white/15">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-lg font-semibold">Garage</div>
        <div className="w-[80px]" />
      </header>

      <div className="px-6 sm:px-10 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((c) => (
            <button key={c.name} onClick={() => onSelect?.(c.name)} className={`group relative rounded-2xl p-4 border ${selected === c.name ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition text-left`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{c.name}</div>
                  <div className="text-xs text-white/70">{c.desc}</div>
                </div>
                {selected === c.name && <Check className="text-green-400" />}
              </div>
              <div className="mt-4 h-32 w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${c.color} 0%, #111 100%)` }} />
              <div className="mt-3 text-xs text-white/60">Soft lighting • Rotating platform • High detail</div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={onBack} className="rounded-xl bg-white/10 hover:bg-white/20 px-5 py-3 border border-white/15">Select Car</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const ENVS = [
  { key: 'City', title: 'Modern City', desc: 'Tall buildings, neon and traffic.', preview: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)' },
  { key: 'Village', title: 'Indian Village', desc: 'Trees, huts and cows.', preview: 'linear-gradient(135deg, #0b2e13 0%, #0f172a 100%)' },
  { key: 'Highway', title: 'Highway', desc: 'Barriers and trucks.', preview: 'linear-gradient(135deg, #0b0b0b 0%, #1f2937 100%)' },
  { key: 'Market', title: 'Local Market', desc: 'People walking, local shops.', preview: 'linear-gradient(135deg, #2c0d0d 0%, #111827 100%)' },
];

export default function EnvironmentSelector({ selected, onSelect, onBack }) {
  return (
    <div className="relative w-full h-dvh bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white overflow-hidden">
      <header className="flex items-center justify-between px-6 sm:px-10 py-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 border border-white/15">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-lg font-semibold">Background Environments</div>
        <div className="w-[80px]" />
      </header>

      <div className="px-6 sm:px-10 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ENVS.map((e) => (
            <button key={e.key} onClick={() => onSelect?.(e.key)} className={`group relative rounded-2xl p-4 border ${selected === e.key ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition text-left`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{e.title}</div>
                  <div className="text-xs text-white/70">{e.desc}</div>
                </div>
                {selected === e.key && <Check className="text-green-400" />}
              </div>
              <div className="mt-4 h-32 w-full rounded-xl" style={{ background: e.preview }} />
              <div className="mt-3 text-xs text-white/60">Animated preview • Glowing selection</div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={onBack} className="rounded-xl bg-white/10 hover:bg-white/20 px-5 py-3 border border-white/15">Back</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Spline from '@splinetool/react-spline';
import { Play, Car, Settings, Trophy, Timer } from 'lucide-react';

export default function MainMenu({ startGame, openGarage, openEnvironments, highestScore, settings, setSettings }) {
  return (
    <div className="relative w-full h-dvh bg-neutral-950">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/m8wpIQzXWhEh9Yek/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-white/10 backdrop-blur-sm grid place-items-center text-red-500 font-bold">RD</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Realistic Drive India</h1>
            <p className="text-xs sm:text-sm text-white/70">Created by Manmohan | Instagram @manxpaa</p>
          </div>
        </div>
        <div className="text-white/80 text-xs sm:text-sm flex items-center gap-2">
          <Trophy size={16} /> Highest Score: <span className="font-semibold">{highestScore}</span>
        </div>
      </header>

      <main className="relative z-10 h-[calc(100dvh-72px)] flex flex-col lg:flex-row items-center justify-center gap-8 px-6 sm:px-10">
        <div className="w-full lg:w-[520px] max-w-[720px] bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Game Modes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => startGame('Endless')} className="group w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4">
              <div className="text-left">
                <div className="font-semibold">Endless Drive</div>
                <div className="text-xs text-white/70">Survive as long as you can. +1 per second or 10m.</div>
              </div>
              <Play className="opacity-80 group-hover:opacity-100" />
            </button>
            <button onClick={() => startGame('Timed')} className="group w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4">
              <div className="text-left">
                <div className="font-semibold">Timed Challenge</div>
                <div className="text-xs text-white/70">Race the clock. Highest distance wins.</div>
              </div>
              <Timer className="opacity-80 group-hover:opacity-100" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={openGarage} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
              <Car size={18} /> Choose Car
            </button>
            <button onClick={openEnvironments} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
              <Settings size={18} /> Backgrounds
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Audio</h3>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={settings.music} onChange={(e) => setSettings((s) => ({ ...s, music: e.target.checked }))} /> Music
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={settings.sfx} onChange={(e) => setSettings((s) => ({ ...s, sfx: e.target.checked }))} /> SFX
              </label>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] max-w-[520px] bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl">
          <h3 className="text-lg font-semibold mb-4">Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-semibold mb-2">PC</div>
              <ul className="space-y-1 text-white/80">
                <li>← → to steer</li>
                <li>W accelerate, S brake</li>
                <li>Space for Nitro</li>
                <li>C change camera</li>
                <li>Esc Pause/Resume</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Mobile</div>
              <ul className="space-y-1 text-white/80">
                <li>On-screen arrows</li>
                <li>Speed / Brake buttons</li>
                <li>Nitro button</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/60">
            Hyper-realistic visuals are displayed on supported devices. Performance optimized for 60 FPS.
          </div>
        </div>
      </main>
    </div>
  );
}

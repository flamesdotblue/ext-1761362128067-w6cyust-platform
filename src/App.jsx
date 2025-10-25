import React, { useEffect, useMemo, useState } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import Garage from './components/Garage';
import EnvironmentSelector from './components/EnvironmentSelector';

const DEFAULT_SETTINGS = {
  car: 'Porsche',
  environment: 'City',
  mode: 'Endless',
  music: true,
  sfx: true,
};

export default function App() {
  const [view, setView] = useState('menu'); // 'menu' | 'game' | 'garage' | 'environments'
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rd_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [highestScore, setHighestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('rd_highest')) || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rd_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleGameOver = (score) => {
    if (score > highestScore) {
      setHighestScore(score);
      try {
        localStorage.setItem('rd_highest', String(score));
      } catch {}
    }
    setView('menu');
  };

  const startGame = (mode) => {
    setSettings((s) => ({ ...s, mode }));
    setView('game');
  };

  const menuProps = useMemo(() => ({
    startGame,
    openGarage: () => setView('garage'),
    openEnvironments: () => setView('environments'),
    highestScore,
    settings,
    setSettings,
  }), [highestScore, settings]);

  return (
    <div className="w-full h-dvh bg-black text-white overflow-hidden">
      {view === 'menu' && (
        <MainMenu {...menuProps} />
      )}
      {view === 'game' && (
        <GameCanvas
          car={settings.car}
          environment={settings.environment}
          mode={settings.mode}
          music={settings.music}
          sfx={settings.sfx}
          onExit={() => setView('menu')}
          onGameOver={handleGameOver}
        />
      )}
      {view === 'garage' && (
        <Garage
          selected={settings.car}
          onSelect={(car) => setSettings((s) => ({ ...s, car }))}
          onBack={() => setView('menu')}
        />
      )}
      {view === 'environments' && (
        <EnvironmentSelector
          selected={settings.environment}
          onSelect={(environment) => setSettings((s) => ({ ...s, environment }))}
          onBack={() => setView('menu')}
        />
      )}
      <div className="pointer-events-none fixed bottom-1 right-2 text-xs text-white/70 select-none">
        Created by Manmohan | Instagram @manxpaa
      </div>
    </div>
  );
}

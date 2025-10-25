import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Home, X } from 'lucide-react';

// Simple 2.5D runner-style canvas game to simulate the requested experience
// Features: Endless/Timed modes, keyboard + on-screen controls, scoring, nitro, pause, game over

const LANE_COUNT = 4;
const ROAD_WIDTH = 360; // px visual width for lanes container
const CAR_WIDTH = 48;
const CAR_LENGTH = 88;
const LANE_GAP = ROAD_WIDTH / LANE_COUNT;
const INITIAL_SPEED = 6; // px per frame baseline road speed

const ENV_PRESETS = {
  City: {
    bg: 'linear-gradient(180deg, #0b0b0f 0%, #121218 60%, #0b0b10 100%)',
    roadColor: '#1b1c23',
    stripeColor: '#ffffff',
    side: '#0e0f14',
  },
  Village: {
    bg: 'linear-gradient(180deg, #0a0e09 0%, #121a12 60%, #0a0e09 100%)',
    roadColor: '#1d2a1f',
    stripeColor: '#d6ffb5',
    side: '#0f160f',
  },
  Highway: {
    bg: 'linear-gradient(180deg, #0a0a0a 0%, #141414 60%, #0a0a0a 100%)',
    roadColor: '#151515',
    stripeColor: '#e9e9e9',
    side: '#0d0d0d',
  },
  Market: {
    bg: 'linear-gradient(180deg, #0d0a0a 0%, #1a0f0f 60%, #0d0a0a 100%)',
    roadColor: '#1e1413',
    stripeColor: '#ffd7c9',
    side: '#120c0b',
  },
};

const CAR_COLORS = {
  Porsche: '#e11d48',
  BMW: '#60a5fa',
  'G-Wagon': '#d1d5db',
  Supra: '#f59e0b',
  Bolero: '#10b981',
  'Mahindra Marshal': '#a78bfa',
};

export default function GameCanvas({ car, environment, mode, onExit, onGameOver, music, sfx }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({});

  const [paused, setPaused] = useState(false);
  const [camera, setCamera] = useState('third'); // 'third' | 'cockpit'
  const [showOver, setShowOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [highest, setHighest] = useState(() => Number(localStorage.getItem('rd_highest')) || 0);
  const [speedFactor, setSpeedFactor] = useState(1);

  const env = useMemo(() => ENV_PRESETS[environment] || ENV_PRESETS.City, [environment]);

  const playSFX = useCallback((type) => {
    if (!sfx) return;
    const audio = new Audio();
    if (type === 'horn') audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-car-horn-718.mp3';
    if (type === 'crash') audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-metal-hit-woosh-1485.mp3';
    if (type === 'nitro') audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-fast-rocket-whoosh-1714.mp3';
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }, [sfx]);

  useEffect(() => {
    let loopStartTime = performance.now();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const { clientWidth, clientHeight } = c;
      c.width = Math.floor(clientWidth * DPR);
      c.height = Math.floor(clientHeight * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const init = () => {
      resize();
      const laneX = (lane) => Math.floor((cW / 2 - ROAD_WIDTH / 2) + lane * LANE_GAP + (LANE_GAP - CAR_WIDTH) / 2);

      const cW = canvasRef.current.clientWidth;
      const cH = canvasRef.current.clientHeight;
      const player = {
        lane: 1,
        x: laneX(1),
        y: cH - CAR_LENGTH - 40,
        vx: 0,
        speed: INITIAL_SPEED,
        nitro: 0,
        nitroCD: 0,
        accel: 0,
        brake: 0,
      };
      const cars = [];
      for (let i = 0; i < 8; i++) {
        cars.push(spawnCar(cH, laneX));
      }
      const stripes = new Array(20).fill(0).map((_, i) => ({ y: i * 40 }));
      const weather = { t: 0, type: Math.random() < 0.33 ? 'sunny' : Math.random() < 0.5 ? 'cloudy' : 'rainy' };

      stateRef.current = { cW, cH, laneX, player, cars, stripes, weather, score: 0, timeLeft: mode === 'Timed' ? 60 : null, running: true, keys: {}, startedAt: performance.now(), lastTick: performance.now() };
    };

    const spawnCar = (cH, laneX) => {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      return {
        lane,
        x: laneX(lane),
        y: -Math.random() * cH - CAR_LENGTH,
        speed: INITIAL_SPEED * (0.7 + Math.random() * 1.4),
        color: ['#9ca3af', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 5)],
      };
    };

    init();
    const onResize = () => init();
    window.addEventListener('resize', onResize);

    const keyDown = (e) => {
      const st = stateRef.current;
      st.keys[e.key.toLowerCase()] = true;
      if (e.key === 'ArrowLeft') st.keys['left'] = true;
      if (e.key === 'ArrowRight') st.keys['right'] = true;
      if (e.key === ' ') st.keys['space'] = true;
      if (e.key === 'Escape') togglePause();
      if (e.key.toLowerCase() === 'c') setCamera((c) => (c === 'third' ? 'cockpit' : 'third'));
    };
    const keyUp = (e) => {
      const st = stateRef.current;
      st.keys[e.key.toLowerCase()] = false;
      if (e.key === 'ArrowLeft') st.keys['left'] = false;
      if (e.key === 'ArrowRight') st.keys['right'] = false;
      if (e.key === ' ') st.keys['space'] = false;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const togglePause = () => {
      setPaused((p) => !p);
      stateRef.current.running = !stateRef.current.running;
    };

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      const st = stateRef.current;
      if (!st.running) return render(ctx, st);

      const dt = Math.min(32, now - st.lastTick);
      st.lastTick = now;

      update(st, dt / 16.6667);
      render(ctx, st);
    };

    rafRef.current = requestAnimationFrame(loop);

    function update(st, dt) {
      const p = st.player;
      // steering
      if (st.keys['arrowleft'] || st.keys['a'] || st.keys['left']) p.lane = Math.max(0, p.lane - (st.keys['_steerL'] ? 0 : 0));
      if (st.keys['arrowright'] || st.keys['d'] || st.keys['right']) p.lane = Math.min(LANE_COUNT - 1, p.lane + (st.keys['_steerR'] ? 0 : 0));
      // smooth lane snapping
      const targetX = st.laneX(p.lane);
      p.x += (targetX - p.x) * 0.2 * dt;

      // accelerate / brake
      const accelKey = st.keys['w'];
      const brakeKey = st.keys['s'];
      const maxSpeed = 14 * speedFactor + (camera === 'cockpit' ? 2 : 0);
      if (accelKey) p.speed = Math.min(maxSpeed, p.speed + 0.2 * dt);
      if (brakeKey) p.speed = Math.max(2, p.speed - 0.3 * dt);

      // nitro
      if (st.keys['space'] && p.nitroCD <= 0) {
        p.nitro = 1.2; // seconds
        p.nitroCD = 6; // cooldown seconds
        playSFX('nitro');
      }
      if (p.nitro > 0) {
        p.nitro -= 0.016 * dt * 60 / 60;
        p.speed = Math.min(maxSpeed + 6, p.speed + 0.7 * dt);
      } else {
        p.speed = Math.max(4 * speedFactor, p.speed - 0.05 * dt);
      }
      if (p.nitroCD > 0) p.nitroCD -= 0.016 * dt * 60 / 60;

      const roadSpeed = p.speed;

      // stripes
      for (const s of st.stripes) {
        s.y += roadSpeed * dt * 1.5;
        if (s.y > st.cH) s.y -= st.cH + 40;
      }

      // other cars
      for (const oc of st.cars) {
        oc.y += (roadSpeed + oc.speed * 0.2) * dt;
        if (oc.y > st.cH + CAR_LENGTH) {
          // respawn above
          const idx = st.cars.indexOf(oc);
          st.cars[idx] = {
            ...oc,
            lane: Math.floor(Math.random() * LANE_COUNT),
            x: st.laneX(Math.floor(Math.random() * LANE_COUNT)),
            y: -Math.random() * st.cH - CAR_LENGTH,
            speed: INITIAL_SPEED * (0.7 + Math.random() * 1.4),
          };
        }
      }

      // collisions
      for (const oc of st.cars) {
        const dx = Math.abs((p.x + CAR_WIDTH / 2) - (oc.x + CAR_WIDTH / 2));
        const dy = Math.abs((p.y + CAR_LENGTH / 2) - (oc.y + CAR_LENGTH / 2));
        if (dx < CAR_WIDTH * 0.8 && dy < CAR_LENGTH * 0.7) {
          // crash
          st.running = false;
          setPaused(false);
          setShowOver(true);
          setFinalScore(Math.floor(st.score));
          if (sfx) playSFX('crash');
          if (typeof onGameOver === 'function') onGameOver(Math.floor(st.score));
          return;
        }
      }

      // scoring
      if (mode === 'Endless') {
        st.score += dt; // ~1 point per second
        st.score += (roadSpeed * dt) / 10 / 10; // ~1 per 10m if we treat px as cmish
      } else if (mode === 'Timed') {
        st.timeLeft -= 0.016 * dt * 60 / 60;
        if (st.timeLeft <= 0) {
          st.running = false;
          setShowOver(true);
          setFinalScore(Math.floor(st.score));
          if (typeof onGameOver === 'function') onGameOver(Math.floor(st.score));
          return;
        }
        st.score += (roadSpeed * dt) / 10 / 10;
      }

      // weather anim
      st.weather.t += 0.002 * dt;
    }

    function render(ctx, st) {
      // background
      ctx.clearRect(0, 0, st.cW, st.cH);
      // bg gradient handled by parent container; draw parallax entities

      // side areas
      ctx.fillStyle = env.side;
      ctx.fillRect(0, 0, (st.cW - ROAD_WIDTH) / 2, st.cH);
      ctx.fillRect(st.cW - (st.cW - ROAD_WIDTH) / 2, 0, (st.cW - ROAD_WIDTH) / 2, st.cH);

      // road
      ctx.fillStyle = env.roadColor;
      ctx.fillRect((st.cW - ROAD_WIDTH) / 2, 0, ROAD_WIDTH, st.cH);

      // lane stripes
      ctx.strokeStyle = env.stripeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      for (let i = 1; i < LANE_COUNT; i++) {
        const x = (st.cW - ROAD_WIDTH) / 2 + i * LANE_GAP;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, st.cH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // moving stripes
      ctx.fillStyle = env.stripeColor;
      const stripeW = 6;
      const stripeH = 24;
      for (const s of st.stripes) {
        const cx = st.cW / 2;
        ctx.fillRect(cx - stripeW / 2, s.y, stripeW, stripeH);
      }

      // other cars
      for (const oc of st.cars) {
        drawCar(ctx, oc.x, oc.y, oc.color, 0.6);
      }

      // player car
      drawCar(ctx, st.player.x, st.player.y, CAR_COLORS[car] || '#ef4444', 1, camera);

      // rain overlay if rainy
      if (st.weather.type === 'rainy') {
        ctx.strokeStyle = 'rgba(180,200,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * st.cW;
          const y = Math.random() * st.cH;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 4, y + 12);
          ctx.stroke();
        }
      }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(12, 12, 170, 68);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`Mode: ${mode}`, 20, 30);
      ctx.fillText(`Score: ${Math.floor(st.score)}`, 20, 48);
      if (mode === 'Timed') ctx.fillText(`Time: ${Math.max(0, Math.ceil(st.timeLeft))}s`, 20, 66);
    }

    function drawCar(ctx, x, y, color, shade = 1, cam = 'third') {
      // body
      const w = CAR_WIDTH;
      const h = CAR_LENGTH;
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, shade < 1 ? color : lighten(color, 0.15));
      grad.addColorStop(1, shade < 1 ? darken(color, 0.25) : darken(color, 0.1));
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      // windshield
      ctx.fillStyle = 'rgba(20,30,40,0.7)';
      ctx.fillRect(x + 6, y + 10, w - 12, 16);
      // lights
      ctx.fillStyle = 'rgba(255, 240, 200, 0.8)';
      ctx.fillRect(x + 8, y + h - 6, 8, 3);
      ctx.fillRect(x + w - 16, y + h - 6, 8, 3);
      // cockpit overlay
      if (cam === 'cockpit') {
        // vignette
        const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 20, x + w / 2, y + h / 2, 200);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    }

    function lighten(hex, amt) {
      const c = parseInt(hex.slice(1), 16);
      const r = Math.min(255, ((c >> 16) & 255) + Math.floor(255 * amt));
      const g = Math.min(255, ((c >> 8) & 255) + Math.floor(255 * amt));
      const b = Math.min(255, (c & 255) + Math.floor(255 * amt));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    function darken(hex, amt) {
      const c = parseInt(hex.slice(1), 16);
      const r = Math.max(0, ((c >> 16) & 255) - Math.floor(255 * amt));
      const g = Math.max(0, ((c >> 8) & 255) - Math.floor(255 * amt));
      const b = Math.max(0, (c & 255) - Math.floor(255 * amt));
      const out = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      return out;
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [mode, environment, car, speedFactor, camera, onGameOver, sfx, playSFX]);

  const handleRestart = () => {
    setShowOver(false);
    setPaused(false);
    // re-init by forcing effect to run: tweak speedFactor briefly
    setSpeedFactor((s) => s + 0.0001);
  };

  const togglePause = () => {
    const st = stateRef.current;
    st.running = !st.running;
    setPaused(!paused);
  };

  useEffect(() => {
    let musicEl;
    if (music) {
      musicEl = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_8e2f1b1b51.mp3?filename=night-street-ambient-140277.mp3');
      musicEl.loop = true;
      musicEl.volume = 0.25;
      const play = () => musicEl.play().catch(() => {});
      const i = setTimeout(play, 300);
      return () => { clearTimeout(i); musicEl.pause(); musicEl.src = ''; };
    }
  }, [music, mode, environment]);

  useEffect(() => {
    const st = stateRef.current;
    st && (st._speedFactor = speedFactor);
  }, [speedFactor]);

  const currentScore = Math.floor(stateRef.current?.score || 0);
  const timeLeft = Math.max(0, Math.ceil(stateRef.current?.timeLeft || 0));

  return (
    <div className="relative w-full h-dvh" style={{ background: env.bg }}>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="absolute top-3 left-3 flex gap-2 z-20">
        <button onClick={togglePause} className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 border border-white/15">
          {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={() => { setShowOver(true); setFinalScore(currentScore); }} className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 border border-white/15">
          <X size={16} /> End Run
        </button>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
          <span className="text-sm">Speed</span>
          <input type="range" min="0.6" max="1.6" step="0.05" value={speedFactor} onChange={(e) => setSpeedFactor(parseFloat(e.target.value))} />
        </div>
        <button onClick={() => setCamera((c) => (c === 'third' ? 'cockpit' : 'third'))} className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 border border-white/15 text-sm">Camera: {camera === 'third' ? '3rd' : 'Cockpit'}</button>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-white/80 text-xs z-10">PC: Arrow keys to steer, W/S speed, Space Nitro. Mobile: Buttons below.</div>

      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 select-none">
        <button onTouchStart={() => (stateRef.current.keys['left'] = true)} onTouchEnd={() => (stateRef.current.keys['left'] = false)} className="active:scale-95 rounded-full h-14 w-14 grid place-items-center bg-white/10 border border-white/15">←</button>
        <div className="flex items-center gap-2">
          <button onTouchStart={() => (stateRef.current.keys['s'] = true)} onTouchEnd={() => (stateRef.current.keys['s'] = false)} className="active:scale-95 rounded-md h-12 px-4 grid place-items-center bg-white/10 border border-white/15">Brake</button>
          <button onTouchStart={() => (stateRef.current.keys['w'] = true)} onTouchEnd={() => (stateRef.current.keys['w'] = false)} className="active:scale-95 rounded-md h-12 px-4 grid place-items-center bg-white/10 border border-white/15">Speed</button>
          <button onTouchStart={() => (stateRef.current.keys['space'] = true)} onTouchEnd={() => (stateRef.current.keys['space'] = false)} className="active:scale-95 rounded-md h-12 px-4 grid place-items-center bg-white/10 border border-white/15">Nitro</button>
        </div>
        <button onTouchStart={() => (stateRef.current.keys['right'] = true)} onTouchEnd={() => (stateRef.current.keys['right'] = false)} className="active:scale-95 rounded-full h-14 w-14 grid place-items-center bg-white/10 border border-white/15">→</button>
      </div>

      <div className="absolute top-14 left-3 z-20 text-sm text-white/85">
        <div>Car: <span className="font-semibold">{car}</span></div>
        <div>Env: <span className="font-semibold">{environment}</span></div>
      </div>

      <div className="absolute top-14 right-3 z-20 text-sm text-white/85">
        <div>Score: <span className="font-semibold">{currentScore}</span></div>
        {mode === 'Timed' && <div>Time: <span className="font-semibold">{timeLeft}s</span></div>}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {showOver && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm grid place-items-center">
          <div className="w-[92%] max-w-[520px] bg-white/10 border border-white/15 rounded-2xl p-6 text-center">
            <div className="text-3xl">💥 You Crashed!</div>
            <div className="mt-2 text-white/80">Game Over</div>
            <div className="mt-4 text-lg">Score: <span className="font-semibold">{finalScore}</span> | Highest: <span className="font-semibold">{highest}</span></div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={handleRestart} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 border border-white/15">
                <RotateCcw size={16} /> Restart
              </button>
              <button onClick={() => onExit?.()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 border border-white/15">
                <Home size={16} /> Main Menu
              </button>
              <a href="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 border border-white/15">
                <X size={16} /> Exit
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

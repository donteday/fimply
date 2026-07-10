import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Add from './pages/Add';
import Analytics from './pages/Analytics';
import AI from './pages/AI';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import { SB } from './theme/colors';
import { F } from './theme/fonts';
import { PcmRecorder } from './services/recorder';
import { transcribeAudio } from './services/yandexStt';
import { parseVoiceInput } from './services/deepseek';

const TABS = [
  { name: 'Дом', path: '/' },
  { name: 'Счета', path: '/transactions' },
  { name: 'Данные', path: '/analytics' },
  { name: 'ИИ', path: '/ai' },
];

type OverlayState = 'hidden' | 'recording' | 'processing';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isModal = location.pathname === '/add' || location.pathname === '/settings' || location.pathname === '/goals';

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const activeIdx = TABS.findIndex(t => t.path === location.pathname);

  useEffect(() => {
    if (activeIdx === -1) { setPill(null); return; }
    const btn = tabRefs.current[activeIdx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setPill({ left: btnRect.left - containerRect.left, width: btnRect.width });
  }, [activeIdx, isModal]);

  // ── Hold-to-record ─────────────────────────────────────────────────────────
  const [overlay, setOverlay] = useState<OverlayState>('hidden');
  const [isPressed, setIsPressed] = useState(false);
  const isPressedRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderRef = useRef(new PcmRecorder());

  const handlePlusDown = () => {
    setIsPressed(true);
    isPressedRef.current = true;
    holdTimerRef.current = setTimeout(async () => {
      holdTimerRef.current = null;
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        await recorderRef.current.start();
        setOverlay('recording');
      } catch {}
    }, 200);
  };

  const handlePlusUp = async () => {
    setIsPressed(false);
    isPressedRef.current = false;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      navigate('/add');
      return;
    }
    if (overlay !== 'recording') return;
    setOverlay('processing');
    try {
      const blob = await recorderRef.current.stop();
      recorderRef.current = new PcmRecorder();
      const text = await transcribeAudio(blob);
      if (text) {
        const parsed = await parseVoiceInput(text);
        setOverlay('hidden');
        navigate('/add', parsed ? { state: { step: 'confirm', parsed } } : undefined);
      } else {
        setOverlay('hidden');
        navigate('/add');
      }
    } catch {
      recorderRef.current = new PcmRecorder();
      setOverlay('hidden');
      navigate('/add');
    }
  };

  const handlePlusCancel = () => {
    setIsPressed(false);
    isPressedRef.current = false;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      return;
    }
    if (overlay === 'recording') handlePlusUp();
  };

  // ── Particles canvas (visible only while pressed / recording) ─────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    };
    resize();
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    type P = { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number };
    const pts: P[] = [];
    let frameId: number;
    let tick = 0;

    const animate = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      tick++;

      if (isPressedRef.current) {
        // Radial glow from bottom-center (above + button)
        const gx = W / 2;
        const gy = H;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 100);
        grad.addColorStop(0, 'rgba(216,255,90,0.28)');
        grad.addColorStop(1, 'rgba(216,255,90,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Spawn particles
        if (tick % 4 === 0 && pts.length < 26) {
          pts.push({
            x: W * 0.25 + Math.random() * W * 0.5,
            y: H,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -(0.5 + Math.random() * 0.7),
            size: 1 + Math.random() * 2.5,
            life: 0,
            maxLife: 80 + Math.random() * 60,
          });
        }
      }

      // Draw + update existing particles (fade out naturally after release)
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const t = p.life / p.maxLife;
        const alpha = t < 0.18 ? (t / 0.18) * 0.85 : (1 - t) * 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216,255,90,${alpha.toFixed(2)})`;
        ctx.fill();
        if (p.life >= p.maxLife || p.y < 0) pts.splice(i, 1);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (isModal) return null;

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const tabStyle = (): React.CSSProperties => ({
    flex: 1,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    zIndex: 1,
  });

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: F.sansSemiBold,
    fontWeight: 600,
    fontSize: 12,
    color: active ? SB.lime : 'rgba(245,241,232,0.4)',
    transition: 'color 0.25s ease',
  });

  return (
    <>
      {/* Recording overlay */}
      {overlay !== 'hidden' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(16,15,12,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {overlay === 'recording' && (
              <>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 70, border: `1.5px solid ${SB.lime}`, animation: 'ringPulse 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 70, border: `1.5px solid ${SB.lime}`, animation: 'ringPulse 1.5s ease-out 0.6s infinite' }} />
              </>
            )}
            <div style={{
              width: 84, height: 84, borderRadius: 42,
              backgroundColor: overlay === 'recording' ? SB.danger : SB.card,
              border: `1.5px solid ${overlay === 'recording' ? SB.ink : SB.stroke}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: overlay === 'recording' ? `4px 4px 0px ${SB.ink}` : 'none',
              transition: 'background-color 0.2s ease',
            }}>
              <span style={{ fontSize: 34 }}>{overlay === 'processing' ? '…' : '🎤'}</span>
            </div>
          </div>
          <span style={{
            fontFamily: F.mono, fontSize: 11,
            color: overlay === 'recording' ? SB.lime : SB.dim,
            letterSpacing: 1.5, marginTop: 18,
          }}>
            {overlay === 'recording' ? '● ОТПУСТИ ЧТОБЫ ОТПРАВИТЬ' : 'ОБРАБАТЫВАЮ…'}
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 10,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        pointerEvents: 'none',
      }}>
        {/* Particle canvas — sits above the bar, only active on press */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: 160,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Tab bar pill */}
        <div
          ref={containerRef}
          style={{
            borderRadius: 28,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 6,
            paddingBottom: 6,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `0 -2px 12px rgba(216,255,90,0.12)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(16,15,12,0.72)',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Sliding pill background */}
          {pill && (
            <div style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: pill.left,
              width: pill.width,
              borderRadius: 22,
              backgroundColor: 'rgba(216,255,90,0.12)',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
          )}

          {left.map((t, i) => (
            <button
              key={t.path}
              ref={el => { tabRefs.current[i] = el; }}
              onClick={() => navigate(t.path)}
              style={tabStyle()}
            >
              <span style={labelStyle(location.pathname === t.path)}>{t.name}</span>
            </button>
          ))}

          <div style={{ width: 60 }} />

          {right.map((t, i) => (
            <button
              key={t.path}
              ref={el => { tabRefs.current[i + 2] = el; }}
              onClick={() => navigate(t.path)}
              style={tabStyle()}
            >
              <span style={labelStyle(location.pathname === t.path)}>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Floating + button — zIndex above canvas and pill */}
        <div style={{
          position: 'absolute',
          top: -8,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 3,
        }}>
          <button
            onPointerDown={handlePlusDown}
            onPointerUp={handlePlusUp}
            onPointerLeave={handlePlusCancel}
            onPointerCancel={handlePlusCancel}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: SB.lime,
              border: `1.5px solid rgba(255,255,255,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPressed
                ? `0 0 28px rgba(216,255,90,0.85), 0 0 60px rgba(216,255,90,0.35)`
                : `0 0 16px rgba(216,255,90,0.55)`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              touchAction: 'none',
              userSelect: 'none',
              transform: isPressed ? 'scale(1.08)' : 'scale(1)',
              transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            }}
          >
            <span style={{
              fontFamily: F.serif,
              fontWeight: 500,
              fontSize: 30,
              color: SB.ink,
              lineHeight: '34px',
            }}>+</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add" element={<Add />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/goals" element={<Goals />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  );
}

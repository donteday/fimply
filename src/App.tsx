import React from 'react';
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

const TABS = [
  { name: 'Дом', path: '/' },
  { name: 'Счета', path: '/transactions' },
  { name: 'Данные', path: '/analytics' },
  { name: 'ИИ', path: '/ai' },
];

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isModal = location.pathname === '/add' || location.pathname === '/settings' || location.pathname === '/goals';

  if (isModal) return null;

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? 'rgba(216,255,90,0.12)' : 'transparent',
    cursor: 'pointer',
    zIndex: 1,
  });

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: F.sansSemiBold,
    fontWeight: 600,
    fontSize: 12,
    color: active ? SB.lime : 'rgba(245,241,232,0.4)',
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 10,
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      pointerEvents: 'none',
    }}>
      <div style={{
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
      }}>
        {left.map(t => (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            style={tabStyle(location.pathname === t.path)}
          >
            <span style={labelStyle(location.pathname === t.path)}>{t.name}</span>
          </button>
        ))}

        {/* spacer for + button */}
        <div style={{ width: 60 }} />

        {right.map(t => (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            style={tabStyle(location.pathname === t.path)}
          >
            <span style={labelStyle(location.pathname === t.path)}>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Floating + button */}
      <div style={{
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => navigate('/add')}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: SB.lime,
            border: `1.5px solid rgba(255,255,255,0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px rgba(216,255,90,0.55)`,
            cursor: 'pointer',
            pointerEvents: 'auto',
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

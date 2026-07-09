import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';

interface Props {
  quote: string;
  loading?: boolean;
  onPress: () => void;
}

export function AICallout({ quote, loading, onPress }: Props) {
  return (
    <button
      onClick={onPress}
      style={{
        backgroundColor: SB.ink,
        border: `1.5px solid ${SB.lime}`,
        borderRadius: 20,
        padding: 18,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: SB.lime, animation: loading ? 'spin 2s linear infinite' : undefined }}>✦</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.lime, letterSpacing: 2 }}>
          {loading ? 'ИИ · ДУМАЕТ…' : 'ИИ · ШЕПЧЕТ'}
        </span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 18, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', width: '90%', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 18, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', width: '65%', animation: 'pulse 1.4s ease-in-out 0.2s infinite' }} />
        </div>
      ) : (
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 19, color: SB.text, lineHeight: '25px', letterSpacing: -0.3, display: 'block' }}>
          {quote}
        </span>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
      `}</style>
    </button>
  );
}

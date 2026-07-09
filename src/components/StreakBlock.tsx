import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';

interface Props { days: number; totalDays?: number; }

export function StreakBlock({ days, totalDays = 14 }: Props) {
  const dots = Array.from({ length: totalDays }, (_, i) => i < days);

  return (
    <div style={{ backgroundColor: SB.card, borderRadius: 20, padding: 16, border: `1.5px solid ${SB.stroke}` }}>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 8 }}>ТРЕКИНГ</span>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 38, color: SB.lime, letterSpacing: -1, lineHeight: '42px' }}>{days}</span>
        <span style={{ fontFamily: F.sans, fontSize: 18, color: SB.muted, marginBottom: 4 }}>дней</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 3, marginTop: 10 }}>
        {dots.map((active, i) => (
          <div key={i} style={{ flex: 1, height: 8, borderRadius: 2, backgroundColor: active ? SB.lime : SB.stroke }} />
        ))}
      </div>
    </div>
  );
}

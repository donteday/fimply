import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain } from '../utils/format';

interface Props {
  spent: number;
  budget: number;
  monthLabel: string;
}

export function RunwayBlock({ spent, budget, monthLabel }: Props) {
  const over = spent > budget;
  const overAmount = spent - budget;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overPct = over && budget > 0 ? Math.min(((spent - budget) / budget) * 100, 25) : 0;

  return (
    <div style={{ backgroundColor: SB.card, borderRadius: 20, padding: 16, border: `1.5px solid ${SB.stroke}` }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1 }}>ПРОГНОЗ {monthLabel}</span>
        {over && <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: SB.danger }}>+{fmtPlain(overAmount)} ₽ over</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 32, color: SB.text, letterSpacing: -0.5, lineHeight: '36px' }}>
          {fmtPlain(Math.round(spent / 1000))}
        </span>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.dim, marginBottom: 2 }}>
          {' '}/ {fmtPlain(Math.round(budget / 1000))}k ₽
        </span>
      </div>
      <div style={{ height: 10, backgroundColor: SB.ink, borderRadius: 5, overflow: 'hidden', marginTop: 12, border: `1.5px solid ${SB.stroke}`, position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: SB.lime, borderRadius: 5 }} />
        {over && (
          <div style={{ position: 'absolute', top: 0, left: `${pct}%`, height: '100%', width: `${overPct}%`, backgroundColor: SB.danger }} />
        )}
      </div>
    </div>
  );
}

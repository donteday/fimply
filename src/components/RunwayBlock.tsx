import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';

interface Props {
  spent: number;
  projected: number;
  budget: number;
  monthLabel: string;
}

export function RunwayBlock({ spent, projected, budget, monthLabel }: Props) {
  const hasProjection = projected > 0;
  const base = hasProjection ? projected : spent;
  const spentPct = base > 0 ? Math.min((spent / base) * 100, 100) : 0;
  const budgetMarkerPct = budget > 0 && base > 0 ? Math.min((budget / base) * 100, 100) : 0;
  const overBudget = budget > 0 && (hasProjection ? projected : spent) > budget;

  const fmtK = (v: number) => `${Math.round(v / 1000)}к`;

  return (
    <div style={{ backgroundColor: SB.card, borderRadius: 20, padding: 16, border: `1.5px solid ${SB.stroke}` }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1 }}>ПРОГНОЗ {monthLabel}</span>
        {overBudget && <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: SB.danger }}>превысит бюджет</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 32, color: SB.text, letterSpacing: -0.5, lineHeight: '36px' }}>
          {fmtK(spent)}
        </span>
        {hasProjection && (
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.dim, marginBottom: 2 }}>
            {' → '}{fmtK(projected)} ₽
          </span>
        )}
        {!hasProjection && (
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.dim, marginBottom: 2 }}> ₽</span>
        )}
      </div>
      {hasProjection && (
        <div style={{ height: 10, backgroundColor: SB.ink, borderRadius: 5, overflow: 'visible', marginTop: 12, border: `1.5px solid ${SB.stroke}`, position: 'relative' }}>
          <div style={{ width: `${spentPct}%`, height: '100%', backgroundColor: SB.lime, borderRadius: 5 }} />
          {budgetMarkerPct > 0 && (
            <div style={{
              position: 'absolute', top: -3, left: `${budgetMarkerPct}%`,
              width: 2, height: 16, backgroundColor: overBudget ? SB.danger : SB.dim,
              transform: 'translateX(-50%)',
            }} />
          )}
        </div>
      )}
    </div>
  );
}

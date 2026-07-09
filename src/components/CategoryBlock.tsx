import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain } from '../utils/format';
import { Budget } from '../types';
import { getCategoryMeta } from '../utils/categories';

interface Props { budget: Budget; tilt?: number; }

export function CategoryBlock({ budget, tilt = 0 }: Props) {
  const meta = getCategoryMeta(budget.category);
  const pct = Math.min(120, budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0);
  const over = budget.spent > budget.limit;

  return (
    <div style={{
      borderRadius: 20,
      padding: 14,
      border: `1.5px solid ${over ? SB.ink : SB.stroke}`,
      backgroundColor: over ? SB.danger : SB.card,
      boxShadow: over ? `4px 4px 0px ${SB.ink}` : undefined,
      transform: tilt ? `rotate(${tilt}deg)` : undefined,
    }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: over ? SB.ink : meta.dot }} />
        <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: over ? SB.ink : SB.text }}>{meta.label}</span>
      </div>
      <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 26, letterSpacing: -0.5, lineHeight: '30px', color: over ? SB.ink : SB.text, display: 'block' }}>
        {fmtPlain(budget.spent)}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: over ? 'rgba(0,0,0,0.6)' : SB.dim, display: 'block', marginTop: 2, opacity: 0.7 }}>
        из {fmtPlain(budget.limit)} ₽
      </span>
      <div style={{ height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden', backgroundColor: over ? 'rgba(0,0,0,0.2)' : SB.ink }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, backgroundColor: over ? SB.ink : meta.dot }} />
      </div>
      <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: over ? SB.ink : SB.dim, display: 'block', marginTop: 6 }}>{pct}%</span>
    </div>
  );
}

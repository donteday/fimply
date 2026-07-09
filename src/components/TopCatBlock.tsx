import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain } from '../utils/format';
import { Budget } from '../types';
import { getCategoryMeta } from '../utils/categories';

interface Props { budget: Budget; }

export function TopCatBlock({ budget }: Props) {
  const meta = getCategoryMeta(budget.category);
  const pct = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;

  return (
    <div style={{ backgroundColor: SB.peach, borderRadius: 20, padding: 16, border: `1.5px solid ${SB.ink}`, transform: 'rotate(0.8deg)' }}>
      <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 11, color: SB.ink, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
        ТОП · КАТ
      </span>
      <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 22, color: SB.ink, display: 'block' }}>{meta.label}</span>
      <span style={{ fontFamily: F.mono, fontSize: 14, color: SB.ink, display: 'block', marginTop: 6 }}>{fmtPlain(budget.spent)} ₽</span>
      <span style={{ fontFamily: F.sans, fontSize: 11, color: SB.ink, display: 'block', marginTop: 4, opacity: 0.7 }}>{pct}% от бюджета</span>
    </div>
  );
}

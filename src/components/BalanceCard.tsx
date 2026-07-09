import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain } from '../utils/format';

interface Props {
  balance: number;
  income: number;
  expenses: number;
  monthLabel: string;
  pctChange?: number;
}

export function BalanceCard({ balance, income, expenses, monthLabel, pctChange }: Props) {
  const changeLabel = pctChange !== undefined
    ? `${pctChange >= 0 ? '↗' : '↙'} ${Math.abs(pctChange).toFixed(1)}%`
    : null;
  const isNeg = balance < 0;

  return (
    <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 24 }}>
      <div style={{
        backgroundColor: isNeg ? SB.card : SB.lime,
        borderRadius: 24,
        padding: 22,
        border: `1.5px solid ${SB.ink}`,
        boxShadow: `6px 6px 0px ${SB.ink}`,
        transform: 'rotate(-0.6deg)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 12, color: isNeg ? SB.muted : SB.ink }}>
            БАЛАНС · {monthLabel}
          </span>
          {changeLabel && (
            <span style={{ fontFamily: F.mono, fontSize: 12, color: isNeg ? SB.muted : SB.ink }}>{changeLabel}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          {isNeg && <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 54, color: SB.danger, letterSpacing: -2, lineHeight: '58px' }}>−</span>}
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 54, color: isNeg ? SB.danger : SB.ink, letterSpacing: -2, lineHeight: '58px' }}>
            {fmtPlain(Math.abs(balance))}
          </span>
          <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: isNeg ? SB.danger : SB.ink, marginBottom: 4 }}>₽</span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: isNeg ? SB.muted : SB.ink, display: 'block', marginTop: 14 }}>
          {income > 0 ? `+ ${fmtPlain(income)} доход  ` : ''}− {fmtPlain(expenses)} траты
        </span>
      </div>
    </div>
  );
}

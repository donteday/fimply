import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain, fmtTime } from '../utils/format';

interface Props { tx: Transaction; onPress?: () => void; }

export function TransactionRow({ tx, onPress }: Props) {
  const isIncome = tx.amount > 0;
  const meta = getCategoryMeta(tx.category);

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: SB.card,
        border: `1.5px solid ${SB.stroke}`,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        width: '100%',
        textAlign: 'left',
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        border: `1.5px solid ${SB.stroke}`,
        backgroundColor: isIncome ? SB.lime : SB.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>{meta.icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: SB.text,
          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{tx.merchant}</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, marginTop: 1, display: 'block' }}>
          {meta.label} · {fmtTime(tx.date)}
        </span>
      </div>
      <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: isIncome ? SB.lime : SB.text, flexShrink: 0 }}>
        {isIncome ? '+' : '−'}{fmtPlain(Math.abs(tx.amount))}
      </span>
    </button>
  );
}

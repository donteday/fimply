import React, { useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain, fmtTime } from '../utils/format';

interface Props { tx: Transaction; onPress?: () => void; onDelete?: () => void; }

export function TransactionRow({ tx, onPress, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const isIncome = tx.amount > 0;
  const meta = getCategoryMeta(tx.category);

  if (confirming) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,119,102,0.1)', border: `1.5px solid ${SB.danger}`,
        borderRadius: 16, padding: '12px 14px', marginBottom: 8,
      }}>
        <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.danger }}>Удалить «{tx.merchant}»?</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { onDelete?.(); }}
            style={{ padding: '6px 14px', borderRadius: 10, backgroundColor: SB.danger, border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: '#fff' }}>Да</span>
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{ padding: '6px 14px', borderRadius: 10, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, cursor: 'pointer' }}
          >
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.muted }}>Нет</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={e => e.key === 'Enter' && onPress?.()}
        style={{
          flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14,
          backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
          borderRadius: 16, padding: 12, textAlign: 'left',
          cursor: onPress ? 'pointer' : 'default', minWidth: 0,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${SB.stroke}`,
          backgroundColor: isIncome ? SB.lime : SB.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
      </div>

      {onDelete && (
        <button
          onClick={() => setConfirming(true)}
          style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 15, color: SB.muted }}>✕</span>
        </button>
      )}
    </div>
  );
}

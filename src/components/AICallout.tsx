import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain } from '../utils/format';

interface Props {
  quote: string;
  savingsAmount?: number;
  onPress: () => void;
}

export function AICallout({ quote, savingsAmount, onPress }: Props) {
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
        <span style={{ fontSize: 14, color: SB.lime }}>✦</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.lime, letterSpacing: 2 }}>ИИ · ШЕПЧЕТ</span>
      </div>
      <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 19, color: SB.text, lineHeight: '25px', letterSpacing: -0.3, display: 'block' }}>
        {quote}
      </span>
      {savingsAmount != null && (
        <span style={{ display: 'block', marginTop: 10, fontFamily: F.sans, fontSize: 12, color: SB.muted }}>
          сэкономит{' '}
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, color: SB.lime }}>{fmtPlain(savingsAmount)} ₽/мес</span>
          {' '}→
        </span>
      )}
    </button>
  );
}

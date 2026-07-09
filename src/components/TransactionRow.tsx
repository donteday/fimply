import React, { useRef, useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain, fmtTime } from '../utils/format';

interface Props {
  tx: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const REVEAL = 112; // px revealed on swipe (two action buttons)

export function TransactionRow({ tx, onPress, onDelete, onEdit }: Props) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const dragBase = useRef(0);
  const direction = useRef<'h' | 'v' | null>(null);

  const snapTo = (x: number) => { setSnapping(true); setOffset(x); };
  const closeActions = () => snapTo(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragBase.current = offset;
    direction.current = null;
    setSnapping(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (direction.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (direction.current !== 'h') return;

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setOffset(Math.min(0, Math.max(-REVEAL, dragBase.current + dx)));
  };

  const handlePointerUp = () => {
    if (direction.current !== 'h') return;
    direction.current = null;
    snapTo(offset < -REVEAL / 3 ? -REVEAL : 0);
  };

  const handleCardClick = () => {
    if (offset < -4) { closeActions(); return; }
    onPress?.();
  };

  const handleEdit = () => {
    closeActions();
    onEdit?.();
  };

  const handleDelete = () => {
    closeActions();
    onDelete?.();
  };

  const isIncome = tx.amount > 0;
  const meta = getCategoryMeta(tx.category);
  const hasActions = !!(onEdit || onDelete);

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
      {/* Action buttons — revealed on swipe */}
      {hasActions && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          display: 'flex', alignItems: 'stretch', gap: 6, padding: 6,
          width: REVEAL,
        }}>
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                flex: 1, borderRadius: 10, backgroundColor: SB.lime,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18 }}>✏️</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{
                flex: 1, borderRadius: 10, backgroundColor: SB.danger,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 18, color: '#fff' }}>✕</span>
            </button>
          )}
        </div>
      )}

      {/* Sliding card */}
      <div
        onPointerDown={hasActions ? handlePointerDown : undefined}
        onPointerMove={hasActions ? handlePointerMove : undefined}
        onPointerUp={hasActions ? handlePointerUp : undefined}
        onPointerCancel={hasActions ? handlePointerUp : undefined}
        onClick={handleCardClick}
        style={{
          position: 'relative', zIndex: 1,
          transform: `translateX(${offset}px)`,
          transition: snapping ? 'transform 0.22s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'pan-y', userSelect: 'none',
          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14,
          backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
          borderRadius: 16, padding: 12, cursor: onPress ? 'pointer' : 'default',
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
    </div>
  );
}

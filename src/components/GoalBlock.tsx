import React from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Goal, Transaction, Category } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain } from '../utils/format';

const DISCRETIONARY: Category[] = ['cafe', 'entertainment', 'shopping', 'food'];

interface Props {
  goal: Goal;
  transactions: Transaction[];
  onClick: () => void;
}

export function GoalBlock({ goal, transactions, onClick }: Props) {
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
  const isOverdue = deadline < now;

  const byCategory: Partial<Record<Category, number>> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    if (!DISCRETIONARY.includes(t.category)) continue;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  }

  const topSources = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) as [Category, number][];

  const totalCouldSave = topSources.reduce((s, [, v]) => s + v, 0);
  const remaining = goal.targetAmount;
  const pct = Math.min(100, Math.round((totalCouldSave / remaining) * 100));

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
        borderRadius: 20, padding: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{goal.emoji}</span>
            <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 16, color: SB.text }}>{goal.name}</span>
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 0.5 }}>
            цель · {fmtPlain(goal.targetAmount)} ₽
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: isOverdue ? SB.danger : SB.muted, display: 'block' }}>
            {isOverdue ? 'просрочено' : `${daysLeft} дн.`}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim }}>осталось</span>
        </div>
      </div>

      {totalCouldSave > 0 ? (
        <>
          {/* Could-have label */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1 }}>МОГ БЫ НАКОПИТЬ В ЭТОМ МЕСЯЦЕ</span>
          </div>

          {/* Big number */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
            <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 36, color: SB.lime, letterSpacing: -1, lineHeight: 1 }}>
              {fmtPlain(Math.round(totalCouldSave))}
            </span>
            <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 18, color: SB.lime }}>₽</span>
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.muted, marginLeft: 4 }}>
              из {fmtPlain(goal.targetAmount)} ₽
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 2, backgroundColor: SB.stroke, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: SB.lime, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>

          {/* Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topSources.map(([cat, amount]) => {
              const meta = getCategoryMeta(cat);
              const barPct = totalCouldSave > 0 ? (amount / totalCouldSave) * 100 : 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: F.sans, fontSize: 12, color: SB.muted }}>{meta.label}</span>
                      <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 12, color: SB.text }}>{fmtPlain(Math.round(amount))} ₽</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, backgroundColor: SB.stroke, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, backgroundColor: meta.dot, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted, lineHeight: '20px' }}>
          Добавь траты — и увидишь сколько мог бы накопить на {goal.name.toLowerCase()}
        </span>
      )}
    </button>
  );
}

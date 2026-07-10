import React, { useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Transaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain, fmtTime } from '../utils/format';

interface Props {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  transactions: Transaction[];
  dailyLimit: number; // 0 = not set
}

const MONTH_NAMES = [
  'январь','февраль','март','апрель','май','июнь',
  'июль','август','сентябрь','октябрь','ноябрь','декабрь',
];
const MONTH_NAMES_GEN = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];
const DAY_HEADERS = ['пн','вт','ср','чт','пт','сб','вс'];

function fmtSmall(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1) return '';
  const s = abs >= 1000 ? `${Math.round(abs / 1000)}к` : `${Math.round(abs)}`;
  return n > 0 ? `+${s}` : `−${s}`;
}

export function CalendarBlock({ month, year, onMonthChange, transactions, dailyLimit }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const isCurrentMonth = month === todayMonth && year === todayYear;
  const isPastMonth = year < todayYear || (year === todayYear && month < todayMonth);

  // Group transactions by day
  const dayMap = new Map<number, { income: number; expenses: number; txs: Transaction[] }>();
  for (const tx of transactions) {
    const day = new Date(tx.date).getDate();
    const entry = dayMap.get(day) ?? { income: 0, expenses: 0, txs: [] };
    if (tx.amount > 0) entry.income += tx.amount;
    else entry.expenses += Math.abs(tx.amount);
    entry.txs.push(tx);
    dayMap.set(day, entry);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const handlePrev = () => {
    setSelectedDay(null);
    const pm = month === 0 ? 11 : month - 1;
    onMonthChange(pm, month === 0 ? year - 1 : year);
  };
  const handleNext = () => {
    setSelectedDay(null);
    const nm = month === 11 ? 0 : month + 1;
    onMonthChange(nm, month === 11 ? year + 1 : year);
  };

  const getDayKind = (day: number): 'future' | 'empty' | 'green' | 'red' => {
    const isFuture = !isPastMonth && isCurrentMonth && day > todayDay;
    if (isFuture) return 'future';
    const data = dayMap.get(day);
    if (!data || (data.income === 0 && data.expenses === 0)) return 'empty';
    if (dailyLimit > 0) return data.expenses > dailyLimit ? 'red' : 'green';
    return data.expenses > data.income ? 'red' : 'green';
  };

  const COLOR: Record<string, { bg: string; border: string; text: string; dashed: boolean }> = {
    future: { bg: 'transparent',  border: SB.stroke,   text: SB.dim,     dashed: true  },
    empty:  { bg: SB.strokeHi,    border: SB.strokeHi, text: SB.muted,   dashed: false },
    green:  { bg: SB.lime,        border: SB.lime,     text: SB.ink,     dashed: false },
    red:    { bg: SB.danger,      border: SB.danger,   text: '#fff',     dashed: false },
  };

  const selectedData = selectedDay !== null ? dayMap.get(selectedDay) : null;
  const selectedTxs = selectedData
    ? [...selectedData.txs].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div style={{
      backgroundColor: SB.card,
      borderRadius: 20,
      border: `1.5px solid ${SB.stroke}`,
      padding: 16,
      overflow: 'hidden',
    }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button
          onClick={handlePrev}
          style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: SB.stroke, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <span style={{ color: SB.muted, fontSize: 15, lineHeight: '1' }}>←</span>
        </button>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.text, letterSpacing: -0.3 }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={handleNext}
          style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: SB.stroke, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <span style={{ color: SB.muted, fontSize: 15, lineHeight: '1' }}>→</span>
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: 'center', paddingBottom: 6 }}>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 0.5 }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} style={{ height: 64 }} />;
          const kind = getDayKind(day);
          const c = COLOR[kind];
          const isToday = isCurrentMonth && day === todayDay;
          const isSelected = selectedDay === day;
          const data = dayMap.get(day);
          const net = data ? data.income - data.expenses : 0;
          const amtLabel = kind === 'future' || kind === 'empty' ? '' : fmtSmall(dailyLimit > 0 ? -data!.expenses : net);
          const amtColor = net > 0 ? SB.lime : SB.danger;

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: kind === 'future' ? 'default' : 'pointer', paddingTop: 2, paddingBottom: 2, gap: 2 }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: c.bg,
                border: `${isSelected ? 2.5 : 1.5}px ${c.dashed ? 'dashed' : 'solid'} ${isSelected ? SB.text : isToday && kind !== 'green' && kind !== 'red' ? SB.lime : c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isToday && !isSelected ? `0 0 0 2px rgba(216,255,90,0.2)` : 'none',
                transition: 'transform 0.1s',
                transform: isSelected ? 'scale(0.92)' : 'scale(1)',
              }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: c.text, fontWeight: isToday ? '700' : '400' }}>
                  {day}
                </span>
              </div>
              <span style={{
                fontFamily: F.mono,
                fontSize: 8,
                color: amtLabel ? amtColor : 'transparent',
                letterSpacing: 0.2,
                lineHeight: '10px',
                userSelect: 'none',
              }}>
                {amtLabel || '·'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 14, marginTop: 10, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: SB.lime }} />
          <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 0.5 }}>
            {dailyLimit > 0 ? 'В ЛИМИТЕ' : 'ПЛЮС'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: SB.danger }} />
          <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 0.5 }}>
            {dailyLimit > 0 ? 'ПРЕВЫШЕН' : 'МИНУС'}
          </span>
        </div>
        {dailyLimit > 0 && (
          <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 0.5 }}>
            лимит {dailyLimit.toLocaleString('ru')} ₽
          </span>
        )}
      </div>

      {/* Day detail panel */}
      {selectedDay !== null && (
        <div style={{
          marginTop: 14,
          borderTop: `1px solid ${SB.stroke}`,
          paddingTop: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 16, color: SB.text, letterSpacing: -0.3 }}>
              {selectedDay} {MONTH_NAMES_GEN[month]}
            </span>
            {selectedData && (
              <span style={{ fontFamily: F.mono, fontSize: 10, color: selectedData.income - selectedData.expenses >= 0 ? SB.lime : SB.danger }}>
                {fmtSmall(selectedData.income - selectedData.expenses)} ₽
              </span>
            )}
          </div>

          {selectedTxs.length === 0 ? (
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.dim, display: 'block', textAlign: 'center', paddingBottom: 4 }}>
              нет операций
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTxs.map(tx => {
                const meta = getCategoryMeta(tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: SB.bg, border: `1px solid ${SB.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.merchant || meta.label}
                      </span>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, display: 'block', marginTop: 1 }}>
                        {fmtTime(tx.date)} · {meta.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 13, color: isIncome ? SB.lime : SB.text, flexShrink: 0 }}>
                      {isIncome ? '+' : '−'}{fmtPlain(Math.abs(tx.amount))} ₽
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

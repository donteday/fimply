import React, { useRef, useState } from 'react';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Transaction } from '../types';

const DAY_ABBR = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function fmtSmall(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1) return '';
  let s: string;
  if (abs >= 1000) {
    const k = abs / 1000;
    s = Number.isInteger(k) ? `${k}к` : `${k.toFixed(1).replace('.', ',')}к`;
  } else {
    s = `${Math.round(abs)}`;
  }
  return n > 0 ? `+${s}` : `−${s}`;
}

// ─── 7-day mini calendar slide ───────────────────────────────────────────────

interface WeekSlideProps {
  transactions: Transaction[];
  dailyLimit: number;
}

function WeekSlide({ transactions, dailyLimit }: WeekSlideProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from most recent Monday
  const daysSinceMonday = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayData = days.map(d => {
    const str = d.toDateString();
    const dayTxs = transactions.filter(t => new Date(t.date).toDateString() === str);
    const income = dayTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = dayTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { date: d, income, expenses };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 14 }}>
        ЭТА НЕДЕЛЯ
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, gap: 2 }}>
        {dayData.map(({ date, income, expenses }, i) => {
          const isFuture = date > today;
          const isToday = date.getTime() === today.getTime();
          const hasActivity = income > 0 || expenses > 0;
          const net = income - expenses;

          let bg: string;
          let border: string;
          let textColor: string;
          let amtTextColor: string;
          let dashed = false;

          if (isFuture) {
            bg = 'transparent'; border = SB.stroke; textColor = SB.dim; amtTextColor = 'transparent'; dashed = true;
          } else if (!hasActivity) {
            bg = SB.strokeHi; border = SB.strokeHi; textColor = SB.dim; amtTextColor = 'transparent';
          } else if (dailyLimit > 0 ? expenses > dailyLimit : expenses > income) {
            bg = SB.danger; border = SB.danger; textColor = '#fff'; amtTextColor = 'rgba(255,255,255,0.7)';
          } else {
            bg = SB.lime; border = SB.lime; textColor = SB.ink; amtTextColor = 'rgba(15,14,12,0.55)';
          }

          const amtLabel = !isFuture && hasActivity ? fmtSmall(dailyLimit > 0 ? -expenses : net) : '';

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 0.3 }}>
                {DAY_ABBR[date.getDay()]}
              </span>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: bg,
                border: `1.5px ${dashed ? 'dashed' : 'solid'} ${isToday && !hasActivity ? SB.lime : border}`,
                boxShadow: isToday ? '0 0 0 2px rgba(216,255,90,0.2)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                gap: 1,
              }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: textColor, fontWeight: isToday ? '700' : '400', lineHeight: '13px' }}>
                  {date.getDate()}
                </span>
                {amtLabel ? (
                  <span style={{ fontFamily: F.mono, fontSize: 7, color: amtTextColor, lineHeight: '9px', whiteSpace: 'nowrap' }}>
                    {amtLabel}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─── Runway slide ─────────────────────────────────────────────────────────────

interface RunwaySlideProps {
  spent: number;
  projected: number;
  budget: number;
  monthLabel: string;
}

function RunwaySlide({ spent, projected, budget, monthLabel }: RunwaySlideProps) {
  const hasProjection = projected > 0;
  const base = hasProjection ? projected : spent;
  const spentPct = base > 0 ? Math.min((spent / base) * 100, 100) : 0;
  const budgetMarkerPct = budget > 0 && base > 0 ? Math.min((budget / base) * 100, 100) : 0;
  const overBudget = budget > 0 && (hasProjection ? projected : spent) > budget;
  const fmtK = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}к` : `${Math.round(v)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1 }}>
          ПРОГНОЗ {monthLabel}
        </span>
        {overBudget && (
          <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: SB.danger }}>
            превысит бюджет
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1 }}>
        <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 32, color: SB.text, letterSpacing: -0.5, lineHeight: '36px' }}>
          {fmtK(spent)}
        </span>
        {hasProjection ? (
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.dim, marginBottom: 2 }}>
            {' → '}{fmtK(projected)} ₽
          </span>
        ) : (
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.dim, marginBottom: 2 }}> ₽</span>
        )}
      </div>
      {hasProjection && (
        <div style={{ height: 10, backgroundColor: SB.ink, borderRadius: 5, marginTop: 12, border: `1.5px solid ${SB.stroke}`, position: 'relative', overflow: 'visible' }}>
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

// ─── Carousel ─────────────────────────────────────────────────────────────────

interface CarouselProps extends WeekSlideProps, RunwaySlideProps {}

export function HomeCarousel({ transactions, dailyLimit, spent, projected, budget, monthLabel }: CarouselProps) {
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => {
    setSlide(s => Math.max(0, Math.min(1, s + dir)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) go(1);
    else if (delta > 40) go(-1);
    touchStartX.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => { mouseStartX.current = e.clientX; };
  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const delta = e.clientX - mouseStartX.current;
    if (delta < -40) go(1);
    else if (delta > 40) go(-1);
    mouseStartX.current = null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={{
          overflow: 'hidden',
          borderRadius: 20,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          width: '200%',
          transform: `translateX(${slide === 0 ? 0 : -50}%)`,
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ width: '50%', backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 20, padding: 16, boxSizing: 'border-box' }}>
            <WeekSlide transactions={transactions} dailyLimit={dailyLimit} />
          </div>
          <div style={{ width: '50%', backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 20, padding: 16, boxSizing: 'border-box' }}>
            <RunwaySlide spent={spent} projected={projected} budget={budget} monthLabel={monthLabel} />
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {[0, 1].map(i => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            style={{
              width: slide === i ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: slide === i ? SB.lime : SB.stroke,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.25s ease, background-color 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

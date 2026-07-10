import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { fmtPlain, fmtMonthName, fmtMonthYear } from '../utils/format';
import { getBudgets, getTransactionsByMonth, getSetting } from '../services/storage';
import { getCategoryMeta } from '../utils/categories';
import { Budget, Transaction } from '../types';
import { CalendarBlock } from '../components/CalendarBlock';

const now = new Date();
const CM = now.getMonth();
const CY = now.getFullYear();
const PM = CM === 0 ? 11 : CM - 1;
const PY = CM === 0 ? CY - 1 : CY;
const TODAY_DAY = now.getDate();
const DAY_NAMES = ['вс','пн','вт','ср','чт','пт','сб'];

function weeklyTotals(txs: Transaction[]): number[] {
  const weeks = [0,0,0,0];
  for (const tx of txs) {
    if (tx.amount >= 0) continue;
    const day = new Date(tx.date).getDate();
    const w = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
    weeks[w] += Math.abs(tx.amount);
  }
  return weeks;
}

function dailyTotals(txs: Transaction[]): { day: string; amount: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - (6 - i));
    const total = txs.filter(t => t.amount < 0 && new Date(t.date).toDateString() === d.toDateString()).reduce((s,t) => s + Math.abs(t.amount), 0);
    return { day: DAY_NAMES[d.getDay()], amount: total };
  });
}

type Tone = 'roast'|'warn'|'good'|'neutral';
type Insight = { tone: Tone; text: string };

function computeInsights(curTxs: Transaction[], prevTxs: Transaction[], budgets: Budget[], prevBudgets: Budget[]): Insight[] {
  if (curTxs.length === 0) return [{ tone: 'neutral', text: 'Добавь первые траты голосом' }];
  const insights: Insight[] = [];
  const expTxs = curTxs.filter(t => t.amount < 0);
  const merchantMap = new Map<string, number>();
  for (const t of expTxs) merchantMap.set(t.merchant, (merchantMap.get(t.merchant) ?? 0) + 1);
  let topM = ''; let topC = 0;
  merchantMap.forEach((c, m) => { if (c > topC) { topC = c; topM = m; } });
  if (topC >= 3) insights.push({ tone: 'roast', text: `Ты был в ${topM} ${topC} раз в этом месяце` });
  const over = budgets.filter(b => b.limit > 0 && b.spent > b.limit).sort((a,b) => (b.spent-b.limit)-(a.spent-a.limit));
  if (over.length > 0 && insights.length < 3) {
    const b = over[0];
    insights.push({ tone: 'warn', text: `${getCategoryMeta(b.category).label}: превышено на ${fmtPlain(Math.round(b.spent - b.limit))} ₽` });
  }
  if (insights.length < 3) {
    let bestD = 0; let bestT = '';
    for (const b of budgets) {
      if (b.spent === 0) continue;
      const prev = prevBudgets.find(p => p.category === b.category);
      if (!prev || prev.spent === 0) continue;
      if (b.spent < prev.spent) {
        const delta = Math.round(((prev.spent - b.spent) / prev.spent) * 100);
        if (delta >= 5 && delta > bestD) { bestD = delta; bestT = `${getCategoryMeta(b.category).label}: −${delta}% к прошлому месяцу`; }
      }
    }
    if (bestT) insights.push({ tone: 'good', text: bestT });
  }
  if (insights.length === 0) insights.push({ tone: 'neutral', text: 'Пока всё в норме — так держать' });
  return insights;
}

export default function Analytics() {
  const location = useLocation();
  const [period, setPeriod] = useState<'month'|'week'>('month');
  const [curTxs, setCurTxs] = useState<Transaction[]>([]);
  const [prevTxs, setPrevTxs] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [prevBudgets, setPrevBudgets] = useState<Budget[]>([]);
  const [calMonth, setCalMonth] = useState(CM);
  const [calYear, setCalYear] = useState(CY);
  const [calTxs, setCalTxs] = useState<Transaction[]>([]);
  const [dailyLimit, setDailyLimit] = useState(0);

  useEffect(() => {
    Promise.all([
      getBudgets(CM, CY), getTransactionsByMonth(CM, CY),
      getTransactionsByMonth(PM, PY), getBudgets(PM, PY),
      getSetting('dailyLimit', '0'),
    ]).then(([b, cur, prev, prevB, lim]) => {
      setBudgets(b); setCurTxs(cur); setPrevTxs(prev); setPrevBudgets(prevB);
      setDailyLimit(parseFloat(lim as string) || 0);
    });
  }, [location.key]);

  useEffect(() => {
    getTransactionsByMonth(calMonth, calYear).then(setCalTxs);
  }, [calMonth, calYear, location.key]);

  const expTxs = curTxs.filter(t => t.amount < 0);
  const totalSpent = expTxs.reduce((s,t) => s + Math.abs(t.amount), 0);
  const totalIncome = curTxs.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const avgDaily = TODAY_DAY > 0 ? Math.round(totalSpent / TODAY_DAY) : 0;
  const biggestExpense = expTxs.length > 0 ? Math.max(...expTxs.map(t => Math.abs(t.amount))) : 0;
  const curTotal = expTxs.reduce((s,t) => s + Math.abs(t.amount), 0);
  const prevTotal = prevTxs.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const momPct = prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : null;

  const dailyData = dailyTotals(curTxs);
  const prevWeekly = weeklyTotals(prevTxs);
  const weekBarData: [number,number][] = period === 'month'
    ? weeklyTotals(curTxs).map((c,i) => [c, prevWeekly[i]])
    : dailyData.map(d => [d.amount, 0]);
  const MAX_BAR = Math.max(...weekBarData.flatMap(([a,b]) => [a,b]), 1);
  const chartLabels = period === 'month' ? ['н1','н2','н3','н4'] : dailyData.map(d => d.day);
  const activeBudgets = [...budgets].filter(b => b.spent > 0).sort((a,b) => b.spent - a.spent);
  const insights = computeInsights(curTxs, prevTxs, budgets, prevBudgets);

  const card: React.CSSProperties = { flex: 1, backgroundColor: SB.card, borderRadius: 16, border: `1.5px solid ${SB.stroke}`, padding: 12 };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: SB.bg }}>
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: 20, paddingBottom: 0 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block' }}>
            АНАЛИТИКА · {fmtMonthYear(CM, CY)}
          </span>
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 44, color: SB.text, letterSpacing: -1.5, display: 'block', marginTop: 2, lineHeight: '50px' }}>
            {fmtPlain(totalSpent)} ₽
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.muted, display: 'block', marginTop: 4 }}>
            {momPct === null
              ? <span style={{ color: SB.dim }}>нет данных за прошлый месяц</span>
              : <><span style={{ color: momPct > 0 ? SB.danger : SB.lime }}>{momPct > 0 ? `+${momPct}%` : `${momPct}%`}</span>{` к ${fmtMonthName(PM)}`}</>
            }
          </span>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', flexDirection: 'row', padding: '16px 20px 0', gap: 10 }}>
          {[
            { label: 'ДЕНЬ/СРЕДНЕЕ', value: `${fmtPlain(avgDaily)} ₽`, accent: false },
            { label: 'MAX ТРАТА', value: `${fmtPlain(biggestExpense)} ₽`, accent: false },
            { label: 'ДОХОДЫ', value: `${fmtPlain(totalIncome)} ₽`, accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label} style={card}>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 4 }}>{label}</span>
              <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 16, color: accent ? SB.lime : SB.text, letterSpacing: -0.5, display: 'block' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ padding: '16px 20px 0' }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 10 }}>КАЛЕНДАРЬ</span>
          <CalendarBlock
            month={calMonth}
            year={calYear}
            onMonthChange={(m, y) => { setCalMonth(m); setCalYear(y); }}
            transactions={calTxs}
            dailyLimit={dailyLimit}
          />
        </div>

        {/* Period toggle */}
        <div style={{ display: 'flex', flexDirection: 'row', margin: '16px 20px 0', backgroundColor: SB.card, borderRadius: 14, padding: 4, border: `1.5px solid ${SB.stroke}` }}>
          {(['month','week'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, paddingTop: 8, paddingBottom: 8, borderRadius: 10, backgroundColor: period === p ? SB.lime : 'transparent' }}>
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: period === p ? SB.ink : SB.muted }}>
                {p === 'month' ? 'Месяц' : 'Неделя'}
              </span>
            </button>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ margin: 20, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 20, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1 }}>
              {period === 'month' ? 'ПО НЕДЕЛЯМ' : 'ПОСЛЕДНИЕ 7 ДНЕЙ'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.lime }}>■ {fmtMonthName(CM)}</span>
              {period === 'month' && <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim }}>□ {fmtMonthName(PM)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, height: 140, alignItems: 'flex-end' }}>
            {weekBarData.map(([a,b], i) => (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, height: Math.max(2, (a / MAX_BAR) * 120), backgroundColor: SB.lime, borderRadius: 6, border: `1.5px solid ${SB.ink}` }} />
                  {period === 'month' && (
                    <div style={{ flex: 1, height: Math.max(2, (b / MAX_BAR) * 120), backgroundColor: SB.ink, borderRadius: 6, border: `1.5px solid ${SB.stroke}` }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            {chartLabels.map((w,i) => (
              <span key={i} style={{ fontFamily: F.mono, fontSize: 10, color: SB.dim }}>{w}</span>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {activeBudgets.length > 0 && (
          <div style={{ paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeBudgets.map(b => {
              const meta = getCategoryMeta(b.category);
              const pct = totalSpent > 0 ? Math.round((b.spent / totalSpent) * 100) : 0;
              const isOver = b.limit > 0 && b.spent > b.limit;
              return (
                <div key={b.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: meta.dot, marginTop: 5, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{meta.icon}</span>
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.text, width: 90, flexShrink: 0 }}>{meta.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: 6, backgroundColor: SB.ink, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: meta.dot, borderRadius: 3 }} />
                    </div>
                    {isOver && (
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: SB.danger, display: 'block', marginTop: 3, letterSpacing: 0.5 }}>
                        ▲ +{fmtPlain(Math.round(b.spent - b.limit))} ₽
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, width: 32, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.muted, width: 72, textAlign: 'right', flexShrink: 0 }}>{fmtPlain(b.spent)} ₽</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Insights */}
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((ins, i) => {
            const isGood = ins.tone === 'good';
            const isNeutral = ins.tone === 'neutral';
            return (
              <div key={i} style={{ borderRadius: 18, padding: 14, border: `1.5px solid ${isGood ? SB.ink : SB.stroke}`, backgroundColor: isGood ? SB.lime : SB.card }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, display: 'block', marginBottom: 4, opacity: 0.7, color: isGood ? SB.ink : SB.dim }}>
                  {ins.tone === 'roast' ? '◆ СКАЖУ ПРЯМО' : ins.tone === 'warn' ? '▲ ВНИМАНИЕ' : ins.tone === 'good' ? '✓ РЕСПЕКТ' : '— ПОКА ТИХО'}
                </span>
                <span style={{ fontFamily: F.sans, fontSize: 14, lineHeight: '20px', color: isGood ? SB.ink : isNeutral ? SB.muted : SB.text }}>
                  {ins.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { BalanceCard } from '../components/BalanceCard';
import { HomeCarousel } from '../components/HomeCarousel';
import { TopCatBlock } from '../components/TopCatBlock';
import { StreakBlock } from '../components/StreakBlock';
import { AICallout } from '../components/AICallout';
import { TransactionRow } from '../components/TransactionRow';
import { fmtMonthYear } from '../utils/format';
import { getSetting, getTransactionsByMonth, getBudgets, getActiveGoal } from '../services/storage';
import { getHomeInsight } from '../services/deepseek';
import { GoalBlock } from '../components/GoalBlock';
import { Goal } from '../types';
import { Transaction, Budget } from '../types';

function calcStreak(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 31; i++) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const hasTx = transactions.some(t => {
      const d = new Date(t.date);
      return d >= dayStart && d <= dayEnd;
    });
    if (hasTx) streak++;
    else if (i > 0) break;
  }
  return streak;
}

const now = new Date();
const CURRENT_MONTH = now.getMonth();
const CURRENT_YEAR = now.getFullYear();

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyLimit, setDailyLimit] = useState(0);

  useEffect(() => {
    getSetting('userName', '').then(setUserName);
    getSetting('dailyLimit', '0').then(v => setDailyLimit(parseFloat(v) || 0));
    getBudgets(CURRENT_MONTH, CURRENT_YEAR).then(setBudgets);
    getActiveGoal().then(setGoal);
    getTransactionsByMonth(CURRENT_MONTH, CURRENT_YEAR).then(txs => {
      setTransactions(txs);
      if (txs.length >= 5) {
        setInsightLoading(true);
        getHomeInsight(txs)
          .then(text => { if (text) setAiInsight(text); })
          .finally(() => setInsightLoading(false));
      }
    });
  }, [location.key]);

  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expenses;
  const topBudget = [...budgets].sort((a, b) => (b.spent / (b.limit || 1)) - (a.spent / (a.limit || 1)))[0];
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const streak = calcStreak(transactions);
  const fallbackInsight = transactions.length === 0
    ? 'Добавь первую трату голосом — просто нажми +'
    : transactions.length < 5
      ? 'Добавь ещё пару трат — скоро дам первый совет'
      : expenses > 0
        ? `За этот месяц потрачено ${expenses.toLocaleString('ru')} ₽ — ${transactions.filter(t => t.amount < 0).length} операций`
        : 'Трат пока нет — отличное начало месяца';
  const insightText = aiInsight ?? fallbackInsight;

  const monthLabel = fmtMonthYear(CURRENT_MONTH, CURRENT_YEAR).split(' ')[0];

  const daysElapsed = now.getDate();
  const daysInMonth = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
  const projected = daysElapsed >= 3 && expenses > 0
    ? Math.round((expenses / daysElapsed) * daysInMonth)
    : 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: SB.bg }}>
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{
          paddingLeft: 20, paddingRight: 20, paddingTop: 14,
          display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          animation: 'fadeSlideIn 0.32s ease both',
        }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SB.lime, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 600, fontSize: 20, color: SB.ink }}>f</span>
            </div>
            <div>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block' }}>
                {userName ? 'привет,' : 'привет'}
              </span>
              {!!userName && <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 14, color: SB.text, display: 'block' }}>{userName}</span>}
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            style={{ width: 40, height: 40, borderRadius: 20, border: `1.5px solid ${SB.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ fontSize: 16, color: SB.muted }}>⚙</span>
          </button>
        </div>

        {/* Balance card */}
        <div style={{ animation: 'fadeSlideIn 0.32s ease both' }}>
          <BalanceCard balance={balance} income={income} expenses={expenses} monthLabel={monthLabel} />
        </div>

        {/* Grid */}
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 24, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ width: '100%' }}>
            <HomeCarousel
              transactions={transactions}
              dailyLimit={dailyLimit}
              spent={expenses}
              projected={projected}
              budget={totalBudget}
              monthLabel={monthLabel}
            />
          </div>
          {topBudget && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <TopCatBlock budget={topBudget} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <StreakBlock days={streak} />
          </div>
        </div>

        {/* Goal block */}
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 16 }}>
          {goal ? (
            <GoalBlock goal={goal} transactions={transactions} onClick={() => navigate('/goals')} />
          ) : (
            <button
              onClick={() => navigate('/goals')}
              style={{ width: '100%', padding: '14px 18px', borderRadius: 16, backgroundColor: 'transparent', border: `1.5px dashed ${SB.stroke}`, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.dim }}>+ поставь цель и узнай сколько мог бы накопить</span>
            </button>
          )}
        </div>

        {/* AI callout */}
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}>
          <AICallout
            quote={aiInsight ? `«${aiInsight}»` : `«${fallbackInsight}»`}
            loading={insightLoading}
            onPress={() => navigate('/ai')}
          />
        </div>

        {/* Recent transactions */}
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 22, color: SB.text }}>Последнее</span>
            <button onClick={() => navigate('/transactions')}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.muted }}>все →</span>
            </button>
          </div>
          {transactions.length === 0 ? (
            <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted, textAlign: 'center', display: 'block', paddingTop: 20, paddingBottom: 20 }}>
              Транзакций пока нет
            </span>
          ) : (
            transactions.slice(0, 3).map(t => <TransactionRow key={t.id} tx={t} />)
          )}
        </div>
      </div>
    </div>
  );
}

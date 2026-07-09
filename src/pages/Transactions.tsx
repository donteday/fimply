import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { TransactionRow } from '../components/TransactionRow';
import { getTransactionsByMonth } from '../services/storage';
import { fmtDate } from '../utils/format';
import { Transaction } from '../types';

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function groupByDay(txs: Transaction[]): { title: string; data: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = fmtDate(tx.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const now = new Date();

export default function Transactions() {
  const location = useLocation();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactionsByMonth(month, year).then(setTransactions);
  }, [month, year, location.key]);

  const filtered = transactions.filter(tx =>
    !search || tx.merchant.toLowerCase().includes(search.toLowerCase())
  );
  const sections = groupByDay(filtered);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: SB.bg }}>
      {/* Month picker */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 8 }}>
        <button onClick={prevMonth} style={{ padding: 8 }}>
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, lineHeight: '32px' }}>‹</span>
        </button>
        <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 22, color: SB.text }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ padding: 8 }}>
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, lineHeight: '32px' }}>›</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию…"
          style={{
            width: '100%',
            backgroundColor: SB.card,
            border: `1.5px solid ${SB.stroke}`,
            borderRadius: 14,
            padding: 12,
            fontFamily: F.sans,
            fontSize: 14,
            color: SB.text,
          }}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 100 }}>
        {sections.length === 0 ? (
          <span style={{ fontFamily: F.sans, fontSize: 15, color: SB.muted, textAlign: 'center', display: 'block', marginTop: 40 }}>
            Транзакций нет
          </span>
        ) : (
          sections.map(({ title, data }) => (
            <div key={title}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 8, marginTop: 4 }}>
                {title}
              </span>
              {data.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

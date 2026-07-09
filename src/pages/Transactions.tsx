import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { TransactionRow } from '../components/TransactionRow';
import { getTransactionsByMonth, deleteTransaction, updateTransaction } from '../services/storage';
import { fmtDate } from '../utils/format';
import { Transaction, Category } from '../types';
import { getCategoryMeta, ALL_CATEGORIES } from '../utils/categories';

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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // edit form state
  const [editAmount, setEditAmount] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('other');
  const [editIsIncome, setEditIsIncome] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTransactionsByMonth(month, year).then(setTransactions);
  }, [month, year, location.key]);

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(String(Math.abs(tx.amount)));
    setEditMerchant(tx.merchant);
    setEditCategory(tx.category);
    setEditIsIncome(tx.amount > 0);
  };

  const closeEdit = () => { setEditingTx(null); setSaving(false); };

  const handleSaveEdit = async () => {
    if (!editingTx || saving) return;
    const amt = parseFloat(editAmount.replace(',', '.'));
    if (!amt || !editMerchant.trim()) return;
    setSaving(true);
    const updated: Transaction = {
      ...editingTx,
      amount: editIsIncome ? Math.abs(amt) : -Math.abs(amt),
      merchant: editMerchant.trim(),
      category: editCategory,
    };
    await updateTransaction(updated);
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    closeEdit();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const filtered = transactions.filter(tx =>
    !search || tx.merchant.toLowerCase().includes(search.toLowerCase())
  );
  const sections = groupByDay(filtered);
  const editValid = !!editMerchant.trim() && parseFloat(editAmount.replace(',', '.')) > 0;

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
          style={{ width: '100%', backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 14, padding: 12, fontFamily: F.sans, fontSize: 14, color: SB.text }}
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
              {data.map(tx => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onDelete={() => handleDelete(tx.id)}
                  onEdit={() => openEdit(tx)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Edit bottom sheet */}
      {editingTx && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeEdit}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 101,
            backgroundColor: SB.card, borderRadius: '24px 24px 0 0',
            border: `1.5px solid ${SB.stroke}`, borderBottom: 'none',
            padding: '20px 20px 40px',
            animation: 'slideUp 0.25s ease',
            maxWidth: 480, margin: '0 auto',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: SB.stroke, margin: '0 auto 20px' }} />

            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1.5, display: 'block', marginBottom: 16 }}>РЕДАКТИРОВАТЬ</span>

            {/* Income/Expense toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['Расход', 'Доход'] as const).map((label, i) => {
                const active = i === 1 ? editIsIncome : !editIsIncome;
                return (
                  <button
                    key={label}
                    onClick={() => setEditIsIncome(i === 1)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      backgroundColor: active ? SB.lime : SB.bg,
                      border: `1.5px solid ${active ? SB.ink : SB.stroke}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 13, color: active ? SB.ink : SB.muted }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <input
              type="number"
              inputMode="decimal"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                backgroundColor: SB.bg, border: `1.5px solid ${SB.stroke}`,
                fontFamily: F.serif, fontSize: 28, color: SB.text, letterSpacing: -1,
              }}
            />

            {/* Merchant */}
            <input
              type="text"
              value={editMerchant}
              onChange={e => setEditMerchant(e.target.value)}
              placeholder="Название"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                backgroundColor: SB.bg, border: `1.5px solid ${SB.stroke}`,
                fontFamily: F.sans, fontSize: 15, color: SB.text,
              }}
            />

            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {ALL_CATEGORIES.map(cat => {
                const m = getCategoryMeta(cat);
                const active = cat === editCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setEditCategory(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: 100,
                      backgroundColor: active ? SB.lime : SB.bg,
                      border: `1.5px solid ${active ? SB.ink : SB.stroke}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{m.icon}</span>
                    <span style={{ fontFamily: F.sansMedium, fontWeight: 500, fontSize: 12, color: active ? SB.ink : SB.text }}>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSaveEdit}
              disabled={!editValid || saving}
              style={{
                width: '100%', padding: 14, borderRadius: 14,
                backgroundColor: editValid && !saving ? SB.lime : SB.bg,
                border: `1.5px solid ${editValid && !saving ? SB.ink : SB.stroke}`,
                boxShadow: editValid && !saving ? `3px 3px 0px ${SB.ink}` : 'none',
                cursor: editValid && !saving ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: editValid && !saving ? SB.ink : SB.muted }}>
                {saving ? 'Сохраняю…' : 'Сохранить'}
              </span>
            </button>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </>
      )}
    </div>
  );
}

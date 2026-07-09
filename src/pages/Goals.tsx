import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { Goal, Transaction, Category } from '../types';
import { saveGoal, getActiveGoal, deleteGoal, getTransactionsByMonth } from '../services/storage';
import { getCategoryMeta } from '../utils/categories';
import { fmtPlain } from '../utils/format';

const EMOJIS = ['🏖️', '💻', '🎧', '✈️', '🚗', '📱', '🏠', '👟', '🎮', '💍', '🎓', '🐾'];
const DISCRETIONARY: Category[] = ['cafe', 'entertainment', 'shopping', 'food'];

const now = new Date();

export default function Goals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      getActiveGoal(),
      getTransactionsByMonth(now.getMonth(), now.getFullYear()),
    ]).then(([g, txs]) => {
      setGoal(g);
      setTransactions(txs);
      setLoading(false);
    });
  }, [location.key]);

  const handleCreate = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || !amt || !deadline || saving) return;
    setSaving(true);
    await saveGoal({ id: `goal_${Date.now()}`, name: name.trim(), emoji, targetAmount: amt, deadline, createdAt: new Date().toISOString() });
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!goal) return;
    await deleteGoal(goal.id);
    navigate(-1);
  };

  const byCategory: Partial<Record<Category, number>> = {};
  for (const t of transactions) {
    if (t.amount >= 0 || !DISCRETIONARY.includes(t.category)) continue;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  }
  const topSources = (Object.entries(byCategory) as [Category, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const totalCouldSave = topSources.reduce((s, [, v]) => s + v, 0);

  const formValid = !!name.trim() && parseFloat(amount.replace(',', '.')) > 0 && !!deadline;

  if (loading) return <div style={{ height: '100%', backgroundColor: SB.bg }} />;

  return (
    <div style={{ height: '100%', backgroundColor: SB.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={() => navigate(-1)}>
          <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>← назад</span>
        </button>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 2 }}>
          {goal ? 'МОЯ ЦЕЛЬ' : 'НОВАЯ ЦЕЛЬ'}
        </span>
        {goal ? (
          <button onClick={() => setConfirmDelete(true)}>
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.danger }}>удалить</span>
          </button>
        ) : <div style={{ width: 60 }} />}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>

        {/* ── DETAIL VIEW ── */}
        {goal && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 44 }}>{goal.emoji}</span>
              <div>
                <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, letterSpacing: -0.5, display: 'block' }}>{goal.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: SB.dim }}>{fmtPlain(goal.targetAmount)} ₽</span>
              </div>
            </div>

            {/* Deadline */}
            <div style={{ marginBottom: 28 }}>
              {(() => {
                const dl = new Date(goal.deadline);
                const days = Math.max(0, Math.ceil((dl.getTime() - Date.now()) / 86400000));
                const months = Math.floor(days / 30);
                return (
                  <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>
                    {days === 0 ? 'Дедлайн сегодня' : dl < new Date() ? 'Дедлайн прошёл' : months > 0 ? `${months} мес. ${days % 30} дн. до цели` : `${days} дней до цели`}
                  </span>
                );
              })()}
            </div>

            {/* Divider */}
            <div style={{ height: 1.5, backgroundColor: SB.stroke, marginBottom: 24 }} />

            {totalCouldSave > 0 ? (
              <>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 12 }}>МОГ БЫ НАКОПИТЬ В ЭТОМ МЕСЯЦЕ</span>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                  <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 48, color: SB.lime, letterSpacing: -2, lineHeight: 1 }}>
                    {fmtPlain(Math.round(totalCouldSave))}
                  </span>
                  <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 24, color: SB.lime, marginBottom: 4 }}>₽</span>
                </div>

                {/* Progress toward goal */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim }}>
                      {Math.round((totalCouldSave / goal.targetAmount) * 100)}% от цели
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim }}>
                      не хватает {fmtPlain(Math.max(0, Math.round(goal.targetAmount - totalCouldSave)))} ₽
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: SB.stroke, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (totalCouldSave / goal.targetAmount) * 100)}%`,
                      backgroundColor: SB.lime, borderRadius: 3,
                    }} />
                  </div>
                </div>

                <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 14 }}>ИЗ НИХ:</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topSources.map(([cat, amount]) => {
                    const meta = getCategoryMeta(cat);
                    const pct = Math.round((amount / totalCouldSave) * 100);
                    return (
                      <div key={cat} style={{ backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 16, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>{meta.icon}</span>
                            <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: SB.text }}>{meta.label}</span>
                          </div>
                          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 18, color: SB.text }}>{fmtPlain(Math.round(amount))} ₽</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, backgroundColor: SB.stroke, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: meta.dot, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, marginTop: 5, display: 'block' }}>
                          {pct}% потенциальных накоплений
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <span style={{ fontFamily: F.sans, fontSize: 15, color: SB.muted, lineHeight: '22px', display: 'block' }}>
                  Добавь траты этого месяца —{'\n'}и увидишь сколько мог бы накопить
                </span>
              </div>
            )}

            {/* Delete confirm */}
            {confirmDelete && (
              <div style={{ marginTop: 32, padding: 18, border: `1.5px solid ${SB.danger}`, borderRadius: 16, backgroundColor: 'rgba(255,119,102,0.08)' }}>
                <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.text, display: 'block', marginBottom: 14 }}>
                  Удалить цель «{goal.name}»?
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDelete} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SB.danger, border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 14, color: '#fff' }}>Удалить</span>
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, cursor: 'pointer' }}>
                    <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>Отмена</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CREATE VIEW ── */}
        {!goal && (
          <>
            <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, letterSpacing: -0.5, display: 'block', marginBottom: 28, lineHeight: '34px' }}>
              На что копишь?
            </span>

            {/* Emoji picker */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 10 }}>ЭМОДЗИ</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    style={{
                      width: 44, height: 44, borderRadius: 12, fontSize: 22,
                      backgroundColor: e === emoji ? SB.lime : SB.card,
                      border: `1.5px solid ${e === emoji ? SB.ink : SB.stroke}`,
                      cursor: 'pointer',
                    }}
                  >{e}</button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 6 }}>НАЗВАНИЕ</span>
              <input
                type="text"
                placeholder="Airpods, отпуск в Турции…"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, fontFamily: F.sans, fontSize: 16, color: SB.text }}
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 6 }}>СУММА ₽</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 14, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, fontFamily: F.serif, fontSize: 32, color: SB.text, letterSpacing: -1 }}
              />
            </div>

            {/* Deadline */}
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 6 }}>КОГДА ХОЧЕШЬ</span>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, fontFamily: F.sans, fontSize: 16, color: SB.text, colorScheme: 'dark' }}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!formValid || saving}
              style={{
                width: '100%', padding: 16, borderRadius: 16,
                backgroundColor: formValid && !saving ? SB.lime : SB.card,
                border: `1.5px solid ${formValid && !saving ? SB.ink : SB.stroke}`,
                boxShadow: formValid && !saving ? `3px 3px 0px ${SB.ink}` : 'none',
                cursor: formValid && !saving ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: formValid && !saving ? SB.ink : SB.muted }}>
                {saving ? 'Сохраняю…' : 'Поставить цель ✓'}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

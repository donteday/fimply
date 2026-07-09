import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { VoiceButton } from '../components/VoiceButton';
import { ParsedTransaction, Category } from '../types';
import { saveTransaction } from '../services/storage';
import { fmtPlain } from '../utils/format';
import { getCategoryMeta, ALL_CATEGORIES } from '../utils/categories';

export default function Add() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'voice' | 'confirm' | 'manual'>('voice');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [saving, setSaving] = useState(false);

  // manual form state
  const [manualAmount, setManualAmount] = useState('');
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualIsIncome, setManualIsIncome] = useState(false);
  const [manualCategory, setManualCategory] = useState<Category>('other');

  const handleVoiceResult = (result: ParsedTransaction) => {
    setParsed(result);
    setStep('confirm');
  };

  const handleSave = async () => {
    if (!parsed || saving) return;
    setSaving(true);
    await saveTransaction({
      id: `voice_${Date.now()}`,
      amount: parsed.amount,
      category: parsed.category,
      merchant: parsed.merchantClean,
      description: parsed.description,
      source: 'voice',
      date: new Date().toISOString(),
      confirmed: true,
    });
    navigate(-1);
  };

  const handleManualSave = async () => {
    const amt = parseFloat(manualAmount.replace(',', '.'));
    if (!amt || !manualMerchant.trim() || saving) return;
    setSaving(true);
    await saveTransaction({
      id: `manual_${Date.now()}`,
      amount: manualIsIncome ? Math.abs(amt) : -Math.abs(amt),
      category: manualCategory,
      merchant: manualMerchant.trim(),
      description: getCategoryMeta(manualCategory).label,
      source: 'manual',
      date: new Date().toISOString(),
      confirmed: true,
    });
    navigate(-1);
  };

  const meta = parsed ? getCategoryMeta(parsed.category) : null;
  const isIncome = (parsed?.amount ?? 0) > 0;
  const now = new Date();
  const timeLabel = `СЕГОДНЯ · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const manualValid = !!manualAmount && parseFloat(manualAmount.replace(',', '.')) > 0 && !!manualMerchant.trim();

  return (
    <div style={{ height: '100%', backgroundColor: SB.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={() => step === 'manual' ? setStep('voice') : navigate(-1)} style={{ width: 70 }}>
          <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>← назад</span>
        </button>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 2 }}>
          {step === 'manual' ? 'ВРУЧНУЮ' : 'НОВАЯ ТРАТА'}
        </span>
        <div style={{ width: 70 }} />
      </div>

      {/* Voice step */}
      {step === 'voice' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, textAlign: 'center', marginBottom: 40, lineHeight: '34px', letterSpacing: -0.5 }}>
            Просто <span style={{ color: SB.lime }}>скажи</span>
          </span>
          <div style={{ marginBottom: 36 }}>
            <VoiceButton onResult={handleVoiceResult} />
          </div>
          <button onClick={() => setStep('manual')}>
            <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>или введи вручную</span>
          </button>
        </div>
      )}

      {/* Confirm step */}
      {step === 'confirm' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.lime, letterSpacing: 2, display: 'block', marginBottom: 12 }}>✓ ПОНЯЛ</span>
          {parsed && (
            <div style={{
              backgroundColor: SB.lime, borderRadius: 24, padding: 22,
              border: `1.5px solid ${SB.ink}`, boxShadow: `6px 6px 0px ${SB.ink}`,
              transform: 'rotate(-0.5deg)',
            }}>
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 12, color: SB.ink, display: 'block', marginBottom: 8 }}>{timeLabel}</span>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 54, color: SB.ink, letterSpacing: -2, lineHeight: '58px' }}>
                  {isIncome ? '+' : '−'}{fmtPlain(Math.abs(parsed.amount))}
                </span>
                <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 26, color: SB.ink, marginBottom: 4 }}>₽</span>
              </div>
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 16, color: SB.ink, display: 'block', marginTop: 14 }}>
                {parsed.merchantClean} · {meta?.label}
              </span>
              <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.ink, display: 'block', marginTop: 4, opacity: 0.7 }}>{parsed.description}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: SB.lime,
              border: `1.5px solid ${SB.ink}`, boxShadow: saving ? 'none' : `3px 3px 0px ${SB.ink}`,
              opacity: saving ? 0.5 : 1, cursor: saving ? 'default' : 'pointer', width: '100%',
            }}
          >
            <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: SB.ink }}>
              {saving ? 'Сохраняю…' : 'Сохранить ✓'}
            </span>
          </button>
          <button onClick={() => setStep('voice')} style={{ marginTop: 12, padding: 14, width: '100%' }}>
            <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>Попробовать снова</span>
          </button>
        </div>
      )}

      {/* Manual step */}
      {step === 'manual' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>
          {/* Income / Expense toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['Расход', 'Доход'] as const).map((label, i) => {
              const active = i === 1 ? manualIsIncome : !manualIsIncome;
              return (
                <button
                  key={label}
                  onClick={() => setManualIsIncome(i === 1)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12,
                    backgroundColor: active ? SB.lime : SB.card,
                    border: `1.5px solid ${active ? SB.ink : SB.stroke}`,
                    boxShadow: active ? `2px 2px 0px ${SB.ink}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 14, color: active ? SB.ink : SB.muted }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 6 }}>СУММА ₽</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={manualAmount}
              onChange={e => setManualAmount(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
                fontFamily: F.serif, fontSize: 32, color: SB.text,
                letterSpacing: -1,
              }}
            />
          </div>

          {/* Merchant */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 6 }}>ГДЕ / ЧТО</span>
            <input
              type="text"
              placeholder="Пятёрочка, AliExpress…"
              value={manualMerchant}
              onChange={e => setManualMerchant(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14,
                backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`,
                fontFamily: F.sans, fontSize: 16, color: SB.text,
              }}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1, display: 'block', marginBottom: 10 }}>КАТЕГОРИЯ</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_CATEGORIES.map(cat => {
                const m = getCategoryMeta(cat);
                const active = cat === manualCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setManualCategory(cat)}
                    style={{
                      padding: '8px 14px', borderRadius: 100,
                      backgroundColor: active ? SB.lime : SB.card,
                      border: `1.5px solid ${active ? SB.ink : SB.stroke}`,
                      boxShadow: active ? `2px 2px 0px ${SB.ink}` : 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontFamily: F.sansMedium, fontWeight: 500, fontSize: 13, color: active ? SB.ink : SB.text }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleManualSave}
            disabled={!manualValid || saving}
            style={{
              width: '100%', padding: 16, borderRadius: 16,
              backgroundColor: manualValid && !saving ? SB.lime : SB.card,
              border: `1.5px solid ${manualValid && !saving ? SB.ink : SB.stroke}`,
              boxShadow: manualValid && !saving ? `3px 3px 0px ${SB.ink}` : 'none',
              cursor: manualValid && !saving ? 'pointer' : 'default',
              opacity: saving ? 0.5 : 1,
            }}
          >
            <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: manualValid && !saving ? SB.ink : SB.muted }}>
              {saving ? 'Сохраняю…' : 'Сохранить ✓'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

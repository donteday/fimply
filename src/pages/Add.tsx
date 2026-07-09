import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { VoiceButton } from '../components/VoiceButton';
import { ParsedTransaction } from '../types';
import { saveTransaction } from '../services/storage';
import { fmtPlain } from '../utils/format';
import { getCategoryMeta } from '../utils/categories';

export default function Add() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'voice' | 'confirm'>('voice');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [saving, setSaving] = useState(false);

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

  const meta = parsed ? getCategoryMeta(parsed.category) : null;
  const isIncome = (parsed?.amount ?? 0) > 0;
  const now = new Date();
  const timeLabel = `СЕГОДНЯ · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div style={{ height: '100%', backgroundColor: SB.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 70 }}>
          <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>← назад</span>
        </button>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 2 }}>НОВАЯ ТРАТА</span>
        <div style={{ width: 70 }} />
      </div>

      {step === 'voice' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <span style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 28, color: SB.text, textAlign: 'center', marginBottom: 40, lineHeight: '34px', letterSpacing: -0.5 }}>
            Просто <span style={{ color: SB.lime }}>скажи</span>
          </span>
          <div style={{ marginBottom: 36 }}>
            <VoiceButton onResult={handleVoiceResult} />
          </div>
        </div>
      ) : (
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
    </div>
  );
}

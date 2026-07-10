import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { getSetting, setSetting, clearAllData } from '../services/storage';

export default function Settings() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    getSetting('userName', '').then(setUserName);
    getSetting('dailyLimit', '').then(setDailyLimit);
  }, []);

  const saveUserName = () => setSetting('userName', userName);
  const saveDailyLimit = () => {
    const val = parseFloat(dailyLimit.replace(',', '.'));
    setSetting('dailyLimit', isNaN(val) || val <= 0 ? '0' : String(val));
  };

  const handleClear = async () => {
    await clearAllData();
    setConfirmClear(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: SB.bg }}>
      <div style={{ padding: 20, paddingBottom: 110 }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.muted }}>← назад</span>
        </button>

        <span style={{ fontFamily: F.serifItalic, fontStyle: 'italic', fontWeight: 500, fontSize: 38, color: SB.text, letterSpacing: -1, display: 'block', marginBottom: 28 }}>
          Настройки
        </span>

        {/* User name */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1.5, display: 'block', marginBottom: 12 }}>ИМЯ</span>
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            onBlur={saveUserName}
            placeholder="Ваше имя"
            style={{ width: '100%', backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 14, padding: 14, fontFamily: F.sans, fontSize: 16, color: SB.text }}
          />
        </div>

        {/* Daily limit */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1.5, display: 'block', marginBottom: 4 }}>ДНЕВНОЙ ЛИМИТ</span>
          <span style={{ fontFamily: F.sans, fontSize: 12, color: SB.dim, display: 'block', marginBottom: 12 }}>
            Если установлен — в календаре покажет красный при превышении
          </span>
          <div style={{ position: 'relative' }}>
            <input
              value={dailyLimit}
              onChange={e => setDailyLimit(e.target.value)}
              onBlur={saveDailyLimit}
              placeholder="0 — не задан"
              inputMode="decimal"
              style={{ width: '100%', backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, borderRadius: 14, padding: 14, paddingRight: 40, fontFamily: F.sans, fontSize: 16, color: SB.text, boxSizing: 'border-box' as const }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: F.sans, fontSize: 16, color: SB.dim }}>₽</span>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1.5, display: 'block', marginBottom: 12 }}>ОПАСНАЯ ЗОНА</span>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ width: '100%', backgroundColor: SB.card, border: `1.5px solid ${SB.danger}`, borderRadius: 14, padding: 16, cursor: 'pointer' }}
            >
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: SB.danger }}>Очистить все данные</span>
            </button>
          ) : (
            <div style={{ border: `1.5px solid ${SB.danger}`, borderRadius: 14, padding: 16, backgroundColor: 'rgba(255,119,102,0.08)' }}>
              <span style={{ fontFamily: F.sans, fontSize: 14, color: SB.text, display: 'block', marginBottom: 14 }}>
                Удалить все транзакции и настройки без возможности восстановления?
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleClear}
                  style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SB.danger, border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 14, color: '#fff' }}>Удалить</span>
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SB.card, border: `1.5px solid ${SB.stroke}`, cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 14, color: SB.muted }}>Отмена</span>
                </button>
              </div>
            </div>
          )}

          {cleared && (
            <span style={{ fontFamily: F.mono, fontSize: 12, color: SB.lime, display: 'block', marginTop: 10, letterSpacing: 0.5 }}>
              ✓ Данные удалены
            </span>
          )}
        </div>

        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, textAlign: 'center', display: 'block', marginTop: 20 }}>
          fimply v1.0 · Soft Brutal
        </span>
      </div>
    </div>
  );
}

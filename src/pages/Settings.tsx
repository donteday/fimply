import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SB } from '../theme/colors';
import { F } from '../theme/fonts';
import { getSetting, setSetting, clearAllData } from '../services/storage';
import { getPermissionState, requestAndEnable, scheduleReminder, cancelReminder } from '../services/notifications';

export default function Settings() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [notifPerm, setNotifPerm] = useState<ReturnType<typeof getPermissionState>>('default');
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    getSetting('userName', '').then(setUserName);
    getSetting('dailyLimit', '').then(setDailyLimit);
    setNotifPerm(getPermissionState());
    getSetting('notifEnabled', 'false').then(v => setNotifEnabled(v === 'true'));
  }, []);

  const handleNotifToggle = async () => {
    if (notifPerm === 'unsupported') return;
    if (notifPerm !== 'granted') {
      const ok = await requestAndEnable();
      if (ok) {
        setNotifPerm('granted');
        setNotifEnabled(true);
        setSetting('notifEnabled', 'true');
      }
      return;
    }
    if (notifEnabled) {
      cancelReminder();
      setNotifEnabled(false);
      setSetting('notifEnabled', 'false');
    } else {
      scheduleReminder();
      setNotifEnabled(true);
      setSetting('notifEnabled', 'true');
    }
  };

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

        {/* Notifications */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, letterSpacing: 1.5, display: 'block', marginBottom: 4 }}>НАПОМИНАНИЯ</span>
          <span style={{ fontFamily: F.sans, fontSize: 12, color: SB.dim, display: 'block', marginBottom: 12 }}>
            Каждый день в 22:00 напомним внести траты
          </span>
          {notifPerm === 'unsupported' ? (
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.dim }}>Уведомления не поддерживаются браузером</span>
          ) : notifPerm === 'denied' ? (
            <span style={{ fontFamily: F.sans, fontSize: 13, color: SB.danger }}>Уведомления заблокированы — разреши в настройках браузера</span>
          ) : (
            <button
              onClick={handleNotifToggle}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                backgroundColor: notifEnabled ? 'rgba(216,255,90,0.1)' : SB.card,
                border: `1.5px solid ${notifEnabled ? SB.lime : SB.stroke}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: F.sansSemiBold, fontWeight: 600, fontSize: 15, color: notifEnabled ? SB.lime : SB.text }}>
                {notifPerm !== 'granted' ? 'Включить напоминание' : notifEnabled ? 'Напоминание в 22:00' : 'Напоминание выключено'}
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: notifEnabled ? SB.lime : SB.dim }}>
                {notifPerm !== 'granted' ? 'разреши →' : notifEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
          )}
        </div>

        <span style={{ fontFamily: F.mono, fontSize: 11, color: SB.dim, textAlign: 'center', display: 'block', marginTop: 20 }}>
          fimply v1.0 · Soft Brutal
        </span>
      </div>
    </div>
  );
}

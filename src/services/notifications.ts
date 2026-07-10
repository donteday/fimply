const REMINDER_TEXTS = [
  'Эй, деньги себя не запишут — ну ты понял 💸',
  'Карточка молчит, но мы оба знаем что ты тратил сегодня 🤫',
  'Брось сериал на минуту — запиши траты, потом досмотришь 📱',
  'Твой кошелёк шепчет: занеси меня уже в приложение 🎙',
  'Конец дня. Кофе, такси, ещё что-то — всё это ждёт записи 📊',
  'Пока не уснул — 2 минуты на траты за сегодня, потом всё 🌙',
  'Деньги не умеют считать себя сами. Им нужна твоя помощь 🧮',
  '22:00 — золотое время для финансового чекина 💡',
  'Сегодняшние траты скоро растворятся в памяти. Fimply помнит лучше 🧠',
  'Напоминалка от будущего тебя: запиши траты, ты скажешь спасибо 🙌',
];

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let morningTimer: ReturnType<typeof setTimeout> | null = null;
const MORNING_CACHE = 'fimply_morning_brief';

async function show(body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Fimply', {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'fimply-daily-reminder',
      });
    } else {
      new Notification('Fimply', { body, icon: '/icon.png' });
    }
  } catch {}
}

function randomText() {
  return REMINDER_TEXTS[Math.floor(Math.random() * REMINDER_TEXTS.length)];
}

function msUntilTen() {
  const now = new Date();
  const target = new Date();
  target.setHours(22, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function scheduleReminder() {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = setTimeout(async () => {
    await show(randomText());
    scheduleReminder(); // reschedule next day
  }, msUntilTen());
}

export function cancelReminder() {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

export function scheduleMorningBriefing(text: string) {
  if (Notification.permission !== 'granted') return;

  const today = new Date().toDateString();
  try {
    const cached = localStorage.getItem(MORNING_CACHE);
    if (cached) {
      const { date, shown } = JSON.parse(cached);
      if (date === today && shown) return;
    }
  } catch {}

  const now = new Date();
  const target = new Date();
  target.setHours(10, 0, 0, 0);

  if (now >= target) {
    // Already past 10 AM today — skip, mark done
    try { localStorage.setItem(MORNING_CACHE, JSON.stringify({ date: today, shown: true })); } catch {}
    return;
  }

  try { localStorage.setItem(MORNING_CACHE, JSON.stringify({ date: today, text, shown: false })); } catch {}

  if (morningTimer) clearTimeout(morningTimer);
  morningTimer = setTimeout(async () => {
    await show(text);
    try { localStorage.setItem(MORNING_CACHE, JSON.stringify({ date: today, shown: true })); } catch {}
  }, target.getTime() - now.getTime());
}

export function cancelMorningBriefing() {
  if (morningTimer) {
    clearTimeout(morningTimer);
    morningTimer = null;
  }
}

export async function requestAndEnable(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    scheduleReminder();
    return true;
  }
  return false;
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

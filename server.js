import 'dotenv/config';
import express from 'express';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import webPush from 'web-push';
import cron from 'node-cron';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const YANDEX_KEY = process.env.YANDEX_API_KEY || process.env.VITE_YANDEX_API_KEY || '';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

webPush.setVapidDetails('mailto:yunalinnx@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

const SUBS_FILE = join(__dirname, 'push-subscriptions.json');
const STATE_FILE = join(__dirname, 'push-state.json');

function loadJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return fallback; }
}
function saveJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// { endpoint -> PushSubscription }
let subscriptions = loadJson(SUBS_FILE, {});
// { reminderEnabled: bool, morningText: string, morningDate: string }
let state = loadJson(STATE_FILE, { reminderEnabled: true, morningText: '', morningDate: '' });

function saveSubscriptions() { saveJson(SUBS_FILE, subscriptions); }
function saveState() { saveJson(STATE_FILE, state); }

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

async function sendToAll(payload) {
  const endpoints = Object.keys(subscriptions);
  await Promise.allSettled(
    endpoints.map(async endpoint => {
      const sub = subscriptions[endpoint];
      try {
        await webPush.sendNotification(sub, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          delete subscriptions[endpoint];
          saveSubscriptions();
        }
      }
    })
  );
}

// 22:00 — вечернее напоминание
cron.schedule('0 22 * * *', async () => {
  if (!state.reminderEnabled) return;
  const body = REMINDER_TEXTS[Math.floor(Math.random() * REMINDER_TEXTS.length)];
  await sendToAll({ title: 'Fimply', body, tag: 'fimply-reminder', url: '/' });
}, { timezone: 'Europe/Moscow' });

// 10:00 — утренний разбор
cron.schedule('0 10 * * *', async () => {
  const today = new Date().toDateString();
  if (!state.morningText || state.morningDate !== today) return;
  await sendToAll({ title: 'Утренний разбор 🌅', body: state.morningText, tag: 'fimply-morning', url: '/ai' });
  state.morningText = '';
  saveState();
}, { timezone: 'Europe/Moscow' });

const app = express();
app.use(express.json());

// Прокси для Yandex STT — добавляет API ключ на сервере
app.post('/api/stt', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const options = {
    hostname: 'stt.api.cloud.yandex.net',
    path: `/speech/v1/stt:recognize?${qs}`,
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${YANDEX_KEY}`,
      'Content-Type': 'application/octet-stream',
    },
  };

  const proxy = https.request(options, (r) => {
    res.status(r.statusCode || 500);
    r.pipe(res);
  });
  proxy.on('error', () => res.status(502).json({ error: { message: 'Proxy error' } }));
  req.pipe(proxy);
});

// Web Push API
app.post('/api/push/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).end();
  subscriptions[sub.endpoint] = sub;
  saveSubscriptions();
  res.status(201).json({ ok: true });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    delete subscriptions[endpoint];
    saveSubscriptions();
  }
  res.json({ ok: true });
});

app.post('/api/push/reminder', (req, res) => {
  const { enabled } = req.body;
  state.reminderEnabled = Boolean(enabled);
  saveState();
  res.json({ ok: true });
});

app.post('/api/push/morning-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).end();
  const today = new Date().toDateString();
  // Обновляем текст только если ещё сегодня не отправляли
  if (state.morningDate !== today || !state.morningText) {
    state.morningText = text;
    state.morningDate = today;
    saveState();
  }
  res.json({ ok: true });
});

// Статика из dist/
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Fimply running on :${PORT}`));

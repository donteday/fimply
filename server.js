import express from 'express';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const YANDEX_KEY = process.env.YANDEX_API_KEY || '';

const app = express();

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

// Статика из dist/
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Fimply running on :${PORT}`));

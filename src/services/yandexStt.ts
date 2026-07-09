// API ключ добавляется на сервере (server.js или Vite proxy в dev)
// Браузер не хранит и не отправляет ключ

export async function transcribeAudio(pcmBlob: Blob): Promise<string> {
  const url = `/api/stt?lang=ru-RU&format=lpcm&sampleRateHertz=16000`;

  const response = await fetch(url, {
    method: 'POST',
    body: pcmBlob,
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `Yandex STT error ${response.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch {}
    throw new Error(msg);
  }

  try {
    return (JSON.parse(text) as { result: string }).result;
  } catch {
    throw new Error('Неверный ответ от сервера — проверь что /api/stt работает');
  }
}

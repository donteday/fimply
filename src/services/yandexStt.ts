// API ключ добавляется на сервере (server.js или Vite proxy в dev)
// Браузер не хранит и не отправляет ключ

export async function transcribeAudio(pcmBlob: Blob): Promise<string> {
  const url = `/api/stt?lang=ru-RU&format=lpcm&sampleRateHertz=16000`;

  const response = await fetch(url, {
    method: 'POST',
    body: pcmBlob,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Yandex STT error ${response.status}`);
  }

  return data.result as string;
}

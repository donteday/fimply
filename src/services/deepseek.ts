import { Category, ParsedTransaction } from '../types';

const BASE_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

function getKey(): string {
  return import.meta.env.VITE_DEEPSEEK_KEY ?? '';
}

async function callDeepSeek(systemPrompt: string, userMessage: string): Promise<string> {
  const key = getKey();
  if (!key || key === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJsonSafe<T>(text: string): T | null {
  try {
    const clean = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

const CATEGORIZE_SYSTEM = `Ты помощник для категоризации финансовых транзакций.
Получаешь текст SMS или push-уведомления от банка.
Отвечай ТОЛЬКО валидным JSON без markdown.
Определи:
- category: одно из [food, cafe, transport, health, entertainment, shopping, utilities, salary, transfer, other]
- merchantClean: читаемое название магазина/сервиса на русском
- description: короткое описание 2-3 слова`;

export async function categorizeTransaction(
  text: string,
  merchant: string,
): Promise<{ category: Category; merchantClean: string; description: string }> {
  const input = merchant ? `${merchant}\n${text}` : text;
  const raw = await callDeepSeek(CATEGORIZE_SYSTEM, input);
  const parsed = parseJsonSafe<{ category: Category; merchantClean: string; description: string }>(raw);
  if (!parsed) {
    return { category: 'other', merchantClean: merchant || 'Неизвестно', description: 'Транзакция' };
  }
  return parsed;
}

const VOICE_SYSTEM = `Извлеки данные о транзакции из текста на русском языке.
Отвечай ТОЛЬКО валидным JSON без markdown.
Поля:
- amount: число, отрицательное для расхода, положительное для дохода
- category: одно из [food, cafe, transport, health, entertainment, shopping, utilities, salary, transfer, other]
- merchantClean: название магазина или сервиса на русском
- description: короткое описание 2-3 слова

Понимай сленг: "пятихатка"=500, "косарь"=1000, "полтинник"=50, "стольник"=100.`;

export async function parseVoiceInput(text: string): Promise<ParsedTransaction | null> {
  try {
    const raw = await callDeepSeek(VOICE_SYSTEM, text);
    return parseJsonSafe<ParsedTransaction>(raw);
  } catch (e) {
    console.error('parseVoiceInput error:', e);
    return null;
  }
}

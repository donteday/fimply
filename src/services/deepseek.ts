import { Category, ParsedTransaction, Transaction } from '../types';

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

export interface ChatMessage { role: 'user' | 'assistant'; content: string; }

const CAT_LABELS: Record<string, string> = {
  food: 'Продукты',
  cafe: 'Кафе и рестораны',
  transport: 'Транспорт',
  health: 'Здоровье',
  entertainment: 'Развлечения',
  shopping: 'Покупки',
  utilities: 'ЖКХ',
  salary: 'Зарплата',
  transfer: 'Переводы',
  other: 'Другое',
};

function buildFinanceContext(transactions: Transaction[]): string {
  if (!transactions.length) return '';
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const expenses = thisMonth.filter(t => t.amount < 0);
  const income = thisMonth.filter(t => t.amount > 0);
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  }
  const topCats = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, sum]) => `${CAT_LABELS[cat] ?? cat}: ${sum.toFixed(0)} ₽`)
    .join(', ');

  const recent = thisMonth.slice(0, 8)
    .map(t => `${t.merchant || t.description} ${t.amount > 0 ? '+' : ''}${t.amount} ₽`)
    .join('; ');

  const otherItems = thisMonth
    .filter(t => t.category === 'other')
    .map(t => `${t.merchant || t.description} ${t.amount > 0 ? '+' : ''}${t.amount} ₽`)
    .join('; ');

  let ctx = `\n\nДАННЫЕ ПОЛЬЗОВАТЕЛЯ (текущий месяц):\n- Расходы: ${totalExpense.toFixed(0)} ₽\n- Доходы: ${totalIncome.toFixed(0)} ₽\n- По категориям: ${topCats || 'нет данных'}\n- Последние операции: ${recent || 'нет данных'}`;
  if (otherItems) ctx += `\n- Что в категории "Другое": ${otherItems}`;
  return ctx;
}

const CHAT_SYSTEM = `Ты Fimply — финансовый наставник. Общаешься чилово, как умный друг, без занудства и лекций.

Стиль:
- Короткие ответы (2–4 предложения), никакой воды
- Конкретные цифры и факты из данных пользователя когда уместно
- Casual тон: "окей", "слушай", "честно говоря", "в целом"
- Не боишься сказать правду, но без морализаторства
- Иногда задаёшь один уточняющий вопрос в конце

Тематика: только финансы — расходы, доходы, бюджет, экономия, инвестиции. Если уходят не по теме — мягко возвращай к деньгам.
Язык: только русский.`;

const HOME_INSIGHT_CACHE = 'fimply_home_insight';

export async function getHomeInsight(transactions: Transaction[]): Promise<string | null> {
  const key = getKey();
  if (!key || key === 'your_deepseek_api_key_here' || !transactions.length) return null;

  const today = new Date().toDateString();
  try {
    const cached = localStorage.getItem(HOME_INSIGHT_CACHE);
    if (cached) {
      const { date, text } = JSON.parse(cached);
      if (date === today) return text as string;
    }
  } catch {}

  const context = buildFinanceContext(transactions);
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: `Ты Fimply — финансовый наставник. Дай один честный инсайт (1–2 предложения) о финансах пользователя этого месяца. Чиловый тон, конкретные цифры из данных, без воды. Только русский.${context}` },
        { role: 'user', content: 'Что скажешь про мои финансы?' },
      ],
      temperature: 0.7,
      max_tokens: 120,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  if (text) {
    try { localStorage.setItem(HOME_INSIGHT_CACHE, JSON.stringify({ date: today, text })); } catch {}
  }
  return text || null;
}

export async function chatWithAI(
  history: ChatMessage[],
  transactions: Transaction[] = [],
): Promise<string> {
  const key = getKey();
  if (!key || key === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API key not configured');
  }

  const systemContent = CHAT_SYSTEM + buildFinanceContext(transactions);

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 300,
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

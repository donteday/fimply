import { Transaction, Budget } from '../types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 230000,
    category: 'salary',
    merchant: 'Работодатель',
    description: 'Зачисление зарплаты',
    source: 'sms',
    date: new Date(2026, 3, 5).toISOString(),
    confirmed: true,
  },
  {
    id: '2',
    amount: -18450,
    category: 'shopping',
    merchant: 'Wildberries',
    description: 'Покупки онлайн',
    source: 'sms',
    date: new Date(2026, 3, 20).toISOString(),
    confirmed: true,
  },
  {
    id: '3',
    amount: -8420,
    category: 'cafe',
    merchant: 'Surf Coffee',
    description: 'Кофе и завтраки',
    source: 'sms',
    date: new Date(2026, 3, 22).toISOString(),
    confirmed: true,
  },
  {
    id: '4',
    amount: -340,
    category: 'cafe',
    merchant: 'Surf Coffee',
    description: 'Кофе',
    source: 'voice',
    date: new Date(2026, 3, 26, 9, 12).toISOString(),
    confirmed: true,
  },
  {
    id: '5',
    amount: -6200,
    category: 'food',
    merchant: 'Пятёрочка',
    description: 'Продуктовый магазин',
    source: 'sms',
    date: new Date(2026, 3, 25).toISOString(),
    confirmed: true,
  },
  {
    id: '6',
    amount: -3800,
    category: 'transport',
    merchant: 'Яндекс Такси',
    description: 'Поездки на такси',
    source: 'push',
    date: new Date(2026, 3, 24).toISOString(),
    confirmed: true,
  },
  {
    id: '7',
    amount: -1998,
    category: 'entertainment',
    merchant: 'Подписки',
    description: 'Netflix, Spotify и др.',
    source: 'sms',
    date: new Date(2026, 3, 1).toISOString(),
    confirmed: true,
  },
  {
    id: '8',
    amount: -4100,
    category: 'health',
    merchant: 'Аптека',
    description: 'Лекарства',
    source: 'sms',
    date: new Date(2026, 3, 18).toISOString(),
    confirmed: true,
  },
];

export const MOCK_BUDGETS: Budget[] = [
  { id: 'b1', category: 'food', limit: 15000, spent: 6200, month: 3, year: 2026 },
  { id: 'b2', category: 'cafe', limit: 7000, spent: 8760, month: 3, year: 2026 },
  { id: 'b3', category: 'shopping', limit: 15000, spent: 18450, month: 3, year: 2026 },
  { id: 'b4', category: 'transport', limit: 5000, spent: 3800, month: 3, year: 2026 },
  { id: 'b5', category: 'entertainment', limit: 3000, spent: 1998, month: 3, year: 2026 },
  { id: 'b6', category: 'health', limit: 5000, spent: 4100, month: 3, year: 2026 },
];

export const MOCK_INSIGHTS = [
  {
    tone: 'roast' as const,
    text: 'Ты был в Surf Coffee 21 раз в этом месяце. Это уже не кофе — это аренда стола.',
  },
  {
    tone: 'warn' as const,
    text: 'У тебя 6 активных подписок на 1 998 ₽/мес. Netflix, Spotify, два VPN и ещё два сервиса, которые ты точно не помнишь.',
  },
  {
    tone: 'good' as const,
    text: 'Продукты в этом месяце на 18% ниже, чем в марте. Отличный результат.',
  },
];

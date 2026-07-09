/** Known bank SMS sender names for filtering */
export const BANK_SENDERS = [
  'SBERBANK', 'Sberbank', 'SberBank', 'Сбербанк', 'СБЕРБАНК', 'Сбер', 'СберБизнес', 'Sber Business',
  'TINKOFF', 'Tinkoff', 'T-Bank', 'TBANK', 'Тинькофф', 'ТИНЬКОФФ', 'Тиньков', 'ТБанк', 'Т-Банк',
  'T-Business', 'TBusiness', 'Т-Бизнес', 'ТБизнес', 'Tinkoff Business', 'Тинькофф Бизнес',
  'ALFABANK', 'AlfaBank', 'Alfa', 'ALFA', 'Альфа', 'АльфаБанк', 'АЛЬФАБАНК',
  'VTBANK', 'VTB', 'Vtb', 'ВТБ',
  'RAIFFEISEN', 'Raiffeisen', 'RAIF', 'Райффайзен',
  'GAZPROMBANK', 'GPB', 'Gpb', 'Газпромбанк',
  'POCHTABANK', 'PostBank', 'Почта Банк', 'ПочтаБанк',
  'SOVCOMBANK', 'Sovcombank', 'Совкомбанк',
  'OZONBANK', 'Ozon', 'OzonBank', 'Озон',
  'YANDEXBANK', 'YMoney', 'Ymoney', 'YMONEY', 'ЮMoney', 'Юmoney', 'Яндекс',
  'PSB', 'Psb', 'PROMSVYAZ', 'Промсвязьбанк',
  'RNKB', 'MTS', 'MTSBank', 'МТС',
  'ROSBANK', 'Rosbank', 'Росбанк',
  'URALSIB', 'Uralsib', 'Уралсиб',
  'HOMECREDIT', 'HomeCredit', 'ХоумКредит',
];

/** Regex to extract amount from bank SMS */
export const AMOUNT_REGEX = /(\d[\d\u00A0\s]*[.,]?\d*)\s*(₽|р\.|р\b|руб\.?|RUB)/i;

/** Determines if SMS text is an expense */
export function isExpense(text: string): boolean {
  const lower = text.toLowerCase();
  // "оплата по счёту/договору" — это входящий платёж от клиента (доход ИП), не расход
  if (/оплата\s+по\s+(счёт|счет|договор)/.test(lower)) return false;
  return /покупка|оплата|списание|расход|перевод\s*с|штраф|платёж|платеж|налог|усн|ндс|взнос|комиссия\s+банка|purchase|payment/.test(lower)
    || /\bс\s+карты\b/.test(lower);
}

/** Determines if SMS text is income */
export function isIncome(text: string): boolean {
  const lower = text.toLowerCase();
  return /зачисление|поступление|пополнение|зарплата|возврат|приход|выручка|перевод\s+от|получен\s+платёж|получен\s+платеж|оплата\s+по\s+(счёт|счет|договор)/.test(lower);
}

/** Extract amount as a number from SMS text. Returns null if not found. */
export function extractAmount(text: string): number | null {
  const match = AMOUNT_REGEX.exec(text);
  if (!match) return null;
  const raw = match[1].replace(/[\s\u00A0]/g, '').replace(',', '.');
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

/** Check if a sender is a known bank */
export function isBankSender(sender: string): boolean {
  return BANK_SENDERS.some(b => sender.includes(b));
}

/** Extract merchant name from SMS (rough heuristic) */
export function extractMerchant(text: string): string {
  // Try to find text after common keywords
  const patterns = [
    /(?:в\s+|магазин\s+|у\s+|в\s+магазине\s+)([A-ZА-Я][^\s,;.]{1,40})/i,
    /([A-Z]{3,}(?:\s[A-Z]{2,})*)/,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[1].trim();
  }
  return '';
}

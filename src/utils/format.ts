/** Format a number with spaces as thousands separator: 147820 → "147 820" */
export function fmtPlain(n: number): string {
  return Math.abs(n)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/** Format with sign: +5000 → "+5 000", -1200 → "−1 200" */
export function fmtSigned(n: number): string {
  const abs = fmtPlain(n);
  return n >= 0 ? `+${abs}` : `\u2212${abs}`;
}

/** Short month name in Russian */
const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export function fmtMonthName(month: number): string {
  return MONTHS_RU[month] ?? '';
}

export function fmtMonthYear(month: number, year: number): string {
  return `${MONTHS_RU[month]?.toUpperCase()} ${year}`;
}

export function fmtDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

export function fmtTime(isoDate: string): string {
  const d = new Date(isoDate);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

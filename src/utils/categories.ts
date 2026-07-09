import { Category } from '../types';
import { SB } from '../theme/colors';

export interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
  dot: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  food: { label: 'Продукты', icon: '🛒', color: SB.lime, dot: SB.lime },
  cafe: { label: 'Кафе', icon: '☕', color: SB.peach, dot: SB.peach },
  transport: { label: 'Транспорт', icon: '🚗', color: '#7EB8FF', dot: '#7EB8FF' },
  health: { label: 'Здоровье', icon: '💊', color: '#FF8FAB', dot: '#FF8FAB' },
  entertainment: { label: 'Развлечения', icon: '🎬', color: '#B4A0FF', dot: '#B4A0FF' },
  shopping: { label: 'Покупки', icon: '🛍️', color: SB.peach, dot: SB.peach },
  utilities: { label: 'ЖКХ и связь', icon: '🏠', color: '#A0D4B4', dot: '#A0D4B4' },
  salary: { label: 'Зарплата', icon: '💰', color: SB.lime, dot: SB.lime },
  transfer: { label: 'Переводы', icon: '🔄', color: SB.muted, dot: SB.strokeHi },
  other: { label: 'Другое', icon: '📦', color: SB.muted, dot: SB.strokeHi },
};

export function getCategoryMeta(cat: Category): CategoryMeta {
  return CATEGORY_META[cat] ?? CATEGORY_META.other;
}

export const ALL_CATEGORIES: Category[] = Object.keys(CATEGORY_META) as Category[];

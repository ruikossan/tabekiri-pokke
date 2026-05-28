import { addDays, differenceInCalendarDays, formatISO, isValid, parseISO } from "date-fns";
import { ExpiryCandidate, ShoppingItem, ShoppingTemplate, StockItem } from "../types";

export const MANUAL_EXPIRY_CANDIDATE: ExpiryCandidate = { label: "日付を選ぶ", type: "date" };

export const genericExpiryCandidates: ExpiryCandidate[] = [
  { label: "今日", days: 0 },
  { label: "明日", days: 1 },
  { label: "3日後", days: 3 },
  { label: "5日後", days: 5 },
  { label: "7日後", days: 7 },
  { label: "14日後", days: 14 },
  { label: "30日後", days: 30 },
  { label: "90日後", days: 90 },
  { label: "半年後", days: 180 },
  { label: "1年後", days: 365 },
  MANUAL_EXPIRY_CANDIDATE
];

const categoryCandidateDays: Record<string, number[]> = {
  "乳製品": [3, 5, 7, 14, 30],
  "野菜": [0, 3, 5, 7, 14],
  "肉・魚": [0, 1, 3, 5, 7],
  "冷凍食品": [30, 90, 180, 365],
  "缶詰": [180, 365, 730, 1095],
  "レトルト": [90, 180, 365, 730],
  "飲料": [30, 90, 180, 365],
  "主食": [30, 90, 180, 365],
  "調味料": [90, 180, 365, 730],
  "その他": [0, 1, 7, 30, 90, 365]
};

const legacyCategoryCandidateDays: Record<string, number[]> = {
  "荵ｳ陬ｽ蜩・": [3, 5, 7, 14, 30],
  "驥手除": [0, 3, 5, 7, 14],
  "閧峨・鬲・": [0, 1, 3, 5, 7],
  "蜀ｷ蜃埼｣溷刀": [30, 90, 180, 365],
  "郛ｶ隧ｰ": [180, 365, 730, 1095],
  "繝ｬ繝医Ν繝・": [90, 180, 365, 730],
  "鬟ｲ譁・": [30, 90, 180, 365],
  "荳ｻ鬟・": [30, 90, 180, 365],
  "隱ｿ蜻ｳ譁・": [90, 180, 365, 730],
  "縺昴・莉・": [0, 1, 7, 30, 90, 365]
};

function toCandidate(days: number): ExpiryCandidate {
  const existing = genericExpiryCandidates.find((candidate) => candidate.days === days);
  return existing ?? { label: `${days}日後`, days };
}

export function calculateExpiryDate(days: number): string {
  return formatISO(addDays(new Date(), days), { representation: "date" });
}

export function getDefaultExpiryCandidates(category?: string): ExpiryCandidate[] {
  const days = category ? categoryCandidateDays[category] ?? legacyCategoryCandidateDays[category] : undefined;
  return days ? [...days.map(toCandidate), MANUAL_EXPIRY_CANDIDATE] : genericExpiryCandidates;
}

export function calculateDefaultExpiryDays(expiryDate?: string): number | undefined {
  if (!expiryDate) return undefined;
  const parsed = parseISO(expiryDate);
  if (!isValid(parsed)) return undefined;
  return Math.max(0, differenceInCalendarDays(parsed, new Date()));
}

export function formatDefaultExpiryLabel(days?: number): string {
  if (days === undefined) return "期限目安なし";
  if (days === 0) return "購入日当日";
  if (days === 1) return "購入日+1日";
  if (days === 180) return "購入日+半年";
  if (days === 365) return "購入日+1年";
  if (days === 730) return "購入日+2年";
  if (days === 1095) return "購入日+3年";
  return `購入日+${days}日`;
}

export const formatDefaultExpiryDays = formatDefaultExpiryLabel;

export function normalizeItemName(name: string): string {
  return name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function findFavoriteByName(items: ShoppingTemplate[], name: string): ShoppingTemplate | undefined {
  const normalized = normalizeItemName(name);
  if (!normalized) return undefined;
  return items.find((item) => normalizeItemName(item.name) === normalized);
}

export function findFavoriteByBarcode(items: ShoppingTemplate[], barcode?: string): ShoppingTemplate | undefined {
  const normalized = barcode?.trim();
  if (!normalized) return undefined;
  return items.find((item) => item.barcode?.trim() === normalized);
}

export function findLatestStockByName(items: StockItem[], name: string): StockItem | undefined {
  const normalized = normalizeItemName(name);
  if (!normalized) return undefined;
  return [...items]
    .filter((item) => normalizeItemName(item.name) === normalized)
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))[0];
}

export function createFavoriteFromStock(item: StockItem): ShoppingTemplate {
  const now = new Date().toISOString();
  return {
    id: `template-${Date.now()}`,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    location: item.location,
    defaultExpiryDays: calculateDefaultExpiryDays(item.expiryDate),
    barcode: item.barcode,
    memo: item.memo,
    createdAt: now,
    updatedAt: now
  };
}

export function addStockFromFavorite(favoriteItem: ShoppingTemplate): StockItem {
  const now = new Date().toISOString();
  return {
    id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: favoriteItem.name,
    barcode: favoriteItem.barcode,
    category: favoriteItem.category ?? "その他",
    quantity: favoriteItem.quantity,
    unit: favoriteItem.unit,
    expiryDate: favoriteItem.defaultExpiryDays !== undefined ? calculateExpiryDate(favoriteItem.defaultExpiryDays) : undefined,
    location: favoriteItem.location ?? "冷蔵庫",
    memo: favoriteItem.memo,
    shouldRestock: true,
    createdAt: now,
    updatedAt: now
  };
}

export function addStockFromShoppingItem(shoppingItem: ShoppingItem, favorite?: ShoppingTemplate): StockItem {
  const base = favorite ? addStockFromFavorite(favorite) : addStockFromFavorite({
    id: `template-${Date.now()}`,
    name: shoppingItem.name,
    quantity: shoppingItem.quantity ?? 1,
    unit: shoppingItem.unit ?? "個",
    defaultExpiryDays: 7
  });
  return {
    ...base,
    name: shoppingItem.name,
    quantity: shoppingItem.quantity ?? base.quantity,
    unit: shoppingItem.unit ?? base.unit
  };
}

export function upsertFavoriteItem(items: ShoppingTemplate[], item: ShoppingTemplate): ShoppingTemplate[] {
  const existing = findFavoriteByName(items, item.name);
  const now = new Date().toISOString();
  if (!existing) {
    return [{ ...item, createdAt: item.createdAt ?? now, updatedAt: now }, ...items];
  }

  return items.map((current) => current.id === existing.id ? {
    ...current,
    ...item,
    id: current.id,
    createdAt: current.createdAt ?? now,
    updatedAt: now
  } : current);
}

import { differenceInCalendarDays, parseISO } from "date-fns";
import { colors } from "../constants/colors";
import { ExpiryStatus, StockItem } from "../types";

export function getExpiryStatus(expiryDate?: string): ExpiryStatus {
  if (!expiryDate) return "期限なし";

  const days = differenceInCalendarDays(parseISO(expiryDate), new Date());
  if (days < 0) return "期限切れ";
  if (days <= 7) return "7日以内";
  if (days <= 30) return "30日以内";
  if (days <= 90) return "90日以内";
  return "余裕あり";
}

export function getDaysUntilExpiry(expiryDate?: string): number | undefined {
  if (!expiryDate) return undefined;
  return differenceInCalendarDays(parseISO(expiryDate), new Date());
}

export function getStatusColor(status: ExpiryStatus): string {
  switch (status) {
    case "期限切れ":
      return colors.danger;
    case "7日以内":
      return colors.warning;
    case "30日以内":
      return colors.yellow;
    case "90日以内":
      return colors.primary;
    case "余裕あり":
      return colors.success;
    default:
      return colors.textSub;
  }
}

export function sortByExpiry(items: StockItem[]): StockItem[] {
  return [...items].sort((a, b) => {
    const aDays = getDaysUntilExpiry(a.expiryDate) ?? Number.MAX_SAFE_INTEGER;
    const bDays = getDaysUntilExpiry(b.expiryDate) ?? Number.MAX_SAFE_INTEGER;
    return aDays - bDays;
  });
}

export function isExpiringWithin(item: StockItem, days: number): boolean {
  const remaining = getDaysUntilExpiry(item.expiryDate);
  return remaining !== undefined && remaining >= 0 && remaining <= days;
}

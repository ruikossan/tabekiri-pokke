import { formatISO } from "date-fns";
import { AppSettings, ShoppingItem, ShoppingReason, StockItem } from "../types";
import { getDaysUntilExpiry } from "./expiryUtils";
import { calculateRequirements } from "./stockCalculator";

function createShoppingItem(name: string, reason: ShoppingReason, quantity?: number, unit?: string): ShoppingItem {
  const stableKey = `${reason}-${name}-${unit ?? ""}`;
  return {
    id: `auto-${stableKey}`,
    name,
    quantity,
    unit,
    reason,
    checked: false,
    createdAt: formatISO(new Date())
  };
}

export function generateAutoShoppingItems(
  stockItems: StockItem[],
  settings: AppSettings,
  manualItems: ShoppingItem[]
): ShoppingItem[] {
  const autoItems: ShoppingItem[] = [];

  calculateRequirements(stockItems, settings)
    .filter((result) => result.shortage > 0)
    .forEach((result) => {
      autoItems.push(createShoppingItem(result.label, "不足", result.shortage, result.unit));
    });

  stockItems.forEach((item) => {
    const remaining = getDaysUntilExpiry(item.expiryDate);
    if (item.shouldRestock && remaining !== undefined && remaining <= 30) {
      autoItems.push(createShoppingItem(item.name, "期限間近", item.quantity, item.unit));
    }
  });

  const currentAutoIds = new Set(autoItems.map((item) => item.id));
  const activeItems = manualItems.filter((item) => !item.id.startsWith("auto-") || currentAutoIds.has(item.id));
  return mergeShoppingItems([...autoItems, ...activeItems]);
}

export function mergeShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  items.forEach((item) => {
    const key = item.id.startsWith("auto-") ? item.id : `${item.name}-${item.reason}-${item.unit ?? ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }

    map.set(key, {
      ...existing,
      quantity: existing.id === item.id ? item.quantity ?? existing.quantity : (existing.quantity ?? 0) + (item.quantity ?? 0),
      checked: existing.checked || item.checked
    });
  });

  return Array.from(map.values()).sort((a, b) => a.checked === b.checked ? 0 : a.checked ? 1 : -1);
}

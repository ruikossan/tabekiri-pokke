import { formatISO } from "date-fns";
import { AppSettings, ShoppingItem, ShoppingReason, StockItem } from "../types";
import { getDaysUntilExpiry } from "./expiryUtils";

function createShoppingItem(name: string, reason: ShoppingReason, quantity?: number, unit?: string, source: ShoppingItem["source"] = "manual"): ShoppingItem {
  const stableKey = `${reason}-${name}-${unit ?? ""}`;
  return {
    id: `auto-${stableKey}`,
    name,
    quantity,
    unit,
    reason,
    checked: false,
    source,
    status: "pending",
    createdAt: formatISO(new Date())
  };
}

export function generateAutoShoppingItems(
  stockItems: StockItem[],
  settings: AppSettings,
  manualItems: ShoppingItem[]
): ShoppingItem[] {
  const autoItems: ShoppingItem[] = [];
  void settings;

  stockItems.forEach((item) => {
    const remaining = getDaysUntilExpiry(item.expiryDate);
    if (item.shouldRestock && remaining !== undefined && remaining <= 30) {
      autoItems.push(createShoppingItem(item.name, "買い足し予定", item.quantity, item.unit, "nearExpiry"));
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
      map.set(key, { ...item, status: item.status ?? (item.checked ? "purchased" : "pending") });
      return;
    }

    map.set(key, {
      ...existing,
      quantity: existing.id === item.id ? item.quantity ?? existing.quantity : (existing.quantity ?? 0) + (item.quantity ?? 0),
      checked: existing.checked || item.checked,
      status: existing.checked || item.checked ? "purchased" : "pending"
    });
  });

  return Array.from(map.values()).sort((a, b) => a.checked === b.checked ? 0 : a.checked ? 1 : -1);
}

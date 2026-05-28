import { addDays, formatISO } from "date-fns";
import { AppSettings, StockItem } from "../types";

const today = new Date();
const isoDay = (days: number) => formatISO(addDays(today, days), { representation: "date" });
const now = () => new Date().toISOString();

export const defaultSettings: AppSettings = {
  notifyDays: [7, 30, 90],
  inspectionIntervalDays: 90,
  quickActionIds: ["add", "barcode", "expiry", "shopping"]
};

export const sampleStockItems: StockItem[] = [
  { id: "stock-1", name: "牛乳", barcode: "4900000000010", category: "乳製品", quantity: 1, unit: "本", expiryDate: isoDay(5), inspectionDate: isoDay(7), location: "冷蔵庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-2", name: "卵", barcode: "4900000000027", category: "乳製品", quantity: 1, unit: "個", expiryDate: isoDay(10), inspectionDate: isoDay(7), location: "冷蔵庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-3", name: "冷凍うどん", barcode: "4900000000034", category: "冷凍食品", quantity: 5, unit: "食", expiryDate: isoDay(45), inspectionDate: isoDay(30), location: "冷凍庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-4", name: "レトルトカレー", category: "レトルト", quantity: 6, unit: "食", expiryDate: isoDay(80), inspectionDate: isoDay(45), location: "パントリー", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-5", name: "飲料水 2L", category: "飲料", quantity: 6, unit: "本", expiryDate: isoDay(120), inspectionDate: isoDay(60), location: "パントリー", shouldRestock: true, createdAt: now(), updatedAt: now() }
];

export const defaultShoppingTemplates = [
  { id: "template-1", name: "牛乳", quantity: 1, unit: "本", category: "乳製品", location: "冷蔵庫", defaultExpiryDays: 7 },
  { id: "template-2", name: "卵", quantity: 1, unit: "個", category: "乳製品", location: "冷蔵庫", defaultExpiryDays: 14 },
  { id: "template-3", name: "冷凍うどん", quantity: 5, unit: "食", category: "冷凍食品", location: "冷凍庫", defaultExpiryDays: 90 },
  { id: "template-4", name: "飲料水 2L", quantity: 6, unit: "本", category: "飲料", location: "パントリー", defaultExpiryDays: 365 },
  { id: "template-5", name: "レトルト食品", quantity: 6, unit: "食", category: "レトルト", location: "パントリー", defaultExpiryDays: 365 }
];

export const beginnerStockSuggestions = [
  "牛乳",
  "卵",
  "冷凍うどん",
  "飲料水",
  "レトルト食品",
  "缶詰",
  "米",
  "調味料",
  "お菓子"
];

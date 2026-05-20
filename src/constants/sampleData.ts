import { addDays, formatISO } from "date-fns";
import { AppSettings, EmergencyBagItem, StockItem } from "../types";

const today = new Date();
const isoDay = (days: number) => formatISO(addDays(today, days), { representation: "date" });
const now = () => new Date().toISOString();

export const defaultSettings: AppSettings = {
  familySize: 3,
  stockDays: 3,
  notifyDays: [7, 30, 90],
  inspectionIntervalDays: 90
};

export const defaultEmergencyBagItems: EmergencyBagItem[] = [
  { name: "飲料水", category: "水・食料" },
  { name: "非常食", category: "水・食料" },
  { name: "懐中電灯", category: "ライト・電源" },
  { name: "予備電池", category: "ライト・電源" },
  { name: "モバイルバッテリー", category: "ライト・電源" },
  { name: "救急セット", category: "医薬品" },
  { name: "常備薬", category: "医薬品" },
  { name: "現金", category: "貴重品" },
  { name: "身分証コピー", category: "貴重品" },
  { name: "軍手", category: "道具" },
  { name: "笛", category: "道具" },
  { name: "マスク", category: "衛生用品" },
  { name: "ウェットティッシュ", category: "衛生用品" },
  { name: "簡易トイレ", category: "衛生用品" },
  { name: "防寒具", category: "衣類・防寒" }
].map((item, index) => ({
  id: `bag-${index + 1}`,
  name: item.name,
  category: item.category,
  checked: index < 5
}));

export const emergencyBagCategories = ["水・食料", "ライト・電源", "衛生用品", "医薬品", "貴重品", "衣類・防寒", "道具", "その他"];

export const sampleStockItems: StockItem[] = [
  { id: "stock-1", name: "牛乳", barcode: "4900000000010", category: "乳製品", quantity: 1, unit: "本", expiryDate: isoDay(5), inspectionDate: isoDay(7), location: "冷蔵庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-2", name: "卵", barcode: "4900000000027", category: "乳製品", quantity: 1, unit: "個", expiryDate: isoDay(10), inspectionDate: isoDay(7), location: "冷蔵庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-3", name: "冷凍うどん", barcode: "4900000000034", category: "冷凍食品", quantity: 5, unit: "食", expiryDate: isoDay(45), inspectionDate: isoDay(30), location: "冷凍庫", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-4", name: "レトルトカレー", category: "レトルト", quantity: 6, unit: "食", expiryDate: isoDay(80), inspectionDate: isoDay(45), location: "パントリー", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-5", name: "飲料水 2L", category: "飲料", quantity: 6, unit: "本", expiryDate: isoDay(120), inspectionDate: isoDay(60), location: "パントリー", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-6", name: "簡易トイレ", category: "防災用品", quantity: 20, unit: "回分", inspectionDate: isoDay(60), location: "防災バッグ", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-7", name: "モバイルバッテリー", category: "防災用品", quantity: 1, unit: "個", location: "防災バッグ", shouldRestock: false, createdAt: now(), updatedAt: now() },
  { id: "stock-8", name: "乾電池", category: "防災用品", quantity: 8, unit: "本", location: "防災バッグ", shouldRestock: true, createdAt: now(), updatedAt: now() },
  { id: "stock-9", name: "救急セット", category: "医薬品", quantity: 1, unit: "個", location: "防災バッグ", shouldRestock: false, createdAt: now(), updatedAt: now() }
];

export const defaultShoppingTemplates = [
  { id: "template-1", name: "牛乳", quantity: 1, unit: "本" },
  { id: "template-2", name: "卵", quantity: 1, unit: "個" },
  { id: "template-3", name: "冷凍うどん", quantity: 5, unit: "食" },
  { id: "template-4", name: "飲料水 2L", quantity: 6, unit: "本" },
  { id: "template-5", name: "レトルト食品", quantity: 6, unit: "食" }
];

export const beginnerStockSuggestions = [
  "飲料水",
  "主食",
  "レトルト食品",
  "缶詰",
  "簡易トイレ",
  "懐中電灯",
  "モバイルバッテリー",
  "乾電池",
  "救急セット",
  "常備薬",
  "現金",
  "マスク"
];

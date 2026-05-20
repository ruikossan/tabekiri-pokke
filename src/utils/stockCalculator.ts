import { AppSettings, RequirementResult, StockItem } from "../types";

function parseNumberBefore(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function estimateLiters(item: StockItem): number {
  if (item.unit === "L") return item.quantity;
  if (item.unit === "本") {
    const liters = parseNumberBefore(item.name, /(\d+(?:\.\d+)?)\s*L/i);
    const milliliters = parseNumberBefore(item.name, /(\d+(?:\.\d+)?)\s*ml/i);
    if (liters) return item.quantity * liters;
    if (milliliters) return item.quantity * (milliliters / 1000);
  }
  return 0;
}

function sumByRequirement(items: StockItem[], predicate: (item: StockItem) => boolean, toRequirementUnit: (item: StockItem) => number): number {
  return items.filter(predicate).reduce((total, item) => total + toRequirementUnit(item), 0);
}

export function calculateRequirements(items: StockItem[], settings: AppSettings): RequirementResult[] {
  const waterRequired = settings.familySize * settings.stockDays * 3;
  const foodRequired = settings.familySize * settings.stockDays * 3;
  const toiletRequired = settings.familySize * settings.stockDays * 5;

  const waterCurrent = sumByRequirement(items, (item) => item.category === "飲料" || item.name.includes("水"), estimateLiters);
  const foodCurrent = sumByRequirement(items, (item) => ["主食", "レトルト", "缶詰", "冷凍食品"].includes(item.category), (item) => item.unit === "食" ? item.quantity : 0);
  const toiletCurrent = sumByRequirement(items, (item) => item.name.includes("トイレ") || item.category.includes("トイレ"), (item) => item.unit === "回分" ? item.quantity : 0);

  return [
    createRequirement("water", "水", waterRequired, waterCurrent, "L"),
    createRequirement("food", "食料", foodRequired, foodCurrent, "食"),
    createRequirement("toilet", "簡易トイレ", toiletRequired, toiletCurrent, "回分")
  ];
}

function createRequirement(
  key: RequirementResult["key"],
  label: string,
  required: number,
  current: number,
  unit: string
): RequirementResult {
  const shortage = Math.max(required - current, 0);
  const rate = required === 0 ? 100 : Math.min(Math.round((current / required) * 100), 100);
  return { key, label, required, current, shortage, unit, rate };
}

export function countShortages(items: StockItem[], settings: AppSettings): number {
  return calculateRequirements(items, settings).filter((result) => result.shortage > 0).length;
}

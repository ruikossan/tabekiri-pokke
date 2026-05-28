export const units = ["個", "本", "袋", "箱", "食", "L", "kg", "回分"];

export const defaultUnitByCategory: Record<string, string> = {
  野菜: "個",
  "肉・魚": "個",
  乳製品: "個",
  冷凍食品: "袋",
  調味料: "本",
  飲料: "L",
  主食: "食",
  レトルト: "食",
  缶詰: "食",
  お菓子: "個",
  日用品: "個",
  医薬品: "個",
  その他: "個"
};

export const unitOptionsByCategory: Record<string, string[]> = {
  野菜: ["個", "袋", "kg"],
  "肉・魚": ["個", "袋", "kg"],
  乳製品: ["個", "本", "箱"],
  冷凍食品: ["袋", "個", "箱"],
  調味料: ["本", "個", "袋"],
  飲料: ["L", "本"],
  主食: ["食", "袋", "箱"],
  レトルト: ["食", "袋", "箱"],
  缶詰: ["食", "個"],
  お菓子: ["個", "袋", "箱"],
  日用品: ["個", "本", "袋", "箱"],
  医薬品: ["個", "本", "箱"],
  その他: units
};

export function getUnitOptionsForCategory(category: string, currentUnit?: string): string[] {
  const options = unitOptionsByCategory[category] ?? units;
  return currentUnit && !options.includes(currentUnit) ? [currentUnit, ...options] : options;
}

export function getDefaultUnitForCategory(category: string): string {
  return defaultUnitByCategory[category] ?? "個";
}

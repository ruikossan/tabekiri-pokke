import { AppSettings, EmergencyBagItem, PreparednessScore, StockItem } from "../types";
import { getDaysUntilExpiry } from "./expiryUtils";

export function calculatePreparednessScore(
  stockItems: StockItem[],
  bagItems: EmergencyBagItem[],
  settings: AppSettings
): PreparednessScore {
  let score = 100;
  const messages: string[] = [];
  const details: PreparednessScore["details"] = [];

  void bagItems;
  void settings;
  details.push({ label: "食品ストックを確認できます", points: 0, tone: "success" });

  const expired = stockItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days < 0;
  }).length;
  if (expired > 0) {
    const points = Math.min(expired * 10, 25);
    score -= points;
    messages.push(`期限切れが${expired}件あります`);
    details.push({ label: `期限切れ ${expired}件`, points: -points, tone: "danger" });
  }

  const expiringSoon = stockItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days >= 0 && days <= 30;
  }).length;
  if (expiringSoon > 0) {
    const points = Math.min(expiringSoon * 4, 16);
    score -= points;
    messages.push(`30日以内の期限が${expiringSoon}件あります`);
    details.push({ label: `30日以内 ${expiringSoon}件`, points: -points, tone: "yellow" });
  }

  if (stockItems.length === 0) {
    score = 0;
    messages.push("食品がまだ登録されていません");
    details.push({ label: "食品未登録", points: -100, tone: "danger" });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    messages: messages.length > 0 ? messages : ["食品ストックの期限管理は良好です"],
    details
  };
}

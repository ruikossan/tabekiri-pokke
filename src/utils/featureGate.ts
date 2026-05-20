import { Plan, PremiumFeature } from "../types";

export const FREE_STOCK_ITEM_LIMIT = 50;
export const FREE_RECEIPT_SCAN_MONTHLY_LIMIT = 5;
export const FREE_RECEIPT_IMPORT_ITEM_LIMIT = 10;

export function canUseFeature(plan: Plan, feature: PremiumFeature): boolean {
  const premiumConvenienceFeatures: PremiumFeature[] = [
    "adFree",
    "familyShare",
    "cloudSync",
    "pdfExport",
    "lineNotification"
  ];

  return plan === "premium" || !premiumConvenienceFeatures.includes(feature);
}

export function canAddStockItem(plan: Plan, currentCount: number): boolean {
  return plan === "premium" || currentCount < FREE_STOCK_ITEM_LIMIT;
}

export function getRemainingFreeItems(plan: Plan, currentCount: number): number | undefined {
  if (plan === "premium") return undefined;
  return Math.max(FREE_STOCK_ITEM_LIMIT - currentCount, 0);
}

export function canScanReceipt(plan: Plan, monthlyScanCount: number): boolean {
  return plan === "premium" || monthlyScanCount < FREE_RECEIPT_SCAN_MONTHLY_LIMIT;
}

export function canImportReceiptItems(plan: Plan, itemCount: number): boolean {
  return plan === "premium" || itemCount <= FREE_RECEIPT_IMPORT_ITEM_LIMIT;
}

export function getRemainingReceiptScans(plan: Plan, monthlyScanCount: number): number | undefined {
  if (plan === "premium") return undefined;
  return Math.max(FREE_RECEIPT_SCAN_MONTHLY_LIMIT - monthlyScanCount, 0);
}

export const currentPlan: Plan = "free";

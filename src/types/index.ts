export type StockItem = {
  id: string;
  name: string;
  barcode?: string;
  imageUri?: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  plannedUseDate?: string;
  inspectionDate?: string;
  location: string;
  memo?: string;
  shouldRestock: boolean;
  notificationIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmergencyBagItem = {
  id: string;
  name: string;
  category?: string;
  checked: boolean;
};

export type ShoppingReason = "不足" | "期限間近" | "手動追加";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  reason: ShoppingReason;
  checked: boolean;
  createdAt: string;
};

export type AppSettings = {
  familySize: number;
  stockDays: number;
  notifyDays: number[];
  inspectionIntervalDays: number;
};

export type StockHistoryType = "消費" | "購入" | "点検";

export type StockHistoryItem = {
  id: string;
  type: StockHistoryType;
  stockItemId?: string;
  name: string;
  quantity?: number;
  unit?: string;
  memo?: string;
  createdAt: string;
};

export type ShoppingTemplate = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export type Plan = "free" | "premium";

export type PremiumFeature =
  | "unlimitedItems"
  | "adFree"
  | "emergencyStock"
  | "familyShare"
  | "multiLocation"
  | "barcodeScan"
  | "receiptScan"
  | "customChecklist"
  | "pdfExport"
  | "advancedShoppingList"
  | "cloudSync"
  | "lineNotification"
  | "aiAdvice";

export type ExpiryStatus =
  | "期限切れ"
  | "7日以内"
  | "30日以内"
  | "90日以内"
  | "余裕あり"
  | "期限なし";

export type RequirementKey = "water" | "food" | "toilet";

export type RequirementResult = {
  key: RequirementKey;
  label: string;
  required: number;
  current: number;
  shortage: number;
  unit: string;
  rate: number;
};

export type PreparednessScore = {
  score: number;
  messages: string[];
  details: {
    label: string;
    points: number;
    tone: "success" | "warning" | "yellow" | "bag" | "danger";
  }[];
};

export type RootStackParamList = {
  Home: undefined;
  StockList: undefined;
  StockForm: { itemId?: string; scannedBarcode?: string } | undefined;
  BarcodeScan: { itemId?: string } | undefined;
  History: undefined;
  LocationView: undefined;
  BeginnerGuide: undefined;
  ShoppingTemplates: undefined;
  Guide: undefined;
  ExpiryCheck: undefined;
  RequirementCheck: undefined;
  EmergencyBag: undefined;
  ShoppingList: undefined;
  Settings: undefined;
};

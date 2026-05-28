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

export type ShoppingReason = "買い足し予定" | "手動追加";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  reason: ShoppingReason;
  checked: boolean;
  source?: "nearExpiry" | "manual";
  status?: "pending" | "purchased";
  createdAt: string;
  updatedAt?: string;
};

export type QuickActionId = "add" | "stock" | "expiry" | "shopping" | "templates" | "location" | "barcode" | "history" | "guide" | "settings";

export type AppSettings = {
  notifyDays: number[];
  inspectionIntervalDays: number;
  quickActionIds: QuickActionId[];
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
  category?: string;
  location?: string;
  defaultExpiryDays?: number;
  barcode?: string;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpiryCandidate = {
  label: string;
  days?: number;
  type?: "date";
};

export type Plan = "free" | "premium";

export type PremiumFeature =
  | "unlimitedItems"
  | "adFree"
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

export type RootStackParamList = {
  Home: undefined;
  StockList: undefined;
  StockForm: {
    itemId?: string;
    scannedBarcode?: string;
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    location?: string;
    expiryDate?: string;
    defaultExpiryDays?: number;
    barcode?: string;
    imageUri?: string;
    fromShoppingListItemId?: string;
    saveToFavoriteDefault?: boolean;
  } | undefined;
  BarcodeScan: { itemId?: string } | undefined;
  ContinuousScan: undefined;
  OcrExpiry: undefined;
  History: undefined;
  LocationView: undefined;
  ShoppingTemplates: undefined;
  Guide: undefined;
  ExpiryCheck: undefined;
  RecipeDetail: { planId: string };
  ShoppingList: undefined;
  Settings: undefined;
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings, ShoppingItem, ShoppingTemplate, StockHistoryItem, StockItem } from "../types";
import { defaultSettings, defaultShoppingTemplates, sampleStockItems } from "../constants/sampleData";

const keys = {
  stockItems: "stockItems",
  shoppingItems: "shoppingItems",
  stockHistoryItems: "stockHistoryItems",
  shoppingTemplates: "shoppingTemplates",
  appSettings: "appSettings",
  hasInitialized: "hasInitialized",
  hasSeenGuide: "hasSeenGuide"
};

export class StorageReadError extends Error {
  constructor(key: string) {
    super(`Failed to read saved data: ${key}`);
    this.name = "StorageReadError";
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    throw new StorageReadError(key);
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  getStockItems: () => getJson<StockItem[]>(keys.stockItems, []),
  saveStockItems: (items: StockItem[]) => setJson(keys.stockItems, items),
  getShoppingItems: () => getJson<ShoppingItem[]>(keys.shoppingItems, []),
  saveShoppingItems: (items: ShoppingItem[]) => setJson(keys.shoppingItems, items),
  getStockHistoryItems: () => getJson<StockHistoryItem[]>(keys.stockHistoryItems, []),
  saveStockHistoryItems: (items: StockHistoryItem[]) => setJson(keys.stockHistoryItems, items),
  getShoppingTemplates: () => getJson<ShoppingTemplate[]>(keys.shoppingTemplates, defaultShoppingTemplates),
  saveShoppingTemplates: (items: ShoppingTemplate[]) => setJson(keys.shoppingTemplates, items),
  async getSettings() {
    const settings = await getJson<Partial<AppSettings>>(keys.appSettings, defaultSettings);
    return { ...defaultSettings, ...settings };
  },
  saveSettings: (settings: AppSettings) => setJson(keys.appSettings, settings),
  getHasInitialized: () => getJson<boolean>(keys.hasInitialized, false),
  setHasInitialized: (value: boolean) => setJson(keys.hasInitialized, value),
  getHasSeenGuide: () => getJson<boolean>(keys.hasSeenGuide, false),
  setHasSeenGuide: (value: boolean) => setJson(keys.hasSeenGuide, value),
  async seedSampleData(): Promise<void> {
    await Promise.all([
      setJson(keys.stockItems, sampleStockItems),
      setJson(keys.shoppingItems, []),
      setJson(keys.stockHistoryItems, []),
      setJson(keys.shoppingTemplates, defaultShoppingTemplates),
      setJson(keys.appSettings, defaultSettings),
      setJson(keys.hasInitialized, true),
      setJson(keys.hasSeenGuide, false)
    ]);
  },
  async resetAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(keys.stockItems),
      AsyncStorage.removeItem(keys.shoppingItems),
      AsyncStorage.removeItem(keys.stockHistoryItems),
      AsyncStorage.removeItem(keys.shoppingTemplates),
      AsyncStorage.removeItem(keys.appSettings),
      AsyncStorage.removeItem(keys.hasInitialized),
      AsyncStorage.removeItem(keys.hasSeenGuide)
    ]);
  }
};

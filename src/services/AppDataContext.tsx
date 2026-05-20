import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { AppSettings, EmergencyBagItem, ShoppingItem, ShoppingTemplate, StockHistoryItem, StockItem } from "../types";
import { defaultEmergencyBagItems, defaultSettings, defaultShoppingTemplates } from "../constants/sampleData";
import { notificationService } from "./notificationService";
import { storageService } from "./storageService";

type AppDataContextValue = {
  loading: boolean;
  showFirstGuide: boolean;
  toast: { id: number; message: string } | null;
  showToast: (message: string) => void;
  clearToast: () => void;
  openFirstGuide: () => void;
  stockItems: StockItem[];
  emergencyBagItems: EmergencyBagItem[];
  shoppingItems: ShoppingItem[];
  stockHistoryItems: StockHistoryItem[];
  shoppingTemplates: ShoppingTemplate[];
  settings: AppSettings;
  addStockItem: (item: StockItem) => Promise<void>;
  updateStockItem: (item: StockItem) => Promise<void>;
  deleteStockItem: (id: string) => Promise<void>;
  consumeStockItem: (id: string) => Promise<void>;
  setEmergencyBagItems: (items: EmergencyBagItem[]) => Promise<void>;
  addShoppingItem: (item: ShoppingItem) => Promise<void>;
  setShoppingItems: (items: ShoppingItem[]) => Promise<void>;
  addStockHistoryItem: (item: StockHistoryItem) => Promise<void>;
  setShoppingTemplates: (items: ShoppingTemplate[]) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  seedSampleData: () => Promise<void>;
  resetAll: () => Promise<void>;
  dismissFirstGuide: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [showFirstGuide, setShowFirstGuide] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [emergencyBagItems, setBagItemsState] = useState<EmergencyBagItem[]>(defaultEmergencyBagItems);
  const [shoppingItems, setShoppingItemsState] = useState<ShoppingItem[]>([]);
  const [stockHistoryItems, setStockHistoryItemsState] = useState<StockHistoryItem[]>([]);
  const [shoppingTemplates, setShoppingTemplatesState] = useState<ShoppingTemplate[]>(defaultShoppingTemplates);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData(): Promise<void> {
    try {
      const hasInitialized = await storageService.getHasInitialized();
      if (!hasInitialized) {
        Alert.alert("お試し内容", "初回起動です。お試し用の内容を入れますか？", [
          { text: "入れない", onPress: () => void initializeEmpty() },
          { text: "入れる", onPress: () => void initializeSample() }
        ]);
      } else {
        await loadStoredData();
        const hasSeenGuide = await storageService.getHasSeenGuide();
        setShowFirstGuide(!hasSeenGuide);
      }
    } catch {
      Alert.alert("読み込みエラー", "保存データを読み込めませんでした。データが壊れている可能性があります。設定の「最初の状態に戻す」で初期化できます。");
    } finally {
      setLoading(false);
    }
  }

  async function initializeEmpty(): Promise<void> {
    await storageService.setHasInitialized(true);
    await loadStoredData();
    setShowFirstGuide(true);
  }

  async function initializeSample(): Promise<void> {
    await storageService.seedSampleData();
    await loadStoredData();
    setShowFirstGuide(true);
  }

  async function loadStoredData(): Promise<void> {
    const [storedStocks, storedBags, storedShopping, storedHistory, storedTemplates, storedSettings] = await Promise.all([
      storageService.getStockItems(),
      storageService.getEmergencyBagItems(),
      storageService.getShoppingItems(),
      storageService.getStockHistoryItems(),
      storageService.getShoppingTemplates(),
      storageService.getSettings()
    ]);
    setStockItems(storedStocks);
    setBagItemsState(storedBags);
    setShoppingItemsState(storedShopping);
    setStockHistoryItemsState(storedHistory);
    setShoppingTemplatesState(storedTemplates);
    setSettings(storedSettings);
  }

  async function saveStocks(items: StockItem[]): Promise<void> {
    setStockItems(items);
    await storageService.saveStockItems(items);
  }

  async function saveBagItems(items: EmergencyBagItem[]): Promise<void> {
    setBagItemsState(items);
    await storageService.saveEmergencyBagItems(items);
  }

  async function saveShopping(items: ShoppingItem[]): Promise<void> {
    setShoppingItemsState(items);
    await storageService.saveShoppingItems(items);
  }

  async function saveHistory(items: StockHistoryItem[]): Promise<void> {
    setStockHistoryItemsState(items);
    await storageService.saveStockHistoryItems(items);
  }

  async function saveTemplates(items: ShoppingTemplate[]): Promise<void> {
    setShoppingTemplatesState(items);
    await storageService.saveShoppingTemplates(items);
  }

  async function saveStockWithNotifications(item: StockItem): Promise<StockItem> {
    await notificationService.cancelNotifications(item.notificationIds);
    const notificationIds = await notificationService.scheduleExpiryNotifications(item, settings);
    return { ...item, notificationIds };
  }

  async function rescheduleAllNotifications(items: StockItem[], nextSettings: AppSettings): Promise<StockItem[]> {
    const nextItems: StockItem[] = [];
    for (const item of items) {
      await notificationService.cancelNotifications(item.notificationIds);
      const notificationIds = await notificationService.scheduleExpiryNotifications(item, nextSettings);
      nextItems.push({ ...item, notificationIds });
    }
    return nextItems;
  }

  const value = useMemo<AppDataContextValue>(() => ({
    loading,
    showFirstGuide,
    toast,
    showToast: (message) => setToast({ id: Date.now(), message }),
    clearToast: () => setToast(null),
    openFirstGuide: () => setShowFirstGuide(true),
    stockItems,
    emergencyBagItems,
    shoppingItems,
    stockHistoryItems,
    shoppingTemplates,
    settings,
    addStockItem: async (item) => {
      const itemWithNotifications = await saveStockWithNotifications(item);
      await saveStocks([itemWithNotifications, ...stockItems]);
    },
    updateStockItem: async (item) => {
      const existing = stockItems.find((current) => current.id === item.id);
      const itemWithOldIds = { ...item, notificationIds: existing?.notificationIds };
      const itemWithNotifications = await saveStockWithNotifications(itemWithOldIds);
      await saveStocks(stockItems.map((current) => current.id === item.id ? itemWithNotifications : current));
    },
    deleteStockItem: async (id) => {
      const existing = stockItems.find((item) => item.id === id);
      await notificationService.cancelNotifications(existing?.notificationIds);
      await saveStocks(stockItems.filter((item) => item.id !== id));
    },
    consumeStockItem: async (id) => {
      const existing = stockItems.find((item) => item.id === id);
      await notificationService.cancelNotifications(existing?.notificationIds);
      if (existing) {
        await saveHistory([{
          id: `history-${Date.now()}`,
          type: "消費",
          stockItemId: existing.id,
          name: existing.name,
          quantity: existing.quantity,
          unit: existing.unit,
          createdAt: new Date().toISOString()
        }, ...stockHistoryItems]);
      }
      await saveStocks(stockItems.filter((item) => item.id !== id));
    },
    setEmergencyBagItems: saveBagItems,
    addShoppingItem: async (item) => saveShopping([item, ...shoppingItems]),
    setShoppingItems: saveShopping,
    addStockHistoryItem: async (item) => saveHistory([item, ...stockHistoryItems]),
    setShoppingTemplates: saveTemplates,
    updateSettings: async (nextSettings) => {
      setSettings(nextSettings);
      await storageService.saveSettings(nextSettings);
      const rescheduledItems = await rescheduleAllNotifications(stockItems, nextSettings);
      setStockItems(rescheduledItems);
      await storageService.saveStockItems(rescheduledItems);
    },
    seedSampleData: async () => {
      await Promise.all(stockItems.map((item) => notificationService.cancelNotifications(item.notificationIds)));
      await storageService.seedSampleData();
      await loadStoredData();
    },
    resetAll: async () => {
      await Promise.all(stockItems.map((item) => notificationService.cancelNotifications(item.notificationIds)));
      await storageService.resetAll();
      setStockItems([]);
      setBagItemsState(defaultEmergencyBagItems);
      setShoppingItemsState([]);
      setStockHistoryItemsState([]);
      setShoppingTemplatesState(defaultShoppingTemplates);
      setSettings(defaultSettings);
      setShowFirstGuide(true);
    },
    dismissFirstGuide: async () => {
      setShowFirstGuide(false);
      await storageService.setHasSeenGuide(true);
    }
  }), [loading, showFirstGuide, toast, stockItems, emergencyBagItems, shoppingItems, stockHistoryItems, shoppingTemplates, settings]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}

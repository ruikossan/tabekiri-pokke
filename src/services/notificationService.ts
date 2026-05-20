import { Platform } from "react-native";
import { parseISO, setHours, setMinutes, setSeconds, subDays } from "date-fns";
import * as Notifications from "expo-notifications";
import { AppSettings, StockItem } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const notificationService = {
  async ensurePermission(): Promise<boolean> {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("food-expiry", {
        name: "賞味期限通知",
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted";
  },

  async cancelNotifications(notificationIds?: string[]): Promise<void> {
    if (!notificationIds || notificationIds.length === 0) return;
    await Promise.all(
      notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
    );
  },

  async scheduleExpiryNotifications(item: StockItem, settings: AppSettings): Promise<string[]> {
    if (!item.expiryDate && !item.inspectionDate) {
      return [];
    }

    const allowed = await this.ensurePermission();
    if (!allowed) return [];

    const now = new Date();
    const notificationIds: string[] = [];

    if (item.expiryDate) {
      const expiryDate = parseISO(item.expiryDate);
      for (const day of settings.notifyDays) {
        const triggerDate = setSeconds(setMinutes(setHours(subDays(expiryDate, day), 9), 0), 0);
        if (triggerDate <= now) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "賞味期限が近づいています",
            body: `${item.name} の賞味期限は ${item.expiryDate} です。`,
            data: { stockItemId: item.id, type: "expiry" }
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: "food-expiry"
          }
        });
        notificationIds.push(id);
      }
    }

    if (item.inspectionDate) {
      const triggerDate = setSeconds(setMinutes(setHours(parseISO(item.inspectionDate), 9), 0), 0);
      if (triggerDate > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "食品の点検日です",
            body: `${item.name} を点検しましょう。`,
            data: { stockItemId: item.id, type: "inspection" }
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: "food-expiry"
          }
        });
        notificationIds.push(id);
      }
    }

    return notificationIds;
  },

  async scheduleTestNotification(): Promise<boolean> {
    const allowed = await this.ensurePermission();
    if (!allowed) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "たべきりポッケ",
        body: "通知のテストです。"
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3
      }
    });

    return true;
  }
};

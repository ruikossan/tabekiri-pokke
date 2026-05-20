import React from "react";
import { ActivityIndicator, Dimensions, PanResponder, StyleSheet, View } from "react-native";
import { CommonActions, NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/constants/colors";
import { FirstLaunchGuide } from "./src/components/FirstLaunchGuide";
import { ToastMessage } from "./src/components/ToastMessage";
import { AppDataProvider, useAppData } from "./src/services/AppDataContext";
import { BarcodeScanScreen } from "./src/screens/BarcodeScanScreen";
import { BeginnerGuideScreen } from "./src/screens/BeginnerGuideScreen";
import { EmergencyBagScreen } from "./src/screens/EmergencyBagScreen";
import { ExpiryCheckScreen } from "./src/screens/ExpiryCheckScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LocationViewScreen } from "./src/screens/LocationViewScreen";
import { RequirementCheckScreen } from "./src/screens/RequirementCheckScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { ShoppingTemplatesScreen } from "./src/screens/ShoppingTemplatesScreen";
import { ShoppingListScreen } from "./src/screens/ShoppingListScreen";
import { StockFormScreen } from "./src/screens/StockFormScreen";
import { StockListScreen } from "./src/screens/StockListScreen";
import { RootStackParamList } from "./src/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

type NavigationHistoryEntry = {
  name: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

const SWIPE_TRIGGER_DISTANCE = 80;
const SWIPE_CAPTURE_DISTANCE = 24;
const SWIPE_DIRECTION_RATIO = 1.8;
const SWIPE_EDGE_WIDTH = 32;

function AppNavigator() {
  const { loading, showFirstGuide, toast, dismissFirstGuide, clearToast } = useAppData();
  const historyRef = React.useRef<NavigationHistoryEntry[]>([]);
  const currentIndexRef = React.useRef(-1);

  function routesMatch(first?: NavigationHistoryEntry, second?: NavigationHistoryEntry): boolean {
    return first?.name === second?.name && JSON.stringify(first?.params ?? null) === JSON.stringify(second?.params ?? null);
  }

  function rememberCurrentRoute(): void {
    const route = navigationRef.getCurrentRoute();

    if (!route) {
      return;
    }

    const currentRoute: NavigationHistoryEntry = {
      name: route.name as keyof RootStackParamList,
      params: route.params as RootStackParamList[keyof RootStackParamList]
    };
    const history = historyRef.current;
    const currentIndex = currentIndexRef.current;

    if (routesMatch(history[currentIndex], currentRoute)) {
      return;
    }

    if (routesMatch(history[currentIndex - 1], currentRoute)) {
      currentIndexRef.current = currentIndex - 1;
      return;
    }

    if (routesMatch(history[currentIndex + 1], currentRoute)) {
      currentIndexRef.current = currentIndex + 1;
      return;
    }

    historyRef.current = [...history.slice(0, currentIndex + 1), currentRoute];
    currentIndexRef.current = historyRef.current.length - 1;
  }

  function handleBackSwipe(): void {
    if (currentIndexRef.current <= 0 || !navigationRef.canGoBack()) {
      return;
    }

    navigationRef.goBack();
  }

  function handleForwardSwipe(): void {
    const nextRoute = historyRef.current[currentIndexRef.current + 1];

    if (!nextRoute) {
      return;
    }

    navigationRef.dispatch(
      CommonActions.navigate({
        name: nextRoute.name,
        params: nextRoute.params
      })
    );
  }

  const swipeResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const horizontalDistance = Math.abs(gestureState.dx);
          const verticalDistance = Math.abs(gestureState.dy);
          const screenWidth = Dimensions.get("window").width;
          const startsAtLeftEdge = gestureState.x0 <= SWIPE_EDGE_WIDTH;
          const startsAtRightEdge = gestureState.x0 >= screenWidth - SWIPE_EDGE_WIDTH;

          return (
            (startsAtLeftEdge || startsAtRightEdge) &&
            horizontalDistance > SWIPE_CAPTURE_DISTANCE &&
            horizontalDistance > verticalDistance * SWIPE_DIRECTION_RATIO
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_TRIGGER_DISTANCE) {
            handleBackSwipe();
          }

          if (gestureState.dx >= SWIPE_TRIGGER_DISTANCE) {
            handleForwardSwipe();
          }
        }
      }),
    []
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.app} {...swipeResponder.panHandlers}>
        <NavigationContainer ref={navigationRef} onReady={rememberCurrentRoute} onStateChange={rememberCurrentRoute}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.textMain,
              headerTitleStyle: { fontWeight: "800" },
              contentStyle: { backgroundColor: colors.background }
            }}
          >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "たべきりポッケ" }} />
          <Stack.Screen name="StockList" component={StockListScreen} options={{ title: "食品ストック一覧" }} />
          <Stack.Screen name="StockForm" component={StockFormScreen} options={{ title: "食品登録" }} />
          <Stack.Screen name="BarcodeScan" component={BarcodeScanScreen} options={{ title: "バーコード読み取り" }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: "履歴" }} />
          <Stack.Screen name="LocationView" component={LocationViewScreen} options={{ title: "場所ごとに見る" }} />
          <Stack.Screen name="BeginnerGuide" component={BeginnerGuideScreen} options={{ title: "防災備蓄リスト" }} />
          <Stack.Screen name="ShoppingTemplates" component={ShoppingTemplatesScreen} options={{ title: "よく買うもの" }} />
          <Stack.Screen name="Guide" component={GuideScreen} options={{ title: "使い方ガイド" }} />
          <Stack.Screen name="ExpiryCheck" component={ExpiryCheckScreen} options={{ title: "期限チェック" }} />
          <Stack.Screen name="RequirementCheck" component={RequirementCheckScreen} options={{ title: "必要量チェック" }} />
          <Stack.Screen name="EmergencyBag" component={EmergencyBagScreen} options={{ title: "防災バッグ" }} />
          <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: "買い物リスト" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "設定" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
      <FirstLaunchGuide visible={showFirstGuide} onClose={() => void dismissFirstGuide()} />
      {toast ? <ToastMessage key={toast.id} message={toast.message} onHide={clearToast} /> : null}
    </>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppNavigator />
    </AppDataProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }
});

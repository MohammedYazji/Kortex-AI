import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { initClassifier } from "@/services/classifier";
import { useAppStore } from "@/store/appStore";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getDatabase } from "../db/database";

// Prevent the splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [dbReady, setDbReady] = useState(false);
  const refreshStats = useAppStore((s) => s.refreshStats);
  const loadRules = useAppStore((s) => s.loadRules);

  // Initialize DB and load initial state
  useEffect(() => {
    async function initApp() {
      try {
        await getDatabase(); // runs schema migrations
        await refreshStats();
        await loadRules();
      } catch (e) {
        console.error("DB init error:", e);
      } finally {
        setDbReady(true);
        // Warm-start the ML classifier in the background.
        // This pre-loads the ONNX model and tokenizer so the first real
        initClassifier().catch(() => {
          /* falls back to keywords silently */
        });
      }
    }
    initApp();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady]);

  if ((!fontsLoaded && !fontError) || !dbReady) return null;

  return (
    <SafeAreaProvider>
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}

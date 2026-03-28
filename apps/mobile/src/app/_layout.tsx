import { Stack } from "expo-router";
import { useEffect } from "react";
import { getDatabase } from "../db/database";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {

  useEffect(() => {
    getDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
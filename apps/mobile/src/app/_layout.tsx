import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* سيوجهنا تلقائياً إلى مجلد (tabs) */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

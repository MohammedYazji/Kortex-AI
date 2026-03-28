import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import type { Notification } from "../../types";
import Colors from "../../constants/Colors";
import { NotificationCard } from "../../components/ui/NotificationCard";
import { useAppStore } from "@/store/appStore";
import {
  getDelayed,
  releaseDelayed,
  markRead,
} from "../../db/notificationDao";

export default function DelayedScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const { themeOverride, notificationVersion } = useAppStore();
  const systemTheme = useColorScheme();

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
        ? Colors.light
        : systemTheme === "dark"
          ? Colors.dark
          : Colors.light;

  const [delayed, setDelayed] = useState<Notification[]>([]);

  const loadDelayed = async () => {
    try {
      const data = await getDelayed();
      setDelayed(
        data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (e) {
      console.error("Failed to load delayed notifications:", e);
    }
  };

  useEffect(() => {
    loadDelayed();
  }, [notificationVersion]);

  const handleReleaseAll = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await releaseDelayed();
    await loadDelayed();
  };

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    await loadDelayed();
  };

  const hasDelayed = delayed.length > 0;

  const instructions = [
    { icon: "zap", text: "Enable focus mode on Dashboard" },
    { icon: "cpu", text: "AI classifies each notification" },
    { icon: "unlock", text: "Release them when you're free" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Delayed Inbox</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {hasDelayed ? `${delayed.length} notifications held` : "Nothing delayed right now"}
            </Text>
          </View>

          {hasDelayed && (
            <Pressable
              onPress={handleReleaseAll}
              style={({ pressed }) => [
                styles.releaseBtn,
                {
                  backgroundColor: theme.tint,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Feather name="unlock" size={16} color="#fff" />
              <Text style={styles.releaseBtnText}>Release All</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content Section */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
          !hasDelayed && { flexGrow: 1 },
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!hasDelayed ? (
          <View style={styles.emptyWrapper}>
            {/* Empty State */}
            <View style={[styles.emptyBox, { backgroundColor: theme.surfaceElevated }]}>
              <Feather
                name="clock"
                size={50}
                color={theme.tint}
                style={{ marginBottom: 16, alignSelf: "center" }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Delayed inbox is empty
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                When focus mode is active, non-urgent notifications will be held here until you're ready.
              </Text>

              {/* Instructions Card */}
              <View style={[styles.instructionsBox]}>
                {instructions.map((item, idx) => (
                  <View key={idx} style={styles.instructionRow}>
                    <Feather name={item.icon as any} size={18} color={theme.tint} style={{ marginRight: 12 }} />
                    <Text style={[styles.instructionText, { color: theme.text }]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          // Delayed Notifications List
          delayed.map((n) => (
            <View key={n.id} style={[styles.cardWrapper, isTablet && styles.cardTablet]}>
              <NotificationCard notification={n} onDismiss={handleMarkRead} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  releaseBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, elevation: 2 },
  releaseBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  content: { paddingHorizontal: 16, paddingTop: 10 },
  contentTablet: { alignItems: "center" },
  cardWrapper: { marginBottom: 12 },
  cardTablet: { width: "100%", maxWidth: 700 },

  //  Empty State 
  emptyWrapper: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  emptyBox: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emptyTitle: { fontSize: 24, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  emptySubtitle: { fontSize: 15, textAlign: "center", marginBottom: 18, lineHeight: 24 },

  instructionsBox: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "#d0d0d0",
    paddingTop: 16,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
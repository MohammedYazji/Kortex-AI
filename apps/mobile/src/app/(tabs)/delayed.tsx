import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NotificationCard } from "../../components/ui/NotificationCard";
import Colors from "../../constants/Colors";
import {
  getDelayed,
  releaseDelayed,
  releaseSingleDelayed,
} from "../../db/notificationDao";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAppStore } from "../../store/appStore";
import type { Notification } from "../../types";

export default function DelayedScreen() {
  const systemTheme = useColorScheme();
  const C = Colors[systemTheme ?? "light"];
  const insets = useSafeAreaInsets();

  const notificationVersion = useAppStore((s) => s.notificationVersion);
  const notifyDataChanged = useAppStore((s) => s.notifyDataChanged);

  const [items, setItems] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const data = await getDelayed();
    setItems(
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems, notificationVersion]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    await notifyDataChanged();
    setRefreshing(false);
  };

  const handleReleaseAll = async () => {
    if (items.length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setItems([]);
    await releaseDelayed();
    await notifyDataChanged();
  };

  const handleRelease = async (id: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    await releaseSingleDelayed(id);
    await notifyDataChanged();
  };

  const hasItems = items.length > 0;

  const instructions = [
    { icon: "zap", text: "Enable focus mode on Dashboard" },
    { icon: "cpu", text: "AI classifies each notification" },
    { icon: "unlock", text: "Release them when you're free" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Delayed Inbox</Text>
            <Text style={[styles.subtitle, { color: C.textMuted }]}>
              {hasItems
                ? `${items.length} notifications held`
                : "Nothing delayed right now"}
            </Text>
          </View>

          {hasItems && (
            <Pressable
              onPress={handleReleaseAll}
              style={({ pressed }) => [
                styles.releaseBtn,
                {
                  backgroundColor: C.tint,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Feather name="unlock" size={14} color="#fff" />
              <Text style={styles.releaseBtnText}>Release All</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          !hasItems && { flexGrow: 1, justifyContent: "center" },
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.tint}
          />
        }
      >
        {!hasItems ? (
          <View style={styles.emptyWrapper}>
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              <Feather
                name="clock"
                size={44}
                color={C.tint}
                style={{ marginBottom: 16, alignSelf: "center" }}
              />
              <Text style={[styles.emptyTitle, { color: C.text }]}>
                Delayed inbox is empty
              </Text>
              <Text style={[styles.emptySubtitle, { color: C.textMuted }]}>
                When focus mode is active, non-urgent notifications will be held
                here until you're ready.
              </Text>

              <View
                style={[styles.instructionsBox, { borderTopColor: C.border }]}
              >
                {instructions.map((item, idx) => (
                  <View key={idx} style={styles.instructionRow}>
                    <Feather
                      name={item.icon as any}
                      size={16}
                      color={C.tint}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={[
                        styles.instructionText,
                        { color: C.textSecondary },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <NotificationCard
                id={item.id}
                appName={item.appName}
                title={item.title}
                body={item.body}
                category={item.category}
                createdAt={item.createdAt}
                onRelease={handleRelease}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  releaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  releaseBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  cardWrapper: { marginBottom: 4 },

  // Empty State Styles
  emptyWrapper: { alignItems: "center", paddingHorizontal: 4 },
  emptyBox: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  instructionsBox: { borderTopWidth: 1, paddingTop: 20 },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  instructionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

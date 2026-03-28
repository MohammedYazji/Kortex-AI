import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";

import { getByCategory, deleteNotification } from "../../db/notificationDao";
import { NotificationCard } from "../../components/ui/NotificationCard";
import type { Notification, Category } from "../../types";

import Colors from "@/constants/Colors";
import { useAppStore } from "@/store/appStore";
import EmptyState from "@/components/ui/EmptyState";

export default function InboxScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  // Filter state (all | urgent | normal | noise)
  const [filter, setFilter] = useState<"all" | Category>("all");

  const { themeOverride, notificationVersion, focusMode } = useAppStore();

  const systemTheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
        ? Colors.light
        : systemTheme === "dark"
          ? Colors.dark
          : Colors.light;

  // Load notifications from DB
  const loadData = async () => {
    try {
      const urgent = await getByCategory("urgent");
      const normal = await getByCategory("normal");
      const noise = await getByCategory("noise"); // ✅ Added noise category

      const combined = [...urgent, ...normal, ...noise].filter(
        (n) => n.isDelayed === 0
      );

      combined.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setNotifications(combined);
    } catch (e) {
      console.error("Error loading inbox:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [notificationVersion, focusMode])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDismiss = async (id: number) => {
    await deleteNotification(id);
    await loadData();
  };

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.category === filter);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Inbox
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.textSecondary }]}
        >
          Overview of your notifications
        </Text>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filters}>
        {/* Notification filters */}
        {["all", "urgent", "normal", "noise"].map((item, index) => {
          const active = filter === item;

          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item as "all" | Category)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active
                    ? theme.tint
                    : theme.surface,
                  borderColor: theme.border,
                  marginRight: index < 3 ? 10 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? "#fff" : theme.text },
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NOTIFICATIONS LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}

        // Render each notification card
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onDismiss={handleDismiss}
          />
        )}

        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}

        showsVerticalScrollIndicator={false}

        // Pull-to-refresh control
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tint}
          />
        }

        // Empty state when no notifications
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            {/* Empty notifications state */}
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.surfaceElevated },
              ]}
            >
              <EmptyState
                title="No Notifications"
                subtitle="You're all caught up"
                color={theme.text}
              />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },

  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: "#64748b",
  },

  filters: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
  },

  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },

  filterText: {
    fontWeight: "600",
    fontSize: 12,
  },

  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  emptyCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
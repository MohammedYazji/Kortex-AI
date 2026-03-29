import EmptyState from "@/components/ui/EmptyState";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAppStore } from "@/store/appStore";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationCard } from "../../components/ui/NotificationCard";
import {
  clearAll,
  deleteNotification,
  getAllNotifications,
  getByCategory,
} from "../../db/notificationDao";
import type { Category, Notification } from "../../types";

type TabKey = "all" | Category;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "layers" },
  { key: "urgent", label: "Urgent", icon: "alert-circle" },
  { key: "normal", label: "Normal", icon: "clock" },
  { key: "noise", label: "Noise", icon: "bell-off" },
];

export default function InboxScreen() {
  const systemTheme = useColorScheme();
  const C = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const stats = useAppStore((s) => s.stats);
  const notificationVersion = useAppStore((s) => s.notificationVersion);
  const notifyDataChanged = useAppStore((s) => s.notifyDataChanged);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const tabColor = (key: TabKey): string => {
    if (key === "urgent") return C.urgent;
    if (key === "normal") return C.normal;
    if (key === "noise") return C.textMuted;
    return C.tint;
  };

  const loadItems = useCallback(async () => {
    if (activeTab === "all") {
      const all = await getAllNotifications();
      setItems(all.filter((n) => n.isDelayed === 0));
    } else {
      const filtered = await getByCategory(activeTab);
      setItems(filtered);
    }
  }, [activeTab]);

  useEffect(() => {
    loadItems();
  }, [loadItems, notificationVersion]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    await notifyDataChanged();
    setRefreshing(false);
  };

  const handleDismiss = async (id: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteNotification(id);
    await notifyDataChanged();
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setItems([]);
    await clearAll();
    await notifyDataChanged();
  };

  const hasItems = items.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            backgroundColor: C.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: C.text }]}>Inbox</Text>
            <Text style={[styles.headerSubtitle, { color: C.textMuted }]}>
              {items.length > 0
                ? `${items.length} notification${items.length !== 1 ? "s" : ""}`
                : "All caught up"}
            </Text>
          </View>
          {hasItems && (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [
                styles.clearBtn,
                {
                  backgroundColor: C.urgentBg,
                  borderColor: C.urgent + "40",
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Feather name="trash-2" size={14} color={C.urgent} />
              <Text style={[styles.clearBtnText, { color: C.urgent }]}>
                Clear
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filters}>
        {TABS.map((tab, index) => {
          const active = activeTab === tab.key;
          const color = tabColor(tab.key);

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active ? color : C.surface,
                  borderColor: C.border,
                  marginRight: index < TABS.length - 1 ? 8 : 0,
                },
              ]}
            >
              <Text
                style={[styles.filterText, { color: active ? "#fff" : C.text }]}
              >
                {tab.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NOTIFICATIONS LIST */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationCard
            id={item.id}
            appName={item.appName}
            title={item.title}
            body={item.body}
            category={item.category}
            createdAt={item.createdAt}
            onDismiss={handleDismiss}
          />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View style={[styles.emptyCard, { backgroundColor: C.surface }]}>
              <EmptyState
                title="No Notifications"
                subtitle={
                  activeTab === "all"
                    ? "You're all caught up"
                    : `No ${activeTab} messages`
                }
                color={C.text}
              />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: "Inter_600SemiBold",
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
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
  Switch,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAppStore } from "../../store/appStore";
import Colors from "../../constants/Colors";

// Type definition for each stat item in the stats card
type StatItemProps = {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

export default function Dashboard() {
  const insets = useSafeAreaInsets(); 
  const router = useRouter(); 

  const { stats, refreshStats, focusMode, toggleFocusMode, themeOverride } =
    useAppStore();

  const systemTheme = useColorScheme();

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
        ? Colors.light
        : systemTheme === "dark"
          ? Colors.dark
          : Colors.light;

  useEffect(() => {
    refreshStats();
  }, [focusMode]);

  // Derived calculations from stats
  const allowed = stats.urgent + stats.normal; // Allowed notifications
  const delayed = stats.delayed; // Delayed notifications
  const silenced = stats.noise; // Silenced notifications
  const total = stats.total; // Total notifications

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40, 
        paddingHorizontal: 16,
      }}
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          {/* App title */}
          <Text style={[styles.title, { color: theme.text }]}>
            SmartFilter
          </Text>

          {/* Subtitle */}
          <Text style={{ color: theme.textSecondary }}>
            AI Notification Guard
          </Text>
        </View>

        {/* Button to open Test Notification screen */}
        <Pressable
          style={[
            styles.iconButton,
            { backgroundColor: theme.surfaceElevated },
          ]}
          onPress={() => router.push("/test-notification")}
        >
          <Feather name="cpu" size={20} color={theme.tint} />
        </Pressable>
      </View>

      {/* FOCUS MODE CARD */}
      <View
        style={[
          styles.focusCard,
          { backgroundColor: theme.surfaceElevated },
        ]}
      >
        <View style={styles.focusLeft}>
          {/* Icon container */}
          <View
            style={[
              styles.focusIcon,
              { backgroundColor: theme.surface },
            ]}
          >
            {/* Dynamic icon based on focus mode */}
            <Feather
              name={focusMode ? "moon" : "sun"}
              size={20}
              color={theme.tint}
            />
          </View>

          <View>
            {/* Focus mode title */}
            <Text style={[styles.focusTitle, { color: theme.text }]}>
              Focus Mode {focusMode ? "On" : "Off"}
            </Text>

            {/* Description */}
            <Text style={{ color: theme.textSecondary }}>
              Tap to start filtering
            </Text>
          </View>
        </View>

        {/* Toggle switch for focus mode */}
        <Switch
          value={focusMode}
          onValueChange={toggleFocusMode}
          trackColor={{ false: "#334155", true: "#22c55e" }}
          thumbColor="#fff"
        />
      </View>

      {/* STATS TITLE */}
      <Text style={[styles.section, { color: theme.textSecondary }]}>
        TODAY'S FILTER STATS
      </Text>

      {/* STATS CARD */}
      <View
        style={[styles.statsCard, { backgroundColor: theme.surfaceElevated }]}
      >
        {/* Allowed notifications */}
        <StatItem
          label="ALLOWED"
          value={allowed}
          color="#22c55e"
          icon="check-circle"
        />

        {/* Delayed notifications */}
        <StatItem
          label="DELAYED"
          value={delayed}
          color="#f59e0b"
          icon="clock"
        />

        {/* Silenced notifications */}
        <StatItem
          label="SILENCED"
          value={silenced}
          color="#9ca3af"
          icon="slash"
        />

        {/* Total notifications */}
        <StatItem
          label="TOTAL"
          value={total}
          color="#22d3ee"
          icon="activity"
        />
      </View>

      {/* EMPTY STATE */}
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.surfaceElevated },
        ]}
      >
        {/* Shield icon */}
        <Feather name="shield" size={40} color={theme.tintDim} />

        {/* Empty state title */}
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No allowed notifications yet
        </Text>

        {/* Empty state description */}
        <Text
          style={{ color: theme.textSecondary, textAlign: "center" }}
        >
          Tap the test button on the top right to classify a notification
        </Text>
      </View>
    </ScrollView>
  );
}

// Component for each stat item
function StatItem({ label, value, color, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      {/* Icon */}
      <Feather name={icon} size={18} color={color} />

      {/* Value */}
      <Text style={{ color, fontSize: 20, fontWeight: "700" }}>
        {value}
      </Text>

      {/* Label */}
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  focusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },

  focusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  focusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  focusTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  section: {
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 1,
  },

  statsCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },

  emptyCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    gap: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
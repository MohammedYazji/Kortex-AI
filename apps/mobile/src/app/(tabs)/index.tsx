import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationCard } from "../../components/ui/NotificationCard";
import Colors from "../../constants/Colors";
import { getAllNotifications } from "../../db/notificationDao";
import { useColorScheme } from "../../hooks/useColorScheme";
import { processNotification } from "../../services/notificationService";
import { useAppStore } from "../../store/appStore";
import type { Notification } from "../../types";

/**
 * DashboardScreen (index.tsx)
 *
 * This is the main landing page of the Kortex AI application.
 * It provides a high-level overview of notification statistics, a global switch to
 * toggle "Focus Mode", and displays the most recently allowed notification.
 * It also includes a testing sandbox modal to simulate incoming notifications perfectly.
 */
const SAMPLE_APPS = [
  "WhatsApp",
  "Gmail",
  "LinkedIn",
  "Twitter",
  "Slack",
  "SMS",
  "Instagram",
];

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();

  // Global Zustand state mapped to component variables
  const focusMode = useAppStore((s) => s.focusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const stats = useAppStore((s) => s.stats);
  const rules = useAppStore((s) => s.rules);
  const notifyDataChanged = useAppStore((s) => s.notifyDataChanged);
  const loadRules = useAppStore((s) => s.loadRules);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const notificationVersion = useAppStore((s) => s.notificationVersion);

  // Local state for the Testing Sandbox Modal
  const [testVisible, setTestVisible] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testBody, setTestBody] = useState("");
  const [testApp, setTestApp] = useState("WhatsApp");
  const [processing, setProcessing] = useState(false);

  // Stores the most recently allowed notification for the dashboard preview
  const [recentAllowed, setRecentAllowed] = useState<Notification | null>(null);

  /**
   * Fetches the most recent 'allowed' notification (not delayed, not noise)
   * to display on the dashboard card.
   */
  const fetchRecent = useCallback(async () => {
    const all = await getAllNotifications();
    const allowed = all.find(
      (n) => n.isDelayed === 0 && n.category !== "noise",
    );
    setRecentAllowed(allowed || null);
  }, []);

  // Initial load effect mounted once when the app starts
  useEffect(() => {
    notifyDataChanged(); // Fetches and updates global stats
    loadRules(); // Loads custom block/allow rules
    loadSettings(); // Hydrates focusMode from SQLite settings table
    fetchRecent(); // Loads the recent allowed preview
  }, []);

  // Re-fetch data every time the user navigates back to the Dashboard tab
  useFocusEffect(
    useCallback(() => {
      notifyDataChanged();
      fetchRecent();
    }, []),
  );

  // Automatically refresh the preview if the global notification version bumps (e.g. they clear metrics)
  useEffect(() => {
    fetchRecent();
  }, [notificationVersion, fetchRecent]);

  /**
   * Simulates receiving a real notification. It passes the mock data through
   * the local ONNX/Transformers pipeline (or keyword fallback) via `processNotification`.
   */
  const handleSendTest = useCallback(async () => {
    if (!testBody.trim()) return;
    setProcessing(true);
    try {
      // Pass data into the main classification engine
      const result = await processNotification(
        testApp,
        testTitle || null,
        testBody,
        rules,
        focusMode,
      );

      // Update global states post-insertion
      await notifyDataChanged();

      // Clear modal state
      setTestVisible(false);
      setTestTitle("");
      setTestBody("");

      // Show user immediate feedback based on the ML classification
      Alert.alert(
        "Notification Processed",
        `Category: ${result.category.toUpperCase()}\nConfidence: ${Math.round(result.confidence * 100)}%\n${result.isDelayed ? "📦 Held in Delayed queue (Focus Mode ON)" : result.isSilent ? "🔇 Silenced (noise)" : "✅ Added to Inbox"}`,
        [{ text: "OK" }],
      );
    } finally {
      setProcessing(false);
    }
  }, [testApp, testTitle, testBody, rules, focusMode]);

  const allowedCount = stats.urgent + stats.normal;

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Kortex</Text>
          <Text style={[styles.headerSub, { color: C.textSecondary }]}>
            AI Notification Guard
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.chipBtn, { backgroundColor: C.surfaceElevated }]}
          onPress={() => setTestVisible(true)}
        >
          <Ionicons name="hardware-chip-outline" size={20} color={C.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Focus Mode Toggle */}
        <View
          style={[
            styles.focusCard,
            {
              backgroundColor: focusMode ? C.tint + "20" : C.surface,
              borderColor: focusMode ? C.tint : C.border,
            },
          ]}
        >
          <View style={styles.focusCardInner}>
            <Ionicons
              name="sunny-outline"
              size={24}
              color={focusMode ? C.tint : C.textMuted}
            />
            <View>
              <Text style={[styles.focusTitle, { color: C.text }]}>
                {focusMode ? "Focus Mode Active" : "Focus Mode Off"}
              </Text>
              <Text style={[styles.focusSub, { color: C.textSecondary }]}>
                {focusMode ? "Holding non-urgent alerts" : "Normal filtering"}
              </Text>
            </View>
          </View>
          <Switch
            value={focusMode}
            onValueChange={toggleFocusMode}
            trackColor={{ false: C.border, true: C.tint }}
            thumbColor={
              Platform.OS === "ios"
                ? undefined
                : focusMode
                  ? C.onTint
                  : C.whiteText
            }
          />
        </View>

        {/* Stats Card */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
            TODAY'S FILTER STATS
          </Text>
        </View>
        <View
          style={[
            styles.statsCard,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <View style={styles.statsRow}>
            <StatBox
              icon="checkmark-circle-outline"
              label="ALLOWED"
              value={allowedCount}
              color={C.low}
            />
            <StatBox
              icon="time-outline"
              label="DELAYED"
              value={stats.delayed}
              color={C.normal}
            />
            <StatBox
              icon="notifications-off-outline"
              label="SILENCED"
              value={stats.noise}
              color={C.textMuted}
            />
            <StatBox
              icon="pulse-outline"
              label="TOTAL"
              value={stats.total}
              color={C.info}
            />
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: C.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: C.low,
                  width: `${stats.total > 0 ? (allowedCount / stats.total) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Recent Allowed */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
            RECENT ALLOWED
          </Text>
          {allowedCount > 0 && (
            <View
              style={[styles.badge, { backgroundColor: C.surfaceElevated }]}
            >
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>
                {allowedCount}
              </Text>
            </View>
          )}
        </View>

        {recentAllowed ? (
          <NotificationCard
            id={recentAllowed.id}
            appName={recentAllowed.appName}
            title={recentAllowed.title}
            body={recentAllowed.body}
            category={recentAllowed.category}
            createdAt={recentAllowed.createdAt}
          />
        ) : (
          <Pressable
            style={[
              styles.emptyRecent,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
            onPress={() => setTestVisible(true)}
          >
            <Ionicons
              name="shield-outline"
              size={36}
              color={C.textMuted}
              style={{ marginBottom: 16 }}
            />
            <Text style={[styles.emptyRecentTitle, { color: C.text }]}>
              No allowed notifications yet
            </Text>
            <Text style={[styles.emptyRecentSub, { color: C.textMuted }]}>
              Tap the test button (chip icon) to classify
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Test Notification Modal */}
      <Modal
        visible={testVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTestVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setTestVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.avoidView}
          >
            <Pressable
              style={[
                styles.sheet,
                { backgroundColor: C.surfaceElevated, borderColor: C.border },
              ]}
              onPress={() => {}}
            >
              <Text style={[styles.sheetTitle, { color: C.text }]}>
                🧪 Test Notification
              </Text>
              <Text style={[styles.sheetSub, { color: C.textSecondary }]}>
                Simulate a notification through the full classify → store
                pipeline
              </Text>

              {/* App picker */}
              <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                App
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.appScroll}
              >
                {SAMPLE_APPS.map((app) => (
                  <TouchableOpacity
                    key={app}
                    style={[
                      styles.appChip,
                      {
                        borderColor: testApp === app ? C.tint : C.border,
                        backgroundColor:
                          testApp === app ? C.tint + "20" : C.surface,
                      },
                    ]}
                    onPress={() => setTestApp(app)}
                  >
                    <Text
                      style={[
                        styles.appChipText,
                        { color: testApp === app ? C.tint : C.textSecondary },
                      ]}
                    >
                      {app}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                Title (optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.surface,
                    color: C.text,
                    borderColor: C.border,
                  },
                ]}
                placeholder="Notification title..."
                placeholderTextColor={C.textMuted}
                value={testTitle}
                onChangeText={setTestTitle}
              />

              <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                Message *
              </Text>
              <TextInput
                style={[
                  styles.inputMulti,
                  {
                    backgroundColor: C.surface,
                    color: C.text,
                    borderColor: C.border,
                  },
                ]}
                placeholder="Type the notification message..."
                placeholderTextColor={C.textMuted}
                value={testBody}
                onChangeText={setTestBody}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.cancelBtn,
                    { borderColor: C.border },
                  ]}
                  onPress={() => setTestVisible(false)}
                >
                  <Text style={[styles.btnTxt, { color: C.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.sendBtn,
                    { backgroundColor: C.tint, opacity: processing ? 0.6 : 1 },
                  ]}
                  onPress={handleSendTest}
                  disabled={processing}
                >
                  <Text style={[styles.btnTxt, { color: C.onTint }]}>
                    {processing ? "Processing..." : "Send & Classify"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: "#5C6B8A" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  chipBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },

  focusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  focusCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  focusTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  focusSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: { alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: { height: "100%" },

  emptyRecent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyRecentTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  emptyRecentSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  avoidView: { justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: -4 },
  appScroll: { flexGrow: 0 },
  appChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  appChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputMulti: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { borderWidth: 1 },
  sendBtn: {},
  btnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

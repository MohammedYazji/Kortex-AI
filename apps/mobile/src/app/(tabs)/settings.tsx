import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { clearAll } from "../../db/notificationDao";
import { deleteRule, insertRule } from "../../db/rulesDao";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useAppStore } from "../../store/appStore";

/**
 * SettingsScreen (settings.tsx)
 *
 * Allows users to configure custom block/allow rules for specific contacts and apps.
 * Rules explicitly override the AI's default classification (e.g. marking "Mom" as urgent).
 * Includes app-wide data controls like clearing the notification history database,
 * and a legend explaining how the AI categorizes notifications.
 */
export default function SettingsScreen() {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();

  const rules = useAppStore((s) => s.rules);
  const loadRules = useAppStore((s) => s.loadRules);
  const notifyDataChanged = useAppStore((s) => s.notifyDataChanged);
  const themeOverride = useAppStore((s) => s.themeOverride);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const [refreshing, setRefreshing] = useState(false);

  const [newContact, setNewContact] = useState("");
  const [newApp, setNewApp] = useState("");

  /**
   * Loads custom rules and statistics metrics from SQLite bindings
   */
  const loadData = useCallback(async () => {
    await loadRules();
  }, []);

  // Hydrate the screen initially
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Manual refresh payload that syncs local DB into Zustand
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Inserts a new Contact rule into the DB.
   * It forces the AI to always classify messages from this contact as "urgent".
   */
  const handleAddContact = async () => {
    if (!newContact.trim()) return;
    await insertRule({
      type: "contact",
      value: newContact.trim(),
      forcedCategory: "urgent",
    });
    setNewContact("");
    await loadRules();
  };

  /**
   * Inserts a new App rule into the DB.
   * Notifications from this app will bypass Focus Mode delays entirely.
   */
  const handleAddApp = async () => {
    if (!newApp.trim()) return;
    await insertRule({
      type: "app",
      value: newApp.trim(),
      forcedCategory: "urgent",
    });
    setNewApp("");
    await loadRules();
  };

  /**
   * Confirms and deletes a custom priority rule globally.
   */
  const handleDeleteRule = async (id: number) => {
    Alert.alert(
      "Remove Rule",
      "Are you sure you want to remove this priority rule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteRule(id);
            await loadRules();
          },
        },
      ],
    );
  };

  /**
   * Wipes all persisted notification records directly from SQLite.
   * Bypasses `Alert` confirmation blocks to avoid OS-level gesture/bridge dropping bugs.
   * Updates global app state to zero immediately upon returning.
   */
  const handleClearAll = async () => {
    try {
      await clearAll();
      await notifyDataChanged();
      Alert.alert("Cleared", "Notification history permanently deleted.");
    } catch (e: any) {
      Alert.alert("Error clearing data", e.message);
    }
  };

  // Pre-filter rules to render in the chips layout
  const contactRules = rules.filter((r) => r.type === "contact");
  const appRules = rules.filter((r) => r.type === "app");

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.tint}
          />
        }
      >
        {/* AI Info Card - Centered Version */}
        <View
          style={[
            styles.aiCard,
            {
              backgroundColor: C.surfaceElevated,
              borderColor: C.border,
              flexDirection: "column",
              alignItems: "center",
              paddingVertical: 24,
            },
          ]}
        >
          <View
            style={[
              styles.aiIcon,
              {
                backgroundColor: C.surface,
                borderColor: C.border,
                marginBottom: 12,
              },
            ]}
          >
            <Ionicons name="hardware-chip-outline" size={28} color={C.tint} />
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={[
                styles.aiTitle,
                { color: C.text, fontSize: 17, marginBottom: 8 },
              ]}
            >
              Kortex AI Classification Engine
            </Text>
            <Text
              style={[
                styles.aiSub,
                {
                  color: C.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                  paddingHorizontal: 10,
                },
              ]}
            >
              All notifications are classified using our custom{" "}
              <Text style={{ fontWeight: "600", color: C.tint }}>
                DistilBERT
              </Text>{" "}
              model trained to detect Urgent, Normal, and Noise patterns.
              {"\n\n"}
              Everything is processed{" "}
              <Text style={{ fontWeight: "600", color: C.text }}>
                locally on your phone
              </Text>{" "}
              to ensure your absolute privacy. Context, contacts, and content
              never leave your device.
            </Text>
          </View>
        </View>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: C.surface,
              borderColor: C.border,
              padding: 0,
              overflow: "hidden",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.themeRow, { borderBottomColor: C.border }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View
              style={[styles.themeIconWrap, { backgroundColor: C.tint + "15" }]}
            >
              <Feather
                name={
                  themeOverride === "light"
                    ? "sun"
                    : themeOverride === "dark"
                      ? "moon"
                      : "monitor"
                }
                size={20}
                color={C.tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: C.text }]}>
                Appearance
              </Text>
              <Text style={[styles.themeSub, { color: C.textSecondary }]}>
                {themeOverride === "light"
                  ? "Light mode"
                  : themeOverride === "dark"
                    ? "Dark mode"
                    : "Follow system"}
              </Text>
            </View>
            <View
              style={[
                styles.themeChip,
                { backgroundColor: C.surfaceElevated, borderColor: C.border },
              ]}
            >
              <Text style={[styles.themeChipText, { color: C.textSecondary }]}>
                {themeOverride === "light"
                  ? "☀️ Light"
                  : themeOverride === "dark"
                    ? "🌙 Dark"
                    : "⚙️ System"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Priority Contacts */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
          PRIORITY CONTACTS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
            Messages from these contacts are always marked as urgent.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: C.background,
                  color: C.text,
                  borderColor: C.border,
                },
              ]}
              placeholder="Add contact name..."
              placeholderTextColor={C.textMuted}
              value={newContact}
              onChangeText={setNewContact}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: C.tint }]}
              onPress={handleAddContact}
            >
              <Ionicons name="add" size={24} color="#0A0D14" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {contactRules.length === 0 && newContact === "" && (
              <Text style={[styles.emptyHint, { color: C.textMuted }]}>
                No priority contacts added.
              </Text>
            )}
            {contactRules.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.chip,
                  { backgroundColor: C.surfaceElevated, borderColor: C.border },
                ]}
                onPress={() => handleDeleteRule(r.id)}
              >
                <Text style={[styles.chipText, { color: C.textSecondary }]}>
                  ✓ {r.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Apps */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
          PRIORITY APPS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
            Notifications from these apps always pass through, even in focus
            mode.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: C.background,
                  color: C.text,
                  borderColor: C.border,
                },
              ]}
              placeholder="Add app name..."
              placeholderTextColor={C.textMuted}
              value={newApp}
              onChangeText={setNewApp}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: C.tint }]}
              onPress={handleAddApp}
            >
              <Ionicons name="add" size={24} color="#0A0D14" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {appRules.length === 0 && newApp === "" && (
              <Text style={[styles.emptyHint, { color: C.textMuted }]}>
                No priority apps added.
              </Text>
            )}
            {appRules.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.chip,
                  { backgroundColor: C.surfaceElevated, borderColor: C.border },
                ]}
                onPress={() => handleDeleteRule(r.id)}
              >
                <Text style={[styles.chipText, { color: C.textSecondary }]}>
                  ✓ {r.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How AI Classifies */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>
          HOW AI CLASSIFIES
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: C.surface,
              borderColor: C.border,
              paddingVertical: 8,
            },
          ]}
        >
          <LegendRow
            icon="alert-circle-outline"
            color={C.urgent}
            title="Urgent → Allow"
            desc="Emergency messages, priority contacts, health & safety"
          />
          <LegendRow
            icon="time-outline"
            color={C.normal}
            title="Normal → Delay"
            desc="Regular messages, emails, social media from known contacts"
          />
          <LegendRow
            icon="notifications-off-outline"
            color={C.textMuted}
            title="Low → Silence"
            desc="Promotions, spam, entertainment, engagement bait"
            hideBorder={true}
          />
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>DATA</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: C.surface, borderColor: C.border, padding: 8 },
          ]}
        >
          <TouchableOpacity
            style={[styles.clearBtn]}
            onPress={handleClearAll}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={C.urgent} />
            <Text style={[styles.clearBtnText, { color: C.urgent }]}>
              Clear Notification History
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.versionText, { color: C.textMuted }]}>
          SmartFilter v1.0 • AI-Powered
        </Text>
      </ScrollView>
    </View>
  );
}

function LegendRow({
  icon,
  color,
  title,
  desc,
  hideBorder,
}: {
  icon: any;
  color: string;
  title: string;
  desc: string;
  hideBorder?: boolean;
}) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  return (
    <View
      style={[
        styles.legendRow,
        !hideBorder && { borderBottomWidth: 1, borderBottomColor: C.border },
      ]}
    >
      <View style={[styles.legendIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.legendTitle, { color: C.text }]}>{title}</Text>
        <Text style={[styles.legendDesc, { color: C.textSecondary }]}>
          {desc}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },

  aiCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 16,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTextWrap: { flex: 1, gap: 4 },
  aiTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  aiSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 12,
  },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 16,
  },

  inputRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },

  legendRow: { flexDirection: "row", gap: 16, paddingVertical: 16 },
  legendIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  legendTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  legendDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
  },
  clearBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 16,
  },

  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  themeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  themeSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

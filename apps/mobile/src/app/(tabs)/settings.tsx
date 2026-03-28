import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "../../constants/Colors";
import { getAllRules, insertRule, deleteRule } from "../../db/rulesDao";
import { clearAll } from "../../db/notificationDao";
import { useAppStore } from "../../store/appStore";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const { themeOverride, rules, loadRules } = useAppStore();

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
        ? Colors.light
        : systemTheme === "dark"
          ? Colors.dark
          : Colors.light;

  const [contactInput, setContactInput] = useState("");
  const [appInput, setAppInput] = useState("");

  const contactSuggestions = ["Mom", "Dad", "Partner", "Doctor", "Boss"];
  const appSuggestions = [
    "WhatsApp",
    "Outlook",
    "Gmail",
    "Teams",
    "Slack",
    "LinkedIn",
    "Instagram",
  ];

  const addedContacts = rules.filter(r => r.type === "contact").map(r => r.value);
  const addedApps = rules.filter(r => r.type === "app").map(r => r.value);

  useEffect(() => {
    loadRules();
  }, []);

  const handleAddRule = async (type: "app" | "contact", value?: string) => {
    const val = (type === "app" ? appInput : contactInput).trim() || value?.trim();
    if (!val) return;

    await insertRule({
      type,
      value: val,
      forcedCategory: "urgent",
    });

    if (type === "app") setAppInput("");
    else setContactInput("");

    loadRules();
  };

  const handleDeleteRule = async (id: number) => {
    await deleteRule(id);
    loadRules();
  };

  const handleClear = () => {
    Alert.alert("Confirm", "Delete all notifications?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          await clearAll();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
      }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <ThemeToggleButton />
      </View>

      {/* INFO HEADER */}
      <View style={[styles.infoHeader, { backgroundColor: theme.surface }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
          <View style={{ backgroundColor: theme.surfaceElevated, padding: 8, borderRadius: 10 }}>
            <Feather name="cpu" size={20} color={theme.tint} />
          </View>
          <View style={[styles.infoDes, { flex: 1 }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              On-Device AI Classification
            </Text>
            <Text style={[styles.infoDesc, { color: theme.textSecondary }]} numberOfLines={0}>
              All notifications are automatically classified on your device. Context, contacts, and content
              are analyzed to decide urgency, while your privacy is fully protected.
            </Text>
          </View>
        </View>
      </View>

      {/* PRIORITY CONTACTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PRIORITY CONTACTS
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Messages from these contacts are always marked as urgent.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.inputRow}>
            <TextInput
              value={contactInput}
              onChangeText={setContactInput}
              placeholder="Add contact name..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
              ]}
            />
            <Pressable onPress={() => handleAddRule("contact")} style={[styles.addBtn, { backgroundColor: theme.tint }]}>
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Suggestions */}
          <View style={styles.chips}>
            {contactSuggestions
              .filter(c => !addedContacts.includes(c))
              .map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleAddRule("contact", c)}
                  style={[styles.suggestionChip, { backgroundColor: theme.surfaceElevated }]}
                >
                  <Text style={{ color: theme.text }}>{c}</Text>
                </Pressable>
              ))}
          </View>

          {/* Added contacts */}
          <View style={styles.chips}>
            {addedContacts.map((c) => {
              const rule = rules.find(r => r.type === "contact" && r.value === c);
              return (
                <Pressable
                  key={c}
                  onPress={() => handleDeleteRule(rule!.id)}
                  style={[styles.suggestionChip, { backgroundColor: theme.surfaceElevated }]}
                >
                  <Text style={{ color: theme.text }}>+ {c}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* PRIORITY APPS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PRIORITY APPS
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Notifications from these apps always pass through, even in focus mode.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.inputRow}>
            <TextInput
              value={appInput}
              onChangeText={setAppInput}
              placeholder="Add app name..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
              ]}
            />
            <Pressable onPress={() => handleAddRule("app")} style={[styles.addBtn, { backgroundColor: theme.tint }]}>
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Suggestions */}
          <View style={styles.chips}>
            {appSuggestions
              .filter(a => !addedApps.includes(a))
              .map((a) => (
                <Pressable
                  key={a}
                  onPress={() => handleAddRule("app", a)}
                  style={[styles.suggestionChip, { backgroundColor: theme.surfaceElevated }]}
                >
                  <Text style={{ color: theme.text }}>{a}</Text>
                </Pressable>
              ))}
          </View>

          {/* Added apps */}
          <View style={styles.chips}>
            {addedApps.map((a) => {
              const rule = rules.find(r => r.type === "app" && r.value === a);
              return (
                <Pressable
                  key={a}
                  onPress={() => handleDeleteRule(rule!.id)}
                  style={[styles.suggestionChip, { backgroundColor: theme.surfaceElevated }]}
                >
                  <Text style={{ color: theme.text }}>+ {a}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* HOW AI CLASSIFIES */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Row
          title="Urgent → Allow"
          desc="Emergency messages, priority contacts, health & safety"
          theme={theme}
          iconName="alert-circle"
          iconColor="#ef4444"
        />
        <Divider theme={theme} />
        <Row
          title="Normal → Delay"
          desc="Regular messages, emails, social media from known contacts"
          theme={theme}
          iconName="clock"
          iconColor="#fbbf24"
        />
        <Divider theme={theme} />
        <Row
          title="Noise → Silence"
          desc="Promotions, spam, entertainment, engagement bait"
          theme={theme}
          iconName="volume-x"
          iconColor="#6b7280"
        />
      </View>

      {/* CLEAR DATA */}
      <View style={styles.section}>
        <Pressable
          onPress={handleClear}
          style={[styles.dangerBtn, { backgroundColor: theme.urgent }]}
        >
          <Feather name="trash-2" size={20} color={"#ffff"} />
          <Text style={{ color: "#ffff", fontWeight: "700" }}>
            Clear Notification History
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* COMPONENTS */
function Row({ title, desc, theme, iconName, iconColor }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
      <Feather name={iconName} size={20} color={iconColor} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: "600" }}>{title}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{desc}</Text>
      </View>
    </View>
  );
}

function Divider({ theme }: any) {
  return <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />;
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 1,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },

  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    // backgroundColor: "#22d3ee",
    justifyContent: "center",
    alignItems: "center",
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 4,
  },

  dangerBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 35,
    color: "#ffff"
  },
  infoHeader: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  infoDes: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    // alignItems: "center",
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
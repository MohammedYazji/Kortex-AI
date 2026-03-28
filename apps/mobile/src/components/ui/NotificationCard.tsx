import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import type { Notification } from "../../types";

import { CategoryBadge } from "./CategoryBadge";
import Colors from "@/constants/Colors";
import { useAppStore } from "@/store/appStore";

interface NotificationCardProps {
  notification: Notification;
  onDismiss?: (id: number) => void;
}

export function NotificationCard({
  notification,
  onDismiss,
}: NotificationCardProps) {
  const { id, appName, title, body, category, createdAt } = notification;

  const systemTheme = useColorScheme();
  const { themeOverride } = useAppStore();

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
      ? Colors.light
      : systemTheme === "dark"
      ? Colors.dark
      : Colors.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconBox,
          { backgroundColor: theme.tint },
        ]}
      >
        <Text style={styles.iconText}>
          {appName?.[0]?.toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.appName, { color: theme.text }]}>
            {appName}
          </Text>
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {createdAt}
          </Text>
        </View>

        {title && (
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
        )}

        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {body}
        </Text>

        <View style={styles.footer}>
          <CategoryBadge category={category} size="md" />

          {onDismiss && (
            <TouchableOpacity
              onPress={() => onDismiss(id)}
              style={[
                styles.dismissButton,
                { backgroundColor: theme.urgentBg },
              ]}
            >
              <Text
                style={[
                  styles.dismiss,
                  { color: theme.urgent },
                ]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  content: {
    flex: 1,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  appName: {
    fontSize: 15,
    fontWeight: "600",
  },

  time: {
    fontSize: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  body: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  dismissButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  dismiss: {
    fontSize: 12,
    fontWeight: "600",
  },
});
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Category } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CategoryBadge } from "./CategoryBadge";

interface NotificationCardProps {
  id: number;
  appName: string;
  title: string | null;
  body: string;
  category: Category;
  createdAt: string;
  onDismiss?: (id: number) => void;
  onRelease?: (id: number) => void;
  reasoning?: string;
}

export function NotificationCard({
  id,
  appName,
  title,
  body,
  category,
  createdAt,
  onDismiss,
  onRelease,
  reasoning,
}: NotificationCardProps) {
  const systemTheme = useColorScheme();
  const C = Colors[systemTheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: C.surfaceElevated,
          borderColor: C.border,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: C.tint }]}>
        <Text style={styles.iconText}>{appName?.[0]?.toUpperCase()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.appName, { color: C.textSecondary }]}>
            {appName.toUpperCase()}
          </Text>
          <Text style={[styles.time, { color: C.textMuted }]}>{createdAt}</Text>
        </View>

        {/* Title */}
        {title && (
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
        )}

        {/* Body */}
        <Text style={[styles.body, { color: C.textSecondary }]}>{body}</Text>

        {/* Tags Row */}
        <View style={styles.footer}>
          <CategoryBadge category={category} size="md" />

          {/* Action1 */}
          {onRelease && (
            <TouchableOpacity
              style={[
                styles.tag,
                { backgroundColor: C.tint + "15", marginLeft: "auto" },
              ]}
              onPress={() => onRelease(id)}
              activeOpacity={0.7}
            >
              <Ionicons name="play-outline" size={12} color={C.tint} />
              <Text style={[styles.tagText, { color: C.tint }]}>Release</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Action2 */}
        {onDismiss && (
          <TouchableOpacity
            onPress={() => onDismiss(id)}
            style={[styles.dismissButton, { backgroundColor: C.urgentBg }]}
          >
            <Text style={[styles.dismiss, { color: C.urgent }]}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 16,
    paddingRight: 16,
    borderWidth: 1,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
    marginBottom: 4,
  },
  appName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    marginBottom: 10,
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
    fontFamily: "Inter_500Medium",
  },

  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});

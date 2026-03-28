import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { Category } from "../../types";

import Colors from "@/constants/Colors";
import { useAppStore } from "@/store/appStore";

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
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

  const getLabel = () => {
    if (category === "urgent") return "Urgent";
    if (category === "normal") return "Normal";
    return "Noise";
  };

  const getEmoji = () => {
    if (category === "urgent") return "🔴";
    if (category === "normal") return "🟡";
    return "🔇";
  };

  const getBg = () => {
    if (category === "urgent") return theme.urgentBg;
    if (category === "normal") return theme.normalBg;
    return theme.lowBg;
  };

  const getColor = () => {
    if (category === "urgent") return theme.urgent;
    if (category === "normal") return theme.normal;
    return theme.textMuted;
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBg() },
        size === "md" ? styles.md : styles.sm,
      ]}
    >
      <Text style={styles.emoji}>{getEmoji()}</Text>

      {size !== "sm" && (
        <Text style={[styles.text, { color: getColor() }]}>
          {getLabel()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  emoji: {
    fontSize: 12,
    marginRight: 4,
  },

  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Category } from "../../types";

const EMOJIS: Record<Category, string> = {
  urgent: "🔴",
  normal: "🟡",
  noise: "🔇",
};

const LABELS: Record<Category, string> = {
  urgent: "Urgent",
  normal: "Normal",
  noise: "Noise",
};

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const systemTheme = useColorScheme() ?? "dark";
  const C = Colors[systemTheme];
  const isSmall = size === "sm";

  const color =
    category === "urgent"
      ? C.urgent
      : category === "normal"
        ? C.normal
        : C.noise;

  const bg =
    category === "urgent"
      ? C.urgentBg
      : category === "normal"
        ? C.normalBg
        : C.noiseBg;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall ? styles.sm : styles.md,
      ]}
    >
      <Text style={isSmall ? styles.emojiSm : styles.emojiMd}>
        {EMOJIS[category]}
      </Text>
      {!isSmall && (
        <Text style={[styles.text, { color }]}>{LABELS[category]}</Text>
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
    gap: 4,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  emojiSm: { fontSize: 12 },
  emojiMd: { fontSize: 14 },

  text: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});

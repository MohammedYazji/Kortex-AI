import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Category } from "../../types";

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const getColor = () => {
    if (category === "urgent") return "#ff4d4d";
    if (category === "normal") return "#4da6ff";
    return "#999";
  };

  const getEmoji = () => {
    if (category === "urgent") return "🔴";
    if (category === "normal") return "🟡";
    return "🔇";
  };

  const getLabel = () => {
    if (category === "urgent") return "Urgent";
    if (category === "normal") return "Normal";
    return "Noise";
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getColor() },
        size === "md" ? styles.md : styles.sm,
      ]}
    >
      <Text style={styles.emoji}>{getEmoji()}</Text>

      {size !== "sm" && <Text style={styles.text}>{getLabel()}</Text>}
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
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
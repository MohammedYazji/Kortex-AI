import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Notification } from "../../types";
import { CategoryBadge } from "./CategoryBadge";

interface NotificationCardProps {
  notification: Notification;
  onDismiss?: (id: number) => void;
}

export function NotificationCard({
  notification,
  onDismiss,
}: NotificationCardProps) {
  const { id, appName, title, body, category, createdAt } = notification;

  return (
    <View style={styles.card}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{appName[0]}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.time}>{createdAt}</Text>
        </View>

        {title && <Text style={styles.title}>{title}</Text>}

        <Text style={styles.body}>{body}</Text>

        <CategoryBadge category={category} size="md" />

        {onDismiss && (
          <TouchableOpacity onPress={() => onDismiss(id)}>
            <Text style={styles.dismiss}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  appName: {
    color: "white",
    fontWeight: "bold",
  },
  time: {
    color: "gray",
    fontSize: 12,
  },
  title: {
    color: "white",
    marginTop: 4,
  },
  body: {
    color: "#ccc",
    marginTop: 2,
  },
  dismiss: {
    color: "red",
    marginTop: 6,
  },
});
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Category } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getAppIcon(appName: string): any {
  const name = appName.toLowerCase();
  if (name.includes("whatsapp")) return "logo-whatsapp";
  if (name.includes("gmail") || name.includes("mail")) return "mail";
  if (name.includes("twitter") || name.includes("x")) return "logo-twitter";
  if (name.includes("linkedin")) return "logo-linkedin";
  if (name.includes("slack")) return "logo-slack";
  if (name.includes("instagram") || name.includes("ig"))
    return "logo-instagram";
  if (name.includes("facebook") || name.includes("fb")) return "logo-facebook";
  if (name.includes("sms") || name.includes("message") || name.includes("text"))
    return "chatbubble-ellipses";
  if (name.includes("discord")) return "logo-discord";
  return "apps-outline";
}

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

function formatTime(iso: string): string {
  try {
    let dateStr = iso;

    // SQLite databases usually output "YYYY-MM-DD HH:MM:SS" (UTC).
    // We must forcefully convert it to a valid ISO-8601 UTC string by swapping the space for 'T' and adding 'Z'.
    if (dateStr.length === 19 && dateStr.includes(" ")) {
      dateStr = dateStr.replace(" ", "T") + "Z";
    } else if (
      dateStr.includes("T") &&
      !dateStr.endsWith("Z") &&
      !dateStr.includes("+") &&
      !dateStr.includes("-")
    ) {
      // Catch-all: If it has 'T' but no timezone indicator, force it to 'Z' (UTC)
      dateStr += "Z";
    }

    const d = new Date(dateStr);
    const now = new Date();

    let diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) diffMs = 0;

    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "less than a minute ago";
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hours ago`;

    return d.toLocaleDateString();
  } catch {
    return "";
  }
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
      {/* Left Column: Icon Box */}
      <View style={[styles.iconBox, { backgroundColor: C.tint + "15" }]}>
        <Ionicons name={getAppIcon(appName)} size={22} color={C.tint} />
      </View>

      {/* Right Column: Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.row}>
          <Text style={[styles.appName, { color: C.textSecondary }]}>
            {appName.toUpperCase()}
          </Text>
          <Text style={[styles.time, { color: C.textMuted }]}>
            {formatTime(createdAt)}
          </Text>
        </View>

        {/* Title */}
        {title && (
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}

        {/* Body */}
        <Text
          style={[styles.body, { color: C.textSecondary }]}
          numberOfLines={3}
        >
          {body}
        </Text>

        {/* Tags Row */}
        <View style={styles.tagRow}>
          {category === "urgent" && (
            <>
              <View style={[styles.tag, { backgroundColor: C.urgent + "15" }]}>
                <Ionicons
                  name="alert-circle-outline"
                  size={12}
                  color={C.urgent}
                />
                <Text style={[styles.tagText, { color: C.urgent }]}>
                  Urgent
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: C.low + "15" }]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color={C.low}
                />
                <Text style={[styles.tagText, { color: C.low }]}>Allowed</Text>
              </View>
            </>
          )}

          {category === "normal" && (
            <>
              <View style={[styles.tag, { backgroundColor: C.normal + "15" }]}>
                <Ionicons
                  name="help-circle-outline"
                  size={12}
                  color={C.normal}
                />
                <Text style={[styles.tagText, { color: C.normal }]}>
                  Normal
                </Text>
              </View>
              <View
                style={[styles.tag, { backgroundColor: C.textMuted + "15" }]}
              >
                <Ionicons name="time-outline" size={12} color={C.textMuted} />
                <Text style={[styles.tagText, { color: C.textMuted }]}>
                  Delayed
                </Text>
              </View>
            </>
          )}

          {category === "noise" && (
            <View style={[styles.tag, { backgroundColor: C.textMuted + "15" }]}>
              <Ionicons
                name="notifications-off-outline"
                size={12}
                color={C.textMuted}
              />
              <Text style={[styles.tagText, { color: C.textMuted }]}>
                Silenced
              </Text>
            </View>
          )}
        </View>

        {/* AI Reasoning */}
        <Text
          style={[styles.reasoning, { color: C.textMuted }]}
          numberOfLines={1}
        >
          {reasoning
            ? `AI: ${reasoning}`
            : "AI: Classified using Kortex model."}
        </Text>

        {/* Action Buttons */}
        {(onRelease || onDismiss) && (
          <View style={styles.actionFooter}>
            {onRelease && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: C.tint + "40", backgroundColor: C.tint + "10" }]}
                onPress={() => onRelease(id)}
                activeOpacity={0.7}
              >
                <Ionicons name="play-outline" size={14} color={C.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.actionText, { color: C.tint }]}>Release</Text>
              </TouchableOpacity>
            )}

            {onDismiss && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: C.border }]}
                onPress={() => onDismiss(id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: C.textMuted }]}>Dismiss</Text>
              </TouchableOpacity>
            )}
          </View>
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
    marginBottom: 12,
    borderWidth: 1,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },

  actionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  reasoning: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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

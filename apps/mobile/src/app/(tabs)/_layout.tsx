import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View, Text } from "react-native";
import { useAppStore } from "@/store/appStore";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

function TabBadge({
  count,
  backgroundColor,
  textColor,
}: {
  count: number;
  backgroundColor: string;
  textColor: string;
}) {
  if (count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const { themeOverride, stats } = useAppStore();

  const inboxCount = stats.urgent + stats.normal + stats.noise;

  const theme =
    themeOverride === "dark"
      ? Colors.dark
      : themeOverride === "light"
        ? Colors.light
        : systemTheme === "dark"
          ? Colors.dark
          : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => (
            <View>
              <FontAwesome name="envelope" size={24} color={color} />
              <TabBadge
                count={inboxCount}
                backgroundColor={theme.urgent} // Fully dynamic
                textColor={theme.whiteText}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="delayed"
        options={{
          title: "Delayed",
          tabBarIcon: ({ color }) => (
            <View>
              <FontAwesome name="clock-o" size={24} color={color} />
              <TabBadge
                count={stats.delayed}
                backgroundColor={theme.textMuted} // Grey for delayed
                textColor={theme.whiteText}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="gear" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    lineHeight: 12,
  },
});
